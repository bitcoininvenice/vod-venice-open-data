import { NextResponse } from 'next/server';
import toponyms from '@/data/osm-toponyms.json';
import { searchAddresses } from '@/lib/addresses';
import { addressIndex } from '@/server/planning/places';

const META = {
  kind: 'static-reference',
  source: toponyms.source,
  sourceUrl: toponyms.sourceUrl,
  license: toponyms.license,
  attribution: toponyms.attribution,
  generatedAt: toponyms.generatedAt,
  note: 'Calli, campi, fondamenta e ponti con nome su OpenStreetMap; il sestiere è stimato dal civico più vicino, isole e terraferma dall\'area. Nessun servizio esterno interrogato.',
};


/** Indirizzi di Venezia: ?q=cannaregio calle minestra (al massimo 8 risultati). */
export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get('q') ?? '').slice(0, 80);
  if (q.trim().length < 3) {
    return NextResponse.json({ success: false, error: 'invalid_query', hint: 'Esempio: Cannaregio calle Minestra', meta: META }, { status: 400 });
  }
  const data = searchAddresses(addressIndex(), q);
  return NextResponse.json(
    { success: true, count: data.length, data, meta: META },
    { headers: { 'Cache-Control': 'public, max-age=3600', 'Vercel-CDN-Cache-Control': 'max-age=86400, stale-while-revalidate=86400' } },
  );
}
