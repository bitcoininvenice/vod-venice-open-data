#!/usr/bin/env python3
"""
Prezzi dei carburanti del MIMIT (Ministero delle Imprese e del Made in Italy, IODL 2.0) per l'area della mappa.

Scarica i due CSV pubblicati ogni giorno (anagrafica degli impianti attivi e prezzi in vigore alle 8) e salva solo
i distributori dell'area, nello stesso formato che il sito legge dal Ministero (web/src/server/sources/mimitFuel.ts).
Il sito usa questo file quando il Ministero non risponde ai server di Vercel: il firewall del Ministero rifiuta le
richieste dai data center, mentre da una connessione italiana i file si scaricano. Lo script si presenta con lo
User-Agent di VOD e non aggira nessun filtro: se riceve una pagina al posto del CSV si ferma.

Gira sul Mac del progetto ogni mattina (pipeline/fuel_auto/), non nel workflow di GitHub (data center).
Mai il nome del gestore né quello dell'impianto.

Uso: python import_mimit_fuel.py [--file-stations anagrafica.csv --file-prices prezzi.csv]
Output: web/src/data/mimit-fuel-venezia.json
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from vod_http import fetch_text

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_PATH = os.path.join(BASE_DIR, "..", "web", "src", "data", "mimit-fuel-venezia.json")

STATIONS_URL = "https://www.mimit.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv"
PRICES_URL = "https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv"

# Riquadro della mappa (lat min, lon min, lat max, lon max), lo stesso di web/src/lib/simulation-data.ts
LAT0, LON0, LAT1, LON1 = 45.205, 12.135, 45.555, 12.47
# Sotto questa soglia di impianti in Italia il file è incompleto: non si sovrascrive
MIN_STATIONS_ITALY = 15_000
# Come in mimitFuel.ts: un impianto di un altro comune con coordinate qui è un errore del dato
AREA_COMUNI = {
    "VENEZIA", "CHIOGGIA", "CAVALLINO-TREPORTI", "MIRA", "SPINEA", "MIRANO", "MARCON", "MARTELLAGO", "SALZANO",
    "SCORZÈ", "MOGLIANO VENETO", "PREGANZIOL", "QUARTO D'ALTINO", "CAMPAGNA LUPIA", "CODEVIGO", "DOLO", "NOALE",
}
ROME = ZoneInfo("Europe/Rome")


def download_csv(url: str) -> str:
    text = fetch_text(url, timeout=60)
    # un firewall può rispondere 200 con una pagina di verifica al posto del CSV: ci si ferma, non si aggira
    if not re.match(r"^\s*(Estrazione del|idImpianto)", text[:200]):
        raise RuntimeError("pagina HTML al posto del CSV" if re.search(r"<html|<!doctype", text[:500], re.I) else "contenuto non valido")
    return text


def extraction_date(text: str) -> str | None:
    m = re.search(r"Estrazione del (\d{4}-\d{2}-\d{2})", text[:80])
    return m.group(1) if m else None


def rows(text: str) -> list[dict[str, str]]:
    lines = [line for line in text.splitlines() if line.strip()]
    header_at = next((i for i, line in enumerate(lines) if line.startswith("idImpianto")), -1)
    if header_at < 0:
        raise ValueError("intestazione idImpianto mancante")
    sep = "|" if "|" in lines[header_at] else ";"
    header = [h.strip() for h in lines[header_at].split(sep)]
    out = []
    for line in lines[header_at + 1:]:
        cells = line.split(sep)
        out.append({h: (cells[i].strip() if i < len(cells) else "") for i, h in enumerate(header)})
    return out


def clean_address(s: str) -> str:
    return re.sub(r"\s*\b30\d{3}\s*$", "", re.sub(r"\s+", " ", s)).strip()


def communicated_at(s: str) -> str | None:
    """«13/10/2026 20:00:07» (ora di Venezia) -> ISO in UTC, come romeLocalToDate nel sito"""
    m = re.match(r"^(\d{2})/(\d{2})/(\d{4}) (\d{2}):(\d{2}):(\d{2})$", s.strip())
    if not m:
        return None
    d, mo, y, h, mi, se = map(int, m.groups())
    local = datetime(y, mo, d, h, mi, se, tzinfo=ROME)
    return local.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def parse_fuel(stations_csv: str, prices_csv: str, min_stations_italy: int = MIN_STATIONS_ITALY) -> dict:
    """Stessa logica di parseFuel in web/src/server/sources/mimitFuel.ts"""
    anag = rows(stations_csv)
    if len(anag) < min_stations_italy:
        raise ValueError(f"anagrafica incompleta: {len(anag)} impianti")
    stations: dict[str, dict] = {}
    for r in anag:
        try:
            lat, lon = float(r.get("Latitudine", "")), float(r.get("Longitudine", ""))
        except ValueError:
            continue
        if not r.get("idImpianto") or not (LAT0 <= lat <= LAT1 and LON0 <= lon <= LON1):
            continue
        if (r.get("Comune") or "").strip().upper() not in AREA_COMUNI:
            continue
        stations[r["idImpianto"]] = {
            "id": r["idImpianto"],
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "brand": r.get("Bandiera") or "Pompe Bianche",
            "address": clean_address(r.get("Indirizzo") or ""),
            "comune": r.get("Comune") or "",
            "highway": bool(re.search(r"autostrad", r.get("Tipo Impianto") or "", re.I)),
            "prices": [],
        }
    for r in rows(prices_csv):
        s = stations.get(r.get("idImpianto", ""))
        try:
            price = float(r.get("prezzo", ""))
        except ValueError:
            continue
        if not s or not r.get("descCarburante") or price <= 0:
            continue
        s["prices"].append({"fuel": r["descCarburante"], "self": r.get("isSelf") == "1", "price": price,
                            "communicatedAt": communicated_at(r.get("dtComu", ""))})
    every = sorted(stations.values(), key=lambda s: -s["lat"])
    for s in every:
        s["prices"].sort(key=lambda p: (p["fuel"], not p["self"]))
    return {
        "extractedAt": extraction_date(prices_csv) or extraction_date(stations_csv),
        "stationsItaly": len(anag),
        "stations": [s for s in every if s["prices"]],
        "listedWithoutPrices": [s for s in every if not s["prices"]],
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Prezzi dei carburanti MIMIT per l'area della mappa")
    ap.add_argument("--file-stations", help="anagrafica_impianti_attivi.csv locale")
    ap.add_argument("--file-prices", help="prezzo_alle_8.csv locale")
    args = ap.parse_args()
    try:
        stations_csv = open(args.file_stations, encoding="utf-8", errors="replace").read() if args.file_stations else download_csv(STATIONS_URL)
        prices_csv = open(args.file_prices, encoding="utf-8", errors="replace").read() if args.file_prices else download_csv(PRICES_URL)
        data = parse_fuel(stations_csv, prices_csv)
    except Exception as exc:  # noqa: BLE001 - qualsiasi errore lascia il file precedente
        logging.error("Prezzi MIMIT non aggiornati: %s", exc)
        return 1
    if not data["extractedAt"] or len(data["stations"]) < 40:
        logging.error("Risposta incompleta (%d distributori con prezzi): il file esistente non viene sovrascritto", len(data["stations"]))
        return 1
    out = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "Ministero delle Imprese e del Made in Italy – prezzi dei carburanti",
        "sourceUrl": "https://www.mimit.gov.it/it/open-data/elenco-dataset/carburanti-prezzi-praticati-e-anagrafica-degli-impianti",
        "license": "IODL 2.0",
        **data,
    }
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    logging.info("Prezzi del %s: %d distributori con prezzi, %d senza -> %s", data["extractedAt"], len(data["stations"]), len(data["listedWithoutPrices"]), OUT_PATH)
    return 0


if __name__ == "__main__":
    sys.exit(main())
