import { fetchUpstream } from '@/server/upstream';
import { GRID } from '@/lib/simulation-data';
import type { RealtimeVehicleOut } from '@/app/api/realtime/vehicles/route';
import { delayStatus } from '@/lib/realtimeDelay';
import { SOURCE_CODE_URL } from '@/lib/site';

export const BUSONE_BIV_FEEDS = {
  vehicles: 'https://proxy.busone.app/biv/gtfs-rt/vehicle-positions.json',
  tripUpdates: 'https://proxy.busone.app/biv/gtfs-rt/trip-updates.json',
} as const;

export const BUSONE_HEADERS = {
  'X-BusOne-Client': `VeniceOpenData (${SOURCE_CODE_URL})`,
  'X-BusOne-Use': 'nonprofit',
};

const [LON0, LON1, LAT0, LAT1] = GRID.frame;

export function isInVeniceFrame(lon: number, lat: number): boolean {
  return Number.isFinite(lon) && Number.isFinite(lat) && lon >= LON0 && lon <= LON1 && lat >= LAT0 && lat <= LAT1;
}

interface RawBivVehicleEntity {
  id: string;
  vehicle?: {
    trip?: { tripId?: string; routeId?: string; startTime?: string; startDate?: string };
    position?: { latitude: number; longitude: number; bearing?: number; speed?: number };
    timestamp?: number;
    vehicle?: { id?: string; label?: string };
    currentStatus?: string;
  };
}

interface RawBivTripEntity {
  id: string;
  tripUpdate?: {
    trip?: { tripId?: string; routeId?: string };
    delay?: number;
    timestamp?: number;
    stopTimeUpdate?: Array<{
      stopId?: string;
      arrival?: { delay?: number; time?: number };
      departure?: { delay?: number; time?: number };
    }>;
  };
}

function parseFeedEntities<T>(raw: unknown): T[] {
  if (!raw || typeof raw !== 'object') return [];
  const rec = raw as { entity?: T[] };
  return Array.isArray(rec.entity) ? rec.entity : [];
}

export function cleanBivLine(routeId: string | undefined, tripId: string | undefined, label: string | undefined): string {
  const candidate = routeId || tripId || label || 'BUS';
  const cleaned = candidate.replace(/^(BIV_|LINEA_|BUS_)/i, '').trim();
  const match = cleaned.match(/(?:^|[^A-Z0-9])(\d+[A-Z]{1,2}|[A-Z]{1,2}\d+)/i);
  if (match) return match[1].toUpperCase();
  const fallback = cleaned.split('_')[0]?.trim();
  return (fallback || cleaned).slice(0, 8).toUpperCase();
}

export async function fetchBusitaliaVehicles(): Promise<{
  data: RealtimeVehicleOut[];
  ok: boolean;
  source: string;
}> {
  const [vehiclesRes, tripsRes] = await Promise.all([
    fetchUpstream(BUSONE_BIV_FEEDS.vehicles, parseFeedEntities<RawBivVehicleEntity>, {
      revalidate: 20,
      headers: BUSONE_HEADERS,
      timeoutMs: 4000,
    }),
    fetchUpstream(BUSONE_BIV_FEEDS.tripUpdates, parseFeedEntities<RawBivTripEntity>, {
      revalidate: 20,
      headers: BUSONE_HEADERS,
      timeoutMs: 4000,
    }),
  ]);

  const delayByTrip = new Map<string, number>();
  if (tripsRes.ok) {
    for (const t of tripsRes.data) {
      const tripId = t.tripUpdate?.trip?.tripId;
      const delay = t.tripUpdate?.delay ?? t.tripUpdate?.stopTimeUpdate?.[0]?.departure?.delay ?? null;
      if (tripId && delay !== null) {
        delayByTrip.set(tripId, delay);
      }
    }
  }

  const vehicles: RealtimeVehicleOut[] = [];

  if (vehiclesRes.ok) {
    for (const ent of vehiclesRes.data) {
      const v = ent.vehicle;
      const pos = v?.position;
      if (!v || !pos || !isInVeniceFrame(pos.longitude, pos.latitude)) continue;

      const tripId = v.trip?.tripId ?? null;
      const routeId = v.trip?.routeId ?? null;
      const line = cleanBivLine(routeId ?? undefined, tripId ?? undefined, v.vehicle?.label);
      const delaySeconds = tripId ? delayByTrip.get(tripId) ?? null : null;

      const vehicleDelayObj =
        delaySeconds !== null
          ? {
              seconds: delaySeconds,
              status: delayStatus(delaySeconds),
              updatedAt: v.timestamp ?? Math.floor(Date.now() / 1000),
              nextStopId: null,
              nextStopName: null,
              nextStopTime: null,
              estimate: 'constant' as const,
              source: 'actv' as const, // standard schema
              actvSeconds: delaySeconds,
            }
          : null;

      vehicles.push({
        id: `biv_${ent.id}`,
        tripId,
        routeId,
        startTime: v.trip?.startTime ?? null,
        startDate: v.trip?.startDate ?? null,
        label: v.vehicle?.label ?? v.vehicle?.id ?? `Busitalia ${line}`,
        lat: pos.latitude,
        lon: pos.longitude,
        bearing: pos.bearing ?? null,
        timestamp: v.timestamp != null ? Number(v.timestamp) : null,
        network: 'automobilistico',
        line,
        category: 'bus',
        delay: vehicleDelayObj,
        operator: 'Busitalia Veneto',
      });
    }
  }

  return {
    data: vehicles,
    ok: vehiclesRes.ok,
    source: 'BusOne (https://busone.app) – Busitalia Veneto (extraurbano)',
  };
}
