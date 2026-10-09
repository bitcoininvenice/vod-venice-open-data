import { SIM_STATS } from '@/lib/simulation-data';

const NAVIGATION_CATEGORIES = new Set(['vaporetto', 'ferry']);

/** Conteggi ricavati dal GTFS ACTV pre-elaborato (riepilogo SIM_STATS in lib/simulation-data.ts). */
export function gtfsNetworkStats() {
  const modes = SIM_STATS.routeModes as string[];
  const routesNavigazione = modes.filter((c) => NAVIGATION_CATEGORIES.has(c)).length;
  return {
    routesNavigazione,
    routesAutomobilistico: modes.length - routesNavigazione,
    weekdayTrips: (SIM_STATS.trips as Record<string, number>).weekday ?? 0,
  };
}
