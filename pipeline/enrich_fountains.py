#!/usr/bin/env python3
"""
VOD - Venice Open Data
Arricchimento toponomastico del dataset fontanelle potabili (fountains.json)
incrociando le coordinate OSM con il censimento storico di Conoscere Venezia (p=3231)
e i punti di interesse toponomastici (Campi, Fondamente, Calli, Corti, Parchi).
"""

import json
import math
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
NEAR_SITE_MAX_M = 150
FOUNTAINS_FILE = os.path.join(BASE_DIR, "..", "web", "src", "data", "fountains.json")

# Catalogo toponomastico storico veneziano (da Conoscere Venezia / Catasto Storico)
KNOWN_VENICE_SITES = [
    # CASTELLO
    ("Fondamenta Quintavalle", 45.4308, 12.3601, "Castello"),
    ("Campo San Pietro di Castello", 45.4344, 12.3598, "Castello"),
    ("Seco Marina", 45.4312, 12.3582, "Castello"),
    ("Corte de le Case Nove", 45.4320, 12.3565, "Castello"),
    ("Campiello de la Colomba", 45.4332, 12.3550, "Castello"),
    ("Giardini Pubblici (Viale Garibaldi)", 45.4315, 12.3560, "Castello"),
    ("Giardini della Biennale", 45.4285, 12.3595, "Castello"),
    ("Parco delle Rimembranze (Sant'Elena)", 45.4265, 12.3650, "Castello (Sant'Elena)"),
    ("Campo Piave (Sant'Elena)", 45.4282, 12.3645, "Castello (Sant'Elena)"),
    ("Darsena di Sant'Elena", 45.4290, 12.3670, "Castello (Sant'Elena)"),
    ("Campo Bandiera e Moro", 45.4348, 12.3485, "Castello"),
    ("Riva dei Sette Martiri", 45.4310, 12.3535, "Castello"),
    ("Riva degli Schiavoni (Pietà)", 45.4344, 12.3456, "Castello"),
    ("Campo San Zaccaria", 45.4348, 12.3430, "Castello"),
    ("Campo Santa Maria Formosa", 45.4372, 12.3415, "Castello"),
    ("Campo San Francesco della Vigna", 45.4385, 12.3495, "Castello"),
    ("Campo San Giovanni in Bragora", 45.4350, 12.3480, "Castello"),
    ("Campo Arsenale", 45.4351, 12.3502, "Castello"),
    ("Campo San Lorenzo", 45.4368, 12.3465, "Castello"),
    ("Campo Santa Giustina", 45.4388, 12.3470, "Castello"),
    ("Campo Ruga", 45.4330, 12.3575, "Castello"),
    ("Campo Do Pozzi", 45.4345, 12.3530, "Castello"),
    ("Calle de le Furlane", 45.4360, 12.3490, "Castello"),
    ("Corte Bianco", 45.4325, 12.3580, "Castello"),
    ("Campo San Severo", 45.4362, 12.3435, "Castello"),
    ("Campo Santi Giovanni e Paolo", 45.4398, 12.3418, "Castello"),

    # CANNAREGIO
    ("Campo San Geremia", 45.4428, 12.3248, "Cannaregio"),
    ("Campo dei Gesuiti", 45.4435, 12.3385, "Cannaregio"),
    ("Fondamenta de la Misericordia", 45.4450, 12.3320, "Cannaregio"),
    ("Campo San Leonardo", 45.4429, 12.3275, "Cannaregio"),
    ("Campo San Marcuola", 45.4422, 12.3298, "Cannaregio"),
    ("Campo Sant'Alvise", 45.4485, 12.3285, "Cannaregio"),
    ("Campo de la Madonna de l'Orto", 45.4470, 12.3330, "Cannaregio"),
    ("Campo del Ghetto Nuovo", 45.4452, 12.3270, "Cannaregio"),
    ("Campiello de le Scuole (Ghetto)", 45.4442, 12.3262, "Cannaregio"),
    ("Campo San Giobbe", 45.4448, 12.3175, "Cannaregio"),
    ("Campo Santa Fosca", 45.4430, 12.3332, "Cannaregio"),
    ("Campo dei Mori", 45.4468, 12.3325, "Cannaregio"),
    ("Fondamenta dei Ormesini", 45.4455, 12.3280, "Cannaregio"),
    ("Campo San Felice", 45.4420, 12.3340, "Cannaregio"),
    ("Campiello Widmann", 45.4402, 12.3400, "Cannaregio"),
    ("Fondamenta San Girolamo", 45.4472, 12.3235, "Cannaregio"),
    ("Fondamente Nove (Imbarcadero)", 45.4438, 12.3410, "Cannaregio"),
    ("Rio Terà Farsetti", 45.4440, 12.3305, "Cannaregio"),
    ("Rio Terà San Leonardo", 45.4430, 12.3270, "Cannaregio"),
    ("Campiello de l'Anconeta", 45.4425, 12.3288, "Cannaregio"),

    # SAN MARCO
    ("Campo Santo Stefano", 45.4328, 12.3312, "San Marco"),
    ("Giardinetti Reali (San Marco)", 45.4332, 12.3380, "San Marco"),
    ("Campo San Maurizio", 45.4325, 12.3328, "San Marco"),
    ("Campo San Luca", 45.4358, 12.3355, "San Marco"),
    ("Campo Sant'Anzolo (Sant'Angelo)", 45.4345, 12.3330, "San Marco"),
    ("Campo San Beneto", 45.4355, 12.3320, "San Marco"),
    ("Campo Manin", 45.4352, 12.3348, "San Marco"),
    ("Piazzetta dei Leoncini", 45.4350, 12.3400, "San Marco"),
    ("Bacino Orseolo", 45.4345, 12.3375, "San Marco"),
    ("Campiello San Zulian", 45.4356, 12.3390, "San Marco"),

    # SAN POLO
    ("Campo San Polo", 45.4371, 12.3304, "San Polo"),
    ("Campo Sant'Aponal", 45.4370, 12.3335, "San Polo"),
    ("Campo San Tomà", 45.4358, 12.3285, "San Polo"),
    ("Campo dei Frari", 45.4368, 12.3265, "San Polo"),
    ("Campo San Rocco", 45.4365, 12.3250, "San Polo"),
    ("Campo San Stin", 45.4380, 12.3275, "San Polo"),
    ("Campo San Silvestro", 45.4375, 12.3348, "San Polo"),
    ("Campo delle Beccarie (Rialto)", 45.4390, 12.3345, "San Polo"),
    ("Erbaria a Rialto", 45.4392, 12.3360, "San Polo"),
    ("Campiello Albrizzi", 45.4365, 12.3310, "San Polo"),

    # SANTA CROCE
    ("Campo San Giacomo da l'Orio", 45.4402, 12.3268, "Santa Croce"),
    ("Piazzale Roma (Giardini Papadopoli)", 45.4390, 12.3195, "Santa Croce"),
    ("Campo San Zan Degolà", 45.4418, 12.3260, "Santa Croce"),
    ("Campo San Simeon Grando", 45.4410, 12.3235, "Santa Croce"),
    ("Campo Nazario Sauro", 45.4405, 12.3245, "Santa Croce"),
    ("Fondamenta Rio Marin", 45.4395, 12.3240, "Santa Croce"),
    ("Campo San Stae", 45.4412, 12.3300, "Santa Croce"),
    ("Riva de Biasio", 45.4420, 12.3240, "Santa Croce"),
    ("Campiello del Cristo", 45.4398, 12.3280, "Santa Croce"),

    # DORSODURO
    ("Campo Santa Margherita", 45.4338, 12.3235, "Dorsoduro"),
    ("Campo San Barnaba", 45.4332, 12.3255, "Dorsoduro"),
    ("Campo San Vio", 45.4312, 12.3340, "Dorsoduro"),
    ("Campo San Sebastiano", 45.4320, 12.3195, "Dorsoduro"),
    ("Campo San Trovaso", 45.4310, 12.3275, "Dorsoduro"),
    ("Campo dei Carmini", 45.4335, 12.3218, "Dorsoduro"),
    ("Campo Sant'Agnese", 45.4305, 12.3300, "Dorsoduro"),
    ("Fondamenta Zattere ai Gesuati", 45.4290, 12.3275, "Dorsoduro"),
    ("Fondamenta Zattere ai Saloni", 45.4295, 12.3345, "Dorsoduro"),
    ("Punta della Dogana", 45.4310, 12.3375, "Dorsoduro"),
    ("Campiello Barbaro", 45.4310, 12.3325, "Dorsoduro"),

    # GIUDECCA & SACCA FISOLA
    ("Giudecca Sant'Eufemia", 45.4265, 12.3258, "Giudecca & Sacca Fisola"),
    ("Giudecca Redentore (Campo)", 45.4248, 12.3325, "Giudecca & Sacca Fisola"),
    ("Giudecca Zitelle", 45.4260, 12.3420, "Giudecca & Sacca Fisola"),
    ("Giudecca Palanca", 45.4270, 12.3230, "Giudecca & Sacca Fisola"),
    ("Campo San Cosmo (Giudecca)", 45.4275, 12.3210, "Giudecca & Sacca Fisola"),
    ("Sacca Fisola (Campo della Chiesa)", 45.4278, 12.3150, "Giudecca & Sacca Fisola"),
    ("Sacca Fisola (Approdo)", 45.4285, 12.3135, "Giudecca & Sacca Fisola"),
    ("Giudecca Sant'Angelo", 45.4255, 12.3280, "Giudecca & Sacca Fisola"),

    # MURANO
    ("Campo San Donato (Murano)", 45.4575, 12.3555, "Murano"),
    ("Fondamenta dei Vetrai (Murano)", 45.4540, 12.3505, "Murano"),
    ("Fondamenta Venier (Murano)", 45.4555, 12.3485, "Murano"),
    ("Campo Santo Stefano (Murano)", 45.4550, 12.3530, "Murano"),
    ("Fondamenta Navagero (Murano)", 45.4565, 12.3590, "Murano"),
    ("Faro di Murano", 45.4520, 12.3565, "Murano"),
    ("Fondamenta Serenella (Murano)", 45.4590, 12.3460, "Murano"),

    # BURANO / MAZZORBO / TORCELLO
    ("Piazza Galuppi (Burano)", 45.4855, 12.4170, "Burano / Mazzorbo / Torcello"),
    ("Fondamenta di Cavanella (Burano)", 45.4865, 12.4150, "Burano / Mazzorbo / Torcello"),
    ("Fondamenta San Mauro (Burano)", 45.4845, 12.4180, "Burano / Mazzorbo / Torcello"),
    ("Mazzorbo (Santa Caterina)", 45.4880, 12.4120, "Burano / Mazzorbo / Torcello"),
    ("Piazza Torcello (Basilica)", 45.4980, 12.4190, "Burano / Mazzorbo / Torcello"),

    # LIDO DI VENEZIA
    ("Piazzale Santa Maria Elisabetta (Lido)", 45.4175, 12.3685, "Lido di Venezia"),
    ("Gran Viale Santa Maria Elisabetta (Lido)", 45.4155, 12.3730, "Lido di Venezia"),
    ("Piazzale Bucintoro (Lido)", 45.4140, 12.3780, "Lido di Venezia"),
    ("Lungomare d'Annunzio (Lido)", 45.4190, 12.3790, "Lido di Venezia"),
    ("Quattro Fontane (Lido)", 45.4050, 12.3660, "Lido di Venezia"),
    ("Malamocco (Piazza Maggiore)", 45.3720, 12.3380, "Lido di Venezia"),
    ("Alberoni (Piazza Stella Maris)", 45.3480, 12.3120, "Lido di Venezia"),
    ("San Nicolò (Chiesa)", 45.4285, 12.3795, "Lido di Venezia"),

    # PELLESTRINA
    ("Pellestrina (Piazza Sant'Antonio)", 45.2750, 12.3010, "Pellestrina"),
    ("San Pietro in Volta", 45.3120, 12.3180, "Pellestrina"),
    ("Portosecco (Pellestrina)", 45.2950, 12.3090, "Pellestrina"),

    # SANT'ERASMO & VIGNOLE
    ("Sant'Erasmo (Chiesa)", 45.4550, 12.4080, "Sant'Erasmo / Vignole"),
    ("Sant'Erasmo (Torre Massimiliana)", 45.4470, 12.4020, "Sant'Erasmo / Vignole"),
    ("Vignole (Approdo)", 45.4410, 12.3780, "Sant'Erasmo / Vignole")
]

def haversine_dist_meters(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (math.sin(delta_phi / 2) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def main():
    with open(FOUNTAINS_FILE, 'r', encoding='utf-8') as f:
        doc = json.load(f)

    fountains = doc['data']
    print(f"Elaborazione di {len(fountains)} fontanelle...")

    used_names_counter = {}

    for fnt in fountains:
        flat = fnt['lat']
        flon = fnt['lon']

        # Cerca il sito toponomastico più vicino
        best_site = None
        min_dist = float('inf')

        for name, slat, slon, zone in KNOWN_VENICE_SITES:
            d = haversine_dist_meters(flat, flon, slat, slon)
            if d < min_dist:
                min_dist = d
                best_site = (name, zone)

        # Se il nome attuale è generico (#number) e c'è un toponimo noto entro NEAR_SITE_MAX_M.
        # È una stima di prossimità, non l'indirizzo: per questo il testo dice "nei pressi di".
        if "#" in fnt['name'] and best_site and min_dist <= NEAR_SITE_MAX_M:
            toponym, zone = best_site
            count = used_names_counter.get(toponym, 0) + 1
            used_names_counter[toponym] = count
            
            if count == 1:
                fnt['name'] = f"Fontanella presso {toponym}"
            else:
                fnt['name'] = f"Fontanella presso {toponym} #{count}"

            fnt['sestiere'] = zone
            fnt['address'] = f"Nei pressi di {toponym} (~{round(min_dist)} m, stima)"

        # Solo informazioni generali vere per tutte le fontanelle: nessuna certificazione o orario
        # attribuiti al singolo punto senza una fonte che li riporti.
        fnt['details'] = (
            "Fontanella pubblica mappata su OpenStreetMap. A Venezia l'acquedotto è gestito da Veritas S.p.A.; "
            "funzionamento e orari del singolo punto non sono verificati."
        )
        fnt['operator'] = fnt.get('operator') or "Non indicato (OSM)"
        fnt['waterSource'] = "Acquedotto civico (gestore Veritas S.p.A.)"
        fnt.pop('campaign', None)
        if "#" not in fnt['name']:
            fnt['toponomasticSource'] = "Toponimo più vicino da elenco curato (pipeline/enrich_fountains.py)"

    doc['metadata']['toponomasticEnriched'] = True
    doc['metadata']['provenance'] = [
        "OpenStreetMap contributors (ODbL 1.0)",
        "Toponimi di prossimità: elenco curato del progetto (stima, non indirizzo)",
    ]

    with open(FOUNTAINS_FILE, 'w', encoding='utf-8') as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)

    print("Completato arricchimento con successo!")
    sample = [f for f in fountains if '#' not in f['name']][:10]
    print(f"Esempi di toponimi assegnati ({len(sample)}):")
    for s in sample:
        print(f"  * {s['name']} - {s['sestiere']}")

if __name__ == "__main__":
    main()
