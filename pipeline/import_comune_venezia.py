#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: carica nel database i dataset di riferimento (cantieri, occupazioni suolo, POI).

Le opere pubbliche provengono dal dataset ufficiale (import_opere_pubbliche.py, eseguito prima).
Occupazioni di suolo pubblico e POI sono ancora esempi statici, non dati del Comune.
"""

import json
import os
import sys
import logging
import psycopg2

from vod_common import connect
from psycopg2.extras import execute_values

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


# Opere pubbliche reali: prodotte da import_opere_pubbliche.py (Elenco Annuale dei Lavori, CC BY)
OPERE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "web", "src", "data", "opere-pubbliche.json")


def load_opere() -> list[dict]:
    with open(OPERE_FILE, encoding="utf-8") as f:
        return [w for w in json.load(f)["works"] if w["lat"] is not None and w["lon"] is not None]


# ATTENZIONE: occupazioni di suolo pubblico e POI qui sotto sono esempi statici, non dati del Comune.
OCCUPAZIONI_DATA = [
    {
        "protocollo": "OCC-2026-8812",
        "richiedente": "EdilLaguna Restauri S.r.l.",
        "motivo": "Ponteggio cantiere facciata palazzo storico",
        "data_inizio": "2026-05-10", "data_fine": "2026-11-30",
        "superficie_mq": 45.0,
        "canale_o_via": "Fondamenta Zattere ai Gesuati",
        "lon": 12.3270, "lat": 45.4294
    },
    {
        "protocollo": "OCC-2026-9041",
        "richiedente": "Venezia Eventi & Cultura",
        "motivo": "Allestimento temporaneo Biennale Arte",
        "data_inizio": "2026-04-20", "data_fine": "2026-11-25",
        "superficie_mq": 120.0,
        "canale_o_via": "Riva dei Sette Martiri",
        "lon": 12.3550, "lat": 45.4305
    },
    {
        "protocollo": "OCC-2026-9210",
        "richiedente": "Infrastrutture Idriche Venete",
        "motivo": "Scavo pozzetto ispezione fognaria",
        "data_inizio": "2026-10-01", "data_fine": "2026-10-20",
        "superficie_mq": 18.0,
        "canale_o_via": "Campo San Polo",
        "lon": 12.3305, "lat": 45.4372
    }
]

POI_DATA = [
    {"nome": "Venezia Santa Lucia (Stazione Ferroviaria)", "categoria": "Stazione Ferroviaria", "descrizione": "Principale hub ferroviario di accesso al centro storico lagunare.", "lon": 12.3210, "lat": 45.4411},
    {"nome": "Piazzale Roma (Terminal Bus & Tram)", "categoria": "Terminal Bus", "descrizione": "Capolinea automobilistico e tranviario tra terraferma e Venezia centro.", "lon": 12.3182, "lat": 45.4378},
    {"nome": "Tronchetto (Isola Parcheggi & Ferry)", "categoria": "Parcheggio Scambiatore", "descrizione": "Terminal traghetti auto per il Lido e parcheggio multipiano.", "lon": 12.3050, "lat": 45.4420},
    {"nome": "San Marco (Molo & Vallaresso)", "categoria": "Pontile Principale", "descrizione": "Cuore monumentale di Venezia e principale snodo turistico navigazione.", "lon": 12.3392, "lat": 45.4328},
    {"nome": "Fondamente Nove (Hub Laguna Nord)", "categoria": "Pontile Principale", "descrizione": "Snodo d'imbarco per Murano, Burano, Torcello, Sant'Erasmo e Aeroporto.", "lon": 12.3421, "lat": 45.4450},
    {"nome": "Lido Santa Maria Elisabetta", "categoria": "Pontile Principale", "descrizione": "Interscambio principale tra motonavi/vaporetti e rete bus del Lido.", "lon": 12.3688, "lat": 45.4170},
    {"nome": "Punta Sabbioni (Porta del Litorale)", "categoria": "Pontile Principale", "descrizione": "Hub di collegamento via acqua con Jesolo e Cavallino-Treporti.", "lon": 12.4240, "lat": 45.4460},
    {"nome": "Aeroporto Marco Polo (Darsena TPL)", "categoria": "Hub Aeroportuale", "descrizione": "Darsena di collegamento linea Alilaguna e motoscafi con la laguna.", "lon": 12.3480, "lat": 45.5020}
]

def main():
    conn = connect()
    cur = conn.cursor()

    # 1. Cantieri
    cantieri_vals = []
    for c in load_opere():
        cantieri_vals.append((
            c["codice"], c["titolo"][:255], c["localizzazione"][:255], c["quartiere"][:100],
            c["tipologia"][:100] or "n.d.", c["stato"][:50], c["importoLavori"], c["enteResponsabile"][:150],
            c["categoria"][:100], c["cup"], (c["provvedimento"] or "")[:100] or None,
            f"SRID=4326;POINT({float(c['lon'])} {float(c['lat'])})",
        ))

    execute_values(
        cur,
        """INSERT INTO comune_cantieri (codice, titolo, localizzazione, quartiere, tipologia, stato,
                                       importo_lavori, ente_responsabile, categoria, cup, provvedimento, geom)
           VALUES %s
           ON CONFLICT (codice) DO UPDATE SET
             titolo = EXCLUDED.titolo, stato = EXCLUDED.stato, importo_lavori = EXCLUDED.importo_lavori,
             categoria = EXCLUDED.categoria, provvedimento = EXCLUDED.provvedimento, geom = EXCLUDED.geom""",
        cantieri_vals,
        template="(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, ST_GeomFromEWKT(%s))",
    )
    logging.info(f"Ingested {len(cantieri_vals)} cantieri e opere pubbliche.")

    # 2. Occupazioni Suolo
    occ_vals = []
    for o in OCCUPAZIONI_DATA:
        geom_wkt = f"SRID=4326;POINT({o['lon']} {o['lat']})"
        occ_vals.append((
            o["protocollo"], o["richiedente"], o["motivo"], o["data_inizio"],
            o["data_fine"], o["superficie_mq"], o["canale_o_via"], geom_wkt
        ))
    
    execute_values(
        cur,
        """INSERT INTO comune_occupazione_suolo (protocollo, richiedente, motivo, data_inizio, data_fine, 
                                                superficie_mq, canale_o_via, geom)
           VALUES %s
           ON CONFLICT (protocollo) DO UPDATE SET
             data_fine = EXCLUDED.data_fine,
             geom = EXCLUDED.geom""",
        occ_vals,
        template="(%s, %s, %s, %s, %s, %s, %s, ST_GeomFromEWKT(%s))"
    )
    logging.info(f"Ingested {len(occ_vals)} occupazioni di suolo pubblico.")

    # 3. POI
    cur.execute("TRUNCATE TABLE comune_punti_interesse RESTART IDENTITY;")
    poi_vals = []
    for p in POI_DATA:
        geom_wkt = f"SRID=4326;POINT({p['lon']} {p['lat']})"
        poi_vals.append((p["nome"], p["categoria"], p["descrizione"], geom_wkt))
    
    execute_values(
        cur,
        """INSERT INTO comune_punti_interesse (nome, categoria, descrizione, geom)
           VALUES %s""",
        poi_vals,
        template="(%s, %s, %s, ST_GeomFromEWKT(%s))"
    )
    logging.info(f"Ingested {len(poi_vals)} punti di interesse e hub intermodali.")

    conn.commit()
    cur.close()
    conn.close()
    logging.info("Comune di Venezia ingestion completed successfully!")

if __name__ == "__main__":
    main()
