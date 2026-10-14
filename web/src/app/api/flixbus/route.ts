import { NextResponse } from 'next/server';
import flix from '@/data/flixbus-venezia.json';

export const revalidate = 86400;

/** Corse FlixBus che passano per l'area di Venezia (orario teorico, percorsi ritagliati sulla mappa). */
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      count: flix.trips.length,
      data: { trips: flix.trips, shapes: flix.shapes },
      meta: {
        kind: 'timetable',
        source: flix.source,
        sourceUrl: flix.sourceUrl,
        license: flix.license,
        licenseUrl: flix.licenseUrl,
        attribution: flix.attribution,
        generatedAt: flix.generatedAt,
        note: flix.note,
      },
    },
    { headers: { 'Vercel-CDN-Cache-Control': 'max-age=3600, stale-while-revalidate=86400' } },
  );
}
