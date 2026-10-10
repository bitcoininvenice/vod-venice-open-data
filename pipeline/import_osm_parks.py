"""
VOD - Venice Open Data
Parchi, giardini pubblici, aree giochi, aree cani e oasi naturalistiche da OpenStreetMap.

Il Comune di Venezia non pubblica un dataset aperto del verde pubblico: si usa OpenStreetMap (ODbL).
Sono esclusi i luoghi con accesso privato e i giardini privati (residenziali, orti, aiuole stradali):
un giardino resta solo se OSM lo dichiara aperto o di tipo pubblico, botanico o comunitario.

Uso: python import_osm_parks.py [--file risposta_overpass.json]
"""

import argparse
import json
import logging
import math
import os
import sys
from datetime import datetime, timezone

from import_osm_defibrillators import BBOX
from import_osm_waterways import simplify
from vod_http import overpass

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "osm-parks.json")

KINDS = ("park", "garden", "playground", "dog_park", "nature_reserve")
B = f"{BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]}"
QUERY = f'[out:json][timeout:180];(nwr["leisure"~"^({"|".join(KINDS)})$"]({B}););out tags geom qt;'

SIMPLIFY_M = 1.5
# Sotto questa soglia la risposta di Overpass è considerata incompleta e il file non viene sovrascritto
MIN_PLACES = 400

PUBLIC_ACCESS = {"yes", "permissive", "public", "destination"}
EXCLUDED_ACCESS = {"private", "no"}
OPEN_GARDEN_TYPES = {"public", "botanical", "community"}
PRIVATE_GARDEN_TYPES = {"residential", "private", "vegetable_garden", "street_side", "school", "monastery"}


def access_of(tags: dict) -> str | None:
    """public | customers | unknown; None se privato (escluso)."""
    a = (tags.get("access") or "").strip().lower()
    if a in EXCLUDED_ACCESS:
        return None
    if a in PUBLIC_ACCESS:
        return "public"
    if a == "customers":
        return "customers"
    return "unknown"


def keep(tags: dict) -> bool:
    kind = tags.get("leisure")
    if kind not in KINDS or access_of(tags) is None:
        return False
    if kind != "garden":
        return True
    gtype = (tags.get("garden:type") or "").strip().lower()
    if gtype in OPEN_GARDEN_TYPES or access_of(tags) == "public":
        return True
    # Giardino senza indicazioni: resta solo se ha un nome e non è dichiarato privato o domestico
    return bool(tags.get("name")) and gtype not in PRIVATE_GARDEN_TYPES


def stitch(ways: list[list[list[float]]]) -> list[list[list[float]]]:
    """Unisce i tratti di un multipoligono in anelli chiusi (i tratti possono essere invertiti)."""
    pending = [w[:] for w in ways if len(w) >= 2]
    rings = []
    while pending:
        ring = pending.pop(0)
        changed = True
        while ring[0] != ring[-1] and changed:
            changed = False
            for i, w in enumerate(pending):
                if w[0] == ring[-1]:
                    ring += w[1:]
                elif w[-1] == ring[-1]:
                    ring += w[::-1][1:]
                elif w[-1] == ring[0]:
                    ring = w[:-1] + ring
                elif w[0] == ring[0]:
                    ring = w[::-1][:-1] + ring
                else:
                    continue
                pending.pop(i)
                changed = True
                break
        if ring[0] == ring[-1] and len(ring) >= 4:
            rings.append(ring)
    return rings


def outer_rings(el: dict) -> list[list[list[float]]]:
    """Anelli esterni [lon, lat] di una way chiusa o di una relazione multipoligono."""
    if el["type"] == "way":
        pts = [[p["lon"], p["lat"]] for p in el.get("geometry", [])]
        return [pts] if len(pts) >= 4 and pts[0] == pts[-1] else []
    if el["type"] == "relation":
        ways = [[[p["lon"], p["lat"]] for p in m.get("geometry", [])] for m in el.get("members", []) if m.get("type") == "way" and m.get("role", "outer") in ("outer", "")]
        return stitch(ways)
    return []


def ring_area_m2(ring: list[list[float]]) -> float:
    """Area (m²) con la formula di Gauss su coordinate equirettangolari locali."""
    k = math.cos(math.radians(ring[0][1])) * 111320
    pts = [(x * k, y * 110540) for x, y in ring]
    return abs(sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(pts, pts[1:]))) / 2


def centroid(ring: list[list[float]]) -> list[float]:
    """Baricentro del poligono (media dei vertici se degenere)."""
    a = cx = cy = 0.0
    for (x1, y1), (x2, y2) in zip(ring, ring[1:]):
        f = x1 * y2 - x2 * y1
        a += f
        cx += (x1 + x2) * f
        cy += (y1 + y2) * f
    if abs(a) < 1e-12:
        n = len(ring)
        return [sum(p[0] for p in ring) / n, sum(p[1] for p in ring) / n]
    return [cx / (3 * a), cy / (3 * a)]


def to_place(el: dict) -> dict | None:
    tags = el.get("tags", {})
    if not keep(tags):
        return None
    rings = outer_rings(el)
    if rings:
        biggest = max(rings, key=ring_area_m2)
        area = round(sum(ring_area_m2(r) for r in rings))
        center = centroid(biggest)
        rings = [[[round(x, 6), round(y, 6)] for x, y in simplify(r, SIMPLIFY_M)] for r in rings]
        rings = [r for r in rings if len(r) >= 4]
    elif "lat" in el:
        area, center = None, [el["lon"], el["lat"]]
    else:
        return None
    return {
        "id": f"osm-{el['type']}-{el['id']}",
        "osmUrl": f"https://www.openstreetmap.org/{el['type']}/{el['id']}",
        "name": tags.get("name") or None,
        "kind": tags["leisure"],
        "access": access_of(tags),
        "areaM2": area,
        "lon": round(center[0], 6),
        "lat": round(center[1], 6),
        "rings": rings,
        "openingHours": tags.get("opening_hours") or None,
        "operator": tags.get("operator") or None,
        "wheelchair": tags.get("wheelchair") or None,
        "dog": tags.get("dog") or None,
        "lit": tags.get("lit") or None,
        "website": tags.get("website") or tags.get("contact:website") or None,
    }


def build(payload: dict) -> list[dict]:
    places = [p for p in (to_place(el) for el in payload.get("elements", [])) if p]
    # Prima le aree più grandi: in caso di sovrapposizione il clic va a quelle più piccole, disegnate sopra
    return sorted(places, key=lambda p: (-(p["areaM2"] or 0), p["id"]))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", help="risposta Overpass già scaricata (JSON)")
    args = parser.parse_args()
    try:
        if args.file:
            with open(args.file, encoding="utf-8") as fh:
                payload = json.load(fh)
        else:
            payload = overpass(QUERY, timeout=240)
    except Exception as e:  # noqa: BLE001
        logging.error("Query Overpass fallita: %s", e)
        return 1

    places = build(payload)
    if len(places) < MIN_PLACES:
        logging.error("Dati OSM incompleti (%d luoghi): file non aggiornato", len(places))
        return 1
    counts = {k: sum(1 for p in places if p["kind"] == k) for k in KINDS}
    out = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "OpenStreetMap (Overpass API) – leisure=park, garden, playground, dog_park, nature_reserve",
        "sourceUrl": "https://www.openstreetmap.org",
        "license": "ODbL 1.0",
        "attribution": "© OpenStreetMap contributors",
        "note": "Esclusi i luoghi ad accesso privato e i giardini privati o domestici. Orari e accessibilità come indicati su OSM, non verificati.",
        "counts": counts,
        "places": places,
    }
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write("\n")
    logging.info("Verde OSM: %s (%d KB)", counts, os.path.getsize(OUT_FILE) // 1024)
    return 0


if __name__ == "__main__":
    sys.exit(main())
