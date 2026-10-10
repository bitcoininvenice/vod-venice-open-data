#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: sonde multiparametriche ARPAV nella laguna di Venezia e riepilogo della balneazione.

- Dati sonda: profili di temperatura, conducibilità, salinità, ossigeno, pH e clorofilla misurati da
  ARPAV nelle stazioni di monitoraggio ecologico della laguna (un file per anno). Per ogni stazione si
  tiene l'ultimo campionamento dell'anno, al punto più vicino alla superficie.
- Balneazione: numero di punti, percentuale di idonei e classi di qualità per anno (riepilogo regionale).

Coordinate di origine in Gauss-Boaga fuso Ovest (EPSG:3003), convertite in WGS84 con pyproj.
Licenza: CC BY 4.0 - ARPAV. Output: web/src/data/arpav-lagoon.json
Uso: python import_arpav_lagoon.py
     python import_arpav_lagoon.py --probe-file sonda.csv --year 2026 --bathing-file balneazione.csv  (file già scaricati)
"""

import argparse
import csv
import io
import json
import logging
import os
import re
import sys
from datetime import datetime, timezone

from pyproj import Transformer
from vod_http import fetch_text

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "arpav-lagoon.json")
SITE = "https://www.arpa.veneto.it"
PROBE_FOLDER = f"{SITE}/dati-ambientali/open-data/file-e-allegati/soaml/laguna-di-venezia/dati-sonda"
SOAML_FOLDER = f"{SITE}/dati-ambientali/open-data/file-e-allegati/soaml"

FIELDS = {
    "Temperatura acqua (gradi C.)": "waterTempCelsius",
    "Conducibilità (mS/cm)": "conductivityMsCm",
    "Salinità (psu)": "salinityPsu",
    "Ossigeno disciolto (%)": "dissolvedOxygenPercent",
    "Ossigeno disciolto (ppm)": "dissolvedOxygenMgL",
    "pH": "ph",
    'Clorofilla "a" (µg/l)': "chlorophyllUgL",
}

TO_WGS84 = Transformer.from_crs(3003, 4326, always_xy=True)


def fetch(url: str, retries: int = 4) -> str:
    """Il sito ARPAV a volte non risponde: si riprova con attese crescenti."""
    return fetch_text(url, timeout=90, retries=retries, backoff=10)


def files_by_year(folder_html: str) -> dict[int, str]:
    """Link di download per anno (i nomi dei file ARPAV cambiano da un anno all'altro)."""
    out: dict[int, str] = {}
    for href in re.findall(r'href="(/dati-ambientali/open-data/file-e-allegati/soaml/laguna-di-venezia/dati-sonda/[^"]+@@download/file)"', folder_html):
        m = re.search(r"(20\d{2})", href.split("/dati-sonda/")[1])
        if m:
            out[int(m.group(1))] = SITE + href
    return out


def num(value: str | None) -> float | None:
    try:
        return round(float((value or "").replace(",", ".")), 2)
    except ValueError:
        return None


def iso_date(d: str) -> str:
    dd, mm, yyyy = d.split("/")
    return f"{yyyy}-{mm}-{dd}"


def latest_surface(rows: list[dict]) -> list[dict]:
    """Per stazione: ultimo giorno di campionamento, riga più vicina alla superficie."""
    by_station: dict[str, list[dict]] = {}
    for r in rows:
        if r.get("Stazione") and r.get("Data"):
            by_station.setdefault(r["Stazione"].strip(), []).append(r)
    out = []
    for code, rs in by_station.items():
        dates = sorted({iso_date(r["Data"]) for r in rs})
        last = dates[-1]
        same_day = [r for r in rs if iso_date(r["Data"]) == last]
        surface = min(same_day, key=lambda r: abs(num(r.get("Profondita' (m)")) or 0))
        x, y = float(surface["GBO X"]), float(surface["GBO Y"])
        lon, lat = TO_WGS84.transform(x, y)
        item = {
            "id": code,
            "stationName": code,
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "sampledAt": last,
            "time": surface.get("Orario"),
            "depthMeters": abs(num(surface.get("Profondita' (m)")) or 0),
            "samplingDays": len(dates),
        }
        for src, key in FIELDS.items():
            item[key] = num(surface.get(src))
        out.append(item)
    out.sort(key=lambda s: s["id"])
    return out


def bathing_summary(text: str) -> dict | None:
    """Ultimo anno del riepilogo regionale: punti, % idonei e classi per il mare Adriatico."""
    rows = list(csv.DictReader(io.StringIO(text)))
    years = sorted({int(r["Anno"]) for r in rows if r.get("Anno", "").isdigit()})
    if not years:
        return None
    y = years[-1]
    pick = {r["variabile"].strip().lower(): num(r.get("mare_Adriatico")) for r in rows if r.get("Anno") == str(y)}
    get = lambda prefix: next((v for k, v in pick.items() if k.startswith(prefix)), None)  # noqa: E731
    return {
        "year": y,
        "area": "Mare Adriatico (Veneto)",
        "points": int(get("n° punti totali")) if get("n° punti totali") is not None else None,
        "suitablePercent": get("% punti idonei"),
        "excellentPercent": get("% in classe eccellente"),
        "goodPercent": get("% in classe  buona") or get("% in classe buona"),
        "sufficientPercent": get("% in classe sufficiente"),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--probe-file", help="CSV sonda già scaricato (invece del download)")
    parser.add_argument("--year", type=int, help="anno del CSV sonda locale")
    parser.add_argument("--bathing-file", help="CSV riepilogo balneazione già scaricato")
    args = parser.parse_args()
    try:
        if args.probe_file:
            if not args.year:
                parser.error("--year è obbligatorio con --probe-file")
            year = args.year
            with open(args.probe_file, encoding="utf-8-sig", errors="replace") as fh:
                probe_text = fh.read()
        else:
            links = files_by_year(fetch(PROBE_FOLDER))
            if not links:
                logging.error("Nessun file sonda trovato nella cartella ARPAV")
                return 1
            year = max(links)
            probe_text = fetch(links[year])
        stations = latest_surface(list(csv.DictReader(io.StringIO(probe_text))))
        if args.bathing_file:
            with open(args.bathing_file, encoding="utf-8-sig", errors="replace") as fh:
                bathing = bathing_summary(fh.read())
        else:
            m = re.search(r'href="(/dati-ambientali/open-data/file-e-allegati/soaml/balneazione_punti-idonei_[^"]+\.csv/@@download/file)"', fetch(SOAML_FOLDER))
            bathing = bathing_summary(fetch(SITE + m.group(1))) if m else None
    except Exception as e:  # noqa: BLE001
        logging.error("Dati ARPAV laguna non aggiornati: %s", e)
        return 1

    if len(stations) < 10:
        logging.error("Solo %d stazioni nel file %d: dati non aggiornati", len(stations), year)
        return 1
    out = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "ARPAV - monitoraggio ecologico della laguna di Venezia (dati sonda)",
        "sourceUrl": PROBE_FOLDER,
        "license": "CC BY 4.0",
        "year": year,
        "stations": stations,
        "bathing": bathing,
    }
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write("\n")
    logging.info("Sonde ARPAV %d: %d stazioni; balneazione %s", year, len(stations), bathing)
    return 0


if __name__ == "__main__":
    sys.exit(main())
