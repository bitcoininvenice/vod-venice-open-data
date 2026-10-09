#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: fontanelle di acqua potabile pubblica da OpenStreetMap (amenity=drinking_water).
Dopo l'import, enrich_fountains.py aggiunge un toponimo di prossimità ai punti senza nome.

Licenza dati OSM: ODbL 1.0 - © OpenStreetMap contributors.
Output: web/src/data/fountains.json
"""

import json
import logging
import os
import urllib.parse
import time
import urllib.request
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Cache condivisa delle geocodifiche (versionata: nessuna nuova richiesta per i punti già noti)
CACHE_FILE = os.path.join(BASE_DIR, "geocode-cache.json")
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "fountains.json")

OVERPASS_URLS = [
    u for u in [
        os.environ.get("OVERPASS_URL"),
        "https://overpass-api.de/api/interpreter",
        "https://overpass.private.coffee/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
    ] if u
]

# Bounding box Laguna di Venezia & Centro Storico (ottimizzato e concentrato)
BBOX = (45.30, 12.28, 45.50, 12.44)

QUERY = f"""[out:json][timeout:35];
node["amenity"="drinking_water"]({BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]});
out body;"""

# Centro storico (sestieri e Giudecca): fuori da questo riquadro non si assegna mai un sestiere
CENTRO_STORICO = (45.424, 12.305, 45.452, 12.372)  # lat0, lon0, lat1, lon1

# Nomi delle zone usati in VOD per le isole (dalla frazione restituita da Nominatim)
ISLAND_ZONES = {
    "Murano": "Murano",
    "Burano": "Burano / Mazzorbo / Torcello",
    "Mazzorbo": "Burano / Mazzorbo / Torcello",
    "Torcello": "Burano / Mazzorbo / Torcello",
    "Sant'Erasmo": "Sant'Erasmo / Vignole",
    "Vignole": "Sant'Erasmo / Vignole",
    "Lido": "Lido di Venezia",
    "Malamocco": "Lido di Venezia",
    "Alberoni": "Lido di Venezia",
    "Pellestrina": "Pellestrina",
    "San Pietro in Volta": "Pellestrina",
}
# Isole piccole senza strade con nome: Nominatim restituirebbe la strada più vicina su un'altra isola
SMALL_ISLANDS = [
    ("San Michele (cimitero)", (45.4445, 12.3435, 45.4495, 12.3515)),
]
SESTIERI = {"Cannaregio", "Castello", "San Marco", "San Polo", "Santa Croce", "Dorsoduro"}
NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse"
NOMINATIM_UA = "VOD-VeniceOpenData/1.0 (+https://venice-open-data.vercel.app)"


def zone_from_address(addr: dict) -> str | None:
    """Zona da un indirizzo Nominatim. Nel centro storico il sestiere è in `neighbourhood`;
    nelle isole e in terraferma conta la frazione (village/town/suburb)."""
    hood = addr.get("neighbourhood")
    if hood in SESTIERI:
        return hood
    if hood == "Giudecca" or hood == "Sacca Fisola":
        return "Giudecca & Sacca Fisola"
    if hood == "Sant'Elena":
        return "Castello (Sant'Elena)"
    district = addr.get("suburb", "")
    place = addr.get("village") or addr.get("town") or addr.get("hamlet")
    if district in ("Venezia-Murano-Burano", "Lido-Pellestrina"):
        return ISLAND_ZONES.get(place or "", None)
    # Terraferma: la frazione (es. Campalto, Tessera) o il quartiere (es. Mestre, Marghera)
    return place or district or None


def small_island(lat: float, lon: float) -> str | None:
    for name, (lat0, lon0, lat1, lon1) in SMALL_ISLANDS:
        if lat0 <= lat <= lat1 and lon0 <= lon <= lon1:
            return name
    return None


def determine_sestiere(lat: float, lon: float) -> str:
    """Ripiego senza rete: sestieri solo dentro il centro storico, isole per riquadro, altrimenti terraferma."""
    island = small_island(lat, lon)
    if island:
        return island
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
    in_centre = CENTRO_STORICO[0] <= lat <= CENTRO_STORICO[2] and CENTRO_STORICO[1] <= lon <= CENTRO_STORICO[3]
    if not in_centre:
        return "Terraferma"
    if 12.30 <= lon <= 12.34 and 45.420 <= lat <= 45.430:
        return "Giudecca & Sacca Fisola"
    if 12.35 <= lon <= 12.37 and 45.425 <= lat <= 45.435:
        return "Castello (Sant'Elena)"
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


def reverse_zone(lat: float, lon: float, cache: dict) -> str:
    """Zona dalla geocodifica inversa di OpenStreetMap (cache su file, 1 richiesta al secondo)."""
    island = small_island(lat, lon)
    if island:
        return island
    key = f"reverse:{lat:.5f},{lon:.5f}"
    if key not in cache:
        params = urllib.parse.urlencode({"format": "jsonv2", "lat": lat, "lon": lon, "zoom": 17, "addressdetails": 1})
        try:
            req = urllib.request.Request(f"{NOMINATIM_REVERSE}?{params}", headers={"User-Agent": NOMINATIM_UA})
            with urllib.request.urlopen(req, timeout=20) as resp:
                cache[key] = zone_from_address(json.load(resp).get("address", {}))
        except Exception as e:  # noqa: BLE001
            logging.warning("Geocodifica inversa fallita per %s: %s", key, e)
            return determine_sestiere(lat, lon)
        finally:
            time.sleep(1.1)
    return cache[key] or determine_sestiere(lat, lon)


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
    
    # Due giri sulle istanze: Overpass risponde spesso 504 quando è sovraccarico
    for url in OVERPASS_URLS * 2:
        if data:
            break
        try:
            logging.info(f"Tentativo con endpoint {url}...")
            req = urllib.request.Request(
                url,
                data=QUERY.encode("utf-8"),
                headers={
                    "User-Agent": "VOD-Venice/1.0"
                }
            )
            with urllib.request.urlopen(req, timeout=120) as res:
                data = json.loads(res.read().decode("utf-8"))
                logging.info(f"Ricevuta risposta valida da {url}")
                break
        except Exception as e:
            logging.warning(f"Errore su {url}: {e}")
            last_err = e
            time.sleep(10)
            
    if not data or "elements" not in data:
        logging.error(f"Impossibile scaricare dati fontanelle: {last_err}")
        return 1

    elements = data["elements"]
    logging.info(f"Nodi OSM grezzi trovati: {len(elements)}")
    
    fountains = []
    seen_coords = set()
    counter_by_sestiere = {}
    cache = {}
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, encoding="utf-8") as f:
            cache = json.load(f)
    
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
            
        sestiere = reverse_zone(lat, lon, cache)
        counter_by_sestiere[sestiere] = counter_by_sestiere.get(sestiere, 0) + 1
        
        osm_id = el.get("id")
        name = format_fountain_name(tags, sestiere, counter_by_sestiere[sestiere])
        
        material = tags.get("material", "")
        if material == "cast_iron" or "ghisa" in tags.get("description", "").lower():
            typology = "Colonnina in ghisa ottocentesca con rubinetto a pulsante"
        elif material == "stone" or "istria" in tags.get("description", "").lower():
            typology = "Colonna in pietra d'Istria con vaschetta"
        else:
            typology = "Fontanella pubblica (tipologia non indicata in OSM)"

        # Solo ciò che riporta OSM: orari, potabilità certificata e campagne non sono attribuiti al singolo punto
        details = tags.get("description", "")
            
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
            "operator": tags.get("operator", "Non indicato (OSM)"),
            "waterSource": "Acquedotto civico (gestore Veritas S.p.A.)",
            "potable": True
        })
        
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=1)
    logging.info(f"Fontanelle totali elaborate e validate: {len(fountains)}")
    
    # Ordina per sestiere e nome
    fountains.sort(key=lambda x: (x["sestiere"], x["name"]))
    
    payload = {
        "metadata": {
            "source": "OpenStreetMap contributors (ODbL 1.0) - amenity=drinking_water",
            "extractedAt": datetime.now(timezone.utc).isoformat(),
            "totalFountains": len(fountains),
            "distributionByZone": counter_by_sestiere,
            "notes": (
                "Fontanelle pubbliche mappate su OpenStreetMap nel centro storico, nelle isole e nella terraferma vicina; "
                "zona dalla geocodifica inversa di OpenStreetMap (Nominatim). "
                "Escluse quelle con drinking_water=no. Funzionamento dei singoli punti non verificato."
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
