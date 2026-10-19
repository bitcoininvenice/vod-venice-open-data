import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MCP_DATASETS, MCP_DATASET_IDS } from '@/lib/mcp/catalog';
import { MCP_LOADERS } from '@/lib/mcp/loaders';
import { applyQuery } from '@/lib/mcp/query';

export const dynamic = 'force-dynamic';

const Query = z
  .object({
    text: z.string().min(2).max(80).optional(),
    minYear: z.coerce.number().int().min(400).max(2100).optional(),
    maxYear: z.coerce.number().int().min(400).max(2100).optional(),
    lat: z.coerce.number().min(45.0).max(45.8).optional(),
    lon: z.coerce.number().min(11.9).max(12.8).optional(),
    radius: z.coerce.number().int().min(10).max(20000).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).max(100000).default(0),
  })
  .strict()
  .refine((q) => (q.lat === undefined) === (q.lon === undefined), { message: 'lat e lon vanno indicati insieme' });

/** Stessi dati e filtri del tool MCP query_dataset, via REST (limit fino a 100). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(MCP_DATASET_IDS as readonly string[]).includes(id)) {
    return NextResponse.json({ success: false, error: 'unknown_dataset', datasets: MCP_DATASET_IDS }, { status: 404 });
  }
  const parsed = Query.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'invalid_query', issues: parsed.error.issues.map((i) => i.message) }, { status: 400 });
  }
  const meta = MCP_DATASETS.find((d) => d.id === id)!;
  const q = parsed.data;
  if (q.lat !== undefined && !meta.geo) {
    return NextResponse.json({ success: false, error: 'near_not_supported' }, { status: 400 });
  }
  try {
    const loaded = await MCP_LOADERS[id]();
    const near = q.lat !== undefined && q.lon !== undefined ? { lat: q.lat, lon: q.lon, radiusMeters: q.radius ?? 500 } : undefined;
    const result = applyQuery(loaded.items, { text: q.text, minYear: q.minYear, maxYear: q.maxYear, near, limit: q.limit, offset: q.offset });
    return NextResponse.json(
      { success: true, dataset: meta, context: loaded.meta ?? null, ...result, retrievedAt: new Date().toISOString() },
      { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=60', 'Vercel-CDN-Cache-Control': 'max-age=60' } },
    );
  } catch {
    return NextResponse.json({ success: false, error: 'source_unavailable' }, { status: 503, headers: { 'Retry-After': '60' } });
  }
}
