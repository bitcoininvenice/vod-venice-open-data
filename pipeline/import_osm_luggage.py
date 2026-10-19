#!/usr/bin/env python3
"""
Depositi bagagli dell'area della mappa da OpenStreetMap (ODbL): depositi custoditi (amenity=left_luggage) e
armadietti (amenity=luggage_locker), con nome, orari e pagamenti se mappati. Mai il campo «operator» (può essere
il nome di una persona). Prezzi e valutazioni non sono dati aperti: non si riportano.

Uso: python import_osm_luggage.py [--file risposta_overpass.json]
Output: web/src/data/luggage-storage-venezia.json
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
OUT = os.path.join(BASE_DIR, "..", "web", "src", "data", "luggage-storage-venezia.json")

BBOX = (45.205, 12.135, 45.555, 12.47)
QUERY = f"""[out:json][timeout:90];
(nwr["amenity"="left_luggage"]({BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]});
 nwr["amenity"="luggage_locker"]({BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]}););
out tags center;"""
# in OSM sono pochi: sotto questa soglia la risposta è sicuramente incompleta
MIN_SPOTS = 3
PAYMENTS = {"payment:cash": "cash", "payment:credit_cards": "cards", "payment:debit_cards": "cards", "payment:contactless": "cards"}


def spot(el: dict) -> dict | None:
    tags = el.get("tags", {})
    lat = el.get("lat") or (el.get("center") or {}).get("lat")
    lon = el.get("lon") or (el.get("center") or {}).get("lon")
    if lat is None or lon is None:
        return None
    street = tags.get("addr:street")
    return {
        "id": f"osm-{el['type']}-{el['id']}",
        "osmUrl": f"https://www.openstreetmap.org/{el['type']}/{el['id']}",
        "lat": round(lat, 6),
        "lon": round(lon, 6),
        "type": "locker" if tags.get("amenity") == "luggage_locker" else "staffed",
        "name": tags.get("name") or tags.get("brand"),
        "address": " ".join(x for x in (street, tags.get("addr:housenumber")) if x) if street else None,
        "openingHours": tags.get("opening_hours"),
        "payment": sorted({v for k, v in PAYMENTS.items() if tags.get(k) == "yes"}),
        "indoor": {"yes": True, "no": False}.get(tags.get("indoor", "")),
        "website": tags.get("website") or tags.get("contact:website"),
        # posizione da verificare secondo chi l'ha mappata
        "positionToCheck": "fixme" in tags and "position" in tags.get("fixme", ""),
    }


def build(payload: dict) -> dict:
    spots = [s for s in (spot(e) for e in payload.get("elements", [])) if s]
    if len(spots) < MIN_SPOTS:
        raise ValueError(f"risposta incompleta: {len(spots)} depositi")
    spots.sort(key=lambda s: (-s["lat"], s["lon"]))
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "OpenStreetMap contributors",
        "sourceUrl": "https://www.openstreetmap.org/copyright",
        "license": "ODbL 1.0",
        "attribution": "© OpenStreetMap contributors",
        "note": "Depositi bagagli custoditi (amenity=left_luggage) e armadietti (amenity=luggage_locker) mappati su OpenStreetMap. Senza prezzi né valutazioni (non sono dati aperti) e senza il nome del gestore.",
        "count": len(spots),
        "spots": spots,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Depositi bagagli da OpenStreetMap")
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
    logging.info("Depositi bagagli OSM: %d -> %s", data["count"], OUT)
    return 0


if __name__ == "__main__":
    sys.exit(main())
