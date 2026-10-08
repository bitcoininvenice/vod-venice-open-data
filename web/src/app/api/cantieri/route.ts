import { NextResponse } from 'next/server';
import { fetchCantieri, OPERE_PUBBLICHE_META } from '@/lib/db';

export const revalidate = 86400;

export async function GET() {
  const cantieri = await fetchCantieri();
  return NextResponse.json({
    success: true,
    count: cantieri.length,
    data: cantieri,
    meta: {
      kind: 'static-reference',
      source: OPERE_PUBBLICHE_META.source,
      sourceUrl: OPERE_PUBBLICHE_META.sourceUrl,
      license: OPERE_PUBBLICHE_META.license,
      observedAt: OPERE_PUBBLICHE_META.generatedAt,
      note: `${OPERE_PUBBLICHE_META.located}/${OPERE_PUBBLICHE_META.count} opere con posizione approssimata (${OPERE_PUBBLICHE_META.geocoding}). Aggiornamento con pipeline/import_opere_pubbliche.py.`,
    },
  });
}
