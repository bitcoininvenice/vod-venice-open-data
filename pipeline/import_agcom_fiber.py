#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: copertura della rete fissa (FTTH, FTTC, ADSL) dalla Broadband Map di AGCOM.

AGCOM pubblica la velocità massima attesa in download su celle di 20 x 20 m, con tecnologia e
operatori dell'infrastruttura. La pipeline legge la pubblicazione più recente nell'area della mappa VOD
e la aggrega su celle di circa 100 m, tenendo la tecnologia migliore presente nella cella.
"Copertura" significa che la rete raggiunge la zona, non che un servizio sia attivo.

Licenza: CC BY 4.0 - "BroadbandMap di Agcom - Autorità per le garanzie nelle comunicazioni"
(https://www.agcom.it/termini-e-condizioni). Va citata la fonte con il logo CC BY.
Output: web/src/data/agcom-fiber.json (letto da web/src/lib/fiber.ts).
Uso: python import_agcom_fiber.py
"""

import json
import logging
import math
import os
import re
import sys
import time
from datetime import datetime, timezone
from vod_http import fetch_json

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "agcom-fiber.json")
SERVICES = "https://geo3.agcom.it/MapET-SFS/rest/services"

# Cornice della mappa VOD (lon/lat) e passo dell'aggregazione (~100 m a questa latitudine)
FRAME = (12.135, 45.205, 12.47, 45.555)
CELL_DLON = 0.00128
CELL_DLAT = 0.0009
PAGE = 1000

# Classi di tecnologia, dalla migliore: il codice numerico è quello salvato nel JSON
TECH_CLASSES = {"FTTH": 3, "FTTC": 2, "ADSL": 1}
# Operatori dell'infrastruttura FTTH: bit per operatore
OPERATOR_BITS = {"Open Fiber": 1, "TIM Wholesale": 2}
OTHER_OPERATOR_BIT = 4


def get_json(url: str, params: dict | None = None, retries: int = 3) -> dict:
    data = fetch_json(url, params={**(params or {}), "f": "json"}, timeout=90, retries=retries, backoff=5)
    if "error" in data:
        raise RuntimeError(data["error"])
    return data


def latest_service(folders: list[str], services_by_folder: dict[str, list[str]]) -> str | None:
    """Nome del servizio grid20_speed_down_AAAAMMGG più recente (esclusi i 'dyn')."""
    best = None
    for folder in folders:
        if not re.fullmatch(r"Grid20_\d{4}", folder):
            continue
        for name in services_by_folder.get(folder, []):
            m = re.fullmatch(rf"{folder}/grid20_speed_down_(\d{{8}})", name)
            if m and (best is None or m.group(1) > best[0]):
                best = (m.group(1), name)
    return best[1] if best else None


def tech_class(text: str | None) -> int:
    """'300 - 2500 [FTTH]' -> 3, '50 - 100 [FTTC-100]' -> 2, '[ADSL]' -> 1, altrimenti 0."""
    m = re.search(r"\[([A-Z]+)", text or "")
    return TECH_CLASSES.get(m.group(1), 0) if m else 0


def operator_mask(text: str | None) -> int:
    mask = 0
    for name in filter(None, (s.strip() for s in (text or "").split(";"))):
        mask |= OPERATOR_BITS.get(name, OTHER_OPERATOR_BIT)
    return mask


def ring_centroid(rings: list) -> tuple[float, float] | None:
    pts = rings[0][:-1] if rings and len(rings[0]) > 1 else []
    if not pts:
        return None
    return sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)


def aggregate(features: list[tuple[float, float, int, int]]) -> dict[tuple[int, int], tuple[int, int, int]]:
    """(lon, lat, classe, operatori) -> {(i, j): (classe migliore, operatori FTTH, celle da 20 m)}."""
    cells: dict[tuple[int, int], tuple[int, int, int]] = {}
    for lon, lat, cls, ops in features:
        key = (int((lon - FRAME[0]) // CELL_DLON), int((lat - FRAME[1]) // CELL_DLAT))
        best, mask, n = cells.get(key, (0, 0, 0))
        cells[key] = (max(best, cls), mask | (ops if cls == 3 else 0), n + 1)
    return cells


def envelope(box: tuple[float, float, float, float]) -> dict:
    return {
        "geometry": ",".join(str(v) for v in box), "geometryType": "esriGeometryEnvelope", "inSR": 3857,
        "spatialRel": "esriSpatialRelIntersects",
    }


def count_cells(layer: str, box: tuple[float, float, float, float]) -> int:
    return int(get_json(layer, {**envelope(box), "returnCountOnly": "true"})["count"])


def quadrants(box: tuple[float, float, float, float]) -> list[tuple[float, float, float, float]]:
    x0, y0, x1, y1 = box
    xm, ym = (x0 + x1) / 2, (y0 + y1) / 2
    return [(x0, y0, xm, ym), (xm, y0, x1, ym), (x0, ym, xm, y1), (xm, ym, x1, y1)]


def split_boxes(layer: str, box: tuple[float, float, float, float], count: int) -> list[tuple[float, float, float, float]]:
    """Riquadri con meno di PAGE celle ciascuno (quelli vuoti vengono scartati)."""
    if count == 0:
        return []
    if count < PAGE:
        return [box]
    out = []
    for q in quadrants(box):
        out += split_boxes(layer, q, count_cells(layer, q))
    return out


def query_box(layer: str, box: tuple[float, float, float, float]) -> list[dict]:
    return get_json(layer, {
        **envelope(box), "outSR": 4326, "returnGeometry": "true",
        "outFields": "fid,speed_down_exp_tech_text,infrastruttura_ftthb_all",
    }).get("features", [])


def to_mercator(lon: float, lat: float) -> tuple[float, float]:
    return lon * 20037508.34 / 180, math.log(math.tan((90 + lat) * math.pi / 360)) * 20037508.34 / math.pi


def main() -> int:
    try:
        root = get_json(SERVICES)
        folders = root.get("folders", [])
        by_folder = {f: [s["name"] for s in get_json(f"{SERVICES}/{f}").get("services", [])] for f in folders if f.startswith("Grid20_")}
        service = latest_service(folders, by_folder)
        if not service:
            logging.error("Nessuna pubblicazione grid20_speed_down trovata")
            return 1
        data_date = service[-8:]
        logging.info("Pubblicazione AGCOM: %s", service)

        layer = f"{SERVICES}/{service}/MapServer/0/query"
        x0, y0 = to_mercator(FRAME[0], FRAME[1])
        x1, y1 = to_mercator(FRAME[2], FRAME[3])
        total = count_cells(layer, (x0, y0, x1, y1))
        logging.info("Celle da 20 m nell'area: %d", total)

        # Il servizio non supporta la paginazione (resultOffset viene ignorato): si divide l'area in
        # riquadri finché ognuno contiene meno celle del limite di risposta
        seen: set[int] = set()
        features: list[tuple[float, float, int, int]] = []
        for box in split_boxes(layer, (x0, y0, x1, y1), total):
            for f in query_box(layer, box):
                a = f.get("attributes", {})
                if a.get("fid") in seen:
                    continue
                seen.add(a.get("fid"))
                c = ring_centroid(f.get("geometry", {}).get("rings", []))
                cls = tech_class(a.get("speed_down_exp_tech_text"))
                if c and cls:
                    features.append((c[0], c[1], cls, operator_mask(a.get("infrastruttura_ftthb_all"))))
            time.sleep(0.2)  # carico leggero sul server AGCOM
        logging.info("Celle uniche scaricate: %d", len(seen))
    except Exception as e:  # noqa: BLE001
        logging.error("Download AGCOM fallito: %s", e)
        return 1

    if len(seen) < total * 0.98:
        logging.error("Scaricate solo %d celle su %d: dati non aggiornati", len(seen), total)
        return 1

    cells = aggregate(features)
    counts = {name: sum(1 for c in cells.values() if c[0] == code) for name, code in TECH_CLASSES.items()}
    out = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "dataDate": f"{data_date[:4]}-{data_date[4:6]}-{data_date[6:]}",
        "source": "BroadbandMap di Agcom - Autorità per le garanzie nelle comunicazioni",
        "sourceUrl": "https://maps.agcom.it",
        "license": "CC BY 4.0",
        "service": service,
        "origin": [FRAME[0], FRAME[1]],
        "cellDeg": [CELL_DLON, CELL_DLAT],
        "sourceCells20m": len(seen),
        "counts": counts,
        # [i, j, classe migliore (3 FTTH, 2 FTTC, 1 ADSL), operatori FTTH (bit: 1 Open Fiber, 2 TIM, 4 altri)]
        "cells": [[i, j, cls, ops] for (i, j), (cls, ops, _n) in sorted(cells.items())],
    }
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write("\n")
    logging.info("Fibra AGCOM %s: %d celle da ~100 m %s", out["dataDate"], len(cells), counts)
    return 0


if __name__ == "__main__":
    sys.exit(main())
