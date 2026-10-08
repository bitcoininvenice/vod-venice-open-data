import { NextResponse } from 'next/server';
import { fetchUpstream } from '@/server/upstream';
import { ACTV_GTFS_RT_FEEDS, parseVehiclePositions, type RealtimeVehicle } from '@/server/sources/gtfsRt';
import { lookupRoute, lookupTrip, type RealtimeCategory } from '@/server/sources/gtfsIndex';

export const revalidate = 20;

/** Posizioni oltre questa età sono considerate non attendibili (mezzo fermo o fuori servizio). */
const MAX_AGE_SECONDS = 15 * 60;

export interface RealtimeVehicleOut extends RealtimeVehicle {
  network: 'navigazione' | 'automobilistico';
  line: string | null;
  category: RealtimeCategory | null;
}

/**
 * Posizioni reali dei mezzi ACTV dal feed GTFS-Realtime, arricchite con linea e categoria.
 * Nota: l'endpoint è pubblico ma la licenza d'uso del realtime non è documentata come open data:
 * confermarla con AVM/ACTV prima di un utilizzo in produzione (vedi docs/richieste-autorizzazione.md).
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

  const nowSec = Date.now() / 1000;
  const enrich = (list: RealtimeVehicle[], network: RealtimeVehicleOut['network']): RealtimeVehicleOut[] =>
    list
      .filter((v) => v.timestamp === null || nowSec - v.timestamp <= MAX_AGE_SECONDS)
      .map((v) => {
        const trip = lookupTrip(v.tripId);
        const route = lookupRoute(v.routeId);
        return {
          ...v,
          network,
          line: trip?.line ?? route?.line ?? null,
          category: trip?.category ?? (network === 'navigazione' ? 'vaporetto' : 'bus'),
        };
      });

  const vehicles = [
    ...(nav.ok ? enrich(nav.data, 'navigazione') : []),
    ...(aut.ok ? enrich(aut.data, 'automobilistico') : []),
  ];

  return NextResponse.json({
    ok: nav.ok || aut.ok,
    count: vehicles.length,
    data: vehicles,
    meta: {
      kind: 'live',
      source: 'ACTV / AVM – GTFS-Realtime VehiclePositions',
      sourceUrl: 'https://tpl.actv.it',
      fetchedAt: nav.ok ? nav.fetchedAt : aut.ok ? aut.fetchedAt : undefined,
      feeds: { navigazione: nav.ok, automobilistico: aut.ok },
      note: 'Posizioni GPS reali dei mezzi. Licenza del feed realtime da confermare con AVM S.p.A.',
    },
  });
}
