import { D } from '@/lib/simulation-data';

const NAVIGATION_CATEGORIES = new Set(['vaporetto', 'ferry']);

/** Conteggi ricavati dal GTFS ACTV pre-elaborato in lib/simulation-data.ts. */
export function gtfsNetworkStats() {
  const routes = D.routes as { n: string; c: string }[];
  const routesNavigazione = routes.filter((r) => NAVIGATION_CATEGORIES.has(r.c)).length;
  return {
    routesNavigazione,
    routesAutomobilistico: routes.length - routesNavigazione,
    weekdayTrips: (D.days as Record<string, { trips: unknown[] }>).weekday?.trips.length ?? 0,
  };
}
