/**
 * Trip planner a piedi + vaporetto sull'orario ufficiale ACTV (GTFS) e sulla rete pedonale OSM.
 *
 * Ricerca in stile RAPTOR con al massimo due corse (un cambio alla stessa fermata), confrontata con il
 * percorso solo a piedi. Non considera ritardi, affollamento né acqua alta: è dichiarato nella scheda.
 */
import { pointAt, type SimModel, type SimProfile } from './simulationCore';
import { fromGrid } from './positionDelay';
import { metersBetween, nearestNode, pathCoords, shortestPaths, type WalkGraph } from './walkGraph';
import type { DayType, StopItem } from './types';

/** Velocità a piedi (m/s): circa 4,5 km/h, ponti e calli strette compresi. */
export const WALK_SPEED = 1.25;
/** Percorso a piedi massimo verso o da un imbarcadero (m). */
export const MAX_ACCESS_M = 1500;
/** Tempo minimo per salire a bordo dopo l'arrivo a piedi e per cambiare mezzo (s). */
export const BOARD_BUFFER_S = 60;
export const TRANSFER_BUFFER_S = 180;
/** Orizzonte della ricerca dopo l'ora di partenza (s). */
export const HORIZON_S = 3 * 3600;
/** Oltre questa distanza dalla rete il punto non è raggiungibile a piedi (m). */
const MAX_SNAP_M = 250;

const WATER = new Set(['vaporetto', 'motoscafo', 'motonave', 'ferry', 'island']);

export interface PlannerPoint {
  lon: number;
  lat: number;
  label: string;
}

export type Leg =
  | { kind: 'walk'; from: string; to: string; meters: number; seconds: number; start: number; end: number; coords: [number, number][] }
  | {
      kind: 'ride';
      line: string;
      category: string;
      headsign: string;
      from: string;
      to: string;
      start: number;
      end: number;
      stops: number;
      coords: [number, number][];
    };

export interface Itinerary {
  /** secondi dalla mezzanotte */
  depart: number;
  arrive: number;
  legs: Leg[];
  walkMeters: number;
  rides: number;
}

export interface PlanResult {
  best: Itinerary | null;
  /** percorso solo a piedi, se esiste */
  walkOnly: Itinerary | null;
}

/** Fermate della mappa (navigazione e ferry) servite da ogni profilo, in ordine, con l'indice della fermata nel profilo. */
const profileStopsCache = new WeakMap<SimModel, Map<SimProfile, { stop: number; k: number }[]>>();

function profileStops(sim: SimModel, stops: StopItem[]): Map<SimProfile, { stop: number; k: number }[]> {
  let cached = profileStopsCache.get(sim);
  if (cached) return cached;
  cached = new Map();
  const pt: [number, number] = [0, 0];
  for (const p of sim.profs) {
    if (!WATER.has(p.route.cat)) continue;
    const seq: { stop: number; k: number }[] = [];
    for (let k = 0; k < p.Dd.length; k++) {
      pointAt(p.sh, p.Dd[k], pt);
      const [lon, lat] = fromGrid(pt[0], pt[1]);
      let best = -1;
      let bestD = 150;
      for (let s = 0; s < stops.length; s++) {
        const d = metersBetween(lon, lat, stops[s].lon, stops[s].lat);
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }
      if (best === -1) continue;
      if (seq.length > 0 && seq[seq.length - 1].stop === best) seq[seq.length - 1].k = k; // pontili della stessa fermata
      else seq.push({ stop: best, k });
    }
    if (seq.length >= 2) cached.set(p, seq);
  }
  profileStopsCache.set(sim, cached);
  return cached;
}

interface Label {
  time: number;
  /** come si è arrivati: a piedi dall'origine, oppure con una corsa */
  ride?: { profile: SimProfile; departure: number; boardK: number; alightK: number; stops: number; fromStop: number; terminus: number };
}

/** Tracciato del tratto di corsa tra due fermate del profilo. */
function rideCoords(p: SimProfile, d0: number, d1: number): [number, number][] {
  const out: [number, number][] = [];
  const pt: [number, number] = [0, 0];
  const steps = Math.max(2, Math.ceil((d1 - d0) / 40));
  for (let i = 0; i <= steps; i++) {
    pointAt(p.sh, d0 + ((d1 - d0) * i) / steps, pt);
    out.push(fromGrid(pt[0], pt[1]));
  }
  return out;
}

/**
 * Itinerario migliore (arrivo più presto) da `origin` a `dest` partendo a `now` (secondi dalla mezzanotte).
 * `stops`: fermate della mappa; si usano quelle di navigazione e ferry.
 */
export function planTrip(
  graph: WalkGraph,
  sim: SimModel,
  allStops: StopItem[],
  origin: PlannerPoint,
  dest: PlannerPoint,
  now: number,
  day: DayType,
): PlanResult {
  const stops = allStops.filter((s) => s.mode === 'navigazione' || s.mode === 'ferry');
  const o = nearestNode(graph, origin.lon, origin.lat);
  const d = nearestNode(graph, dest.lon, dest.lat);
  if (o.meters > MAX_SNAP_M || d.meters > MAX_SNAP_M) return { best: null, walkOnly: null };
  const fromO = shortestPaths(graph, o.node);
  const toD = shortestPaths(graph, d.node);

  // Solo a piedi
  const directM = fromO.dist[d.node] + o.meters + d.meters;
  const walkOnly: Itinerary | null = Number.isFinite(directM)
    ? {
        depart: now,
        arrive: now + directM / WALK_SPEED,
        legs: [{ kind: 'walk', from: origin.label, to: dest.label, meters: directM, seconds: directM / WALK_SPEED, start: now, end: now + directM / WALK_SPEED, coords: [[origin.lon, origin.lat], ...pathCoords(graph, fromO, d.node), [dest.lon, dest.lat]] }],
        walkMeters: directM,
        rides: 0,
      }
    : null;

  // Accesso a piedi a ogni fermata
  const stopNode = stops.map((s) => nearestNode(graph, s.lon, s.lat));
  const accessM = stopNode.map((sn) => (sn.meters <= MAX_SNAP_M ? fromO.dist[sn.node] + o.meters + sn.meters : Infinity));
  const egressM = stopNode.map((sn) => (sn.meters <= MAX_SNAP_M ? toD.dist[sn.node] + d.meters + sn.meters : Infinity));

  const seqs = profileStops(sim, stops);
  const trips = sim.daysTrips[day];
  const rounds: Label[][] = [stops.map((_, s) => ({ time: accessM[s] <= MAX_ACCESS_M ? now + accessM[s] / WALK_SPEED : Infinity }))];
  for (let round = 1; round <= 2; round++) {
    const prev = rounds[round - 1];
    const cur: Label[] = prev.map((l) => ({ ...l }));
    const buffer = round === 1 ? BOARD_BUFFER_S : TRANSFER_BUFFER_S;
    for (let i = 0; i < trips.count; i++) {
      const departure = trips.t0[i];
      if (departure > now + HORIZON_S || trips.t1[i] < now) continue;
      const p = sim.profs[trips.tP[i]];
      const seq = seqs.get(p);
      if (!seq) continue;
      let board = -1;
      for (let j = 0; j < seq.length; j++) {
        const t = departure + p.T[seq[j].k];
        if (board !== -1 && t < cur[seq[j].stop].time) {
          cur[seq[j].stop] = { time: t, ride: { profile: p, departure, boardK: seq[board].k, alightK: seq[j].k, stops: j - board, fromStop: seq[board].stop, terminus: seq[seq.length - 1].stop } };
        }
        // si sale alla prima fermata raggiungibile in tempo (arrivati al giro precedente, senza essere scesi da questa stessa corsa)
        if (board === -1 && prev[seq[j].stop].time + buffer <= t && (round === 1 || prev[seq[j].stop].ride)) board = j;
      }
    }
    rounds.push(cur);
  }

  // Migliore arrivo a destinazione: per ogni giro, fermata + tratto a piedi finale
  let best: { round: number; stop: number; arrive: number } | null = null;
  for (let round = 1; round <= 2; round++) {
    for (let s = 0; s < stops.length; s++) {
      const l = rounds[round][s];
      if (!l.ride || !Number.isFinite(egressM[s]) || egressM[s] > MAX_ACCESS_M) continue;
      const arrive = l.time + egressM[s] / WALK_SPEED;
      // un cambio deve far guadagnare almeno 2 minuti per essere proposto
      if (!best || arrive < best.arrive - (round > best.round ? 120 : 0)) best = { round, stop: s, arrive };
    }
  }
  const viaBoat = best ? buildItinerary(graph, fromO, toD, stopNode, stops, rounds, best, origin, dest, now, accessM, egressM) : null;
  const bestOverall = viaBoat && (!walkOnly || viaBoat.arrive < walkOnly.arrive - 60) ? viaBoat : walkOnly;
  return { best: bestOverall, walkOnly };
}

function buildItinerary(
  graph: WalkGraph,
  fromO: ReturnType<typeof shortestPaths>,
  toD: ReturnType<typeof shortestPaths>,
  stopNode: { node: number; meters: number }[],
  stops: StopItem[],
  rounds: Label[][],
  best: { round: number; stop: number; arrive: number },
  origin: PlannerPoint,
  dest: PlannerPoint,
  now: number,
  accessM: number[],
  egressM: number[],
): Itinerary {
  // risale le corse dall'ultima alla prima
  const rides: { label: Label; stop: number }[] = [];
  let stop = best.stop;
  for (let round = best.round; round >= 1; round--) {
    const l = rounds[round][stop];
    if (!l.ride) break;
    rides.unshift({ label: l, stop });
    stop = l.ride.fromStop;
    // se a questo giro si è arrivati alla fermata di partenza a piedi, la catena è finita
    if (!rounds[round - 1][stop].ride) break;
  }
  const legs: Leg[] = [];
  const firstStop = rides[0].label.ride!.fromStop;
  const firstBoard = rides[0].label.ride!;
  const walkIn = accessM[firstStop];
  const walkInCoords = [[origin.lon, origin.lat] as [number, number], ...pathCoords(graph, fromO, stopNode[firstStop].node), [stops[firstStop].lon, stops[firstStop].lat] as [number, number]];
  const boardTime = firstBoard.departure + firstBoard.profile.T[firstBoard.boardK];
  legs.push({ kind: 'walk', from: origin.label, to: stops[firstStop].name, meters: walkIn, seconds: walkIn / WALK_SPEED, start: boardTime - walkIn / WALK_SPEED, end: boardTime, coords: walkInCoords });
  for (const r of rides) {
    const ride = r.label.ride!;
    const kBoard = ride.boardK;
    const kAlight = ride.alightK;
    legs.push({
      kind: 'ride',
      line: ride.profile.route.n,
      category: ride.profile.route.cat,
      headsign: stops[ride.terminus].name,
      from: stops[ride.fromStop].name,
      to: stops[r.stop].name,
      start: ride.departure + ride.profile.T[kBoard],
      end: ride.departure + ride.profile.T[kAlight],
      stops: ride.stops,
      coords: rideCoords(ride.profile, ride.profile.Dd[kBoard], ride.profile.Dd[kAlight]),
    });
  }
  const lastStop = best.stop;
  const walkOut = egressM[lastStop];
  const lastEnd = (legs[legs.length - 1] as Extract<Leg, { kind: 'ride' }>).end;
  const walkOutCoords = [[stops[lastStop].lon, stops[lastStop].lat] as [number, number], ...pathCoords(graph, toD, stopNode[lastStop].node).reverse(), [dest.lon, dest.lat] as [number, number]];
  legs.push({ kind: 'walk', from: stops[lastStop].name, to: dest.label, meters: walkOut, seconds: walkOut / WALK_SPEED, start: lastEnd, end: lastEnd + walkOut / WALK_SPEED, coords: walkOutCoords });
  return {
    depart: Math.max(now, legs[0].start),
    arrive: best.arrive,
    legs,
    walkMeters: walkIn + walkOut,
    rides: rides.length,
  };
}
