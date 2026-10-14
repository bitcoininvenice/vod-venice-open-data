/**
 * Ultime partenze del giorno da ogni fermata della navigazione, dall'orario ufficiale ACTV (nessuno storico).
 * Gli orari sono in secondi dalla mezzanotte del giorno di servizio: oltre 86400 = dopo mezzanotte.
 */
import { forEachTrip, NIGHT_END_S, type SimModel } from './simulationCore';
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
export function lastDeparturesByStop(sim: SimModel, stops: StopItem[], day: DayType, nextDay?: DayType): Map<number, LastDeparture[]> {
  const seqs = profileStops(sim, stops);
  // ultima partenza dal capolinea di ogni profilo nel giorno, comprese quelle dopo mezzanotte e prima delle 4
  // (il simulatore le tiene nell'elenco del giorno dopo)
  const lastStart = new Map<number, number>();
  forEachTrip(
    sim,
    day,
    nextDay,
    (p, t0) => {
      const prev = lastStart.get(p);
      if (prev === undefined || t0 > prev) lastStart.set(p, t0);
    },
    NIGHT_END_S,
  );
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

const cache = new WeakMap<SimModel, Map<string, Map<number, LastDeparture[]>>>();

/** Ultime partenze per le fermate della mappa (ACTV_STOPS_REFERENCE), calcolate una volta per orario e giorno. */
export function lastDepartures(sim: SimModel, day: DayType, nextDay?: DayType): Map<number, LastDeparture[]> {
  const byDay = cache.get(sim) ?? new Map<string, Map<number, LastDeparture[]>>();
  const key = `${day}|${nextDay ?? ''}`;
  let m = byDay.get(key);
  if (!m) {
    m = lastDeparturesByStop(sim, ACTV_STOPS_REFERENCE, day, nextDay);
    byDay.set(key, m);
    cache.set(sim, byDay);
  }
  return m;
}

/** Ultime partenze di una fermata qualsiasi della mappa: stessa id, altrimenti stesso nome entro 150 m. */
export function lastDeparturesForStop(sim: SimModel, day: DayType, stop: Pick<StopItem, 'id' | 'name' | 'lat' | 'lon'>, nextDay?: DayType): LastDeparture[] {
  const k = Math.cos((stop.lat * Math.PI) / 180) * 111320;
  const near = (s: StopItem) => Math.hypot((s.lon - stop.lon) * k, (s.lat - stop.lat) * 110540) <= 150;
  let idx = ACTV_STOPS_REFERENCE.findIndex((s) => s.id === stop.id);
  if (idx === -1) idx = ACTV_STOPS_REFERENCE.findIndex((s) => s.name === stop.name && near(s));
  return idx === -1 ? [] : (lastDepartures(sim, day, nextDay).get(idx) ?? []);
}
