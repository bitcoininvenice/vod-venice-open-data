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
