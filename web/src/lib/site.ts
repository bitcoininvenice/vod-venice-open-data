/**
 * Indirizzo pubblico del sito, usato in link, sitemap, guide, llms.txt e skill (mai localhost).
 * In ordine: NEXT_PUBLIC_SITE_URL (.env.local o variabili del progetto), poi il dominio di produzione che
 * Vercel fornisce da solo (così una copia pubblicata su Vercel usa il proprio dominio senza configurazione),
 * infine l'indirizzo di VOD.
 */
const vercelDomain = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (vercelDomain ? `https://${vercelDomain}` : '') ||
  'https://venice-open-data.vercel.app'
).replace(/\/$/, '');

export const MCP_ENDPOINT = `${SITE_URL}/api/mcp`;

/**
 * Codice sorgente del sito. La licenza AGPL-3.0 chiede che chi offre il programma in rete ne indichi il codice:
 * chi pubblica una versione modificata imposta qui (o in NEXT_PUBLIC_SOURCE_URL) il proprio repository.
 */
export const SOURCE_CODE_URL = process.env.NEXT_PUBLIC_SOURCE_URL || 'https://github.com/bitcoininvenice/vod-venice-open-data';
