import { MCP_DATASETS } from '@/lib/mcp/catalog';

// Descrizione del sito per gli assistenti AI (https://llmstxt.org), generata dal catalogo MCP: sempre allineata
export const dynamic = 'force-static';

const SITE = 'https://venice-open-data.vercel.app';

export function GET() {
  const lines = [
    '# VOD – Venice Open Data',
    '',
    '> Mappa e dati pubblici su Venezia e la laguna (marea, meteo, aria, pollini, laguna, trasporti, servizi, patrimonio) con fonte, licenza e natura del dato sempre dichiarate: misura in tempo reale, previsione di modello, simulazione da orario, dataset ufficiale, OpenStreetMap o elenco curato da verificare.',
    '',
    '## Pagine',
    '',
    `- [Mappa](${SITE}/): tutti i layer su una mappa interattiva.`,
    `- [Elenco dei layer](${SITE}/layers): provenienza e aggiornamento di ogni layer.`,
    `- [Metriche](${SITE}/metrics): indicatori calcolati, con la base di calcolo dichiarata.`,
    `- [Stato delle fonti](${SITE}/sources): disponibilità e freschezza di ogni fonte.`,
    `- [Collega la tua AI](${SITE}/mcp): istruzioni per usare VOD da Claude, ChatGPT, Cursor.`,
    '',
    '## Accesso per AI (MCP)',
    '',
    `Server MCP in sola lettura, Streamable HTTP, senza account: ${SITE}/api/mcp`,
    'Strumenti: list_datasets (catalogo) e query_dataset (filtri text, near, limit, offset).',
    '',
    '## Dataset',
    '',
    ...MCP_DATASETS.map((d) => `- ${d.id}: ${d.title} [${d.kind}] – ${d.source}, licenza ${d.license}`),
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
