# 🌊 VOD – Venice Open Data

**Venice Open Data (VOD)** è una piattaforma web moderna ad alte prestazioni per l'analisi geospaziale, la visualizzazione e l'incrocio degli **Open Data del Comune di Venezia** e della rete di **trasporto pubblico ACTV / AVM** (navigazione lagunare, autobus e tram).

VOD integra:
1. **Simulazione da orario della flotta ACTV** (oltre 5.400 corse feriali dal GTFS ufficiale): le posizioni sono calcolate dagli orari, non sono tracciamento GPS.
2. **Dati live** letti lato server con cache condivisa: maree CPSM (dati.venezia.it), METAR LIPZ (NOAA AWC), voli ADS-B (OpenSky), posizioni reali ACTV (GTFS-RT, via `/api/realtime/vehicles`).
3. **Analisi spaziale** cantieri ↔ fermate entro un raggio configurabile.
4. **Palette solare dinamica** sincronizzata con alba e tramonto a Venezia.
5. **Pipeline Python** per download GTFS, ingestione in PostgreSQL + PostGIS e sincronizzazione GTFS-RT.

> **Nota architetturale**: l'applicazione web oggi non legge da PostgreSQL. Le API servono dati live (fonti esterne) o dataset di riferimento inclusi nel codice; il database è usato solo dalla pipeline. Vedi `docs/AUDIT-2026-10-08.md`.

## 🧭 Provenienza dei dati

Ogni layer dichiara la propria natura in interfaccia (badge) e nelle risposte API (`meta.kind`):

| Tipo | Significato | Esempi |
| :--- | :--- | :--- |
| `live` | Misura letta dalla fonte a ogni intervallo di cache | Maree CPSM, METAR LIPZ, voli OpenSky, GTFS-RT ACTV |
| `schedule-simulation` | Posizioni calcolate da orari e percorsi ufficiali | Vaporetti/bus ACTV, barche Alilaguna |
| `static-reference` | Anagrafica inclusa nel codice, non aggiornata automaticamente | Fermate, ponti, parcheggi, navi in banchina, cantieri, stazioni ARPAV |
| `community` | Mappatura collaborativa non verificata | Telecamere Anopticon (tramaci.org) |

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
│   └── export_simulation_data.py   # Compilazione cinematica GTFS per la simulazione client
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
│   └── src/server/                 # Accesso alle fonti esterne (fetch con timeout e cache, parser validati)
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

### 2. Eseguire la Pipeline Dati (Opzionale / Aggiornamento)
```bash
cd pipeline
pip install -r requirements.txt

# 1. Scarica i file GTFS più recenti da ACTV:
python download_gtfs.py

# 2. Ingerisce orari, corse, fermate e genera le geometrie PostGIS:
python import_gtfs.py

# 3. Ingerisce il dataset cantieri e opere pubbliche del Comune di Venezia:
python import_comune_venezia.py

# 4. Sincronizza le posizioni reali dei mezzi dal feed GTFS-RT ACTV
#    (se il feed non risponde lo script termina senza scrivere dati):
python sync_gtfs_rt.py
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
npm test
```

Apri il browser su: **`http://localhost:3000`**

---

## 🛰️ Funzionalità Chiave

### 1. Mappa Interattiva e Motore di Simulazione
* **60 FPS anche su Mobile**: rendering ottimizzato su Canvas 2D con proiezione cartesiana su griglia $26.194 \times 38.701$ unità virtuali.
* **Scia dei Mezzi (Ghosting Trail)**: ogni mezzo calcola e traccia la posizione precedente lungo il percorso in funzione della velocità di simulazione.
* **Modalità Fusione Additiva (`lighter`)**: in modalità notte, l'incrocio dei vaporetti genera fasci di luce combinati.
* **7 Categorie Distinte**: Vaporetto, Motoscafo, Motonave, Ferry-boat, Tram T1/T2, Bus Terraferma e Bus Isole.

### 2. Incrocio Spaziale PostGIS: Buffer Cantieri
* Permette di definire un raggio di influenza (da 50m a 500m) attorno a ciascun cantiere attivo.
* Esegue la query geodetica:
  ```sql
  SELECT s.stop_name, c.titolo, ROUND(ST_Distance(s.geom::geography, c.geom::geography)) AS distanza
  FROM stops s
  JOIN comune_cantieri c ON ST_DWithin(s.geom::geography, c.geom::geography, 200)
  WHERE c.stato = 'In corso';
  ```
* Mostra a schermo gli anelli di attenzione e apre la dashboard interattiva con l'elenco delle fermate impattate e la possibilità di centrare istantaneamente la mappa.

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
| `GET` | `/api/stats` | Metriche aggregate; `null` dove manca una fonte in tempo reale. |

---

## 📄 Fonti, licenze e crediti
* **ACTV S.p.A. / AVM**: GTFS Navigazione e Automobilistico (Open Data, CC BY – citazione obbligatoria). Il feed GTFS-RT è pubblico ma la licenza d'uso va confermata con AVM.
* **Comune di Venezia – CPSM**: livelli e previsioni di marea da `dati.venezia.it`.
* **NOAA Aviation Weather Center**: METAR LIPZ (pubblico dominio).
* **OpenSky Network**: dati ADS-B, uso non commerciale/ricerca secondo i termini OpenSky.
* **SkylineWebcams, CNR-ISMAR**: solo collegamenti alle pagine ufficiali delle dirette; nessuna immagine viene ripubblicata.
* **Anopticon (tramaci.org)**: mappatura civica delle telecamere; licenza dei dati da chiarire con l'autore.
* **OpenStreetMap contributors**: geometrie della laguna (ODbL – © OpenStreetMap contributors).
