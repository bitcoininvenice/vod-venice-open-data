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
│   ├── vod_http.py                 # Richieste HTTP condivise: User-Agent, tentativi, Overpass di riserva, Nominatim a 1 req/s
│   ├── vod_common.py               # Connessione al database e log senza credenziali
│   ├── download_gtfs.py            # Download automatico archivi GTFS ACTV
│   ├── import_gtfs.py              # Ingestione e conversione shapes in LineString PostGIS
│   ├── import_comune_venezia.py    # Ingestione cantieri e opere pubbliche georeferenziate
│   ├── sync_gtfs_rt.py             # Sincronizzazione feed real-time GTFS-RT
│   ├── export_simulation_data.py   # GTFS ACTV -> dataset di simulazione e indice corse
│   ├── import_opere_pubbliche.py   # Elenco Annuale dei Lavori + geocodifica approssimata
│   ├── import_bdap_opere.py        # Monitoraggio Opere Pubbliche BDAP (MEF-RGS): opere del Comune in corso, fasi, costi, finanziamenti
│   ├── import_wifi_hotspots.py     # Hotspot WiFi del Comune
│   ├── import_arpav_air.py         # Qualità dell'aria ARPAV (medie annue validate)
│   ├── import_osm_surveillance.py  # Telecamere da OpenStreetMap
│   ├── import_osm_defibrillators.py # Defibrillatori (DAE) da OpenStreetMap
│   ├── import_osm_pharmacies.py    # Farmacie da OpenStreetMap (i turni non sono open data)
│   ├── import_osm_fountains.py     # Fontanelle da OpenStreetMap
│   ├── import_osm_poi.py           # Colonnine, parcheggi, vere da pozzo, alberi monumentali, ecocentri, biblioteche (OSM)
│   ├── import_alilaguna_gtfs.py    # Orario ufficiale Alilaguna (GTFS dell'operatore)
│   ├── import_osm_waterways.py     # Briccole, segnalamenti e canali della laguna (OSM)
│   ├── import_istat_census.py      # Residenti, famiglie e abitazioni per sestiere, isola e municipalità (ISTAT 2021)
│   ├── import_osm_walk.py          # Rete pedonale (calli, fondamenta, ponti) per il planner «Come arrivare» (OSM)
│   ├── import_osm_civici.py        # Numeri civici del centro storico per sestiere (OSM), per la ricerca «Cannaregio 3450»
│   ├── import_osm_parks.py         # Parchi, giardini pubblici, aree giochi, aree cani e oasi con perimetro (OSM)
│   ├── import_osm_toponyms.py      # Toponimi (calli, fondamenta, ponti, campi) per collocare le ordinanze (OSM)
│   ├── import_flixbus.py           # Corse FlixBus che passano per Venezia, dal GTFS europeo (ODbL)
│   ├── import_arpav_pollen.py      # Pollini misurati da ARPAV a Venezia (calendario mensile)
│   ├── import_cruscotto_italia.py  # Profilo socio-economico dei comuni della laguna (Cruscotto Italia, AgID)
│   ├── import_arpav_lagoon.py      # Sonde ARPAV della laguna (ultimo campionamento) e riepilogo balneazione
│   ├── import_cciaa_turismo.py     # Arrivi, presenze e residenti dei comuni della laguna (CCIAA, CC BY)
│   ├── import_agcom_fiber.py       # Copertura rete fissa FTTH/FTTC/ADSL (AGCOM BroadbandMap, CC BY 4.0)
│   ├── enrich_fountains.py         # Toponimo di prossimità per le fontanelle senza nome
│   ├── import_venice_tap_water.py  # Fontanelle e stato aperta/chiusa da Venice Tap Water
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
│   │   │   ├── LayerPanel.tsx       # Scenari, ricerca, gruppi con natura del dato, voci "da verificare"
│   │   │   ├── ActiveLayersLegend.tsx # Legenda unica dei livelli attivi
│   │   │   ├── ui/InfoPanel.tsx     # Scheda informativa unica (destra su desktop, cassetto su mobile)
│   │   │   ├── ui/Modal.tsx         # Finestra modale condivisa (ricerca, esportazione, tutorial, marea, analisi)
│   │   │   ├── MapObjectPanel.tsx   # Schede di navi, voli, mezzi ACTV e Alilaguna
│   │   │   ├── StopDetailModal.tsx  # Dettagli fermata e prossime corse programmate
│   │   │   ├── CantiereDetailModal.tsx # Scheda cantiere, budget e impatto mobilità
│   │   │   └── SpatialAnalysisModal.tsx # Dashboard intersezioni spaziali buffer
│   │   └── lib/
│   │       ├── types.ts            # Modelli di dominio TypeScript
│   │       ├── cityData.ts         # Dati della mappa (CityData) e registro delle API: cosa caricare, quando, come
│   │       ├── useCityData.ts      # Caricamento su richiesta e aggiornamento periodico dei dati live
│   │       ├── solar.ts            # Calcolo effemeridi e interpolazione palette solare
│   │       ├── simulation-data.ts  # Griglia, isole leggere, configurazione e URL dei file in public/data
│   │       └── db.ts               # Dataset di riferimento e calcoli spaziali in memoria
│   ├── public/data/                # Simulazione GTFS e isole dettagliate (JSON con hash nel nome, cache immutabile)
│   ├── src/server/                 # Accesso alle fonti esterne (fetch con timeout e cache, parser validati)
│   ├── src/components/map/         # Layer di disegno della mappa (un modulo per tema), contesto del frame e hit-test dei clic
│   ├── src/data/                   # Dataset generati dalla pipeline (opere, WiFi, ARPAV, telecamere, indice GTFS)
│   ├── src/proxy.ts                # Rate limit delle API dinamiche (le altre sono in cache CDN)
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
I dataset statici dell'app sono generati dalla pipeline e versionati in `web/src/data/`,
`web/src/lib/simulation-data.ts` e `web/public/data/` (file con hash nel nome). Il workflow `.github/workflows/refresh-data.yml` li rigenera ogni
lunedì e apre una pull request; in locale:

```bash
cd pipeline
pip install -r requirements-dev.txt

# Simulazione dei mezzi dai GTFS ACTV (download + rigenerazione di D e dell'indice corse)
python download_gtfs.py
python export_simulation_data.py            # opzionale: --date YYYY-MM-DD; non scrive nulla se il calendario GTFS non ha corse per i giorni simulati

# Dataset ufficiali (ognuno indipendente dagli altri)
python import_opere_pubbliche.py            # Elenco Annuale dei Lavori (dati.venezia.it) + geocodifica OSM
python import_bdap_opere.py                 # Monitoraggio Opere Pubbliche BDAP (dopo import_opere_pubbliche, per il collegamento via CUP)
python import_wifi_hotspots.py              # Hotspot WiFi del Comune
python import_arpav_air.py                  # Medie annue validate ARPAV
python import_osm_surveillance.py           # Telecamere da OpenStreetMap
python import_osm_defibrillators.py         # Defibrillatori da OpenStreetMap (non esiste un dataset ufficiale aperto)
python import_osm_pharmacies.py             # Farmacie da OpenStreetMap
python import_osm_fountains.py && python enrich_fountains.py  # Fontanelle da OpenStreetMap
python import_venice_tap_water.py                             # Fontanelle Venice Tap Water (venicetapwater.org)
python import_osm_poi.py                    # Colonnine, parcheggi ≥100 posti, vere da pozzo, alberi monumentali, ecocentri, biblioteche (OSM)
python import_alilaguna_gtfs.py             # Orario Alilaguna (simulazione delle barche dall'orario)
python import_agcom_fiber.py                # Copertura fibra AGCOM su celle di ~100 m
python import_osm_waterways.py              # Briccole, segnalamenti e canali della laguna (OSM)
python import_istat_census.py               # Censimento ISTAT 2021 per sestiere e isola (circa 330 MB da ISTAT, solo a ogni nuova edizione)
python import_osm_walk.py                   # Rete pedonale per il planner a piedi + vaporetto (OSM -> public/data/walk-<hash>.json)
python import_osm_civici.py                 # Numeri civici del centro storico per sestiere (OSM)
python import_osm_parks.py                  # Parchi, giardini pubblici, aree giochi, aree cani e oasi (OSM)
python import_osm_toponyms.py               # Toponimi per collocare le ordinanze del Comune (OSM)
python import_flixbus.py                    # Corse FlixBus per Venezia (GTFS FlixMobility, ODbL)
python import_arpav_pollen.py               # Pollini misurati ARPAV a Venezia
python import_cruscotto_italia.py           # Profilo dei comuni da Cruscotto Italia (MCP AgID, CC BY 4.0)
python import_arpav_lagoon.py               # Sonde ARPAV della laguna e balneazione (anche --probe-file/--year/--bathing-file per file locali)
python import_cciaa_turismo.py              # Turismo e popolazione dei comuni della laguna

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
* **Scenari invece di "attiva tutto"**: *Città* (predefinito alla prima visita), *Muoversi*, *Acqua alta*, *Ambiente oggi*, *Servizi utili*. Ogni scenario attiva 3-6 livelli e usa solo dati verificati. Link: `?preset=acqua-alta`; i vecchi nomi (`mobility`, `lagoon`, `city`, `satellites`, `regional`) restano validi e `?layers=all` apre lo scenario predefinito. I livelli attivi finiscono in `?layers=slug1,slug2`.
* **Pannello dei livelli**: ricerca (anche per nome inglese, ente o slug), "Attiva / Disattiva" per gruppo, "Pulisci mappa", bollino con la natura del dato (Live, Simulato, Dataset, Da verificare), elenchi curati raccolti in "Da verificare", avviso oltre 12 livelli attivi.
* **Scheda informativa unica**: tutto ciò che si clicca sulla mappa si apre nella stessa scheda, a destra su desktop e dal basso su mobile, senza oscurare la mappa; nel piede natura del dato, ente e link alla scheda del livello in `/layers`.
* **Guida (tutorial)**: alla prima visita spiega gruppi, ricerca, bollini, scheda informativa e legenda, e fa scegliere lo scenario di partenza; si riapre dal menu in alto a destra, voce "Guida".
* **Consumi ridotti**: all'avvio parte solo la marea; ogni altra API si carica quando serve (livello acceso, ricerca, esportazione, schede) e una sola volta, con cache del browser proporzionata alla freschezza del dato. Simulazione ACTV (~220 KB compressi) e isole dettagliate (~390 KB) sono file statici scaricati solo con mezzi/rotte accesi o al primo zoom. La mappa di base è in cache su un canvas nascosto (si ridisegna solo se cambiano vista o colori), le isole fuori schermo sono scartate e l'animazione è limitata a 30 fps. Finestre e schede meno frequenti si scaricano all'apertura.
* **Etichette diradate e legenda unica**: le etichette che si sovrappongono vengono saltate (massimo 70 per frame); la legenda "Livelli attivi" elenca i livelli attivi e permette di disattivarli.

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
| `GET` | `/api/stops` | Fermate e pontili ACTV con filtro opzionale `?mode=navigazione`. |
| `GET` | `/api/spatial/stops-near-cantieri?radius=200` | Query spaziale: fermate entro il raggio indicato da cantieri attivi. |
| `GET` | `/api/realtime/vehicles` | Posizioni reali dei mezzi ACTV dal feed GTFS-RT (cache 20 s), con il ritardo stimato da ACTV (`delay`, feed TripUpdates) quando il mezzo indica la corsa e l'aggiornamento ha meno di 2 minuti. |
| `GET` | `/api/realtime/arrivals?lat=&lon=&stops=` | Prossimi arrivi previsti (90 minuti) ai codici GTFS indicati in `stops` o, in mancanza, alle fermate entro 150 m dal punto, con ritardo e tipo di stima. |
| `GET` | `/api/stops` | Fermate ACTV dal GTFS ufficiale (pontili, tram, nodi bus) con linee e codici GTFS (`gtfsIds`). |
| `GET` | `/api/tide` | Livelli di marea reali, previsione CPSM con data di emissione, anagrafica MOSE. |
| `GET` | `/api/weather` | METAR LIPZ reale e stazioni vento di riferimento. |
| `GET` | `/api/ships` | Navi nell'area di Venezia via AIS (aisstream.io, chiave in `AISSTREAM_API_KEY`): collegamento di 15 s al massimo una volta al minuto, navi sentite negli ultimi 30 minuti. Senza chiave restituisce un elenco vuoto con `meta.kind: not-configured`. |
| `GET` | `/api/flights` | Aerei rilevati da OpenSky nell'area di Venezia (cache 15 s). |
| `GET` | `/api/datasets` | Catalogo dei dataset (lo stesso del server MCP) e servizi MCP correlati. |
| `GET` | `/api/datasets/<id>` | Voci di un dataset con filtri `text`, `lat`/`lon`/`radius`, `limit` (≤100), `offset`: per script e scaricamenti in blocco. |
| `POST` | `/api/mcp` | Server MCP in sola lettura (Streamable HTTP): strumenti `list_datasets` e `query_dataset` per collegare Claude, ChatGPT, Cursor e altri assistenti. Istruzioni in `/mcp`, descrizione per AI in `/llms.txt`, dettagli in `docs/MCP.md`. |
| `GET` | `/api/lagoon-network` | Briccole, pali, segnali, boe, fanali e canali della laguna da OpenStreetMap (ODbL). Non per la navigazione. |
| `GET` | `/api/fiber` | Copertura della rete fissa (FTTH, FTTC, ADSL) su celle di ~100 m da AGCOM BroadbandMap, CC BY 4.0. |
| `GET` | `/api/environment` | Medie annue ARPAV per stazione più previsione oraria Copernicus CAMS nello stesso punto (indice europeo, PM, NO₂, ozono, UV). |
| `GET` | `/api/wind-field` | Vento previsto a 10 m su griglia 9×9 (Open-Meteo, cache 30 min): previsione di modello, non misura. |
| `GET` | `/api/stats` | Metriche aggregate; `null` dove manca una fonte in tempo reale. |
| `GET` | `/api/health` | Stato ed età di ogni fonte live e dei dataset della pipeline (`ok` / `stale` / `down`). |
| `GET` | `/api/satellites` | Satelliti con orbite SGP4 da TLE CelesTrak e prossimo passaggio sopra Venezia. |
| `GET` | `/api/cantieri` | Opere pubbliche dell'Elenco Annuale dei Lavori 2026 (posizioni approssimate); il campo `bdap` aggiunge, per CUP, fase reale, date, costi e finanziamenti dal Monitoraggio Opere Pubbliche. |
| `GET` | `/api/city-assets` | Fontanelle (Venice Tap Water con stato aperta/chiusa, e OpenStreetMap), parcheggi, ecocentri, biblioteche e luoghi con Wi-Fi (`wifiVenues`: hotel, bar, biblioteche con tipo di accesso) da OpenStreetMap (ODbL). |
| `GET` | `/api/census` | Residenti, età, stranieri, famiglie e abitazioni (anche vuote o di soli non residenti) per Comune, municipalità, sestiere e isola dal Censimento ISTAT 2021 (CC BY 4.0). |
| `GET` | `/api/civici?q=Cannaregio 3450` | Numero civico veneziano (anche «CN 3450», «S. Polo 1200/a»): posizione esatta se è su OpenStreetMap, altrimenti il civico noto più vicino dello stesso sestiere (`match=nearest`). |
| `GET` | `/api/parks` | Parchi, giardini pubblici, aree giochi, aree cani e oasi con perimetro, accesso e superficie da OpenStreetMap (ODbL); il Comune non pubblica un dataset aperto del verde. |
| `GET` | `/api/ordinanze` | Ordinanze del Comune in vigore o in arrivo nei prossimi 7 giorni (ogni ambito; città storica, isole, Lido e tutto il territorio comunale, esclusa la terraferma) con validità, tipo, canale o luogo citato, posizione e link all'atto e al PDF. Riletto ogni ora; fa fede il testo dell'atto. |
| `GET` | `/api/fermate-bus` | Tutte le fermate bus ACTV nell'area della mappa (GTFS automobilistico), con linee e codici GTFS; corsie con lo stesso nome unite. |
| `GET` | `/api/avvisi-actv` | Avvisi di servizio ACTV in corso dal feed RSS ufficiale (fermate spostate, deviazioni, modifiche per eventi), con fermate e linee citate; riletto ogni 15 minuti, fa fede l'avviso ACTV. |
| `GET` | `/api/flixbus` | Corse FlixBus che passano per Venezia nei prossimi giorni (GTFS FlixMobility, ODbL): orari e percorso ritagliato sull'area della mappa, per simulare la posizione dei bus. Nessun dato in tempo reale. |
| `GET` | `/api/servizio` | Servizio ACTV adesso per linea (nessuno storico): mezzi con GPS, corse in servizio secondo l'orario e senza posizione nel feed (indizio), ritardo medio e massimo, puntualità, mezzi in coda. Ricalcolato ogni 30 s. |
| `GET` | `/api/velocita-orario` | Tratti delle linee di navigazione: tempo da orario contro tempo minimo rispettando i limiti di velocità noti (stima per difetto, 60 s di tolleranza per gli arrotondamenti e 10% per l'incertezza del percorso). Calcolo dall'orario, non misura dei mezzi. |
| `GET` | `/api/nautical` | Marine, carburante per barche, scivoli, cantieri, noleggi e ormeggi da OpenStreetMap (ODbL); non le concessioni comunali, non pubblicate come open data. |
| `GET` | `/api/sports` | Spazi sportivi: segnalazioni della comunità CAMPO (CC BY 4.0, indirizzo in `web/src/server/sources/campo.ts`, riletta ogni ora) unite agli impianti OpenStreetMap; CAMPO prevale entro 60 m. |
| `GET` | `/api/lora-gateways` | Gateway LoRaWAN online della rete comunitaria The Things Network nell'area della mappa (Packet Broker Mapper, cache 10 min): posizione come pubblicata dal proprietario, nessun identificativo né nome. |
| `GET` | `/api/opere-bdap` | Opere del Comune con lavori in corso dal Monitoraggio Opere Pubbliche (BDAP – Ragioneria Generale dello Stato, CC BY) e riepilogo di tutti i progetti per fase, settore e finanziamento. |

Le API sono pubbliche e in sola lettura, con cache server per ogni fonte e un limite di
600 richieste al minuto per IP (`API_RATE_LIMIT_PER_MINUTE`).

---

## 📄 Fonti, licenze e crediti
* **ACTV S.p.A. / AVM**: GTFS Navigazione e Automobilistico (Open Data, CC BY – citazione obbligatoria). Il feed GTFS-RT è pubblico ma la licenza d'uso va confermata con AVM.
* **Comune di Venezia – CPSM**: livelli e previsioni di marea da `dati.venezia.it`.
* **CAMPO – Dati forniti dalla comunità di CAMPO Venezia**: spazi sportivi di Venezia (CC BY 4.0; licenza, avvertenze e richieste di rimozione nella pagina `/licenza` di CAMPO).
* **The Things Network – Packet Broker Mapper**: gateway LoRaWAN con stato e posizione resi pubblici dai proprietari (VOD non mostra identificativi né nomi; il gateway sparisce se il proprietario rende privata la posizione).
* **MEF – Ragioneria Generale dello Stato (BDAP OpenData)**: Monitoraggio Opere Pubbliche (MOP) Veneto, CC BY.
* **NOAA Aviation Weather Center**: METAR LIPZ (pubblico dominio).
* **OpenSky Network**: dati ADS-B, uso non commerciale/ricerca secondo i termini OpenSky.
* **SkylineWebcams, CNR-ISMAR**: solo collegamenti alle pagine ufficiali delle dirette; nessuna immagine viene ripubblicata.
* **Anopticon (tramaci.org)**: mappatura civica delle telecamere. I termini d'uso vietano l'accesso automatico senza autorizzazione: il dataset completo non è incluso (bozza di richiesta in `docs/richieste-autorizzazione.md`).
* **Comune di Venezia – dati.venezia.it**: Elenco Annuale dei Lavori, hotspot WiFi (CC BY); marea e rete meteo-marina CPSM: la scheda del dataset indica CC BY, la [pagina Open Data del Comune](https://www.comune.venezia.it/it/content/open-data-0) CC BY-SA 3.0. VOD applica la più restrittiva (CC BY-SA 3.0) ai dati CPSM che redistribuisce (API, MCP, esportazioni).
* **ARPAV**: medie annue validate di PM10, PM2.5 e NO2 (CC BY 4.0).
* **CelesTrak**: elementi orbitali TLE.
* **OpenStreetMap contributors**: geometrie della laguna (ODbL – © OpenStreetMap contributors).

## Collegare la propria AI

- **Server MCP** in sola lettura: `https://venice-open-data.vercel.app/api/mcp` (alias `POST /mcp`). Istruzioni per Claude, ChatGPT, Claude Code e Cursor nella pagina `/mcp`; dettagli tecnici in `docs/MCP.md`.
- **Skill "venice-open-data"** per Claude (istruzioni + script CLI senza dipendenze): sorgenti in `skills/venice-open-data/`, ZIP pubblicato in `web/public/downloads/venice-open-data-skill.zip`. Dopo ogni modifica: `python skills/build_skill_zip.py` (un test verifica che lo ZIP sia aggiornato).
- **Skill di sviluppo** per chi contribuisce con un'AI: `.claude/skills/vod-aggiungi-fonte/` descrive la procedura completa per integrare una fonte.
- **`/llms.txt`**: descrizione del sito per gli assistenti, generata dal catalogo.
