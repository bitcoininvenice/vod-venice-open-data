import { NextResponse } from 'next/server';
import {
  GEOPORTALE_DATA,
  getMunicipalities,
  getServicesByTheme,
  getSestieri,
  getTutelaZones,
  searchGeoportale,
} from '@/lib/geoportale';
import type { GeoportaleThemeKey } from '@/lib/types';

export const revalidate = 86400;

const META = {
  kind: 'official-sit',
  nature: 'measured' as const,
  source: GEOPORTALE_DATA.source,
  sourceUrl: GEOPORTALE_DATA.sourceUrl,
  license: GEOPORTALE_DATA.license,
  generatedAt: GEOPORTALE_DATA.generatedAt,
  method: GEOPORTALE_DATA.method,
  caveat:
    'Integrazione selettiva ad alto valore civico: confini ufficiali DBGT (municipalita e sestieri in WGS84), zone di tutela/patti territoriali e catalogo federato dei 28 Map Services con deep-link al visualizzatore ufficiale del Comune per i layer ad alta densita (catasto, VPRG, ortofoto storiche).',
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const theme = url.searchParams.get('theme') as GeoportaleThemeKey | null;
  const q = url.searchParams.get('q');
  const section = url.searchParams.get('section');

  if (section === 'municipalities') {
    return NextResponse.json({
      success: true,
      data: getMunicipalities(),
      meta: META,
    });
  }

  if (section === 'sestieri') {
    return NextResponse.json({
      success: true,
      data: getSestieri(),
      meta: META,
    });
  }

  if (section === 'tutela') {
    return NextResponse.json({
      success: true,
      data: getTutelaZones(),
      meta: META,
    });
  }

  let services = GEOPORTALE_DATA.services;
  if (theme) {
    services = getServicesByTheme(theme);
  }
  if (q) {
    const matched = searchGeoportale(q);
    services = theme ? matched.filter((s) => s.theme === theme) : matched;
  }

  if (section === 'services') {
    return NextResponse.json({
      success: true,
      count: services.length,
      data: services,
      meta: META,
    });
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        municipalities: getMunicipalities(),
        sestieri: getSestieri(),
        tutelaZones: getTutelaZones(),
        services,
        themes: GEOPORTALE_DATA.themes,
        stats: {
          ...GEOPORTALE_DATA.stats,
          filteredServices: services.length,
        },
      },
      meta: META,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'Vercel-CDN-Cache-Control': 'max-age=86400, stale-while-revalidate=86400',
      },
    },
  );
}
