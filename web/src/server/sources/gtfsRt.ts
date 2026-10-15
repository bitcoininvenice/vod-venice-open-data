import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

export const ACTV_GTFS_RT_FEEDS = {
  navigazione: 'https://tpl.actv.it/nav/GTFSRT/vehiclePositions',
  automobilistico: 'https://tpl.actv.it/aut/GTFSRT/vehiclePositions',
} as const;

export interface RealtimeVehicle {
  id: string;
  tripId: string | null;
  routeId: string | null;
  /** partenza programmata della corsa "HH:MM:SS" e giorno di servizio "YYYYMMDD" */
  startTime: string | null;
  startDate: string | null;
  label: string | null;
  lat: number;
  lon: number;
  bearing: number | null;
  /** Epoch seconds della posizione riportata dal veicolo */
  timestamp: number | null;
}

/** Decodifica un FeedMessage GTFS-Realtime e restituisce solo le entità con posizione valida. */
export function parseVehiclePositions(buffer: ArrayBuffer): RealtimeVehicle[] {
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
  return feed.entity.flatMap((entity) => {
    const v = entity.vehicle;
    const pos = v?.position;
    if (!v || !pos || !Number.isFinite(pos.latitude) || !Number.isFinite(pos.longitude)) return [];
    if (pos.latitude === 0 && pos.longitude === 0) return [];
    return [{
      id: v.vehicle?.id || entity.id,
      tripId: v.trip?.tripId || null,
      routeId: v.trip?.routeId || null,
      startTime: v.trip?.startTime || null,
      startDate: v.trip?.startDate || null,
      label: v.vehicle?.label || null,
      lat: pos.latitude,
      lon: pos.longitude,
      bearing: pos.bearing ?? null,
      timestamp: v.timestamp != null ? Number(v.timestamp) : null,
    }];
  });
}

/** Feed dei ritardi (GTFS-Realtime TripUpdates): ACTV stima il ritardo fermata per fermata. */
export const ACTV_GTFS_RT_TRIP_UPDATES = {
  navigazione: 'https://tpl.actv.it/nav/GTFSRT/tripUpdates',
  automobilistico: 'https://tpl.actv.it/aut/GTFSRT/tripUpdates',
} as const;

interface StopDelay {
  seq: number | null;
  stopId: string;
  /** ritardo in secondi (negativo = in anticipo) */
  delay: number;
  /** orario previsto (epoch seconds), se indicato */
  time: number | null;
}

export interface TripDelay {
  tripId: string;
  routeId: string | null;
  startTime: string | null;
  startDate: string | null;
  /** ritardo attuale della corsa dichiarato da ACTV (s), anche quando mancano i dettagli per fermata */
  delay: number | null;
  /** epoch seconds dell'ultimo aggiornamento della corsa */
  timestamp: number | null;
  stops: StopDelay[];
}

export function parseTripUpdates(buffer: ArrayBuffer): TripDelay[] {
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
  return feed.entity.flatMap((entity) => {
    const u = entity.tripUpdate;
    const tripId = u?.trip?.tripId;
    if (!u || !tripId) return [];
    const stops: StopDelay[] = (u.stopTimeUpdate ?? []).flatMap((s) => {
      const ev = s.arrival ?? s.departure;
      if (!s.stopId || ev?.delay == null) return [];
      return [{
        seq: s.stopSequence ?? null,
        stopId: s.stopId,
        delay: Number(ev.delay),
        time: ev.time != null ? Number(ev.time) : null,
      }];
    });
    const delay = u.delay != null ? Number(u.delay) : null;
    if (stops.length === 0 && delay === null) return [];
    return [{
      tripId,
      routeId: u.trip?.routeId || null,
      startTime: u.trip?.startTime || null,
      startDate: u.trip?.startDate || null,
      delay,
      timestamp: u.timestamp != null ? Number(u.timestamp) : null,
      stops,
    }];
  });
}
