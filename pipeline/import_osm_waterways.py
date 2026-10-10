#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: briccole, segnalamenti e canali della laguna da OpenStreetMap.

Non esiste un dataset ufficiale aperto con la posizione delle briccole o il tracciato dei canali
navigabili (verificato su dati.venezia.it, catalogo regionale e data.europa.eu): OpenStreetMap
è la fonte aperta più completa.

- briccole e pali: man_made=dolphin, seamark:type=pile
- segnalamenti: seamark:type=beacon_* / buoy_* / light_*
- canali e rii: waterway=canal (tracciato semplificato, con nome quando presente)

Licenza: ODbL 1.0 - © OpenStreetMap contributors.
Output: web/src/data/osm-waterways.json (servito da /api/lagoon-network).
Uso: python import_osm_waterways.py
"""

import json
import logging
import math
import os
import sys
from datetime import datetime, timezone

from vod_http import overpass

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "osm-waterways.json")

# Cornice della mappa VOD
FRAME = (45.205, 12.135, 45.555, 12.47)
B = f"{FRAME[0]},{FRAME[1]},{FRAME[2]},{FRAME[3]}"
SIMPLIFY_M = 4.0

MARKERS_QUERY = f"""[out:json][timeout:240];
(
  node["man_made"="dolphin"]({B});
  node["seamark:type"~"^(pile|beacon_lateral|beacon_cardinal|beacon_safe_water|beacon_special_purpose|beacon_isolated_danger|buoy_lateral|buoy_cardinal|buoy_safe_water|buoy_special_purpose|light_minor|light_major)$"]({B});
);
out body;"""  # i nodi servono con le coordinate

CANALS_QUERY = f"""[out:json][timeout:240];
way["waterway"="canal"]({B});
out tags geom;"""

# Codici compatti salvati nel JSON
MARKER_KIND = {"briccola": 1, "palo": 2, "segnale": 3, "boa": 4, "fanale": 5}


def marker_kind(tags: dict) -> str:
    st = tags.get("seamark:type", "")
    if st.startswith("light_"):
        return "fanale"
    if st.startswith("buoy_"):
        return "boa"
    if st.startswith("beacon_"):
        return "segnale"
    if tags.get("man_made") == "dolphin":
        return "briccola"
    return "palo"


def perpendicular_m(p, a, b) -> float:
    """Distanza (m) di p dal segmento a-b, con approssimazione equirettangolare."""
    k = math.cos(math.radians(a[1])) * 111320
    ax, ay, bx, by, px, py = a[0] * k, a[1] * 110540, b[0] * k, b[1] * 110540, p[0] * k, p[1] * 110540
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def simplify(points: list, tol_m: float) -> list:
    """Douglas-Peucker su [lon, lat]."""
    if len(points) < 3:
        return points
    dmax, idx = 0.0, 0
    for i in range(1, len(points) - 1):
        d = perpendicular_m(points[i], points[0], points[-1])
        if d > dmax:
            dmax, idx = d, i
    if dmax <= tol_m:
        return [points[0], points[-1]]
    return simplify(points[: idx + 1], tol_m)[:-1] + simplify(points[idx:], tol_m)


def main() -> int:
    try:
        markers_raw = overpass(MARKERS_QUERY)
        canals_raw = overpass(CANALS_QUERY)
    except Exception as e:  # noqa: BLE001
        logging.error("%s", e)
        return 1

    markers = []
    counts = {k: 0 for k in MARKER_KIND}
    for el in markers_raw.get("elements", []):
        if "lat" not in el:
            continue
        kind = marker_kind(el.get("tags", {}))
        counts[kind] += 1
        markers.append([round(el["lon"], 6), round(el["lat"], 6), MARKER_KIND[kind], el["id"]])
    markers.sort(key=lambda m: m[3])

    canals = []
    for el in canals_raw.get("elements", []):
        geom = [[round(p["lon"], 6), round(p["lat"], 6)] for p in el.get("geometry", [])]
        if len(geom) < 2:
            continue
        canals.append({"id": el["id"], "name": el.get("tags", {}).get("name"), "coords": simplify(geom, SIMPLIFY_M)})
    canals.sort(key=lambda c: c["id"])

    if len(markers) < 1000 or len(canals) < 300:
        logging.error("Dati OSM incompleti (%d segnalamenti, %d canali): file non aggiornato", len(markers), len(canals))
        return 1

    out = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "OpenStreetMap (Overpass API)",
        "license": "ODbL 1.0",
        "attribution": "© OpenStreetMap contributors",
        "markerKinds": MARKER_KIND,
        "counts": {**counts, "canals": len(canals), "namedCanals": sum(1 for c in canals if c["name"])},
        # [lon, lat, tipo, id del nodo OSM]
        "markers": markers,
        "canals": canals,
    }
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write("\n")
    logging.info("Laguna OSM: %s", out["counts"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
