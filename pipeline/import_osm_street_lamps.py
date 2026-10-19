#!/usr/bin/env python3
"""
Lampioni dell'illuminazione pubblica mappati su OpenStreetMap (highway=street_lamp, ODbL) nell'area della mappa,
con il tipo di supporto (a parete, su palo, sospeso) e la tecnologia della lampada quando sono mappati.

Non esiste un dataset aperto del Comune o di Veritas con i punti luce: la copertura di OpenStreetMap è parziale e
lo si dice. Nessuna potenza, flusso luminoso o temperatura di colore stimata.

Uso: python import_osm_street_lamps.py [--file risposta_overpass.json]
Output: web/src/data/public-lighting-venezia.json
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from datetime import datetime, timezone

from vod_http import overpass

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE_DIR, "..", "web", "src", "data", "public-lighting-venezia.json")

BBOX = (45.205, 12.135, 45.555, 12.47)
QUERY = f"""[out:json][timeout:120];
node["highway"="street_lamp"]({BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]});
out;"""
MIN_LAMPS = 50

# supporto: codice compatto nel file -> valore OSM (support / lamp_mount)
SUPPORT = {"wall_mounted": 1, "wall": 1, "pole": 2, "straight_mast": 2, "bent_mast": 2, "cast_steel_mast": 2, "suspended": 3, "ceiling": 3}
METHOD = {"LED": 1, "led": 1, "high_pressure_sodium": 2, "sodium": 2, "low_pressure_sodium": 2, "metal-halide": 3, "metal_halide": 3, "mercury": 4, "fluorescent": 5, "gas": 6, "incandescent": 7}


def lamp(el: dict) -> list | None:
    tags = el.get("tags", {})
    lat, lon = el.get("lat"), el.get("lon")
    if lat is None or lon is None:
        return None
    support = SUPPORT.get(tags.get("support", "")) or SUPPORT.get(tags.get("lamp_mount", ""), 0)
    method = METHOD.get(tags.get("light:method", "") or tags.get("lamp_type", ""), 0)
    return [round(lon, 6), round(lat, 6), support, method, el["id"]]


def build(payload: dict) -> dict:
    lamps = [x for x in (lamp(e) for e in payload.get("elements", [])) if x]
    if len(lamps) < MIN_LAMPS:
        raise ValueError(f"risposta incompleta: {len(lamps)} lampioni")
    lamps.sort(key=lambda x: (x[1], x[0]))
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "OpenStreetMap contributors",
        "sourceUrl": "https://www.openstreetmap.org/copyright",
        "license": "ODbL 1.0",
        "attribution": "© OpenStreetMap contributors",
        "note": "Lampioni (highway=street_lamp) mappati su OpenStreetMap: copertura parziale, non è il censimento dei punti luce del Comune. Tipo di supporto e tecnologia solo se mappati.",
        "fields": ["lon", "lat", "support (0 n.d., 1 parete, 2 palo, 3 sospeso)", "method (0 n.d., 1 LED, 2 sodio, 3 alogenuri, 4 mercurio, 5 fluorescente, 6 gas, 7 incandescenza)", "osm node id"],
        "count": len(lamps),
        "lamps": lamps,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Lampioni da OpenStreetMap")
    ap.add_argument("--file", help="risposta Overpass salvata (JSON)")
    args = ap.parse_args()
    try:
        payload = json.load(open(args.file, encoding="utf-8")) if args.file else overpass(QUERY, timeout=150, rounds=3)
        data = build(payload)
    except Exception as e:  # noqa: BLE001 - qualsiasi errore lascia il file precedente
        logging.error("Lampioni non aggiornati: %s", e)
        return 1
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    logging.info("Lampioni OSM: %d -> %s", data["count"], OUT)
    return 0


if __name__ == "__main__":
    sys.exit(main())
