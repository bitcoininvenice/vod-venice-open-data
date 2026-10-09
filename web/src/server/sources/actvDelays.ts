import { fetchUpstream } from '@/server/upstream';
import { ACTV_GTFS_RT_TRIP_UPDATES, parseTripUpdates, type TripDelay } from './gtfsRt';
import { lookupTrip, routeInfo, stopName, stopsNear } from './gtfsIndex';
import { delayStatus, estimateKind, isFresh, type StopArrival, type VehicleDelay } from '@/lib/realtimeDelay';

/** Suffisso numerico della corsa: realtime e statico a volte differiscono nel prefisso (AUT_ / NAV_). */
const tripKey = (tripId: string): string => tripId.match(/(\d+_\d+)$/)?.[1] ?? tripId;

/** Ritardi di entrambe le reti (cache condivisa di 20 s, come le posizioni). */
export async function fetchTripDelays(): Promise<{ trips: Map<string, TripDelay>; ok: boolean }> {
  const read = (url: string) =>
    fetchUpstream(url, (raw) => parseTripUpdates(raw as ArrayBuffer), { revalidate: 20, responseType: 'arrayBuffer' });
  const [nav, aut] = await Promise.all([read(ACTV_GTFS_RT_TRIP_UPDATES.navigazione), read(ACTV_GTFS_RT_TRIP_UPDATES.automobilistico)]);
  const trips = new Map<string, TripDelay>();
  for (const r of [nav, aut]) if (r.ok) for (const t of r.data) trips.set(tripKey(t.tripId), t);
  return { trips, ok: nav.ok || aut.ok };
}

export function findTrip(trips: Map<string, TripDelay>, tripId: string | null): TripDelay | undefined {
  return tripId ? trips.get(tripKey(tripId)) : undefined;
}

/** Ritardo attuale di un mezzo: quello alla prossima fermata; null se l'aggiornamento è vecchio. */
export function vehicleDelay(trip: TripDelay | undefined, nowSec: number = Date.now() / 1000): VehicleDelay | null {
  if (!trip || !isFresh(trip.timestamp, nowSec)) return null;
  const next = trip.stops[0];
  return {
    seconds: next.delay,
    status: delayStatus(next.delay),
    updatedAt: trip.timestamp as number,
    nextStopId: next.stopId,
    nextStopName: stopName(next.stopId),
    nextStopTime: next.time,
    estimate: estimateKind(trip.stops.map((s) => s.delay)),
  };
}

/** Prossimi arrivi previsti alle fermate GTFS vicine a un punto (entro l'orizzonte indicato). */
export function arrivalsNear(
  trips: Iterable<TripDelay>,
  lat: number,
  lon: number,
  { nowSec = Date.now() / 1000, radius = 150, horizonSec = 90 * 60, limit = 12, stopIds }: { nowSec?: number; radius?: number; horizonSec?: number; limit?: number; stopIds?: string[] } = {}
): StopArrival[] {
  // Codici GTFS della fermata se noti, altrimenti le fermate GTFS entro il raggio
  const near = new Set(stopIds && stopIds.length > 0 ? stopIds : stopsNear(lat, lon, radius));
  if (near.size === 0) return [];
  const out: StopArrival[] = [];
  for (const trip of trips) {
    if (!isFresh(trip.timestamp, nowSec)) continue;
    const estimate = estimateKind(trip.stops.map((s) => s.delay));
    for (const s of trip.stops) {
      if (!near.has(s.stopId) || s.time === null) continue;
      if (s.time < nowSec - 60 || s.time > nowSec + horizonSec) continue;
      const route = routeInfo(trip.routeId);
      out.push({
        line: lookupTrip(trip.tripId)?.line ?? route?.line ?? null,
        routeLongName: route?.long ?? null,
        color: route?.color ?? null,
        stopName: stopName(s.stopId),
        time: s.time,
        delaySeconds: s.delay,
        status: delayStatus(s.delay),
        estimate,
        updatedAt: trip.timestamp,
      });
      break; // una corsa passa una volta sola dalla stessa fermata
    }
  }
  return out.sort((a, b) => a.time - b.time).slice(0, limit);
}
