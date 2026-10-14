"""
VOD - Venice Open Data
Rete dei canali per il planner «In barca (mezzo privato)»: tracciati e incroci dei canali da OpenStreetMap,
con le regole di circolazione del Testo Unico del Comune di Venezia collegate ai tratti.

- Tracciati: waterway=canal|river|fairway|tidal_channel di OpenStreetMap (ODbL). Il file dei canali già
  in VOD (osm-waterways.json) è semplificato e senza incroci: qui servono i nodi condivisi tra i canali.
- Regole: Ordinanza 274/2015 «Testo Unico della circolazione acquea nella ZTL» (atto pubblico del Comune),
  art. 2 c.3 (Rii Blu, solo remi), art. 7 (sensi unici), art. 8 (divieti alle unità a motore),
  art. 20 (Canal Grande vietato al diporto nei feriali 8-12). OpenStreetMap ha solo pochi sensi unici:
  le regole sono trascritte a mano dall'atto e collegate ai tratti con punti di riferimento.
  Ogni regola è un percorso dal primo all'ultimo punto (nella direzione consentita per i sensi unici),
  calcolato sul grafo preferendo i canali con i nomi indicati.

Non per la navigazione: fanno fede gli atti vigenti e la segnaletica.
Scrive web/public/data/boat-<hash>.json e web/src/lib/boat-data.ts.

Uso: python import_osm_boat.py [--file risposta_overpass.json]
"""

import argparse
import heapq
import json
import logging
import math
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone

from export_simulation_data import write_hashed_json
from import_osm_waterways import simplify
from vod_http import overpass

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TS_FILE = os.path.join(BASE_DIR, "..", "web", "src", "lib", "boat-data.ts")

# Laguna nord e centrale: centro storico, isole, Lido, Mestre (sud, nord, ovest, est)
BBOX = (45.36, 12.22, 45.52, 12.47)
QUERY = (
    f'[out:json][timeout:240];way["waterway"~"^(canal|river|fairway|tidal_channel)$"]({BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]});'
    "out body geom;"
)
LON0, LAT0 = BBOX[1], BBOX[0]
SCALE = 100_000
SIMPLIFY_M = 3.0
SPLIT_M = 150
MIN_COMPONENT_M = 20_000
MIN_EDGES = 1500

TU_URL = "https://www.comune.venezia.it/it/content/normativa-circolazione-acquea"
TU_REF = "Testo Unico della circolazione acquea (Ord. 274/2015)"

# Fasce orarie (minuti dalla mezzanotte) e giorni: feriali = lunedì-sabato, lunven = lunedì-venerdì
ALL_DAY = None

# Regole trascritte dal Testo Unico. paths: tratti, ciascuno una lista di punti dal primo all'ultimo (nel senso
# consentito per i sensi unici); un punto è [lon, lat] oppure {"at": [canale, canale]}, l'incrocio tra due canali OSM.
# names: canali OSM da preferire per collegare i punti; senza paths la regola vale per tutti i tratti con quei nomi.
# I nomi OSM sono in veneziano: Rio della Guerra = Rio de San Zuilian, Sant'Isepo = Rio San Giuseppe,
# Sant'Anzolo = Rio di Sant'Angelo, Canal Grande di Murano = Canale degli Angeli.
RULES = [
    # --- art. 7: sensi unici ---
    {"id": "ow-apostoli", "kind": "oneway", "ref": "art. 7 c.1 lett. a",
     "label": "Rio dei SS. Apostoli: senso unico dal Canal Grande verso il Rio di Sant'Andrea – Gozzi",
     "names": ["Rio dei Santi Apostoli"], "paths": [[{"at": ["Rio dei Santi Apostoli", "Canal Grande"]}, {"at": ["Rio dei Santi Apostoli", "Rio del Gozzi"]}]]},
    {"id": "ow-grisostomo", "kind": "oneway", "ref": "art. 7 c.1 lett. b",
     "label": "Rio di San Giovanni Grisostomo: senso unico dal Rio del Malibran (San Lio) verso il Canal Grande",
     "names": ["Rio San Giovanni Grisostomo"], "paths": [[{"at": ["Rio San Giovanni Grisostomo", "Rio de San Lio"]}, {"at": ["Rio San Giovanni Grisostomo", "Canal Grande"]}]]},
    {"id": "ow-malibran", "kind": "oneway", "ref": "art. 7 c.1 lett. c",
     "label": "Rio del Malibran – Santa Marina – San Giovanni Laterano: senso unico dal Rio del Fontego dei Tedeschi – Fava verso il Rio di San Lorenzo",
     "names": ["Rio de San Lio", "Rio de Santa Marina", "Rio de San Giovanni Laterano"], "paths": [[{"at": ["Rio de San Lio", "Rio de la Fava"]}, {"at": ["Rio de Santa Marina", "Rio dei Mendicanti"]}], [{"at": ["Rio de San Giovanni Laterano", "Rio de la Tetta"]}, {"at": ["Rio de San Giovanni Laterano", "Rio di San Lorenzo"]}]]},
    {"id": "ow-sanluca", "kind": "oneway", "ref": "art. 7 c.1 lett. d",
     "label": "Rio di San Luca – Barcaroli – San Moisè: senso unico dal Canal Grande (Palazzo Grimani) verso il Canal Grande (Hotel Bauer)",
     "names": ["Rio San Luca", "Rio dei Barcaroli", "Rio di San Moisè"], "paths": [[{"at": ["Rio San Luca", "Canal Grande"]}, {"at": ["Rio di San Moisè", "Canal Grande"]}]]},
    {"id": "ow-palazzo", "kind": "oneway", "ref": "art. 7 c.1 lett. e",
     "label": "Rio di Palazzo (Canonica) – della Guerra – della Fava: senso unico dal Bacino San Marco verso il Rio del Fontego dei Tedeschi",
     "names": ["Rio del Palazzo", "Rio de San Zuilian", "Rio de la Fava"], "paths": [[{"at": ["Rio del Palazzo", "Bacino San Marco"]}, {"at": ["Rio de la Fava", "Rio del Fontego dei Tedeschi"]}]]},
    {"id": "ow-fuseri", "kind": "oneway", "ref": "art. 7 c.1 lett. f",
     "label": "Rio dei Fuseri – Scoacamini – Bareteri: senso unico dal Rio di San Luca verso il Rio della Guerra",
     "names": ["Rio dei Fuseri", "Rio dei Scoacamini", "Rio dei Bareteri"], "paths": [[{"at": ["Rio dei Fuseri", "Rio San Luca"]}, {"at": ["Rio dei Bareteri", "Rio de San Zuilian"]}]]},
    {"id": "ow-antonin", "kind": "oneway", "ref": "art. 7 c.1 lett. g",
     "label": "Rio di Sant'Antonin – Pietà: senso unico dal Rio di Santa Giustina verso il Bacino San Marco",
     "names": ["Rio di San Antonin", "Rio de la Pietà"], "paths": [[{"at": ["Rio di San Antonin", "Rio de Santa Giustina"]}, [12.34535, 45.4337]]]},
    {"id": "ow-greci", "kind": "oneway", "ref": "art. 7 c.1 lett. h",
     "label": "Rio dei Greci – San Lorenzo: senso unico dal Bacino San Marco verso il Rio di Santa Giustina",
     "names": ["Rio dei Greci", "Rio di San Lorenzo"], "paths": [[{"at": ["Rio dei Greci", "Bacino San Marco"]}, {"at": ["Rio de Santa Giustina", "Rio di San Antonin"]}]]},
    {"id": "ow-isepo", "kind": "oneway", "ref": "art. 7 c.1 lett. i",
     "label": "Rio di Sant'Isepo: senso unico dal Rio di San Pietro – Giardini verso il Bacino San Marco",
     "names": ["Rio San Giuseppe"], "paths": [[{"at": ["Rio San Giuseppe", "Rio dei Giardini"]}, {"at": ["Rio San Giuseppe", "Bacino San Marco"]}]]},
    {"id": "ow-tetta", "kind": "oneway", "ref": "art. 7 c.1 lett. j",
     "label": "Rio de la Tetta: senso unico dal Rio dei Greci – San Lorenzo verso il Rio di San Severo",
     "names": ["Rio de la Tetta"], "paths": [[{"at": ["Rio de la Tetta", "Rio di San Lorenzo"]}, {"at": ["Rio de la Tetta", "Rio de San Severo"]}]]},
    {"id": "ow-tana", "kind": "oneway", "ref": "art. 7 c.1 lett. k",
     "label": "Rio della Tana: senso unico dal Bacino San Marco verso il Rio delle Vergini – San Gerolamo",
     "names": ["Rio della Tana"], "paths": [[{"at": ["Rio della Tana", "Bacino San Marco"]}, {"at": ["Rio della Tana", "Rio de San Gerolamo"]}]]},
    {"id": "ow-novo", "kind": "oneway", "ref": "art. 7 c.1 lett. l", "hours": [0, 720],
     "label": "Rio Novo – Ca' Foscari, dalle 0 alle 12: senso unico da Piazzale Roma (ponte della Cereria) verso il Canal Grande",
     "names": ["Rio Novo", "Rio de Ca' Foscari"], "paths": [[{"at": ["Rio Novo", "Canal Grande"]}, {"at": ["Rio de Ca' Foscari", "Canal Grande"]}]]},
    {"id": "ow-marin", "kind": "oneway", "ref": "art. 7 c.1 lett. m",
     "label": "Rio Marin – San Giacomo dall'Orio: senso unico dal Canal Grande verso il Rio di Sant'Agostin",
     "names": ["Rio Marin", "Rio de S. Giacomo dell'Orio"], "paths": [[{"at": ["Rio Marin", "Canal Grande"]}, {"at": ["Rio de S. Giacomo dell'Orio", "Rio San Agostin"]}]]},
    {"id": "ow-noale", "kind": "oneway", "ref": "art. 7 c.1 lett. n",
     "label": "Rio di Noale: senso unico dal Rio di Santa Fosca verso il Canal Grande",
     "names": ["Rio di Noale"], "paths": [[{"at": ["Rio di Noale", "Rio di Santa Fosca"]}, {"at": ["Rio di Noale", "Canal Grande"]}]]},
    {"id": "ow-marcuola", "kind": "oneway", "ref": "art. 7 c.1 lett. o",
     "label": "Rio di San Marcuola: senso unico dal Canal Grande verso il Rio dei Servi",
     "names": ["Rio de San Marcuola"], "paths": [[{"at": ["Rio de San Marcuola", "Canal Grande"]}, {"at": ["Rio de San Marcuola", "Rio dei Servi"]}]]},
    {"id": "ow-degola", "kind": "oneway", "ref": "art. 7 c.1 lett. p",
     "label": "Rio di San Zan Degolà: senso unico dal Rio di Sant'Agostin verso il Canal Grande",
     "names": ["Rio de San Zan Degolà"], "paths": [[{"at": ["Rio de San Zan Degolà", "Rio San Agostin"]}, {"at": ["Rio de San Zan Degolà", "Canal Grande"]}]]},
    {"id": "ow-trovaso", "kind": "oneway", "ref": "art. 7 c.1 lett. q",
     "label": "Rio di San Trovaso: senso unico dal Rio di Ognissanti verso il Rio della Toletta",
     "names": ["Rio de San Trovaso"], "paths": [[{"at": ["Rio de San Trovaso", "Rio de Ognisanti"]}, {"at": ["Rio de San Trovaso", "Rio de la Toletta"]}]]},
    {"id": "ow-vio", "kind": "oneway", "ref": "art. 7 c.1 lett. r",
     "label": "Rio di San Vio: senso unico dal Canal Grande verso il Canale della Giudecca",
     "names": ["Rio de San Vio"], "paths": [[{"at": ["Rio de San Vio", "Canal Grande"]}, {"at": ["Rio de San Vio", "Canale della Giudecca"]}]]},
    {"id": "ow-vetrai", "kind": "oneway", "ref": "art. 7 c.1 lett. s", "hours": [480, 840], "days": "feriali",
     "label": "Rio dei Vetrai (Murano), feriali dalle 8 alle 14: senso unico dalla laguna verso il Canal Grande di Murano",
     "names": ["Rio dei Vetrai"], "paths": [[{"at": ["Rio dei Vetrai", "Canal la Nave"]}, {"at": ["Rio dei Vetrai", "Canale degli Angeli"]}]]},
    # --- art. 8: divieti alle unità a motore ---
    {"id": "nm-arsenale", "kind": "noMotor", "ref": "art. 8 c.1 lett. a",
     "label": "Rio dell'Arsenale: vietato alle unità a motore (salvo servizi ai residenti vicini e concessionari nei rii San Martin e Arsenale)",
     "names": ["Rio dell'Arsenale"], "paths": []},
    {"id": "nm-felice", "kind": "noMotor", "ref": "art. 8 c.1 lett. b",
     "label": "Rio di San Felice: vietato alle unità a motore (salvo concessionari nel rio)",
     "names": ["Rio de San Felice"], "paths": []},
    {"id": "nm-miracoli", "kind": "noMotor", "ref": "art. 8 c.1 lett. c",
     "label": "Rio dei Miracoli: vietato alle unità a motore (salvo frontisti e concessionari nel rio)",
     "names": ["Rio dei Miracoli"], "paths": []},
    {"id": "nm-vin", "kind": "noMotor", "ref": "art. 8 c.1 lett. d",
     "label": "Rio del Vin: solo unità a remi, esclusi i primi 50 m dal Bacino San Marco",
     "names": ["Rio del Vin"], "paths": []},
    {"id": "nm-pieta", "kind": "noMotor", "ref": "art. 8 c.1 lett. e",
     "label": "Rio della Pietà – Sant'Antonin: vietato alle unità a motore (salvo concessionari nei rii)",
     "names": ["Rio di San Antonin", "Rio de la Pietà"], "paths": []},
    {"id": "nm-salvador", "kind": "noMotor", "ref": "art. 8 c.1 lett. f",
     "label": "Rio di San Salvador: riservato alle unità a remi",
     "names": ["Rio de San Salvador"], "paths": []},
    {"id": "nm-orseolo", "kind": "noMotor", "ref": "art. 8 c.1 lett. g",
     "label": "Bacino Orseolo fino al Ponte Tron: solo unità a remi (salvo taxi, noleggio e bagagli autorizzati)",
     "names": ["Bacino Orseolo", "Rio Orseolo"], "paths": []},
    # --- art. 2 c.3: Rii Blu, riservati alle unità a remi ---
    {"id": "nm-riiblu", "kind": "noMotor", "ref": "art. 2 c.3",
     "label": "Rii Blu: riservati alle unità a remi (Zecchini, Trasti, Lustraferri, Grimani-Moro, Maddalena, Do Torri, San Cassian, Madonetta, Ca' Corner, Sant'Anzolo, Santissimo, Malatin, San Maurizio, Torreselle)",
     "names": ["Rio degli Zecchini", "Rio dei Trasti", "Rio Grimani", "Rio della Maddalena", "Rio de le Do Torre o de S. Maria Mater Domini",
               "Rio San Cassian", "Rio de la Madoneta", "Rio de Ca' Corner", "Rio di Sant'Angelo", "Rio del Santissimo",
               "Rio San Maurizio - Malatin", "Rio de le Toresele"], "paths": []},
    # --- art. 20: Canal Grande vietato al diporto nei feriali dal lunedì al venerdì, 8-12 ---
    {"id": "np-cg-ovest", "kind": "noPleasure", "ref": "art. 20", "hours": [480, 720], "days": "lunven",
     "label": "Canal Grande tra Rio Novo e Rio Marin: vietato al diporto dal lunedì al venerdì dalle 8 alle 12 (salvo concessioni nel tratto)",
     "names": ["Canal Grande"], "paths": [[{"at": ["Canal Grande", "Rio Novo"]}, {"at": ["Canal Grande", "Rio Marin"]}]]},
    {"id": "np-cg-rialto", "kind": "noPleasure", "ref": "art. 20", "hours": [480, 720], "days": "lunven",
     "label": "Canal Grande tra Rio del Fontego dei Tedeschi e Rio di San Salvador: vietato al diporto dal lunedì al venerdì dalle 8 alle 12 (salvo concessioni nel tratto)",
     "names": ["Canal Grande"], "paths": [[{"at": ["Canal Grande", "Rio del Fontego dei Tedeschi"]}, {"at": ["Canal Grande", "Rio de San Salvador"]}]]},
]


def meters(a, b) -> float:
    k = math.cos(math.radians((a[1] + b[1]) / 2)) * 111320
    return math.hypot((b[0] - a[0]) * k, (b[1] - a[1]) * 110540)


def maxspeed_kmh(value: str | None) -> float | None:
    """maxspeed di OSM in km/h ("11", "5 knots"); None se assente o non leggibile."""
    m = re.fullmatch(r"\s*(\d+(?:\.\d+)?)\s*(knots|kn|mph|km/h)?\s*", value or "")
    if not m:
        return None
    v = float(m.group(1))
    unit = m.group(2)
    return round(v * 1.852, 1) if unit in ("knots", "kn") else round(v * 1.609, 1) if unit == "mph" else v


def build_graph(payload: dict) -> dict:
    """Grafo dei canali: nodi agli incroci e alle estremità, archi con lunghezza, nome e geometria."""
    ways = []
    for el in payload.get("elements", []):
        if el.get("type") != "way" or len(el.get("nodes", [])) < 2 or len(el.get("geometry", [])) != len(el["nodes"]):
            continue
        el = {**el, "nodes": list(el["nodes"])}
        tags = el.get("tags", {})
        if tags.get("boat") == "no" or tags.get("tunnel") in ("yes", "culvert") or tags.get("motorboat") == "no" and tags.get("boat") != "yes":
            continue
        ways.append(el)
    coords = {}
    use = Counter()
    for w in ways:
        for nid, g in zip(w["nodes"], w["geometry"]):
            coords[nid] = (g["lon"], g["lat"])
        use.update(w["nodes"])
        use[w["nodes"][0]] += 1
        use[w["nodes"][-1]] += 1
    # tratti rettilinei lunghi (canali lagunari, bacini): punti intermedi con id negativi, per agganciare i punti all'acqua
    synthetic = 0
    for w in ways:
        expanded = [w["nodes"][0]]
        for prev, nid in zip(w["nodes"], w["nodes"][1:]):
            a, b = coords[prev], coords[nid]
            pieces = int(meters(a, b) // SPLIT_M)
            for k in range(1, pieces + 1):
                synthetic -= 1
                t = k / (pieces + 1)
                coords[synthetic] = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
                expanded.append(synthetic)
            expanded.append(nid)
        w["nodes"] = expanded
    junction = {n for n, c in use.items() if c >= 2}

    index: dict[int, int] = {}
    node_xy: list = []
    edges: list = []  # (a, b, length, name, inner, maxspeed km/h o None)

    def node(osm_id: int) -> int:
        if osm_id not in index:
            index[osm_id] = len(node_xy)
            node_xy.append(coords[osm_id])
        return index[osm_id]

    seen = set()
    for w in ways:
        nodes = w["nodes"]
        name = (w.get("tags", {}).get("name") or "").strip() or None
        kmh = maxspeed_kmh(w.get("tags", {}).get("maxspeed"))
        start, run = 0, 0.0
        for i in range(1, len(nodes)):
            run += meters(coords[nodes[i - 1]], coords[nodes[i]])
            # nodi agli incroci e almeno ogni SPLIT_M metri: i punti si agganciano all'acqua vicina
            if nodes[i] not in junction and i < len(nodes) - 1 and run < SPLIT_M:
                continue
            seg = nodes[start:i + 1]
            start, run = i, 0.0
            if len(seg) < 2 or seg[0] == seg[-1]:
                continue
            key = (min(seg[0], seg[-1]), max(seg[0], seg[-1]), len(seg))
            if key in seen:
                continue
            seen.add(key)
            pts = [coords[n] for n in seg]
            length = sum(meters(pts[k], pts[k + 1]) for k in range(len(pts) - 1))
            inner = simplify([list(p) for p in pts], SIMPLIFY_M)[1:-1]
            edges.append((node(seg[0]), node(seg[-1]), length, name, inner, kmh))

    # Componenti connesse: si tengono quelle con almeno MIN_COMPONENT_M metri di canali
    adj = defaultdict(list)
    for e, (a, b, *_rest) in enumerate(edges):
        adj[a].append(e)
        adj[b].append(e)
    comp = [-1] * len(node_xy)
    comp_len: list[float] = []
    for s in range(len(node_xy)):
        if comp[s] != -1:
            continue
        cid = len(comp_len)
        comp[s] = cid
        stack, total = [s], 0.0
        while stack:
            u = stack.pop()
            for e in adj[u]:
                a, b, length = edges[e][0], edges[e][1], edges[e][2]
                v = b if a == u else a
                if comp[v] == -1:
                    comp[v] = cid
                    stack.append(v)
        comp_len.append(0.0)
    for a, _b, length, *_ in edges:
        comp_len[comp[a]] += length
    keep_edges = [e for e, (a, *_r) in enumerate(edges) if comp_len[comp[a]] >= MIN_COMPONENT_M]
    used = sorted({edges[e][0] for e in keep_edges} | {edges[e][1] for e in keep_edges})
    remap = {old: new for new, old in enumerate(used)}
    return {
        "nodes": [node_xy[i] for i in used],
        "edges": [(remap[edges[e][0]], remap[edges[e][1]], *edges[e][2:]) for e in keep_edges],
    }


def nearest_node(nodes, p) -> tuple[int, float]:
    best, best_d = -1, math.inf
    for i, q in enumerate(nodes):
        d = meters(p, q)
        if d < best_d:
            best, best_d = i, d
    return best, best_d


def path_between(graph: dict, src: int, dst: int, names: set) -> list[tuple[int, int]] | None:
    """Percorso più breve src → dst come lista di (arco, verso: 1 = a→b, -1 = b→a), preferendo i canali `names`."""
    adj = defaultdict(list)
    for e, (a, b, length, name, *_rest) in enumerate(graph["edges"]):
        w = length * (0.3 if name in names else 1.0 if name is None else 4.0)
        adj[a].append((b, e, 1, w))
        adj[b].append((a, e, -1, w))
    dist = {src: 0.0}
    via: dict[int, tuple[int, int, int]] = {}
    heap = [(0.0, src)]
    while heap:
        d, u = heapq.heappop(heap)
        if u == dst:
            break
        if d > dist.get(u, math.inf):
            continue
        for v, e, sign, w in adj[u]:
            nd = d + w
            if nd < dist.get(v, math.inf):
                dist[v] = nd
                via[v] = (u, e, sign)
                heapq.heappush(heap, (nd, v))
    if dst not in dist:
        return None
    out = []
    u = dst
    while u != src:
        p, e, sign = via[u]
        out.append((e, sign))
        u = p
    return out[::-1]


def junction(graph: dict, a: str, b: str) -> int | None:
    """Nodo in cui si incontrano i canali OSM `a` e `b` (il primo trovato)."""
    seen: dict[int, set] = defaultdict(set)
    for ea, eb, _length, name, *_rest in graph["edges"]:
        if name in (a, b):
            seen[ea].add(name)
            seen[eb].add(name)
    for node, names in seen.items():
        if names == {a, b}:
            return node
    return None


def resolve_point(graph: dict, spec, max_snap_m: float) -> int | None:
    if isinstance(spec, dict):
        return junction(graph, *spec["at"])
    node, d = nearest_node(graph["nodes"], spec)
    return node if d <= max_snap_m else None


def resolve_rules(graph: dict, rules: list, max_snap_m: float = 60) -> tuple[list, list]:
    """Archi di ogni regola: percorso tra punti consecutivi di ogni tratto; senza tratti, tutti gli archi con quei nomi."""
    resolved, missing = [], []
    for r in rules:
        names = set(r.get("names", []))
        edges: list[int] = []
        ok = True
        for seg in r.get("paths", []):
            nodes = [resolve_point(graph, p, max_snap_m) for p in seg]
            if any(n is None for n in nodes):
                ok = False
                break
            for a, b in zip(nodes, nodes[1:]):
                path = path_between(graph, a, b, names)
                if not path:
                    ok = False
                    break
                # senso unico: arco consentito solo nel verso del percorso (codifica: e per a→b, ~e per b→a)
                edges += [e if sign == 1 else ~e for e, sign in path]
        if not r.get("paths") and r["kind"] != "oneway":
            edges = [e for e, edge in enumerate(graph["edges"]) if edge[3] in names]
        if not ok or not edges:
            missing.append(r["id"])
            continue
        out = {k: r[k] for k in ("id", "kind", "ref", "label") if k in r}
        if r.get("hours"):
            out["hours"] = r["hours"]
        if r.get("days"):
            out["days"] = r["days"]
        out["edges"] = sorted(set(edges), key=lambda x: x if x >= 0 else ~x)
        resolved.append(out)
    return resolved, missing


def encode(graph: dict) -> dict:
    names: list[str] = []
    name_index: dict[str, int] = {}
    nodes_out = [v for lon, lat in graph["nodes"] for v in (round((lon - LON0) * SCALE), round((lat - LAT0) * SCALE))]
    edges_out, geom_out = [], []
    for a, b, length, name, inner, kmh in graph["edges"]:
        ni = -1
        if name:
            if name not in name_index:
                name_index[name] = len(names)
                names.append(name)
            ni = name_index[name]
        edges_out += [a, b, round(length * 10), ni, round((kmh or 0) * 10)]
        geom_out.append([v for p in inner for v in (round((p[0] - LON0) * SCALE), round((p[1] - LAT0) * SCALE))])
    return {"nodes": nodes_out, "edges": edges_out, "names": names, "geom": geom_out}


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
    graph = build_graph(payload)
    if len(graph["edges"]) < MIN_EDGES:
        logging.error("Rete dei canali incompleta (%d archi): file non aggiornato", len(graph["edges"]))
        return 1
    rules, missing = resolve_rules(graph, RULES)
    if missing:
        logging.warning("Regole senza tratti riconosciuti: %s", ", ".join(missing))
    data = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "OpenStreetMap (Overpass API) – canali; regole dal " + TU_REF,
        "license": "ODbL 1.0 (tracciati); atto pubblico del Comune di Venezia (regole)",
        "attribution": "© OpenStreetMap contributors",
        "rulesSource": TU_REF,
        "rulesUrl": TU_URL,
        "origin": [LON0, LAT0],
        "scale": SCALE,
        # archi: [nodo a, nodo b, lunghezza in dm, indice del nome (-1 senza nome), maxspeed OSM in decimi di km/h (0 se assente)]
        **encode(graph),
        # archi delle regole: e = consentito solo da a verso b (sensi unici), ~e = solo da b verso a
        "rules": rules,
    }
    url = write_hashed_json("boat", data)
    stats = {"nodes": len(graph["nodes"]), "edges": len(graph["edges"]), "rules": len(rules), "generatedAt": data["generatedAt"]}
    with open(TS_FILE, "w", encoding="utf-8") as fh:
        fh.write(
            "// Generato da pipeline/import_osm_boat.py: canali OpenStreetMap (ODbL) e regole del Testo Unico per il planner in barca.\n"
            f'export const BOAT_URL = "{url}";\n'
            f"export const BOAT_STATS = {json.dumps(stats)};\n"
        )
    logging.info("Rete dei canali: %s -> %s", stats, url)
    return 0


if __name__ == "__main__":
    sys.exit(main())
