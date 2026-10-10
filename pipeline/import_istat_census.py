"""
VOD - Venice Open Data
Residenti, famiglie e abitazioni del Comune di Venezia dal Censimento permanente ISTAT 2021,
per municipalità, sestiere del centro storico e isola.

ISTAT pubblica i dati per sezione di censimento (CC BY 4.0) e i confini delle sezioni; il Comune
non pubblica i residenti per sestiere come open data. Ogni sezione viene assegnata al sestiere o
all'isola che contiene il suo baricentro (perimetri da OpenStreetMap) e le variabili vengono sommate.

Fonti (circa 330 MB, si scaricano solo all'esecuzione; il censimento 2021 non cambia):
  - dati per sezione: esploradati.istat.it/.../Dati_regionali_2021.zip (si legge solo il Veneto)
  - confini: istat.it/storage/cartografia/basi_territoriali/2021/R05_21.zip

Uso: python import_istat_census.py [--data-zip FILE] [--shp-zip FILE]
"""

import argparse
import io
import json
import logging
import math
import os
import struct
import sys
import tempfile
import xml.etree.ElementTree as ET
import zipfile
from datetime import datetime, timezone

from import_osm_parks import outer_rings
from vod_http import fetch_bytes, overpass

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "istat-census-venezia.json")

DATA_URL = "https://esploradati.istat.it/databrowser/DWL/PERMPOP/SUBCOM/Dati_regionali_2021.zip"
SHP_URL = "https://www.istat.it/storage/cartografia/basi_territoriali/2021/R05_21.zip"
SOURCE_PAGE = "https://www.istat.it/notizia/basi-territoriali-e-variabili-censuarie/"
PROCOM = 27042  # Comune di Venezia

MUNICIPALITIES = {
    1: "Venezia-Murano-Burano (Venezia insulare)",
    2: "Lido-Pellestrina (Venezia litorale)",
    3: "Favaro Veneto",
    4: "Mestre-Carpenedo (Mestre centro)",
    5: "Chirignago-Zelarino (Mestre ovest)",
    6: "Marghera",
}
SESTIERI = ["Cannaregio", "Castello", "Dorsoduro", "San Marco", "San Polo", "Santa Croce"]
MIN_PART_RESIDENTS = 50
# Zone mappate a parte su OpenStreetMap che appartengono a un sestiere: nome OSM -> (sestiere, nome mostrato)
SESTIERE_PARTS = {
    "Giudecca": ("Dorsoduro", "Giudecca"),
    "Sacca Fisola": ("Dorsoduro", "Sacca Fisola"),
    "Sant'Elena": ("Castello", "Sant'Elena"),
    "Isola San Giorgio": ("San Marco", "Isola di San Giorgio Maggiore"),
    "Tronchetto": ("Santa Croce", "Tronchetto"),
}
# Nome usato da VOD -> nome dell'isola su OpenStreetMap
ISLANDS = {
    "Murano": "Murano", "Burano": "Burano", "Mazzorbo": "Mazzorbo", "Torcello": "Isola Torcello",
    "Sant'Erasmo": "Sant'Erasmo", "Vignole": "Isola Le Vignole", "Lido": "Isola del Lido",
    "Pellestrina": "Isola di Pellestrina",
}
LAGOON_BBOX = "45.18,12.18,45.52,12.47"

# Variabili ISTAT sommate per zona (vedi "TRACCIATO FILE REGIONALI.xlsx")
SUM_FIELDS = {
    "P1": "population", "P2": "males", "P3": "females",
    "P14": "age0_4", "P15": "age5_9", "P16": "age10_14", "P17": "age15_19", "P18": "age20_24", "P19": "age25_29",
    "P20": "age30_34", "P21": "age35_39", "P22": "age40_44", "P23": "age45_49", "P24": "age50_54", "P25": "age55_59",
    "P26": "age60_64", "P27": "age65_69", "P28": "age70_74", "P29": "age75plus",
    "P83": "pop9plus", "P90": "tertiaryEducation", "P101": "employed15_64",
    "ST1": "foreigners", "PF1": "families", "PF3": "familiesOnePerson",
    "A2": "dwellingsOccupied", "A3": "dwellingsEmptyOrNonResident", "A8": "dwellingsTotal", "E3": "residentialBuildings",
}

# ---------------------------------------------------------------------------
# Lettura dei file ISTAT (solo libreria standard)
# ---------------------------------------------------------------------------

XLSX_NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"


def col_index(ref: str) -> int:
    """'C12' -> 2 (indice della colonna da zero)."""
    n = 0
    for ch in ref:
        if ch.isalpha():
            n = n * 26 + (ord(ch.upper()) - 64)
        else:
            break
    return n - 1


def xlsx_rows(data: bytes):
    """Righe del primo foglio come liste di stringhe (lettura in streaming del foglio)."""
    z = zipfile.ZipFile(io.BytesIO(data))
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).iter(f"{XLSX_NS}si"):
            shared.append("".join(t.text or "" for t in si.iter(f"{XLSX_NS}t")))
    sheet = sorted(n for n in z.namelist() if n.startswith("xl/worksheets/sheet"))[0]
    with z.open(sheet) as fh:
        for _, el in ET.iterparse(fh):
            if el.tag != f"{XLSX_NS}row":
                continue
            row: list[str] = []
            for c in el.findall(f"{XLSX_NS}c"):
                i = col_index(c.get("r", "A"))
                while len(row) < i:
                    row.append("")
                v = c.find(f"{XLSX_NS}v")
                if v is None:
                    is_ = c.find(f"{XLSX_NS}is")
                    row.append("".join(t.text or "" for t in is_.iter(f"{XLSX_NS}t")) if is_ is not None else "")
                else:
                    row.append(shared[int(v.text)] if c.get("t") == "s" else (v.text or ""))
            yield row
            el.clear()


def to_number(value: str) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def dbf_records(data: bytes):
    """Record di un file .dbf come dizionari {campo: testo}."""
    n_records, header_len, record_len = struct.unpack("<IHH", data[4:12])
    fields = []
    pos = 32
    while data[pos] != 0x0D:
        name = data[pos:pos + 11].split(b"\x00")[0].decode("latin-1")
        fields.append((name, data[pos + 16]))
        pos += 32
    for i in range(n_records):
        start = header_len + i * record_len + 1  # il primo byte è il flag di cancellazione
        rec, off = {}, start
        for name, length in fields:
            rec[name] = data[off:off + length].decode("latin-1").strip()
            off += length
        yield rec


def shp_polygons(data: bytes, wanted: set[int]):
    """(indice del record, anelli [[x, y], ...]) per i poligoni dei record in `wanted` (indici da zero)."""
    pos, index = 100, 0
    while pos < len(data):
        _, length_words = struct.unpack(">ii", data[pos:pos + 8])
        content = pos + 8
        if index in wanted:
            shape_type = struct.unpack("<i", data[content:content + 4])[0]
            if shape_type in (5, 15, 25):
                n_parts, n_points = struct.unpack("<ii", data[content + 36:content + 44])
                parts = list(struct.unpack(f"<{n_parts}i", data[content + 44:content + 44 + 4 * n_parts]))
                pts_off = content + 44 + 4 * n_parts
                coords = struct.unpack(f"<{2 * n_points}d", data[pts_off:pts_off + 16 * n_points])
                points = [[coords[2 * k], coords[2 * k + 1]] for k in range(n_points)]
                bounds = parts + [n_points]
                yield index, [points[bounds[k]:bounds[k + 1]] for k in range(n_parts)]
        pos = content + 2 * length_words
        index += 1


def planar_centroid(rings: list[list[list[float]]]) -> tuple[float, float, float]:
    """Baricentro e area dell'anello più grande (coordinate piane in metri)."""
    best = None
    for ring in rings:
        a = cx = cy = 0.0
        for (x1, y1), (x2, y2) in zip(ring, ring[1:]):
            f = x1 * y2 - x2 * y1
            a += f
            cx += (x1 + x2) * f
            cy += (y1 + y2) * f
        if abs(a) < 1e-9:
            continue
        cand = (cx / (3 * a), cy / (3 * a), abs(a) / 2)
        if best is None or cand[2] > best[2]:
            best = cand
    if best is None:
        xs = [p[0] for r in rings for p in r]
        ys = [p[1] for r in rings for p in r]
        return sum(xs) / len(xs), sum(ys) / len(ys), 0.0
    return best


def point_in_ring(x: float, y: float, ring: list[list[float]]) -> bool:
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def ring_area_m2(ring: list[list[float]]) -> float:
    k = math.cos(math.radians(ring[0][1])) * 111320
    pts = [(x * k, y * 110540) for x, y in ring]
    return abs(sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(pts, pts[1:]))) / 2


# ---------------------------------------------------------------------------
# Aggregazione
# ---------------------------------------------------------------------------


def empty_totals() -> dict:
    return {v: 0 for v in SUM_FIELDS.values()} | {"sections": 0}


def add(totals: dict, row: dict) -> None:
    for field, key in SUM_FIELDS.items():
        totals[key] += to_number(row.get(field, ""))
    totals["sections"] += 1


def pct(part: float, whole: float) -> float | None:
    return round(100 * part / whole, 1) if whole else None


def indicators(t: dict, area_m2: float | None = None) -> dict:
    """Valori assoluti arrotondati e indicatori derivati (percentuali e rapporti)."""
    out = {k: int(round(v)) for k, v in t.items()}
    pop = t["population"]
    young = t["age0_4"] + t["age5_9"] + t["age10_14"]
    old = t["age65_69"] + t["age70_74"] + t["age75plus"]
    working = pop - young - old
    out.update({
        "pctUnder15": pct(young, pop),
        "pct65plus": pct(old, pop),
        "pct75plus": pct(t["age75plus"], pop),
        "oldAgeIndex": round(100 * old / young) if young else None,
        "pctForeigners": pct(t["foreigners"], pop),
        "avgFamilySize": round(pop / t["families"], 2) if t["families"] else None,
        "pctOnePersonFamilies": pct(t["familiesOnePerson"], t["families"]),
        "pctTertiary": pct(t["tertiaryEducation"], t["pop9plus"]),
        "employmentRate15_64": pct(t["employed15_64"], working),
        "pctDwellingsEmptyOrNonResident": pct(t["dwellingsEmptyOrNonResident"], t["dwellingsTotal"]),
        "dwellingsPerResident": round(t["dwellingsTotal"] / pop, 2) if pop else None,
    })
    if area_m2:
        out["areaHa"] = round(area_m2 / 10_000, 1)
        out["densityPerKm2"] = round(pop / (area_m2 / 1_000_000)) if pop else 0
    return out


def zone_polygons() -> list[tuple[str, str, str, list[list[list[float]]]]]:
    """(tipo, nome, parte, anelli [lon, lat]) di sestieri (con le loro parti) e isole da OpenStreetMap."""
    rx = lambda names: "|".join(n.replace("'", ".") for n in names)  # noqa: E731
    query = (
        f'[out:json][timeout:120];('
        f'way["place"="neighbourhood"]["name"~"^({rx(SESTIERI)})$"]({LAGOON_BBOX});'
        f'nwr["place"~"^(neighbourhood|island|islet)$"]["name"~"^({rx(SESTIERE_PARTS)})$"]({LAGOON_BBOX});'
        f'nwr["place"~"^(island|islet)$"]["name"~"^({rx(ISLANDS.values())})$"]({LAGOON_BBOX});'
        f');out geom;'
    )
    osm_to_island = {v: k for k, v in ISLANDS.items()}
    zones, seen = [], set()
    for el in overpass(query, timeout=180).get("elements", []):
        tags = el.get("tags", {})
        osm_name = tags.get("name")
        rings = outer_rings(el)
        if not osm_name or not rings:
            continue
        if osm_name in SESTIERE_PARTS:
            sestiere, part = SESTIERE_PARTS[osm_name]
            zone = ("sestiere", sestiere, part)
        elif osm_name in SESTIERI and tags.get("place") == "neighbourhood":
            zone = ("sestiere", osm_name, osm_name)
        elif osm_name in osm_to_island:
            zone = ("island", osm_to_island[osm_name], osm_to_island[osm_name])
        else:
            continue
        if zone in seen:  # stessa zona mappata due volte (es. Giudecca come quartiere e come isola)
            continue
        seen.add(zone)
        zones.append((*zone, rings))
    # prima sestieri e loro parti, poi le isole; a parità, le aree più piccole
    zones.sort(key=lambda z: (z[0] != "sestiere", sum(ring_area_m2(r) for r in z[3])))
    return zones


def build(rows: list[dict], centroids: dict[str, tuple[float, float]], zones) -> dict:
    municipalities = {k: empty_totals() for k in MUNICIPALITIES}
    by_zone: dict[tuple[str, str], dict] = {}
    by_part: dict[tuple[str, str], dict] = {}
    unassigned_insular = empty_totals()
    city = empty_totals()
    for row in rows:
        add(city, row)
        asc = int(to_number(row.get("COM_ASC1", "")) % 1000) if row.get("COM_ASC1") else 0
        if asc in municipalities:
            add(municipalities[asc], row)
        c = centroids.get(row["SEZ21_ID"])
        zone = None
        if c:
            for kind, name, part, rings in zones:
                if any(point_in_ring(c[0], c[1], r) for r in rings):
                    zone = (kind, name, part)
                    break
        if zone:
            add(by_zone.setdefault(zone[:2], empty_totals()), row)
            if zone[0] == "sestiere" and zone[2] != zone[1]:
                add(by_part.setdefault((zone[1], zone[2]), empty_totals()), row)
        elif asc in (1, 2):
            add(unassigned_insular, row)

    # Superficie: somma delle zone, senza contare due volte le parti già dentro il perimetro del sestiere
    main_rings = {n: rings for k, n, part, rings in zones if k == "sestiere" and part == n}
    area: dict[tuple[str, str], float] = {}
    for k, n, part, rings in zones:
        inside_main = part != n and any(point_in_ring(rings[0][0][0], rings[0][0][1], r) for r in main_rings.get(n, []))
        # le parti quasi disabitate (Tronchetto, San Giorgio) non entrano nella superficie della densità
        uninhabited = part != n and by_part.get((n, part), {}).get("population", 0) < MIN_PART_RESIDENTS
        if not inside_main and not uninhabited:
            area[(k, n)] = area.get((k, n), 0.0) + sum(ring_area_m2(r) for r in rings)
    def parts_of(name: str) -> list[dict]:
        out = []
        for (sest, part), t in by_part.items():
            if sest == name and t["population"] > 0:
                ind = indicators(t)
                out.append({k: ind[k] for k in ("population", "families", "dwellingsTotal", "pctDwellingsEmptyOrNonResident")} | {"name": part})
        return sorted(out, key=lambda p: -p["population"])
    sestieri = [{"name": n, **indicators(t, area[("sestiere", n)]), "parts": parts_of(n)} for (k, n), t in by_zone.items() if k == "sestiere"]
    islands = [{"name": n, **indicators(t, area[("island", n)])} for (k, n), t in by_zone.items() if k == "island"]
    centre = empty_totals()
    for (k, _), t in by_zone.items():
        if k == "sestiere":
            for key in centre:
                centre[key] += t[key]
    return {
        "city": indicators(city),
        "municipalities": [{"id": k, "name": MUNICIPALITIES[k], **indicators(t)} for k, t in municipalities.items()],
        "historicCentre": indicators(centre, sum(v for (k, _), v in area.items() if k == "sestiere")),
        "sestieri": sorted(sestieri, key=lambda s: -s["population"]),
        "islands": sorted(islands, key=lambda s: -s["population"]),
        "unassignedInsular": indicators(unassigned_insular),
    }


# ---------------------------------------------------------------------------


def read_zip_member(path_or_url: str | None, url: str, suffix: str) -> bytes:
    """Contenuto del file dello zip che finisce con `suffix` (zip locale o scaricato in un file temporaneo)."""
    if path_or_url:
        zf = zipfile.ZipFile(path_or_url)
        name = next(n for n in zf.namelist() if n.endswith(suffix))
        return zf.read(name)
    with tempfile.TemporaryFile() as tmp:
        logging.info("Download %s", url)
        tmp.write(fetch_bytes(url, timeout=900, retries=3, backoff=30))
        tmp.seek(0)
        zf = zipfile.ZipFile(tmp)
        name = next(n for n in zf.namelist() if n.endswith(suffix))
        return zf.read(name)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-zip", help="Dati_regionali_2021.zip già scaricato")
    parser.add_argument("--shp-zip", help="R05_21.zip già scaricato")
    args = parser.parse_args()

    from pyproj import Transformer  # dipendenza già usata dalle pipeline ARPAV

    try:
        xlsx = read_zip_member(args.data_zip, DATA_URL, "R05_indicatori_2021_sezioni.xlsx")
        dbf = read_zip_member(args.shp_zip, SHP_URL, ".dbf")
        shp = read_zip_member(args.shp_zip, SHP_URL, ".shp")
    except Exception as e:  # noqa: BLE001
        logging.error("Download ISTAT fallito: %s", e)
        return 1

    it = xlsx_rows(xlsx)
    header = next(it)
    rows = [dict(zip(header, r)) for r in it if r and to_number(r[header.index("PROCOM")]) == PROCOM]
    logging.info("Sezioni del Comune di Venezia nei dati: %d", len(rows))

    wanted, ids = set(), {}
    for i, rec in enumerate(dbf_records(dbf)):
        if to_number(rec.get("PRO_COM", "")) == PROCOM:
            wanted.add(i)
            ids[i] = str(int(to_number(rec.get("SEZ21_ID", ""))))
    to_wgs84 = Transformer.from_crs(32632, 4326, always_xy=True)
    centroids = {}
    for i, rings in shp_polygons(shp, wanted):
        x, y, _ = planar_centroid(rings)
        lon, lat = to_wgs84.transform(x, y)
        centroids[ids[i]] = (lon, lat)
    for r in rows:
        r["SEZ21_ID"] = str(int(to_number(r["SEZ21_ID"])))
    logging.info("Sezioni con confini: %d", len(centroids))

    zones = zone_polygons()
    logging.info("Zone OSM: %s", [(k, n, part) for k, n, part, _ in zones])
    found = {n for k, n, _, _ in zones if k == "sestiere"}
    if len(rows) < 1000 or len(centroids) < 1000 or found != set(SESTIERI):
        logging.error("Dati incompleti (sezioni %d, confini %d, sestieri %s): file non aggiornato", len(rows), len(centroids), sorted(found))
        return 1

    out = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "ISTAT – Censimento permanente della popolazione e delle abitazioni 2021, dati per sezione di censimento",
        "sourceUrl": SOURCE_PAGE,
        "license": "CC BY 4.0",
        "attribution": "Elaborazione VOD su dati ISTAT (CC BY 4.0); perimetri di sestieri e isole © OpenStreetMap contributors (ODbL)",
        "referenceDate": "2021-12-31",
        "method": "Somma delle sezioni di censimento il cui baricentro cade nel perimetro OSM del sestiere o dell'isola. Le zone mappate a parte su OSM sono attribuite al loro sestiere: Giudecca e Sacca Fisola a Dorsoduro, Sant'Elena a Castello, l'isola di San Giorgio Maggiore a San Marco, il Tronchetto a Santa Croce (il dettaglio è in 'parts'). 'Abitazioni vuote o di non residenti' è la variabile ISTAT A3: abitazioni vuote e abitazioni occupate solo da persone non residenti (seconde case, affitti turistici, sfitti).",
        **build(rows, centroids, zones),
    }
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    logging.info("Centro storico: %s residenti", out["historicCentre"]["population"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
