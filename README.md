# 🌊 VOD – Venice Open Data

**Venice Open Data (VOD)** è una piattaforma web moderna ad alte prestazioni per l'analisi geospaziale, la visualizzazione e l'incrocio degli **Open Data del Comune di Venezia** e della rete di **trasporto pubblico ACTV / AVM** (navigazione lagunare, autobus e tram).

Ispirata e progettata per superare l'esperienza di *SharpGlue Venice Mapping*, VOD integra:
1. **Simulazione fluida a 60 FPS dell'intera flotta lagunare e di terraferma** (oltre 5.400 corse giornaliere).
2. **Incrocio Spaziale PostGIS**: analisi d'impatto tra cantieri/opere pubbliche del Comune di Venezia e fermate/pontili del trasporto pubblico entro buffer personalizzati (es. `ST_DWithin` a 200m).
3. **Palette Solare Dinamica**: sincronizzata con le ore esatte di alba, tramonto e crepuscolo calcolate sulle coordinate geografiche di Venezia.
4. **Pipeline ETL Robusta**: script Python per download, normalizzazione e ingestione in PostgreSQL + PostGIS di archivi GTFS statici e feed GTFS-RT.

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
├── web/                            # Applicazione Next.js 15 (App Router)
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
│   │       └── db.ts               # Connessione PostGIS con fallback resiliente
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

Il database sarà accessibile a `localhost:5432` con:
* **Database**: `venice_opendata`
* **User**: `vod_user`
* **Password**: `vod_password`

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

# 4. Sincronizza lo snapshot dei mezzi real-time:
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
| `GET` | `/api/realtime/vehicles` | Posizione dei mezzi attivi (feed GTFS-RT o snapshot cinematico). |
| `GET` | `/api/stats` | Metriche aggregate della piattaforma (linee, fermate, investimenti). |

---

## 📄 Fonti e Crediti
* **ACTV S.p.A. / AVM**: Open Data GTFS Navigazione e Automobilistico & Feed GTFS-RT.
* **Comune di Venezia**: Portale Open Data `dati.venezia.it` (Opere Pubbliche e Cantieri).
* **OpenStreetMap contributors**: Dati cartografici e perimetri lagunari.
