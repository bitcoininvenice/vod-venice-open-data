import { NextResponse } from 'next/server';
import { z } from 'zod';
import { findStopsNearCantieri } from '@/lib/db';

const Query = z.object({
  radius: z.coerce.number().int().min(10).max(2000).default(200),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = Query.safeParse({ radius: searchParams.get('radius') ?? undefined });
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'invalid_query', detail: 'radius deve essere un intero tra 10 e 2000 metri' },
      { status: 400 },
    );
  }

  const results = await findStopsNearCantieri(parsed.data.radius);
  // Calcolo su dati statici della build: la CDN tiene in cache il risultato per ogni raggio
  return NextResponse.json(
    { success: true, radiusMeters: parsed.data.radius, count: results.length, data: results },
    { headers: { 'Cache-Control': 'public, max-age=3600', 'Vercel-CDN-Cache-Control': 'max-age=86400, stale-while-revalidate=86400' } },
  );
}
