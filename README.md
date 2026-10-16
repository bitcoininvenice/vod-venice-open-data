# 🌊 VOD – Venice Open Data

[Italiano](#italiano) · [English](#english)

---

## Italiano

**Venice Open Data (VOD)** è una mappa di Venezia, della laguna e della terraferma costruita solo con dati
aperti: marea e acqua alta, vaporetti e bus ACTV, Alilaguna, servizi, ambiente, opere pubbliche, ordinanze.
Ogni valore dichiara da dove viene e che cosa è: misura in tempo reale, previsione, posizione simulata
dall'orario, dataset ufficiale, OpenStreetMap o elenco del progetto da verificare.

Sito: **https://venice-open-data.vercel.app** · progetto civico, indipendente, senza fini di lucro.

### Cosa fa

- **Mappa** con oltre 60 livelli raccolti in gruppi (Trasporti, Laguna, Città) e scenari pronti
  (Città, Trasporti, Acqua alta, Ambiente oggi, Servizi utili). I livelli accesi finiscono nell'indirizzo
  (`?layers=farmacie,fontanelle`), quindi una mappa si condivide con un link.
- **Mezzi pubblici**: vaporetti, bus, tram e People Mover ACTV simulati dall'orario ufficiale (GTFS) e uniti
  alle posizioni GPS reali con il ritardo; Alilaguna e FlixBus dall'orario; prossime partenze e ultime corse
  in ogni fermata; avvisi di servizio ACTV.
- **Come arrivare**: percorso con tutti i mezzi (ACTV e Alilaguna, fino a 4 con cambi a piedi) da Chioggia a
  Mestre, all'aeroporto e a Treporti, con le alternative, l'avviso «sbrigati» e la prima soluzione di domani se
  stasera non c'è più niente; solo a piedi; solo via acqua; in barca propria sui canali, con sensi unici e
  divieti del Testo Unico della circolazione acquea (indicativo, non per la navigazione).
- **Acqua alta**: marea misurata e prevista dal Centro Maree, MOSE, simulatore con le calli allagate stimate e le
  passerelle, percorso a piedi più asciutto.
- **Ricerca** di fermate, indirizzi, numeri civici («Cannaregio 3450») e servizi.
- **Per le AI**: server MCP, skill per Claude e API REST con gli stessi calcoli della mappa, sempre con le fonti
  da citare.

### Da dove vengono i dati

Ogni livello e ogni risposta delle API dichiara la natura del dato (`meta.kind`):

| Tipo | Significato | Esempi |
| :--- | :--- | :--- |
| `live` | misura letta dalla fonte a ogni intervallo di cache | marea e meteo CPSM, METAR, mezzi ACTV GPS, voli OpenSky |
| `schedule-simulation` | posizione calcolata dall'orario ufficiale, non GPS | vaporetti e bus ACTV senza GPS, Alilaguna, FlixBus |
| `static-reference` | dataset ufficiale o OpenStreetMap importato dalla pipeline | opere pubbliche, Wi-Fi, ARPAV, farmacie e fontanelle OSM |
| `official-plan` | piano ufficiale con tracciati indicativi | passerelle per l'acqua alta |
| `curated-reference` | elenco del progetto, da verificare presso la fonte citata | idroambulanze, campanili, ponti, isole di calore |
| `community` | mappatura collaborativa non verificata | telecamere OpenStreetMap |

Quando una fonte non risponde l'interfaccia mostra «n.d.»: nessun valore viene inventato. Licenze, privacy e
sicurezza di ogni fonte: [docs/note-legali-fonti.md](docs/note-legali-fonti.md); stato e licenza di ogni fonte
anche nella pagina `/sources` del sito.

### Struttura del progetto

```
vod-venice-open-data/
├── web/                     # Sito Next.js (App Router)
│   ├── src/app/             # Pagine (mappa, /features, /layers, /metrics, /sources, /mcp, /privacy) e API in api/
│   ├── src/components/      # Interfaccia; map/ contiene il disegno della mappa, un modulo per tema
│   ├── src/lib/             # Logica condivisa: simulazione, planner, rete dei mezzi, acqua alta, traduzioni (i18n/),
│   │                        # registro di fornitori, licenze e flussi di dati (provenance/)
│   ├── src/server/          # Accesso alle fonti esterne (sources/) e calcoli lato server (planning/)
│   ├── src/data/            # Dataset generati dalla pipeline
│   ├── public/data/         # File grandi con l'hash nel nome: orario, rete pedonale, canali, isole
│   └── e2e/                 # Test end-to-end Playwright
├── pipeline/                # Script Python che scaricano e preparano i dati (vod_http.py: richieste condivise)
├── skills/                  # Skill «venice-open-data» per Claude (CLI senza dipendenze) e generatore dello ZIP
├── docs/                    # Guide: aggiungere una fonte, server MCP, note legali, richieste di autorizzazione
└── .github/workflows/       # CI su ogni pull request e aggiornamento settimanale dei dati
```

### Avvio in locale

Servono Node.js 22 e, per la pipeline, Python 3.12.

```bash
npm ci
npm run dev                  # http://localhost:3000
```

Nessuna variabile è obbligatoria; quelle facoltative (chiavi aisstream e OpenSky, limiti delle API) sono in
`web/.env.example`.

Verifica completa, la stessa della CI:

```bash
npm run typecheck && npm run lint && npm test && npm run build
cd web && npx playwright install chromium && npx playwright test && cd ..
pip install -r pipeline/requirements-dev.txt && python -m pytest -q pipeline/tests skills/tests
```

### Aggiornare i dati (pipeline)

I dataset sono versionati in `web/src/data/`, `web/public/data/` e in alcuni moduli di `web/src/lib/`
(`*-data.ts`). Il workflow `.github/workflows/refresh-data.yml` li rigenera ogni lunedì e apre una pull request.
Ogni script è indipendente dagli altri, ritenta con attese crescenti e non sovrascrive i dati se la fonte
risponde in modo incompleto. Dalla cartella `pipeline/`:

| Script | Dati |
| :--- | :--- |
| `download_gtfs.py` + `export_simulation_data.py` | orario ACTV (GTFS, CC BY): simulazione dei mezzi, indice delle corse, fermate bus |
| `import_alilaguna_gtfs.py` | orario Alilaguna (GTFS dell'operatore) |
| `import_flixbus.py` | corse FlixBus che passano per l'area di Venezia (GTFS FlixMobility, ODbL) |
| `import_opere_pubbliche.py` | Elenco Annuale dei Lavori del Comune (dati.venezia.it), con geocodifica approssimata |
| `import_bdap_opere.py` | Monitoraggio Opere Pubbliche BDAP (MEF-RGS), da lanciare dopo il precedente |
| `import_wifi_hotspots.py` | hotspot Wi-Fi del Comune |
| `import_arpav_air.py`, `import_arpav_pollen.py`, `import_arpav_lagoon.py` | ARPAV: medie annue dell'aria, pollini, sonde della laguna e balneazione |
| `import_istat_census.py` | Censimento ISTAT 2021 per sestiere e isola (circa 330 MB, solo a ogni nuova edizione) |
| `import_cruscotto_italia.py` | profilo dei comuni della laguna (Cruscotto Italia, AgID) |
| `import_cciaa_turismo.py` | arrivi, presenze e residenti (Camera di Commercio) |
| `import_agcom_fiber.py` | copertura della rete fissa (AGCOM BroadbandMap) |
| `import_osm_pharmacies.py`, `import_osm_defibrillators.py`, `import_osm_surveillance.py` | farmacie, defibrillatori, telecamere (OpenStreetMap) |
| `import_osm_fountains.py` + `enrich_fountains.py`, `import_venice_tap_water.py` | fontanelle (OpenStreetMap e Venice Tap Water) |
| `import_osm_poi.py`, `import_osm_parks.py` | colonnine, parcheggi, vere da pozzo, alberi, ecocentri, biblioteche, parchi (OSM) |
| `import_osm_waterways.py` | briccole, segnalamenti e canali della laguna (OSM) |
| `import_osm_walk.py` | rete pedonale da Chioggia a Mestre, aeroporto e Treporti per il planner (OSM; anche `--file` da un estratto) |
| `import_osm_boat.py` | canali con le regole del Testo Unico per la barca propria |
| `import_osm_civici.py`, `import_osm_toponyms.py` | numeri civici e toponimi (calli, campi, ponti) per la ricerca e le ordinanze |

### API

Pubbliche e in sola lettura, con cache per ogni fonte e un limite di richieste per IP
(`API_RATE_LIMIT_PER_MINUTE`, predefinito 600 al minuto).

| Endpoint | Descrizione |
| :--- | :--- |
| `/api/come-arrivare?da=&a=[&data=&ora=&modo=piu_veloce\|a_piedi\|via_acqua\|barca&residente=1&marea=&tariffa=ordinaria\|venezia_unica\|abbonamento&consumo_lh=]` | come arrivare da A a B, con costo stimato dei biglietti, opzione più economica, carburante in barca, fonti e link alla mappa |
| `/api/partenze?fermata=[&data=&ora=&minuti=90]` | prossime partenze dall'orario ACTV e Alilaguna |
| `/api/acqua-alta?marea=[&luogo=&da=&a=]` | simulatore di acqua alta: città allagata, un luogo, percorso a piedi più asciutto |
| `/api/luoghi?q=` | come VOD riconosce un luogo (fermata, indirizzo, civico, aeroporto, coordinate) |
| `/api/indirizzi?q=`, `/api/civici?q=` | indirizzi (gazzettiere OSM) e numeri civici veneziani |
| `/api/aeroporto` | bus, Alilaguna e FlixBus dell'aeroporto nei prossimi 90 minuti |
| `/api/tide`, `/api/weather`, `/api/wind-field`, `/api/marine-sensors` | marea e previsione CPSM, METAR, vento previsto, piattaforma e segnalamenti |
| `/api/realtime/vehicles`, `/api/realtime/arrivals` | posizioni GPS dei mezzi ACTV con ritardo, arrivi previsti a una fermata |
| `/api/servizio`, `/api/velocita-orario` | servizio ACTV adesso per linea; tempi da orario contro limiti di velocità |
| `/api/stops`, `/api/fermate-bus`, `/api/avvisi-actv` | fermate ACTV, fermate bus, avvisi di servizio |
| `/api/alilaguna`, `/api/flixbus` | linee e corse Alilaguna e FlixBus (dall'orario) |
| `/api/flights`, `/api/ships` | voli (OpenSky) e navi (AIS): solo per la mappa, non ridistribuiti |
| `/api/satellites` | satelliti con orbite da CelesTrak |
| `/api/ordinanze` | ordinanze del Comune in vigore o in arrivo, con posizione e link all'atto |
| `/api/cantieri`, `/api/opere-bdap`, `/api/spatial/stops-near-cantieri?radius=` | opere pubbliche, Monitoraggio Opere Pubbliche, fermate vicine alle opere |
| `/api/emergency-health`, `/api/city-assets`, `/api/venice-assets`, `/api/heritage` | salute (farmacie, DAE, idroambulanze), servizi, colonnine e balneazione, patrimonio |
| `/api/cameras` | webcam ufficiali (solo link) e telecamere mappate su OpenStreetMap |
| `/api/passerelle` | percorsi su passerelle del piano del Comune |
| `/api/lagoon-network`, `/api/waterways`, `/api/nautical` | segnalamenti e canali OSM, limiti di velocità e ponti, servizi nautici |
| `/api/environment`, `/api/regional-data` | qualità dell'aria ARPAV e previsione Copernicus; pollini e sonde della laguna |
| `/api/parks`, `/api/sports`, `/api/fiber`, `/api/census`, `/api/lora-gateways` | verde, spazi sportivi (CAMPO e OSM), fibra AGCOM, censimento ISTAT, gateway LoRa |
| `/api/lagoon-morphology`, `/api/urban-microclimate`, `/api/pedestrian-flows`, `/api/rail-logistics` | elenchi del progetto da verificare: barene e subsidenza, isole di calore, varchi, treni e battelli di esempio |
| `/api/carburanti` | distributori di carburante nell'area della mappa con i prezzi comunicati al Ministero (MIMIT, IODL 2.0) |
| `/api/stats`, `/api/health` | indicatori aggregati; stato ed età di ogni fonte |
| `/api/datasets`, `/api/datasets/<id>`, `POST /api/mcp` | catalogo dei dataset, API REST equivalente e server MCP |

### Per le AI

- **Server MCP** in sola lettura: `https://venice-open-data.vercel.app/api/mcp`. Strumenti per i dati
  (`list_datasets`, `query_dataset`) e per i calcoli (`plan_trip`, `stop_departures`, `flood_simulation`,
  `airport_connections`, `find_place`). Istruzioni nella pagina `/mcp`, dettagli in [docs/MCP.md](docs/MCP.md).
- **Skill «venice-open-data»** per Claude: `skills/venice-open-data/`, ZIP in
  `web/public/downloads/venice-open-data-skill.zip` (dopo ogni modifica `python skills/build_skill_zip.py`).
- **`/llms.txt`**: descrizione del sito per gli assistenti.

### Contribuire

Proposte di fonti, segnalazioni e pull request sono benvenute: [CONTRIBUTING.md](CONTRIBUTING.md). Per aggiungere
una fonte o un livello c'è la guida [docs/AGGIUNGERE-UNA-FONTE.md](docs/AGGIUNGERE-UNA-FONTE.md); chi non
programma può usare il modulo «Proponi una fonte» negli issue. Sicurezza: [SECURITY.md](SECURITY.md).

### Fonti principali e licenze

ACTV / AVM (GTFS, CC BY; GTFS-RT nel catalogo «Open Data Real Time»), Comune di Venezia e Centro Maree
(dati.venezia.it; ai dati CPSM ridistribuiti VOD applica CC BY-SA 3.0), ARPAV, ISTAT, AGCOM (CC BY 4.0),
MEF-RGS BDAP (CC BY), MIMIT prezzi dei carburanti (IODL 2.0), OpenStreetMap contributors e FlixMobility (ODbL), Alilaguna S.p.A., Copernicus e
Open-Meteo, NOAA, CelesTrak, CAMPO (CC BY 4.0), The Things Network. OpenSky Network e aisstream.io sono
mostrati solo nella mappa e non ridistribuiti. L'elenco completo con licenze e stato è in `/sources` e in
[docs/note-legali-fonti.md](docs/note-legali-fonti.md).

### Licenza

- **Codice**: [GNU AGPL-3.0](LICENSE), © bitcoininvenice e i contributori di Venice Open Data. Chiunque può usarlo, studiarlo,
  modificarlo e ridistribuirlo gratuitamente; chi pubblica una versione modificata, anche solo come sito web,
  deve rendere disponibile il suo codice con la stessa licenza. Così VOD e ogni sua derivazione restano aperti.
  Chi pubblica una copia imposta `NEXT_PUBLIC_SOURCE_URL` sul proprio repository: il link «Codice» in fondo alla
  mappa e alle pagine punta lì.
- **Dati e testi creati da VOD** (elenchi curati, calcoli, descrizioni): [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.it),
  citando «Venice Open Data (VOD)».
- **Dati di terzi**: restano sotto la licenza della loro fonte, indicata in ogni livello, risposta API e in
  `/sources` (per esempio ODbL per OpenStreetMap, CC BY-SA 3.0 per i dati CPSM ridistribuiti).
- **Nessuna garanzia**: VOD è fornito «così com'è» (articoli 15 e 16 della AGPL-3.0). Dati e percorsi sono
  indicativi: non usarli per la navigazione né in emergenza, dove valgono le fonti ufficiali e il 112.

### Crediti

Ideato e sviluppato da **bitcoininvenice**, scrivendo il codice con [Claude Code](https://claude.com/claude-code)
(Anthropic). Grazie a chi pubblica i dati aperti usati da VOD e a chi contribuisce.

---

## English

**Venice Open Data (VOD)** is a map of Venice, its lagoon and mainland built only with open data: tide and high
water, ACTV waterbuses and buses, Alilaguna, services, environment, public works, City orders. Every value states
where it comes from and what it is: live measurement, forecast, position simulated from the timetable, official
dataset, OpenStreetMap or a project list to be verified.

Site: **https://venice-open-data.vercel.app** · independent, non-profit civic project. The interface is
available in Italian and English.

### What it does

- **Map** with more than 60 layers in groups (Transport, Lagoon, City) and ready-made scenarios. Active layers
  are kept in the URL (`?layers=farmacie,fontanelle`), so a map can be shared as a link.
- **Public transport**: ACTV waterbuses, buses, tram and People Mover simulated from the official timetable
  (GTFS) and merged with live GPS positions and delays; Alilaguna and FlixBus from their timetables; next and
  last departures at every stop; ACTV service notices.
- **Get there**: routes with every service (ACTV and Alilaguna, up to 4 with walking changes) from Chioggia to
  Mestre, the airport and Treporti, with alternatives, a "hurry" warning and tomorrow's first option when nothing
  runs tonight; walking only; water only; by own boat along the canals with the one-way rules and bans of the
  City's water-traffic code (indicative, not for navigation).
- **High water**: tide measured and forecast by the Tide Centre, MOSE, a simulator with estimated flooded
  streets and walkways, the driest walking route.
- **Search** for stops, addresses, Venetian house numbers ("Cannaregio 3450") and services.
- **For AI assistants**: MCP server, Claude skill and REST API with the same calculations as the map, always
  with the sources to cite.

### Data provenance

Every layer and API response declares the nature of the data (`meta.kind`): `live` (measured at each cache
interval), `schedule-simulation` (computed from the official timetable, not GPS), `static-reference` (official
dataset or OpenStreetMap imported by the pipeline), `official-plan` (official plan with indicative paths),
`curated-reference` (project list to be verified at the cited source), `community` (unverified crowd mapping).
When a source does not answer, the interface shows "n/a": no value is made up. Licences, privacy and security of
every source: [docs/note-legali-fonti.md](docs/note-legali-fonti.md) and the `/sources` page.

### Project structure

`web/` is the Next.js site (pages and API in `src/app`, map drawing in `src/components/map`, shared logic in
`src/lib`, with the single registry of data providers, licences and feeds in `src/lib/provenance`, source access and server-side calculations in `src/server`, generated datasets in `src/data` and
`public/data`, Playwright tests in `e2e`). `pipeline/` holds the Python scripts that download and prepare the
data, `skills/` the Claude skill, `docs/` the guides, `.github/workflows/` the CI and the weekly data refresh.

### Run locally

Node.js 22 (and Python 3.12 for the pipeline):

```bash
npm ci
npm run dev                  # http://localhost:3000
```

No environment variable is required; optional ones are listed in `web/.env.example`. Full check, the same as CI:

```bash
npm run typecheck && npm run lint && npm test && npm run build
cd web && npx playwright install chromium && npx playwright test && cd ..
pip install -r pipeline/requirements-dev.txt && python -m pytest -q pipeline/tests skills/tests
```

### Data refresh

Datasets are versioned in the repository and regenerated every Monday by `.github/workflows/refresh-data.yml`,
which opens a pull request. Each script in `pipeline/` (listed in the Italian table above) is independent, retries
with backoff and never overwrites data when the source answers with incomplete data.

### API

Public, read-only, cached per source and rate-limited per IP. The full list with descriptions is in the Italian
table above; the calculation endpoints are `/api/come-arrivare` (route from A to B, English aliases `from`, `to`,
`date`, `time`, `mode`), `/api/partenze` (`stop`), `/api/acqua-alta` (`levelCm`, `place`) and `/api/luoghi`
(`q`). Every calculation response includes `sources` and a `vodUrl` link to the same result on the map.

### For AI assistants

- **MCP server** (read-only): `https://venice-open-data.vercel.app/api/mcp`, with data tools (`list_datasets`,
  `query_dataset`) and calculation tools (`plan_trip`, `stop_departures`, `flood_simulation`,
  `airport_connections`, `find_place`). Setup instructions on `/mcp`, details in [docs/MCP.md](docs/MCP.md).
- **Claude skill "venice-open-data"**: `skills/venice-open-data/`, ZIP at `/downloads/venice-open-data-skill.zip`.
- **`/llms.txt`**: site description for assistants.

### Contributing

Source proposals, bug reports and pull requests are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md) and the
step-by-step guide [docs/AGGIUNGERE-UNA-FONTE.md](docs/AGGIUNGERE-UNA-FONTE.md) (in Italian, like the code
comments). If you do not code, use the "Proponi una fonte" (propose a source) issue form. Security issues:
[SECURITY.md](SECURITY.md).

### Main sources and licences

ACTV / AVM (GTFS, CC BY; GTFS-RT listed as "Open Data Real Time"), City of Venice and Tide Centre (CPSM data
redistributed by VOD under CC BY-SA 3.0), ARPAV, ISTAT, AGCOM (CC BY 4.0), MEF-RGS BDAP (CC BY), MIMIT fuel prices (IODL 2.0),
OpenStreetMap contributors and FlixMobility (ODbL), Alilaguna S.p.A., Copernicus and Open-Meteo, NOAA,
CelesTrak, CAMPO (CC BY 4.0), The Things Network. OpenSky Network and aisstream.io data are shown on the map only
and never redistributed. Full list with licences and status on `/sources`.

### Licence

- **Code**: [GNU AGPL-3.0](LICENSE), © bitcoininvenice and Venice Open Data contributors. Anyone may use, study, modify and
  redistribute it for free; whoever publishes a modified version, even only as a website, must make its source
  available under the same licence, so VOD and every derivative stay open. Forks set `NEXT_PUBLIC_SOURCE_URL` to
  their own repository: the "Code" link at the bottom of the map and pages points there.
- **Data and texts created by VOD** (curated lists, calculations, descriptions): [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/),
  credited to "Venice Open Data (VOD)".
- **Third-party data** keep the licence of their source, stated in every layer, API response and on `/sources`
  (e.g. ODbL for OpenStreetMap, CC BY-SA 3.0 for redistributed CPSM data).
- **No warranty**: VOD is provided "as is" (sections 15 and 16 of the AGPL-3.0). Data and routes are indicative:
  do not use them for navigation or in emergencies, where official sources and 112 apply.

### Credits

Created and developed by **bitcoininvenice**, writing the code with [Claude Code](https://claude.com/claude-code)
(Anthropic). Thanks to everyone who publishes the open data VOD uses and to every contributor.
