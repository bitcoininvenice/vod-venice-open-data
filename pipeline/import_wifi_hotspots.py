#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: hotspot WiFi pubblici del Comune di Venezia (dati.venezia.it, GeoJSON, licenza CC BY).

Output: web/src/data/wifi-hotspots.json
"""

import json
import logging
import os
import sys
from datetime import datetime
from zoneinfo import ZoneInfo
from vod_http import fetch_json

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "wifi-hotspots.json")
SOURCE_URL = os.environ.get("WIFI_HOTSPOTS_URL", "https://dati.venezia.it/sites/default/files/hotspots-wifi.json")
SOURCE_PAGE = "https://dati.venezia.it/?q=content/hotspot-wifi"

# Codici di stato del dataset: ok = attivo, iok = attivo (interno), ko = non attivo
STATUS = {"ok": "ATTIVO", "iok": "ATTIVO", "ko": "NON_ATTIVO"}


def main() -> int:
    try:
        data = fetch_json(SOURCE_URL)
    except Exception as e:
        logging.error("Download fallito: %s", e)
        return 1

    hotspots = []
    for feature in data.get("features", []):
        props = feature.get("properties") or {}
        geom = feature.get("geometry") or {}
        if geom.get("type") != "Point" or props.get("visualizza") != "1":
            continue
        lon, lat = geom["coordinates"][:2]
        hotspots.append({
            "id": props.get("codice") or f"WIFI-{len(hotspots) + 1}",
            "name": (props.get("descrizione") or "Hotspot WiFi").strip(),
            "networkName": "VeniceConnected",
            "location": (props.get("descrizione") or "").strip(),
            "lat": round(float(lat), 6),
            "lon": round(float(lon), 6),
            "indoorOutdoor": "INDOOR" if props.get("tipo") == "indoor" else "OUTDOOR",
            "status": STATUS.get(props.get("stato"), "NON_INDICATO"),
            "isFreePublic": True,
        })

    out = {
        "generatedAt": datetime.now(ZoneInfo("Europe/Rome")).isoformat(timespec="seconds"),
        "source": "Comune di Venezia – Hotspot WiFi (dati.venezia.it)",
        "sourceUrl": SOURCE_PAGE,
        "license": "CC BY – Comune di Venezia",
        "count": len(hotspots),
        "hotspots": hotspots,
    }
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    logging.info("Salvati %d hotspot in %s", len(hotspots), os.path.relpath(OUT_FILE, BASE_DIR))
    return 0


if __name__ == "__main__":
    sys.exit(main())
