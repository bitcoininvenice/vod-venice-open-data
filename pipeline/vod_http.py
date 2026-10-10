"""
VOD - Venice Open Data
Richieste HTTP condivise dalle pipeline: User-Agent riconoscibile, tentativi con attesa crescente
(rispettando Retry-After dopo un 429), istanze Overpass di riserva e limite di una richiesta al
secondo verso Nominatim. Solo libreria standard.
"""

from __future__ import annotations

import json
import logging
import os
import time
import urllib.error
import urllib.parse
import urllib.request

# Identifica il progetto presso i gestori delle fonti (policy di OSM, Nominatim e dei portali open data)
USER_AGENT = "VOD-VeniceOpenData/1.0 (+https://venice-open-data.vercel.app)"

OVERPASS_URLS = [
    u
    for u in [
        os.environ.get("OVERPASS_URL"),
        "https://overpass-api.de/api/interpreter",
        "https://overpass.private.coffee/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
    ]
    if u
]

NOMINATIM_URL = "https://nominatim.openstreetmap.org"
NOMINATIM_INTERVAL_S = 1.1  # policy Nominatim: al massimo una richiesta al secondo
_last_nominatim = 0.0


def _retry_after(err: Exception) -> float | None:
    if isinstance(err, urllib.error.HTTPError) and err.code == 429:
        try:
            return float(err.headers.get("Retry-After", ""))
        except ValueError:
            return None
    return None


def fetch_bytes(
    url: str,
    *,
    params: dict | None = None,
    data: bytes | None = None,
    headers: dict | None = None,
    timeout: float = 60,
    retries: int = 1,
    backoff: float = 10,
) -> bytes:
    """Scarica `url` (GET, o POST se `data`). Con `retries` > 1 riprova con attese di backoff × tentativo."""
    full = f"{url}?{urllib.parse.urlencode(params)}" if params else url
    req = urllib.request.Request(full, data=data, headers={"User-Agent": USER_AGENT, **(headers or {})})
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read()
        except Exception as e:  # noqa: BLE001 - rete instabile: si riprova
            if attempt == retries:
                raise
            wait = _retry_after(e) or backoff * attempt
            logging.warning("Tentativo %d per %s fallito (%s), riprovo tra %.0f s", attempt, url, e, wait)
            time.sleep(wait)
    raise RuntimeError("irraggiungibile")


def fetch_text(url: str, **kwargs) -> str:
    """Testo UTF-8 (anche con BOM, frequente nei CSV della PA)."""
    return fetch_bytes(url, **kwargs).decode("utf-8-sig", errors="replace")


def fetch_json(url: str, **kwargs):
    return json.loads(fetch_bytes(url, headers={"Accept": "application/json", **kwargs.pop("headers", {})}, **kwargs))


def overpass(query: str, *, timeout: float = 120, rounds: int = 2, pause: float = 5) -> dict:
    """Query Overpass: si provano le istanze in ordine, per `rounds` giri (rispondono spesso 504 se sovraccariche)."""
    body = urllib.parse.urlencode({"data": query}).encode()
    last_error: Exception | None = None
    for _ in range(rounds):
        for url in OVERPASS_URLS:
            try:
                payload = fetch_json(url, data=body, timeout=timeout)
                if isinstance(payload, dict) and "elements" in payload:
                    return payload
                raise ValueError("risposta senza 'elements'")
            except Exception as e:  # noqa: BLE001 - si prova l'istanza successiva
                last_error = e
                logging.warning("Overpass %s fallito: %s", url, e)
                time.sleep(pause)
    raise RuntimeError(f"tutte le istanze Overpass hanno fallito: {last_error}")


def nominatim(endpoint: str, params: dict, *, timeout: float = 20):
    """Richiesta a Nominatim (`search` o `reverse`), distanziata di almeno 1,1 s dalla precedente."""
    global _last_nominatim
    wait = NOMINATIM_INTERVAL_S - (time.monotonic() - _last_nominatim)
    if wait > 0:
        time.sleep(wait)
    try:
        return fetch_json(f"{NOMINATIM_URL}/{endpoint}", params={"format": "jsonv2", **params}, timeout=timeout)
    finally:
        _last_nominatim = time.monotonic()
