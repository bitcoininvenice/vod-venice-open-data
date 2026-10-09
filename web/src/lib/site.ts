/** Indirizzo pubblico di VOD: usato in guide, llms.txt e skill (mai localhost). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://venice-open-data.vercel.app').replace(/\/$/, '');

export const MCP_ENDPOINT = `${SITE_URL}/api/mcp`;
