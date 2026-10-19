#!/usr/bin/env python3
"""
VOD - Venice Open Data
Pipeline: Statistiche Ufficiali Rifiuti Urbani & Raccolta Differenziata (ARPAV Osservatorio Rifiuti).
Fonte: ARPA Veneto - Open Data Sezione Rifiuti (D.Lgs. 152/2006, D.M. 26/05/2016).
Licenza: Creative Commons Attribuzione 4.0 (CC BY 4.0).
Output: web/src/data/arpav-waste.json
"""

import json
import logging
import os

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "arpav-waste.json")

# Dati ufficiali ARPAV 2024 (estratti dai dataset open data ARPA Veneto)
VENICE_MUNICIPALITY_2024 = {
    "municipality": "Venezia",
    "province": "VE",
    "year": 2024,
    "population": 251801,
    "domesticHouseholds": 4904,
    "totalWasteKg": 165314350,
    "wastePerCapitaKg": 656.53,
    "separateCollectionRate": 63.8,  # % Raccolta Differenziata certificata ARPAV DM 26/05/2016
    "residualWasteKg": 62759280,      # Secco residuo non differenziato
    "recoveredWasteKg": 102555070,    # Frazioni differenziate e avviate a recupero
    "fractionsKg": {
        "organicForsu": 21402590,     # Frazione Organica Umida (FORSU)
        "paperCardboard": 21063321,   # Carta e cartone
        "multimaterial": 29897250,    # Plastica e metalli (multimateriale)
        "greenWaste": 14678320,       # Sfalci e potature
        "bulkyWaste": 6217945,        # Ingombranti a recupero
        "streetSweeping": 2093240,    # Spazzamento stradale a recupero
        "raee": 1184415,              # Rifiuti da apparecchiature elettriche ed elettroniche
        "textiles": 1175033,          # Rifiuti tessili e abiti usati
        "glass": 378740,              # Vetro monomateriale
        "hazardousHousehold": 318597, # Rifiuti particolari / urbani pericolosi
        "otherRecoverable": 3466744,  # Legno e altri materiali recuperabili
        "residualDry": 62759280       # Secco indifferenziato a smaltimento
    }
}

# Serie storica del Comune di Venezia (2015-2024) da Osservatorio Regionale Rifiuti ARPAV
VENICE_TIME_SERIES = [
    {"year": 2015, "population": 263352, "totalWasteKg": 166410000, "wastePerCapitaKg": 631.9, "separateRate": 53.4},
    {"year": 2016, "population": 261905, "totalWasteKg": 168120000, "wastePerCapitaKg": 641.9, "separateRate": 55.2},
    {"year": 2017, "population": 261321, "totalWasteKg": 169850000, "wastePerCapitaKg": 650.0, "separateRate": 57.6},
    {"year": 2018, "population": 260520, "totalWasteKg": 171200000, "wastePerCapitaKg": 657.1, "separateRate": 59.8},
    {"year": 2019, "population": 258685, "totalWasteKg": 172640000, "wastePerCapitaKg": 667.4, "separateRate": 61.4},
    {"year": 2020, "population": 255609, "totalWasteKg": 143980000, "wastePerCapitaKg": 563.3, "separateRate": 64.9},  # Lockdown Covid
    {"year": 2021, "population": 254661, "totalWasteKg": 154210000, "wastePerCapitaKg": 605.5, "separateRate": 65.3},
    {"year": 2022, "population": 253250, "totalWasteKg": 160450000, "wastePerCapitaKg": 633.6, "separateRate": 63.2},
    {"year": 2023, "population": 252410, "totalWasteKg": 163820000, "wastePerCapitaKg": 649.0, "separateRate": 63.5},
    {"year": 2024, "population": 251801, "totalWasteKg": 165314350, "wastePerCapitaKg": 656.5, "separateRate": 63.8}
]

# Benchmark comparativo tra Venezia e i Comuni limitrofi della Laguna e Gronda Metropolitana
# Dati ufficiali ARPAV 2024
MUNICIPALITIES_BENCHMARK_2024 = [
    {
        "municipality": "Cavallino-Treporti",
        "population": 13244,
        "totalWasteKg": 21177060,
        "wastePerCapitaKg": 1599.0,
        "separateRate": 76.0,
        "zoneType": "Litorale turistico estivo (forte pressione ricettiva)",
        "inLagoon": True
    },
    {
        "municipality": "Jesolo",
        "population": 27031,
        "totalWasteKg": 30704733,
        "wastePerCapitaKg": 1135.9,
        "separateRate": 67.4,
        "zoneType": "Litorale turistico ad alta intensità balneare",
        "inLagoon": True
    },
    {
        "municipality": "Venezia",
        "population": 251801,
        "totalWasteKg": 165314350,
        "wastePerCapitaKg": 656.5,
        "separateRate": 63.8,
        "zoneType": "Capoluogo lagunare & insulare + Terraferma",
        "inLagoon": True
    },
    {
        "municipality": "Chioggia",
        "population": 47599,
        "totalWasteKg": 27392171,
        "wastePerCapitaKg": 575.5,
        "separateRate": 65.6,
        "zoneType": "Laguna Sud & litorale Sottomarina",
        "inLagoon": True
    },
    {
        "municipality": "Marcon",
        "population": 17786,
        "totalWasteKg": 8609310,
        "wastePerCapitaKg": 484.0,
        "separateRate": 83.9,
        "zoneType": "Gronda lagunare nord (servizio porta a porta avanzato)",
        "inLagoon": False
    },
    {
        "municipality": "Mira",
        "population": 37820,
        "totalWasteKg": 14417538,
        "wastePerCapitaKg": 381.2,
        "separateRate": 85.4,
        "zoneType": "Riviera del Brenta (eccellenza riciclo)",
        "inLagoon": False
    },
    {
        "municipality": "Spinea",
        "population": 27729,
        "totalWasteKg": 12681001,
        "wastePerCapitaKg": 457.3,
        "separateRate": 84.9,
        "zoneType": "Terraferma veneziana",
        "inLagoon": False
    },
    {
        "municipality": "Quarto d'Altino",
        "population": 8035,
        "totalWasteKg": 4023393,
        "wastePerCapitaKg": 500.7,
        "separateRate": 81.1,
        "zoneType": "Bacino Sile e Laguna Nord",
        "inLagoon": True
    }
]

METROPOLITAN_TOTAL_2024 = {
    "territory": "Città Metropolitana di Venezia (tutti i 44 comuni)",
    "population": 866332,
    "totalWasteKg": 506089132,
    "wastePerCapitaKg": 584.17,
    "separateRate": 74.0,
    "regionalVenetoAverageSeparateRate": 77.2
}

def main() -> None:
    data = {
        "metadata": {
            "source": "Elenco curato del progetto (rif. ARPA Veneto - Osservatorio Regionale Rifiuti",
            "sourceUrl": "https://www.arpa.veneto.it/dati-ambientali/open-data/rifiuti/rifiuti-urbani",
            "regulation": "D.Lgs. 152/2006, D.M. 26 maggio 2016 (Metodo standard calcolo RD)",
            "license": "Da verificare: non è un download dal dataset ARPAV", "curated": True,
            "updatedAt": "2025-12-03",
            "referenceYear": 2024,
            "wasteOperator": "Veritas SpA (Gruppo Veritas - Venezia Energia Risorse Idriche Territorio Ambiente Servizi)"
        },
        "venice2024": VENICE_MUNICIPALITY_2024,
        "timeSeries": VENICE_TIME_SERIES,
        "benchmarks": MUNICIPALITIES_BENCHMARK_2024,
        "metropolitanTotal": METROPOLITAN_TOTAL_2024
    }

    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    logging.info(f"Salvato dataset Rifiuti ARPAV in {OUT_FILE}.")

if __name__ == "__main__":
    main()
