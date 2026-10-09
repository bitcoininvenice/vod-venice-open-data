#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: opere pubbliche del Comune di Venezia dal Monitoraggio Opere Pubbliche (MOP) della
BDAP - Ragioneria Generale dello Stato (bdap-opendata.rgs.mef.gov.it).

Il dataset "Progetti Opere Pubbliche MOP - Veneto" (CSV di circa 35 MB, separatore ";", latin-1)
contiene per ogni CUP stato, date previste ed effettive di progettazione ed esecuzione, quadro
economico e fonti di finanziamento. Non contiene il comune né coordinate: si tengono i progetti
con titolare "COMUNE DI VENEZIA" e si ricava il luogo dalla descrizione del CUP
("OGGETTO*LUOGO*AZIONE"), geocodificato con OpenStreetMap Nominatim solo quando nomina un posto
preciso (ponte, museo, scuola, via, isola...). Le posizioni sono approssimate.

Si salvano:
- le opere in esecuzione (lavori iniziati e non finiti) per il layer della mappa;
- le opere dell'Elenco Annuale del Comune (opere-pubbliche.json) trovate per CUP, per arricchirne la scheda;
- un riepilogo di tutti i progetti del Comune per fase, settore e fonte di finanziamento.

Licenza: CC BY - Ragioneria Generale dello Stato (BDAP OpenData).
Output: web/src/data/bdap-opere-venezia.json
Uso: python import_bdap_opere.py [--file mop_veneto.csv] [--no-geocode]
"""

import argparse
import csv
import io
import json
import logging
import math
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

from import_opere_pubbliche import CACHE_FILE, geocode

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "bdap-opere-venezia.json")
ELENCO_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "opere-pubbliche.json")
CKAN = "https://bdap-opendata.rgs.mef.gov.it/SpodCkanApi/api/3/action"
DATASET_NAME = "spd_mop_prg_mon_reg05_01_9999"
DATASET_PAGE = f"https://bdap-opendata.rgs.mef.gov.it/opendata/{DATASET_NAME}"
# Risorsa CSV nota (usata se la ricerca nel catalogo non risponde)
FALLBACK_CSV = "https://bdap-opendata.rgs.mef.gov.it/SpodCkanApi/api/3/datastore/dump/213f9fd6-1e98-4feb-a68a-94cf9346fa92.csv"
USER_AGENT = "VOD-VeniceOpenData/1.0 (+https://venice-open-data.vercel.app; pipeline settimanale)"
TITOLARE = "COMUNE DI VENEZIA"
MIN_PROJECTS = 500  # il Comune ha oltre 1.600 CUP: meno di così indica un file incompleto

FUNDING_COLUMNS = {
    "state": "Finanziamenti Statali",
    "eu": "Finanziamenti Europei",
    "local": "Finanziamenti Enti Territorial",
    "private": "Finanziamenti Privati",
    "other": "Altre fonti di finanziamento",
    "toFind": "Finanziamenti da reperire",
}

# Centri delle isole: un risultato lontano è un omonimo (es. "Ponte Lungo" esiste a Murano e alla Giudecca)
ISLAND_CENTRES = {
    "Murano": (45.4580, 12.3540), "Burano": (45.4855, 12.4170), "Giudecca": (45.4265, 12.3240),
    "Lido di Venezia": (45.4090, 12.3650), "Pellestrina": (45.2830, 12.3030),
}
ISLAND_RADIUS_KM = 2.0
# Opere diverse nello stesso punto: distanziate di circa 20 m per poterle cliccare tutte
SPREAD_DEG = 0.00018

TOWNS = [
    ("FAVARO", "Favaro Veneto"), ("MARGHERA", "Marghera"), ("CHIRIGNAGO", "Chirignago"), ("ZELARINO", "Zelarino"),
    ("CARPENEDO", "Carpenedo"), ("MESTRE", "Mestre"), ("LIDO", "Lido di Venezia"), ("PELLESTRINA", "Pellestrina"),
    ("MURANO", "Murano"), ("BURANO", "Burano"), ("GIUDECCA", "Giudecca"), ("TESSERA", "Tessera"), ("CAMPALTO", "Campalto"),
]
LANDMARK = re.compile(
    r"^(PONTE|MUSEO|TEATRO|SCUOLA(?: MEDIA| PRIMARIA| ELEMENTARE| DELL'INFANZIA)?|STADIO|PALESTRA|CENTRO CULTURALE|"
    r"MERCATO FISSO|FORTE|PARCO|EX CONVENTO|EX MONASTERO|PALAZZO|CHIESA|VILLA|REMIERE)\s+([A-ZÀ-Ü0-9'’. ]{3,50})"
)
STREET = re.compile(r"^(VIA|VIALE|CALLE|PIAZZA|PIAZZALE|FONDAMENTA|RAMO|SOTTOPORTICO|CAMPO|STRADA)\s+([A-ZÀ-Ü'’. ]{3,40})")
SINGLE_PLACE = re.compile(r"^(ISOLA (?:DI |NOVA DEL )?[A-ZÀ-Ü]+|FORTE MARGHERA|SACCA FISOLA|AREA MARCIANA)\b")
# Nomi che non indicano un posto preciso (impianti sportivi, vie omonime del comune)
VAGUE = re.compile(r"^(CAMPO (DA|DI|SPORTIVO)|VIA VENEZIA|VIA MESTRE)\b")
# Taglia quanto segue il nome (località, lotti, "a Murano", "presso"...)
TAIL = re.compile(r"\s+(?:(?:A|AL|ALLA|IN|E|ED|CIV|PRESSO|DI COMPLETAMENTO|LOTTO|STRALCIO)\b|-|–|\().*$")
GENERIC = re.compile(r"DIVERS|^VIA MUNICIPALIT|CENTRO STORICO|^TERRAFERMA\b|^VENEZIA$")


def amount(value: str) -> float:
    try:
        return round(float((value or "0").replace(",", ".")), 2)
    except ValueError:
        return 0.0


def split_description(desc: str) -> tuple[str, str, str]:
    """La descrizione del CUP è "OGGETTO*LUOGO*AZIONE" (a volte con meno parti)."""
    parts = [p.strip() for p in (desc or "").split("*")]
    parts += [""] * (3 - len(parts))
    return parts[0], parts[1], " ".join(p for p in parts[2:] if p)


def phase(row: dict) -> str:
    """Fase del progetto dalle date effettive: execution, design, completed o planned."""
    if row.get("Fine esecuzione effettiva") or row.get("Descrizione Stato CUP", "").upper() == "CHIUSO":
        return "completed"
    if row.get("Inizio esecuzione effettiva"):
        return "execution"
    if row.get("Inizio progettazione effettiva"):
        return "design"
    return "planned"


def town_for(text: str) -> str:
    up = text.upper()
    return next((name for key, name in TOWNS if key in up), "Venezia")


def _clean(name: str) -> str:
    return TAIL.sub("", name).strip(" .,'/").title()


def place_queries(obj: str, luogo: str) -> list[str]:
    """Ricerche Nominatim in ordine di precisione; vuoto se il luogo è generico."""
    town = town_for(f"{luogo} {obj}")
    out: list[str] = []
    m = LANDMARK.search(obj)
    if m:
        out.append(f"{_clean(m.group(0))}, {town}")
    for text in (luogo, obj):
        s = STREET.search(text)
        if s and not GENERIC.search(text):
            out.append(f"{_clean(s.group(0))}, {town}")
    p = SINGLE_PLACE.search(luogo)
    if p:
        out.append(f"{p.group(1).title()}, Venezia")
    seen: list[str] = []
    for q in out:
        name = q.split(",")[0]
        if q not in seen and len(name.split()) >= 2 and not VAGUE.search(name.upper()):
            seen.append(q)
    return seen


def distance_km(a: tuple[float, float], b: tuple[float, float]) -> float:
    dlat = (a[0] - b[0]) * 111.0
    dlon = (a[1] - b[1]) * 111.0 * math.cos(math.radians(a[0]))
    return math.hypot(dlat, dlon)


def plausible(query: str, point: tuple[float, float]) -> bool:
    """Scarta i risultati lontani dall'isola indicata nella ricerca."""
    town = query.rsplit(",", 1)[-1].strip()
    centre = ISLAND_CENTRES.get(town)
    return centre is None or distance_km(point, centre) <= ISLAND_RADIUS_KM


def spread(points: list[tuple[float, float]]) -> list[tuple[float, float]]:
    """Punti coincidenti disposti su un piccolo cerchio, nell'ordine dato (deterministico)."""
    groups: dict[tuple[float, float], list[int]] = {}
    for i, p in enumerate(points):
        groups.setdefault(p, []).append(i)
    out = list(points)
    for (lat, lon), idx in groups.items():
        if len(idx) < 2:
            continue
        for k, i in enumerate(idx):
            a = 2 * math.pi * k / len(idx)
            out[i] = (round(lat + SPREAD_DEG * math.sin(a), 6), round(lon + SPREAD_DEG * math.cos(a) / math.cos(math.radians(lat)), 6))
    return out


def project(row: dict) -> dict:
    obj, luogo, action = split_description(row["Descrizione CUP Integrale"])
    planned = amount(row["Costo Lavori Previsto"]) + amount(row["Somme a disposizione Previste"])
    return {
        "cup": row["Codice CUP"].strip(),
        "object": obj.capitalize(),
        "place": luogo.capitalize() or None,
        "action": action.capitalize() or None,
        "phase": phase(row),
        "cupStatus": row["Descrizione Stato CUP"].strip().lower(),
        "sector": row["Settore Interv Inv"].strip().capitalize() or None,
        "subsector": row["Sottosettore Interv Inv"].strip().capitalize() or None,
        "category": row["Categoria Interv Inv"].strip().capitalize() or None,
        "type": row["Tipologia Intervento"].strip().capitalize() or None,
        "designStart": row["Inizio progettazione effettiva"] or row["Inizio progettazione prevista"] or None,
        "executionStartPlanned": row["Inizio esecuzione prevista"] or None,
        "executionStart": row["Inizio esecuzione effettiva"] or None,
        "executionEndPlanned": row["Fine esecuzione prevista"] or None,
        "executionEnd": row["Fine esecuzione effettiva"] or None,
        "costPlannedEur": round(planned, 2),
        "worksCostPlannedEur": amount(row["Costo Lavori Previsto"]),
        "funding": {k: amount(row[c]) for k, c in FUNDING_COLUMNS.items()},
        "savingsEur": amount(row["Totale Economie"]),
    }


def summarize(projects: list[dict]) -> dict:
    by_phase: dict[str, int] = {"planned": 0, "design": 0, "execution": 0, "completed": 0}
    sectors: dict[str, dict] = {}
    funding = {k: 0.0 for k in FUNDING_COLUMNS}
    open_cost = 0.0
    for p in projects:
        by_phase[p["phase"]] += 1
        if p["phase"] == "completed":
            continue
        open_cost += p["costPlannedEur"]
        s = sectors.setdefault(p["sector"] or "n.d.", {"sector": p["sector"] or "n.d.", "count": 0, "costEur": 0.0})
        s["count"] += 1
        s["costEur"] += p["costPlannedEur"]
        for k in funding:
            funding[k] += p["funding"][k]
    return {
        "projects": len(projects),
        "byPhase": by_phase,
        "openProjects": len(projects) - by_phase["completed"],
        "openCostEur": round(open_cost, 2),
        "openBySector": sorted(({**s, "costEur": round(s["costEur"], 2)} for s in sectors.values()), key=lambda s: -s["costEur"]),
        "openFundingEur": {k: round(v, 2) for k, v in funding.items()},
    }


def observed_at(notes: str) -> str | None:
    m = re.search(r"osservati al (\d{2})/(\d{2})/(\d{4})", notes or "")
    return f"{m.group(3)}-{m.group(2)}-{m.group(1)}" if m else None


def fetch(url: str, timeout: int = 60, retries: int = 3) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read()
        except Exception as e:  # noqa: BLE001
            if attempt == retries:
                raise
            logging.warning("Tentativo %d per %s fallito (%s), riprovo", attempt, url, e)
            time.sleep(15 * attempt)
    raise RuntimeError("irraggiungibile")


def discover() -> tuple[str, str | None]:
    """URL del CSV e data di osservazione dal catalogo CKAN; ripiego sulla risorsa nota."""
    try:
        q = urllib.parse.urlencode({"q": "Progetti Opere Pubbliche MOP - Veneto", "rows": 50})
        res = json.loads(fetch(f"{CKAN}/package_search?{q}"))["result"]["results"]
        pkg = next(p for p in res if p.get("name") == DATASET_NAME)
        csv_url = next(r["url"] for r in pkg["resources"] if "datastore/dump" in (r.get("url") or ""))
        return csv_url.replace("http://", "https://"), observed_at(pkg.get("notes", ""))
    except Exception as e:  # noqa: BLE001
        logging.warning("Catalogo BDAP non disponibile (%s): uso la risorsa nota", e)
        return FALLBACK_CSV, None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", help="CSV MOP Veneto già scaricato")
    parser.add_argument("--no-geocode", action="store_true", help="non interrogare Nominatim (usa solo la cache)")
    args = parser.parse_args()

    url, observed = discover()
    try:
        if args.file:
            with open(args.file, "rb") as fh:
                raw = fh.read()
        else:
            logging.info("Scarico %s", url)
            raw = fetch(url, timeout=300)
    except Exception as e:  # noqa: BLE001
        logging.error("BDAP non aggiornato: %s", e)
        return 1

    rows = [r for r in csv.DictReader(io.StringIO(raw.decode("latin-1")), delimiter=";") if r.get("Descrizione Titolare", "").strip() == TITOLARE]
    if len(rows) < MIN_PROJECTS:
        logging.error("Solo %d progetti del Comune di Venezia: file incompleto, dati non aggiornati", len(rows))
        return 1
    all_projects = [project(r) for r in rows]

    with open(ELENCO_FILE, encoding="utf-8") as fh:
        elenco_cups = {w["cup"] for w in json.load(fh)["works"] if w.get("cup")}

    cache: dict = {}
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, encoding="utf-8") as fh:
            cache = json.load(fh)

    keep = []
    located = 0
    for p in all_projects:
        in_progress = p["phase"] == "execution"
        if not in_progress and p["cup"] not in elenco_cups:
            continue
        p["inProgress"] = in_progress
        p["inElenco"] = p["cup"] in elenco_cups
        point, query = None, None
        if in_progress:
            for q in place_queries(p["object"].upper(), (p["place"] or "").upper()):
                if args.no_geocode and q not in cache:
                    continue
                point = geocode(q, cache)
                if point and plausible(q, point):
                    query = q
                    break
                point = None
        p["lat"], p["lon"] = (point if point else (None, None))
        p["geocodedFrom"] = query
        located += bool(point)
        keep.append(p)

    with open(CACHE_FILE, "w", encoding="utf-8") as fh:
        json.dump(cache, fh, ensure_ascii=False, indent=1)

    placed = [p for p in keep if p["lat"] is not None]
    for p, (lat, lon) in zip(placed, spread([(p["lat"], p["lon"]) for p in placed])):
        p["lat"], p["lon"] = lat, lon

    keep.sort(key=lambda p: (not p["inProgress"], -p["costPlannedEur"]))
    out = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "Ragioneria Generale dello Stato – BDAP, Monitoraggio Opere Pubbliche (MOP) Veneto",
        "sourceUrl": DATASET_PAGE,
        "license": "CC BY – Ragioneria Generale dello Stato",
        "observedAt": observed,
        "titolare": "Comune di Venezia",
        "geocoding": "OpenStreetMap Nominatim (© OpenStreetMap contributors, ODbL) – posizioni approssimate dal luogo indicato nel CUP",
        "summary": summarize(all_projects),
        "located": located,
        "projects": keep,
    }
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write("\n")
    logging.info(
        "BDAP: %d progetti del Comune, %d salvati (%d in esecuzione, %d localizzati, %d collegati all'elenco annuale)",
        len(all_projects), len(keep), sum(p["inProgress"] for p in keep), located, sum(p["inElenco"] for p in keep),
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
