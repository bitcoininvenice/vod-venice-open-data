---
name: vod-aggiungi-fonte
description: Procedura completa per aggiungere o aggiornare una fonte di dati in Venice Open Data (pipeline, API, layer della mappa, schede, traduzioni, catalogo /layers, server MCP e skill, /sources, workflow, README, test). Usala ogni volta che si integra un nuovo dataset, si sostituiscono valori curati con dati reali o si cambia una fonte esistente.
---

# Aggiungere una fonte a VOD

La guida pubblica e completa per chi contribuisce è `docs/AGGIUNGERE-UNA-FONTE.md`: tenerla allineata a
questi passaggi quando cambia la procedura (un test verifica che i percorsi citati esistano).

Regola generale: **fonte, licenza e natura del dato sempre dichiarate** (live, previsione, simulato,
dataset ufficiale, OpenStreetMap, elenco curato). Mai presentare valori di esempio come misure.
Completare **tutti** i passaggi nello stesso giro e verificare tutto prima del commit.

## 1. Verifica della fonte
- Licenza aperta esplicita (CC BY, ODbL, IODL…) e testo dell'attribuzione richiesta (logo, formula).
- Download reale: provare il file o l'API; annotare formato, sistema di coordinate, frequenza di aggiornamento.
- Se la fonte ha limiti d'uso: User-Agent `VOD-VeniceOpenData/1.0 (...)`, poche richieste, attesa con `Retry-After` dopo 429.

## 1b. Registro delle fonti (`web/src/lib/provenance/`)
- Fornitore nuovo in `providers.ts` (nome, sito, portale, `LicenseId`, attribuzione); licenza nuova in `licenses.ts`.
- Flusso controllato da `/api/health` e mostrato in `/sources` in `feeds.ts`.
- Mai scrivere a mano link del fornitore o testo della licenza: `providerMeta`, `providerLicense`,
  `providersLicense`, `providerCitation` (un test lo verifica).

## 2. Pipeline (`pipeline/import_<nome>.py`)
- Solo libreria standard se possibile (eventuali dipendenze in `pipeline/requirements.txt`).
- Rete sempre da `pipeline/vod_http.py`: `fetch_bytes`/`fetch_text`/`fetch_json` (User-Agent del progetto, `retries`/`backoff`,
  `Retry-After` dopo 429), `overpass(query)` con istanze di riserva, `nominatim(endpoint, params)` a 1 richiesta al secondo.
  Niente `urllib.request` diretto nelle pipeline.
- Controllo di completezza: se i dati sono incompleti **non** sovrascrivere il file.
- Output in `web/src/data/<nome>.json` con `generatedAt`, `source`, `sourceUrl`, `license`.
- Se il sito della fonte è instabile: opzione per file locali (`--file`).
- Test in `pipeline/tests/test_pipeline.py` sulle funzioni pure (parsing, aggregazione).
- Aggiungere il comando a `.github/workflows/refresh-data.yml` (con `|| echo "::warning::..."`) e al README.

## 3. Dati nel sito
- Tipi in `web/src/lib/types.ts`; logica condivisa in `web/src/lib/<nome>.ts` (i JSON grandi restano lato server).
- API in `web/src/app/api/<nome>/route.ts` oppure dentro una route esistente; campo `meta` con `...providerMeta('<fornitore>')`.
- Dati curati sostituiti: rimuovere i valori inventati; tenere le voci curate solo se senza riscontro (`curatedNotInOsm`) e segnarle "da verificare".

## 4. Mappa e interfaccia
- Layer nuovo: chiave in `web/src/lib/urlLayers.ts` (tipo, slug, alias); voce nel pannello in `web/src/lib/layerGroups.ts`
  (gruppo, sottogruppo, etichetta i18n, icona, colore: pannello, ricerca, contatori e legenda si aggiornano da soli);
  dati in `web/src/lib/cityData.ts`: campo in `CityData` + valore iniziale in `INITIAL_CITY_DATA`, risorsa in `RESOURCES`
  (URL, `pick` dei campi dalla risposta, `refreshMs` se è un dato live), condizione in `neededResources` (si carica solo
  quando il layer, la ricerca o una scheda lo richiedono, mai all'avvio) e conteggio in `layerCounts`. `useCityData` e
  `MapEngine` non vanno toccati: il disegno riceve `rc.<campo>` e `rc.show<Layer>` dal contesto del frame;
  nuove API: durata della cache del browser in `next.config.ts` (`browserCache`);
  disegno in `web/src/components/map/*Layer*.ts` (le etichette passano dalla guardia anti-sovrapposizione `map/labelGuard.ts`);
  clic: una riga nella tabella di `handlePointClick` in `MapEngine.tsx` (`target({ items, radius, select: feature('<tipo>') })`,
  vedi `map/hitTest.ts`), nella posizione che ne decide la priorità.
- Preset (`PRESET_LAYERS` in `web/src/lib/layerState.ts`): scenari da 3-6 layer, mai layer `curated` (un test lo verifica).
- Scheda nella scheda informativa unica (`components/ui/InfoPanel.tsx`): tipo in `VeniceFeatureDetailModal.tsx`
  (+ `FEATURE_LAYER` per natura del dato e fonte nel piede, nota di provenienza con `FeatureProvenance`, `OWN_PROVENANCE`, `CURATED_TYPES`);
  oggetti in movimento in `MapObjectPanel.tsx`. Niente nuovi modali o tooltip flottanti sulla mappa; le finestre a tutto
  schermo (ricerca, esportazione, tutorial) usano `components/ui/Modal.tsx`.
- Layer animati: aggiungerli a `hasAnimatedLayers` in `MapEngine.tsx`.

## 5. Traduzioni
- Ogni testo visibile passa da `t()`: chiavi IT/EN in `web/src/lib/i18n/ui.it.ts` e `ui.en.ts` (stesse chiavi), etichette della mappa in `ui.mapLabels`.
- Nessun testo fisso in JSX, `fillText` o API destinate all'interfaccia.

## 6. Cataloghi e documentazione
- Voce in `web/src/lib/layerCatalog.ts` (stesso id dello slug; un test lo verifica) con descrizione e note tecniche oneste.
- Dataset MCP: descrittore in `web/src/lib/mcp/catalog.ts` + loader in `web/src/lib/mcp/loaders.ts` (riusa la route; un test verifica l'allineamento).
- Se cambia l'uso dei dati per le AI: aggiornare `skills/venice-open-data/` e rigenerare lo ZIP con `python skills/build_skill_zip.py`.
- Fonte in `/sources`: flusso in `web/src/lib/provenance/feeds.ts` (chiavi `name_` e `meta_` nelle traduzioni) e `assess('<flusso>', …)` in `web/src/app/api/health/route.ts`.
- README (struttura, comandi, tabella API) e, se serve, `docs/`.

## 7. Verifica completa (sempre, prima del commit)
```bash
cd web && npx tsc --noEmit -p . && npm run lint && npx vitest run && npm run build && PW_CHANNEL=chrome npx playwright test
python -m pytest -q pipeline/tests skills/tests
```
Aggiungere almeno un test unitario e un e2e sull'API nuova. Le pagine nel browser le controlla l'utente.

## 8. Commit
Messaggio su una riga di titolo + elenco puntato, in italiano, con `Co-Authored-By`. Il push lo fa l'utente.
