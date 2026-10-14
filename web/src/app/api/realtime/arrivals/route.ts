import { NextResponse } from 'next/server';
import { z } from 'zod';
import { GRID } from '@/lib/simulation-data';
import { arrivalsNear, fetchTripDelays } from '@/server/sources/actvDelays';

const [LON0, LON1, LAT0, LAT1] = GRID.frame;

const Query = z.object({
  lat: z.coerce.number().min(LAT0).max(LAT1),
  lon: z.coerce.number().min(LON0).max(LON1),
  radius: z.coerce.number().int().min(30).max(300).default(150),
  /** codici GTFS della fermata (separati da virgola): più precisi della ricerca per distanza */
  stops: z.string().regex(/^[\w-]{1,20}(,[\w-]{1,20}){0,30}$/).optional(),
});

/**
 * Prossimi arrivi previsti alle fermate ACTV vicine a un punto, con il ritardo stimato da ACTV
 * (GTFS-Realtime TripUpdates, cache 20 s). Solo corse aggiornate da meno di 2 minuti.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = Query.safeParse({
    lat: searchParams.get('lat'),
    lon: searchParams.get('lon'),
    radius: searchParams.get('radius') ?? undefined,
    stops: searchParams.get('stops') ?? undefined,
  });
  if (!q.success) return NextResponse.json({ success: false, error: 'invalid_query' }, { status: 400 });
  const { trips, ok } = await fetchTripDelays();
  const data = arrivalsNear(trips.values(), q.data.lat, q.data.lon, { radius: q.data.radius, stopIds: q.data.stops?.split(',') });
  return NextResponse.json(
    {
      success: ok,
      count: data.length,
      data,
      meta: {
        kind: ok ? 'live' : 'unavailable',
        source: 'ACTV / AVM – GTFS-Realtime TripUpdates',
        sourceUrl: 'https://tpl.actv.it',
        note: 'Orari previsti e ritardi stimati da ACTV. Il ritardo attuale deriva dalla posizione GPS; gli orari alle fermate successive sono stime (estimate=constant: ACTV ripete il ritardo attuale). Feed elencato come «Open Data Real Time» nel catalogo dei dati ACTV (art. 53 CAD).',
      },
    },
    {
      status: ok ? 200 : 503,
      // Stessi parametri dalla stessa fermata: la CDN risponde per 15 s senza ricalcolare
      headers: ok ? { 'Cache-Control': 'public, max-age=15', 'Vercel-CDN-Cache-Control': 'max-age=15' } : { 'Cache-Control': 'no-store' },
    }
  );
}
