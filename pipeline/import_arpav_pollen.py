#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: pollini misurati da ARPAV alla stazione aerobiologica di Venezia.

ARPAV pubblica le concentrazioni giornaliere (granuli/m³) per famiglia, un file per stazione e anno.
La pipeline prende l'anno più recente disponibile e calcola media e massimo mensile per le famiglie
più rilevanti per le allergie, comprese parietaria (Urticaceae) e cipressi, assenti dal modello CAMS.
Licenza: CC BY 4.0 - ARPAV. Output: web/src/data/arpav-pollen-venezia.json
Uso: python import_arpav_pollen.py
"""

import csv
import io
import json
import logging
import os
import sys
import urllib.request
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "arpav-pollen-venezia.json")
URL = "https://www.arpa.veneto.it/dati-ambientali/open-data/file-e-allegati/pollini/{year}/polline_venezia_{year}.csv/@@download/file"
SOURCE_PAGE = "https://www.arpa.veneto.it/dati-ambientali/open-data/file-e-allegati/pollini"

# Colonne del file ARPAV -> chiave usata nell'interfaccia
FAMILIES = {
    "URTICACEAE": "urticaceae",
    "GRAMINEAE": "gramineae",
    "CUPRESSACEAE/TAXACEAE": "cupressaceae",
    "BETULACEAE": "betulaceae",
    "CORYLACEAE": "corylaceae",
    "OLEACEAE": "oleaceae",
    "COMPOSITAE": "compositae",
    "PINACEAE": "pinaceae",
}


def download(url: str) -> str | None:
    req = urllib.request.Request(url, headers={"User-Agent": "VOD-VeniceOpenData/1.0 (pipeline)"})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            if resp.status != 200:
                return None
            return resp.read().decode("utf-8-sig", errors="replace")
    except Exception:  # noqa: BLE001 - anno non ancora pubblicato
        return None


def monthly_profile(text: str) -> dict:
    """{famiglia: {'mean': [12 valori], 'max': [12 valori]}} e numero di giorni con dati."""
    rows = list(csv.reader(io.StringIO(text)))
    header = rows[0]
    # Prima occorrenza di ogni famiglia (alcuni nomi come 'Altri' si ripetono)
    index = {}
    for i, name in enumerate(header):
        if name in FAMILIES and name not in index:
            index[name] = i
    sums = {k: [0.0] * 12 for k in FAMILIES.values()}
    counts = {k: [0] * 12 for k in FAMILIES.values()}
    maxes = {k: [0.0] * 12 for k in FAMILIES.values()}
    days = 0
    for r in rows[1:]:
        if not r or not r[0] or not any(x.strip() for x in r[1:]):
            continue
        try:
            month = int(r[0].split("/")[1]) - 1
        except (IndexError, ValueError):
            continue
        days += 1
        for col, key in FAMILIES.items():
            if col not in index or index[col] >= len(r):
                continue
            try:
                v = float(r[index[col]].replace(",", "."))
            except ValueError:
                continue
            sums[key][month] += v
            counts[key][month] += 1
            maxes[key][month] = max(maxes[key][month], v)
    profile = {
        key: {
            "mean": [round(sums[key][m] / counts[key][m], 1) if counts[key][m] else None for m in range(12)],
            "max": [round(maxes[key][m], 1) if counts[key][m] else None for m in range(12)],
        }
        for key in FAMILIES.values()
    }
    return {"days": days, "families": profile}


def main() -> int:
    this_year = datetime.now(timezone.utc).year
    for year in range(this_year, this_year - 3, -1):
        text = download(URL.format(year=year))
        if not text:
            continue
        data = monthly_profile(text)
        if data["days"] < 60:
            logging.info("Anno %d con soli %d giorni: provo il precedente", year, data["days"])
            continue
        out = {
            "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "source": "ARPAV - stazione aerobiologica di Venezia",
            "sourceUrl": SOURCE_PAGE,
            "license": "CC BY 4.0",
            "year": year,
            **data,
        }
        os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
        with open(OUT_FILE, "w", encoding="utf-8") as fh:
            json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
            fh.write("\n")
        logging.info("Pollini ARPAV Venezia %d: %d giorni", year, data["days"])
        return 0
    logging.error("Nessun file pollini ARPAV di Venezia negli ultimi anni")
    return 1


if __name__ == "__main__":
    sys.exit(main())
