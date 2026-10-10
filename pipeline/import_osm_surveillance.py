#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: telecamere di videosorveglianza da OpenStreetMap (man_made=surveillance).

Licenza dei dati: ODbL 1.0 - © OpenStreetMap contributors. Il riuso è consentito con
attribuzione; i dati derivati distribuiti vanno rilasciati con la stessa licenza.

Output: web/src/data/osm-surveillance.json (letto da web/src/lib/cameras-data.ts).
Uso: python import_osm_surveillance.py
"""

import json
import logging
import os
import sys
from datetime import datetime, timezone
from vod_http import overpass

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "osm-surveillance.json")

# Stesso riquadro della mappa VOD (Laguna, centro storico, Lido, Pellestrina, Mestre, Tessera)
BBOX = (45.18, 12.10, 45.58, 12.62)
QUERY = f'[out:json][timeout:60];(node["man_made"="surveillance"]({BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]}););out body;'

TYPE_LABEL = {
    "CCTV_DOME": "Telecamera dome",
    "CCTV_ROTATING": "Telecamera motorizzata (PTZ)",
    "CCTV_SPOT": "Telecamera fissa",
    "CCTV_ANPR": "Lettura targhe (ANPR/ALPR)",
}

ZONE_LABEL = {
    "public": "Spazio pubblico",
    "outdoor": "Esterno (area privata verso spazio pubblico)",
    "indoor": "Interno",
    "traffic": "Traffico",
    "red_light": "Semaforo / infrazioni",
    "town": "Videosorveglianza urbana",
}


def camera_type(tags: dict) -> str:
    if tags.get("surveillance:type", "").upper() in ("ALPR", "ANPR"):
        return "CCTV_ANPR"
    kind = tags.get("camera:type", "")
    if kind == "dome":
        return "CCTV_DOME"
    if kind == "panning":
        return "CCTV_ROTATING"
    return "CCTV_SPOT"


def zone(lat: float, lon: float) -> str:
    """Zona approssimata per la scheda (riquadri indicativi, non confini amministrativi)."""
    if 45.425 <= lat <= 45.448 and 12.305 <= lon <= 12.370:
        return "Venezia centro storico"
    if 45.448 < lat <= 45.462 and 12.340 <= lon <= 12.370:
        return "Murano"
    if lat < 45.425 and lon >= 12.33:
        return "Lido / Pellestrina"
    if 45.475 <= lat and lon <= 12.30:
        return "Mestre"
    if lat <= 45.47 and lon <= 12.28:
        return "Marghera / Terraferma"
    if lat >= 45.49 and lon >= 12.32:
        return "Tessera / Aeroporto"
    return "Laguna e terraferma"


def direction(tags: dict):
    raw = tags.get("camera:direction") or tags.get("direction")
    if not raw:
        return None
    try:
        return int(float(raw)) % 360
    except ValueError:
        compass = {"N": 0, "NE": 45, "E": 90, "SE": 135, "S": 180, "SW": 225, "W": 270, "NW": 315}
        return compass.get(raw.upper())


def to_camera(node: dict) -> dict:
    tags = node.get("tags", {})
    ctype = camera_type(tags)
    zone_tag = tags.get("surveillance")
    notes = [ZONE_LABEL.get(zone_tag, zone_tag)] if zone_tag else []
    if tags.get("camera:mount"):
        notes.append(f"montaggio: {tags['camera:mount']}")
    if tags.get("description"):
        notes.append(tags["description"])

    cam = {
        "id": f"osm_{node['id']}",
        "name": tags.get("name") or TYPE_LABEL[ctype],
        "type": ctype,
        "typeLabel": TYPE_LABEL[ctype],
        "lat": round(node["lat"], 6),
        "lon": round(node["lon"], 6),
        "sestiere": zone(node["lat"], node["lon"]),
        "location": tags.get("addr:street") or zone(node["lat"], node["lon"]),
        "targetDescription": ZONE_LABEL.get(zone_tag, "Area non specificata nei dati OSM"),
        "operator": tags.get("operator") or "Non indicato",
        "source": "OPENSTREETMAP",
        "sourceLabel": "OpenStreetMap (ODbL)",
        "sourceUrl": f"https://www.openstreetmap.org/node/{node['id']}",
        "hasLiveFeed": False,
    }
    bearing = direction(tags)
    if bearing is not None:
        cam["bearingDeg"] = bearing
    if notes:
        cam["notes"] = " · ".join(notes)
    return cam


def main() -> int:
    try:
        payload = overpass(QUERY)
    except Exception as e:
        logging.error("Query Overpass fallita: %s", e)
        return 1

    nodes = [el for el in payload.get("elements", []) if el.get("type") == "node"]
    cameras = sorted((to_camera(n) for n in nodes), key=lambda c: c["id"])
    out = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "OpenStreetMap - man_made=surveillance",
        "license": "ODbL 1.0",
        "attribution": "© OpenStreetMap contributors",
        "bbox": BBOX,
        "count": len(cameras),
        "cameras": cameras,
    }
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    logging.info("Salvate %d telecamere OSM in %s", len(cameras), os.path.relpath(OUT_FILE, BASE_DIR))
    return 0


if __name__ == "__main__":
    sys.exit(main())
