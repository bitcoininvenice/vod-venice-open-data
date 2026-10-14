"""
VOD - Venice Open Data
Toponimi di Venezia, delle isole e del Lido da OpenStreetMap: calli, fondamenta, ponti, campi, rive, vie.

Serve a collocare sulla mappa le ordinanze del Comune che citano un luogo nel titolo
(es. "Ponte de la Caziola", "Fondamenta della Misericordia") quando l'atto non ha un punto sulla mappa
del Comune. Per ogni nome si tengono i gruppi di tratti vicini: un nome con più gruppi lontani
(in città ci sono molte "Calle del Forno") è ambiguo e chi lo usa deve scartarlo o restringerlo alla zona.

Uso: python import_osm_toponyms.py [--file risposta_overpass.json]
"""

import argparse
import json
import logging
import math
import os
import sys
from datetime import datetime, timezone

from vod_http import overpass

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "osm-toponyms.json")

# Centro storico, Giudecca, isole della laguna nord, Lido e Pellestrina (la terraferma è esclusa sotto)
BBOX = (45.225, 12.28, 45.50, 12.56)
B = f"{BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]}"
QUERY = (
    f'[out:json][timeout:180];('
    f'way["highway"]["name"]({B});'
    f'way["bridge"]["name"]({B});'
    f'way["bridge:name"]({B});'
    f'nwr["place"="square"]["name"]({B});'
    f'nwr["highway"="pedestrian"]["area"="yes"]["name"]({B});'
    f');out geom qt;'
)

# Tratti dello stesso nome che si avvicinano entro questa distanza formano un unico luogo
CLUSTER_M = 80
# Sotto questa soglia la risposta di Overpass è considerata incompleta e il file non viene sovrascritto
MIN_NAMES = 2000


def is_mainland(lon: float, lat: float) -> bool:
    """Terraferma (Campalto, San Giuliano, Tessera) e Punta Sabbioni, fuori dal Comune insulare."""
    if lat > 45.462 and lon < 12.37:
        return True
    return lat > 45.44 and lon > 12.44 and lat < 45.47  # litorale del Cavallino


def dist_m(a: list[float], b: list[float]) -> float:
    k = math.cos(math.radians(a[1])) * 111320
    return math.hypot((a[0] - b[0]) * k, (a[1] - b[1]) * 110540)


def points_of(el: dict) -> list[list[float]]:
    """Vertici della way (o il punto del nodo / il centro della relazione)."""
    if el.get("geometry"):
        return [[g["lon"], g["lat"]] for g in el["geometry"] if g]
    c = el.get("center") or (el if "lat" in el else None)
    return [[c["lon"], c["lat"]]] if c else []


def near(a: list[list[float]], b: list[list[float]]) -> bool:
    return any(dist_m(p, q) <= CLUSTER_M for p in a for q in b)


def cluster(parts: list[list[list[float]]]) -> list[list[float]]:
    """Unisce i tratti che si toccano (entro CLUSTER_M) e restituisce per ogni gruppo il vertice più vicino al centro."""
    groups: list[list[list[float]]] = []
    for pts in parts:
        touching = [g for g in groups if near(pts, g)]
        merged = list(pts)
        for g in touching:
            merged += g
            groups.remove(g)
        groups.append(merged)
    out = []
    for g in groups:
        cx = sum(p[0] for p in g) / len(g)
        cy = sum(p[1] for p in g) / len(g)
        # un vertice reale: il centro di una strada curva può cadere su un edificio o in acqua
        best = min(g, key=lambda p: dist_m(p, [cx, cy]))
        out.append([round(best[0], 6), round(best[1], 6)])
    return sorted(out)


def build(payload: dict) -> dict[str, list[list[float]]]:
    """Nome -> centri dei gruppi; le grafie che differiscono solo per maiuscole sono unite (vince la più frequente)."""
    parts_by_key: dict[str, list[list[list[float]]]] = {}
    spellings: dict[str, dict[str, int]] = {}
    for el in payload.get("elements", []):
        tags = el.get("tags", {})
        pts = [p for p in points_of(el) if not is_mainland(*p)]
        if not pts:
            continue
        for name in {(tags.get(k) or "").strip() for k in ("name", "bridge:name")} - {""}:
            key = name.casefold()
            parts_by_key.setdefault(key, []).append(pts)
            spellings.setdefault(key, {})
            spellings[key][name] = spellings[key].get(name, 0) + 1
    out = {}
    for key, parts in parts_by_key.items():
        name = max(sorted(spellings[key]), key=lambda n: spellings[key][n])
        out[name] = cluster(parts)
    return dict(sorted(out.items()))


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

    names = build(payload)
    if len(names) < MIN_NAMES:
        logging.error("Dati OSM incompleti (%d nomi): file non aggiornato", len(names))
        return 1
    out = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "OpenStreetMap (Overpass API) – strade, ponti e campi con nome",
        "sourceUrl": "https://www.openstreetmap.org",
        "license": "ODbL 1.0",
        "attribution": "© OpenStreetMap contributors",
        "note": f"Per ogni nome i centri dei gruppi di tratti entro {CLUSTER_M} m: più centri = nome ambiguo.",
        "count": len(names),
        "names": names,
    }
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write("\n")
    ambiguous = sum(1 for c in names.values() if len(c) > 1)
    logging.info("Toponimi OSM: %d nomi (%d ambigui), %d KB", len(names), ambiguous, os.path.getsize(OUT_FILE) // 1024)
    return 0


if __name__ == "__main__":
    sys.exit(main())
