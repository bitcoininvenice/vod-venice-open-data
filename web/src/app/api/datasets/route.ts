import { NextResponse } from 'next/server';
import { MCP_DATASETS, MCP_RELATED_SERVICES } from '@/lib/mcp/catalog';
import { MCP_ENDPOINT, SITE_URL } from '@/lib/site';

export const revalidate = 3600;

/** Catalogo dei dataset (lo stesso del server MCP) per script, CLI e scaricamenti in blocco. */
export async function GET() {
  return NextResponse.json({
    success: true,
    datasets: MCP_DATASETS,
    relatedServices: MCP_RELATED_SERVICES,
    usage: {
      query: `${SITE_URL}/api/datasets/<id>?text=&lat=&lon=&radius=&limit=&offset=`,
      mcp: MCP_ENDPOINT,
      limits: 'limit massimo 100; rispettare Retry-After dopo un 429; usare uno User-Agent riconoscibile.',
    },
  });
}
