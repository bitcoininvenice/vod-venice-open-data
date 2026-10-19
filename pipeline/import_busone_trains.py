#!/usr/bin/env python3
"""
Orario dei treni fra Venezia Santa Lucia e Venezia Mestre dai GTFS statici pubblicati da BusOne:
- Trenitalia: orari nazionali dal NeTEx Trenitalia del Punto di Accesso Nazionale (CCISS), convertiti in GTFS;
- Italo: orari dal NeTEx nazionale convertiti in GTFS.

Condizioni di BusOne (https://proxy.busone.app/#data-terms): gratuiti per privati ed enti senza scopo di lucro per
usi non commerciali, citando BusOne e la fonte originale; il feed Italo è libero anche per uso commerciale.

Per ogni treno che ferma a entrambe le stazioni si salvano numero, categoria, direzione, origine e destinazione,
orari a Santa Lucia e a Mestre e le date di servizio dei prossimi DAYS giorni. Nessun treno inventato: se un feed
non si scarica, il file precedente resta.

Uso: python import_busone_trains.py [--trenitalia gtfs.zip] [--italo gtfs.zip]
Output: web/src/data/trains-venezia.json
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import logging
import os
import sys
import zipfile
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from vod_http import fetch_bytes

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE_DIR, "..", "web", "src", "data", "trains-venezia.json")

FEEDS = {
    "Trenitalia": "https://proxy.busone.app/trenitalia/gtfs.zip",
    "Italo": "https://proxy.busone.app/italo/gtfs.zip",
}
HEADERS = {
    "X-BusOne-Client": "VeniceOpenData (https://github.com/bitcoininvenice/vod-venice-open-data)",
    "X-BusOne-Use": "nonprofit",
}
# codici delle stazioni nei due feed (Trenitalia: codice RFI; Italo: sigla)
STATIONS = {
    "Trenitalia": {"santa_lucia": "02593", "mestre": "02589"},
    "Italo": {"santa_lucia": "VSL", "mestre": "VEM"},
}
DAYS = 21
MIN_TRIPS = 40
ROME = ZoneInfo("Europe/Rome")

# categoria del treno -> tipo usato dalla mappa
TYPES = {
    "FR": "FRECCIAROSSA", "FA": "FRECCIAROSSA", "FB": "FRECCIAROSSA",
    "IC": "INTERCITY", "ICN": "INTERCITY", "EC": "EUROCITY", "EN": "EUROCITY", "RJ": "RAILJET",
}


def secs(t: str) -> int:
    h, m, s = (int(x) for x in t.split(":"))
    return h * 3600 + m * 60 + s


def station_of(stop_id: str, codes: dict[str, str]) -> str | None:
    root = stop_id.split(":")[0]
    for key, code in codes.items():
        if root == code:
            return key
    return None


def platform_of(stop_id: str, stops: dict[str, dict]) -> str | None:
    p = (stops.get(stop_id) or {}).get("platform_code") or ""
    return p.strip() or None


def service_dates(feed: zipfile.ZipFile, start: date, days: int) -> dict[str, list[str]]:
    """service_id -> date YYYYMMDD attive fra start e start + days"""
    window = [start + timedelta(days=i) for i in range(days)]
    active: dict[str, set[str]] = {}
    names = feed.namelist()
    if "calendar.txt" in names:
        for r in csv.DictReader(io.TextIOWrapper(feed.open("calendar.txt"), "utf-8-sig")):
            a, b = r["start_date"], r["end_date"]
            wd = [r["monday"], r["tuesday"], r["wednesday"], r["thursday"], r["friday"], r["saturday"], r["sunday"]]
            for d in window:
                ymd = d.strftime("%Y%m%d")
                if a <= ymd <= b and wd[d.weekday()] == "1":
                    active.setdefault(r["service_id"], set()).add(ymd)
    if "calendar_dates.txt" in names:
        lo, hi = window[0].strftime("%Y%m%d"), window[-1].strftime("%Y%m%d")
        for r in csv.DictReader(io.TextIOWrapper(feed.open("calendar_dates.txt"), "utf-8-sig")):
            if not (lo <= r["date"] <= hi):
                continue
            if r["exception_type"] == "1":
                active.setdefault(r["service_id"], set()).add(r["date"])
            elif r["exception_type"] == "2":
                active.get(r["service_id"], set()).discard(r["date"])
    return {k: sorted(v) for k, v in active.items() if v}


def days_mask(ymds: list[str], start: date) -> str:
    """«1» per ogni giorno di servizio a partire da start (DAYS caratteri): più compatto delle date"""
    on = set(ymds)
    return "".join("1" if (start + timedelta(days=i)).strftime("%Y%m%d") in on else "0" for i in range(DAYS))


def title(s: str) -> str:
    return " ".join(w if len(w) <= 2 and w.isupper() and w not in {"DI", "DA", "AL"} else w.capitalize() for w in s.replace(".", ". ").split()).replace(". ", ".").strip()


def trains_from_feed(operator: str, raw: bytes, start: date) -> list[dict]:
    feed = zipfile.ZipFile(io.BytesIO(raw))
    codes = STATIONS[operator]
    stops = {r["stop_id"]: r for r in csv.DictReader(io.TextIOWrapper(feed.open("stops.txt"), "utf-8-sig"))}
    routes = {r["route_id"]: r for r in csv.DictReader(io.TextIOWrapper(feed.open("routes.txt"), "utf-8-sig"))}
    trips = {r["trip_id"]: r for r in csv.DictReader(io.TextIOWrapper(feed.open("trips.txt"), "utf-8-sig"))}
    # solo treni: niente bus sostitutivi (route_type 3 e 700-799)
    rail = {rid for rid, r in routes.items() if r.get("route_type", "2") in {"2"} or 100 <= int(r.get("route_type") or 0) < 200}
    dates = service_dates(feed, start, DAYS)
    wanted = {tid for tid, t in trips.items() if t["service_id"] in dates and t["route_id"] in rail}

    # per ogni corsa: prima e ultima fermata, passaggi a Santa Lucia e Mestre
    seen: dict[str, dict] = {}
    for r in csv.DictReader(io.TextIOWrapper(feed.open("stop_times.txt"), "utf-8-sig")):
        tid = r["trip_id"]
        if tid not in wanted:
            continue
        info = seen.setdefault(tid, {"first": None, "last": None})
        seq = int(r["stop_sequence"])
        if info["first"] is None or seq < info["first"][0]:
            info["first"] = (seq, r["stop_id"])
        if info["last"] is None or seq > info["last"][0]:
            info["last"] = (seq, r["stop_id"])
        st = station_of(r["stop_id"], codes)
        if st:
            info[st] = (seq, secs(r["arrival_time"]), secs(r["departure_time"]), platform_of(r["stop_id"], stops))

    out = []
    for tid, info in seen.items():
        if "santa_lucia" not in info or "mestre" not in info:
            continue
        sl, me = info["santa_lucia"], info["mestre"]
        outbound = sl[0] < me[0]  # da Santa Lucia verso la terraferma
        dep, arr = (sl[2], me[1]) if outbound else (me[2], sl[1])
        if arr <= dep:
            continue
        trip = trips[tid]
        route = routes.get(trip["route_id"], {})
        cat = (route.get("route_short_name") or "").upper()
        number = trip.get("trip_short_name") or tid
        name = lambda sid: title((stops.get(sid) or stops.get(sid.split(":")[0]) or {}).get("stop_name", ""))  # noqa: E731
        out.append({
            "id": f"{operator[:2].lower()}-{number}-{trip['service_id'][-12:]}",
            "trainNumber": f"Italo {number}" if operator == "Italo" else f"{cat} {number}".strip(),
            "operator": operator,
            "trainType": "ITALO" if operator == "Italo" else TYPES.get(cat, "REGIONALE_VELOCE"),
            "category": cat or None,
            "direction": "OUTBOUND" if outbound else "INBOUND",
            "origin": name(info["first"][1]),
            "destination": title(trip.get("trip_headsign") or "") or name(info["last"][1]),
            "departureSeconds": dep,
            "arrivalSeconds": arr,
            "platform": sl[3],
            "days": days_mask(dates[trip["service_id"]], start),
        })
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description="Orario dei treni Venezia Santa Lucia - Mestre (BusOne)")
    ap.add_argument("--trenitalia", help="gtfs.zip di Trenitalia già scaricato")
    ap.add_argument("--italo", help="gtfs.zip di Italo già scaricato")
    args = ap.parse_args()
    start = datetime.now(ROME).date() - timedelta(days=1)
    trains: list[dict] = []
    for operator, url in FEEDS.items():
        local = getattr(args, operator.lower())
        try:
            raw = open(local, "rb").read() if local else fetch_bytes(url, headers=HEADERS, timeout=300, retries=3, backoff=60)
            found = trains_from_feed(operator, raw, start)
        except Exception as exc:  # noqa: BLE001 - un feed mancante lascia il file precedente
            logging.error("%s: orario non letto (%s), il file esistente non viene sovrascritto", operator, exc)
            return 1
        logging.info("%s: %d treni fra Santa Lucia e Mestre", operator, len(found))
        trains += found
    if len(trains) < MIN_TRIPS:
        logging.error("Solo %d treni: risposta incompleta, il file esistente non viene sovrascritto", len(trains))
        return 1
    trains.sort(key=lambda t: (t["departureSeconds"], t["trainNumber"]))
    data = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "BusOne – GTFS Trenitalia (NeTEx del Punto di Accesso Nazionale) e Italo",
        "sourceUrl": "https://proxy.busone.app/",
        "license": "Condizioni BusOne: uso non commerciale e non profit, citando BusOne e la fonte originale",
        "attribution": "Orari: Trenitalia (NeTEx, Punto di Accesso Nazionale) e Italo, elaborati da BusOne",
        "timezone": "Europe/Rome",
        "startDate": start.strftime("%Y%m%d"),
        "note": "Treni che fermano sia a Venezia Santa Lucia sia a Venezia Mestre; orari in secondi dalla mezzanotte locale della data di servizio; days: un carattere per giorno da startDate, 1 = in servizio.",
        "count": len(trains),
        "trains": trains,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    logging.info("Treni: %d -> %s", len(trains), OUT)
    return 0


if __name__ == "__main__":
    sys.exit(main())
