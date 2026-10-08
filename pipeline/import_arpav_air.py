#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: qualità dell'aria nelle stazioni ARPAV del Comune di Venezia (dati validati annuali).

Fonte: ARPAV Open Data atmosfera (PM10, PM2.5, NO2), licenza CC BY 4.0.
ARPAV non pubblica un'API aperta con i dati orari: si usano le medie annue validate più recenti.
Le coordinate delle stazioni sono stimate geocodificando la località (OpenStreetMap Nominatim).

Output: web/src/data/arpav-air.json
"""

import csv
import io
import json
import logging
import os
import sys
import urllib.request
from datetime import datetime
from zoneinfo import ZoneInfo

from import_opere_pubbliche import CACHE_FILE, geocode

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "arpav-air.json")
BASE_URL = "https://www.arpa.veneto.it/dati-ambientali/open-data/file-e-allegati/qualita-aria"
FILES = {
    "pm10": f"{BASE_URL}/polveri-pm10_trend.csv/@@download/file",
    "pm25": f"{BASE_URL}/trend_polveri_pm2.5.csv/@@download/file",
    "no2": f"{BASE_URL}/trend_no2.csv/@@download/file",
}
SOURCE_PAGE = "https://www.arpa.veneto.it/dati-ambientali/open-data/atmosfera"

# Località da geocodificare per ciascuna stazione (posizione indicativa del sito di misura)
STATION_PLACES = {
    "IT0448A": "Sacca Fisola, Venezia",
    "IT0963A": "Parco Albanese, Mestre",
    "IT1934A": "Via Cesare Beccaria, Marghera",
    "IT1862A": "Via Tagliamento, Mestre",
    "IT1936A": "Malcontenta, Venezia",
    "IT2319A": "Fondamenta del Rio Novo, Venezia",
    "99914": "Fusina, Venezia",
}
STATION_TYPES = {"TU": "Traffico urbano", "BU": "Fondo urbano", "IS": "Industriale suburbana", "BS": "Fondo suburbano"}


def fetch_csv(url: str) -> list[dict]:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (VOD-VeniceOpenData pipeline)"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return list(csv.DictReader(io.StringIO(resp.read().decode("utf-8-sig"))))


def number(value: str | None) -> float | None:
    try:
        return float((value or "").replace(",", "."))
    except ValueError:
        return None


def value_for(row: dict, suffix: str, year: int) -> float | None:
    """Valore della colonna "<anno> ... <suffix>" per l'anno richiesto (None se assente o "-")."""
    want = " ".join(suffix.split())
    for key, value in row.items():
        norm = " ".join((key or "").split())
        if norm.endswith(want) and norm[:4] == str(year):
            return number(value)
    return None


def latest_year(rows: list[dict], suffix: str) -> int:
    """Anno più recente con almeno un valore pubblicato."""
    want = " ".join(suffix.split())
    years = set()
    for row in rows:
        for key, value in row.items():
            norm = " ".join((key or "").split())
            if norm.endswith(want) and norm[:4].isdigit() and number(value) is not None:
                years.add(int(norm[:4]))
    return max(years)


def main() -> int:
    try:
        data = {k: [r for r in fetch_csv(u) if r.get("Comune") == "Venezia"] for k, u in FILES.items()}
    except Exception as e:
        logging.error("Download ARPAV fallito: %s", e)
        return 1

    cache = {}
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, encoding="utf-8") as f:
            cache = json.load(f)

    # Si usa solo l'anno validato più recente: niente valori vecchi mescolati a quelli nuovi
    year = latest_year(data["pm10"], "PM10 media anno (μg/m3)")
    columns = {
        "pm10": ("pm10", "PM10 media anno (μg/m3)"),
        "pm25": ("pm25", "PM2.5 media anno (μg/m3)"),
        "no2": ("no2", "NO2 media anno (μg/m3)"),
    }
    stations = {}
    for kind, rows in data.items():
        field, suffix = columns[kind]
        for r in rows:
            # I tre file usano intestazioni leggermente diverse
            code = (r.get("Codice identificativo stazione") or r.get("Codice Stazione") or "").strip()
            name = r.get("Stazione di monitoraggio") or r.get("Stazione di riferimento") or code
            st = stations.setdefault(code, {
                "id": code,
                "stationName": name.replace("VE_", "").replace("Via Malcontenta", "Malcontenta").strip(),
                "stationType": STATION_TYPES.get(r["Tipologia stazione"].strip(), r["Tipologia stazione"].strip()),
                "year": year,
                "pm10": None,
                "pm25": None,
                "no2": None,
                "pm10Exceedances": None,
            })
            st[field] = value_for(r, suffix, year)
            if kind == "pm10":
                exc = value_for(r, "PM10 N. superamenti limite giornaliero", year)
                st["pm10Exceedances"] = int(exc) if exc is not None else None

    out_stations = []
    for code, st in stations.items():
        if all(st[k] is None for k in ("pm10", "pm25", "no2")):
            continue  # stazione senza misure nell'anno di riferimento (dismessa)
        place = STATION_PLACES.get(code)
        point = geocode(place, cache) if place else None
        st["lat"], st["lon"] = (point if point else (None, None))
        st["location"] = place or "n.d."
        out_stations.append(st)

    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=1)

    out = {
        "generatedAt": datetime.now(ZoneInfo("Europe/Rome")).isoformat(timespec="seconds"),
        "source": "ARPAV – Open Data qualità dell'aria (medie annue validate)",
        "sourceUrl": SOURCE_PAGE,
        "license": "CC BY 4.0 – ARPAV",
        "stations": sorted(out_stations, key=lambda s: s["stationName"]),
    }
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    logging.info("Salvate %d stazioni ARPAV in %s", len(out_stations), os.path.relpath(OUT_FILE, BASE_DIR))
    return 0


if __name__ == "__main__":
    sys.exit(main())
