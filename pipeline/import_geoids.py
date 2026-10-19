#!/usr/bin/env python3
"""
Strutture ricettive registrate nel Comune di Venezia dal servizio GeoIDS del Comune (imposta di soggiorno).

I CSV si esportano a mano dal geoportale (GeoIDS → lista strutture → «esporta in csv», come spiega il manuale del
servizio), una municipalità per file perché ogni esportazione si ferma a 10.000 righe. Nessuno script contro il
geoportale: è protetto da un filtro anti-bot. Dati pubblicati dal Comune senza una licenza espressa: art. 52,
comma 2, del Codice dell'amministrazione digitale (dati aperti, citando la fonte).

Privacy (le locazioni turistiche sono spesso case di privati):
- strutture alberghiere, all'aperto, agriturismi e altre attività d'impresa: punti con nome, categoria,
  classificazione, indirizzo, stanze e letti; la ragione sociale solo se è una società o un ente;
- strutture complementari e locazioni turistiche: solo conteggi, letti e stanze su celle da ~100 m e per zona,
  senza nome, indirizzo, contatti o coordinate dei singoli alloggi;
- mai telefoni, email, siti, né i campi che il Comune non è autorizzato a pubblicare.
I CSV originali non vanno nel repository.

Uso: python import_geoids.py --dir ~/Downloads [--date 2026-10-18]
Output: web/src/data/geoids-strutture.json
"""
from __future__ import annotations

import argparse
import csv
import glob
import json
import logging
import math
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import date, datetime, timezone

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE_DIR, "..", "web", "src", "data", "geoids-strutture.json")
SOURCE_URL = "https://geoportale.comune.venezia.it/Html5Viewer/index.html?viewer=IDS.IDS&LOCALE=IT-it"

# griglia di ~100 m, la stessa di Inside Airbnb e della fibra AGCOM
FRAME = (12.135, 45.205, 12.47, 45.555)
CELL_DLON = 0.00128
CELL_DLAT = 0.0009
# ogni esportazione del geoportale si ferma qui: un file così lungo è tagliato
EXPORT_LIMIT = 10_000
MIN_ROWS = 5_000
HIDDEN = "PUBBLICAZIONE DATO NON AUTORIZZATA"

# nome del file -> municipalità (una esportazione per municipalità)
MUNICIPALITIES = {
    "venezia": "Venezia-Murano-Burano",
    "lido": "Lido-Pellestrina",
    "mestre": "Mestre-Carpenedo",
    "mestre_ovest": "Chirignago-Zelarino",
    "marghera": "Marghera",
    "favaro": "Favaro Veneto",
}
# macro-tipo del Comune: punti solo per le attività d'impresa
BUSINESS_KINDS = {
    "STRUTTURE RICETTIVE ALBERGHIERE": "hotel",
    "STRUTTURE RICETTIVE ALL'APERTO": "openAir",
    "AGRITURISMO": "agritourism",
    "STRUTTURE RICETTIVE NON RICOMPRESE NELLE PRECEDENTI": "other",
}
PRIVATE_KINDS = {
    "LOCAZIONI TURISTICHE ART.27 BIS L.R.V. 11/2013": "touristRental",
    "STRUTTURE RICETTIVE COMPLEMENTARI": "complementary",
    "STRUTTURE RICETTIVE EXTRALBERGHIERE": "complementary",
}
COMPANY = re.compile(r"\b(S\.?R\.?L\.?S?|S\.?P\.?A|S\.?N\.?C|S\.?A\.?S|S\.?S\.|SOC\.?|SOCIET[AÀ]|COOP|FONDAZIONE|ASSOCIAZIONE|ISTITUTO|CONGREGAZIONE|PARROCCHIA|DIOCESI|UNIVERSIT[AÀ]|ENTE)\b", re.I)


def lonlat(geometry: str) -> tuple[float, float] | None:
    """«X: 1373958.29, Y: 5690490.95, Z: NaN» (Web Mercator, EPSG:3857) -> (lon, lat)"""
    m = re.search(r"X:\s*([-\d.]+),\s*Y:\s*([-\d.]+)", geometry)
    if not m:
        return None
    x, y = float(m.group(1)), float(m.group(2))
    lon = x / 6378137 * 180 / math.pi
    lat = math.degrees(2 * math.atan(math.exp(y / 6378137)) - math.pi / 2)
    return round(lon, 6), round(lat, 6)


def to_int(v: str) -> int:
    try:
        return max(0, int(float(v)))
    except ValueError:
        return 0


def clean(v: str) -> str | None:
    v = re.sub(r"\s+", " ", (v or "").strip())
    return None if not v or v == HIDDEN else v


def read_exports(folder: str) -> tuple[list[dict], list[str]]:
    rows, files = [], []
    for path in sorted(glob.glob(os.path.join(os.path.expanduser(folder), "geoportale_*.csv"))):
        key = os.path.basename(path)[len("geoportale_"):-len(".csv")]
        if key not in MUNICIPALITIES:
            logging.warning("%s: municipalità non riconosciuta, saltato", path)
            continue
        part = list(csv.DictReader(open(path, encoding="utf-8-sig"), delimiter=";"))
        if len(part) >= EXPORT_LIMIT:
            raise ValueError(f"{os.path.basename(path)}: {len(part)} righe, esportazione tagliata al limite del geoportale")
        for r in part:
            r["_municipality"] = MUNICIPALITIES[key]
        rows += part
        files.append(os.path.basename(path))
    if set(files) != {f"geoportale_{k}.csv" for k in MUNICIPALITIES}:
        missing = sorted({f"geoportale_{k}.csv" for k in MUNICIPALITIES} - set(files))
        raise ValueError(f"mancano le esportazioni: {', '.join(missing)}")
    return rows, files


def build(rows: list[dict], extracted: date) -> dict:
    # una struttura compare due volte se è al confine fra due municipalità esportate
    unique, seen = [], set()
    for r in rows:
        key = tuple(v for k, v in r.items() if k != "_municipality")
        if key not in seen:
            seen.add(key)
            unique.append(r)
    if len(unique) < MIN_ROWS:
        raise ValueError(f"solo {len(unique)} strutture: esportazione incompleta")

    points, cells, zones = [], defaultdict(lambda: [0, 0, 0]), {}
    by_kind = Counter()
    beds_by_kind = Counter()
    skipped = 0
    for r in unique:
        pos = lonlat(r.get("geometry", ""))
        macro = r.get("TIPO_STRUTTURA", "").strip()
        kind = BUSINESS_KINDS.get(macro) or PRIVATE_KINDS.get(macro)
        name = clean(r.get("DENOMINAZIONE_STRUTTURA", ""))
        if not pos or not kind or (name and "DI PROVA" in name.upper()):
            skipped += 1
            continue
        rooms, beds = to_int(r.get("NUMERO_STANZE", "")), to_int(r.get("NUMERO_LETTI", ""))
        by_kind[kind] += 1
        beds_by_kind[kind] += beds
        zone_key = f"{r['_municipality']}|{clean(r.get('ZONA_IDS', '')) or '-'}"
        z = zones.setdefault(zone_key, {"municipality": r["_municipality"], "taxZone": clean(r.get("ZONA_IDS", "")),
                                        "taxReductionPct": to_int(r.get("PERCENTUALE_RIDUZIONE", "")), "byKind": Counter(), "beds": Counter(), "rooms": Counter()})
        z["byKind"][kind] += 1
        z["beds"][kind] += beds
        z["rooms"][kind] += rooms
        if kind in BUSINESS_KINDS.values():
            company = clean(r.get("RAGIONE_SOCIALE", ""))
            points.append({
                "lon": pos[0],
                "lat": pos[1],
                "kind": kind,
                "category": clean(r.get("TIPOLOGIA_STRUTTURA", "")),
                "name": name,
                "company": company if company and COMPANY.search(company) else None,
                "classification": clean(r.get("CLASSIFICAZIONE", "")),
                "address": clean(r.get("INDIRIZZO", "")),
                "rooms": rooms,
                "beds": beds,
                "municipality": r["_municipality"],
            })
        elif FRAME[0] <= pos[0] <= FRAME[2] and FRAME[1] <= pos[1] <= FRAME[3]:
            c = cells[(int((pos[0] - FRAME[0]) // CELL_DLON), int((pos[1] - FRAME[1]) // CELL_DLAT))]
            c[0] += 1
            c[1] += beds
            c[2] += rooms
    points.sort(key=lambda p: (-p["lat"], p["lon"]))
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "extractedAt": extracted.isoformat(),
        "source": "Comune di Venezia – GeoIDS, strutture ricettive e imposta di soggiorno",
        "sourceUrl": SOURCE_URL,
        "license": "Dati pubblicati dal Comune senza licenza espressa: art. 52, comma 2, D.Lgs. 82/2005 (dati aperti, citando la fonte)",
        "attribution": f"Comune di Venezia – GeoIDS, estrazione del {extracted.strftime('%d/%m/%Y')}",
        "note": "Attività ricettive d'impresa come punti (nome, categoria, classificazione, stanze, letti); strutture complementari e locazioni turistiche, spesso case di privati, solo come conteggi su celle da ~100 m e per zona dell'imposta di soggiorno. Nessun contatto né dato personale.",
        "total": sum(by_kind.values()),
        "skipped": skipped,
        "byKind": dict(by_kind),
        "bedsByKind": dict(beds_by_kind),
        "zones": [
            {**{k: v for k, v in z.items() if k not in ("byKind", "beds", "rooms")}, "byKind": dict(z["byKind"]), "beds": dict(z["beds"]), "rooms": dict(z["rooms"])}
            for z in sorted(zones.values(), key=lambda z: (z["municipality"], z["taxZone"] or ""))
        ],
        "origin": [FRAME[0], FRAME[1]],
        "cellDeg": [CELL_DLON, CELL_DLAT],
        # [i, j, strutture, letti, stanze] delle strutture complementari e locazioni turistiche
        "privateCells": [[i, j, *v] for (i, j), v in sorted(cells.items())],
        "businesses": points,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Strutture ricettive del Comune di Venezia (GeoIDS)")
    ap.add_argument("--dir", default="~/Downloads", help="cartella con i CSV geoportale_<municipalità>.csv")
    ap.add_argument("--date", help="data dell'estrazione (YYYY-MM-DD), di default quella dei file")
    args = ap.parse_args()
    try:
        rows, files = read_exports(args.dir)
        stamp = date.fromisoformat(args.date) if args.date else date.fromtimestamp(max(os.path.getmtime(os.path.join(os.path.expanduser(args.dir), f)) for f in files))
        data = build(rows, stamp)
    except Exception as exc:  # noqa: BLE001 - qualsiasi errore lascia il file precedente
        logging.error("Strutture ricettive non aggiornate: %s", exc)
        return 1
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    logging.info("GeoIDS: %d strutture (%d imprese sulla mappa, %d celle di alloggi privati) -> %s", data["total"], len(data["businesses"]), len(data["privateCells"]), OUT)
    return 0


if __name__ == "__main__":
    sys.exit(main())
