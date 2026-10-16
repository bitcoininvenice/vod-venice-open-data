#!/usr/bin/env python3
"""
Distributori di carburante dell'area della mappa da OpenStreetMap (ODbL), per il livello Carburanti quando i prezzi
del Ministero non sono raggiungibili: marchio, indirizzo, carburanti venduti, orari, distributori per barche e
codice dell'impianto del Ministero (ref:mise) per collegarli ai prezzi. Mai il campo «operator» (spesso il nome
del gestore, una persona).

Uso: python import_osm_fuel.py [--file risposta_overpass.json]
Output: web/src/data/osm-fuel.json
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from datetime import datetime, timezone

from vod_http import overpass

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE_DIR, "..", "web", "src", "data", "osm-fuel.json")

# Riquadro della mappa (sud, ovest, nord, est), lo stesso di web/src/lib/simulation-data.ts
BBOX = (45.205, 12.135, 45.555, 12.47)
QUERY = f"""[out:json][timeout:90];
nwr["amenity"="fuel"]({BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]});
out tags center;"""

# Sotto questa soglia la risposta di Overpass è incompleta: non si sovrascrive il file
MIN_STATIONS = 60

# Carburanti di OSM (fuel:*=yes) con il nome usato dal Ministero e nella scheda
FUELS = {
    "fuel:octane_95": "Benzina",
    "fuel:octane_98": "Benzina 98",
    "fuel:octane_100": "Benzina 100",
    "fuel:diesel": "Gasolio",
    "fuel:GTL_diesel": "Gasolio premium",
    "fuel:HGV_diesel": "Gasolio per mezzi pesanti",
    "fuel:HVO100": "HVO",
    "fuel:lpg": "GPL",
    "fuel:cng": "Metano",
    "fuel:lng": "GNL",
    "fuel:LH2": "Idrogeno",
    "fuel:adblue": "AdBlue",
}


def station(el: dict) -> dict | None:
    tags = el.get("tags", {})
    lat = el.get("lat") or (el.get("center") or {}).get("lat")
    lon = el.get("lon") or (el.get("center") or {}).get("lon")
    if lat is None or lon is None:
        return None
    street = tags.get("addr:street")
    address = " ".join(x for x in (street, tags.get("addr:housenumber")) if x) if street else None
    return {
        "id": f"osm-{el['type']}-{el['id']}",
        "osmUrl": f"https://www.openstreetmap.org/{el['type']}/{el['id']}",
        "lat": round(lat, 6),
        "lon": round(lon, 6),
        # il marchio; il nome solo se manca (il gestore non si usa mai)
        "brand": tags.get("brand") or tags.get("name"),
        "address": address,
        "comune": (tags.get("addr:city") or "").upper() or None,
        "boat": tags.get("boat") == "yes" or tags.get("waterway") == "fuel",
        "fuels": [label for key, label in FUELS.items() if tags.get(key) == "yes"],
        "selfService": {"yes": True, "no": False}.get(tags.get("self_service", "")),
        "openingHours": tags.get("opening_hours"),
        "mimitId": tags.get("ref:mise"),
    }


def build(payload: dict) -> dict:
    stations = [s for s in (station(e) for e in payload.get("elements", [])) if s]
    if len(stations) < MIN_STATIONS:
        raise ValueError(f"risposta incompleta: {len(stations)} distributori")
    stations.sort(key=lambda s: (-s["lat"], s["lon"]))
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "OpenStreetMap contributors",
        "sourceUrl": "https://www.openstreetmap.org/copyright",
        "license": "ODbL 1.0",
        "attribution": "© OpenStreetMap contributors",
        "note": "Distributori (amenity=fuel) nell'area della mappa: marchio, indirizzo, carburanti, orari, distributori per barche. Senza prezzi e senza il nome del gestore.",
        "count": len(stations),
        "stations": stations,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("--file", help="risposta Overpass salvata (JSON)")
    args = ap.parse_args()
    payload = json.load(open(args.file, encoding="utf-8")) if args.file else overpass(QUERY, timeout=120, rounds=3)
    try:
        data = build(payload)
    except ValueError as e:
        logging.error("%s: il file esistente non viene sovrascritto", e)
        return 1
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    logging.info("Distributori OSM: %d -> %s", data["count"], OUT)
    return 0


if __name__ == "__main__":
    sys.exit(main())
