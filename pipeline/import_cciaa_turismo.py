#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: arrivi, presenze turistiche e popolazione dei comuni della laguna.

Fonte: Camera di Commercio Venezia Rovigo su dati Regione del Veneto (turismo) e ISTAT (popolazione),
pubblicati su opengovernment.unioncamere.gov.it e dati.gov.it. Licenza CC BY 4.0.
Output: web/src/data/turismo-comuni.json
Uso: python import_cciaa_turismo.py
"""

import csv
import io
import json
import logging
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "turismo-comuni.json")

TOURISM_URL = "https://opengovernment.unioncamere.gov.it/download/20645"
POPULATION_URL = "https://opengovernment.unioncamere.gov.it/download/20647"
# Comuni affacciati sulla laguna di Venezia (codici ISTAT)
COMUNI = {"027042": "Venezia", "027008": "Chioggia", "027044": "Cavallino-Treporti"}


def download(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "VOD-VeniceOpenData/1.0 (pipeline)"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8-sig")


def to_int(value: str | None) -> int | None:
    digits = re.sub(r"[^\d]", "", value or "")
    return int(digits) if digits else None


def parse_rows(text: str) -> list[dict]:
    return list(csv.DictReader(io.StringIO(text), delimiter=";"))


def year_from_header(fields: list[str], pattern: str) -> int | None:
    for f in fields:
        m = re.search(pattern, f)
        if m:
            return int(m.group(1))
    return None


def build(tourism_csv: str, population_csv: str) -> dict:
    tourism = parse_rows(tourism_csv)
    population = parse_rows(population_csv)
    t_fields = list(tourism[0].keys()) if tourism else []
    p_fields = list(population[0].keys()) if population else []
    t_year = year_from_header(t_fields, r"ARRIVI (\d{4})")
    p_year = year_from_header(p_fields, r"1/01/(\d{4})")
    arrivals_key = next(f for f in t_fields if f.startswith("ARRIVI"))
    presences_key = next(f for f in t_fields if f.startswith("PRESENZE"))
    total_key = next(f for f in p_fields if f.endswith("Totale"))
    foreign_key = next(f for f in p_fields if "stranieri" in f)

    by_code_t = {r["CODICE COMUNE"].strip(): r for r in tourism}
    by_code_p = {r["CODICE COMUNE"].strip(): r for r in population}
    comuni = []
    for code, name in COMUNI.items():
        t, p = by_code_t.get(code), by_code_p.get(code)
        if not t or not p:
            raise ValueError(f"comune {code} mancante nei file")
        arrivals, presences = to_int(t[arrivals_key]), to_int(t[presences_key])
        residents = to_int(p[total_key])
        comuni.append({
            "code": code,
            "name": name,
            "arrivals": arrivals,
            "presences": presences,
            "residents": residents,
            "foreignResidents": to_int(p[foreign_key]),
            "presencesPerResident": round(presences / residents, 1) if presences and residents else None,
            "avgStayNights": round(presences / arrivals, 2) if presences and arrivals else None,
        })
    return {"tourismYear": t_year, "populationDate": f"{p_year}-01-01" if p_year else None, "comuni": comuni}


def main() -> int:
    try:
        data = build(download(TOURISM_URL), download(POPULATION_URL))
    except Exception as e:  # noqa: BLE001
        logging.error("Dati Camera di Commercio non aggiornati: %s", e)
        return 1
    out = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "Camera di Commercio Venezia Rovigo su dati Regione del Veneto (turismo) e ISTAT (popolazione)",
        "sourceUrl": "https://opengovernment.unioncamere.gov.it",
        "license": "CC BY 4.0",
        **data,
    }
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    logging.info("Turismo %s: %s", data["tourismYear"], [(c["name"], c["presences"]) for c in data["comuni"]])
    return 0


if __name__ == "__main__":
    sys.exit(main())
