import { NextResponse } from 'next/server';
import atvo from '@/data/atvo-venezia.json';

export const revalidate = 86400;

/** Corse ATVO per Venezia (Linea 35 Venezia Express, Linea 35B Mestre Express, Linea 10A Jesolo). */
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      count: atvo.trips.length,
      data: { trips: atvo.trips, shapes: atvo.shapes },
      meta: {
        kind: 'timetable',
        source: atvo.source,
        sourceUrl: atvo.sourceUrl,
        license: atvo.license,
        attribution: atvo.attribution,
        generatedAt: atvo.generatedAt,
        note: atvo.note,
      },
    },
    { headers: { 'Vercel-CDN-Cache-Control': 'max-age=3600, stale-while-revalidate=86400' } },
  );
}
