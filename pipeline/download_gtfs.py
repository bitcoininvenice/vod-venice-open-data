#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: download degli archivi GTFS statici dagli Open Data ACTV (licenza CC BY, citare la fonte).
"""

import logging
import os
import shutil
import sys
import urllib.request
import zipfile
from vod_http import USER_AGENT

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

URLS = {
    "navigazione": os.environ.get(
        "GTFS_NAV_URL",
        "https://actv.avmspa.it/sites/default/files/attachments/opendata/navigazione/actv_nav.zip",
    ),
    "automobilistico": os.environ.get(
        "GTFS_AUT_URL",
        "https://actv.avmspa.it/sites/default/files/attachments/opendata/automobilistico/actv_aut.zip",
    ),
}

# Limiti di sicurezza: gli archivi ufficiali pesano 3-16 MB compressi e circa 100 MB estratti.
MAX_DOWNLOAD_BYTES = 200 * 1024 * 1024
MAX_EXTRACTED_BYTES = 1024 * 1024 * 1024
REQUIRED_FILES = {"agency.txt", "routes.txt", "trips.txt", "stops.txt", "stop_times.txt"}


def download_file(url: str, dest_path: str) -> bool:
    if not url.startswith("https://"):
        logging.error("URL non HTTPS rifiutato: %s", url)
        return False
    logging.info("Download %s -> %s", url, dest_path)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    tmp_path = dest_path + ".part"
    try:
        with urllib.request.urlopen(req, timeout=60) as response, open(tmp_path, "wb") as out_file:
            written = 0
            while chunk := response.read(1024 * 1024):
                written += len(chunk)
                if written > MAX_DOWNLOAD_BYTES:
                    raise ValueError("archivio oltre la dimensione massima consentita")
                out_file.write(chunk)
        os.replace(tmp_path, dest_path)
        logging.info("Scaricati %d byte", os.path.getsize(dest_path))
        return True
    except Exception as e:
        logging.warning("Download fallito per %s: %s", url, e)
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        return False


def safe_extract(zip_path: str, extract_to: str) -> bool:
    """Estrae l'archivio rifiutando path traversal, link e dimensioni anomale (zip bomb)."""
    try:
        with zipfile.ZipFile(zip_path) as zf:
            members = zf.infolist()
            total = sum(m.file_size for m in members)
            if total > MAX_EXTRACTED_BYTES:
                raise ValueError(f"contenuto estratto troppo grande ({total} byte)")
            root = os.path.realpath(extract_to)
            for m in members:
                target = os.path.realpath(os.path.join(extract_to, m.filename))
                if os.path.commonpath([root, target]) != root:
                    raise ValueError(f"percorso non sicuro nell'archivio: {m.filename}")
            names = {os.path.basename(m.filename) for m in members}
            missing = REQUIRED_FILES - names
            if missing:
                raise ValueError(f"file GTFS obbligatori mancanti: {sorted(missing)}")

            if os.path.isdir(extract_to):
                shutil.rmtree(extract_to)
            os.makedirs(extract_to)
            zf.extractall(extract_to)
        logging.info("Estratto %s in %s", zip_path, extract_to)
        return True
    except Exception as e:
        logging.error("Estrazione di %s fallita: %s", zip_path, e)
        return False


def main() -> int:
    os.makedirs(DATA_DIR, exist_ok=True)
    ok = True
    for mode, url in URLS.items():
        zip_path = os.path.join(DATA_DIR, f"actv_{mode}.zip")
        if not download_file(url, zip_path):
            if not os.path.exists(zip_path):
                ok = False
                continue
            logging.info("Uso l'archivio scaricato in precedenza per %s", mode)
        ok = safe_extract(zip_path, os.path.join(DATA_DIR, mode)) and ok
    logging.info("Download ed estrazione GTFS completati%s.", "" if ok else " con errori")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
