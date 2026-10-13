#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: fontanelle di Venezia mappate da Venice Tap Water (venicetapwater.org), con lo stato
"aperta" / "chiusa" indicato dall'associazione per ogni fontana.

Fonte: la mappa pubblica "Le fontane di Venezia" di Venice Tap Water (Google My Maps, esportata in KML).
Dati usati con il consenso di Venice Tap Water, citando la fonte con un link a venicetapwater.org.
Le foto della mappa non vengono riprese.

Output: web/src/data/venice-tap-water.json
Uso: python import_venice_tap_water.py
     python import_venice_tap_water.py --file mappa.kml   (KML già scaricato)
"""

import argparse
import json
import logging
import os
import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

from vod_http import fetch_text

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "venice-tap-water.json")

MAP_ID = "1lVc2Rq_zeha-VHBPg5DXNKbEhaAZYI8"
KML_URL = f"https://www.google.com/maps/d/u/0/kml?mid={MAP_ID}&forcekml=1"
SOURCE_NAME = "Venice Tap Water"
SOURCE_URL = "https://www.venicetapwater.org"
# Riquadro della laguna di Venezia: i punti fuori (errori di posizionamento) vengono scartati
BBOX = (45.18, 12.15, 45.56, 12.62)  # lat min, lon min, lat max, lon max
# Sotto questa soglia la mappa scaricata è considerata incompleta e il file non viene sovrascritto
MIN_FOUNTAINS = 150

NS = {"k": "http://www.opengis.net/kml/2.2"}


def clean_area(folder: str) -> str:
    """'SESTIERE DI SAN POLO' -> 'San Polo'; 'MURANO, BURANO, MAZZORBO e TORCELLO' -> 'Murano, Burano, Mazzorbo e Torcello'."""
    name = re.sub(r"^\s*SESTIERE\s+DI\s+", "", folder.strip(), flags=re.I)
    words = []
    for w in name.split():
        low = w.lower()
        words.append(low if low in ("e", "di", "del", "della") else low[:1].upper() + low[1:])
    out = " ".join(words)
    # maiuscola dopo apostrofo (Sant'Erasmo)
    return re.sub(r"'(\w)", lambda m: "'" + m.group(1).upper(), out)


def description_text(html: str) -> str:
    """Testo della descrizione senza immagini e tag HTML."""
    text = re.sub(r"<img[^>]*>", " ", html or "")
    text = re.sub(r"<br\s*/?>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def parse_status(text: str) -> tuple[str, str]:
    """('open' | 'closed' | 'unknown', dettaglio) dal testo dell'associazione, es. 'Aperta - Pulsante'."""
    m = re.match(r"^(apert[ao]|chius[ao])\b[\s,.\-–:]*(.*)$", text.strip(), flags=re.I)
    if not m:
        return "unknown", text.strip()
    status = "open" if m.group(1).lower().startswith("apert") else "closed"
    note = m.group(2).strip(" .-–,")
    return status, (note[:1].upper() + note[1:]) if note else ""


def parse_kml(kml: str) -> list[dict]:
    root = ET.fromstring(kml.encode("utf-8"))
    out = []
    for folder in root.iter(f"{{{NS['k']}}}Folder"):
        area = clean_area(folder.findtext("k:name", default="", namespaces=NS))
        for pm in folder.findall("k:Placemark", NS):
            coords = (pm.findtext(".//k:Point/k:coordinates", default="", namespaces=NS) or "").strip()
            if not coords:
                continue
            lon, lat = (float(v) for v in coords.split(",")[:2])
            if not (BBOX[0] <= lat <= BBOX[2] and BBOX[1] <= lon <= BBOX[3]):
                logging.warning("Scartato fuori dalla laguna: %s (%.5f, %.5f)", pm.findtext("k:name", default="", namespaces=NS), lat, lon)
                continue
            status, note = parse_status(description_text(pm.findtext("k:description", default="", namespaces=NS)))
            out.append({
                "id": f"vtw-{len(out) + 1}",
                "name": (pm.findtext("k:name", default="", namespaces=NS) or "").strip() or "Fontanella",
                "area": area,
                "lat": round(lat, 6),
                "lon": round(lon, 6),
                "status": status,
                "statusNote": note,
            })
    return out


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", help="KML già scaricato")
    args = parser.parse_args()
    kml = open(args.file, encoding="utf-8").read() if args.file else fetch_text(KML_URL, timeout=60, retries=3, backoff=10)
    fountains = parse_kml(kml)
    if len(fountains) < MIN_FOUNTAINS:
        logging.error("Solo %d fontane nella mappa scaricata: file non aggiornato", len(fountains))
        return 1
    counts = {s: sum(1 for f in fountains if f["status"] == s) for s in ("open", "closed", "unknown")}
    doc = {
        "metadata": {
            "source": SOURCE_NAME,
            "sourceUrl": SOURCE_URL,
            "terms": "Dati di Venice Tap Water, usati con il consenso dell'associazione citando la fonte.",
            "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "total": len(fountains),
            **counts,
        },
        "data": fountains,
    }
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
    logging.info("Venice Tap Water: %d fontane (%s)", len(fountains), counts)
    return 0


if __name__ == "__main__":
    sys.exit(main())
