#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: Download GTFS Static Archives from ACTV Open Data
"""

import os
import sys
import zipfile
import urllib.request
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

URLS = {
    "navigazione": "http://actv.avmspa.it/sites/default/files/attachments/opendata/navigazione/actv_nav.zip",
    "automobilistico": "http://actv.avmspa.it/sites/default/files/attachments/opendata/automobilistico/actv_aut.zip"
}

def download_file(url: str, dest_path: str):
    logging.info(f"Downloading {url} -> {dest_path}...")
    headers = {'User-Agent': 'Mozilla/5.0 (VOD-VeniceOpenData/1.0)'}
    req = urllib.request.Request(url, headers=headers)
    
    try:
        with urllib.request.urlopen(req, timeout=30) as response, open(dest_path, 'wb') as out_file:
            data = response.read()
            out_file.write(data)
        logging.info(f"Downloaded successfully: {os.path.getsize(dest_path)} bytes")
        return True
    except Exception as e:
        logging.warning(f"Could not download {url}: {e}")
        return False

def extract_zip(zip_path: str, extract_to: str):
    if not os.path.exists(zip_path):
        logging.error(f"File not found: {zip_path}")
        return False
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_to)
        logging.info(f"Extracted {zip_path} to {extract_to}")
        return True
    except Exception as e:
        logging.error(f"Failed to extract {zip_path}: {e}")
        return False

def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    
    for mode, url in URLS.items():
        mode_dir = os.path.join(DATA_DIR, mode)
        os.makedirs(mode_dir, exist_ok=True)
        zip_path = os.path.join(DATA_DIR, f"actv_{mode}.zip")
        
        success = download_file(url, zip_path)
        if success:
            extract_zip(zip_path, mode_dir)
        else:
            logging.info(f"Checking if previous or sample data exists in {mode_dir}...")
            if os.path.exists(zip_path):
                extract_zip(zip_path, mode_dir)

    logging.info("GTFS download & extraction process completed.")

if __name__ == "__main__":
    main()
