import { NextResponse } from 'next/server';
import busStops from '@/data/actv-bus-stops.json';
import type { StopItem } from '@/lib/types';

export const revalidate = 86400;

const STOPS = busStops.stops as StopItem[];

/** Tutte le fermate bus ACTV nell'area della mappa (GTFS automobilistico), con linee e codici GTFS. */
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      count: STOPS.length,
      data: STOPS,
      meta: { source: busStops.source, license: busStops.license, generatedAt: busStops.generatedAt, note: busStops.note },
    },
    { headers: { 'Vercel-CDN-Cache-Control': 'max-age=86400, stale-while-revalidate=86400' } },
  );
}
