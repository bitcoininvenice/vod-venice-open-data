import { NextRequest, NextResponse } from 'next/server';
import {
  getSevesoEstablishments,
  getSevesoSummaryStats,
  SEVESO_DATA,
} from '@/lib/seveso';

export const revalidate = 86400;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const municipality = searchParams.get('municipality') || undefined;
  const thresholdParam = searchParams.get('threshold');
  const threshold =
    thresholdParam === 'SS' || thresholdParam === 'SI' ? thresholdParam : undefined;
  const lagoonOnly = searchParams.get('lagoonOnly') === 'true';

  const establishments = getSevesoEstablishments({
    municipality,
    threshold,
    lagoonOnly,
  });
  const summary = getSevesoSummaryStats();

  return NextResponse.json(
    {
      success: true,
      data: {
        total: establishments.length,
        summary,
        establishments,
      },
      meta: {
        kind: 'curated-reference',
        source: SEVESO_DATA.metadata.source,
        license: SEVESO_DATA.metadata.license,
        note: 'Elenco curato del progetto da verificare (valori trascritti con riferimento ad ARPAV, non scaricati dal dataset ufficiale).',
        regulation: SEVESO_DATA.metadata.regulation,
        updatedAt: SEVESO_DATA.metadata.updatedAt,
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  );
}
