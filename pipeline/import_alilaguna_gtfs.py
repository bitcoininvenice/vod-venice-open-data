#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: orari ufficiali Alilaguna dal feed GTFS pubblicato dall'operatore
(https://www.alilaguna.it/attuale/alilaguna.zip, registrato su Transitland come f-u20f-alilagunaspa).

Output: web/src/data/alilaguna-gtfs.json (letto da web/src/lib/alilaguna-schedule.ts), con
fermate, linee, percorsi e corse (orari in secondi dalla mezzanotte, distanza progressiva di
ogni fermata lungo il percorso) per simulare la posizione delle barche dall'orario.

Licenza: il feed non dichiara una licenza; va citata la fonte (Alilaguna S.p.A.).
Uso: python import_alilaguna_gtfs.py [percorso_zip_locale]
"""

import csv
import io
import json
import logging
import math
import os
import sys
import urllib.request
import zipfile
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "alilaguna-gtfs.json")
FEED_URL = "https://www.alilaguna.it/attuale/alilaguna.zip"

# Codici linea usati dall'interfaccia (route_long_name -> lineCode)
LINE_CODES = {"BLU": "BLU", "ARANCIO": "ARANCIO", "ROSSA": "ROSSA", "VERDE": "VERDE"}


def haversine(lon1, lat1, lon2, lat2):
    r = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def gtfs_seconds(value: str) -> int:
    h, m, s = (int(x) for x in value.strip().split(":"))
    return h * 3600 + m * 60 + s


def read_table(zf: zipfile.ZipFile, name: str):
    with zf.open(name) as fh:
        return list(csv.DictReader(io.TextIOWrapper(fh, encoding="utf-8-sig")))


def cumulative(shape):
    dist = [0.0]
    for (lo1, la1), (lo2, la2) in zip(shape, shape[1:]):
        dist.append(dist[-1] + haversine(lo1, la1, lo2, la2))
    return dist


def project_on_shape(shape, cum, lon, lat, min_dist):
    """Distanza progressiva del punto del percorso più vicino alla fermata, non prima di min_dist."""
    best, best_d = None, float("inf")
    for i, (lo, la) in enumerate(shape):
        if cum[i] + 1e-6 < min_dist:
            continue
        d = haversine(lo, la, lon, lat)
        if d < best_d:
            best, best_d = cum[i], d
    return best if best is not None else min_dist


def load_zip(path):
    if path:
        return zipfile.ZipFile(path)
    req = urllib.request.Request(FEED_URL, headers={"User-Agent": "VOD-VeniceOpenData/1.0 (pipeline)"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return zipfile.ZipFile(io.BytesIO(resp.read()))


def main() -> int:
    try:
        zf = load_zip(sys.argv[1] if len(sys.argv) > 1 else None)
    except Exception as e:
        logging.error("Download GTFS Alilaguna fallito: %s", e)
        return 1

    feed_info = read_table(zf, "feed_info.txt")[0]
    stops = {s["stop_id"]: s for s in read_table(zf, "stops.txt")}
    routes = read_table(zf, "routes.txt")
    trips = read_table(zf, "trips.txt")
    calendar = read_table(zf, "calendar.txt")
    shapes_rows = read_table(zf, "shapes.txt")
    stop_times = read_table(zf, "stop_times.txt")

    shapes = {}
    for r in sorted(shapes_rows, key=lambda r: (r["shape_id"], int(r["shape_pt_sequence"]))):
        shapes.setdefault(r["shape_id"], []).append([round(float(r["shape_pt_lon"]), 6), round(float(r["shape_pt_lat"]), 6)])
    shape_cum = {k: cumulative(v) for k, v in shapes.items()}

    by_trip = {}
    for st in stop_times:
        by_trip.setdefault(st["trip_id"], []).append(st)

    stop_ids = sorted({st["stop_id"] for st in stop_times})
    stop_index = {sid: i for i, sid in enumerate(stop_ids)}

    out_trips = []
    for t in trips:
        rows = sorted(by_trip.get(t["trip_id"], []), key=lambda r: int(r["stop_sequence"]))
        if len(rows) < 2:
            continue
        shape = shapes.get(t.get("shape_id", ""))
        cum = shape_cum.get(t.get("shape_id", ""))
        seq, last = [], 0.0
        for r in rows:
            s = stops[r["stop_id"]]
            dist = project_on_shape(shape, cum, float(s["stop_lon"]), float(s["stop_lat"]), last) if shape else 0.0
            last = dist
            seq.append([stop_index[r["stop_id"]], gtfs_seconds(r["arrival_time"]), gtfs_seconds(r["departure_time"]), round(dist)])
        out_trips.append({
            "id": t["trip_id"],
            "route": t["route_id"],
            "service": t["service_id"],
            "headsign": t.get("trip_headsign", ""),
            "shape": t.get("shape_id", ""),
            "stops": seq,
        })

    out = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "Alilaguna S.p.A. – GTFS (f-u20f-alilagunaspa)",
        "sourceUrl": FEED_URL,
        "license": "Non dichiarata nel feed: citare la fonte Alilaguna S.p.A.",
        "feedVersion": feed_info.get("feed_version"),
        "validFrom": feed_info.get("feed_start_date"),
        "validTo": feed_info.get("feed_end_date"),
        "calendar": [
            {k: c[k] for k in ("service_id", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "start_date", "end_date")}
            for c in calendar
        ],
        "routes": [
            {
                "id": r["route_id"],
                "lineCode": LINE_CODES.get(r["route_long_name"].strip().upper(), r["route_long_name"].strip().upper()),
                "name": f"Linea {r['route_long_name'].strip().capitalize()}",
                "color": f"#{r.get('route_color') or '0055a5'}",
                "description": r.get("route_desc", ""),
                "url": r.get("route_url", ""),
            }
            for r in routes
        ],
        "stops": [
            {"id": sid, "name": stops[sid]["stop_name"].strip(), "lat": round(float(stops[sid]["stop_lat"]), 6), "lon": round(float(stops[sid]["stop_lon"]), 6)}
            for sid in stop_ids
        ],
        "shapes": shapes,
        "trips": out_trips,
    }
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    logging.info("Alilaguna: %d linee, %d fermate, %d corse (versione %s, valida %s-%s)",
                 len(out["routes"]), len(out["stops"]), len(out_trips), out["feedVersion"], out["validFrom"], out["validTo"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
