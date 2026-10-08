import { NextResponse } from 'next/server';
import { fetchUpstream } from '@/server/upstream';
import { ACTV_GTFS_RT_FEEDS, parseVehiclePositions } from '@/server/sources/gtfsRt';

export const revalidate = 20;

/**
 * Posizioni reali dei mezzi ACTV dal feed GTFS-Realtime.
 * Nota: l'endpoint è pubblico ma la licenza d'uso del realtime non è documentata come open data:
 * confermarla con AVM/ACTV prima di un utilizzo in produzione.
 */
export async function GET() {
  const fetchFeed = (url: string) =>
    fetchUpstream(url, (raw) => parseVehiclePositions(raw as ArrayBuffer), {
      revalidate: 20,
      responseType: 'arrayBuffer',
    });

  const [nav, aut] = await Promise.all([
    fetchFeed(ACTV_GTFS_RT_FEEDS.navigazione),
    fetchFeed(ACTV_GTFS_RT_FEEDS.automobilistico),
  ]);

  return NextResponse.json({
    ok: nav.ok || aut.ok,
    data: {
      navigazione: nav.ok ? nav.data : null,
      automobilistico: aut.ok ? aut.data : null,
    },
    meta: {
      kind: 'live',
      source: 'ACTV / AVM – GTFS-Realtime VehiclePositions',
      sourceUrl: 'https://tpl.actv.it',
      fetchedAt: nav.ok ? nav.fetchedAt : aut.ok ? aut.fetchedAt : undefined,
      note: 'Licenza del feed realtime da confermare con AVM S.p.A.',
    },
  });
}
