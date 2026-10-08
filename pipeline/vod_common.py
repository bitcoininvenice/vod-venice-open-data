"""
VOD - Venice Open Data
Utility condivise della pipeline: connessione al database e log sicuri.
"""

import logging
import os
import sys
from urllib.parse import urlsplit


def database_url() -> str:
    """Legge DATABASE_URL dall'ambiente. Nessun valore di default: credenziali mai nel codice."""
    url = os.environ.get("DATABASE_URL")
    if not url:
        logging.error("DATABASE_URL non impostata (vedi .env.example).")
        sys.exit(1)
    return url


def redact(url: str) -> str:
    """Rimuove utente e password da un URL di connessione prima di scriverlo nei log."""
    parts = urlsplit(url)
    host = parts.hostname or "?"
    port = f":{parts.port}" if parts.port else ""
    return f"{parts.scheme}://***@{host}{port}{parts.path}"


def connect():
    import psycopg2  # import differito: le utility di questo modulo non richiedono il driver

    url = database_url()
    try:
        conn = psycopg2.connect(url)
        logging.info("Connesso al database %s", redact(url))
        return conn
    except psycopg2.Error as e:
        # Il messaggio di psycopg2 non contiene la password; l'URL viene comunque oscurato.
        logging.error("Connessione al database %s fallita: %s", redact(url), e.pgerror or type(e).__name__)
        sys.exit(1)
