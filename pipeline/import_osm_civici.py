"""
VOD - Venice Open Data
Numeri civici del centro storico di Venezia da OpenStreetMap, per la ricerca "sestiere + numero".

A Venezia i civici non seguono la via ma il sestiere (es. "Cannaregio 3450"); la Giudecca ha una
numerazione propria. Il Comune non pubblica i civici come open data: OpenStreetMap ne copre una parte
(la copertura è dichiarata nel file e nella ricerca, che indica il civico noto più vicino se manca).

Uso: python import_osm_civici.py [--file risposta_overpass.json]
"""

import argparse
import json
import logging
import os
import re
import sys
from datetime import datetime, timezone

from vod_http import overpass

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "osm-civici.json")

# Centro storico, Giudecca compresa
BBOX = (45.420, 12.295, 45.452, 12.370)
QUERY = f'[out:json][timeout:180];nwr["addr:housenumber"]({BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]});out tags center qt;'

# Sestieri con numerazione propria (la Giudecca, pur facendo parte di Dorsoduro, ha la sua)
SESTIERI = ["Cannaregio", "Castello", "Dorsoduro", "Giudecca", "San Marco", "San Polo", "Santa Croce"]
ALIASES = {
    "canaregio": "Cannaregio",
    "s. marco": "San Marco", "s.marco": "San Marco", "sanmarco": "San Marco",
    "s. polo": "San Polo", "s.polo": "San Polo", "sanpolo": "San Polo",
    "s. croce": "Santa Croce", "s.croce": "Santa Croce", "santacroce": "Santa Croce",
}
# Tag in cui OSM riporta il sestiere dei civici veneziani
SESTIERE_TAGS = ("addr:suburb", "addr:place", "addr:quarter", "addr:neighbourhood", "addr:street")
MIN_CIVICI = 10_000


def sestiere_of(tags: dict) -> str | None:
    for key in SESTIERE_TAGS:
        value = (tags.get(key) or "").strip()
        if not value:
            continue
        for s in SESTIERI:
            if value.lower() == s.lower():
                return s
        alias = ALIASES.get(value.lower())
        if alias:
            return alias
    return None


def parse_number(raw: str) -> tuple[int, str] | None:
    """'3450' -> (3450, ''), '2902b' / '122/A' / '5065 F' -> (numero, lettera maiuscola); altro -> None."""
    m = re.fullmatch(r"\s*(\d{1,5})\s*(?:/|-)?\s*([A-Za-z])?\s*", raw or "")
    if not m:
        return None
    return int(m.group(1)), (m.group(2) or "").upper()


def build(payload: dict) -> dict[str, list]:
    """{sestiere: [[numero, lettera, lon, lat], ...]} ordinati per numero e lettera, senza doppioni."""
    out: dict[str, dict[tuple[int, str], list]] = {s: {} for s in SESTIERI}
    for el in payload.get("elements", []):
        tags = el.get("tags", {})
        sest = sestiere_of(tags)
        if not sest:
            continue
        pos = el.get("center") or ({"lat": el["lat"], "lon": el["lon"]} if "lat" in el else None)
        if not pos:
            continue
        # "3450;3451" o "3450,3451": più numeri sullo stesso portone
        for part in re.split(r"[;,]", tags.get("addr:housenumber", "")):
            num = parse_number(part)
            if num and num not in out[sest]:
                out[sest][num] = [num[0], num[1], round(pos["lon"], 6), round(pos["lat"], 6)]
    return {s: [out[s][k] for k in sorted(out[s])] for s in SESTIERI}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", help="risposta Overpass già scaricata (JSON)")
    args = parser.parse_args()
    try:
        if args.file:
            with open(args.file, encoding="utf-8") as fh:
                payload = json.load(fh)
        else:
            payload = overpass(QUERY, timeout=240)
    except Exception as e:  # noqa: BLE001
        logging.error("Query Overpass fallita: %s", e)
        return 1
    civici = build(payload)
    total = sum(len(v) for v in civici.values())
    if total < MIN_CIVICI:
        logging.error("Dati OSM incompleti (%d civici): file non aggiornato", total)
        return 1
    out = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "OpenStreetMap (Overpass API) – addr:housenumber con il sestiere in addr:suburb/place/quarter",
        "sourceUrl": "https://www.openstreetmap.org",
        "license": "ODbL 1.0",
        "attribution": "© OpenStreetMap contributors",
        "note": "Il Comune di Venezia non pubblica i numeri civici come open data. OpenStreetMap ne copre una parte: quando un civico manca, la ricerca indica il civico noto più vicino dello stesso sestiere come posizione approssimata.",
        "counts": {s: len(v) for s, v in civici.items()},
        # [numero, lettera, lon, lat]
        "civici": civici,
    }
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write("\n")
    logging.info("Civici OSM: %s (%d KB)", out["counts"], os.path.getsize(OUT_FILE) // 1024)
    return 0


if __name__ == "__main__":
    sys.exit(main())
