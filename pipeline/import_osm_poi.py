#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: punti di interesse da OpenStreetMap che sostituiscono elenchi compilati a mano.

- colonnine di ricarica (amenity=charging_station)
- parcheggi con capienza dichiarata ≥ 100 posti (amenity=parking + capacity)
- vere da pozzo del centro storico e delle isole (man_made=water_well)
- alberi monumentali (natural=tree con denotation; molti riportano ref:masaf, il codice
  dell'Elenco nazionale degli alberi monumentali del Ministero dell'agricoltura)
- ecocentri per rifiuti ingombranti e differenziati (amenity=recycling + recycling_type=centre)
- biblioteche (amenity=library)
- luoghi con Wi-Fi (internet_access=wlan o wifi=yes/free): hotel, bar, ristoranti, biblioteche, musei...
  con tipo di accesso (gratuito, per i clienti, a pagamento) e nome della rete se mappato; mai password
- impianti e spazi sportivi (leisure=pitch, sports_centre, fitness_station, track, stadium, sports_hall):
  base del livello Sport, a cui VOD aggiunge le segnalazioni della comunità CAMPO
- nautica: marine e darsene, distributori di carburante per barche, scivoli di alaggio, cantieri nautici,
  noleggi e ormeggi con il tipo di accesso (consentito, ospiti, privato, vietato...)

Licenza dei dati: ODbL 1.0 - © OpenStreetMap contributors.
Output: web/src/data/osm-poi.json (letto da web/src/lib/osmPoi.ts).
Uso: python import_osm_poi.py
"""

import json
import logging
import os
import re
import sys
from datetime import datetime, timezone

from import_osm_defibrillators import BBOX
from vod_http import overpass

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "osm-poi.json")

B = f"{BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]}"
# Centro storico, Giudecca, Murano, Burano, Lido: le vere da pozzo di interesse storico
WELLS_BBOX = (45.40, 12.29, 45.50, 12.43)
MIN_PARKING_CAPACITY = 100

QUERY = f"""[out:json][timeout:120];
(
  nwr["amenity"="charging_station"]({B});
  nwr["amenity"="parking"]["capacity"]({B});
  nwr["man_made"="water_well"]({WELLS_BBOX[0]},{WELLS_BBOX[1]},{WELLS_BBOX[2]},{WELLS_BBOX[3]});
  nwr["natural"="tree"]["denotation"~"natural_monument|landmark"]({B});
  nwr["amenity"="recycling"]["recycling_type"="centre"]({B});
  nwr["amenity"="waste_transfer_station"]["name"~"[Ee]cocentro"]({B});
  nwr["amenity"="library"]({B});
  nwr["internet_access"="wlan"]({B});
  nwr["wifi"~"^(yes|free)$"]({B});
  nwr["leisure"~"^(pitch|sports_centre|fitness_station|track|stadium|sports_hall)$"]({B});
  nwr["leisure"~"^(marina|slipway)$"]({B});
  nwr["waterway"~"^(fuel|boatyard)$"]({B});
  nwr["amenity"="fuel"]["boat"="yes"]({B});
  nwr["amenity"="boat_rental"]({B});
  nwr["mooring"]({B});
);
out tags center;"""

SOCKET_LABELS = {
    "type2": "Type 2",
    "type2_combo": "CCS Combo 2",
    "chademo": "CHAdeMO",
    "schuko": "Schuko",
    "type2_cable": "Type 2 (cavo)",
}


def coords(el):
    lat = el.get("lat", el.get("center", {}).get("lat"))
    lon = el.get("lon", el.get("center", {}).get("lon"))
    return (round(lat, 6), round(lon, 6)) if lat is not None and lon is not None else None


def osm_ref(el):
    return f"osm_{el['type']}_{el['id']}", f"https://www.openstreetmap.org/{el['type']}/{el['id']}"


def to_int(value):
    m = re.match(r"^\s*(\d+)", str(value or ""))
    return int(m.group(1)) if m else None


def to_float(value):
    m = re.match(r"^\s*(\d+(?:[.,]\d+)?)", str(value or ""))
    return float(m.group(1).replace(",", ".")) if m else None


def power_kw(tags):
    """Potenza massima dichiarata (kW) da maxpower o socket:*:output."""
    values = []
    for k, v in tags.items():
        if k == "maxpower" or (k.startswith("socket:") and k.endswith(":output")):
            n = to_float(v)
            if n is None:
                continue
            values.append(n / 1000 if "kw" not in v.lower() and n > 1000 else n)
    return max(values) if values else None


def zone(lat, lon):
    """Zona indicativa per la scheda (riquadri approssimati, non confini amministrativi)."""
    if 45.425 <= lat <= 45.45 and 12.30 <= lon <= 12.37:
        return "Venezia centro storico"
    if lat < 45.425 and lon >= 12.33:
        return "Lido / Pellestrina"
    if lon >= 12.45:
        return "Cavallino-Treporti / litorale"
    if lat >= 45.49 and lon >= 12.32:
        return "Tessera / Aeroporto"
    if lon < 12.30 and lat >= 45.47:
        return "Mestre"
    if lon < 12.30:
        return "Marghera / Terraferma"
    return "Laguna"


def ev(el, tags, lat, lon):
    rid, url = osm_ref(el)
    sockets = [label for key, label in SOCKET_LABELS.items() if tags.get(f"socket:{key}")]
    return {
        "id": rid, "sourceUrl": url, "lat": lat, "lon": lon,
        "name": tags.get("name") or tags.get("brand") or "Colonnina di ricarica",
        "operator": tags.get("operator") or tags.get("brand") or "Non indicato",
        "location": tags.get("addr:street") or zone(lat, lon),
        "totalSockets": to_int(tags.get("capacity")),
        "powerKw": power_kw(tags),
        "socketTypes": sockets,
        "openingHours": tags.get("opening_hours"),
        "fee": tags.get("fee"),
    }


def parking(el, tags, lat, lon):
    rid, url = osm_ref(el)
    return {
        "id": rid, "sourceUrl": url, "lat": lat, "lon": lon,
        "name": tags.get("name") or "Parcheggio",
        "location": zone(lat, lon),
        "totalSpots": to_int(tags.get("capacity")),
        "operator": tags.get("operator") or "Non indicato",
        "fee": tags.get("fee"),
        "parkingType": tags.get("parking"),
        "parkRide": tags.get("park_ride") not in (None, "no"),
    }


def well(el, tags, lat, lon):
    rid, url = osm_ref(el)
    return {
        "id": rid, "sourceUrl": url, "lat": lat, "lon": lon,
        "name": tags.get("name") or "Vera da pozzo",
        "historic": tags.get("historic") is not None or tags.get("disused") == "yes",
        "startDate": tags.get("start_date"),
        "drinkingWater": tags.get("drinking_water") == "yes" and tags.get("disused") != "yes",
    }


def tree(el, tags, lat, lon):
    rid, url = osm_ref(el)
    return {
        "id": rid, "sourceUrl": url, "lat": lat, "lon": lon,
        "species": tags.get("species") or tags.get("genus") or "Specie non indicata",
        "commonName": tags.get("species:it") or tags.get("name") or tags.get("species") or "Albero monumentale",
        "heightMeters": to_float(tags.get("height")),
        "circumferenceMeters": to_float(tags.get("circumference")),
        "masafRef": tags.get("ref:masaf"),
        "wikidata": tags.get("wikidata"),
        "location": zone(lat, lon),
    }


def civic(el, tags, lat, lon, default_name):
    rid, url = osm_ref(el)
    street = tags.get("addr:street")
    address = f"{street} {tags.get('addr:housenumber', '')}".strip() if street else None
    return {
        "id": rid, "sourceUrl": url, "lat": lat, "lon": lon,
        "name": tags.get("name") or default_name,
        "operator": tags.get("operator"),
        "openingHours": tags.get("opening_hours"),
        "website": tags.get("website") or tags.get("contact:website"),
        "address": address,
        "zone": zone(lat, lon),
    }


# Tipo di luogo dai tag OSM principali (chiave tradotta nell'interfaccia)
VENUE_KINDS = {
    "hotel": "hotel", "guest_house": "guestHouse", "hostel": "hostel", "apartment": "apartment",
    "camp_site": "campSite", "caravan_site": "campSite", "museum": "museum", "attraction": "attraction",
    "restaurant": "restaurant", "cafe": "cafe", "bar": "bar", "pub": "bar", "fast_food": "fastFood",
    "ice_cream": "iceCream", "library": "library", "university": "university", "college": "university",
    "school": "school", "townhall": "publicOffice", "community_centre": "publicOffice", "coworking_space": "coworking",
}


def has_wifi(tags: dict) -> bool:
    return tags.get("internet_access") == "wlan" or tags.get("wifi") in ("yes", "free")


def wifi_access(tags: dict) -> str:
    """Accesso dichiarato su OSM: free (gratuito), customers (solo clienti), paid (a pagamento) o unknown."""
    fee = (tags.get("internet_access:fee") or "").lower()
    if fee == "no" or tags.get("wifi") == "free":
        return "free"
    if fee == "customers":
        return "customers"
    if fee == "yes":
        return "paid"
    return "unknown"


def venue_kind(tags: dict) -> str:
    for key in ("tourism", "amenity", "office", "shop"):
        if tags.get(key) in VENUE_KINDS:
            return VENUE_KINDS[tags[key]]
    if tags.get("shop"):
        return "shop"
    return "other"


def wifi_venue(el, tags, lat, lon):
    rid, url = osm_ref(el)
    street = tags.get("addr:street")
    address = f"{street} {tags.get('addr:housenumber', '')}".strip() if street else None
    return {
        "id": rid, "sourceUrl": url, "lat": lat, "lon": lon,
        "name": tags.get("name") or tags.get("brand"),
        "kind": venue_kind(tags),
        "access": wifi_access(tags),
        # Nome della rete solo se mappato su OSM; le password non vengono mai salvate
        "ssid": tags.get("internet_access:ssid"),
        "address": address,
        "website": tags.get("website") or tags.get("contact:website"),
        "zone": zone(lat, lon),
    }


SPORT_KINDS = {
    "pitch": "pitch", "sports_centre": "sportsCentre", "fitness_station": "fitness",
    "track": "track", "stadium": "stadium", "sports_hall": "hall",
}


def sport_access(tags: dict) -> str:
    """Accesso dichiarato: public, customers, private o unknown (i patronati non sono distinguibili su OSM)."""
    a = (tags.get("access") or "").lower()
    if a in ("yes", "permissive", "public"):
        return "public"
    if a in ("customers", "permit", "members"):
        return "customers"
    if a in ("private", "no"):
        return "private"
    return "unknown"


def sport_place(el, tags, lat, lon):
    rid, url = osm_ref(el)
    sports = [s.strip() for s in (tags.get("sport") or "").split(";") if s.strip()]
    return {
        "id": rid, "sourceUrl": url, "lat": lat, "lon": lon,
        "name": tags.get("name"),
        "kind": SPORT_KINDS.get(tags.get("leisure", ""), "pitch"),
        "sports": sports,
        "access": sport_access(tags),
        "surface": tags.get("surface"),
        "lit": tags.get("lit") == "yes" if tags.get("lit") in ("yes", "no") else None,
        "operator": tags.get("operator"),
        "openingHours": tags.get("opening_hours"),
        "zone": zone(lat, lon),
    }


def nautical_kind(tags: dict) -> str | None:
    """Tipo nautico con precedenza: marina, carburante, scivolo, cantiere, noleggio, ormeggio."""
    if tags.get("leisure") == "marina":
        return "marina"
    if tags.get("waterway") == "fuel" or (tags.get("amenity") == "fuel" and tags.get("boat") == "yes"):
        return "fuel"
    if tags.get("leisure") == "slipway":
        return "slipway"
    if tags.get("waterway") == "boatyard":
        return "boatyard"
    if tags.get("amenity") == "boat_rental":
        return "rental"
    if tags.get("mooring"):
        return "mooring"
    return None


def mooring_access(value: str | None) -> str | None:
    """Accesso all'ormeggio: allowed, guest, private, commercial, permit, no (altri valori: tipo di ormeggio)."""
    v = (value or "").lower()
    if not v:
        return None
    if v in ("yes", "public"):
        return "allowed"
    if v in ("guest", "visitor"):
        return "guest"
    if v in ("private", "commercial", "permit", "no"):
        return v
    return "allowed" if v in ("pier", "pile", "ring", "bollard") else None


def nautical(el, tags, lat, lon, kind):
    rid, url = osm_ref(el)
    return {
        "id": rid, "sourceUrl": url, "lat": lat, "lon": lon,
        "kind": kind,
        "name": tags.get("name"),
        "access": mooring_access(tags.get("mooring")) if kind == "mooring" else None,
        "capacity": to_int(tags.get("capacity")),
        "operator": tags.get("operator"),
        "openingHours": tags.get("opening_hours"),
        "website": tags.get("website") or tags.get("contact:website"),
        "zone": zone(lat, lon),
    }


def main() -> int:
    try:
        payload = overpass(QUERY)
    except Exception as e:
        logging.error("%s", e)
        return 1

    out = {"evCharging": [], "parkings": [], "wells": [], "monumentalTrees": [], "recyclingCentres": [], "libraries": [], "wifiVenues": [], "sportPlaces": [], "nautical": []}
    seen = set()
    for el in payload.get("elements", []):
        tags = el.get("tags", {})
        c = coords(el)
        if not c or (el["type"], el["id"]) in seen:
            continue
        seen.add((el["type"], el["id"]))
        lat, lon = c
        # Il Wi-Fi è un attributo: un luogo può essere anche biblioteca, ecc.
        if has_wifi(tags) and tags.get("internet_access") != "no":
            out["wifiVenues"].append(wifi_venue(el, tags, lat, lon))
        nk = nautical_kind(tags)
        if nk:
            out["nautical"].append(nautical(el, tags, lat, lon, nk))
        if tags.get("leisure") in SPORT_KINDS:
            out["sportPlaces"].append(sport_place(el, tags, lat, lon))
        if tags.get("amenity") == "charging_station":
            out["evCharging"].append(ev(el, tags, lat, lon))
        elif tags.get("amenity") == "parking":
            cap = to_int(tags.get("capacity"))
            if cap is not None and cap >= MIN_PARKING_CAPACITY:
                out["parkings"].append(parking(el, tags, lat, lon))
        elif tags.get("man_made") == "water_well":
            out["wells"].append(well(el, tags, lat, lon))
        elif tags.get("natural") == "tree":
            out["monumentalTrees"].append(tree(el, tags, lat, lon))
        elif tags.get("amenity") in ("recycling", "waste_transfer_station"):
            out["recyclingCentres"].append(civic(el, tags, lat, lon, "Ecocentro"))
        elif tags.get("amenity") == "library":
            out["libraries"].append(civic(el, tags, lat, lon, "Biblioteca"))

    for items in out.values():
        items.sort(key=lambda x: x["id"])
    doc = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "OpenStreetMap (Overpass API)",
        "license": "ODbL 1.0",
        "attribution": "© OpenStreetMap contributors",
        "counts": {k: len(v) for k, v in out.items()},
        **out,
    }
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
        f.write("\n")
    logging.info("POI OSM salvati: %s", doc["counts"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
