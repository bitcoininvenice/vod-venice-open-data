import { getSimulation } from '@/lib/simulationModel';
import type { DayType } from '@/lib/types';

/**
 * Numero di corse GTFS ACTV in servizio per ogni minuto della giornata, calcolato dagli orari
 * pre-elaborati (stessa base dati della simulazione dei mezzi in mappa, public/data/sim-<hash>.json).
 */
export interface DayActivity {
  perMinute: Int32Array;
  peakCount: number;
  /** "HH:MM" */
  peakTime: string;
}

const MINUTES = 1440;
const cache = new Map<DayType, DayActivity>();

const EMPTY: DayActivity = { perMinute: new Int32Array(MINUTES), peakCount: 0, peakTime: '--:--' };

/** Attività del giorno; vuota finché la simulazione non è caricata (vedi useSimulation). */
export function dayActivity(day: DayType): DayActivity {
  const cached = cache.get(day);
  if (cached) return cached;
  const trips = getSimulation()?.daysTrips[day];
  if (!trips) return EMPTY;

  // Array differenze: +1 al minuto di partenza, -1 dopo il minuto di arrivo
  const diff = new Int32Array(MINUTES + 1);
  for (let i = 0; i < trips.count; i++) {
    const t0 = trips.t0[i];
    const t1 = trips.t1[i];
    const start = Math.max(0, Math.floor(t0 / 60));
    const end = Math.min(MINUTES - 1, Math.floor(t1 / 60));
    if (end < 0 || start > MINUTES - 1 || end < start) continue;
    diff[start] += 1;
    diff[end + 1] -= 1;
  }

  const perMinute = new Int32Array(MINUTES);
  let running = 0;
  let peakCount = 0;
  let peakMinute = 0;
  for (let m = 0; m < MINUTES; m++) {
    running += diff[m];
    perMinute[m] = running;
    if (running > peakCount) {
      peakCount = running;
      peakMinute = m;
    }
  }

  const result: DayActivity = {
    perMinute,
    peakCount,
    peakTime: `${String(Math.floor(peakMinute / 60)).padStart(2, '0')}:${String(peakMinute % 60).padStart(2, '0')}`,
  };
  cache.set(day, result);
  return result;
}

export function activeTripsAt(day: DayType, secondsOfDay: number): number {
  const minute = Math.min(MINUTES - 1, Math.max(0, Math.floor(secondsOfDay / 60)));
  return dayActivity(day).perMinute[minute];
}

/** Corse in servizio in quell'istante, per tipo di mezzo (stessa regola della simulazione in mappa). */
export function activeTripsByCategory(day: DayType, secondsOfDay: number): Record<string, number> {
  const sim = getSimulation();
  const trips = sim?.daysTrips[day];
  const out: Record<string, number> = {};
  if (!sim || !trips) return out;
  const { tP, t0, t1, count } = trips;
  for (let i = 0; i < count; i++) {
    if (t0[i] > secondsOfDay || t1[i] < secondsOfDay) continue;
    const cat = sim.profs[tP[i]].route.cat || 'vaporetto';
    out[cat] = (out[cat] ?? 0) + 1;
  }
  return out;
}
