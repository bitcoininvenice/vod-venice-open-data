/**
 * Prossime partenze da una fermata secondo l'orario ufficiale ACTV (la stessa base della simulazione dei mezzi).
 * Serve dove non ci sono dati in tempo reale (People Mover, tram) e come riferimento per i bus.
 */
import { forEachTrip, pointAt, type SimModel, type SimProfile } from './simulationCore';
import { fromGrid } from './positionDelay';
import { ACTV_STOPS_REFERENCE } from './stopsReference';
import type { DayType, StopItem } from './types';

/** Distanza massima tra la fermata della mappa e il punto della corsa (m) */
const STOP_MATCH_M = 80;

export interface ScheduledDeparture {
  line: string;
  category: string;
  /** destinazione della corsa */
  headsign: string;
  /** partenza (s dalla mezzanotte del giorno di servizio) */
  time: number;
}

interface ProfilePoints {
  p: SimProfile;
  /** [lon, lat] di ogni fermata della corsa */
  pts: [number, number][];
  headsign: string;
  /** fermata di partenza della corsa */
  origin: string;
}

const cache = new WeakMap<SimModel, ProfilePoints[]>();

const meters = (a: [number, number], lon: number, lat: number) =>
  Math.hypot((a[0] - lon) * Math.cos((lat * Math.PI) / 180) * 111320, (a[1] - lat) * 110540);

function nearestName(lon: number, lat: number): string {
  let best: { d: number; name: string } | null = null;
  for (const s of ACTV_STOPS_REFERENCE) {
    const d = meters([s.lon, s.lat], lon, lat);
    if (d <= 400 && (!best || d < best.d)) best = { d, name: s.name };
  }
  return best?.name ?? '';
}

function profilePoints(sim: SimModel): ProfilePoints[] {
  let out = cache.get(sim);
  if (out) return out;
  const pt: [number, number] = [0, 0];
  out = sim.profs.map((p) => {
    const pts = Array.from(p.Dd, (d) => {
      pointAt(p.sh, d, pt);
      return fromGrid(pt[0], pt[1]) as [number, number];
    });
    const last = pts[pts.length - 1];
    return { p, pts, headsign: nearestName(last[0], last[1]), origin: nearestName(pts[0][0], pts[0][1]) };
  });
  cache.set(sim, out);
  return out;
}

/**
 * Partenze dalla fermata tra `from` e `from + windowS` (secondi dalla mezzanotte), ordinate per orario.
 * Il capolinea d'arrivo non è una partenza; le corse iniziate il giorno prima hanno partenza negativa e sono incluse.
 */
export function scheduledDepartures(
  sim: SimModel,
  stop: Pick<StopItem, 'lat' | 'lon'>,
  day: DayType,
  from: number,
  windowS = 90 * 60,
  /** tipo di giorno di domani: per le corse dopo mezzanotte (il simulatore le tiene nel giorno dopo) */
  nextDay?: DayType,
): ScheduledDeparture[] {
  const profIndex = new Map<SimProfile, number[]>();
  for (const { p, pts } of profilePoints(sim)) {
    const ks: number[] = [];
    for (let k = 0; k < pts.length - 1; k++) if (meters(pts[k], stop.lon, stop.lat) <= STOP_MATCH_M) ks.push(k);
    if (ks.length) profIndex.set(p, ks);
  }
  if (profIndex.size === 0) return [];
  const heads = new Map(profilePoints(sim).map((x) => [x.p, x.headsign]));
  const out: ScheduledDeparture[] = [];
  const seen = new Set<string>();
  forEachTrip(sim, day, nextDay, (pi, t0) => {
    const p = sim.profs[pi];
    const ks = profIndex.get(p);
    if (!ks) return;
    for (const k of ks) {
      const time = t0 + p.T[k];
      if (time < from || time > from + windowS) continue;
      const key = `${p.route.n}|${time}|${heads.get(p)}`;
      if (seen.has(key)) continue; // pontili o corsie della stessa fermata
      seen.add(key);
      out.push({ line: p.route.n, category: p.route.cat, headsign: heads.get(p) ?? '', time });
    }
  });
  return out.sort((a, b) => a.time - b.time);
}

/**
 * Prima partenza dopo `from` quando non ce ne sono nella finestra delle prossime partenze (es. People Mover
 * di notte): il resto della giornata di servizio (anche dopo mezzanotte), altrimenti l'orario del giorno dopo.
 * `tomorrow`: la partenza è dopo la mezzanotte di oggi.
 */
export function nextScheduledDeparture(
  sim: SimModel,
  stop: Pick<StopItem, 'lat' | 'lon'>,
  day: DayType,
  nextDay: DayType,
  from: number,
): (ScheduledDeparture & { tomorrow: boolean }) | null {
  const later = scheduledDepartures(sim, stop, day, from, 30 * 3600 - from, nextDay)[0];
  if (later) return { ...later, tomorrow: later.time >= 86400 };
  const next = scheduledDepartures(sim, stop, nextDay, 0, 30 * 3600)[0];
  return next ? { ...next, tomorrow: true } : null;
}

export interface ScheduledArrival {
  line: string;
  category: string;
  /** fermata di partenza della corsa */
  origin: string;
  /** arrivo alla fermata (s dalla mezzanotte, oltre 86400 = dopo mezzanotte) */
  time: number;
}

/** Arrivi alla fermata tra `from` e `from + windowS`, ordinati per orario (il capolinea di partenza non è un arrivo). */
export function scheduledArrivals(
  sim: SimModel,
  stop: Pick<StopItem, 'lat' | 'lon'>,
  day: DayType,
  from: number,
  windowS = 90 * 60,
  nextDay?: DayType,
): ScheduledArrival[] {
  const profIndex = new Map<SimProfile, { ks: number[]; origin: string }>();
  for (const { p, pts, origin } of profilePoints(sim)) {
    const ks: number[] = [];
    for (let k = 1; k < pts.length; k++) if (meters(pts[k], stop.lon, stop.lat) <= STOP_MATCH_M) ks.push(k);
    if (ks.length) profIndex.set(p, { ks, origin });
  }
  const out: ScheduledArrival[] = [];
  const seen = new Set<string>();
  forEachTrip(sim, day, nextDay, (pi, t0) => {
    const p = sim.profs[pi];
    const e = profIndex.get(p);
    if (!e) return;
    for (const k of e.ks) {
      const time = t0 + p.T[k];
      if (time < from || time > from + windowS) continue;
      const key = `${p.route.n}|${time}|${e.origin}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ line: p.route.n, category: p.route.cat, origin: e.origin, time });
    }
  });
  return out.sort((a, b) => a.time - b.time);
}
