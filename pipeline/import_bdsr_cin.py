#!/usr/bin/env python3
"""
Strutture ricettive e codici CIN dalla Banca Dati Strutture Ricettive (BDSR) del Ministero del Turismo.

Il file «BDSR in numeri» si scarica a mano dalla mappa del Ministero (CSV per regione, solo conteggi per comune e
categoria ISTAT, nessun dato personale) e si mette in data/bdsr/ (fuori dal repository: .gitignore). Il sito non
dichiara una licenza: dati pubblicati da una PA senza licenza espressa, art. 52 c. 2 del CAD (riuso citando la
fonte). Tutti i numeri, anche quelli della regione e delle province, si calcolano dal CSV: nessun valore a mano.

Uso: python import_bdsr_cin.py [--csv data/bdsr/Veneto17_10_2026.csv]
Output: web/src/data/bdsr-cin-veneto.json
"""

import csv
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "data" / "bdsr" / "Veneto17_10_2026.csv"
OUT_JSON = ROOT / "web" / "src" / "data" / "bdsr-cin-veneto.json"

def process_bdsr_rows(rows: list[dict], snapshot: str) -> dict:
    # 1. Analisi Comune di Venezia
    ve_rows = [r for r in rows if r["Comune"].lower() == "venezia"]
    tot_strutture = sum(int(r["Totale strutture"]) for r in ve_rows)
    tot_cin_verif = sum(int(r["Totale strutture con CIN verificato"]) for r in ve_rows)
    tot_cin_in_verif = sum(int(r["Totale strutture con CIN non verificato"]) for r in ve_rows)
    tot_senza_cin = sum(int(r["Totale strutture senza CIN"]) for r in ve_rows)

    macro_dict = {}
    for r in ve_rows:
        macro_code = r["Codice Macrocategoria ISTAT"]
        macro_name = r["Macrocategoria ISTAT"]
        if macro_code not in macro_dict:
            macro_dict[macro_code] = {
                "code": macro_code,
                "name": macro_name,
                "total": 0,
                "cinVerified": 0,
                "cinMissing": 0,
                "categories": {},
            }
        m = macro_dict[macro_code]
        t = int(r["Totale strutture"])
        cv = int(r["Totale strutture con CIN verificato"])
        cm = int(r["Totale strutture senza CIN"])
        m["total"] += t
        m["cinVerified"] += cv
        m["cinMissing"] += cm

        sub_code = r["Codice Sottocategoria ISTAT"]
        m["categories"][sub_code] = {
            "subCode": sub_code,
            "categoryCode": r["Codice Categoria ISTAT"],
            "categoryName": r["Categoria ISTAT"],
            "description": r["Sottocategoria ISTAT"],
            "total": t,
            "cinVerified": cv,
            "cinMissing": cm,
            "pctCinVerified": round((cv / t * 100), 2) if t > 0 else 0.0,
        }

    macro_list = []
    for code in sorted(macro_dict.keys()):
        item = macro_dict[code]
        item["pctCinVerified"] = (
            round((item["cinVerified"] / item["total"] * 100), 2)
            if item["total"] > 0
            else 0.0
        )
        item["categoriesList"] = list(item["categories"].values())
        del item["categories"]
        macro_list.append(item)

    # 2. Analisi Comuni della Provincia di Venezia
    ve_prov_rows = [r for r in rows if r["Provincia"].lower() == "venezia"]
    comuni_map = {}
    for r in ve_prov_rows:
        c_code = r["Codice ISTAT Comune"]
        c_name = r["Comune"]
        if c_code not in comuni_map:
            comuni_map[c_code] = {
                "istatCode": f"027{c_code}",
                "name": c_name,
                "totalStructures": 0,
                "cinVerified": 0,
                "cinMissing": 0,
                "hotels": 0,
                "extraHotel": 0,
                "privateRentals": 0,
            }
        cm = comuni_map[c_code]
        t = int(r["Totale strutture"])
        cv = int(r["Totale strutture con CIN verificato"])
        cs = int(r["Totale strutture senza CIN"])
        macro = r["Codice Macrocategoria ISTAT"]

        cm["totalStructures"] += t
        cm["cinVerified"] += cv
        cm["cinMissing"] += cs
        if macro == "A":
            cm["hotels"] += t
        elif macro == "B":
            cm["extraHotel"] += t
        elif macro == "C":
            cm["privateRentals"] += t

    comuni_list = list(comuni_map.values())
    for c in comuni_list:
        c["pctCinVerified"] = (
            round((c["cinVerified"] / c["totalStructures"] * 100), 2)
            if c["totalStructures"] > 0
            else 0.0
        )
    comuni_list.sort(key=lambda x: x["totalStructures"], reverse=True)

    # 3. Regione e province, sempre dal CSV
    def totals(subset: list[dict]) -> dict:
        t = sum(int(r["Totale strutture"]) for r in subset)
        cv = sum(int(r["Totale strutture con CIN verificato"]) for r in subset)
        cn = sum(int(r["Totale strutture con CIN non verificato"]) for r in subset)
        return {"totalStructures": t, "cinVerified": cv, "cinNotVerified": cn, "pctCinVerified": round(cv / t * 100, 2) if t else 0.0}

    provinces = []
    for name in sorted({r["Provincia"] for r in rows}):
        sub = [r for r in rows if r["Provincia"] == name]
        provinces.append({"code": sub[0].get("Codice ISTAT Provincia", ""), "name": name, **totals(sub)})
    provinces.sort(key=lambda p: -p["totalStructures"])

    def by_sub(code: str) -> int:
        return sum(int(r["Totale strutture"]) for r in ve_rows if r["Codice Sottocategoria ISTAT"] == code)

    # 4. Costruzione oggetto finale
    payload = {
        "metadata": {
            "source": "Ministero del Turismo – BDSR (Banca Dati Strutture Ricettive)",
            "sourceUrl": "https://bdsr.ministeroturismo.gov.it/mappa-italia",
            "snapshotDate": snapshot,
            "license": "Dati pubblicati dalla PA senza licenza espressa: art. 52 c. 2 D.Lgs. 82/2005 (riuso citando la fonte)",
            "attribution": f"Ministero del Turismo – BDSR in numeri, estrazione del {snapshot}",
        },
        "venetoRegion": {**totals(rows), "provinces": provinces},
        "veneziaMunicipality": {
            "istatCode": "027042",
            "name": "Venezia",
            "totalStructures": tot_strutture,
            "cinVerified": tot_cin_verif,
            "cinInVerification": tot_cin_in_verif,
            "cinMissing": tot_senza_cin,
            "pctCinVerified": round((tot_cin_verif / tot_strutture * 100), 2),
            "macroCategories": macro_list,
            # Sintesi chiave
            # B405: case e appartamenti per vacanze gestiti in forma imprenditoriale; C204: locazioni turistiche
            "entrepreneurialRentals": by_sub("B405"),
            "privateNonEntrepreneurialRentals": by_sub("C204"),
            "totalTouristRentals": by_sub("B405") + by_sub("C204"),
            "totalHotels": sum(int(r["Totale strutture"]) for r in ve_rows if r["Codice Macrocategoria ISTAT"] == "A"),
        },
        "metropolitanMunicipalities": comuni_list[:12],  # I primi 12 comuni della Città Metropolitana
    }
    return payload


def run():
    import argparse
    import re

    ap = argparse.ArgumentParser(description="BDSR: strutture ricettive e CIN dal CSV del Ministero del Turismo")
    ap.add_argument("--csv", default=str(CSV_PATH))
    args = ap.parse_args()
    path = Path(args.csv)
    if not path.exists():
        raise FileNotFoundError(f"File non trovato: {path}")
    with open(path, mode="r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    # data dell'estrazione dal nome del file («Veneto17_10_2026.csv»)
    m = re.search(r"(\d{2})_(\d{2})_(\d{4})", path.name)
    snapshot = f"{m.group(1)}/{m.group(2)}/{m.group(3)}" if m else "n.d."
    payload = process_bdsr_rows(rows, snapshot)

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    ve = payload["veneziaMunicipality"]
    print(f"Salvataggio completato in: {OUT_JSON}")
    print(f"Venezia: {ve['totalStructures']} strutture, {ve['cinVerified']} con CIN ({ve['pctCinVerified']}%)")


if __name__ == "__main__":
    run()
