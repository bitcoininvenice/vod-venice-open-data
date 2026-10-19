#!/usr/bin/env python3
"""
VOD - Venice Open Data
Edifici del centro storico e delle isole (2D / 3D) con le sagome reali di OpenStreetMap.

Fonti:
- OpenStreetMap (ODbL 1.0): sagome degli edifici (building=*), nome, piani (building:levels), altezza (height),
  data (start_date), tutela (heritage) e collegamento a Wikidata;
- Wikidata (CC0 1.0): anno di costruzione o fondazione (P571), stile (P149), altezza (P2048), piani (P1101),
  architetto (P84) per gli edifici collegati (tag wikidata) o con le coordinate dentro la sagoma;
- ISTAT 2021 (CC BY 4.0): contesto statistico del centro storico.

Onestà del dato: nessuna sagoma generata, nessuna data, altezza o architetto inventati. Anno, piani e altezza
solo se documentati; gli altri edifici restano grigi («anno non documentato in open data»).

Uso: python import_osm_buildings.py [--osm data/osm_buildings_raw.json] [--refresh-wikidata]
Output:
  - web/public/data/buildings-<hash>.json
  - web/src/lib/buildings-data.ts
"""
from __future__ import annotations

import argparse
import json
import logging
import math
import os
import re
import sys
from collections import Counter
from datetime import datetime, timezone

from export_simulation_data import FRAME, H, W, write_hashed_json
from vod_http import fetch_json, overpass

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_DIR = os.path.join(BASE_DIR, "..", "web")
TS_FILE = os.path.join(WEB_DIR, "src", "lib", "buildings-data.ts")

WIKIDATA_CACHE = os.path.join(BASE_DIR, "data", "wikidata_venice_buildings.json")

LON0, LON1, LAT0, LAT1 = FRAME
KX = W / (LON1 - LON0)
KY = H / (LAT1 - LAT0)
GRID_SCALE = 10  # decimetri di unità griglia (~10 cm)

# Riquadro insulare veneziano (centro storico, Giudecca, San Giorgio, Sant'Elena, Murano, Burano, Torcello, Lido nord)
BBOX_LAT = (45.400, 45.505)
BBOX_LON = (12.302, 12.430)

ROMAN_CENTURIES = {
    "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10,
    "XI": 11, "XII": 12, "XIII": 13, "XIV": 14, "XV": 15, "XVI": 16, "XVII": 17, "XVIII": 18,
    "XIX": 19, "XX": 20, "XXI": 21,
}

# Esclude entità Wikidata non edilizie (dipinti, persone, eventi, libri, ponti già in altro layer, ecc.)
EXCLUDED_NAME_PREFIXES = (
    "dipinto", "ritratto", "madonna ", "annunciazione", "assunzione", "crocifissione",
    "ultima cena", "battesimo ", "miracolo ", "storie di ", "pala ", "polittico ", "trittico ",
    "statua ", "monumento a ", "busto di ", "leone di ", "colonna ",
    "battaglia ", "assedio ", "trattato ", "pace di ", "peste ", "alluvione ",
    "biennale d", "mostra internazionale", "festival ", "regata ", "carnevale ",
    "università ", "accademia di ", "fondazione ", "istituto ", "società ", "compagnia ",
    "diocesi ", "patriarcato ", "parrocchia ", "sestiere ", "canale ", "rio ", "laguna ",
    "isola ", "lido ", "marghera", "mestre", "favaro", "chirignago", "zelarino",
    "stazione meteorologica", "faro ",
)


def to_grid_dm(lon: float, lat: float) -> tuple[int, int]:
    x = round((lon - LON0) * KX * GRID_SCALE)
    y = round((LAT1 - lat) * KY * GRID_SCALE)
    return x, y


def parse_wkt_point(wkt: str | None) -> tuple[float, float] | None:
    if not wkt:
        return None
    m = re.match(r"Point\(\s*([-+]?\d+(?:\.\d+)?)\s+([-+]?\d+(?:\.\d+)?)\s*\)", wkt)
    if not m:
        return None
    lon, lat = float(m.group(1)), float(m.group(2))
    if not (BBOX_LAT[0] <= lat <= BBOX_LAT[1] and BBOX_LON[0] <= lon <= BBOX_LON[1]):
        return None
    return lon, lat


def parse_historic_year(raw: str | None) -> tuple[int, str, str] | None:
    """
    Interpreta una data storica Wikidata o OSM senza inventare precisione.
    Restituisce (anno_riferimento, precisione, etichetta_originale) dove precisione è:
      - 'exact'   : anno puntuale (es. "1591", "1489")
      - 'approx'  : circa / decennio (es. "~1550", "anni 1920")
      - 'century' : secolo (es. "XV sec.", "16° sec.")
    """
    if not raw:
        return None
    s = raw.strip()
    if not s or s.startswith("http"):
        return None

    # 1. Formato ISO Wikidata: "1591-01-01T00:00:00Z" o "+1591-00-00T00:00:00Z"
    m_iso = re.match(r"^[+]?(\d{3,4})-(\d{2})-(\d{2})", s)
    if m_iso:
        y = int(m_iso.group(1))
        month, day = m_iso.group(2), m_iso.group(3)
        if 400 <= y <= 2026:
            # In Wikidata gli anni "X00-01-01" spesso rappresentano l'inizio secolo se multipli di 100
            if y % 100 == 0 and month == "01" and day == "01":
                c = y // 100 + 1
                return (y + 50, "century", f"{c}° sec.")
            return (y, "exact", str(y))

    # 2. Formato secolo OSM: "C15", "C16"
    m_c = re.match(r"^[cC](\d{1,2})\b", s)
    if m_c:
        c = int(m_c.group(1))
        if 5 <= c <= 21:
            return ((c - 1) * 100 + 50, "century", f"{c}° sec.")

    # 3. Secolo in numeri romani: "XV", "XVI sec."
    m_rom = re.search(r"\b(XXI|XX|XIX|XVIII|XVII|XVI|XV|XIV|XIII|XII|XI|X|IX|VIII|VII|VI|V)\b", s.upper())
    if m_rom and not re.search(r"\b\d{3,4}\b", s):
        c = ROMAN_CENTURIES.get(m_rom.group(1))
        if c:
            return ((c - 1) * 100 + 50, "century", f"{m_rom.group(1)} sec.")

    # 4. Anno esatto o intervallo
    years = [int(y) for y in re.findall(r"\b(\d{3,4})\b", s) if 400 <= int(y) <= 2026]
    if years:
        is_approx = bool(re.search(r"[~?]|ca\.?|circa|before|after|ante|post", s, re.IGNORECASE))
        y = years[0]
        return (y, "approx" if is_approx else "exact", str(y))

    return None


def classify_by_name(name: str, style: str | None = None) -> str:
    low = name.lower().strip()
    if any(low.startswith(p) for p in ("chiesa ", "basilica ", "cattedrale ", "oratorio ", "monastero ", "convento ", "abbazia ", "tempio ", "sinagoga ", "scuola spagnola", "scuola levantina", "scuola tedesca", "scuola italiana", "scuola canton", "sant'", "san ", "santa ", "santi ")):
        return "religious"
    if "scuola grande" in low or low.startswith("scuola di ") or low.startswith("scuola dei ") or low.startswith("scuola della "):
        return "scuola"
    if any(low.startswith(p) for p in ("palazzo ", "palazzetto ", "ca' ", "ca’ ", "ca ", "casa ", "fondaco ", "fontego ", "procuratie ", "villa ", "casino ", "loggetta ", "torre dell'orologio", "reggia ")):
        return "palazzo"
    if any(k in low for k in ("arsenale", "molino", "mulino", "cotonificio", "birreria", "cantiere", "squero", "fornace", "fabbrica", "manifattura", "macello", "deposito", "magazzini")):
        return "industrial"
    if any(k in low for k in ("teatro", "museo", "gallerie", "biblioteca", "archivio", "ospedale", "lazaretto", "lazzaretto", "zecca", "dogana", "prigioni", "padiglione", "mercato", "pescheria", "stazione", "autorimessa", "scuola ")):
        return "public"
    if any(k in low for k in ("hotel", "albergo", "caffè", "locanda", "cinema")):
        return "commercial"
    return "palazzo" if style else "residential"


def is_valid_building_entity(name: str) -> bool:
    if not name or re.match(r"^Q\d+$", name):
        return False
    low = name.lower().strip()
    if any(low.startswith(p) for p in EXCLUDED_NAME_PREFIXES):
        return False
    if low.startswith("ponte "):
        return False
    return True



OSM_CACHE = os.path.join(BASE_DIR, "data", "osm_buildings_raw.json")
# sotto questa soglia la risposta di Overpass è incompleta (il centro storico ha decine di migliaia di edifici)
MIN_BUILDINGS = 8000
WIKIDATA_SPARQL = "https://query.wikidata.org/sparql"
SPARQL = f"""SELECT ?item ?itemLabel ?coord ?inception ?styleLabel ?height ?floors ?architectLabel WHERE {{
  SERVICE wikibase:box {{
    ?item wdt:P625 ?coord .
    bd:serviceParam wikibase:cornerSouthWest "Point({BBOX_LON[0]} {BBOX_LAT[0]})"^^geo:wktLiteral .
    bd:serviceParam wikibase:cornerNorthEast "Point({BBOX_LON[1]} {BBOX_LAT[1]})"^^geo:wktLiteral .
  }}
  ?item wdt:P31/wdt:P279* wd:Q41176 .
  OPTIONAL {{ ?item wdt:P571 ?inception . }}
  OPTIONAL {{ ?item wdt:P149 ?style . }}
  OPTIONAL {{ ?item wdt:P2048 ?height . }}
  OPTIONAL {{ ?item wdt:P1101 ?floors . }}
  OPTIONAL {{ ?item wdt:P84 ?architect . }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "it,en". }}
}}"""

# building=* di OSM -> categoria del layer
BUILDING_CATEGORY = {
    "church": "religious", "cathedral": "religious", "chapel": "religious", "basilica": "religious",
    "religious": "religious", "monastery": "religious", "convent": "religious", "synagogue": "religious",
    "bell_tower": "religious", "palace": "palazzo", "public": "public", "civic": "public",
    "government": "public", "hospital": "public", "school": "public", "university": "public",
    "museum": "public", "train_station": "public", "transportation": "public", "college": "public",
    "industrial": "industrial", "warehouse": "industrial", "shed": "industrial", "boathouse": "industrial",
    "hangar": "industrial", "commercial": "commercial", "retail": "commercial", "hotel": "commercial",
    "office": "commercial", "kiosk": "commercial",
}


def fetch_wikidata() -> list[dict]:
    """Edifici con coordinate nel riquadro da Wikidata (CC0), una riga per valore: si raggruppano per elemento."""
    payload = fetch_json(WIKIDATA_SPARQL, params={"query": SPARQL, "format": "json"}, timeout=120, retries=2)
    by_qid: dict[str, dict] = {}
    for row in payload.get("results", {}).get("bindings", []):
        qid = row.get("item", {}).get("value", "").rsplit("/", 1)[-1]
        label = row.get("itemLabel", {}).get("value", "")
        pt = parse_wkt_point(row.get("coord", {}).get("value"))
        if not qid.startswith("Q") or not pt or not is_valid_building_entity(label):
            continue
        e = by_qid.setdefault(qid, {"qid": qid, "name": label, "lon": round(pt[0], 6), "lat": round(pt[1], 6),
                                    "inceptions": [], "style": None, "height": None, "floors": None, "architects": []})
        inc = row.get("inception", {}).get("value")
        if inc and inc not in e["inceptions"]:
            e["inceptions"].append(inc)
        st = row.get("styleLabel", {}).get("value")
        if st and not re.match(r"^Q\d+$", st) and not e["style"]:
            e["style"] = st
        ar = row.get("architectLabel", {}).get("value")
        if ar and not re.match(r"^Q\d+$", ar) and ar not in e["architects"]:
            e["architects"].append(ar)
        try:
            if row.get("height") and not e["height"] and 3 <= float(row["height"]["value"]) <= 110:
                e["height"] = round(float(row["height"]["value"]), 1)
            if row.get("floors") and not e["floors"] and 1 <= int(float(row["floors"]["value"])) <= 25:
                e["floors"] = int(float(row["floors"]["value"]))
        except ValueError:
            pass
    return list(by_qid.values())


def point_in_ring(lon: float, lat: float, ring: list[tuple[float, float]]) -> bool:
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / ((yj - yi) or 1e-12) + xi:
            inside = not inside
        j = i
    return inside


def simplify_ring(pts: list[tuple[int, int]], tol: int = 5) -> list[tuple[int, int]]:
    """Douglas-Peucker sui punti in decimetri di griglia (tol 5 = ~50 cm): sagoma uguale, file più leggero"""
    if len(pts) <= 4:
        return pts

    def dp(a: int, b: int, keep: list[bool]) -> None:
        (x1, y1), (x2, y2) = pts[a], pts[b]
        dx, dy = x2 - x1, y2 - y1
        norm = math.hypot(dx, dy) or 1
        best, idx = -1.0, -1
        for k in range(a + 1, b):
            x0, y0 = pts[k]
            d = abs(dy * x0 - dx * y0 + x2 * y1 - y2 * x1) / norm
            if d > best:
                best, idx = d, k
        if best > tol:
            keep[idx] = True
            dp(a, idx, keep)
            dp(idx, b, keep)

    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    dp(0, len(pts) - 1, keep)
    out = [p for p, k in zip(pts, keep) if k]
    return out if len(out) >= 4 else pts


def encode_ring(coords: list[dict]) -> list[int] | None:
    pts = [to_grid_dm(c["lon"], c["lat"]) for c in coords]
    if len(pts) >= 2 and pts[0] == pts[-1]:
        pts = pts[:-1]
    pts = simplify_ring(pts + [pts[0]])[:-1] if len(pts) >= 3 else pts
    if len(pts) < 3:
        return None
    out = [pts[0][0], pts[0][1]]
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        out += [bx - ax, by - ay]
    return out


def to_float(v: str | None) -> float | None:
    try:
        return float(str(v).replace("m", "").replace(",", ".").strip()) if v else None
    except ValueError:
        return None


def epoch_of(y: int) -> str:
    return "pre_1400" if y < 1400 else "1400_1599" if y < 1600 else "1600_1799" if y < 1800 else "1800_1899" if y < 1900 else "1900_1949" if y < 1950 else "post_1950"


def build(osm: dict, wd_items: list[dict]) -> dict:
    ways = [e for e in osm.get("elements", []) if e.get("type") == "way" and e.get("geometry")]
    if len(ways) < MIN_BUILDINGS:
        raise ValueError(f"risposta incompleta: {len(ways)} edifici")
    wd_by_qid = {w["qid"]: w for w in wd_items}
    # Wikidata con coordinate: indice a celle per cercare quelli dentro una sagoma
    cells: dict[tuple[int, int], list[dict]] = {}
    for w in wd_items:
        cells.setdefault((int(w["lon"] * 500), int(w["lat"] * 500)), []).append(w)

    buildings, stats, epochs, categories = [], Counter(), Counter(), Counter()
    used_qids: set[str] = set()
    for el in ways:
        tags = el.get("tags", {})
        ring_ll = [(c["lon"], c["lat"]) for c in el["geometry"]]
        ring = encode_ring(el["geometry"])
        if not ring:
            continue
        # Wikidata: tag sull'edificio, altrimenti un solo elemento con le coordinate dentro la sagoma
        wd = wd_by_qid.get(tags.get("wikidata", ""))
        if not wd:
            lons = [p[0] for p in ring_ll]
            lats = [p[1] for p in ring_ll]
            near = [w for cx in range(int(min(lons) * 500), int(max(lons) * 500) + 1) for cy in range(int(min(lats) * 500), int(max(lats) * 500) + 1) for w in cells.get((cx, cy), [])]
            inside = [w for w in near if w["qid"] not in used_qids and point_in_ring(w["lon"], w["lat"], ring_ll)]
            wd = inside[0] if len(inside) == 1 else None
        if wd:
            used_qids.add(wd["qid"])
        name = tags.get("name") or (wd["name"] if wd else None)
        category = BUILDING_CATEGORY.get(tags.get("building", "")) or (classify_by_name(name, wd.get("style") if wd else None) if name else "residential")
        item: dict = {"r": [ring], "c": category}
        if name:
            item["n"] = name
            stats["withName"] += 1
        if wd or tags.get("wikidata"):
            item["w"] = wd["qid"] if wd else tags["wikidata"]
            stats["withWikidata"] += 1
        if tags.get("heritage") or tags.get("historic") or wd:
            item["hr"] = 1
            stats["withHeritage"] += 1
        # anno: OSM se indicato, altrimenti Wikidata (la data più antica: fondazione)
        year = parse_historic_year(tags.get("start_date") or tags.get("building:start_date"))
        source = "osm" if year else None
        if not year and wd and wd.get("inceptions"):
            parsed = [p for p in (parse_historic_year(i) for i in wd["inceptions"]) if p]
            year = min(parsed, key=lambda p: p[0]) if parsed else None
            source = "wikidata" if year else None
        if year:
            item["y"], item["yp"], item["yl"], item["ys"] = year[0], year[1], year[2], source
            stats["withYear"] += 1
            stats["yearFromOsm" if source == "osm" else "yearFromWikidata"] += 1
            epochs[epoch_of(year[0])] += 1
        levels = to_float(tags.get("building:levels")) or (wd.get("floors") if wd else None)
        if levels and 1 <= levels <= 25:
            item["l"] = int(levels)
            stats["withLevels"] += 1
        height = to_float(tags.get("height")) or (wd.get("height") if wd else None)
        if height and 2 <= height <= 110:
            item["h"] = round(height, 1)
            stats["withHeight"] += 1
        if wd and wd.get("style"):
            item["st"] = wd["style"]
        if wd and wd.get("architects"):
            item["ar"] = ", ".join(wd["architects"][:3])
            stats["withArchitect"] += 1
        categories[category] += 1
        stats["total"] += 1
        buildings.append(item)

    istat_path = os.path.join(WEB_DIR, "src", "data", "istat-census-venezia.json")
    istat_summary = {}
    if os.path.exists(istat_path):
        hc = json.load(open(istat_path, encoding="utf-8")).get("historicCentre", {})
        istat_summary = {
            "historicCentreResidentialBuildings": hc.get("residentialBuildings", 0),
            "historicCentreDwellingsTotal": hc.get("dwellingsTotal", 0),
            "historicCentreDwellingsEmptyPct": hc.get("pctDwellingsEmptyOrNonResident", 0),
        }
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "gridScale": GRID_SCALE,
        "source": "OpenStreetMap contributors (ODbL 1.0) + Wikidata (CC0 1.0) + ISTAT 2021 (CC BY 4.0)",
        "stats": {
            "total": stats["total"],
            "withYear": stats["withYear"],
            "yearFromOsm": stats["yearFromOsm"],
            "yearFromWikidata": stats["yearFromWikidata"],
            "withArchitect": stats["withArchitect"],
            "withLevels": stats["withLevels"],
            "withHeight": stats["withHeight"],
            "withName": stats["withName"],
            "withWikidata": stats["withWikidata"],
            "withHeritage": stats["withHeritage"],
            "byEpoch": dict(epochs),
            "byCategory": dict(categories),
            "istat": istat_summary,
        },
        "buildings": buildings,
    }


def fetch_bbox(s: float, w: float, n: float, e: float, path: str, depth: int = 0) -> list[dict]:
    """Edifici di un riquadro, salvato su disco; se Overpass va in timeout il riquadro si divide in quattro."""
    if os.path.exists(path):
        return json.load(open(path, encoding="utf-8")).get("elements", [])
    q = f"""[out:json][timeout:180];
way["building"]({s:.5f},{w:.5f},{n:.5f},{e:.5f});
out tags geom;"""
    try:
        part = overpass(q, timeout=200, rounds=2, pause=20)
    except Exception:  # noqa: BLE001 - riquadro troppo pesante o istanze occupate: si divide
        if depth >= 2:
            raise
        logging.info("Riquadro %s troppo pesante: diviso in quattro", os.path.basename(path))
        ms, mw = (s + n) / 2, (w + e) / 2
        out: list[dict] = []
        for i, (a, b, c, d) in enumerate([(s, w, ms, mw), (s, mw, ms, e), (ms, w, n, mw), (ms, mw, n, e)]):
            out += fetch_bbox(a, b, c, d, path.replace(".json", f"_{i}.json"), depth + 1)
        return out
    json.dump(part, open(path, "w", encoding="utf-8"))
    return part.get("elements", [])


def fetch_osm_tiles(rows: int = 4, cols: int = 4) -> dict:
    """
    Edifici a riquadri piccoli (una query su tutta l'area è troppo pesante per Overpass). Ogni riquadro scaricato
    si salva in data/osm_building_tiles/: se Overpass cade a metà, al giro dopo si riparte da quelli mancanti.
    """
    tile_dir = os.path.join(BASE_DIR, "data", "osm_building_tiles")
    os.makedirs(tile_dir, exist_ok=True)
    elements: dict[int, dict] = {}
    dlat = (BBOX_LAT[1] - BBOX_LAT[0]) / rows
    dlon = (BBOX_LON[1] - BBOX_LON[0]) / cols
    for r in range(rows):
        for c in range(cols):
            s, w = BBOX_LAT[0] + r * dlat, BBOX_LON[0] + c * dlon
            for e in fetch_bbox(s, w, s + dlat, w + dlon, os.path.join(tile_dir, f"{rows}x{cols}_{r}_{c}.json")):
                elements[e["id"]] = e
            logging.info("Riquadro %d/%d: %d edifici in totale", r * cols + c + 1, rows * cols, len(elements))
    return {"elements": list(elements.values())}


def main() -> int:
    ap = argparse.ArgumentParser(description="Edifici del centro storico da OpenStreetMap e Wikidata")
    ap.add_argument("--osm", help="risposta Overpass salvata (JSON)")
    ap.add_argument("--refresh-wikidata", action="store_true", help="rilegge Wikidata anche se c'è la cache")
    args = ap.parse_args()
    try:
        if args.osm:
            osm = json.load(open(args.osm, encoding="utf-8"))
        else:
            osm = fetch_osm_tiles()
            os.makedirs(os.path.dirname(OSM_CACHE), exist_ok=True)
            json.dump(osm, open(OSM_CACHE, "w", encoding="utf-8"))
        if args.refresh_wikidata or not os.path.exists(WIKIDATA_CACHE):
            wd_items = fetch_wikidata()
            os.makedirs(os.path.dirname(WIKIDATA_CACHE), exist_ok=True)
            json.dump(wd_items, open(WIKIDATA_CACHE, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        else:
            wd_items = json.load(open(WIKIDATA_CACHE, encoding="utf-8"))
        data = build(osm, wd_items)
    except Exception as exc:  # noqa: BLE001 - qualsiasi errore lascia i file precedenti
        logging.error("Edifici non aggiornati: %s", exc)
        return 1
    url = write_hashed_json("buildings", data)
    stats_json = json.dumps(data["stats"], ensure_ascii=False, indent=2)
    with open(TS_FILE, "w", encoding="utf-8") as f:
        f.write(
            "// Generato da pipeline/import_osm_buildings.py - NON MODIFICARE A MANO\n"
            f"export const BUILDINGS_URL = {json.dumps(url)};\n"
            f"export const BUILDINGS_AUDIT_STATS = {stats_json} as const;\n"
        )
    logging.info("Edifici: %d (%d con anno) -> %s", data["stats"]["total"], data["stats"]["withYear"], url)
    return 0


if __name__ == "__main__":
    sys.exit(main())
