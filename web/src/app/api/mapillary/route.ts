import { NextRequest, NextResponse } from 'next/server';
import { fetchUpstream } from '@/server/upstream';
import { tileBbox, type StreetPhoto } from '@/lib/mapillary';
import { providerMeta } from '@/lib/provenance/providers';

const GRAPH = 'https://graph.mapillary.com/images';
/** Le foto di un riquadro cambiano di rado: un giorno di cache per riquadro, una richiesta condivisa da tutti */
const CACHE_S = 86_400;

interface GraphImage {
  id: string;
  geometry?: { coordinates?: [number, number] };
  captured_at?: number;
  compass_angle?: number;
}

/**
 * Posizioni delle foto Mapillary in un riquadro (?tile=x:y, vedi lib/mapillary). La chiave dell'API resta sul
 * server (MAPILLARY_TOKEN); il browser chiede le immagini a Mapillary solo quando si apre una foto.
 */
export async function GET(req: NextRequest) {
  const tile = req.nextUrl.searchParams.get('tile') ?? '';
  if (!/^-?\d{1,6}:-?\d{1,6}$/.test(tile)) return NextResponse.json({ success: false, error: 'tile non valido' }, { status: 400 });
  const token = process.env.MAPILLARY_TOKEN;
  if (!token) {
    return NextResponse.json({ success: false, error: 'mapillary_token_missing' }, { status: 503, headers: { 'Cache-Control': 'public, s-maxage=300' } });
  }
  const [w, s, e, n] = tileBbox(tile);
  // la chiave va nell'intestazione, non nell'URL: così non finisce nei registri
  const url = `${GRAPH}?fields=id,geometry,captured_at,compass_angle&limit=500&bbox=${w},${s},${e},${n}`;
  const res = await fetchUpstream(url, (j) => ((j as { data?: GraphImage[] }).data ?? []) as GraphImage[], {
    revalidate: CACHE_S,
    timeoutMs: 8000,
    headers: { Authorization: `OAuth ${token}` },
  });
  if (!res.ok) {
    return NextResponse.json({ success: false, error: 'upstream_unavailable' }, { status: 502, headers: { 'Cache-Control': 'public, s-maxage=300' } });
  }
  const data: StreetPhoto[] = res.data.flatMap((img) => {
    const c = img.geometry?.coordinates;
    return c ? [{ id: img.id, lon: c[0], lat: c[1], capturedAt: img.captured_at ?? null, compass: img.compass_angle ?? null }] : [];
  });
  return NextResponse.json(
    { success: true, count: data.length, data, meta: { kind: 'live', ...providerMeta('mapillary'), tile } },
    { headers: { 'Cache-Control': `public, s-maxage=${CACHE_S}, stale-while-revalidate=${CACHE_S}` } },
  );
}
