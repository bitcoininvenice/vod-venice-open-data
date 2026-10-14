/**
 * Ultime partenze del giorno da ogni fermata della navigazione, dall'orario ufficiale ACTV (nessuno storico).
 * Gli orari sono in secondi dalla mezzanotte del giorno di servizio: oltre 86400 = dopo mezzanotte.
 */
import type { SimModel } from './simulationCore';
import type { DayType, StopItem } from './types';
import { profileStops } from './tripPlanner';
import { ACTV_STOPS_REFERENCE } from './stopsReference';

export interface LastDeparture {
  line: string;
  category: string;
  /** destinazione della corsa */
  headsign: string;
  /** ultima partenza (s dalla mezzanotte del giorno di servizio) */
  time: number;
}

/** Per ogni fermata (indice in `stops`) le ultime partenze per linea e destinazione, dalla più tarda. */
export function lastDeparturesByStop(sim: SimModel, stops: StopItem[], day: DayType): Map<number, LastDeparture[]> {
  const seqs = profileStops(sim, stops);
  // ultima partenza dal capolinea di ogni profilo nel giorno
  const lastStart = new Map<number, number>();
  const trips = sim.daysTrips[day];
  for (let i = 0; i < trips.count; i++) {
    const p = trips.tP[i];
    const prev = lastStart.get(p);
    if (prev === undefined || trips.t0[i] > prev) lastStart.set(p, trips.t0[i]);
  }
  const best = new Map<number, Map<string, LastDeparture>>();
  sim.profs.forEach((p, pi) => {
    const start = lastStart.get(pi);
    const seq = seqs.get(p);
    if (start === undefined || !seq) return;
    const headsign = stops[seq[seq.length - 1].stop].name;
    // dal capolinea non si "parte" verso sé stessi: l'ultima fermata è esclusa
    for (const { stop, k } of seq.slice(0, -1)) {
      const time = start + p.T[k];
      const key = `${p.route.n}|${headsign}`;
      const perStop = best.get(stop) ?? new Map<string, LastDeparture>();
      const cur = perStop.get(key);
      if (!cur || time > cur.time) perStop.set(key, { line: p.route.n, category: p.route.cat, headsign, time });
      best.set(stop, perStop);
    }
  });
  const out = new Map<number, LastDeparture[]>();
  for (const [stop, m] of best) out.set(stop, [...m.values()].sort((a, b) => b.time - a.time));
  return out;
}

const cache = new WeakMap<SimModel, Partial<Record<DayType, Map<number, LastDeparture[]>>>>();

/** Ultime partenze per le fermate della mappa (ACTV_STOPS_REFERENCE), calcolate una volta per orario e giorno. */
export function lastDepartures(sim: SimModel, day: DayType): Map<number, LastDeparture[]> {
  const byDay = cache.get(sim) ?? {};
  let m = byDay[day];
  if (!m) {
    m = lastDeparturesByStop(sim, ACTV_STOPS_REFERENCE, day);
    byDay[day] = m;
    cache.set(sim, byDay);
  }
  return m;
}

/** Ultime partenze di una fermata qualsiasi della mappa: stessa id, altrimenti stesso nome entro 150 m. */
export function lastDeparturesForStop(sim: SimModel, day: DayType, stop: Pick<StopItem, 'id' | 'name' | 'lat' | 'lon'>): LastDeparture[] {
  const k = Math.cos((stop.lat * Math.PI) / 180) * 111320;
  const near = (s: StopItem) => Math.hypot((s.lon - stop.lon) * k, (s.lat - stop.lat) * 110540) <= 150;
  let idx = ACTV_STOPS_REFERENCE.findIndex((s) => s.id === stop.id);
  if (idx === -1) idx = ACTV_STOPS_REFERENCE.findIndex((s) => s.name === stop.name && near(s));
  return idx === -1 ? [] : (lastDepartures(sim, day).get(idx) ?? []);
}
