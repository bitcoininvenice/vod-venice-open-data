import 'server-only';
import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { MCP_DATASETS, MCP_DATASET_IDS, MCP_RELATED_SERVICES } from './catalog';
import { MCP_LOADERS } from './loaders';
import { applyQuery } from './query';
import { departuresService, findPlaceService, floodService, planTripService, type ServiceResult } from '@/server/planning/services';
import { GET as airportGET } from '@/app/api/aeroporto/route';

const INSTRUCTIONS = `VOD – Venice Open Data espone in sola lettura dati pubblici su Venezia e la laguna: marea, meteo, aria, pollini, laguna, trasporti, servizi e patrimonio.
Usa prima list_datasets per vedere cosa c'è, poi query_dataset con filtri piccoli (limit basso, near per una zona, text per un nome).
Ogni risposta indica la natura del dato (live, forecast, simulated, dataset, osm, curated), la fonte, la licenza e le avvertenze: riportale all'utente.
Non presentare previsioni come misure né elenchi curati come dati ufficiali. Coordinate WGS84; Piazza San Marco è circa lat 45.4341, lon 12.3388.
Oltre ai dataset, VOD calcola: plan_trip (come arrivare da A a B con tutti i mezzi ACTV e Alilaguna, a piedi o con la barca privata), stop_departures (prossime partenze da una fermata), flood_simulation (acqua alta a un livello: città allagata, un luogo, un percorso a piedi all'asciutto), airport_connections (bus, Alilaguna e FlixBus dell'aeroporto nei prossimi 90 minuti) e find_place (come VOD riconosce un luogo).
Ogni risposta di questi strumenti contiene sources (fonti con licenza e link) e vodUrl (lo stesso risultato sulla mappa di VOD): cita sempre le fonti e il link VOD all'utente.
Per indicatori socio-economici di altri comuni italiani esiste il server MCP di Cruscotto Italia (AgID): vedi vod://related-mcp-services. VOD non lo interroga per te.`;

const DATASETS_URI = 'vod://datasets';
const RELATED_URI = 'vod://related-mcp-services';
/** Tempo massimo per leggere un dataset: oltre si risponde con un errore esplicito invece di restare appesi. */
const LOAD_TIMEOUT_MS = 12_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
}

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
    async () => textResult({ datasets: MCP_DATASETS, relatedServices: MCP_RELATED_SERVICES }),
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
        const loaded = await withTimeout(MCP_LOADERS[dataset](), LOAD_TIMEOUT_MS);
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

  /** Risposta di uno strumento di calcolo: errore esplicito o JSON con fonti e link a VOD */
  const serviceResult = (r: ServiceResult) =>
    r.ok ? textResult({ ...r.body, retrievedAt: new Date().toISOString() }) : { ...textResult({ error: r.error, message: r.message }), isError: true };
  const run = async (fn: () => Promise<ServiceResult> | ServiceResult) => {
    try {
      return serviceResult(await withTimeout(Promise.resolve(fn()), LOAD_TIMEOUT_MS));
    } catch {
      return { ...textResult({ error: 'unavailable', message: 'Calcolo non disponibile in questo momento.' }), isError: true };
    }
  };
  const placeText = z.string().min(2).max(100);
  const dateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('YYYY-MM-DD, ora di Venezia; se manca oggi');
  const timeText = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional().describe('HH:MM, ora di Venezia; se manca adesso');

  server.registerTool(
    'plan_trip',
    {
      title: 'Come arrivare da A a B',
      description:
        'Itinerario da un luogo a un altro di Venezia e dintorni (da Chioggia a Mestre, aeroporto e Treporti) con tutti i mezzi ACTV (vaporetti, bus, tram, People Mover) e Alilaguna, fino a 4 mezzi con cambi a piedi, più le alternative con meno cambi; oppure solo a piedi, solo via acqua o con la barca privata (regole del Testo Unico della circolazione acquea). Luoghi: fermata, indirizzo, civico (Cannaregio 3450), «aeroporto» o «lat,lon». Con l\'acqua alta i tratti a piedi preferiscono le calli asciutte. Se stasera non c\'è più niente restituisce la prima soluzione di domani mattina.',
      inputSchema: z.object({
        from: placeText.describe('partenza'),
        to: placeText.describe('arrivo'),
        date: dateText,
        time: timeText,
        mode: z.enum(['fastest', 'walk', 'water', 'private']).default('fastest').describe('fastest: tutti i mezzi; walk: solo a piedi; water: solo mezzi d\'acqua; private: barca privata'),
        resident: z.boolean().default(false).describe('solo per private: residente in centro storico o isole, o concessionario di uno spazio acqueo (art. 18 Testo Unico)'),
        tideCm: z.number().min(-100).max(250).optional().describe('marea da simulare (cm sullo zero di Punta della Salute)'),
      }),
      annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true },
    },
    async ({ from, to, date, time, mode, resident, tideCm }) => run(() => planTripService({ from, to, date, time, mode, resident, tideCm })),
  );

  server.registerTool(
    'stop_departures',
    {
      title: 'Prossime partenze da una fermata',
      description: 'Partenze dall\'orario ufficiale ACTV (battelli, bus, tram, People Mover) e Alilaguna da una fermata nei prossimi minuti (default 90, max 240); se non ce ne sono, la prossima corsa (anche domani). Orario teorico senza ritardi.',
      inputSchema: z.object({
        stop: placeText.describe('nome della fermata, es. "Rialto", "Piazzale Roma", "Aeroporto"'),
        date: dateText,
        time: timeText,
        minutes: z.number().int().min(10).max(240).default(90),
      }),
      annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true },
    },
    async ({ stop, date, time, minutes }) => run(() => departuresService({ stop, date, time, minutes })),
  );

  server.registerTool(
    'flood_simulation',
    {
      title: 'Simulatore di acqua alta',
      description:
        'A un livello di marea (cm sullo zero di Punta della Salute; se manca, la misura attuale): percentuale stimata del centro storico allagato (tabella CPSM), sirene, MOSE, passerelle; se indicato un luogo, quota stimata del suolo e profondità; se indicati partenza e arrivo, il percorso a piedi più asciutto. Stima, non rilievo altimetrico.',
      inputSchema: z.object({
        levelCm: z.number().min(-100).max(250).optional(),
        place: placeText.optional(),
        from: placeText.optional(),
        to: placeText.optional(),
      }),
      annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true },
    },
    async ({ levelCm, place, from, to }) => run(() => floodService({ levelCm, place, from, to })),
  );

  server.registerTool(
    'airport_connections',
    {
      title: 'Collegamenti dell\'aeroporto Marco Polo',
      description: 'Partenze e arrivi dei prossimi 90 minuti all\'aeroporto di bus ACTV (5 Aerobus, 15, 45), barche Alilaguna e FlixBus, dagli orari ufficiali. Gli orari dei voli non sono dati aperti.',
      annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true },
    },
    async () =>
      run(async () => {
        const body = (await (await airportGET()).json()) as Record<string, unknown>;
        return { ok: true as const, body: { ...body, vodUrl: 'https://venice-open-data.vercel.app/?open=aeroporto' } };
      }),
  );

  server.registerTool(
    'find_place',
    {
      title: 'Trova un luogo',
      description: 'Come VOD riconosce un luogo (fermata, indirizzo, civico, aeroporto, lat,lon) e le fermate ACTV e Alilaguna con nome simile: utile prima di plan_trip o stop_departures.',
      inputSchema: z.object({ query: placeText }),
      annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true },
    },
    async ({ query }) => run(() => findPlaceService(query)),
  );

  server.registerResource(
    'datasets',
    DATASETS_URI,
    { title: 'Catalogo dei dataset VOD', description: 'Copia JSON del catalogo restituito da list_datasets.', mimeType: 'application/json' },
    async () => ({ contents: [{ uri: DATASETS_URI, mimeType: 'application/json', text: JSON.stringify({ datasets: MCP_DATASETS }) }] }),
  );

  server.registerResource(
    'related-mcp-services',
    RELATED_URI,
    { title: 'Server MCP complementari', description: 'Altri server MCP pubblici utili insieme a VOD. VOD non li interroga.', mimeType: 'application/json' },
    async () => ({ contents: [{ uri: RELATED_URI, mimeType: 'application/json', text: JSON.stringify({ services: MCP_RELATED_SERVICES }) }] }),
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
    'come_arrivare',
    { title: 'Come arrivo da un posto a un altro?', description: 'Itinerario con tutti i mezzi e le alternative.' },
    prompt('Usa VOD (plan_trip) per dirmi come arrivare dalla Ferrovia a Murano Colonna adesso, con le alternative con meno cambi. Indica orari, linee, tratti a piedi, le fonti e il link a VOD.'),
  );
  server.registerPrompt(
    'ambiente_laguna',
    { title: 'Stato dell’ambiente in laguna', description: 'Aria, pollini e acqua della laguna.' },
    prompt('Usa VOD (air_quality, pollen, lagoon_probes) per riassumere qualità dell’aria, pollini e condizioni dell’acqua della laguna. Separa misure, medie annue e previsioni di modello.'),
  );

  return server;
}
