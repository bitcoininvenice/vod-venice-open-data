import { D } from '@/lib/simulation-data';
import type { DayType } from '@/lib/types';

/**
 * Numero di corse GTFS ACTV in servizio per ogni minuto della giornata, calcolato dagli orari
 * pre-elaborati in simulation-data (stessa base dati della simulazione dei mezzi in mappa).
 */
export interface DayActivity {
  perMinute: Int32Array;
  peakCount: number;
  /** "HH:MM" */
  peakTime: string;
}

const MINUTES = 1440;
const cache = new Map<DayType, DayActivity>();

type RawTrip = [profileIndex: number, departureSeconds: number];
type RawProfile = [shape: number, route: number, times: number[], dists: number[]];

export function dayActivity(day: DayType): DayActivity {
  const cached = cache.get(day);
  if (cached) return cached;

  const profiles = D.profiles as unknown as RawProfile[];
  const trips = (D.days as unknown as Record<string, { trips: RawTrip[] }>)[day]?.trips ?? [];

  // Array differenze: +1 al minuto di partenza, -1 dopo il minuto di arrivo
  const diff = new Int32Array(MINUTES + 1);
  for (const [p, t0] of trips) {
    const times = profiles[p]?.[2];
    if (!times || times.length === 0) continue;
    const t1 = t0 + times[times.length - 1];
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
