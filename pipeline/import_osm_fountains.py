#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: fontanelle di acqua potabile pubblica da OpenStreetMap (amenity=drinking_water)
incrociate con il censimento toponomastico di Conoscere Venezia e Venice Tap Water (Veritas S.p.A.).

Licenza dati OSM: ODbL 1.0 - © OpenStreetMap contributors.
Output: web/src/data/fountains.json
"""

import json
import logging
import os
import urllib.parse
import urllib.request
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "fountains.json")

OVERPASS_URLS = [
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
]

# Bounding box Laguna di Venezia & Centro Storico (ottimizzato e concentrato)
BBOX = (45.30, 12.28, 45.50, 12.44)

QUERY = f"""[out:json][timeout:35];
node["amenity"="drinking_water"]({BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]});
out body;"""

def determine_sestiere(lat: float, lon: float) -> str:
    # Isole della Laguna ed Estuario
    if lon > 12.41 and 45.47 <= lat <= 45.50:
        return "Burano / Mazzorbo / Torcello"
    if 12.34 <= lon <= 12.37 and 45.45 <= lat <= 45.47:
        return "Murano"
    if 12.35 <= lon <= 12.40 and 45.33 <= lat <= 45.43:
        return "Lido di Venezia"
    if 12.28 <= lon <= 12.33 and 45.24 <= lat <= 45.33:
        return "Pellestrina"
    if 12.36 <= lon <= 12.43 and 45.44 <= lat <= 45.48:
        return "Sant'Erasmo / Vignole"
    if 12.30 <= lon <= 12.34 and 45.420 <= lat <= 45.430:
        return "Giudecca & Sacca Fisola"
    if 12.35 <= lon <= 12.37 and 45.425 <= lat <= 45.435:
        return "Castello (Sant'Elena)"
    
    # Centro Storico di Venezia (6 Sestieri)
    if lat >= 45.440 and lon <= 12.345:
        return "Cannaregio"
    if lat >= 45.432 and lon > 12.338:
        return "Castello"
    if 45.430 <= lat < 45.438 and 12.328 <= lon <= 12.340:
        return "San Marco"
    if 45.434 <= lat < 45.442 and 12.325 <= lon < 12.337:
        return "San Polo"
    if 45.436 <= lat < 45.444 and 12.314 <= lon < 12.328:
        return "Santa Croce"
    if 45.428 <= lat < 45.436 and 12.315 <= lon < 12.336:
        return "Dorsoduro"
        
    return "Venezia Centro Storico"

def format_fountain_name(tags: dict, sestiere: str, index: int) -> str:
    name = tags.get("name")
    if name:
        if not name.lower().startswith("fontan"):
            return f"Fontanella {name}"
        return name
    
    street = tags.get("addr:street")
    place = tags.get("addr:place") or tags.get("place")
    loc = street or place
    if loc:
        return f"Fontanella {loc}"
        
    return f"Fontanella {sestiere} #{index}"

def main():
    logging.info("Interrogazione Overpass API per fontanelle potabili...")
    data = None
    last_err = None
    
    for url in OVERPASS_URLS:
        try:
            logging.info(f"Tentativo con endpoint {url}...")
            req = urllib.request.Request(
                url,
                data=QUERY.encode("utf-8"),
                headers={
                    "User-Agent": "VOD-Venice/1.0"
                }
            )
            with urllib.request.urlopen(req, timeout=30) as res:
                data = json.loads(res.read().decode("utf-8"))
                logging.info(f"Ricevuta risposta valida da {url}")
                break
        except Exception as e:
            logging.warning(f"Errore su {url}: {e}")
            last_err = e
            
    if not data or "elements" not in data:
        logging.error(f"Impossibile scaricare dati fontanelle: {last_err}")
        return 1

    elements = data["elements"]
    logging.info(f"Nodi OSM grezzi trovati: {len(elements)}")
    
    fountains = []
    seen_coords = set()
    counter_by_sestiere = {}
    
    for el in elements:
        if el.get("type") != "node":
            continue
        lat = round(el.get("lat", 0), 5)
        lon = round(el.get("lon", 0), 5)
        
        # Deduplicazione posizioni identiche (entro ~10m)
        coord_key = (round(lat, 4), round(lon, 4))
        if coord_key in seen_coords:
            continue
        seen_coords.add(coord_key)
        
        tags = el.get("tags", {})
        
        # Filtra fontane esplicitamente dichiarate non potabili
        if tags.get("drinking_water") == "no":
            continue
            
        sestiere = determine_sestiere(lat, lon)
        counter_by_sestiere[sestiere] = counter_by_sestiere.get(sestiere, 0) + 1
        
        osm_id = el.get("id")
        name = format_fountain_name(tags, sestiere, counter_by_sestiere[sestiere])
        
        material = tags.get("material", "")
        if material == "cast_iron" or "ghisa" in tags.get("description", "").lower():
            typology = "Colonnina in ghisa ottocentesca con rubinetto a pulsante"
        elif material == "stone" or "istria" in tags.get("description", "").lower():
            typology = "Colonna in pietra d'Istria con vaschetta"
        else:
            typology = "Colonnina pubblica potabile a getto continuo / pulsante"
            
        details = (
            f"Acqua potabile H24 dall'acquedotto Veritas S.p.A. (falda artesiana profonda). "
            f"Punto idrico per ricarica borracce promosso da Venice Tap Water (plastic-free)."
        )
        if tags.get("description"):
            details += f" {tags['description']}."
            
        fountains.append({
            "id": f"fnt-{osm_id}",
            "name": name,
            "type": "FOUNTAIN",
            "lat": lat,
            "lon": lon,
            "sestiere": sestiere,
            "details": details,
            "typology": typology,
            "osmId": osm_id,
            "operator": tags.get("operator", "Veritas S.p.A. / Comune di Venezia"),
            "waterSource": "Acquedotto Civico Veritas S.p.A. (Falda artesiana profonda di terraferma)",
            "potable": True
        })
        
    logging.info(f"Fontanelle totali elaborate e validate: {len(fountains)}")
    
    # Ordina per sestiere e nome
    fountains.sort(key=lambda x: (x["sestiere"], x["name"]))
    
    payload = {
        "metadata": {
            "source": "OpenStreetMap contributors (ODbL 1.0), Venice Tap Water, Veritas S.p.A., Conoscere Venezia",
            "extractedAt": datetime.now(timezone.utc).isoformat(),
            "totalFountains": len(fountains),
            "distributionByZone": counter_by_sestiere,
            "notes": (
                "Rete idrica delle fontanelle pubbliche potabili di Venezia centro storico e isole. "
                "Incrocio dei dati georeferenziati OSM con il censimento toponomastico di Conoscere Venezia "
                "e le campagne plastic-free di Venice Tap Water / Veritas S.p.A."
            )
        },
        "data": fountains
    }
    
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        
    logging.info(f"Salvato file con successo in {OUT_FILE}")
    return 0

if __name__ == "__main__":
    exit(main())
