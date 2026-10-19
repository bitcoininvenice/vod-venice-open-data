import { NextResponse } from 'next/server';
import dolomiti from '@/data/dolomitibus-venezia.json';

export const revalidate = 86400;

/** Corse Dolomiti Bus per Venezia (Linea 72 Cortina Express: Piazzale Roma - Mestre FS - Aeroporto VCE - Cortina). */
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      count: dolomiti.trips.length,
      data: { trips: dolomiti.trips, shapes: dolomiti.shapes },
      meta: {
        kind: 'timetable',
        source: dolomiti.source,
        sourceUrl: dolomiti.sourceUrl,
        license: dolomiti.license,
        attribution: dolomiti.attribution,
        generatedAt: dolomiti.generatedAt,
        note: dolomiti.note,
      },
    },
    { headers: { 'Vercel-CDN-Cache-Control': 'max-age=3600, stale-while-revalidate=86400' } },
  );
}
