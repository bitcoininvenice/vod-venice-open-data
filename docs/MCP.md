# Server MCP di VOD

VOD espone i propri dati agli assistenti AI con il [Model Context Protocol](https://modelcontextprotocol.io), in sola lettura.

- **Endpoint:** `POST /api/mcp` (Streamable HTTP, stateless, risposte JSON). Compatibile anche con i client della generazione precedente (`legacy: 'stateless'`).
- **Istruzioni per gli utenti:** pagina `/mcp` (Claude, ChatGPT, Claude Code, Cursor/VS Code).
- **Descrizione per AI:** `/llms.txt`, generato dal catalogo.

## Superficie

| Elemento | Descrizione |
|---|---|
| Tool `list_datasets` | Catalogo: id, natura del dato (`live`, `forecast`, `simulated`, `dataset`, `osm`, `curated`), fonte, licenza, filtro geografico, avvertenze |
| Tool `query_dataset` | `dataset` (enum), `text` (2-80 caratteri), `near` (lat/lon nell'area di Venezia, raggio 10 m – 20 km), `limit` (1-50), `offset` |
| Resource `vod://datasets` | Copia JSON del catalogo |
| Prompt | `marea_oggi`, `servizi_vicini`, `ambiente_laguna` |

Ogni risposta riporta fonte, licenza, natura del dato, avvertenze, data di lettura e i totali (`total`, `matched`, `returned`). Le risposte oltre 120.000 caratteri vengono ridotte e segnalate con `truncatedForSize`.

## Architettura

- `web/src/lib/mcp/catalog.ts`: metadati dei dataset (usati anche dalla pagina `/mcp` e da `/llms.txt`).
- `web/src/lib/mcp/loaders.ts`: per ogni dataset richiama l'endpoint del sito già esistente: stessa cache, stessa logica, nessuna copia dei dati.
- `web/src/lib/mcp/query.ts`: filtri e limiti, funzioni pure testate offline.
- `web/src/lib/mcp/server.ts`: registrazione di tool, resource e prompt (SDK ufficiale `@modelcontextprotocol/server`).
- `web/src/app/api/mcp/route.ts`: handler HTTP, CORS aperto (dati pubblici, nessun cookie), limite di 60 richieste al minuto per client e corpo massimo di 256 KB.

## Aggiungere un dataset

1. Aggiungere il descrittore in `catalog.ts` (id stabile, natura, fonte, licenza, avvertenze).
2. Aggiungere il loader in `loaders.ts`, riusando l'endpoint esistente.
3. I test verificano che catalogo e loader coincidano; l'e2e esegue `initialize`, `tools/list` e `tools/call`.

## Sicurezza e privacy

- Nessuno strumento scrive dati, avvia aggiornamenti o accetta URL, SQL, percorsi di file o nomi di funzione.
- Gli input sono enum o campi con lunghezza e intervalli limitati.
- VOD riceve solo i parametri delle ricerche, non le conversazioni, e non li archivia.
