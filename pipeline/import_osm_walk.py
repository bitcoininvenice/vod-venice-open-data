"""
VOD - Venice Open Data
Rete pedonale di Venezia (centro storico, Giudecca, Murano, Burano, Lido nord) da OpenStreetMap,
per il calcolo dei percorsi a piedi e del trip planner a piedi + vaporetto.

Il grafo ha come nodi gli incroci e le estremità delle vie; ogni arco porta lunghezza, ponti a
gradini (per un futuro percorso senza barriere) e geometria semplificata per il disegno.
Scrive web/public/data/walk-<hash>.json (cache del browser senza scadenza) e web/src/lib/walk-data.ts.

Uso: python import_osm_walk.py [--file risposta_overpass.json]
"""

import argparse
import json
import logging
import math
import os
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone

from export_simulation_data import write_hashed_json
from import_osm_waterways import simplify
from vod_http import overpass

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TS_FILE = os.path.join(BASE_DIR, "..", "web", "src", "lib", "walk-data.ts")

BBOX = (45.395, 12.29, 45.495, 12.425)
HIGHWAYS = "footway|pedestrian|path|steps|living_street|residential|service|unclassified|tertiary|secondary|track|corridor|platform"
QUERY = (
    f'[out:json][timeout:240];way["highway"~"^({HIGHWAYS})$"]({BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]});'
    "out body qt;>;out skel qt;"
)
# Origine delle coordinate intere (1 unità = 1e-5 gradi, circa 1 m)
LON0, LAT0 = BBOX[1], BBOX[0]
SCALE = 100_000
SIMPLIFY_M = 2.0
MIN_COMPONENT = 20
MIN_NODES = 5_000

FLAG_STEPS = 1  # gradini o ponte a gradini


def walkable(tags: dict) -> bool:
    if tags.get("foot") in ("no", "private") or tags.get("access") in ("no", "private"):
        return tags.get("foot") in ("yes", "designated", "permissive")
    return tags.get("area") != "yes" or tags.get("highway") == "pedestrian"


def edge_flags(tags: dict) -> int:
    # A Venezia quasi tutti i ponti pedonali hanno gradini; quelli senza (rampe) sono indicati con ramp/wheelchair
    steps = tags.get("highway") == "steps" or (tags.get("bridge") and tags.get("wheelchair") != "yes" and tags.get("ramp") != "yes")
    return FLAG_STEPS if steps else 0


def meters(a: tuple[float, float], b: tuple[float, float]) -> float:
    k = math.cos(math.radians((a[1] + b[1]) / 2)) * 111320
    return math.hypot((b[0] - a[0]) * k, (b[1] - a[1]) * 110540)


def build(payload: dict) -> dict:
    coords = {el["id"]: (el["lon"], el["lat"]) for el in payload.get("elements", []) if el["type"] == "node"}
    ways = [el for el in payload.get("elements", []) if el["type"] == "way" and walkable(el.get("tags", {}))]
    use = Counter()
    for w in ways:
        nodes = [n for n in w["nodes"] if n in coords]
        use.update(nodes)
        use[nodes[0]] += 1  # estremità: sempre nodi del grafo
        use[nodes[-1]] += 1
    junction = {n for n, c in use.items() if c >= 2}

    index: dict[int, int] = {}
    node_xy: list[tuple[float, float]] = []
    edges: list[tuple[int, int, float, int, list]] = []

    def node(osm_id: int) -> int:
        if osm_id not in index:
            index[osm_id] = len(node_xy)
            node_xy.append(coords[osm_id])
        return index[osm_id]

    seen = set()
    for w in ways:
        nodes = [n for n in w["nodes"] if n in coords]
        flags = edge_flags(w.get("tags", {}))
        start = 0
        for i in range(1, len(nodes)):
            if nodes[i] not in junction and i < len(nodes) - 1:
                continue
            seg = nodes[start:i + 1]
            start = i
            if len(seg) < 2 or seg[0] == seg[-1]:
                continue
            key = (min(seg[0], seg[-1]), max(seg[0], seg[-1]), len(seg))
            if key in seen:
                continue
            seen.add(key)
            pts = [coords[n] for n in seg]
            length = sum(meters(pts[k], pts[k + 1]) for k in range(len(pts) - 1))
            inner = simplify([list(p) for p in pts], SIMPLIFY_M)[1:-1]
            edges.append((node(seg[0]), node(seg[-1]), length, flags, inner))

    # Componenti connesse: si scartano i pezzi isolati più piccoli (cortili, errori di mappatura)
    adj = defaultdict(list)
    for a, b, *_ in edges:
        adj[a].append(b)
        adj[b].append(a)
    comp = [-1] * len(node_xy)
    sizes = []
    for s in range(len(node_xy)):
        if comp[s] != -1:
            continue
        stack, size = [s], 0
        comp[s] = len(sizes)
        while stack:
            u = stack.pop()
            size += 1
            for v in adj[u]:
                if comp[v] == -1:
                    comp[v] = comp[s]
                    stack.append(v)
        sizes.append(size)
    keep = [sizes[comp[i]] >= MIN_COMPONENT for i in range(len(node_xy))]
    remap, nodes_out = {}, []
    for i, (lon, lat) in enumerate(node_xy):
        if keep[i]:
            remap[i] = len(nodes_out) // 2
            nodes_out += [round((lon - LON0) * SCALE), round((lat - LAT0) * SCALE)]
    edges_out, geom_out = [], []
    for a, b, length, flags, inner in edges:
        if a in remap and b in remap:
            edges_out += [remap[a], remap[b], round(length * 10), flags]
            geom_out.append([v for p in inner for v in (round((p[0] - LON0) * SCALE), round((p[1] - LAT0) * SCALE))])
    return {"nodes": nodes_out, "edges": edges_out, "geom": geom_out}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", help="risposta Overpass già scaricata (JSON)")
    args = parser.parse_args()
    try:
        if args.file:
            with open(args.file, encoding="utf-8") as fh:
                payload = json.load(fh)
        else:
            payload = overpass(QUERY, timeout=300)
    except Exception as e:  # noqa: BLE001
        logging.error("Query Overpass fallita: %s", e)
        return 1
    graph = build(payload)
    n_nodes, n_edges = len(graph["nodes"]) // 2, len(graph["edges"]) // 4
    if n_nodes < MIN_NODES:
        logging.error("Rete incompleta (%d nodi): file non aggiornato", n_nodes)
        return 1
    data = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "OpenStreetMap (Overpass API) – vie pedonali, calli, fondamenta, ponti",
        "license": "ODbL 1.0",
        "attribution": "© OpenStreetMap contributors",
        # coordinate intere: lon = LON0 + x / SCALE, lat = LAT0 + y / SCALE
        "origin": [LON0, LAT0],
        "scale": SCALE,
        # archi: [nodo a, nodo b, lunghezza in decimetri, flag (1 = gradini/ponte)]
        **graph,
    }
    url = write_hashed_json("walk", data)
    with open(TS_FILE, "w", encoding="utf-8") as fh:
        fh.write(
            "// Generato da pipeline/import_osm_walk.py: rete pedonale OpenStreetMap (ODbL) per i percorsi a piedi.\n"
            f'export const WALK_URL = "{url}";\n'
            f"export const WALK_STATS = {json.dumps({'nodes': n_nodes, 'edges': n_edges, 'generatedAt': data['generatedAt']})};\n"
        )
    logging.info("Rete pedonale: %d nodi, %d archi -> %s", n_nodes, n_edges, url)
    return 0


if __name__ == "__main__":
    sys.exit(main())
