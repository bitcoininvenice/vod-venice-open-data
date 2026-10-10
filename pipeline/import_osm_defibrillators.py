#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: defibrillatori (DAE) da OpenStreetMap (emergency=defibrillator).

Non esiste un dataset aperto ufficiale dei DAE per Venezia (verificato su dati.gov.it,
dati.veneto.it e dati.venezia.it): OpenStreetMap è la fonte aperta disponibile.
Licenza dei dati: ODbL 1.0 - © OpenStreetMap contributors.

Output: web/src/data/osm-defibrillators.json (letto da web/src/lib/dae-data.ts).
Uso: python import_osm_defibrillators.py
"""

import json
import logging
import os
import sys
from datetime import datetime, timezone
from vod_http import overpass

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "osm-defibrillators.json")

# Più istanze Overpass: quella principale è spesso sovraccarica.
# Stesso riquadro della mappa VOD (Laguna, centro storico, Lido, Pellestrina, Mestre, Tessera)
BBOX = (45.18, 12.10, 45.58, 12.62)
QUERY = (
    f'[out:json][timeout:60];'
    f'(node["emergency"="defibrillator"]({BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]}););'
    f'out body;'
)


def access_type(tags: dict) -> str:
    """H24 solo se gli orari lo dichiarano esplicitamente; altrimenti non si inventa nulla."""
    hours = (tags.get("opening_hours") or "").strip()
    if hours == "24/7":
        return "PUBBLICO_H24"
    if hours:
        return "ORARIO_LIMITATO"
    return "NON_INDICATO"


def location_label(tags: dict) -> str:
    for key in ("defibrillator:location:it", "defibrillator:location", "name", "description"):
        if tags.get(key):
            return tags[key]
    street = tags.get("addr:street")
    if street:
        return f"{street} {tags.get('addr:housenumber', '')}".strip()
    return "Posizione non descritta in OSM"


def to_dae(node: dict) -> dict:
    tags = node.get("tags", {})
    dae = {
        "id": f"osm_{node['id']}",
        "code": tags.get("ref") or f"OSM-{node['id']}",
        "location": location_label(tags),
        "lat": round(node["lat"], 6),
        "lon": round(node["lon"], 6),
        "accessType": access_type(tags),
        "operator": tags.get("operator") or "Non indicato",
        "source": "OPENSTREETMAP",
        "sourceUrl": f"https://www.openstreetmap.org/node/{node['id']}",
    }
    if tags.get("opening_hours"):
        dae["openingHours"] = tags["opening_hours"]
    if tags.get("indoor") == "yes":
        dae["indoor"] = True
    check = tags.get("check_date") or tags.get("survey:date")
    if check:
        dae["checkDate"] = check
    return dae




def main() -> int:
    try:
        payload = overpass(QUERY)
    except Exception as e:
        logging.error("%s", e)
        return 1

    nodes = [el for el in payload.get("elements", []) if el.get("type") == "node"]
    items = sorted((to_dae(n) for n in nodes), key=lambda d: d["id"])
    out = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "OpenStreetMap - emergency=defibrillator",
        "license": "ODbL 1.0",
        "attribution": "© OpenStreetMap contributors",
        "bbox": BBOX,
        "count": len(items),
        "defibrillators": items,
    }
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    logging.info("Salvati %d DAE OSM in %s", len(items), os.path.relpath(OUT_FILE, BASE_DIR))
    return 0


if __name__ == "__main__":
    sys.exit(main())
