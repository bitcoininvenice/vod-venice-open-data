import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

export const ACTV_GTFS_RT_FEEDS = {
  navigazione: 'https://tpl.actv.it/nav/GTFSRT/vehiclePositions',
  automobilistico: 'https://tpl.actv.it/aut/GTFSRT/vehiclePositions',
} as const;

export interface RealtimeVehicle {
  id: string;
  tripId: string | null;
  routeId: string | null;
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
      label: v.vehicle?.label || null,
      lat: pos.latitude,
      lon: pos.longitude,
      bearing: pos.bearing ?? null,
      timestamp: v.timestamp != null ? Number(v.timestamp) : null,
    }];
  });
}
