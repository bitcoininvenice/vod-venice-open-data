# Aggiungere una fonte o un livello a VOD

Questa guida spiega come proporre e integrare una nuova fonte di dati: un file aperto, un'API in tempo reale, un
orario, un elenco compilato a mano. Non serve conoscere tutto il codice: basta seguire il caso che corrisponde
alla tua fonte. Se non programmi, puoi comunque **proporre la fonte** con il modulo
«Proponi una fonte» negli issue di GitHub: la valutiamo noi.

## 0. Le regole, prima del codice

VOD mostra solo dati di cui si conosce l'origine e il diritto d'uso. Una pull request che non le rispetta non
viene unita, anche se i test passano.

1. **Licenza verificata.** Indica la licenza della fonte con il link alla pagina dove è scritta (CC BY, CC BY-SA,
   ODbL, IODL…). Se la fonte non dichiara una licenza, scrivilo: di solito la fonte si integra solo dopo aver
   chiesto il permesso al titolare (vedi `docs/richieste-autorizzazione.md`), oppure solo nella mappa senza
   ridistribuirla tramite API, server MCP o esportazioni.
2. **Natura del dato dichiarata.** Ogni valore è una di queste cose, e la scheda lo dice:
   misura in tempo reale, previsione, posizione simulata da un orario, dataset ufficiale, OpenStreetMap,
   elenco curato «da verificare». Mai presentare una stima come una misura.
3. **Nessun dato personale.** Niente nomi di privati, numeri di telefono personali, targhe, identificativi di
   dispositivi. Per gli atti (ordinanze) si escludono quelli che riguardano persone.
4. **Rispetto della fonte.** Nessun aggiramento di filtri anti-bot o di login; User-Agent riconoscibile
   (`VOD-VeniceOpenData/1.0`); poche richieste; dopo un `429` si aspetta quanto indicato (`Retry-After`).
5. **Una sola chiamata condivisa per fonte, dentro la quota.** Le API si interrogano solo dal server, con una
   cache adeguata ai limiti del fornitore; il browser non contatta mai la fonte direttamente.
6. **Citazione visibile.** Fonte e licenza nella scheda del livello, nel catalogo `/layers` e in `/sources`.

Le note legali di ogni fonte già integrata sono in `docs/note-legali-fonti.md`.

## 1. Che tipo di fonte è?

| Tipo di fonte | Come si integra | Esempi già in VOD |
|---|---|---|
| **A. File aperto che cambia di rado** (CSV, GeoJSON, Overpass, dataset di un portale) | script Python in `pipeline/` che scrive un JSON in `web/src/data/`, aggiornato ogni settimana dal workflow | farmacie e defibrillatori OSM, opere pubbliche, censimento ISTAT |
| **B. API in tempo reale** (marea, posizioni, meteo) | route lato server in `web/src/app/api/` con cache, che chiama la fonte | marea CPSM (`/api/tide`), mezzi ACTV GPS, voli OpenSky |
| **C. Orario** (GTFS) | pipeline che prepara l'orario, posizioni simulate nella mappa | ACTV, Alilaguna, FlixBus |
| **D. Elenco compilato a mano** | file curato nel codice, segnato «da verificare», con la fonte di ogni voce | idroambulanze, campanili pendenti |
| **E. Solo una proposta** | issue «Proponi una fonte» con link, licenza e cosa mostrare | per chi non programma |

## 2. Preparare l'ambiente

```bash
npm ci                                   # dipendenze del sito (Next.js in web/)
npm run dev                              # http://localhost:3000
python -m venv .venv && . .venv/bin/activate
pip install -r pipeline/requirements-dev.txt
```

Verifica completa, la stessa della CI su ogni pull request:

```bash
npm run typecheck && npm run lint && npm test && npm run build
cd web && npx playwright install chromium && npx playwright test
python -m pytest -q pipeline/tests skills/tests
```

## 3. Caso A: file aperto con una pipeline

1. **Script** `pipeline/import_<nome>.py`:
   - scarica con le funzioni di `pipeline/vod_http.py` (`fetch_json`, `fetch_text`, `fetch_bytes`, `overpass`):
     tentativi con attese crescenti, User-Agent e `Retry-After` già gestiti;
   - accetta `--file` per lavorare su una copia locale quando la fonte è instabile;
   - **controllo di completezza**: se i dati sono pochi o malformati, esce con errore e **non sovrascrive** il file;
   - scrive `web/src/data/<nome>.json` con `generatedAt`, `source`, `sourceUrl`, `license`, `attribution` e i dati.
   Modello semplice da copiare: `pipeline/import_osm_pharmacies.py`.
2. **Test** delle funzioni di trasformazione in `pipeline/tests/test_pipeline.py` (senza rete).
3. **Aggiornamento automatico**: aggiungi il comando a `.github/workflows/refresh-data.yml` con
   `|| echo "::warning::…"`, così un errore della fonte non blocca le altre.
4. **API**: una route in `web/src/app/api/<nome>/route.ts` che legge il JSON e risponde con i dati e un campo
   `meta` (`source`, `sourceUrl`, `license`, `generatedAt`, `note`). I file grandi restano lato server.

## 4. Caso B: API in tempo reale

1. **Parser** in `web/src/server/sources/<nome>.ts`: trasforma la risposta della fonte nel formato di VOD e
   valida i campi (con `zod`). Funzioni pure, con test `*.test.ts` accanto.
2. **Route** in `web/src/app/api/<nome>/route.ts` che usa `fetchUpstream` di `web/src/server/upstream.ts`
   (timeout, User-Agent, cache di Next con `revalidate`). Scegli `revalidate` in base alla **quota** della fonte:
   con N richieste al giorno consentite, la cache deve essere almeno 86400 / N secondi. Se più route usano la
   stessa fonte, crea un client condiviso come `web/src/server/sources/openskyClient.ts`.
3. **Chiavi**: solo in variabili d'ambiente lette dal server, documentate in `web/.env.example` senza valore.
   Mai nel codice, nei log o nelle risposte.
4. **Stato della fonte**: una riga in `web/src/app/api/health/route.ts`, così `/sources` mostra se risponde ed è
   aggiornata.

## 5. Caso C: orari (GTFS)

Gli orari diventano posizioni simulate lungo il percorso, dichiarate «simulate dall'orario, non GPS». Modelli:
`pipeline/import_alilaguna_gtfs.py` (orario intero) e `pipeline/import_flixbus.py` (solo le corse che passano
per l'area della mappa, ritagliate). Se la linea va nel planner «Come arrivare», le corse si aggiungono in
`web/src/lib/transitNetwork.ts`.

## 6. Caso D: elenco curato

Va bene solo quando non esiste un dato aperto. Ogni voce indica la sua fonte (pagina dell'ente, atto, sito
ufficiale); il livello ha `regime: 'curated'` nel catalogo e la scheda mostra «elenco del progetto, da
verificare». Se poi compare un dato ufficiale o su OpenStreetMap, l'elenco curato si sostituisce.

## 7. Il livello sulla mappa

| Cosa | Dove |
|---|---|
| Chiave del livello, slug nell'URL (es. `?layers=farmacie`) e alias | `web/src/lib/urlLayers.ts` |
| Voce nel pannello dei livelli (gruppo, icona, colore) | `web/src/lib/layerGroups.ts` |
| Scheda del catalogo `/layers` (stesso id dello slug, natura del dato, fonte, note tecniche oneste) | `web/src/lib/layerCatalog.ts` |
| Caricamento dei dati **solo quando il livello è acceso** (URL, campi, conteggio) | `web/src/lib/cityData.ts` |
| Disegno | un file in `web/src/components/map/` (es. `cityLayers.ts`) e la chiamata in `web/src/components/MapEngine.tsx` |
| Clic sull'elemento | elenco dei bersagli in `web/src/components/MapEngine.tsx` |
| Scheda con la provenienza | `web/src/components/VeniceFeatureDetailModal.tsx` |
| Testi in italiano e inglese (stesse chiavi) | `web/src/lib/i18n/ui.it.ts` e `web/src/lib/i18n/ui.en.ts` |
| Livelli animati (che si muovono) | elenco in `web/src/components/MapEngine.tsx` |

Ogni testo visibile passa dalle traduzioni: niente testo fisso nel codice. Se il livello è in uno scenario
(Trasporti, Acqua alta…), si aggiunge in `web/src/lib/layerState.ts`, solo se il dato non è «da verificare».

## 8. Fonti, server MCP e skill

- **Pagina `/sources`**: voce in `web/src/app/sources/page.tsx` e testi `name_<id>` / `meta_<id>` nelle traduzioni.
- **Server MCP e API dei dataset** (assistenti AI): descrittore in `web/src/lib/mcp/catalog.ts` e loader in
  `web/src/lib/mcp/loaders.ts`, che riusa la route esistente. Solo se la licenza permette la ridistribuzione.
- **Skill**: se cambia come un'AI deve usare i dati, aggiorna `skills/venice-open-data/` e rigenera lo ZIP con
  `python skills/build_skill_zip.py`.
- **README**: struttura, comandi della pipeline e tabella delle API.

## 9. Test richiesti

- Funzioni di trasformazione: test unitari (Vitest per TypeScript, pytest per Python), anche per i casi senza
  dati o con dati malformati.
- API: almeno un test end-to-end in `web/e2e/smoke.spec.ts` che verifica forma della risposta, `meta` con
  fonte e licenza, errori espliciti.
- Livello: se ha un comportamento particolare (clic, filtri), un test end-to-end.

I test automatici controllano già che catalogo dei livelli, slug e dataset MCP siano allineati, e il controllo
dei tipi che le traduzioni inglesi abbiano le stesse chiavi di quelle italiane: se dimentichi una voce, la CI lo
segnala.

## 10. La pull request

Usa il modello che si apre con la pull request: chiede link alla licenza, natura del dato, dove appare la
citazione e i test. Una pull request alla volta per fonte. La verifica legale della fonte la fa il manutentore:
se la licenza non è chiara la pull request resta aperta finché non lo è.
