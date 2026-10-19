import { NextResponse } from 'next/server';
import data from '@/data/geoids-strutture.json';
import { providerMeta } from '@/lib/provenance/providers';

export const revalidate = 86400;

/**
 * Strutture ricettive registrate nel Comune di Venezia (GeoIDS): attività d'impresa come punti, strutture
 * complementari e locazioni turistiche solo come conteggi su celle da ~100 m e per zona dell'imposta di soggiorno.
 */
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      count: data.total,
      data,
      meta: {
        kind: 'dataset',
        ...providerMeta('geoids'),
        extractedAt: data.extractedAt,
        note: data.note,
      },
    },
    { headers: { 'Vercel-CDN-Cache-Control': 'max-age=3600, stale-while-revalidate=86400' } },
  );
}
