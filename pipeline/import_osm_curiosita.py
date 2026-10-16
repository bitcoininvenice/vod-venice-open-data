#!/usr/bin/env python3
"""
Curiosità sulle calli del centro storico di Venezia calcolate da OpenStreetMap (ODbL):
le calli più strette fra quelle con la larghezza mappata, le calli e le fondamenta più lunghe, i ponti (quanti,
il più lungo) e la distanza a piedi da un ponte al ponte più vicino lungo la rete pedonale.

Una via con lo stesso nome compare spesso in sestieri diversi (Calle del Forno…): i tratti si uniscono solo se
sono contigui. La larghezza è mappata su pochi tratti: la calle più stretta è la più stretta «fra quelle misurate».

Uso: python import_osm_curiosita.py [--file risposta_overpass.json]
Output: web/src/data/calli-curiosita.json
"""
from __future__ import annotations

import argparse
import heapq
import json
import logging
import math
import os
import re
import statistics
import sys
from datetime import datetime, timezone

from vod_http import overpass

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE_DIR, "..", "web", "src", "data", "calli-curiosita.json")

# Centro storico con Giudecca, San Giorgio, Tronchetto e Sant'Elena (sud, ovest, nord, est)
BBOX = (45.422, 12.300, 45.450, 12.368)
HIGHWAYS = "footway|pedestrian|path|steps|residential|living_street|service|unclassified|corridor"
QUERY = f"""[out:json][timeout:180];
way["highway"~"^({HIGHWAYS})$"]({BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]});
out tags geom;"""

# Sotto queste soglie la risposta di Overpass è incompleta: non si sovrascrive il file
MIN_WAYS = 5000
MIN_BRIDGES = 200
TOP = 5


def haversine(a: tuple[float, float], b: tuple[float, float]) -> float:
    """Distanza in metri fra due punti (lat, lon)."""
    r = 6371008.8
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def way_points(way: dict) -> list[tuple[float, float]]:
    return [(round(p["lat"], 7), round(p["lon"], 7)) for p in way.get("geometry", [])]


def parse_width(value: str | None) -> float | None:
    """«0.8», «0,53 m», «1 m» -> metri; valori non numerici o in altre unità -> None."""
    if not value:
        return None
    m = re.match(r"^\s*(\d+(?:[.,]\d+)?)\s*(m)?\s*$", value)
    return float(m.group(1).replace(",", ".")) if m else None


def components(ways: list[dict]) -> list[list[dict]]:
    """Gruppi di tratti che si toccano (condividono un vertice)."""
    parent = list(range(len(ways)))

    def find(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    seen: dict[tuple[float, float], int] = {}
    for i, w in enumerate(ways):
        for p in way_points(w):
            if p in seen:
                parent[find(i)] = find(seen[p])
            else:
                seen[p] = i
    groups: dict[int, list[dict]] = {}
    for i, w in enumerate(ways):
        groups.setdefault(find(i), []).append(w)
    return list(groups.values())


def midpoint(ways: list[dict]) -> tuple[float, float]:
    pts = [p for w in ways for p in way_points(w)]
    return pts[len(pts) // 2]


def entry(name: str, ways: list[dict], **extra) -> dict:
    lat, lon = midpoint(ways)
    return {"name": name, **extra, "lat": round(lat, 6), "lon": round(lon, 6), "osmId": ways[0]["id"]}


# Tipi di via percorribili a piedi da chiunque: escluse le strade di servizio (porto, cantieri)
WALKABLE = {"footway", "pedestrian", "steps", "path", "living_street", "corridor", "residential"}


def is_public_walk(w: dict) -> bool:
    tags = w.get("tags", {})
    return tags.get("highway") in WALKABLE and tags.get("access") not in ("private", "no")


def walk_span(ways: list[dict]) -> float:
    """Percorso più lungo fra due estremi della via lungo i suoi tratti (due passate di Dijkstra: esatto sugli alberi).
    A differenza della somma dei tratti non conta due volte rami e percorsi paralleli."""
    graph: dict[tuple[float, float], list[tuple[tuple[float, float], float]]] = {}
    for w in ways:
        pts = way_points(w)
        for a, b in zip(pts, pts[1:]):
            d = haversine(a, b)
            graph.setdefault(a, []).append((b, d))
            graph.setdefault(b, []).append((a, d))

    def farthest(start: tuple[float, float]) -> tuple[tuple[float, float], float]:
        dist = {start: 0.0}
        heap = [(0.0, start)]
        while heap:
            d, p = heapq.heappop(heap)
            if d > dist[p]:
                continue
            for q, w in graph[p]:
                if d + w < dist.get(q, math.inf):
                    dist[q] = d + w
                    heapq.heappush(heap, (d + w, q))
        node = max(dist, key=dist.get)
        return node, dist[node]

    if not graph:
        return 0.0
    a, _ = farthest(next(iter(graph)))
    _, d = farthest(a)
    return d


def span(ways: list[dict]) -> float:
    """Distanza in linea d'aria fra i due punti più lontani (lunghezza di un ponte, anche con rampe parallele)."""
    pts = list({p for w in ways for p in way_points(w)})
    return max((haversine(a, b) for i, a in enumerate(pts) for b in pts[i + 1:]), default=0.0)


def longest_named(ways: list[dict], prefixes: tuple[str, ...]) -> list[dict]:
    """Vie più lunghe il cui nome inizia con uno dei prefissi, unendo i tratti contigui con lo stesso nome."""
    by_name: dict[str, list[dict]] = {}
    for w in ways:
        name = w.get("tags", {}).get("name", "")
        if name.startswith(prefixes) and not w["tags"].get("bridge") and is_public_walk(w):
            by_name.setdefault(name, []).append(w)
    out = []
    for name, group in by_name.items():
        for comp in components(group):
            out.append(entry(name, comp, meters=round(walk_span(comp))))
    return sorted(out, key=lambda e: -e["meters"])[:TOP]


def narrowest(ways: list[dict]) -> list[dict]:
    """Vie con nome e larghezza mappata, dalla più stretta (un nome una volta sola)."""
    best: dict[str, dict] = {}
    for w in ways:
        name = w.get("tags", {}).get("name")
        width = parse_width(w.get("tags", {}).get("width"))
        if not name or width is None or width <= 0 or w["tags"].get("bridge"):
            continue
        if name not in best or width < best[name]["widthM"]:
            best[name] = entry(name, [w], widthM=width)
    return sorted(best.values(), key=lambda e: e["widthM"])[:TOP]


def bridges(ways: list[dict]) -> list[list[dict]]:
    """Ponti: tratti con bridge=* contigui fra loro (un ponte può essere fatto di più tratti, gradini compresi)."""
    return components([w for w in ways if w.get("tags", {}).get("bridge") and w["tags"]["bridge"] != "no"])


def bridge_gaps(ways: list[dict], bridge_groups: list[list[dict]]) -> list[float]:
    """Per ogni ponte, distanza a piedi lungo la rete fino al ponte diverso più vicino (Dijkstra da tutti i ponti)."""
    graph: dict[tuple[float, float], list[tuple[tuple[float, float], float]]] = {}
    for w in ways:
        pts = way_points(w)
        for a, b in zip(pts, pts[1:]):
            d = haversine(a, b)
            graph.setdefault(a, []).append((b, d))
            graph.setdefault(b, []).append((a, d))
    owner: dict[tuple[float, float], int] = {}
    for i, group in enumerate(bridge_groups):
        for w in group:
            for p in way_points(w):
                owner[p] = i
    # Dijkstra multi-sorgente: ogni nodo prende la distanza dal ponte più vicino e quale ponte è
    dist: dict[tuple[float, float], float] = {}
    src: dict[tuple[float, float], int] = {}
    heap = [(0.0, p, i) for p, i in owner.items()]
    heapq.heapify(heap)
    while heap:
        d, p, i = heapq.heappop(heap)
        if p in dist:
            continue
        dist[p], src[p] = d, i
        for q, w in graph.get(p, []):
            if q not in dist:
                heapq.heappush(heap, (d + w, q, i))
    # due regioni di ponti diversi che si toccano su un arco: il percorso fra i due ponti passa di lì
    gap = [math.inf] * len(bridge_groups)
    for a, edges in graph.items():
        for b, w in edges:
            if a in src and b in src and src[a] != src[b]:
                d = dist[a] + w + dist[b]
                gap[src[a]] = min(gap[src[a]], d)
                gap[src[b]] = min(gap[src[b]], d)
    return gap


def build(payload: dict) -> dict:
    ways = [w for w in payload.get("elements", []) if w.get("type") == "way" and w.get("geometry")]
    if len(ways) < MIN_WAYS:
        raise ValueError(f"risposta incompleta: {len(ways)} vie")
    # ponti e distanze solo sulla rete pedonale pubblica: fuori i ponti stradali (Tronchetto) e le vie private
    walk = [w for w in ways if is_public_walk(w)]
    groups = bridges(walk)
    if len(groups) < MIN_BRIDGES:
        raise ValueError(f"risposta incompleta: {len(groups)} ponti")
    gaps = bridge_gaps(walk, groups)
    finite = [(g, i) for i, g in enumerate(gaps) if math.isfinite(g)]
    # ponti con un nome «Ponte …», una volta sola per nome, lunghezza da un estremo all'altro
    by_bridge: dict[str, dict] = {}
    for g in groups:
        name = next((w["tags"]["name"] for w in g if w["tags"].get("name", "").startswith("Ponte ")), None)
        if name:
            e = entry(name, g, meters=round(span(g)))
            if name not in by_bridge or e["meters"] > by_bridge[name]["meters"]:
                by_bridge[name] = e
    longest_bridges = sorted(by_bridge.values(), key=lambda e: -e["meters"])[:TOP]
    far_gap, far_i = max(finite)
    near_gap, near_i = min(finite)
    bridge_name = lambda i: next((w["tags"]["name"] for w in groups[i] if w["tags"].get("name")), None)  # noqa: E731
    with_width = sum(1 for w in ways if w.get("tags", {}).get("name") and parse_width(w["tags"].get("width")) is not None)
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "OpenStreetMap contributors",
        "sourceUrl": "https://www.openstreetmap.org/copyright",
        "license": "ODbL 1.0",
        "attribution": "© OpenStreetMap contributors",
        "area": "Centro storico di Venezia con Giudecca, San Giorgio, Tronchetto e Sant'Elena",
        "counts": {
            "ways": len(ways),
            "named": sum(1 for w in ways if w.get("tags", {}).get("name")),
            "withWidth": with_width,
            "bridges": len(groups),
            "sotoporteghi": len({w["tags"]["name"] for w in ways if re.match(r"^So(t)?toportego", w.get("tags", {}).get("name", ""))}),
        },
        "narrowest": narrowest(walk),
        "longestCalli": longest_named(ways, ("Calle ",)),
        "longestFondamente": longest_named(ways, ("Fondamenta ", "Riva ", "Zattere")),
        "longestBridges": longest_bridges,
        "bridgeGap": {
            "medianM": round(statistics.median(g for g, _ in finite)),
            "meanM": round(statistics.mean(g for g, _ in finite)),
            "closest": {**entry(bridge_name(near_i) or "ponte senza nome", groups[near_i]), "meters": round(near_gap)},
            "farthest": {**entry(bridge_name(far_i) or "ponte senza nome", groups[far_i]), "meters": round(far_gap)},
        },
        "note": (
            "Calcolato dalle vie pedonali pubbliche di OpenStreetMap. La larghezza è mappata solo su una parte delle calli: "
            "la più stretta è la più stretta fra quelle misurate. Lunghezza di calli e fondamenta: il percorso più lungo da un "
            "capo all'altro unendo i tratti contigui con lo stesso nome; dei ponti: da un estremo all'altro. "
            "Distanza fra ponti: a piedi lungo la rete, dal ponte al ponte diverso più vicino."
        ),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("--file", help="risposta Overpass salvata (JSON)")
    args = ap.parse_args()
    payload = json.load(open(args.file, encoding="utf-8")) if args.file else overpass(QUERY, timeout=200)
    try:
        data = build(payload)
    except ValueError as e:
        logging.error("%s: il file esistente non viene sovrascritto", e)
        return 1
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write("\n")
    logging.info("Curiosità: %d vie, %d ponti, %s", data["counts"]["ways"], data["counts"]["bridges"], OUT)
    return 0


if __name__ == "__main__":
    sys.exit(main())
