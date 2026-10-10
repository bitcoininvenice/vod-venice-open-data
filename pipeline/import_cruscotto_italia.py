#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: profilo socio-economico dei comuni della laguna da Cruscotto Italia (AgID).

Cruscotto Italia aggrega per comune dati ufficiali (ISTAT, MEF, MIM, ANAC, BDAP, PNRR, SIOPE,
Agenzia del Demanio, ISPRA, ACI, AGCOM, Ministero del Turismo...). La pipeline legge gli
indicatori sintetici (tool MCP `comune_kpi`, circa 55 valori per comune) seguendo le buone pratiche
del servizio: User-Agent riconoscibile, poche richieste, attesa crescente in caso di 429.

Licenza: CC BY 4.0 (dati aggregati da Cruscotto Italia - AgID); restano valide le attribuzioni
alle fonti originarie indicate nel servizio.
Output: web/src/data/cruscotto-comuni.json
Uso: python import_cruscotto_italia.py
"""

import json
import logging
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from vod_http import USER_AGENT

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "cruscotto-comuni.json")
MCP_URL = "https://cruscotto-italia-mcp.agid.workers.dev/mcp"
ABOUT_URL = "https://cruscotto-italia.dati.gov.it/about.html"

# Comuni affacciati sulla laguna di Venezia (codici ISTAT)
COMUNI = {"027042": "Venezia", "027008": "Chioggia", "027044": "Cavallino-Treporti"}


def call_tool(name: str, arguments: dict, request_id: int, retries: int = 4) -> dict:
    body = json.dumps({"jsonrpc": "2.0", "id": request_id, "method": "tools/call", "params": {"name": name, "arguments": arguments}}).encode()
    for attempt in range(1, retries + 1):
        req = urllib.request.Request(
            MCP_URL,
            data=body,
            method="POST",
            headers={"Content-Type": "application/json", "Accept": "application/json, text/event-stream", "User-Agent": USER_AGENT},
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return parse_rpc(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            # 429: il servizio chiede di aspettare; si rispetta Retry-After o un'attesa crescente
            if e.code == 429 and attempt < retries:
                wait = int(e.headers.get("Retry-After") or 0) or 30 * attempt
                logging.warning("429 da Cruscotto Italia, attendo %d s", wait)
                time.sleep(wait)
                continue
            raise
        except urllib.error.URLError:
            if attempt == retries:
                raise
            time.sleep(10 * attempt)
    raise RuntimeError("Cruscotto Italia non raggiungibile")


def parse_rpc(text: str) -> dict:
    """Risposta JSON-RPC in JSON semplice o in un evento SSE; restituisce il JSON del primo contenuto testuale."""
    if not text.lstrip().startswith("{"):
        text = next(line[5:] for line in text.splitlines() if line.startswith("data:"))
    msg = json.loads(text)
    if msg.get("error"):
        raise RuntimeError(f"errore MCP: {msg['error']}")
    result = msg.get("result") or {}
    if result.get("isError"):
        raise RuntimeError("il tool ha restituito un errore")
    content = result.get("content") or []
    return json.loads(content[0]["text"]) if content else {}


def compact(kpi: dict) -> dict:
    """Tiene le sezioni degli indicatori, scartando i campi tecnici interni."""
    return {k: v for k, v in kpi.items() if not k.startswith("_") or k in ("_generated_at",)}


def main() -> int:
    comuni = []
    try:
        for i, (code, name) in enumerate(COMUNI.items(), start=1):
            kpi = call_tool("comune_kpi", {"istat_code": code}, i)
            if (kpi.get("anagrafica") or {}).get("istat") != code:
                raise RuntimeError(f"risposta inattesa per {code}")
            comuni.append({"code": code, "name": name, "kpi": compact(kpi)})
            time.sleep(2)  # carico leggero sul servizio
    except Exception as e:  # noqa: BLE001
        logging.error("Cruscotto Italia non aggiornato: %s", e)
        return 1

    out = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "Cruscotto Italia - AgID (aggregazione di fonti ufficiali)",
        "sourceUrl": ABOUT_URL,
        "license": "CC BY 4.0",
        "comuni": comuni,
    }
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    logging.info("Cruscotto Italia: %s", [c["name"] for c in comuni])
    return 0


if __name__ == "__main__":
    sys.exit(main())
