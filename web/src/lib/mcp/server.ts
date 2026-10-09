import 'server-only';
import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { MCP_DATASETS, MCP_DATASET_IDS } from './catalog';
import { MCP_LOADERS } from './loaders';
import { applyQuery } from './query';

const INSTRUCTIONS = `VOD – Venice Open Data espone in sola lettura dati pubblici su Venezia e la laguna: marea, meteo, aria, pollini, laguna, trasporti, servizi e patrimonio.
Usa prima list_datasets per vedere cosa c'è, poi query_dataset con filtri piccoli (limit basso, near per una zona, text per un nome).
Ogni risposta indica la natura del dato (live, forecast, simulated, dataset, osm, curated), la fonte, la licenza e le avvertenze: riportale all'utente.
Non presentare previsioni come misure né elenchi curati come dati ufficiali. Coordinate WGS84; Piazza San Marco è circa lat 45.4341, lon 12.3388.`;

const DATASETS_URI = 'vod://datasets';

function textResult(payload: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(payload) }] };
}

/** Nuova istanza per ogni richiesta (server stateless). */
export function createVodMcpServer(): McpServer {
  const server = new McpServer({ name: 'vod-venice-open-data', version: '1.0.0' }, { instructions: INSTRUCTIONS });

  server.registerTool(
    'list_datasets',
    {
      title: 'Elenca i dataset di VOD',
      description: 'Catalogo dei dataset su Venezia e la laguna: id, natura del dato, fonte, licenza, se accetta il filtro geografico e avvertenze.',
      annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true },
    },
    async () => textResult({ datasets: MCP_DATASETS }),
  );

  server.registerTool(
    'query_dataset',
    {
      title: 'Interroga un dataset di VOD',
      description:
        'Restituisce le voci di un dataset con filtri opzionali: text (cerca nei campi testuali), near (lat, lon, raggio in metri: ordina per distanza) e paginazione (limit massimo 50).',
      inputSchema: z.object({
        dataset: z.enum(MCP_DATASET_IDS).describe('id da list_datasets'),
        text: z.string().min(2).max(80).optional().describe('testo da cercare, es. "Rialto" o "FTTH"'),
        near: z
          .object({
            lat: z.number().min(45.0).max(45.8),
            lon: z.number().min(11.9).max(12.8),
            radiusMeters: z.number().int().min(10).max(20000),
          })
          .optional()
          .describe('solo per dataset con geo=true'),
        limit: z.number().int().min(1).max(50).default(10),
        offset: z.number().int().min(0).max(100000).default(0),
      }),
      annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true },
    },
    async ({ dataset, text, near, limit, offset }) => {
      const meta = MCP_DATASETS.find((d) => d.id === dataset)!;
      if (near && !meta.geo) {
        return { ...textResult({ error: 'near_not_supported', message: `Il dataset ${dataset} non ha coordinate: usa text o la paginazione.` }), isError: true };
      }
      try {
        const loaded = await MCP_LOADERS[dataset]();
        const result = applyQuery(loaded.items, { text, near, limit, offset });
        return textResult({
          dataset: { id: meta.id, title: meta.title, kind: meta.kind, source: meta.source, license: meta.license, caveat: meta.caveat },
          context: loaded.meta ?? null,
          ...result,
          retrievedAt: new Date().toISOString(),
        });
      } catch {
        return { ...textResult({ error: 'source_unavailable', message: 'La fonte non è raggiungibile in questo momento.' }), isError: true };
      }
    },
  );

  server.registerResource(
    'datasets',
    DATASETS_URI,
    { title: 'Catalogo dei dataset VOD', description: 'Copia JSON del catalogo restituito da list_datasets.', mimeType: 'application/json' },
    async () => ({ contents: [{ uri: DATASETS_URI, mimeType: 'application/json', text: JSON.stringify({ datasets: MCP_DATASETS }) }] }),
  );

  const prompt = (text: string) => async () => ({ messages: [{ role: 'user' as const, content: { type: 'text' as const, text } }] });
  server.registerPrompt(
    'marea_oggi',
    { title: 'Com’è la marea oggi a Venezia?', description: 'Livello misurato, previsione e soglie di allerta.' },
    prompt('Usa VOD (dataset tide) per dirmi il livello di marea attuale a Punta della Salute, la previsione dei prossimi estremali con la data di emissione e se è prevista acqua alta. Distingui misura e previsione.'),
  );
  server.registerPrompt(
    'servizi_vicini',
    { title: 'Servizi vicino a me', description: 'Farmacie, defibrillatori e fontanelle vicino a un punto.' },
    prompt('Usa VOD per trovare entro 500 metri da Rialto (lat 45.4380, lon 12.3358) le farmacie, i defibrillatori e le fontanelle più vicini. Indica la fonte di ciascun dato e cosa va verificato.'),
  );
  server.registerPrompt(
    'ambiente_laguna',
    { title: 'Stato dell’ambiente in laguna', description: 'Aria, pollini e acqua della laguna.' },
    prompt('Usa VOD (air_quality, pollen, lagoon_probes) per riassumere qualità dell’aria, pollini e condizioni dell’acqua della laguna. Separa misure, medie annue e previsioni di modello.'),
  );

  return server;
}
