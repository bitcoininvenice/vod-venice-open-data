#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: farmacie da OpenStreetMap (amenity=pharmacy).

Solo posizione, nome, indirizzo, telefono e orari dichiarati in OSM. I turni (farmacie di turno)
cambiano ogni giorno e non sono pubblicati come open data: l'app rimanda alla pagina ufficiale.
Licenza dei dati: ODbL 1.0 - © OpenStreetMap contributors.

Output: web/src/data/osm-pharmacies.json (letto da web/src/lib/pharmacies-data.ts).
Uso: python import_osm_pharmacies.py
"""

import json
import logging
import os
import sys
from datetime import datetime, timezone

from import_osm_defibrillators import BBOX
from vod_http import overpass

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "osm-pharmacies.json")

QUERY = (
    f'[out:json][timeout:60];'
    f'(node["amenity"="pharmacy"]({BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]});'
    f' way["amenity"="pharmacy"]({BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]}););'
    f'out center tags;'
)


def address(tags: dict) -> str:
    street = tags.get("addr:street") or tags.get("addr:place")
    number = tags.get("addr:housenumber", "")
    if street:
        return f"{street} {number}".strip()
    return tags.get("addr:full") or "Indirizzo non indicato in OSM"


def to_pharmacy(el: dict):
    lat = el.get("lat") or el.get("center", {}).get("lat")
    lon = el.get("lon") or el.get("center", {}).get("lon")
    if lat is None or lon is None:
        return None
    tags = el.get("tags", {})
    item = {
        "id": f"osm_{el['type']}_{el['id']}",
        "name": tags.get("name") or "Farmacia",
        "address": address(tags),
        "lat": round(lat, 6),
        "lon": round(lon, 6),
        "source": "OPENSTREETMAP",
        "sourceUrl": f"https://www.openstreetmap.org/{el['type']}/{el['id']}",
    }
    phone = tags.get("phone") or tags.get("contact:phone")
    if phone:
        item["phone"] = phone
    if tags.get("opening_hours"):
        item["openingHours"] = tags["opening_hours"]
    # amenity=pharmacy include anche parafarmacie quando dispensing=no
    if tags.get("dispensing") == "no":
        item["dispensing"] = False
    return item


def main() -> int:
    try:
        payload = overpass(QUERY)
    except Exception as e:
        logging.error("%s", e)
        return 1

    items = sorted(
        (p for p in (to_pharmacy(el) for el in payload.get("elements", [])) if p),
        key=lambda p: p["id"],
    )
    out = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "OpenStreetMap - amenity=pharmacy",
        "license": "ODbL 1.0",
        "attribution": "© OpenStreetMap contributors",
        "bbox": BBOX,
        "count": len(items),
        "pharmacies": items,
    }
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    logging.info("Salvate %d farmacie OSM in %s", len(items), os.path.relpath(OUT_FILE, BASE_DIR))
    return 0


if __name__ == "__main__":
    sys.exit(main())
