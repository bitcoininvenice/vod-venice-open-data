import { NextResponse } from 'next/server';
import { fetchUpstream } from '@/server/upstream';
import { ACTV_GTFS_RT_FEEDS, parseVehiclePositions, type RealtimeVehicle } from '@/server/sources/gtfsRt';
import { lookupRoute, lookupTrip, type RealtimeCategory, lineCategory } from '@/server/sources/gtfsIndex';
import { actvCurrentDelay, fetchTripDelays, findTrip, vehicleDelay } from '@/server/sources/actvDelays';
import { isFresh, type VehicleDelay } from '@/lib/realtimeDelay';
import { matchTrip, parseGtfsTime, positionDelay, trustDelay, type TripIndex } from '@/lib/positionDelay';
import { serverSimulation } from '@/server/sources/simulationServer';
import { romeDayType, romeLocalToDate } from '@/lib/time';
import type { TripDelay } from '@/server/sources/gtfsRt';

export const revalidate = 20;

/** Posizioni oltre questa età sono considerate non attendibili (mezzo fermo o fuori servizio). */
const MAX_AGE_SECONDS = 15 * 60;

export interface RealtimeVehicleOut extends RealtimeVehicle {
  network: 'navigazione' | 'automobilistico';
  line: string | null;
  category: RealtimeCategory | null;
  /** ritardo rispetto all'orario: dalla posizione GPS verificata con ACTV, oppure quello di ACTV; solo se recente */
  delay: VehicleDelay | null;
  /** il ritardo calcolato e quello di ACTV non sono coerenti: nessun ritardo mostrato */
  delayConflict?: boolean;
}

/**
 * Ritardo verificato di un mezzo: calcolato dalla posizione sulla corsa dell'orario con la stessa
 * linea e partenza, confrontato con quello di ACTV. undefined se non calcolabile (resta quello di ACTV).
 */
function checkedDelay(
  v: RealtimeVehicle,
  line: string | null,
  trip: TripDelay | undefined,
  index: TripIndex | null,
  nowSec: number,
  network: 'navigazione' | 'automobilistico',
) {
  const actv = actvCurrentDelay(trip, nowSec);
  const startTime = v.startTime ?? trip?.startTime ?? null;
  const startDate = v.startDate ?? trip?.startDate ?? null;
  const departure = parseGtfsTime(startTime);
  let position: number | null = null;
  if (index && line && departure !== null && startDate && v.timestamp !== null && isFresh(v.timestamp, nowSec)) {
    const midnight = romeLocalToDate(`${startDate.slice(0, 4)}-${startDate.slice(4, 6)}-${startDate.slice(6, 8)} 00:00:00`).getTime() / 1000;
    const scheduled = matchTrip(index, line, departure, romeDayType(new Date((midnight + 12 * 3600) * 1000)), network);
    if (scheduled) position = positionDelay(scheduled.profile, v.lon, v.lat, v.timestamp - midnight - departure, actv ?? 0);
  }
  const trusted = trustDelay(position, actv);
  if (trusted === 'conflict') return { conflict: true as const };
  if (!trusted) return null;
  return { seconds: trusted.seconds, source: trusted.source, updatedAt: trusted.source === 'position' ? (v.timestamp as number) : (trip?.timestamp as number) };
}

/**
 * Posizioni reali dei mezzi ACTV dal feed GTFS-Realtime, arricchite con linea e categoria.
 * Il feed è elencato come «Open Data Real Time» nel catalogo dei dati ACTV (art. 53 CAD):
 * https://actv.avmspa.it/it/content/catalogo-dei-dati-metadati-e-banche-dati-actv
 */
export async function GET() {
  const fetchFeed = (url: string) =>
    fetchUpstream(url, (raw) => parseVehiclePositions(raw as ArrayBuffer), {
      revalidate: 20,
      responseType: 'arrayBuffer',
    });

  const [nav, aut, delays, sim] = await Promise.all([
    fetchFeed(ACTV_GTFS_RT_FEEDS.navigazione),
    fetchFeed(ACTV_GTFS_RT_FEEDS.automobilistico),
    fetchTripDelays(),
    serverSimulation(),
  ]);

  const nowSec = Date.now() / 1000;
  const enrich = (list: RealtimeVehicle[], network: RealtimeVehicleOut['network']): RealtimeVehicleOut[] =>
    list
      .filter((v) => v.timestamp === null || nowSec - v.timestamp <= MAX_AGE_SECONDS)
      .map((v) => {
        const trip = lookupTrip(v.tripId);
        const route = lookupRoute(v.routeId);
        const line = trip?.line ?? route?.line ?? null;
        const actvTrip = findTrip(delays.trips, v.tripId);
        const checked = checkedDelay(v, line, actvTrip, sim?.index ?? null, nowSec, network);
        const conflict = checked !== null && 'conflict' in checked;
        return {
          ...v,
          network,
          line,
          category: trip?.category ?? lineCategory(line, network) ?? (network === 'navigazione' ? 'vaporetto' : 'bus'),
          delay: conflict ? null : vehicleDelay(actvTrip, nowSec, checked),
          ...(conflict ? { delayConflict: true } : {}),
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
      feeds: { navigazione: nav.ok, automobilistico: aut.ok, ritardi: delays.ok },
      withDelay: vehicles.filter((v) => v.delay).length,
      delayFromPosition: vehicles.filter((v) => v.delay?.source === 'position').length,
      delayConflicts: vehicles.filter((v) => v.delayConflict).length,
      note: 'Posizioni GPS reali dei mezzi. Il ritardo (campo delay) è calcolato dalla posizione GPS sulla corsa dell\'orario ufficiale con la stessa linea e partenza e verificato con quello di ACTV (source=position); quando il calcolo non è possibile (mezzo a un pontile o lontano dal percorso) è quello dichiarato da ACTV (source=actv). Se i due differiscono di oltre 15 minuti nessun ritardo viene mostrato (delayConflict). Solo valori aggiornati da meno di 2 minuti. Feed elencato come «Open Data Real Time» nel catalogo dei dati ACTV (art. 53 CAD).',
    },
  });
}
