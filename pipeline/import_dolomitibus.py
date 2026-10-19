#!/usr/bin/env python3
"""
Orario della linea 72 Dolomiti Bus (Venezia – Cortina) dal PDF ufficiale pubblicato su dolomitibus.it.

Dolomiti Bus non pubblica un GTFS né una licenza: il PDF è l'orario ufficiale al pubblico, citato con link alla
fonte. Lo script, una volta al giorno:
1. apre la pagina delle linee extraurbane e trova il PDF della linea 72 (il nome cambia con la stagione);
2. lo scarica solo se è cambiato (hash) o se il file attuale copre meno di MIN_AHEAD_DAYS giorni;
3. legge la tabella (fermate e orari per colonna), il periodo «VALIDO DAL», i giorni («LUNEDÌ - DOMENICA») e i
   giorni senza servizio («Nessun servizio il 25 dicembre»);
4. controlla che gli orari di ogni corsa siano in ordine: un orario fuori sequenza nel PDF (refusi capitano) viene
   scartato e segnalato, mai corretto a mano;
5. scrive le corse nello stesso formato di FlixBus (secondi UTC dalla mezzanotte della data, date UTC) per i
   prossimi DAYS giorni. Se qualcosa non torna il file precedente resta.

Coordinate delle fermate da OpenStreetMap (Nominatim, 19/10/2026); percorso stradale fra le fermate dal router OSRM
(OpenStreetMap). Dentro la mappa la linea fa Piazzale Roma – Mestre FS – Aeroporto; fuori si mostra solo l'orario.

Uso: python import_dolomitibus.py [--pdf orario.pdf] [--force]
Output: web/src/data/dolomitibus-venezia.json
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import logging
import os
import re
import sys
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from coach_common import road_shape, utc_trips
from vod_http import fetch_bytes, fetch_text

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE_DIR, "..", "web", "src", "data", "dolomitibus-venezia.json")

SITE = "https://dolomitibus.it"
LINES_PAGE = f"{SITE}/it/linee-extraurbane-invernale-2026"
# la pagina della stagione cambia nome: si cerca anche nella home
HOME = f"{SITE}/"
PDF_RE = re.compile(r'href="([^"]*Linea72[^"]*\.pdf)"', re.I)
DAYS = 60
MIN_AHEAD_DAYS = 30
ROME = ZoneInfo("Europe/Rome")

# fermata nel PDF -> (nome mostrato, lat, lon, fermata dentro l'area della mappa)
STOPS = {
    "Venezia P.le Roma": ("Venezia (Piazzale Roma)", 45.438007, 12.318851, True),
    "Mestre FS": ("Mestre (Stazione FS)", 45.482517, 12.232840, True),
    "Venezia Aeroporto": ("Aeroporto Marco Polo", 45.504439, 12.339083, True),
    "Treviso Silea via Arma di Cavalleria": ("Treviso (Silea, via Arma di Cavalleria)", 45.652022, 12.305632, False),
    "Longarone FS": ("Longarone FS", 46.268302, 12.238579, False),
    "Calalzo FS": ("Calalzo FS", 46.443940, 12.388554, False),
    "Tai P.le Olimpico": ("Tai di Cadore (P.le Olimpico)", 46.423003, 12.358912, False),
    "Valle di Cadore Centro": ("Valle di Cadore", 46.401519, 12.285371, False),
    "Venas Centro": ("Venas di Cadore", 46.409903, 12.299112, False),
    "Peaio": ("Peaio", 46.414660, 12.259361, False),
    "Vodo di Cadore Municipio": ("Vodo di Cadore (Municipio)", 46.418129, 12.250450, False),
    "Borca Centro": ("Borca di Cadore", 46.436423, 12.219598, False),
    "San Vito Centro": ("San Vito di Cadore", 46.476412, 12.207878, False),
    "Cortina Scuole": ("Cortina d'Ampezzo (Scuole)", 46.535429, 12.138174, False),
}
WEEKDAYS = {"LUNEDÌ": 0, "MARTEDÌ": 1, "MERCOLEDÌ": 2, "GIOVEDÌ": 3, "VENERDÌ": 4, "SABATO": 5, "DOMENICA": 6}
MONTHS = {"gennaio": 1, "febbraio": 2, "marzo": 3, "aprile": 4, "maggio": 5, "giugno": 6, "luglio": 7, "agosto": 8,
          "settembre": 9, "ottobre": 10, "novembre": 11, "dicembre": 12}


def find_pdf_url() -> str:
    for page in (LINES_PAGE, HOME):
        try:
            m = PDF_RE.search(fetch_text(page, timeout=30))
        except Exception as exc:  # noqa: BLE001 - si prova la pagina successiva
            logging.warning("%s non letta: %s", page, exc)
            continue
        if m:
            href = m.group(1).replace(" ", "%20")
            return href if href.startswith("http") else SITE + href
    raise RuntimeError("PDF della linea 72 non trovato sul sito")


def pdf_text(raw: bytes) -> list[str]:
    from pypdf import PdfReader  # dipendenza solo di questa pipeline

    return [p.extract_text() or "" for p in PdfReader(io.BytesIO(raw)).pages]


def parse_page(text: str) -> dict:
    """Una pagina = una direzione: fermate in ordine con gli orari di ogni colonna (corsa)."""
    rows: list[tuple[str, list[str]]] = []
    for line in text.splitlines():
        # a volte il PDF non mette lo spazio fra il nome e il primo orario
        m = re.match(r"^(.*?)\s*((?:\d{2}:\d{2}\s*)+)$", line.strip())
        if m and m.group(1).strip() in STOPS:
            rows.append((m.group(1).strip(), re.findall(r"\d{2}:\d{2}", m.group(2))))
    if len(rows) < 3:
        raise ValueError("tabella degli orari non riconosciuta")
    cols = {len(times) for _, times in rows}
    if len(cols) != 1:
        raise ValueError(f"colonne irregolari: {sorted(cols)}")
    valid = re.search(r"VALIDO DAL (\d{2})/(\d{2})/(\d{4})", text)
    until = re.search(r"(?:FINO AL|VALIDO AL) (\d{2})/(\d{2})/(\d{4})", text)
    days_m = re.search(r"(LUNEDÌ|MARTEDÌ|MERCOLEDÌ|GIOVEDÌ|VENERDÌ|SABATO|DOMENICA)\s*-\s*(LUNEDÌ|MARTEDÌ|MERCOLEDÌ|GIOVEDÌ|VENERDÌ|SABATO|DOMENICA)", text)
    if not valid or not days_m:
        raise ValueError("periodo di validità o giorni di servizio non trovati")
    a, b = WEEKDAYS[days_m.group(1)], WEEKDAYS[days_m.group(2)]
    weekdays = list(range(a, b + 1)) if a <= b else list(range(a, 7)) + list(range(0, b + 1))
    closed = [(int(d), MONTHS[mo.lower()]) for d, mo in re.findall(r"Nessun servizio il (\d{1,2}) (\w+)", text, re.I) if mo.lower() in MONTHS]
    end = None
    if until:
        g = [x for x in until.groups() if x]
        end = date(int(g[2]), int(g[1]), int(g[0]))
    return {
        "rows": rows,
        "validFrom": date(int(valid.group(3)), int(valid.group(2)), int(valid.group(1))),
        "validTo": end,
        "weekdays": weekdays,
        "closed": closed,
    }


def secs(hhmm: str) -> int:
    h, m = hhmm.split(":")
    return int(h) * 3600 + int(m) * 60


def trips_of(page: dict) -> tuple[list[dict], list[str]]:
    """Corse della pagina con gli orari in sequenza; gli orari fuori sequenza si scartano e si segnalano."""
    rows = page["rows"]
    trips, warnings = [], []
    for c in range(len(rows[0][1])):
        stops, last = [], -1
        for name, times in rows:
            t = secs(times[c])
            if t < last:
                warnings.append(f"{name} {times[c]} fuori sequenza nella corsa delle {rows[0][1][c]}: scartato")
                continue
            stops.append((name, t))
            last = t
        trips.append({"stops": stops})
    return trips, warnings


def build(pages: list[dict], start: date, pdf_url: str, pdf_hash: str) -> tuple[dict, list[str]]:
    shapes, trips, warnings = [], [], []
    for page in pages:
        names = [n for n, _ in page["rows"]]
        shape, dist = road_shape([(STOPS[n][1], STOPS[n][2]) for n in names])
        shapes.append(shape)
        dist_of = dict(zip(names, dist))
        page_trips, w = trips_of(page)
        warnings += w
        dates = [
            d for d in (start + timedelta(days=i) for i in range(DAYS))
            if d >= page["validFrom"] and not (page["validTo"] and d > page["validTo"])
            and d.weekday() in page["weekdays"] and (d.day, d.month) not in page["closed"]
        ]
        for t in page_trips:
            first, last = t["stops"][0], t["stops"][-1]
            base = {
                "id": f"dolomiti-72-{first[1] // 60:04d}-{'v' if first[0].startswith('Venezia') else 'c'}",
                "line": "72",
                "name": f"Linea 72: {STOPS[first[0]][0]} → {STOPS[last[0]][0]}",
                "from": STOPS[first[0]][0],
                "to": STOPS[last[0]][0],
                "shape": len(shapes) - 1,
            }
            trips += utc_trips(base, [(dist_of[n], STOPS[n][0], STOPS[n][3], s) for n, s in t["stops"]], dates)
    if not trips:
        raise ValueError("nessuna corsa nel periodo")
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "Dolomiti Bus S.p.A. – orario ufficiale della linea 72 (PDF)",
        "sourceUrl": pdf_url,
        "license": "Nessuna licenza dichiarata: orario pubblico citato con link alla fonte",
        "attribution": "Orario Dolomiti Bus S.p.A. (dolomitibus.it); fermate e percorso © OpenStreetMap contributors (OSRM)",
        "timezone": "UTC",
        "pdfSha256": pdf_hash,
        "validFrom": min(p["validFrom"] for p in pages).isoformat(),
        "bookingRequired": True,
        "warnings": warnings,
        "note": "Servizio a prenotazione obbligatoria (cortinaexpress.it). Orari in secondi UTC dalla mezzanotte UTC della data; posizioni previste dall'orario lungo il percorso stradale, non GPS.",
        "trips": trips,
        "shapes": shapes,
    }, warnings


def main() -> int:
    ap = argparse.ArgumentParser(description="Orario Dolomiti Bus linea 72 dal PDF ufficiale")
    ap.add_argument("--pdf", help="PDF già scaricato")
    ap.add_argument("--force", action="store_true", help="riscrive il file anche se il PDF non è cambiato")
    args = ap.parse_args()
    start = datetime.now(ROME).date() - timedelta(days=1)
    try:
        url = "file://" + os.path.abspath(args.pdf) if args.pdf else find_pdf_url()
        raw = open(args.pdf, "rb").read() if args.pdf else fetch_bytes(url, timeout=60, retries=2)
        digest = hashlib.sha256(raw).hexdigest()
        current = json.load(open(OUT, encoding="utf-8")) if os.path.exists(OUT) else {}
        last_date = max((d for t in current.get("trips", []) for d in t.get("dates", [])), default="")
        covered = last_date >= (start + timedelta(days=MIN_AHEAD_DAYS)).strftime("%Y%m%d")
        if not args.force and current.get("pdfSha256") == digest and covered:
            logging.info("Orario invariato (PDF uguale, date coperte fino al %s)", last_date)
            return 0
        pages = [parse_page(t) for t in pdf_text(raw) if "LINEA 72" in t]
        if not pages:
            raise ValueError("nessuna pagina della linea 72 nel PDF")
        data, warnings = build(pages, start, url if not args.pdf else f"{SITE}/it/linee-extraurbane-invernale-2026", digest)
    except Exception as exc:  # noqa: BLE001 - qualsiasi errore lascia il file precedente
        logging.error("Orario Dolomiti Bus non aggiornato: %s", exc)
        return 1
    for w in warnings:
        logging.warning(w)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    logging.info("Dolomiti Bus: %d corse -> %s", len(data["trips"]), OUT)
    return 0


if __name__ == "__main__":
    sys.exit(main())
