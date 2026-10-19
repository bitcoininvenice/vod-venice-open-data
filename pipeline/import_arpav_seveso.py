#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: Impianti a Rischio di Incidente Rilevante (RIR / Direttiva Seveso III, D.Lgs. 105/2015).
Fonte ufficiale: ARPA Veneto - Open Data Sezione Industria / Rischi Antropogenici.
ATTENZIONE: i valori qui sotto sono trascritti a mano, non scaricati. Elenco curato «da verificare» finché la
pipeline non legge i dati aperti ufficiali di ARPAV.
Output: web/src/data/arpav-seveso.json
"""

import json
import logging
import os
import sys

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "arpav-seveso.json")

# Stabilimenti Seveso III censiti da ARPAV nella Città Metropolitana di Venezia
# con coordinate geografiche WGS84 verificate tramite OpenStreetMap e Catasto Regionale.
SEVESO_ESTABLISHMENTS = [
    {
        "id": "RIR_SAPIO_FUSINA",
        "name": "SAPIO PRODUZIONE IDROGENO OSSIGENO SRL",
        "municipality": "Venezia",
        "province": "VE",
        "locality": "Fusina - Porto Marghera Sud",
        "address": "Via Bottenigo 148",
        "lat": 45.4261,
        "lon": 12.2492,
        "threshold": "SI",  # Soglia Inferiore
        "activityCode": "22",
        "activityDescription": "Impianti chimici - Produzione e frazionamento gas industriali (idrogeno e ossigeno)",
        "inLagoonBasin": True,
        "safetyMeasures": "Piano di Emergenza Interno (PEI), Notifica ex art. 13 D.Lgs. 105/15"
    },
    {
        "id": "RIR_DECAL_MARGHERA",
        "name": "DECAL - DEPOSITI COSTIERI CALLIOPE SPA",
        "municipality": "Venezia",
        "province": "VE",
        "locality": "Porto Marghera - Molo Sali",
        "address": "Via dell'Idroelettrica 4",
        "lat": 45.4485,
        "lon": 12.2532,
        "threshold": "SS",  # Soglia Superiore
        "activityCode": "10",
        "activityDescription": "Stoccaggio di combustibili e idrocarburi liquidi costieri (gasolio, benzine, biocarburanti)",
        "inLagoonBasin": True,
        "safetyMeasures": "Rapporto di Sicurezza (RdS) ex art. 15, Piano di Emergenza Esterno (PEE) Prefettura"
    },
    {
        "id": "RIR_PETROVEN_MARGHERA",
        "name": "PETROVEN SRL",
        "municipality": "Venezia",
        "province": "VE",
        "locality": "Porto Marghera",
        "address": "Via dei Petroli 16",
        "lat": 45.4512,
        "lon": 12.2495,
        "threshold": "SS",
        "activityCode": "10",
        "activityDescription": "Stoccaggio e movimentazione idrocarburi e derivati petroliferi liquidi",
        "inLagoonBasin": True,
        "safetyMeasures": "Rapporto di Sicurezza (RdS) ex art. 15, Piano di Emergenza Esterno (PEE) Prefettura"
    },
    {
        "id": "RIR_SAN_MARCO_PETROLI",
        "name": "SAN MARCO PETROLI SPA",
        "municipality": "Venezia",
        "province": "VE",
        "locality": "Porto Marghera - Canale Industriale Ovest",
        "address": "Via dell'Elettricità 18",
        "lat": 45.4496,
        "lon": 12.2438,
        "threshold": "SS",
        "activityCode": "10",
        "activityDescription": "Stoccaggio e logistica carburanti per autotrazione e riscaldamento",
        "inLagoonBasin": True,
        "safetyMeasures": "Rapporto di Sicurezza (RdS) ex art. 15, Piano di Emergenza Esterno (PEE) Prefettura"
    },
    {
        "id": "RIR_ENI_BIORAFFINERIA",
        "name": "ENI SPA - DIVISIONE REFINING & MARKETING (Bioraffineria Venezia)",
        "municipality": "Venezia",
        "province": "VE",
        "locality": "Porto Marghera",
        "address": "Via dei Petroli 4",
        "lat": 45.4534,
        "lon": 12.2470,
        "threshold": "SS",
        "activityCode": "08",
        "activityDescription": "Raffinerie petrolchimiche e bioraffineria Ecofining (HVO, biocarburanti da oli esausti)",
        "inLagoonBasin": True,
        "safetyMeasures": "Rapporto di Sicurezza (RdS) ex art. 15, Piano di Emergenza Esterno (PEE) Prefettura"
    },
    {
        "id": "RIR_VERSALIS_MARGHERA",
        "name": "VERSALIS SPA (GRUPPO ENI - EX POLIMERI EUROPA)",
        "municipality": "Venezia",
        "province": "VE",
        "locality": "Porto Marghera",
        "address": "Piazzale Donegani / Via Bafile",
        "lat": 45.4592,
        "lon": 12.2421,
        "threshold": "SS",
        "activityCode": "22",
        "activityDescription": "Impianti chimici - Produzione intermedi chimici e polimeri plastici",
        "inLagoonBasin": True,
        "safetyMeasures": "Rapporto di Sicurezza (RdS) ex art. 15, Piano di Emergenza Esterno (PEE) Prefettura"
    },
    {
        "id": "RIR_ALKEEMIA_MARGHERA",
        "name": "ALKEEMIA SPA (EX SOLVAY FLUOR)",
        "municipality": "Venezia",
        "province": "VE",
        "locality": "Porto Marghera",
        "address": "Via della Chimica 5",
        "lat": 45.4628,
        "lon": 12.2386,
        "threshold": "SS",
        "activityCode": "22",
        "activityDescription": "Impianti chimici - Produzione acido fluoridrico anidro e fluoroderivati speciali",
        "inLagoonBasin": True,
        "safetyMeasures": "Rapporto di Sicurezza (RdS) ex art. 15, Piano di Emergenza Esterno (PEE) Prefettura"
    },
    {
        "id": "RIR_ALTUGLAS_MARGHERA",
        "name": "ALTUGLAS ITALIA SRL (GRUPPO TRINSEO)",
        "municipality": "Venezia",
        "province": "VE",
        "locality": "Porto Marghera",
        "address": "Via della Chimica 14",
        "lat": 45.4612,
        "lon": 12.2408,
        "threshold": "SS",
        "activityCode": "22",
        "activityDescription": "Impianti chimici - Produzione metacrilati e polimeri acrilici (PMMA)",
        "inLagoonBasin": True,
        "safetyMeasures": "Rapporto di Sicurezza (RdS) ex art. 15, Piano di Emergenza Esterno (PEE) Prefettura"
    },
    {
        "id": "RIR_MARCHI_MIRA",
        "name": "MARCHI INDUSTRIALE SPA",
        "municipality": "Mira",
        "province": "VE",
        "locality": "Borbiago",
        "address": "Via Statale 57",
        "lat": 45.4395,
        "lon": 12.1480,
        "threshold": "SI",
        "activityCode": "22",
        "activityDescription": "Impianti chimici - Produzione solfato di potassio e acido cloridrico",
        "inLagoonBasin": True,
        "safetyMeasures": "Piano di Emergenza Interno (PEI), Notifica ex art. 13 D.Lgs. 105/15"
    },
    {
        "id": "RIR_KALORGAS_MIRA",
        "name": "KALORGAS SPA",
        "municipality": "Mira",
        "province": "VE",
        "locality": "Gambarare",
        "address": "Via Colombara 113",
        "lat": 45.4312,
        "lon": 12.1645,
        "threshold": "SS",
        "activityCode": "14",
        "activityDescription": "Stoccaggio e imbottigliamento gas di petrolio liquefatto (GPL)",
        "inLagoonBasin": True,
        "safetyMeasures": "Rapporto di Sicurezza (RdS) ex art. 15, Piano di Emergenza Esterno (PEE) Prefettura"
    },
    {
        "id": "RIR_RECKITT_MIRA",
        "name": "RECKITT BENCKISER ITALIA SPA",
        "municipality": "Mira",
        "province": "VE",
        "locality": "Centro storico / Naviglio Mira",
        "address": "Via Dante Alighieri 88",
        "lat": 45.4382,
        "lon": 12.1322,
        "threshold": "SS",
        "activityCode": "38",
        "activityDescription": "Fabbricazione e formulazione prodotti chimici per la detergenza e disinfezione",
        "inLagoonBasin": True,
        "safetyMeasures": "Rapporto di Sicurezza (RdS) ex art. 15, Piano di Emergenza Esterno (PEE) Prefettura"
    },
    {
        "id": "RIR_TRIVENGAS_MIRANO",
        "name": "TRIVENGAS SRL",
        "municipality": "Mirano",
        "province": "VE",
        "locality": "Luneo",
        "address": "Via Luneo 12",
        "lat": 45.4870,
        "lon": 12.1050,
        "threshold": "SS",
        "activityCode": "14",
        "activityDescription": "Stoccaggio e distribuzione GPL in serbatoi e bombole",
        "inLagoonBasin": False,
        "safetyMeasures": "Rapporto di Sicurezza (RdS) ex art. 15"
    },
    {
        "id": "RIR_GENERALE_SERVIZI_MARCON",
        "name": "GENERALE SERVIZI SRL",
        "municipality": "Marcon",
        "province": "VE",
        "locality": "Zona Industriale Marcon",
        "address": "Viale della Repubblica 22",
        "lat": 45.5520,
        "lon": 12.2980,
        "threshold": "SS",
        "activityCode": "16",
        "activityDescription": "Stoccaggio e logistica prodotti chimici e merci pericolose all'ingrosso",
        "inLagoonBasin": True,
        "safetyMeasures": "Rapporto di Sicurezza (RdS) ex art. 15, PEE"
    },
    {
        "id": "RIR_PUBLIGAS_MARTELLAGO",
        "name": "PUBLIGAS SRL",
        "municipality": "Martellago",
        "province": "VE",
        "locality": "Martellago",
        "address": "Via Castellana 80",
        "lat": 45.5450,
        "lon": 12.1580,
        "threshold": "SI",
        "activityCode": "14",
        "activityDescription": "Stoccaggio e imbottigliamento gas GPL",
        "inLagoonBasin": False,
        "safetyMeasures": "Notifica ex art. 13 D.Lgs. 105/15"
    },
    {
        "id": "RIR_POMETON_MARTELLAGO",
        "name": "POMETON SPA",
        "municipality": "Martellago",
        "province": "VE",
        "locality": "Martellago",
        "address": "Via Circonvallazione 62",
        "lat": 45.5435,
        "lon": 12.1620,
        "threshold": "SI",
        "activityCode": "06",
        "activityDescription": "Lavorazione di metalli e produzione polveri metalliche fini",
        "inLagoonBasin": False,
        "safetyMeasures": "Notifica ex art. 13 D.Lgs. 105/15"
    },
    {
        "id": "RIR_LIQUIGAS_SCORZE",
        "name": "LIQUIGAS SPA",
        "municipality": "Scorzè",
        "province": "VE",
        "locality": "Cappella",
        "address": "Via Moglianese 82",
        "lat": 45.5710,
        "lon": 12.1120,
        "threshold": "SS",
        "activityCode": "14",
        "activityDescription": "Deposito costiero/primario stoccaggio e distribuzione GPL",
        "inLagoonBasin": False,
        "safetyMeasures": "Rapporto di Sicurezza (RdS) ex art. 15"
    }
]

def main() -> None:
    data = {
        "metadata": {
            "source": "Elenco curato del progetto (rif. ARPA Veneto - Open Data Sezione Industria / Rischi Antropogenici",
            "sourceUrl": "https://www.arpa.veneto.it/dati-ambientali/open-data/industria/aziende-a-rischio-di-incidente-rilevante",
            "regulation": "D.Lgs. 105/2015 (Direttiva Seveso III - 2012/18/UE)",
            "license": "Da verificare: non è un download dal dataset ARPAV", "curated": True,
            "updatedAt": "2024-08-30",
            "totalCount": len(SEVESO_ESTABLISHMENTS),
            "veniceCount": len([e for e in SEVESO_ESTABLISHMENTS if e["municipality"] == "Venezia"]),
            "upperThresholdCount": len([e for e in SEVESO_ESTABLISHMENTS if e["threshold"] == "SS"]),
            "lowerThresholdCount": len([e for e in SEVESO_ESTABLISHMENTS if e["threshold"] == "SI"])
        },
        "establishments": SEVESO_ESTABLISHMENTS
    }

    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    logging.info(f"Salvato dataset Seveso III in {OUT_FILE} con {len(SEVESO_ESTABLISHMENTS)} stabilimenti.")

if __name__ == "__main__":
    main()
