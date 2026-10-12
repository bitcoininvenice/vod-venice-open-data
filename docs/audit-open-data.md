# Audit open data Venezia e laguna (Fase A, parziale)

Stato: **in corso**. Verificato con richieste reali il 12/10/2026. Nessun codice di integrazione scritto.

## Punto di partenza
19 dei 57 layer di VOD sono "elenchi curati del progetto" (valori scritti a mano con un riferimento a una fonte).
Priorità proposta: sostituirli con dati veri (Wave 0) prima di aggiungere temi nuovi.

## Fonti verificate

| ID | Tema | Dataset | URL | Formato | Licenza | Geo | Aggiornamento | In VOD? | Utilità | Effort | Verdetto |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A2-1 | Laguna, chimica | ARPAV nutrienti e solidi sospesi | arpa.veneto.it/…/soaml/laguna-di-venezia/tss-nutr-acqua | CSV per anno (2011–2024) | CC BY 4.0 (come sonda, da riconfermare per file) | GBO X/Y (EPSG:3003), stesse stazioni della sonda | campagne annuali, ultimo 2024 | no | 5 | S | **USARE** (estendere `import_arpav_lagoon.py`) |
| A2-2 | Laguna, biologia | ARPAV fitoplancton (cellule/l per specie, clorofilla) | …/fitoplancton | CSV 2011–2025 | CC BY 4.0 | GBO X/Y | ultimo 2025 | no | 5 | S | **USARE** |
| A2-3 | Laguna, biologia | ARPAV macrozoobenthos (indici di diversità, specie) | …/macrozoobenthos | CSV 2011–2024 | CC BY 4.0 | GBO X/Y | ultimo 2024 | no | 4 | S | **USARE** |
| A2-4 | Laguna, biologia | ARPAV macrofite (presenza specie, copertura) | …/macrofite | CSV 2014–2023 | CC BY 4.0 | GBO X/Y | ultimo 2023 | no | 4 | S | **USARE** |
| A2-5 | Laguna, biologia | ARPAV fauna ittica (specie, individui, biomassa, habitat) | …/fauna-ittica | CSV 2011–2024 | CC BY 4.0 | GBO X/Y | ultimo 2024 | no | 4 | S | **USARE** |
| A2-6 | Laguna, sedimenti | ARPAV condizioni morfologiche (granulometria, N, P, C) | …/condizioni-morfologiche | CSV 2011–2024 | CC BY 4.0 | GBO X/Y | ultimo 2024 | no | 3 | S | **USARE** (stessa pipeline) |
| A2-7 | Laguna, meteo | ARPAV dati meteo laguna | …/dati-meteo | CSV fino al 2024, 2026 solo PDF | CC BY 4.0 | stazioni | annuale | parziale (CPSM) | 2 | S | DOC |
| A2-8 | Costa | ARPAV TRIX per stazione | …/file-e-allegati/trix | XLSX 2019–2025 | CC BY 4.0 | solo località (Pellestrina), niente coordinate | annuale | no | 2 | M | DOC |
| A2-9 | Acque reflue | ARPAV elenco depuratori Veneto | …/elenco-depuratori-acque-reflue-urbane | CSV gen 2024 | CC BY 4.0 | solo indirizzo, niente coordinate | 2024 | no | 2 | M | SKIP |
| A2-10 | Balneazione | EEA Bathing Water 2024 (punti con classe di qualità e storico 10 anni, link al profilo del Ministero) | marine.discomap.eea.europa.eu/arcgis/rest/services/BathingWater/BathingWater_Dyna_WM_2024/MapServer/3 | ArcGIS REST, JSON | "EEA, dati degli Stati membri" (da confermare termini EEA) | WGS84, 27 punti nel riquadro Venezia/litorale | stagione 2024 | **sostituisce `acque_balneazione` curato** | 5 | S | **USARE** |
| A1-1 | Commercio | Comune: somministrazione, dettaglio area privata e pubblica, ricettive, acconciatori/estetisti | dati.venezia.it (serie semestrali) | CSV | CC-BY | sestiere + civico (geocodificabile con `osm-civici`) | **fermo al 2021** | no | 3 | M | USARE con etichetta "situazione al 2021" o DOC |
| A1-2 | Segnalazioni | IRIS | iris.comune.venezia.it/datiOpen.aspx | CSV | CC-BY | georiferite | dichiarato "al momento dell'accesso" | no | 4 | M | **BLOCCATO**: protezione anti-bot Imperva, il server risponde con una pagina di verifica; serve download manuale o contatto con il Comune |
| A1-3 | Cartografia | Carta tecnica DBGT (strato 09 ambiti amministrativi, 02 edifici, 04 idrografia, 05 orografia) | portale.comune.venezia.it/node/117/80 | SHP/DXF, EPSG:3004 | IODL 2.0 | sì | aggiornata 10/09/2026 | no | 4 (confini ufficiali per le metriche) | M | USARE con download manuale (Imperva) e pipeline `--file` |
| A1-4 | Illuminazione | Punti luce pubblici | dati.venezia.it/…/PuntiLuce.csv | CSV | CC-BY | coordinate | 2015 | no | 1 | S | SKIP (vecchio) |
| A1-5 | Habitat | Atlante: habitat e vegetazione del litorale; alghe invasive | silvenezia.it/sites/default/files/OPEN_DATA/… (zip 1,1 MB e 40 KB) | SHP | IODL 2.0 | sì | anno da verificare nei metadati | no | 3 | M | USARE in Wave 2 (dopo verifica anno) |
| A5-1 | Subsidenza | Copernicus EGMS (Basic/Calibrated/Ortho, release 2019–2023 e 2020–2024) | egms.land.copernicus.eu | CSV/viewer | dati Sentinel modificati (avviso legale Copernicus) | punti | release pluriennali | **sostituisce `subsidenza_insar` curato** | 5 | M | USARE, ma il download richiede account EU Login: estrazione una tantum per il riquadro Venezia, documentata |

## Da completare
- Fasi A3 (batimetria CNR-ISMAR, EMODnet), A4 (IDT Regione: Natura 2000, uso del suolo; statistica regionale turismo per sostituire `strutture_ricettive`), A6 (Starlink, default SKIP).
- Licenze per singolo file ARPAV ed EEA, anni dei dataset dell'Atlante.
- Ranking Top 10 e wave definitive.

## Proposta provvisoria di Wave 1
1. ARPAV biologia e chimica della laguna (A2-1…A2-6): una pipeline sola, stesse stazioni della sonda, schede per stazione con data di campionamento. Mai etichettate come "in tempo reale".
2. Balneazione EEA 2024 (A2-10) al posto del layer curato.
3. EGMS (A5-1) al posto del layer curato di subsidenza, dopo l'estrazione manuale.

## Fonti consultate
- https://dati.venezia.it/ e catalogo completo (20 pagine di `?q=cerca_dataset`)
- https://dati.venezia.it/?q=content/segnalazioni-iris
- https://dati.venezia.it/?q=content/carta-tecnica
- https://www.arpa.veneto.it/dati-ambientali/open-data/file-e-allegati/soaml/laguna-di-venezia (e sottocartelle)
- https://www.arpa.veneto.it/dati-ambientali/open-data/file-e-allegati/trix
- https://www.atlantedellalaguna.it/ e http://www.silvenezia.it/?q=node/135
- https://egms.land.copernicus.eu/
- https://marine.discomap.eea.europa.eu/arcgis/rest/services/BathingWater/BathingWater_Dyna_WM_2024/MapServer
