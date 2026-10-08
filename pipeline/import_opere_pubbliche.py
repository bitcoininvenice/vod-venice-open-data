#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: opere pubbliche del Comune di Venezia (Elenco Annuale dei Lavori) da dati.venezia.it.

Licenza dei dati: CC BY (Comune di Venezia). Il CSV non contiene coordinate: le opere che nominano
un luogo riconoscibile (ponte, fondamenta, campo, via, scuola...) vengono geocodificate con
OpenStreetMap Nominatim (© OpenStreetMap contributors, ODbL) e marcate come posizione approssimata.
Le altre restano nell'elenco senza posizione sulla mappa.

Output: web/src/data/opere-pubbliche.json
Uso:    python import_opere_pubbliche.py [--no-geocode]
"""

import argparse
import csv
import io
import json
import logging
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime
from zoneinfo import ZoneInfo

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "opere-pubbliche.json")
# Versionata: posizioni stabili tra un aggiornamento e l'altro, nessuna nuova richiesta a Nominatim per luoghi noti
CACHE_FILE = os.path.join(BASE_DIR, "geocode-cache.json")

# Ultima variazione pubblicata dell'Elenco Annuale dei Lavori 2026 (pagina dataset su dati.venezia.it)
SOURCE_URL = os.environ.get(
    "OPERE_PUBBLICHE_URL",
    "https://dati.venezia.it/sites/default/files/dataset/opendata/PEC_EA2026_v8_OD_001.csv",
)
SOURCE_PAGE = "https://dati.venezia.it/?q=content/elenco-annuale-dei-lavori-2026-variazione-di-bilancio-0"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "VOD-VeniceOpenData/1.0 (pipeline opere pubbliche)"

# Area della mappa VOD (lon0, lat0, lon1, lat1)
BBOX = (12.135, 45.205, 12.47, 45.555)

PLACE_PATTERN = re.compile(
    r"\b(PONTE|FONDAMENTA|FONDAMENTE|CAMPO|CAMPIELLO|CALLE|RIO TERÀ|RIO TERA'|RIVA|PIAZZALE|PIAZZA|"
    r"VIA|VIALE|CORSO|ISOLA|PARCO|STADIO|TEATRO|PALAZZO|FORTE|SCUOLA|ASILO|NIDO|PALESTRA|CIMITERO|"
    r"MERCATO|BIBLIOTECA|CENTRO CIVICO|VILLA)\s+([A-ZÀ-Ü0-9'’. ]{3,60})"
)
# Taglia quanto segue il nome del luogo (congiunzioni, località aggiunte, "c/o", lotti...)
STOPWORDS = re.compile(r"\s+(E|ED|PER|CON|AL|ALLA|ALLE|A|IN|C|PRESSO|DI COMPLETAMENTO|LOTTO|STRALCIO|INTERVENTI?|-|–)\b.*$")
# Impianti sportivi: "campo" non indica un campo veneziano
EXCLUDED = re.compile(r"^CAMPO (CALCIO|DA|DI CALCIO|SPORTIVO)")

SESTIERE_PATTERN = re.compile(r"\b(CANNAREGIO|CASTELLO|DORSODURO|SAN MARCO|SAN POLO|SANTA CROCE|GIUDECCA|MURANO|BURANO|PELLESTRINA)\b")

MUNICIPALITY_HINT = {
    "MUNICIPALITA' DI VENEZIA-MURANO-BURANO": "Venezia",
    "MUNICIPALITA' DI LIDO-PELLESTRINA": "Lido di Venezia",
    "MUNICIPALITA' DI MESTRE-CARPENEDO": "Mestre",
    "MUNICIPALITA' DI MARGHERA": "Marghera",
    "MUNICIPALITA' DI CHIRIGNAGO-ZELARINO": "Zelarino",
    "MUNICIPALITA' DI FAVARO VENETO": "Favaro Veneto",
}


def parse_amount(value: str) -> float:
    v = (value or "").strip()
    if not v:
        return 0.0
    if "," in v:
        v = v.replace(".", "").replace(",", ".")
    try:
        return round(float(v), 2)
    except ValueError:
        return 0.0


def place_query(row: dict) -> str | None:
    title = row["oggetto"].upper()
    m = PLACE_PATTERN.search(title)
    if not m:
        return None
    raw = f"{m.group(1)} {m.group(2)}"
    if EXCLUDED.search(raw):
        return None
    name = STOPWORDS.sub("", raw).strip(" .,'/")
    if len(name.split()) < 2:
        return None
    town = MUNICIPALITY_HINT.get(row.get("municipalità", ""), "Venezia")
    # Molti toponimi si ripetono tra sestieri (es. più "Ponte Priuli"): se il titolo cita il sestiere lo si usa
    district = SESTIERE_PATTERN.search(title)
    if district and district.group(1).title() not in name.title():
        return f"{name.title()}, {district.group(1).title()}, {town}"
    return f"{name.title()}, {town}"


def geocode(query: str, cache: dict) -> tuple[float, float] | None:
    if query in cache:
        hit = cache[query]
        return tuple(hit) if hit else None
    params = urllib.parse.urlencode({
        "q": query,
        "format": "jsonv2",
        "limit": 1,
        "countrycodes": "it",
        "viewbox": ",".join(str(v) for v in BBOX),
        "bounded": 1,
    })
    req = urllib.request.Request(f"{NOMINATIM_URL}?{params}", headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            results = json.load(resp)
    except Exception as e:
        logging.warning("Geocodifica fallita per %r: %s", query, e)
        return None
    finally:
        time.sleep(1.1)  # policy Nominatim: massimo una richiesta al secondo
    point = None
    if results:
        lat, lon = float(results[0]["lat"]), float(results[0]["lon"])
        if BBOX[1] <= lat <= BBOX[3] and BBOX[0] <= lon <= BBOX[2]:
            point = (round(lat, 6), round(lon, 6))
    cache[query] = list(point) if point else None
    return point


def provvedimento(row: dict) -> str | None:
    if not row.get("provvedimento_num"):
        return None
    out = f"{row.get('provvedimento_approvato') or 'Provv.'} {row['provvedimento_num']}/{row.get('provvedimento_anno', '')}"
    if row.get("data_approvazione"):
        out += f" del {row['data_approvazione']}"
    return out


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-geocode", action="store_true", help="non interrogare Nominatim (usa solo la cache)")
    args = parser.parse_args()

    req = urllib.request.Request(SOURCE_URL, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            text = resp.read().decode("utf-8-sig")
    except Exception as e:
        logging.error("Download fallito: %s", e)
        return 1
    rows = list(csv.DictReader(io.StringIO(text), delimiter=";"))
    logging.info("Lette %d opere da %s", len(rows), SOURCE_URL)

    cache = {}
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, encoding="utf-8") as f:
            cache = json.load(f)

    works = []
    located = 0
    for row in rows:
        query = place_query(row)
        point = None
        if query and (not args.no_geocode or query in cache):
            point = geocode(query, cache)
        if point:
            located += 1
        works.append({
            "id": int(row["codice_intervento"]) if row["codice_intervento"].isdigit() else len(works) + 1,
            "codice": row["codice_intervento"],
            "titolo": row["oggetto"].strip().capitalize(),
            "localizzazione": query or "Non localizzata",
            "quartiere": (row.get("municipalità") or "").title(),
            "tipologia": (row.get("tipologia") or "").strip(),
            "categoria": (row.get("categoria") or "").strip().capitalize(),
            "stato": (row.get("avanzamento_progetti") or "").strip() or "Programmato",
            "importoLavori": parse_amount(row.get("importo", "")),
            "enteResponsabile": f"Comune di Venezia · RUP {row['rup'].title()}" if row.get("rup") else "Comune di Venezia",
            "cup": row.get("cup") or None,
            "provvedimento": provvedimento(row),
            "finalita": (row.get("finalita") or "").strip() or None,
            "lat": point[0] if point else None,
            "lon": point[1] if point else None,
            "posizioneApprossimata": bool(point),
        })

    os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=1)

    out = {
        "generatedAt": datetime.now(ZoneInfo("Europe/Rome")).isoformat(timespec="seconds"),
        "source": "Comune di Venezia – Elenco Annuale dei Lavori 2026 (dati.venezia.it)",
        "sourceUrl": SOURCE_PAGE,
        "license": "CC BY – Comune di Venezia",
        "geocoding": "OpenStreetMap Nominatim (© OpenStreetMap contributors, ODbL) – posizioni approssimate",
        "count": len(works),
        "located": located,
        "works": works,
    }
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    logging.info("Salvate %d opere (%d localizzate) in %s", len(works), located, os.path.relpath(OUT_FILE, BASE_DIR))
    return 0


if __name__ == "__main__":
    sys.exit(main())
