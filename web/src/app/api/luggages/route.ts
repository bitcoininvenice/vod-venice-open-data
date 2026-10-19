import { NextResponse } from 'next/server';
import rawData from '@/data/luggage-storage-venezia.json';
import { OPEN_LUGGAGE_STORAGE } from '@/lib/luggages';

export const revalidate = 86400;

/** Depositi bagagli per turisti a Venezia, Mestre e hub di trasporto. */
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      count: OPEN_LUGGAGE_STORAGE.length,
      data: OPEN_LUGGAGE_STORAGE,
      meta: {
        kind: 'luggage_storage',
        source: rawData.source,
        attribution: rawData.attribution,
        generatedAt: rawData.generatedAt,
      },
    },
    { headers: { 'Vercel-CDN-Cache-Control': 'max-age=3600, stale-while-revalidate=86400' } },
  );
}
