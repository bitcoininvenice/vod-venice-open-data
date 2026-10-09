import { NextResponse } from 'next/server';
import dataset from '@/data/osm-waterways.json';

export const revalidate = 86400;

export async function GET() {
  return NextResponse.json({
    success: true,
    meta: {
      kind: 'static-reference',
      note: 'Briccole, segnalamenti e canali mappati su OpenStreetMap. Non esiste un dataset ufficiale aperto equivalente. Non usare per la navigazione.',
    },
    data: dataset,
  });
}
