#!/usr/bin/env python3
"""
Orari ATVO delle linee per l'aeroporto dai PDF ufficiali pubblicati su atvo.it:
- 35 «Venezia Express»: Venezia Piazzale Roma – Aeroporto Marco Polo;
- 35B «Mestre Express»: Mestre Stazione FS – Aeroporto Marco Polo.

ATVO non pubblica un GTFS né una licenza: i PDF sono l'orario ufficiale al pubblico, citati con link alla fonte.
Ogni PDF ha le partenze per direzione («A / TO AEROPORTO», «A / TO VENEZIA» o «MESTRE FS»), il tempo di
percorrenza («COLLEGAMENTO IN SOLI 20 MINUTI», «TEMPO DI PERCORRENZA 20 MINUTI»), il periodo di validità e, per la
35B, il tipo di giorno di ogni corsa (fF tutti i giorni, f feriale, F festivo). Corse con sigle non spiegate nel
PDF (es. SC) si scartano e si segnalano; nei giorni indicati come «subirà variazioni» non si mostra nessuna corsa.
La linea 10A (Jesolo) ha note per singola corsa non leggibili in modo affidabile: non si importa.

Uso: python import_atvo.py [--force]
Output: web/src/data/atvo-venezia.json
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import logging
import os
import re
import sys
from datetime import date, datetime, timedelta, timezone

from coach_common import ROME, is_festive, road_shape, utc_trips
from vod_http import fetch_bytes, fetch_text

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE_DIR, "..", "web", "src", "data", "atvo-venezia.json")
SITE = "https://www.atvo.it"
PAGE = f"{SITE}/it-orari-e-autolinee.html"
DAYS = 21
MIN_AHEAD_DAYS = 10

# fermata -> (nome mostrato, lat, lon) da OpenStreetMap (Nominatim, 19/10/2026)
PLACES = {
    "venezia": ("Venezia (Piazzale Roma)", 45.438007, 12.318851),
    "mestre": ("Mestre (Stazione FS)", 45.482517, 12.232840),
    "aeroporto": ("Aeroporto Marco Polo", 45.504439, 12.339083),
}
LINES = {
    "35": {"pdf": re.compile(r'href="(/assets/bus_routes/035_[^"]*\.pdf)"'), "city": "venezia", "name": "Venezia Express"},
    "35B": {"pdf": re.compile(r'href="(/assets/bus_routes/035b_[^"]*\.pdf)"', re.I), "city": "mestre", "name": "Mestre Express"},
}
TIME = r"\d{1,2}[.:]\d{2}"


def pdf_text(raw: bytes) -> str:
    from pypdf import PdfReader  # dipendenza solo delle pipeline dei PDF

    return "\n".join(p.extract_text() or "" for p in PdfReader(io.BytesIO(raw)).pages)


def secs(t: str) -> int:
    h, m = re.split(r"[.:]", t)
    s = int(h) * 3600 + int(m) * 60
    # dopo mezzanotte (00.40) la corsa appartiene al giorno di servizio precedente
    return s + 86400 if int(h) < 3 else s


def parse(text: str) -> dict:
    """Partenze per direzione con il tipo di giorno, durata, validità e giorni con variazioni."""
    blocks = re.split(r"A / TO\b", text)[1:]
    if len(blocks) < 2:
        raise ValueError("blocchi delle due direzioni non trovati")
    directions = []
    for block in blocks[:2]:
        to_airport = bool(re.match(r"\s*AEROPORTO", block))
        # fino alla riga di legenda o di contatti: solo le righe con orari
        body = re.split(r"www\.atvo\.it|fF TUTTI", block)[0]
        tokens = re.findall(rf"({TIME})\s*((?:fF|SC|f|F)?)(①|②|③|④|⑤|⑥|⑦)?", body)
        if len(tokens) < 10:
            raise ValueError("troppo poche partenze lette")
        directions.append({"toAirport": to_airport, "departures": [(t, flag or "fF", note) for t, flag, note in tokens]})
    minutes = re.search(r"(\d+)\s*MINUTI", text)
    valid = re.search(r"dal\s*/\s*from\s*(\d{2})/(\d{2})/(\d{4})(?:\s*al\s*/\s*to\s*(\d{2})/(\d{2})/(\d{4}))?", text)
    if not minutes or not valid:
        raise ValueError("durata o validità non trovate")
    g = valid.groups()
    changes = {date(int(y), int(m), int(d)) for d, m, y in re.findall(r"(\d{2})/(\d{2})/(\d{4})", text.split("subirà")[0][-80:])}
    return {
        "directions": directions,
        "minutes": int(minutes.group(1)),
        "validFrom": date(int(g[2]), int(g[1]), int(g[0])),
        "validTo": date(int(g[5]), int(g[4]), int(g[3])) if g[3] else None,
        "changes": changes,
    }


def runs_on(flag: str, d: date) -> bool | None:
    """fF tutti i giorni, f feriale, F domenica e festivi; None per sigle non spiegate (si scartano)"""
    if flag == "fF":
        return True
    if flag == "f":
        return not is_festive(d)
    if flag == "F":
        return is_festive(d)
    return None


def build_line(line: str, spec: dict, parsed: dict, start: date) -> tuple[list[dict], list, list[str]]:
    city = PLACES[spec["city"]]
    airport = PLACES["aeroporto"]
    warnings: list[str] = []
    window = [
        start + timedelta(days=i) for i in range(DAYS)
        if start + timedelta(days=i) >= parsed["validFrom"]
        and not (parsed["validTo"] and start + timedelta(days=i) > parsed["validTo"])
        and start + timedelta(days=i) not in parsed["changes"]
    ]
    shapes, trips = [], []
    for direction in parsed["directions"]:
        a, b = (city, airport) if direction["toAirport"] else (airport, city)
        shape, dist = road_shape([(a[1], a[2]), (b[1], b[2])])
        shapes.append(shape)
        for t, flag, _note in direction["departures"]:
            if runs_on(flag, start) is None:
                warnings.append(f"linea {line}: corsa delle {t} con sigla «{flag}» non spiegata nel PDF, scartata")
                continue
            dates = [d for d in window if runs_on(flag, d)]
            if not dates:
                continue
            dep = secs(t)
            base = {
                "id": f"atvo-{line.lower()}-{'a' if direction['toAirport'] else 'c'}-{dep // 60:04d}-{flag}",
                "line": line,
                "name": f"{line} {spec['name']}: {a[0]} → {b[0]}",
                "from": a[0],
                "to": b[0],
                "shape": len(shapes) - 1,
            }
            trips += utc_trips(base, [(dist[0], a[0], True, dep), (dist[1], b[0], True, dep + parsed["minutes"] * 60)], dates)
    return trips, shapes, warnings


def main() -> int:
    ap = argparse.ArgumentParser(description="Orari ATVO 35 e 35B dai PDF ufficiali")
    ap.add_argument("--force", action="store_true", help="riscrive il file anche se i PDF non sono cambiati")
    args = ap.parse_args()
    start = datetime.now(ROME).date() - timedelta(days=1)
    try:
        page = fetch_text(PAGE, timeout=30)
        pdfs = {}
        for line, spec in LINES.items():
            m = spec["pdf"].search(page)
            if not m:
                raise RuntimeError(f"PDF della linea {line} non trovato")
            url = SITE + m.group(1)
            pdfs[line] = (url, fetch_bytes(url, timeout=60, retries=2))
        digest = hashlib.sha256(b"".join(raw for _, raw in pdfs.values())).hexdigest()
        current = json.load(open(OUT, encoding="utf-8")) if os.path.exists(OUT) else {}
        last_date = max((d for t in current.get("trips", []) for d in t.get("dates", [])), default="")
        if not args.force and current.get("pdfSha256") == digest and last_date >= (start + timedelta(days=MIN_AHEAD_DAYS)).strftime("%Y%m%d"):
            logging.info("Orari ATVO invariati (date coperte fino al %s)", last_date)
            return 0
        trips, shapes, warnings, sources = [], [], [], []
        for line, (url, raw) in pdfs.items():
            parsed = parse(pdf_text(raw))
            t, s, w = build_line(line, LINES[line], parsed, start)
            for trip in t:
                trip["shape"] += len(shapes)
            trips += t
            shapes += s
            warnings += w
            sources.append({"line": line, "url": url, "validFrom": parsed["validFrom"].isoformat(), "validTo": parsed["validTo"].isoformat() if parsed["validTo"] else None})
        if len(trips) < 20:
            raise ValueError(f"solo {len(trips)} corse")
    except Exception as exc:  # noqa: BLE001 - qualsiasi errore lascia il file precedente
        logging.error("Orari ATVO non aggiornati: %s", exc)
        return 1
    for w in warnings:
        logging.warning(w)
    data = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "ATVO S.p.A. – orari ufficiali delle linee 35 e 35B (PDF)",
        "sourceUrl": PAGE,
        "license": "Nessuna licenza dichiarata: orario pubblico citato con link alla fonte",
        "attribution": "Orari ATVO S.p.A. (atvo.it); percorso © OpenStreetMap contributors (OSRM)",
        "timezone": "UTC",
        "pdfSha256": digest,
        "sources": sources,
        "warnings": warnings,
        "note": "Partenze dai PDF ufficiali, arrivo dopo il tempo di percorrenza indicato (20 minuti). Orari in secondi UTC dalla mezzanotte UTC della data; posizioni previste dall'orario lungo il percorso stradale, non GPS. Linea 10A non importata.",
        "trips": trips,
        "shapes": shapes,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    logging.info("ATVO: %d corse -> %s", len(trips), OUT)
    return 0


if __name__ == "__main__":
    sys.exit(main())
