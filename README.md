# 🌊 VOD – Venice Open Data

**Venice Open Data (VOD)** è una piattaforma web moderna ad alte prestazioni per l'analisi geospaziale, la visualizzazione e l'incrocio degli **Open Data del Comune di Venezia** e della rete di **trasporto pubblico ACTV / AVM** (navigazione lagunare, autobus e tram).

VOD integra:
1. **Simulazione da orario della flotta ACTV** (oltre 5.400 corse feriali dal GTFS ufficiale, rigenerata dalla pipeline) e, separatamente, **posizioni GPS reali** dal feed GTFS-RT.
2. **Dati live** letti lato server con cache condivisa: maree e rete meteo-marina CPSM (dati.venezia.it), METAR LIPZ (NOAA AWC), voli ADS-B (OpenSky), mezzi ACTV (GTFS-RT), orbite satellitari (TLE CelesTrak), previsione del vento su griglia (Open-Meteo, CC BY 4.0) per l'animazione del layer vento, previsione di aria, pollini e UV (Copernicus CAMS) e del mare (Open-Meteo Marine).
3. **Analisi spaziale** cantieri ↔ fermate entro un raggio configurabile.
4. **Palette solare dinamica** sincronizzata con alba e tramonto a Venezia.
5. **Pipeline Python** per download GTFS, ingestione in PostgreSQL + PostGIS e sincronizzazione GTFS-RT.

> **Nota architetturale**: l'applicazione web oggi non legge da PostgreSQL. Le API servono dati live (fonti esterne) o dataset di riferimento inclusi nel codice; il database è usato solo dalla pipeline. Vedi `docs/AUDIT-2026-10-08.md`.

## 🧭 Provenienza dei dati

Ogni layer dichiara la propria natura in interfaccia (badge) e nelle risposte API (`meta.kind`):

| Tipo | Significato | Esempi |
| :--- | :--- | :--- |
| `live` | Misura letta dalla fonte a ogni intervallo di cache | Maree e rete meteo-marina CPSM, METAR LIPZ, voli OpenSky, GTFS-RT ACTV, orbite satellitari (TLE CelesTrak) |
| `schedule-simulation` | Posizioni calcolate da orari e percorsi ufficiali | Vaporetti/bus ACTV, barche Alilaguna |
| `static-reference` | Dataset ufficiale importato dalla pipeline o anagrafica statica | Opere pubbliche, WiFi (dati.venezia.it), qualità dell'aria ARPAV (medie annue), fermate, ponti, parcheggi, navi in banchina |
| `community` | Mappatura collaborativa non verificata | Telecamere OpenStreetMap (ODbL) e selezione Anopticon |

Quando una fonte live non risponde l'interfaccia mostra "n.d.": nessun valore viene inventato.

---

## 🏛️ Architettura del Progetto

```
vod-venice-open-data/
├── docker-compose.yml              # PostgreSQL 16 + PostGIS 3.4 container
├── db/
│   ├── 01_init_postgis.sql         # Schema DDL (GTFS, Comune, GTFS-RT, indici GiST)
│   └── 02_spatial_queries.sql      # Funzioni spaziali (ST_DWithin buffer, viste GeoJSON)
├── pipeline/
│   ├── requirements.txt            # Dipendenze Python
│   ├── download_gtfs.py            # Download automatico archivi GTFS ACTV
│   ├── import_gtfs.py              # Ingestione e conversione shapes in LineString PostGIS
│   ├── import_comune_venezia.py    # Ingestione cantieri e opere pubbliche georeferenziate
│   ├── sync_gtfs_rt.py             # Sincronizzazione feed real-time GTFS-RT
│   ├── export_simulation_data.py   # GTFS ACTV -> dataset di simulazione e indice corse
│   ├── import_opere_pubbliche.py   # Elenco Annuale dei Lavori + geocodifica approssimata
│   ├── import_wifi_hotspots.py     # Hotspot WiFi del Comune
│   ├── import_arpav_air.py         # Qualità dell'aria ARPAV (medie annue validate)
│   ├── import_osm_surveillance.py  # Telecamere da OpenStreetMap
│   ├── import_osm_defibrillators.py # Defibrillatori (DAE) da OpenStreetMap
│   ├── import_osm_pharmacies.py    # Farmacie da OpenStreetMap (i turni non sono open data)
│   ├── import_osm_fountains.py     # Fontanelle da OpenStreetMap
│   ├── import_osm_poi.py           # Colonnine, parcheggi, vere da pozzo, alberi monumentali, ecocentri, biblioteche (OSM)
│   ├── import_alilaguna_gtfs.py    # Orario ufficiale Alilaguna (GTFS dell'operatore)
│   ├── import_agcom_fiber.py       # Copertura rete fissa FTTH/FTTC/ADSL (AGCOM BroadbandMap, CC BY 4.0)
│   ├── enrich_fountains.py         # Toponimo di prossimità per le fontanelle senza nome
│   └── tests/                      # Test pytest
├── web/                            # Applicazione Next.js 16 (App Router)
│   ├── package.json
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            # Dashboard geospaziale interattiva principale
│   │   │   └── api/                # API RESTful & Endpoint GeoJSON
│   │   │       ├── cantieri/
│   │   │       ├── stops/
│   │   │       ├── spatial/stops-near-cantieri/
│   │   │       ├── realtime/vehicles/
│   │   │       └── stats/
│   │   ├── components/
│   │   │   ├── Header.tsx           # Navigazione, viste camera, switcher palette
│   │   │   ├── MapEngine.tsx        # Motore Canvas 2D / Vettoriale ad alte performance
│   │   │   ├── TimelineControls.tsx # Scrubbing orario 24h, play/pause, velocità
│   │   │   ├── LayerPanel.tsx       # Toggles layer, legenda e slider buffer spaziale
│   │   │   ├── StopDetailModal.tsx  # Dettagli fermata e prossime corse programmate
│   │   │   ├── CantiereDetailModal.tsx # Scheda cantiere, budget e impatto mobilità
│   │   │   ├── SpatialAnalysisModal.tsx # Dashboard intersezioni spaziali buffer
│   │   │   └── StatsModal.tsx       # Cruscotto metriche e statistiche generali
│   │   └── lib/
│   │       ├── types.ts            # Modelli di dominio TypeScript
│   │       ├── solar.ts            # Calcolo effemeridi e interpolazione palette solare
│   │       ├── simulation-data.ts  # Dataset lagunare e GTFS pre-baked
│   │       └── db.ts               # Dataset di riferimento e calcoli spaziali in memoria
│   ├── src/server/                 # Accesso alle fonti esterne (fetch con timeout e cache, parser validati)
│   ├── src/components/map/         # Layer di disegno della mappa (un modulo per tema) e contesto del frame
│   ├── src/data/                   # Dataset generati dalla pipeline (opere, WiFi, ARPAV, telecamere, indice GTFS)
│   ├── src/proxy.ts                # Rate limit delle API
│   └── e2e/                        # Test end-to-end Playwright
└── README.md
```

---

## 🚀 Avvio Rapido

### 1. Avviare il Database (PostgreSQL 16 + PostGIS)
Il progetto include una configurazione Docker pronta con estensione PostGIS e inizializzazione automatica delle tabelle e delle funzioni spaziali:

```bash
# Dalla radice del progetto:
docker compose up -d

# Verificare che il container sia attivo e sano:
docker compose ps
```

Prima dell'avvio copiare `.env.example` in `.env` e impostare `POSTGRES_PASSWORD` e `DATABASE_URL`
(nessuna credenziale di default è inclusa nel codice). Il database è esposto solo su `127.0.0.1:5432`.

### 2. Aggiornare i dati (pipeline)
I dataset statici dell'app sono generati dalla pipeline e versionati in `web/src/data/` e
`web/src/lib/simulation-data.ts`. Il workflow `.github/workflows/refresh-data.yml` li rigenera ogni
lunedì e apre una pull request; in locale:

```bash
cd pipeline
pip install -r requirements-dev.txt

# Simulazione dei mezzi dai GTFS ACTV (download + rigenerazione di D e dell'indice corse)
python download_gtfs.py
python export_simulation_data.py            # opzionale: --date YYYY-MM-DD; non scrive nulla se il calendario GTFS non ha corse per i giorni simulati

# Dataset ufficiali (ognuno indipendente dagli altri)
python import_opere_pubbliche.py            # Elenco Annuale dei Lavori (dati.venezia.it) + geocodifica OSM
python import_wifi_hotspots.py              # Hotspot WiFi del Comune
python import_arpav_air.py                  # Medie annue validate ARPAV
python import_osm_surveillance.py           # Telecamere da OpenStreetMap
python import_osm_defibrillators.py         # Defibrillatori da OpenStreetMap (non esiste un dataset ufficiale aperto)
python import_osm_pharmacies.py             # Farmacie da OpenStreetMap
python import_osm_fountains.py && python enrich_fountains.py  # Fontanelle da OpenStreetMap
python import_osm_poi.py                    # Colonnine, parcheggi ≥100 posti, vere da pozzo, alberi monumentali, ecocentri, biblioteche (OSM)
python import_alilaguna_gtfs.py             # Orario Alilaguna (simulazione delle barche dall'orario)
python import_agcom_fiber.py                # Copertura fibra AGCOM su celle di ~100 m

# Test della pipeline
python -m pytest -q tests
```

Caricamento facoltativo in PostgreSQL/PostGIS (non usato dall'app web):

```bash
python import_gtfs.py
python import_comune_venezia.py             # opere pubbliche reali + esempi statici
python sync_gtfs_rt.py                      # posizioni GTFS-RT reali; nessuna scrittura se il feed non risponde
```

### 3. Avviare il Frontend Web
```bash
cd web

# Modalità sviluppo:
npm run dev

# Oppure build di produzione:
npm run build
npm start

# Qualità:
npm run typecheck
npm run lint
npm test                                  # Vitest (unit, contratto API, parser su fixture reali)
npm run build && PW_CHANNEL=chrome npm run test:e2e --workspace=web   # Playwright
```

La CI (`.github/workflows/ci.yml`) esegue typecheck, lint, test, build, test end-to-end,
`npm audit` sulle dipendenze di produzione e i test della pipeline.

Apri il browser su: **`http://localhost:3000`**

---

## 🛰️ Funzionalità Chiave

### 1. Mappa Interattiva e Motore di Simulazione
* **60 FPS anche su Mobile**: rendering ottimizzato su Canvas 2D con proiezione cartesiana su griglia $26.194 \times 38.701$ unità virtuali.
* **Scia dei Mezzi (Ghosting Trail)**: ogni mezzo calcola e traccia la posizione precedente lungo il percorso in funzione della velocità di simulazione.
* **Modalità Fusione Additiva (`lighter`)**: in modalità notte, l'incrocio dei vaporetti genera fasci di luce combinati.
* **7 Categorie Distinte**: Vaporetto, Motoscafo, Motonave, Ferry-boat, Tram T1/T2, Bus Terraferma e Bus Isole.

### 2. Incrocio spaziale: opere pubbliche e fermate
* Raggio configurabile (10–2000 m) attorno alle opere pubbliche localizzate dell'Elenco Annuale dei Lavori.
* Nell'app il calcolo avviene in memoria (`/api/spatial/stops-near-cantieri`); la stessa analisi è disponibile
  in PostGIS con `get_stops_near_cantieri(raggio)` (`db/02_spatial_queries.sql`, indici GiST su geography).
* Le posizioni delle opere sono approssimate (geocodifica del luogo citato nel titolo).

### 3. Palette Solare Dinamica
* Oltre alle modalità fisse (**Notte** e **Carta**), la modalità **Dinamica** calcola al secondo la posizione del sole a Venezia (Alba nautica, Alba civile, Sunrise, Tramonto, Crepuscolo) e interpola la palette cromatica di laguna, cielo e mezzi in modo continuo.

---

## 📡 Riferimento API

| Metodo | Endpoint | Descrizione |
| :--- | :--- | :--- |
| `GET` | `/api/cantieri` | Elenco di tutti i cantieri del Comune con budget, date e coordinate. |
| `GET` | `/api/stops` | Fermate e pontili ACTV con filtro opzionale `?mode=navigazione`. |
| `GET` | `/api/spatial/stops-near-cantieri?radius=200` | Query spaziale: fermate entro il raggio indicato da cantieri attivi. |
| `GET` | `/api/realtime/vehicles` | Posizioni reali dei mezzi ACTV dal feed GTFS-RT (cache 20 s). |
| `GET` | `/api/tide` | Livelli di marea reali, previsione CPSM con data di emissione, anagrafica MOSE. |
| `GET` | `/api/weather` | METAR LIPZ reale e stazioni vento di riferimento. |
| `GET` | `/api/flights` | Aerei rilevati da OpenSky nell'area di Venezia (cache 15 s). |
| `GET` | `/api/fiber` | Copertura della rete fissa (FTTH, FTTC, ADSL) su celle di ~100 m da AGCOM BroadbandMap, CC BY 4.0. |
| `GET` | `/api/environment` | Medie annue ARPAV per stazione più previsione oraria Copernicus CAMS nello stesso punto (indice europeo, PM, NO₂, ozono, UV). |
| `GET` | `/api/wind-field` | Vento previsto a 10 m su griglia 9×9 (Open-Meteo, cache 30 min): previsione di modello, non misura. |
| `GET` | `/api/stats` | Metriche aggregate; `null` dove manca una fonte in tempo reale. |
| `GET` | `/api/health` | Stato ed età di ogni fonte live e dei dataset della pipeline (`ok` / `stale` / `down`). |
| `GET` | `/api/satellites` | Satelliti con orbite SGP4 da TLE CelesTrak e prossimo passaggio sopra Venezia. |
| `GET` | `/api/cantieri` | Opere pubbliche dell'Elenco Annuale dei Lavori 2026 (posizioni approssimate). |

Le API sono pubbliche e in sola lettura, con cache server per ogni fonte e un limite di
600 richieste al minuto per IP (`API_RATE_LIMIT_PER_MINUTE`).

---

## 📄 Fonti, licenze e crediti
* **ACTV S.p.A. / AVM**: GTFS Navigazione e Automobilistico (Open Data, CC BY – citazione obbligatoria). Il feed GTFS-RT è pubblico ma la licenza d'uso va confermata con AVM.
* **Comune di Venezia – CPSM**: livelli e previsioni di marea da `dati.venezia.it`.
* **NOAA Aviation Weather Center**: METAR LIPZ (pubblico dominio).
* **OpenSky Network**: dati ADS-B, uso non commerciale/ricerca secondo i termini OpenSky.
* **SkylineWebcams, CNR-ISMAR**: solo collegamenti alle pagine ufficiali delle dirette; nessuna immagine viene ripubblicata.
* **Anopticon (tramaci.org)**: mappatura civica delle telecamere. I termini d'uso vietano l'accesso automatico senza autorizzazione: il dataset completo non è incluso (bozza di richiesta in `docs/richieste-autorizzazione.md`).
* **Comune di Venezia – dati.venezia.it**: Elenco Annuale dei Lavori, hotspot WiFi, rete meteo-marina CPSM (CC BY).
* **ARPAV**: medie annue validate di PM10, PM2.5 e NO2 (CC BY 4.0).
* **CelesTrak**: elementi orbitali TLE.
* **OpenStreetMap contributors**: geometrie della laguna (ODbL – © OpenStreetMap contributors).
