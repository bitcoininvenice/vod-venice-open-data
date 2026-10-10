import { NextResponse } from 'next/server';
import dataset from '@/data/osm-parks.json';
import type { ParkPlace } from '@/lib/types';

export const revalidate = 86400;

const PLACES = dataset.places as ParkPlace[];

/** Parchi, giardini pubblici, aree giochi, aree cani e oasi mappati su OpenStreetMap (ODbL). */
export async function GET() {
  return NextResponse.json({
    success: true,
    count: PLACES.length,
    counts: dataset.counts,
    data: PLACES,
    meta: {
      kind: 'static-reference',
      source: dataset.source,
      sourceUrl: dataset.sourceUrl,
      license: dataset.license,
      attribution: dataset.attribution,
      generatedAt: dataset.generatedAt,
      note: 'Il Comune di Venezia non pubblica un dataset aperto del verde pubblico. Esclusi i luoghi ad accesso privato e i giardini privati o domestici; orari e accessibilità come indicati su OpenStreetMap, non verificati.',
    },
  });
}
