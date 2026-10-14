"""
VOD - Venice Open Data
Corse FlixBus che passano per Venezia (Tronchetto, Mestre, Aeroporto) dal GTFS europeo ufficiale di FlixMobility.

Il feed è solo un orario (nessuna posizione in tempo reale): VOD simula la posizione dei bus lungo il
percorso stradale del feed, come per Alilaguna. Per ogni corsa si tiene il tratto tra la fermata
precedente all'ingresso nell'area della mappa e quella successiva all'uscita, ritagliato sull'area.

Orari: il feed dichiara agency_timezone UTC; per ogni data di servizio si salvano istanti assoluti
(secondi Unix), così l'ora legale non va gestita nel sito.

Licenza: ODbL 1.0 (transport.data.gouv.fr) – © FlixMobility. I dati estratti restano sotto ODbL.
Uso: python import_flixbus.py [--file gtfs.zip] [--days 10]
"""

import argparse
import csv
import io
import json
import logging
import math
import os
import sys
import zipfile
from datetime import date, datetime, timedelta, timezone

from vod_http import fetch_bytes

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "flixbus-venezia.json")
FEED_URL = "http://gtfs.gis.flix.tech/gtfs_generic_eu.zip"
LICENSE_URL = "https://transport.data.gouv.fr/datasets/flixbus-horaires-theoriques-du-reseau-europeen-1"

# Area della mappa (lon0, lon1, lat0, lat1) e margine per il percorso ritagliato (gradi, ~10 km)
FRAME = (12.135, 12.47, 45.205, 45.555)
MARGIN = 0.12
# Sotto questa soglia il feed è considerato incompleto e il file non viene sovrascritto
MIN_TRIPS = 20
SIMPLIFY_M = 25


def rows(zf: zipfile.ZipFile, name: str):
    return csv.DictReader(io.TextIOWrapper(zf.open(name), "utf-8-sig"))


def in_frame(lon: float, lat: float, margin: float = 0.0) -> bool:
    return FRAME[0] - margin <= lon <= FRAME[1] + margin and FRAME[2] - margin <= lat <= FRAME[3] + margin


def dist_m(a, b) -> float:
    k = math.cos(math.radians((a[1] + b[1]) / 2)) * 111320
    return math.hypot((a[0] - b[0]) * k, (a[1] - b[1]) * 110540)


def gtfs_seconds(value: str) -> int:
    h, m, s = (int(x) for x in value.split(":"))
    return h * 3600 + m * 60 + s


def cumulative(points):
    out = [0.0]
    for i in range(1, len(points)):
        out.append(out[-1] + dist_m(points[i - 1], points[i]))
    return out


def project(points, cum, p, after: float = 0.0) -> float:
    """Distanza lungo il percorso del punto più vicino a p, non prima di `after` (fermate in ordine)."""
    best_d, best_s = math.inf, after
    k = math.cos(math.radians(p[1])) * 111320
    for i in range(len(points) - 1):
        if cum[i + 1] < after:
            continue
        ax, ay = points[i][0] * k, points[i][1] * 110540
        bx, by = points[i + 1][0] * k, points[i + 1][1] * 110540
        px, py = p[0] * k, p[1] * 110540
        dx, dy = bx - ax, by - ay
        L2 = dx * dx + dy * dy
        t = 0.0 if L2 == 0 else max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / L2))
        d = math.hypot(px - (ax + t * dx), py - (ay + t * dy))
        if d < best_d:
            best_d, best_s = d, max(after, cum[i] + t * (cum[i + 1] - cum[i]))
    return best_s


def simplify(points, tol_m: float):
    """Douglas-Peucker su coordinate locali (metri)."""
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        a, b = stack.pop()
        best, idx = 0.0, -1
        for i in range(a + 1, b):
            ax, ay = points[a]
            bx, by = points[b]
            px, py = points[i]
            k = math.cos(math.radians(py)) * 111320
            dx, dy = (bx - ax) * k, (by - ay) * 110540
            L = math.hypot(dx, dy) or 1e-9
            d = abs(dx * (ay - py) * 110540 - (ax - px) * k * dy) / L
            if d > best:
                best, idx = d, i
        if best > tol_m:
            keep[idx] = True
            stack += [(a, idx), (idx, b)]
    return [p for p, k in zip(points, keep) if k]


def service_dates(service_id: str, calendar: dict, exceptions: dict, start: date, days: int) -> list[str]:
    out = []
    names = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")
    for n in range(days):
        d = start + timedelta(days=n)
        ymd = d.strftime("%Y%m%d")
        c = calendar.get(service_id)
        active = bool(c) and c["start_date"] <= ymd <= c["end_date"] and c[names[d.weekday()]] == "1"
        exc = exceptions.get(service_id, {}).get(ymd)
        if exc is not None:
            active = exc == "1"
        if active:
            out.append(ymd)
    return out


def clip_window(points, cum, d0: float, d1: float):
    """Punti del percorso tra d0 e d1 e dentro l'area allargata, con la distanza progressiva di ciascuno."""
    out = []
    for p, c in zip(points, cum):
        if d0 <= c <= d1 and in_frame(p[0], p[1], MARGIN):
            out.append((p, c))
    return out


def build(zf: zipfile.ZipFile, start: date, days: int) -> dict:
    stops = {r["stop_id"]: r for r in rows(zf, "stops.txt")}
    venice = {sid for sid, s in stops.items() if in_frame(float(s["stop_lon"]), float(s["stop_lat"]))}
    by_trip: dict[str, list] = {}
    for r in rows(zf, "stop_times.txt"):
        by_trip.setdefault(r["trip_id"], []).append(r)
    touching = {t: sorted(l, key=lambda x: int(x["stop_sequence"])) for t, l in by_trip.items() if any(x["stop_id"] in venice for x in l)}
    del by_trip
    trips = {r["trip_id"]: r for r in rows(zf, "trips.txt") if r["trip_id"] in touching}
    routes = {r["route_id"]: r for r in rows(zf, "routes.txt")}
    calendar = {r["service_id"]: r for r in rows(zf, "calendar.txt")}
    exceptions: dict[str, dict] = {}
    for r in rows(zf, "calendar_dates.txt"):
        exceptions.setdefault(r["service_id"], {})[r["date"]] = r["exception_type"]
    needed = {t["shape_id"] for t in trips.values() if t.get("shape_id")}
    raw_shapes: dict[str, list] = {}
    for r in rows(zf, "shapes.txt"):
        if r["shape_id"] in needed:
            raw_shapes.setdefault(r["shape_id"], []).append((int(r["shape_pt_sequence"]), float(r["shape_pt_lon"]), float(r["shape_pt_lat"])))

    out_trips, out_shapes, shape_index = [], [], {}
    for tid, seq in touching.items():
        trip = trips.get(tid)
        if not trip:
            continue
        dates = service_dates(trip["service_id"], calendar, exceptions, start, days)
        if not dates:
            continue
        first = next(i for i, x in enumerate(seq) if x["stop_id"] in venice)
        last = max(i for i, x in enumerate(seq) if x["stop_id"] in venice)
        lo, hi = max(0, first - 1), min(len(seq) - 1, last + 1)
        window = seq[lo:hi + 1]
        pts_raw = sorted(raw_shapes.get(trip.get("shape_id", ""), []))
        points = [(lon, lat) for _, lon, lat in pts_raw] or [(float(stops[x["stop_id"]]["stop_lon"]), float(stops[x["stop_id"]]["stop_lat"])) for x in seq]
        cum = cumulative(points)
        knots, after = [], 0.0
        for x in seq:
            s = stops[x["stop_id"]]
            d = project(points, cum, (float(s["stop_lon"]), float(s["stop_lat"])), after)
            after = d
            if x in window:
                knots.append([round(d), gtfs_seconds(x["arrival_time"]), gtfs_seconds(x["departure_time"]), s["stop_name"].strip(), x["stop_id"] in venice])
        clipped = clip_window(points, cum, knots[0][0], knots[-1][0])
        if len(clipped) < 2:
            continue
        simple = simplify([p for p, _ in clipped], SIMPLIFY_M)
        keep = {id(p) for p in simple}
        poly = [[round(p[0], 5), round(p[1], 5), round(c)] for p, c in clipped if id(p) in keep]
        key = json.dumps(poly)
        if key not in shape_index:
            shape_index[key] = len(out_shapes)
            out_shapes.append(poly)
        route = routes.get(trip["route_id"], {})
        out_trips.append({
            "id": tid,
            "line": (route.get("route_short_name") or "").replace("FlixBus", "").strip() or trip["route_id"],
            "name": route.get("route_long_name", "").strip(),
            "from": stops[seq[0]["stop_id"]]["stop_name"].strip(),
            "to": stops[seq[-1]["stop_id"]]["stop_name"].strip(),
            # partenza dal capolinea e arrivo a destinazione (s UTC dalla mezzanotte della data)
            "start": gtfs_seconds(seq[0]["departure_time"]),
            "end": gtfs_seconds(seq[-1]["arrival_time"]),
            "dates": dates,
            "shape": shape_index[key],
            # [distanza sul percorso (m), arrivo (s UTC dalla mezzanotte della data), partenza, fermata, fermata veneziana]
            "stops": knots,
        })
    out_trips.sort(key=lambda t: (t["stops"][0][2], t["id"]))
    return {"trips": out_trips, "shapes": out_shapes}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", help="GTFS FlixBus già scaricato (zip)")
    parser.add_argument("--days", type=int, default=10, help="giorni di servizio da includere (da ieri)")
    args = parser.parse_args()
    try:
        data = open(args.file, "rb").read() if args.file else fetch_bytes(FEED_URL, timeout=180)
        zf = zipfile.ZipFile(io.BytesIO(data))
    except Exception as e:  # noqa: BLE001
        logging.error("Feed FlixBus non disponibile: %s", e)
        return 1
    start = datetime.now(timezone.utc).date() - timedelta(days=1)
    result = build(zf, start, args.days)
    if len(result["trips"]) < MIN_TRIPS:
        logging.error("Corse FlixBus incomplete (%d): file non aggiornato", len(result["trips"]))
        return 1
    out = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "FlixMobility – GTFS europeo FlixBus",
        "sourceUrl": FEED_URL,
        "license": "ODbL 1.0",
        "licenseUrl": LICENSE_URL,
        "attribution": "© FlixMobility (FlixBus), ODbL",
        "timezone": "UTC",
        "note": "Orari teorici; posizione dei bus simulata lungo il percorso del feed, non GPS. Solo le corse che toccano l'area della mappa, ritagliate su di essa.",
        "trips": result["trips"],
        "shapes": result["shapes"],
    }
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    logging.info("FlixBus: %d corse, %d percorsi, %d KB", len(out["trips"]), len(out["shapes"]), os.path.getsize(OUT_FILE) // 1024)
    return 0


if __name__ == "__main__":
    sys.exit(main())
