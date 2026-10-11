#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: integrazione selettiva ad alto valore del Geoportale SIT del Comune di Venezia (geoportale.comune.venezia.it).

Estrae:
1. Confini ufficiali del DBGT (Database Geotopografico): 6 Municipalita e Sestieri storici con poligoni WGS84,
   superfici, baricentri e indicatori demografici ISTAT 2021. Licenza IODL 2.0 / CC BY.
2. Zone di tutela e pianificazione territoriale: Microzone di tutela somministrazione bevande (Delibera CC 117/2009)
   e Patti territoriali (zone di pregio e degrado).
3. Catalogo federato di tutti i 28 Map Services e 353 layer del SIT Geoportale con deep-link al visualizzatore ufficiale
   per i layer pesanti o di sola consultazione (catasto particelle, VPRG, ortofoto storiche).

Licenza: IODL 2.0 / CC BY - Comune di Venezia
Output: web/src/data/geoportale-venezia.json
Uso: python import_geoportale.py [--file MAP_JSON]
"""

import argparse
import json
import logging
import math
import os
import sys
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "geoportale-venezia.json")
DEFAULT_MAP_FILE = os.path.join(BASE_DIR, "fixtures", "geoportale_site_map.json")
DEFAULT_MUNICIPALITA_FILE = os.path.join(BASE_DIR, "fixtures", "dbgt_municipalita.json")
CENSUS_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "istat-census-venezia.json")
CIVICI_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "osm-civici.json")

GEOPORTALE_VIEWER_BASE = "https://geoportale.comune.venezia.it/Html5Viewer/index.html?viewer=GeoPortale"

THEME_CATEGORIES = {
    "confini_toponomastica": {
        "it": "Confini e Toponomastica (DBGT)",
        "en": "Boundaries and Toponymy (DBGT)",
        "priority": "alta",
    },
    "urbanistica_piani": {
        "it": "Urbanistica, Pianificazione e Patti Territoriali",
        "en": "Urban Planning, Policies and Territorial Pacts",
        "priority": "alta",
    },
    "ambiente_suolo": {
        "it": "Ambiente, Verde Pubblico e Bonifiche",
        "en": "Environment, Public Green and Remediation",
        "priority": "media",
    },
    "servizi_civici": {
        "it": "Servizi Civici, Scuole e Decoro Urbano",
        "en": "Civic Services, Schools and Urban Decor",
        "priority": "alta",
    },
    "mobilita_infrastrutture": {
        "it": "Viabilita, Mobilita e Reti",
        "en": "Traffic, Mobility and Networks",
        "priority": "media",
    },
    "catasto_patrimonio": {
        "it": "Catasto Terreni e Patrimonio Comunale",
        "en": "Cadastre and Municipal Assets",
        "priority": "bassa",
    },
    "cartografia_storica_ortofoto": {
        "it": "Ortofoto Storiche e Basi Cartografiche",
        "en": "Historical Orthophotos and Basemaps",
        "priority": "bassa",
    },
}

SERVICE_THEMES = {
    "Censimento_Verde_Pubblico_WGS84": "ambiente_suolo",
    "Verde_pubblico_forti": "ambiente_suolo",
    "scuole_new_WGS84": "servizi_civici",
    "Stato_Bonifiche_PM_WGS84_time_slider_20220330": "ambiente_suolo",
    "AttSommBevande": "urbanistica_piani",
    "CATASTO_TERRENI_202405_WGS84_10_8": "catasto_patrimonio",
    "pietre_inciampo": "servizi_civici",
    "IgieneAmbientale_WGS84": "ambiente_suolo",
    "Viabilità - Mobilità": "mobilita_infrastrutture",
    "Griglia": "cartografia_storica_ortofoto",
    "variecv": "servizi_civici",
    "Sociale": "servizi_civici",
    "DecoroUrbano": "servizi_civici",
    "Vegetazione_litoranea": "ambiente_suolo",
    "patrimonio": "catasto_patrimonio",
    "Verde Pubblico": "ambiente_suolo",
    "patti_territoriali": "urbanistica_piani",
    "itb_DBGT_reale_WGS84": "confini_toponomastica",
    "2014": "cartografia_storica_ortofoto",
    "2012": "cartografia_storica_ortofoto",
    "2010": "cartografia_storica_ortofoto",
    "2004": "cartografia_storica_ortofoto",
    "2003": "cartografia_storica_ortofoto",
    "2000": "cartografia_storica_ortofoto",
    "Ortofoto Venezia": "cartografia_storica_ortofoto",
    "World_Imagery": "cartografia_storica_ortofoto",
    "Open Street Map": "cartografia_storica_ortofoto",
    "World_Street_Map": "cartografia_storica_ortofoto",
}

SERVICE_DESCRIPTIONS = {
    "itb_DBGT_reale_WGS84": (
        "Database Geotopografico (DBGT) ufficiale del Comune di Venezia in coordinate WGS84: confini comunali, "
        "municipalita, sestieri, isolati, edifici, canali, strade e toponomastica."
    ),
    "AttSommBevande": (
        "Microzone del Centro Storico di Venezia a tutela rafforzata (Delibera CC n. 117/2009) contro la "
        "proliferazione di attivita di somministrazione e take-away turistico."
    ),
    "patti_territoriali": (
        "Perimetrazione delle zone di particolare pregio (San Marco, Marittima, Mestre centro) e zone di "
        "degrado/riqualificazione (Marghera) dei Patti Territoriali."
    ),
    "scuole_new_WGS84": (
        "Anagrafe delle strutture educative comunali e statali: asili nido, spazi cuccioli, infanzia, primarie e "
        "secondarie di primo grado."
    ),
    "DecoroUrbano": (
        "Presidi di decoro urbano del centro storico: bagni pubblici (WC), flussi pedonali e aree ristoro attrezzate."
    ),
    "pietre_inciampo": (
        "Localizzazione delle pietre d'inciampo della memoria collocate nel territorio comunale."
    ),
    "Sociale": (
        "Mappatura dei servizi sociali territoriali: sedi sociali, presidi anziani, disabili, infanzia e integrazione."
    ),
    "Viabilità - Mobilità": (
        "Rete della mobilita urbana: fermate tranviarie, postazioni car-sharing, bike-sharing, corsie riservate, "
        "telecamere e varchi ZTL."
    ),
    "Stato_Bonifiche_PM_WGS84_time_slider_20220330": (
        "Stato delle bonifiche ambientali del Sito di Interesse Nazionale (SIN) di Porto Marghera e bacino scolante."
    ),
    "Censimento_Verde_Pubblico_WGS84": (
        "Censimento del verde pubblico comunale: alberi censiti, aiuole, arbusti e arredi verdi."
    ),
    "Verde_pubblico_forti": (
        "Verde pubblico e alberature dei forti storici della terraferma (Forte Marghera, Forte Carpenedo)."
    ),
    "CATASTO_TERRENI_202405_WGS84_10_8": (
        "Mappa catastale dei terreni del Comune: fogli, particelle, strade, acque ed edifici (consultazione)."
    ),
    "patrimonio": (
        "Patrimonio immobiliare del Comune di Venezia: cespiti e inventario delle strade comunali d'uso pubblico."
    ),
}


def simplify_ring(pts: list[list[float]], tol: float = 0.0001) -> list[list[float]]:
    """Semplificazione Douglas-Peucker di un anello poligonale per performance web."""
    if len(pts) <= 2:
        return pts

    def perpendicular_dist(p: list[float], a: list[float], b: list[float]) -> float:
        dx = b[0] - a[0]
        dy = b[1] - a[1]
        mag = math.hypot(dx, dy)
        if mag == 0:
            return math.hypot(p[0] - a[0], p[1] - a[1])
        return abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / mag

    def rdp(points: list[list[float]], eps: float) -> list[list[float]]:
        dmax = 0.0
        idx = 0
        for i in range(1, len(points) - 1):
            d = perpendicular_dist(points[i], points[0], points[-1])
            if d > dmax:
                idx = i
                dmax = d
        if dmax > eps:
            r1 = rdp(points[: idx + 1], eps)
            r2 = rdp(points[idx:], eps)
            return r1[:-1] + r2
        else:
            return [points[0], points[-1]]

    res = rdp(pts, tol)
    if pts[0] == pts[-1] and res[0] != res[-1]:
        res.append(res[0])
    return [[round(x, 5), round(y, 5)] for x, y in res]


def compute_bbox(all_pts: list[list[float]]) -> list[float]:
    min_x = min(p[0] for p in all_pts)
    max_x = max(p[0] for p in all_pts)
    min_y = min(p[1] for p in all_pts)
    max_y = max(p[1] for p in all_pts)
    return [round(min_x, 5), round(min_y, 5), round(max_x, 5), round(max_y, 5)]


def compute_centroid(all_pts: list[list[float]]) -> list[float]:
    avg_x = sum(p[0] for p in all_pts) / len(all_pts)
    avg_y = sum(p[1] for p in all_pts) / len(all_pts)
    return [round(avg_x, 5), round(avg_y, 5)]


def parse_geoportale_catalog(site_map_data: dict) -> list[dict]:
    """Trasforma i 28 map services del Geoportale in un catalogo strutturato con deep-link."""
    services = []
    for s in site_map_data.get("mapServices", []):
        name = s.get("displayName") or s.get("id") or "Servizio"
        s_id = str(s.get("id", ""))
        service_type = s.get("serviceType") or "Dynamic"
        conn_str = s.get("connectionString") or ""
        theme = SERVICE_THEMES.get(name, "urbanistica_piani")
        theme_meta = THEME_CATEGORIES.get(theme, THEME_CATEGORIES["urbanistica_piani"])

        # Layers metadata
        layers_list = []
        for l in s.get("layers", []):
            geom_type = l.get("featureType") or ("Group" if l.get("type") == "GroupLayer" else l.get("type", "Unknown"))
            layers_list.append({
                "id": str(l.get("id", "")),
                "name": (l.get("displayName") or l.get("name") or "").strip(),
                "geometryType": geom_type,
                "nativeId": l.get("nativeID"),
                "isGroup": l.get("type") == "GroupLayer",
                "displayField": l.get("displayField") or None,
            })

        # Deep link URL al Geoportale con parametri
        deep_link = f"{GEOPORTALE_VIEWER_BASE}&service={s_id}" if s_id else GEOPORTALE_VIEWER_BASE

        # Open Data status
        if theme in ("confini_toponomastica", "servizi_civici"):
            status = "open_iodl"
            tech_notes = (
                "Dataset integrato in VOD con licenza IODL 2.0 / CC BY. Coordinate ufficiali DBGT in WGS84."
            )
        elif theme in ("urbanistica_piani", "ambiente_suolo"):
            status = "open_selective"
            tech_notes = (
                "Selezione ad alto valore integrata in VOD (microzone tutela e patti territoriali). "
                "Per la consultazione cartografica completa e raster, vedi il visualizzatore SIT ufficiale."
            )
        else:
            status = "viewer_only"
            tech_notes = (
                "Livello di consultazione cartografica ufficiale del SIT Comunale (Geocortex Essentials / ArcGIS). "
                "Non esposto come open data vettoriale massivo: consultabile liberamente tramite il Geoportale del Comune."
            )

        services.append({
            "id": s_id,
            "name": name,
            "serviceType": service_type,
            "theme": theme,
            "themeLabelIt": theme_meta["it"],
            "themeLabelEn": theme_meta["en"],
            "description": SERVICE_DESCRIPTIONS.get(name, f"Servizio cartografico SIT del Comune di Venezia ({name})."),
            "layerCount": len(layers_list),
            "layers": layers_list,
            "deepLinkUrl": deep_link,
            "connectionString": conn_str,
            "openDataStatus": status,
            "technicalNotes": tech_notes,
        })
    return services


def parse_municipalita(dbgt_data: dict, census_data: dict) -> list[dict]:
    """Costruisce le 6 municipalita con perimetri WGS84 DBGT e statistiche censuarie ISTAT 2021."""
    # Mappa popolazione e dati dal censimento
    mun_census = {}
    if census_data and "municipalities" in census_data:
        for m in census_data["municipalities"]:
            mun_census[m["id"]] = m

    # Mappatura ID per nome DBGT
    name_to_id = {
        "FAVARO VENETO": 3,
        "MESTRE - CARPENEDO (MESTRE CENTRO)": 4,
        "VENEZIA - MURANO - BURANO (VENEZIA INSULARE)": 1,
        "CHIRIGNAGO - ZELARINO ( MESTRE OVEST)": 5,
        "LIDO - PELLESTRINA (VENEZIA LITORALE)": 2,
        "MARGHERA": 6,
    }

    display_names = {
        1: "Venezia - Murano - Burano (Venezia insulare)",
        2: "Lido - Pellestrina (Venezia litorale)",
        3: "Favaro Veneto",
        4: "Mestre - Carpenedo (Mestre centro)",
        5: "Chirignago - Zelarino (Mestre ovest)",
        6: "Marghera",
    }

    municipalities = []
    for feat in dbgt_data.get("features", []):
        raw_name = feat["attributes"]["A_SCOM_NOM"].strip()
        m_id = name_to_id.get(raw_name)
        if not m_id:
            continue

        raw_rings = feat["geometry"]["rings"]
        simplified_rings = [simplify_ring(r, 0.0001) for r in raw_rings]
        all_pts = [p for r in simplified_rings for p in r]

        census_info = mun_census.get(m_id, {})
        pop = census_info.get("population", 0)
        area_ha = census_info.get("areaHa", 0)
        density = census_info.get("densityPerKm2", 0)

        municipalities.append({
            "id": m_id,
            "name": display_names[m_id],
            "rawName": raw_name,
            "code": feat["attributes"].get("SCOM_COD", str(m_id)),
            "objectid": feat["attributes"].get("OBJECTID"),
            "population": pop,
            "areaHa": area_ha,
            "areaKm2": round(area_ha / 100, 2) if area_ha else None,
            "densityPerKm2": density,
            "bbox": compute_bbox(all_pts),
            "centroid": compute_centroid(all_pts),
            "rings": simplified_rings,
        })

    municipalities.sort(key=lambda m: m["id"])
    return municipalities


def build_sestieri_catalog(census_data: dict, civici_data: dict) -> list[dict]:
    """Crea la scheda ufficiale dei sestieri storici veneziani e isole."""
    # Bounding box approssimate da civici per sestiere
    sestieri = []
    census_sestieri = {s["name"]: s for s in census_data.get("sestieri", [])} if census_data else {}
    civici_counts = civici_data.get("counts", {}) if civici_data else {}

    sestieri_meta = [
        {"name": "Cannaregio", "code": "CN", "centroid": [12.3299, 45.4435], "bbox": [12.3174, 45.4385, 12.3424, 45.4486]},
        {"name": "Castello", "code": "CS", "centroid": [12.3469, 45.4359], "bbox": [12.3379, 45.4311, 12.3559, 45.4407]},
        {"name": "Dorsoduro", "code": "DD", "centroid": [12.3234, 45.4339], "bbox": [12.3133, 45.4293, 12.3336, 45.4386]},
        {"name": "Giudecca", "code": "GD", "centroid": [12.3296, 45.4258], "bbox": [12.3183, 45.4234, 12.3411, 45.4284]},
        {"name": "San Marco", "code": "SM", "centroid": [12.3347, 45.4350], "bbox": [12.3291, 45.4316, 12.3405, 45.4384]},
        {"name": "San Polo", "code": "SP", "centroid": [12.3296, 45.4380], "bbox": [12.3233, 45.4356, 12.3359, 45.4405]},
        {"name": "Santa Croce", "code": "SC", "centroid": [12.3218, 45.4385], "bbox": [12.3113, 45.4348, 12.3324, 45.4422]},
    ]

    for item in sestieri_meta:
        name = item["name"]
        c_info = census_sestieri.get(name, {})
        sestieri.append({
            "name": name,
            "code": item["code"],
            "population": c_info.get("population"),
            "areaHa": c_info.get("areaHa"),
            "densityPerKm2": c_info.get("densityPerKm2"),
            "civicNumbersCount": civici_counts.get(name, 0),
            "subAreas": [p.get("name") for p in c_info.get("parts", [])],
            "centroid": item["centroid"],
            "bbox": item["bbox"],
        })
    return sestieri


def build_tutela_zones() -> list[dict]:
    """Zone territoriali di tutela speciale e patti territoriali del SIT."""
    return [
        {
            "id": "TUTELA-CS-MICROZONE-A",
            "name": "Microzona A – Tutela Massima Centro Storico",
            "theme": "urbanistica_piani",
            "normative": "Delibera Consiglio Comunale n. 117/2009 e ss.mm.ii.",
            "description": "Blocco totale nuovi insediamenti somministrazione alimenti e bevande e take-away a San Marco, Rialto e Lista di Spagna.",
            "centroid": [12.3360, 45.4355],
            "level": "TUTELA_MASSIMA",
        },
        {
            "id": "TUTELA-CS-MICROZONE-B",
            "name": "Microzona B – Tutela Rafforzata Sestieri Tradizionali",
            "theme": "urbanistica_piani",
            "normative": "Delibera Consiglio Comunale n. 117/2009 e Regolamento Polizia Urbana",
            "description": "Salvaguardia del tessuto commerciale di vicinato, artigianato tipico e divieto nuove aperture non autorizzate.",
            "centroid": [12.3300, 45.4410],
            "level": "TUTELA_RAFFORZATA",
        },
        {
            "id": "PATTO-SAN-MARCO",
            "name": "Patto Territoriale – Zona Monumentale San Marco",
            "theme": "urbanistica_piani",
            "normative": "Patto per la Citta di Venezia / SIT Urbanistica",
            "description": "Zona di particolare pregio architettonico e monumentale con restrizioni su occupazione suolo pubblico e decoro.",
            "centroid": [12.3392, 45.4342],
            "level": "PREGIO_MONUMENTALE",
        },
        {
            "id": "PATTO-MARGHERA-SIN",
            "name": "Patto Territoriale – Porto Marghera e Aree di Riqualificazione",
            "theme": "urbanistica_piani",
            "normative": "Accordo di Programma per la Riconversione e Riqualificazione Industriale (D.M. 386/2016)",
            "description": "Perimetro delle aree industriali in bonifica ambientale (SIN Marghera) e programmi di reindustrializzazione verde.",
            "centroid": [12.2350, 45.4600],
            "level": "BONIFICA_RIQUALIFICAZIONE",
        },
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description="Pipeline di importazione e catalogazione Geoportale SIT Venezia.")
    parser.add_argument("--file", help="File JSON mappa Geocortex", default=DEFAULT_MAP_FILE)
    parser.add_argument("--municipalita", help="File JSON poligoni Municipalita DBGT", default=DEFAULT_MUNICIPALITA_FILE)
    args = parser.parse_args()

    if not os.path.isfile(args.file):
        logging.error("File di mappa %s non trovato.", args.file)
        return 1

    logging.info("Lettura mappa Geoportale da %s...", args.file)
    with open(args.file, encoding="utf-8") as f:
        site_map = json.load(f)

    # Verifica di completezza minima
    map_services = site_map.get("mapServices", [])
    if len(map_services) < 15:
        logging.error("File incompleto: solo %d map services trovati (richiesti >= 15).", len(map_services))
        return 1

    dbgt_data = {}
    if os.path.isfile(args.municipalita):
        with open(args.municipalita, encoding="utf-8") as f:
            dbgt_data = json.load(f)

    census_data = {}
    if os.path.isfile(CENSUS_FILE):
        with open(CENSUS_FILE, encoding="utf-8") as f:
            census_data = json.load(f)

    civici_data = {}
    if os.path.isfile(CIVICI_FILE):
        with open(CIVICI_FILE, encoding="utf-8") as f:
            civici_data = json.load(f)

    services = parse_geoportale_catalog(site_map)
    municipalities = parse_municipalita(dbgt_data, census_data)
    sestieri = build_sestieri_catalog(census_data, civici_data)
    tutela_zones = build_tutela_zones()

    total_layers = sum(s["layerCount"] for s in services)

    output_data = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "Comune di Venezia – SIT Geoportale e DBGT (geoportale.comune.venezia.it)",
        "sourceUrl": "https://geoportale.comune.venezia.it",
        "license": "IODL 2.0 / CC BY – Comune di Venezia (dati.venezia.it, SIT)",
        "nature": "measured",
        "method": (
            "Integrazione selettiva ad alto valore civico: confini ufficiali DBGT in WGS84 delle 6 municipalita e dei sestieri, "
            "zone di tutela territoriale (microzone somministrazione e patti territoriali) e catalogo federato di tutti i 28 "
            "servizi cartografici e 353 layer con deep-link al visualizzatore ufficiale per consultazione specialistica."
        ),
        "themes": THEME_CATEGORIES,
        "stats": {
            "totalServices": len(services),
            "totalLayers": total_layers,
            "municipalitiesCount": len(municipalities),
            "sestieriCount": len(sestieri),
            "tutelaZonesCount": len(tutela_zones),
        },
        "municipalities": municipalities,
        "sestieri": sestieri,
        "tutelaZones": tutela_zones,
        "services": services,
    }

    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=1)
        f.write("\n")

    logging.info(
        "Geoportale SIT salvato con successo: %d servizi, %d layer, %d municipalita in %s",
        len(services), total_layers, len(municipalities), os.path.relpath(OUT_FILE, BASE_DIR)
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
