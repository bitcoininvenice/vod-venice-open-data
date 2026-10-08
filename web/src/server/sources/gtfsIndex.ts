import index from '@/data/actv-gtfs-index.json';

export type { RealtimeCategory } from '@/lib/contracts/realtime';
import type { RealtimeCategory } from '@/lib/contracts/realtime';

interface GtfsIndex {
  generatedAt: string;
  routes: Record<string, { n: string; long: string; color: string | null }>;
  /** suffisso numerico della corsa (es. "653_5134") -> "linea|categoria" */
  trips: Record<string, string>;
}

const IDX = index as GtfsIndex;

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

export function lookupRoute(routeId: string | null): { line: string } | null {
  if (!routeId) return null;
  const r = IDX.routes[routeId];
  return r ? { line: r.n } : null;
}

export const GTFS_INDEX_GENERATED_AT = IDX.generatedAt;
