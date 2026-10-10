import { NextResponse } from 'next/server';
import dataset from '@/data/osm-civici.json';
import { findCivic, parseCivicQuery, type CivicRow, type SestiereCivico } from '@/lib/civici';

const CIVICI = dataset.civici as unknown as Record<SestiereCivico, CivicRow[]>;

const META = {
  kind: 'static-reference',
  source: dataset.source,
  sourceUrl: dataset.sourceUrl,
  license: dataset.license,
  attribution: dataset.attribution,
  generatedAt: dataset.generatedAt,
  coverage: dataset.counts,
  note: dataset.note,
};

/**
 * Ricerca di un numero civico veneziano: ?q=Cannaregio 3450 (anche "CN 3450", "S. Polo 1200/a").
 * match=exact se il civico è su OpenStreetMap, nearest se è il civico noto più vicino (posizione approssimata).
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q') ?? '';
  const parsed = parseCivicQuery(q.slice(0, 60));
  if (!parsed) {
    return NextResponse.json({ success: false, error: 'invalid_query', hint: 'Esempio: Cannaregio 3450', meta: META }, { status: 400 });
  }
  const result = findCivic(CIVICI[parsed.sestiere] ?? [], parsed);
  return NextResponse.json(
    { success: true, query: parsed, result, meta: META },
    { headers: { 'Cache-Control': 'public, max-age=3600', 'Vercel-CDN-Cache-Control': 'max-age=86400, stale-while-revalidate=86400' } },
  );
}
