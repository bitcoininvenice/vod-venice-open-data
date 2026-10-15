# Server MCP di VOD

VOD espone i propri dati agli assistenti AI con il [Model Context Protocol](https://modelcontextprotocol.io), in sola lettura.

- **Endpoint:** `POST https://venice-open-data.vercel.app/api/mcp` (Streamable HTTP, stateless, risposte JSON), con alias `POST /mcp` (il `GET /mcp` resta la pagina di istruzioni). Compatibile anche con i client della generazione precedente (`legacy: 'stateless'`).
- **API REST equivalente:** `GET /api/datasets` e `GET /api/datasets/<id>` (limit fino a 100) per script e scaricamenti in blocco.
- **Skill per Claude:** `skills/venice-open-data/` (SKILL.md, riferimenti, CLI `scripts/vod.py`), pubblicata come `/downloads/venice-open-data-skill.zip`.
- **Istruzioni per gli utenti:** pagina `/mcp` (Claude, ChatGPT, Claude Code, Cursor/VS Code).
- **Descrizione per AI:** `/llms.txt`, generato dal catalogo.

## Superficie

| Elemento | Descrizione |
|---|---|
| Tool `list_datasets` | Catalogo: id, natura del dato (`live`, `forecast`, `simulated`, `dataset`, `osm`, `curated`), fonte, licenza, filtro geografico, avvertenze |
| Tool `query_dataset` | `dataset` (enum), `text` (2-80 caratteri), `near` (lat/lon nell'area di Venezia, raggio 10 m – 20 km), `limit` (1-50), `offset` |
| Tool `plan_trip` | Come arrivare da A a B: `from`, `to` (fermata, indirizzo, civico, «aeroporto», `lat,lon`), `date`, `time`, `mode` (`fastest`, `walk`, `water`, `private`), `resident`, `tideCm`. Stesso motore della mappa: tutti i mezzi ACTV e Alilaguna, fino a 4, alternative, «di corsa», prima soluzione di domani; barca privata con le regole del Testo Unico |
| Tool `stop_departures` | Prossime partenze da una fermata (orario ACTV e Alilaguna), `minutes` 10-240, prossima corsa se non ce ne sono |
| Tool `flood_simulation` | Acqua alta a `levelCm` (o la misura attuale): centro storico allagato (tabella CPSM), sirene, MOSE, passerelle, un luogo (`place`), il percorso a piedi più asciutto (`from`, `to`) |
| Tool `airport_connections` | Bus, Alilaguna e FlixBus dell'aeroporto nei prossimi 90 minuti |
| Tool `find_place` | Come VOD riconosce un luogo e le fermate con nome simile |
| Resource `vod://datasets` | Copia JSON del catalogo |
| Resource `vod://related-mcp-services` | Server MCP complementari (Cruscotto Italia di AgID), mai interrogati da VOD: niente proxy, niente fusione automatica dei dati |
| Prompt | `marea_oggi`, `servizi_vicini`, `come_arrivare`, `ambiente_laguna` |

Ogni risposta riporta fonte, licenza, natura del dato, avvertenze, data di lettura e i totali (`total`, `matched`, `returned`). Le risposte oltre 120.000 caratteri vengono ridotte e segnalate con `truncatedForSize`.

Gli strumenti di calcolo rispondono con `sources` (solo le fonti usate davvero, con licenza e link), `caveat` e `vodUrl`: il link apre la mappa di VOD con lo stesso risultato (planner già compilato, simulatore al livello indicato), così chi risponde può citare la fonte e farla verificare. Le stesse funzioni sono API REST: `/api/come-arrivare`, `/api/partenze`, `/api/acqua-alta`, `/api/luoghi`, `/api/aeroporto`. Codice in `web/src/server/planning/` (luoghi, contesto di giorno/ora/marea, servizi).

## Architettura

- `web/src/lib/mcp/catalog.ts`: metadati dei dataset (usati anche dalla pagina `/mcp` e da `/llms.txt`).
- `web/src/lib/mcp/loaders.ts`: per ogni dataset richiama l'endpoint del sito già esistente: stessa cache, stessa logica, nessuna copia dei dati.
- `web/src/lib/mcp/query.ts`: filtri e limiti, funzioni pure testate offline.
- `web/src/lib/mcp/server.ts`: registrazione di tool, resource e prompt (SDK ufficiale `@modelcontextprotocol/server`).
- `web/src/app/api/mcp/route.ts`: handler HTTP, CORS aperto (dati pubblici, nessun cookie), 60 richieste al minuto per client (limitatore condiviso `server/rateLimit.ts`, oltre al limite generale di `proxy.ts`), al massimo 8 richieste in parallelo per istanza (poi 503 con `Retry-After`), corpo massimo di 256 KB; ogni lettura di dataset ha un tempo massimo di 12 secondi.
- `web/src/lib/site.ts`: indirizzo pubblico usato da guida, llms.txt e skill (mai localhost).

## Aggiungere un dataset

1. Aggiungere il descrittore in `catalog.ts` (id stabile, natura, fonte, licenza, avvertenze).
2. Aggiungere il loader in `loaders.ts`, riusando l'endpoint esistente.
3. I test verificano che catalogo e loader coincidano; l'e2e esegue `initialize`, `tools/list` e `tools/call`.

## Buone pratiche per chi integra

Riprese da Cruscotto Italia e DoveVannoINostriSoldi: User-Agent riconoscibile; dopo 429/503 rispettare `Retry-After` con attese crescenti; per volumi alti usare l'API REST invece di tante chiamate MCP; per la disponibilità delle fonti usare `/api/health`.

## Sicurezza e privacy

- Nessuno strumento scrive dati, avvia aggiornamenti o accetta URL, SQL, percorsi di file o nomi di funzione.
- Gli input sono enum o campi con lunghezza e intervalli limitati.
- VOD riceve solo i parametri delle ricerche, non le conversazioni, e non li archivia.
