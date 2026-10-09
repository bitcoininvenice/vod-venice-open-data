import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchStops } from '@/lib/db';

export const revalidate = 86400;

const Query = z.object({
  mode: z.enum(['navigazione', 'bus', 'tram', 'ferry']).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = Query.safeParse({ mode: searchParams.get('mode')?.toLowerCase() ?? undefined });
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'invalid_query' }, { status: 400 });
  }

  const all = await fetchStops();
  const stops = parsed.data.mode ? all.filter((s) => s.mode === parsed.data.mode) : all;
  // Dati statici della build: la CDN li tiene in cache per ogni valore di `mode`
  return NextResponse.json(
    { success: true, count: stops.length, data: stops },
    { headers: { 'Vercel-CDN-Cache-Control': 'max-age=86400, stale-while-revalidate=86400' } },
  );
}
