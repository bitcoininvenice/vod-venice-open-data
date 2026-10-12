import index from '@/data/actv-gtfs-index.json';

export type { RealtimeCategory } from '@/lib/contracts/realtime';
import type { RealtimeCategory } from '@/lib/contracts/realtime';

interface GtfsIndex {
  generatedAt: string;
  routes: Record<string, { n: string; long: string; color: string | null }>;
  /** suffisso numerico della corsa (es. "653_5134") -> "linea|categoria" */
  trips: Record<string, string>;
  /** codice fermata GTFS -> [nome, lat, lon] */
  stops?: Record<string, [string, number, number]>;
}

const IDX = index as unknown as GtfsIndex;

/**
 * Linea e categoria di una corsa GTFS-RT.
 * Il feed realtime usa a volte un prefisso diverso dal GTFS statico (AUT_ vs NAV_):
 * l'abbinamento avviene sul suffisso numerico.
 */
export function lookupTrip(tripId: string | null): { line: string; category: RealtimeCategory } | null {
  if (!tripId) return null;
  const suffix = tripId.match(/(\d+_\d+)$/)?.[1];
  const value = suffix ? IDX.trips[suffix] : undefined;
  if (!value) return null;
  const [line, category] = value.split('|');
  return { line, category: category as RealtimeCategory };
}

let categoryByLine: Map<string, RealtimeCategory> | null = null;

/**
 * Categoria di una linea (es. T1 -> tram), ricavata dalle sue corse nel GTFS statico.
 * Serve quando la corsa del feed realtime non è nell'indice ma la linea sì.
 */
export function lineCategory(line: string | null): RealtimeCategory | null {
  if (!line) return null;
  if (!categoryByLine) {
    categoryByLine = new Map();
    for (const value of Object.values(IDX.trips)) {
      const [l, c] = value.split('|');
      if (!categoryByLine.has(l)) categoryByLine.set(l, c as RealtimeCategory);
    }
  }
  return categoryByLine.get(line) ?? null;
}

export function lookupRoute(routeId: string | null): { line: string } | null {
  if (!routeId) return null;
  const r = IDX.routes[routeId];
  return r ? { line: r.n } : null;
}

export const GTFS_INDEX_GENERATED_AT = IDX.generatedAt;

export function stopName(stopId: string | null): string | null {
  return (stopId && IDX.stops?.[stopId]?.[0]) || null;
}

/** Linea, descrizione e colore di una linea GTFS (route_id). */
export function routeInfo(routeId: string | null): { line: string; long: string; color: string | null } | null {
  const r = routeId ? IDX.routes[routeId] : undefined;
  return r ? { line: r.n, long: r.long, color: r.color } : null;
}

/** Codici delle fermate GTFS entro `radius` metri (una fermata della mappa ha spesso più pontili o lati). */
export function stopsNear(lat: number, lon: number, radius = 150): string[] {
  const out: string[] = [];
  const kx = 111_000 * Math.cos((lat * Math.PI) / 180);
  for (const [id, [, slat, slon]] of Object.entries(IDX.stops ?? {})) {
    if (Math.hypot((slat - lat) * 111_000, (slon - lon) * kx) <= radius) out.push(id);
  }
  return out;
}
