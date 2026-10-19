#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: annunci di locazione breve da Inside Airbnb (Venezia) incrociati con il Censimento ISTAT 2021.

Inside Airbnb pubblica periodicamente i dati sugli annunci attivi nel Comune di Venezia con licenza CC BY 4.0
(https://insideairbnb.com/get-the-data/). Nel rispetto del GDPR e delle regole di VOD (docs/note-legali-fonti.md),
la pipeline scarta alla fonte tutti gli identificativi personali e puntuali (id annuncio, titolo, host_id,
host_profile_id, host_name e codice CIN/CIR individuale), conservando esclusivamente:
  1. Statistiche aggregate per sestiere, isola e municipalità di terraferma, incrociate con residenti e
     abitazioni del Censimento ISTAT 2021 (web/src/data/istat-census-venezia.json);
  2. Densità spaziale aggregata su celle di circa 100 x 100 m (coordinate già jitterate da Inside Airbnb);
  3. Punti dei singoli annunci senza dati personali, con la posizione già spostata da Airbnb fino a 150 m, solo
     nelle celle con almeno MIN_POINTS_PER_CELL annunci (nelle altre resta il conteggio della cella).

Licenza: CC BY 4.0 - Inside Airbnb (https://insideairbnb.com) e ISTAT (CC BY 4.0).
Output: web/src/data/inside-airbnb-venezia.json
Uso: python import_inside_airbnb.py [--file FILE] [--date YYYY-MM-DD]
"""

import argparse
import csv
import gzip
import io
import json
import logging
import os
import re
import statistics
import sys
from datetime import datetime, timezone
from vod_http import fetch_bytes, fetch_text

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CENSUS_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "istat-census-venezia.json")
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "inside-airbnb-venezia.json")
PORTAL_URL = "https://insideairbnb.com/get-the-data/"

# Cornice della mappa VOD (lon/lat) e passo della griglia (~100 m, identico a import_agcom_fiber.py)
FRAME = (12.135, 45.205, 12.47, 45.555)
CELL_DLON = 0.00128
CELL_DLAT = 0.0009


# Definizione delle zone VOD e corrispondenza con i quartieri Inside Airbnb e le aree ISTAT 2021
ZONE_SPECS = [
    {
        "id": "ACC_SAN_MARCO",
        "zoneName": "Sestiere San Marco",
        "sestiereOrLocation": "San Marco",
        "macroArea": "historic_centre",
        "lat": 45.4344,
        "lon": 12.3355,
        "neighbourhoods": {"San Marco", "Isola San Giorgio"},
        "censusKind": "sestiere",
        "censusNames": ["San Marco"],
    },
    {
        "id": "ACC_CANNAREGIO",
        "zoneName": "Sestiere Cannaregio",
        "sestiereOrLocation": "Cannaregio",
        "macroArea": "historic_centre",
        "lat": 45.4448,
        "lon": 12.3275,
        "neighbourhoods": {"Cannaregio"},
        "censusKind": "sestiere",
        "censusNames": ["Cannaregio"],
    },
    {
        "id": "ACC_CASTELLO",
        "zoneName": "Sestiere Castello & Sant'Elena",
        "sestiereOrLocation": "Castello",
        "macroArea": "historic_centre",
        "lat": 45.4335,
        "lon": 12.3520,
        "neighbourhoods": {"Castello", "Sant'Elena", "Isola San Michele"},
        "censusKind": "sestiere",
        "censusNames": ["Castello"],
    },
    {
        "id": "ACC_DORSODURO",
        "zoneName": "Sestiere Dorsoduro (con Giudecca)",
        "sestiereOrLocation": "Dorsoduro",
        "macroArea": "historic_centre",
        "lat": 45.4310,
        "lon": 12.3255,
        "neighbourhoods": {"Dorsoduro", "Giudecca", "Sacca Fisola", "Sacca San Biagio"},
        "censusKind": "sestiere",
        "censusNames": ["Dorsoduro"],
    },
    {
        "id": "ACC_SAN_POLO",
        "zoneName": "Sestiere San Polo (Rialto / Frari)",
        "sestiereOrLocation": "San Polo",
        "macroArea": "historic_centre",
        "lat": 45.4375,
        "lon": 12.3305,
        "neighbourhoods": {"San Polo"},
        "censusKind": "sestiere",
        "censusNames": ["San Polo"],
    },
    {
        "id": "ACC_SANTA_CROCE",
        "zoneName": "Sestiere Santa Croce",
        "sestiereOrLocation": "Santa Croce",
        "macroArea": "historic_centre",
        "lat": 45.4402,
        "lon": 12.3228,
        "neighbourhoods": {"Santa Croce", "Tronchetto"},
        "censusKind": "sestiere",
        "censusNames": ["Santa Croce"],
    },
    {
        "id": "ACC_LIDO_VENEZIA",
        "zoneName": "Lido di Venezia (Lido, Malamocco, Alberoni)",
        "sestiereOrLocation": "Lido",
        "macroArea": "islands",
        "lat": 45.4110,
        "lon": 12.3690,
        "neighbourhoods": {"Lido", "Malamocco", "Alberoni", "Isola San Servolo", "Isola San Lazzaro degli Armeni", "Isola San Clemente", "Isola La Grazia", "Isola Sacca Sessola"},
        "censusKind": "island",
        "censusNames": ["Lido"],
    },
    {
        "id": "ACC_MURANO",
        "zoneName": "Isola di Murano",
        "sestiereOrLocation": "Murano",
        "macroArea": "islands",
        "lat": 45.4585,
        "lon": 12.3525,
        "neighbourhoods": {"Murano"},
        "censusKind": "island",
        "censusNames": ["Murano"],
    },
    {
        "id": "ACC_BURANO_TORCELLO",
        "zoneName": "Laguna Nord (Burano, Mazzorbo, Torcello, Sant'Erasmo)",
        "sestiereOrLocation": "Burano / Laguna Nord",
        "macroArea": "islands",
        "lat": 45.4855,
        "lon": 12.4165,
        "neighbourhoods": {
            "Burano", "Mazzorbo", "Mazzorbetto", "Torcello", "Sant'Erasmo", "Vignole",
            "Lazzaretto Nuovo", "Isola San Francesco del Deserto", "Isola Santa Cristina", "Isola La Salina",
        },
        "censusKind": "island",
        "censusNames": ["Burano", "Mazzorbo", "Torcello", "Sant'Erasmo", "Vignole"],
    },
    {
        "id": "ACC_PELLESTRINA",
        "zoneName": "Pellestrina & San Pietro in Volta",
        "sestiereOrLocation": "Pellestrina",
        "macroArea": "islands",
        "lat": 45.2760,
        "lon": 12.3015,
        "neighbourhoods": {"Pellestrina", "San Pietro in Volta", "Santa Maria del Mare"},
        "censusKind": "island",
        "censusNames": ["Pellestrina"],
    },
    {
        "id": "ACC_MESTRE_CENTRO",
        "zoneName": "Mestre & Carpenedo (Stazione FS / Centro)",
        "sestiereOrLocation": "Mestre",
        "macroArea": "terraferma",
        "lat": 45.4845,
        "lon": 12.2385,
        "neighbourhoods": {
            "Piave 1860", "San Lorenzo XXV Aprile", "Carpenedo", "Bissuola", "Altobello",
            "Villaggio San Marco", "La Favorita", "Giustizia", "Villaggio Sartori",
            "Quartiere Pertini", "Torre Antica", "Borgoforte", "Capitello", "Centro Commerciale Auchan",
        },
        "censusKind": "municipality",
        "censusIds": [4],
    },
    {
        "id": "ACC_MARGHERA",
        "zoneName": "Marghera & Via Torino",
        "sestiereOrLocation": "Marghera",
        "macroArea": "terraferma",
        "lat": 45.4715,
        "lon": 12.2230,
        "neighbourhoods": {
            "Marghera", "Marghera Catene", "Santa Barbara", "Zona Commerciale via Torino",
            "Malcontenta", "Marghera Zona Industriale", "Ca' Emiliani", "Ca' Brentelle", "Ca' Sabbioni",
            "Centro Commerciale Panorama", "Fusina",
        },
        "censusKind": "municipality",
        "censusIds": [6],
    },
    {
        "id": "ACC_FAVARO_TESSERA",
        "zoneName": "Favaro Veneto, Campalto & Tessera (Aeroporto)",
        "sestiereOrLocation": "Favaro / Tessera",
        "macroArea": "terraferma",
        "lat": 45.5050,
        "lon": 12.2880,
        "neighbourhoods": {
            "Favaro", "Tessera", "Campalto", "Campalto CEP", "Campalto Gobbi", "Campalto Bagaron",
            "Campalto Cimitero", "Aeroporto", "Dese", "Favaro Cimitero", "Favaro Col San Martino",
            "Pra' Secco", "Molino Ronchin", "Ca' Solaro", "Borgo Pezzana", "Case Dosa",
        },
        "censusKind": "municipality",
        "censusIds": [3],
    },
    {
        "id": "ACC_CHIRIGNAGO_ZELARINO",
        "zoneName": "Chirignago, Zelarino & Gazzera",
        "sestiereOrLocation": "Chirignago / Zelarino",
        "macroArea": "terraferma",
        "lat": 45.4920,
        "lon": 12.2010,
        "neighbourhoods": {
            "Chirignago", "Gazzera", "Cipressina", "Zelarino", "Marocco Terraglio", "Marocco Zelarino",
            "Trivignano", "Gatta - Bondu?", "Asseggiano", "Taru'", "Scaramuzza",
            "Sardi (M.5 - Q11)", "Sardi (M.5 - Q.12)", "Macello", "Maguolo", "Ferrarese",
        },
        "censusKind": "municipality",
        "censusIds": [5],
    },
]


def latest_venice_csv_url(portal_html: str) -> tuple[str, str] | None:
    """
    Trova (data YYYY-MM-DD, URL) dello snapshot più recente per Venezia: il file dettagliato listings.csv.gz, che
    ha anche il numero di ospiti dichiarato in ogni annuncio (accommodates), da cui i posti letto.
    """
    matches = re.findall(
        r"https?://data\.insideairbnb\.com/italy/veneto/venice/(\d{4}-\d{2}-\d{2})/data/listings\.csv\.gz",
        portal_html,
    )
    if not matches:
        return None
    best_date = max(matches)
    return best_date, f"https://data.insideairbnb.com/italy/veneto/venice/{best_date}/data/listings.csv.gz"


def to_float(val: str | None) -> float | None:
    """Numero anche nel formato del file dettagliato («$1,234.00»)"""
    if val is None or val == "":
        return None
    try:
        return float(str(val).replace("$", "").replace(",", ""))
    except ValueError:
        return None


def to_int(val: str | None, default: int = 0) -> int:
    if val is None or val == "":
        return default
    try:
        return int(float(val))
    except ValueError:
        return default


def anonymize_row(raw: dict) -> dict | None:
    """
    Estrae i soli attributi statistici e spaziali di una riga Inside Airbnb, scartando
    qualsiasi dato personale (id, name, host_id, host_profile_id, host_name, license).
    """
    lat = to_float(raw.get("latitude"))
    lon = to_float(raw.get("longitude"))
    if lat is None or lon is None or not (45.15 <= lat <= 45.65 and 12.10 <= lon <= 12.60):
        return None
    room_type = (raw.get("room_type") or "").strip() or "Entire home/apt"
    price = to_float(raw.get("price"))
    # Scarta prezzi anomali o placeholder (> 10.000 EUR/notte o <= 0) dal calcolo del prezzo medio/mediano
    clean_price = price if (price is not None and 10 <= price <= 10000) else None
    host_count = max(1, to_int(raw.get("calculated_host_listings_count"), 1))
    avail = max(0, min(365, to_int(raw.get("availability_365"), 0)))
    reviews_ltm = max(0, to_int(raw.get("number_of_reviews_ltm"), 0))
    min_nights = max(1, to_int(raw.get("minimum_nights"), 1))
    lic_raw = (raw.get("license") or "").strip()
    has_license = bool(lic_raw and lic_raw.lower() not in ("exempt", "none", "null", "n/a"))
    is_cin = lic_raw.upper().startswith("IT027042")
    return {
        "neighbourhood_group": (raw.get("neighbourhood_group_cleansed") or raw.get("neighbourhood_group") or "").strip(),
        "neighbourhood": (raw.get("neighbourhood_cleansed") or raw.get("neighbourhood") or "").strip(),
        "lat": round(lat, 5),
        "lon": round(lon, 5),
        "room_type": room_type,
        "accommodates": max(0, to_int(raw.get("accommodates"), 0)),
        "price": clean_price,
        "host_count": host_count,
        "availability_365": avail,
        "reviews_ltm": reviews_ltm,
        "minimum_nights": min_nights,
        "has_license": has_license,
        "is_cin": is_cin,
    }


def classify_density(listings_per_100_dwellings: float, beds_per_resident: float) -> str:
    if listings_per_100_dwellings >= 14.0 or beds_per_resident >= 0.45:
        return "CRITICA"
    if listings_per_100_dwellings >= 8.0 or beds_per_resident >= 0.25:
        return "MOLTO_ALTA"
    if listings_per_100_dwellings >= 3.0 or beds_per_resident >= 0.08:
        return "ALTA"
    return "MODERATA"


def summarize_listings(items: list[dict], census_pop: int, census_dwellings: int, census_empty: int) -> dict:
    total = len(items)
    entire = sum(1 for x in items if x["room_type"] == "Entire home/apt")
    private = sum(1 for x in items if x["room_type"] == "Private room")
    hotel = sum(1 for x in items if x["room_type"] == "Hotel room")
    shared = sum(1 for x in items if x["room_type"] == "Shared room")
    # posti: ospiti dichiarati negli annunci (accommodates), non stimati
    est_beds = sum(x["accommodates"] for x in items)
    multi_host = sum(1 for x in items if x["host_count"] > 1)
    comm_5plus = sum(1 for x in items if x["host_count"] >= 5)
    with_lic = sum(1 for x in items if x["has_license"])
    active_ltm = sum(1 for x in items if x["reviews_ltm"] > 0)
    prices = [x["price"] for x in items if x["price"] is not None]
    avails = [x["availability_365"] for x in items]

    median_price = int(round(statistics.median(prices))) if prices else None
    mean_price = int(round(statistics.mean(prices))) if prices else None
    avg_avail = int(round(statistics.mean(avails))) if avails else 0

    pct_multi = round(100 * multi_host / total, 1) if total else 0.0
    pct_comm5 = round(100 * comm_5plus / total, 1) if total else 0.0
    pct_lic = round(100 * with_lic / total, 1) if total else 0.0
    listings_per_100_dwellings = round(100 * total / census_dwellings, 1) if census_dwellings else 0.0
    beds_per_resident = round(est_beds / census_pop, 2) if census_pop else 0.0
    pct_empty = round(100 * census_empty / census_dwellings, 1) if census_dwellings else 0.0

    return {
        "totalStructures": total,
        "totalBeds": est_beds,
        "hotelCount": hotel,
        "extraHotelCount": total - hotel,
        "entireHomeApt": entire,
        "privateRoom": private,
        "sharedRoom": shared,
        "multiHostListings": multi_host,
        "pctMultiHost": pct_multi,
        "commercial5PlusListings": comm_5plus,
        "pctCommercial5Plus": pct_comm5,
        "withLicense": with_lic,
        "pctWithLicense": pct_lic,
        "activeReviewsLtm": active_ltm,
        "medianPriceEur": median_price,
        "meanPriceEur": mean_price,
        "avgAvailabilityDays": avg_avail,
        "listingsPer100Dwellings": listings_per_100_dwellings,
        "bedsPerResidentRatio": beds_per_resident,
        "istatPopulation": census_pop,
        "istatDwellingsTotal": census_dwellings,
        "istatDwellingsEmpty": census_empty,
        "istatPctEmpty": pct_empty,
        "densityCategory": classify_density(listings_per_100_dwellings, beds_per_resident),
        "starRatingBreakdown": {
            "fiveStar": 0,
            "fourStar": 0,
            "threeStar": hotel,
            "twoOneStar": shared,
            "bAndB": private,
            "holidayHomes": entire,
        },
    }


def aggregate_cells(items: list[dict]) -> list[list[int]]:
    """
    Aggrega gli annunci nella griglia ~100 m di VOD:
    [i, j, totale_annunci, interi_appartamenti, multi_host, prezzo_mediano_eur]
    """
    buckets: dict[tuple[int, int], list[dict]] = {}
    for x in items:
        lon, lat = x["lon"], x["lat"]
        if not (FRAME[0] <= lon <= FRAME[2] and FRAME[1] <= lat <= FRAME[3]):
            continue
        i = int((lon - FRAME[0]) // CELL_DLON)
        j = int((lat - FRAME[1]) // CELL_DLAT)
        buckets.setdefault((i, j), []).append(x)

    cells: list[list[int]] = []
    for (i, j), group in sorted(buckets.items()):
        tot = len(group)
        ent = sum(1 for g in group if g["room_type"] == "Entire home/apt")
        mul = sum(1 for g in group if g["host_count"] > 1)
        prices = [g["price"] for g in group if g["price"] is not None]
        med_p = int(round(statistics.median(prices))) if prices else 0
        cells.append([i, j, tot, ent, mul, med_p])
    return cells


ROOM_TYPE_CODE = {
    "Entire home/apt": 0,
    "Private room": 1,
    "Hotel room": 2,
    "Shared room": 3,
}


def export_points(items: list[dict], zone_index_by_id: dict[str, int]) -> list[list]:
    """
    Esporta i punti anonimizzati (coordinate già perturbate da Inside Airbnb entro ~150 m)
    per il disegno dei singoli alloggi sulla mappa:
    [lon, lat, room_type_code, price_eur_or_0, host_listings_count, availability_365, reviews_ltm, has_license_0_1, zone_idx]
    """
    pts: list[list] = []
    for x in items:
        spec = match_zone_spec(x)
        z_idx = zone_index_by_id.get(spec["id"], 0)
        rt = ROOM_TYPE_CODE.get(x["room_type"], 0)
        price = int(round(x["price"])) if x["price"] is not None else 0
        pts.append([
            round(x["lon"], 5),
            round(x["lat"], 5),
            rt,
            price,
            int(x["host_count"]),
            int(x["availability_365"]),
            int(x["reviews_ltm"]),
            1 if x["has_license"] else 0,
            z_idx,
        ])
    return pts


# Sotto questa soglia di annunci nella cella da ~100 m il punto non si esporta: resta solo il conteggio della
# cella. Nelle zone con poche case (isole minori, campagna) anche una posizione spostata di 150 m può indicare
# una casa precisa, quindi il proprietario.
MIN_POINTS_PER_CELL = 3


def drop_isolated(points: list[list]) -> list[list]:
    """Toglie i punti delle celle con meno di MIN_POINTS_PER_CELL annunci (i conteggi delle celle restano)."""
    def cell(p: list) -> tuple[int, int]:
        return int((p[0] - FRAME[0]) // CELL_DLON), int((p[1] - FRAME[1]) // CELL_DLAT)

    counts: dict[tuple[int, int], int] = {}
    for p in points:
        counts[cell(p)] = counts.get(cell(p), 0) + 1
    return [p for p in points if counts[cell(p)] >= MIN_POINTS_PER_CELL]


def lookup_census_totals(census: dict, spec: dict) -> tuple[int, int, int]:
    kind = spec["censusKind"]
    pop = dwellings = empty = 0
    if kind == "sestiere":
        by_name = {s["name"]: s for s in census.get("sestieri", [])}
        for name in spec["censusNames"]:
            s = by_name.get(name, {})
            pop += int(s.get("population", 0))
            dwellings += int(s.get("dwellingsTotal", 0))
            empty += int(s.get("dwellingsEmptyOrNonResident", 0))
    elif kind == "island":
        by_name = {s["name"]: s for s in census.get("islands", [])}
        for name in spec["censusNames"]:
            s = by_name.get(name, {})
            pop += int(s.get("population", 0))
            dwellings += int(s.get("dwellingsTotal", 0))
            empty += int(s.get("dwellingsEmptyOrNonResident", 0))
    elif kind == "municipality":
        by_id = {int(m["id"]): m for m in census.get("municipalities", [])}
        for mid in spec["censusIds"]:
            m = by_id.get(mid, {})
            pop += int(m.get("population", 0))
            dwellings += int(m.get("dwellingsTotal", 0))
            empty += int(m.get("dwellingsEmptyOrNonResident", 0))
    return pop, dwellings, empty


def match_zone_spec(row: dict) -> dict:
    nb = row["neighbourhood"]
    for spec in ZONE_SPECS:
        if nb in spec["neighbourhoods"]:
            return spec
    if row["neighbourhood_group"] == "Isole":
        return ZONE_SPECS[2]  # Castello / Laguna
    return ZONE_SPECS[10]  # Mestre


def build(csv_text: str, census: dict, snapshot_date: str) -> dict:
    reader = csv.DictReader(io.StringIO(csv_text))
    items: list[dict] = []
    for raw in reader:
        clean = anonymize_row(raw)
        if clean:
            items.append(clean)

    if len(items) < 1000:
        raise ValueError(f" Trovati solo {len(items)} annunci validi: soglia minima non raggiunta")

    by_zone_id: dict[str, list[dict]] = {s["id"]: [] for s in ZONE_SPECS}
    for x in items:
        spec = match_zone_spec(x)
        by_zone_id[spec["id"]].append(x)

    zones = []
    zone_index_by_id: dict[str, int] = {}
    for idx, spec in enumerate(ZONE_SPECS):
        zone_index_by_id[spec["id"]] = idx
        z_items = by_zone_id[spec["id"]]
        pop, dwellings, empty = lookup_census_totals(census, spec)
        stats = summarize_listings(z_items, pop, dwellings, empty)
        zones.append({
            "id": spec["id"],
            "zoneName": spec["zoneName"],
            "sestiereOrLocation": spec["sestiereOrLocation"],
            "macroArea": spec["macroArea"],
            "lat": spec["lat"],
            "lon": spec["lon"],
            "airbnbSnapshotDate": snapshot_date,
            **stats,
            "officialSource": "Inside Airbnb (CC BY 4.0) · ISTAT Censimento 2021 (CC BY 4.0)",
        })

    centre_items = [x for x in items if match_zone_spec(x)["macroArea"] == "historic_centre"]
    hc = census.get("historicCentre", {})
    city_c = census.get("city", {})

    centre_summary = summarize_listings(
        centre_items,
        int(hc.get("population", 49899)),
        int(hc.get("dwellingsTotal", 42375)),
        int(hc.get("dwellingsEmptyOrNonResident", 16011)),
    )
    city_summary = summarize_listings(
        items,
        int(city_c.get("population", 251944)),
        int(city_c.get("dwellingsTotal", 148319)),
        int(city_c.get("dwellingsEmptyOrNonResident", 25627)),
    )

    cells = aggregate_cells(items)
    points = drop_isolated(export_points(items, zone_index_by_id))
    return {
        "snapshotDate": snapshot_date,
        "totalListings": len(items),
        "city": city_summary,
        "historicCentre": centre_summary,
        "zones": zones,
        "origin": [FRAME[0], FRAME[1]],
        "cellDeg": [CELL_DLON, CELL_DLAT],
        "cells": cells,
        "points": points,
        "pointsNote": "Punti con posizione già spostata da Airbnb fino a 150 m; nelle celle con meno di 3 annunci solo il conteggio della cella.",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", help="File listings.csv locale già scaricato")
    parser.add_argument("--date", default="2026-09-16", help="Data dello snapshot (YYYY-MM-DD)")
    args = parser.parse_args()

    try:
        with open(CENSUS_FILE, encoding="utf-8") as fh:
            census = json.load(fh)
        if args.file:
            raw_file = open(args.file, "rb").read()
            csv_text = (gzip.decompress(raw_file) if args.file.endswith(".gz") else raw_file).decode("utf-8-sig", errors="replace")
            snapshot_date = args.date
        else:
            portal_html = fetch_text(PORTAL_URL, timeout=60)
            found = latest_venice_csv_url(portal_html)
            if not found:
                logging.error("Nessuno snapshot di Venezia trovato su %s", PORTAL_URL)
                return 1
            snapshot_date, csv_url = found
            logging.info("Download Inside Airbnb Venezia (%s): %s", snapshot_date, csv_url)
            raw = fetch_bytes(csv_url, timeout=300, retries=2)
            csv_text = gzip.decompress(raw).decode("utf-8-sig", errors="replace")
        data = build(csv_text, census, snapshot_date)
    except Exception as e:  # noqa: BLE001
        logging.error("Import Inside Airbnb fallito: %s", e)
        return 1

    out = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "Inside Airbnb – Venezia (annunci anonimizzati e aggregati) & ISTAT Censimento 2021",
        "sourceUrl": "https://insideairbnb.com/get-the-data/",
        "license": "CC BY 4.0",
        "attribution": "Dati Inside Airbnb (CC BY 4.0, insideairbnb.com) incrociati con il Censimento ISTAT 2021 (CC BY 4.0). Scartati alla fonte id, titoli, host_id, host_name e codici CIN individuali.",
        **data,
    }
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write("\n")
    logging.info(
        "Inside Airbnb %s: %d annunci totali (%d nel centro storico), %d zone, %d celle da ~100 m",
        data["snapshotDate"],
        data["totalListings"],
        data["historicCentre"]["totalStructures"],
        len(data["zones"]),
        len(data["cells"]),
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
