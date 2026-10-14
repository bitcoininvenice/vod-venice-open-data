/**
 * Trip planner a piedi + vaporetto sull'orario ufficiale ACTV (GTFS) e sulla rete pedonale OSM.
 *
 * Ricerca in stile RAPTOR con al massimo due corse (un cambio alla stessa fermata), confrontata con il
 * percorso solo a piedi. Con l'acqua alta i tratti a piedi preferiscono le calli più probabilmente
 * asciutte (lib/dryRouting). Non considera ritardi, affollamento né variazioni del servizio ACTV.
 */
import { forEachTrip, pointAt, type SimModel, type SimProfile } from './simulationCore';
import { fromGrid } from './positionDelay';
import { metersBetween, nearestNode, pathCoords, pathEdges, shortestPaths, type ShortestPaths, type WalkGraph } from './walkGraph';
import { addSummaries, floodWeights, summarizeEdges, WET_COST, type FloodWeights, type WetSummary } from './dryRouting';
import { MOSE_THRESHOLD_CM } from './tideCurve';
import type { DayType, PasserellaItem, StopItem } from './types';

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
export const MAX_SNAP_M = 250;
/**
 * Mezzi usati dal planner: navigazione, ferry e autobus del Lido e di Pellestrina, che collegano i pontili
 * (le fermate del planner sono quelle della navigazione).
 */
const PLANNER_CATEGORIES = new Set(['vaporetto', 'motoscafo', 'motonave', 'ferry', 'island']);
/** Modalità "preferisci vaporetto": tratti a piedi verso e dai pontili al massimo di (m) */
export const BOAT_ACCESS_M = 600;


export interface PlannerPoint {
  lon: number;
  lat: number;
  label: string;
}

export type Leg =
  | ({ kind: 'walk'; from: string; to: string; meters: number; seconds: number; start: number; end: number; coords: [number, number][] } & WetSummary)
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
      /** partenza della corsa dal capolinea (s dalla mezzanotte): per ritrovare il mezzo nel feed GPS */
      tripDeparture: number;
      /** colore della linea quando non è una linea ACTV di navigazione (Alilaguna, bus) */
      color?: string;
      /** operatore, se non ACTV */
      operator?: 'alilaguna';
    }
  /** in barca con un mezzo privato (planner «In barca», lib/boatRouting) */
  | { kind: 'boat'; from: string; to: string; meters: number; seconds: number; start: number; end: number; coords: [number, number][] };

export interface Itinerary extends WetSummary {
  /** secondi dalla mezzanotte */
  depart: number;
  arrive: number;
  legs: Leg[];
  walkMeters: number;
  rides: number;
  /** almeno una corsa con marea da MOSE (≥ +110 cm): ACTV può deviare o ridurre il servizio */
  ridesInHighWater: boolean;
  /** opzioni per l'aeroporto (lib/airportPlanner): Alilaguna via acqua o ACTV con il bus da Piazzale Roma */
  via?: 'alilaguna' | 'actv';
}

/** Più veloce (a piedi o in vaporetto), solo a piedi, con meno strada a piedi possibile; `private`: in barca propria (lib/boatRouting) */
export type PlanMode = 'fastest' | 'walk' | 'boat' | 'private';

export interface PlanOptions {
  mode?: PlanMode;
  /** livello di marea in città all'ora indicata (secondi dalla mezzanotte), null se non noto */
  tideAt?: (seconds: number) => number | null;
  /** percorsi su passerelle del piano del Comune */
  passerelle?: PasserellaItem[];
  /** tipo di giorno di domani: per vedere le corse dopo mezzanotte (es. bus 5 alle 00:10) */
  nextDay?: DayType;
  /** tratti a piedi verso e dai pontili al massimo di (m); di norma MAX_ACCESS_M */
  maxAccessM?: number;
}

export interface PlanResult {
  best: Itinerary | null;
  /** percorso solo a piedi, se esiste */
  walkOnly: Itinerary | null;
  /** livello massimo di marea considerato per i tratti a piedi (null se nessun allagamento) */
  floodLevelCm: number | null;
  /** metri allagati del percorso a piedi più breve, per confronto con quello più asciutto */
  shortestWalkWetMeters: number | null;
}

/** Fermate della mappa (navigazione e ferry) servite da ogni profilo, in ordine, con l'indice della fermata nel profilo. */
const profileStopsCache = new WeakMap<SimModel, WeakMap<StopItem[], Map<SimProfile, { stop: number; k: number }[]>>>();

/** Gli indici delle fermate valgono per l'elenco passato: la cache è per orario e per elenco. */
export function profileStops(sim: SimModel, stops: StopItem[]): Map<SimProfile, { stop: number; k: number }[]> {
  let bySim = profileStopsCache.get(sim);
  if (!bySim) {
    bySim = new WeakMap();
    profileStopsCache.set(sim, bySim);
  }
  let cached = bySim.get(stops);
  if (cached) return cached;
  cached = new Map();
  const pt: [number, number] = [0, 0];
  for (const p of sim.profs) {
    if (!PLANNER_CATEGORIES.has(p.route.cat)) continue;
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
  bySim.set(stops, cached);
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

interface Search {
  graph: WalkGraph;
  sim: SimModel;
  stops: StopItem[];
  fromO: ShortestPaths;
  toD: ShortestPaths;
  floodO: FloodWeights | null;
  floodD: FloodWeights | null;
  stopNode: { node: number; meters: number }[];
  accessM: number[];
  egressM: number[];
  origin: PlannerPoint;
  dest: PlannerPoint;
  now: number;
  day: DayType;
  nextDay?: DayType;
  tideAt?: (seconds: number) => number | null;
}

/** Secondi "equivalenti" di un tratto bagnato: serve a preferire l'itinerario più asciutto a parità di tempo */
const wetSeconds = (it: Itinerary) => (it.wetMeters * WET_COST) / WALK_SPEED;

/**
 * Itinerario migliore da `origin` a `dest` partendo a `now` (secondi dalla mezzanotte).
 * `stops`: fermate della mappa; si usano quelle di navigazione e ferry.
 */
const waterStopsCache = new WeakMap<StopItem[], StopItem[]>();
/** Pontili della navigazione e del ferry (stesso array per lo stesso elenco: serve alla cache delle sequenze). */
function waterStops(all: StopItem[]): StopItem[] {
  let w = waterStopsCache.get(all);
  if (!w) {
    w = all.filter((s) => s.mode === 'navigazione' || s.mode === 'ferry');
    waterStopsCache.set(all, w);
  }
  return w;
}

export function planTrip(
  graph: WalkGraph,
  sim: SimModel,
  allStops: StopItem[],
  origin: PlannerPoint,
  dest: PlannerPoint,
  now: number,
  day: DayType,
  options: PlanOptions = {},
): PlanResult {
  const { mode = 'fastest', tideAt, passerelle = [], nextDay, maxAccessM = MAX_ACCESS_M } = options;
  const none: PlanResult = { best: null, walkOnly: null, floodLevelCm: null, shortestWalkWetMeters: null };
  const stops = waterStops(allStops);
  const o = nearestNode(graph, origin.lon, origin.lat);
  const d = nearestNode(graph, dest.lon, dest.lat);
  if (o.meters > MAX_SNAP_M || d.meters > MAX_SNAP_M) return none;

  // Marea alla partenza per i tratti dall'origine, all'arrivo stimato per quelli verso la destinazione
  const floodO = floodWeights(graph, tideAt?.(now), passerelle);
  const fromO = shortestPaths(graph, o.node, Infinity, floodO?.weight);
  const walkEstimate = Number.isFinite(fromO.meters[d.node]) ? fromO.meters[d.node] / WALK_SPEED : 1800;
  const floodD = floodWeights(graph, tideAt?.(now + walkEstimate), passerelle);
  const toD = shortestPaths(graph, d.node, Infinity, floodD?.weight);

  // Solo a piedi (il più asciutto se c'è acqua)
  const directM = fromO.meters[d.node] + o.meters + d.meters;
  const walkWet = summarizeEdges(graph, pathEdges(graph, fromO, d.node), floodO);
  const walkOnly: Itinerary | null = Number.isFinite(directM)
    ? {
        depart: now,
        arrive: now + directM / WALK_SPEED,
        legs: [{ kind: 'walk', from: origin.label, to: dest.label, meters: directM, seconds: directM / WALK_SPEED, start: now, end: now + directM / WALK_SPEED, coords: [[origin.lon, origin.lat], ...pathCoords(graph, fromO, d.node), [dest.lon, dest.lat]], ...walkWet }],
        walkMeters: directM,
        rides: 0,
        ridesInHighWater: false,
        ...walkWet,
      }
    : null;
  const floodLevelCm = floodO || floodD ? Math.max(floodO?.levelCm ?? 0, floodD?.levelCm ?? 0) : null;
  // Confronto: quanta acqua avrebbe il percorso più breve
  let shortestWalkWetMeters: number | null = null;
  if (floodO && walkOnly) {
    const plain = shortestPaths(graph, o.node);
    shortestWalkWetMeters = summarizeEdges(graph, pathEdges(graph, plain, d.node), floodO).wetMeters;
  }
  const base = { walkOnly, floodLevelCm, shortestWalkWetMeters };
  if (mode === 'walk') return { best: walkOnly, ...base };

  const stopNode = stops.map((s) => nearestNode(graph, s.lon, s.lat));
  const search: Search = {
    graph, sim, stops, fromO, toD, floodO, floodD, stopNode, origin, dest, now, day, nextDay, tideAt,
    accessM: stopNode.map((sn) => (sn.meters <= MAX_SNAP_M ? fromO.meters[sn.node] + o.meters + sn.meters : Infinity)),
    egressM: stopNode.map((sn) => (sn.meters <= MAX_SNAP_M ? toD.meters[sn.node] + d.meters + sn.meters : Infinity)),
  };

  if (mode === 'boat') {
    // meno strada a piedi possibile: pontili vicini, poi se serve quelli più lontani
    const viaBoat = raptor(search, BOAT_ACCESS_M) ?? raptor(search, maxAccessM);
    return { best: viaBoat ?? walkOnly, ...base };
  }
  const viaBoat = raptor(search, maxAccessM);
  const bestOverall =
    viaBoat && (!walkOnly || viaBoat.arrive + wetSeconds(viaBoat) < walkOnly.arrive + wetSeconds(walkOnly) - 60) ? viaBoat : walkOnly;
  return { best: bestOverall, ...base };
}

/** Ricerca a giri (al massimo due corse) con tratti a piedi entro `accessLimit` metri. */
function raptor(q: Search, accessLimit: number): Itinerary | null {
  const { sim, stops, accessM, egressM, now, day, nextDay } = q;
  const seqs = profileStops(sim, stops);
  const rounds: Label[][] = [stops.map((_, s) => ({ time: accessM[s] <= accessLimit ? now + accessM[s] / WALK_SPEED : Infinity }))];
  for (let round = 1; round <= 2; round++) {
    const prev = rounds[round - 1];
    const cur: Label[] = prev.map((l) => ({ ...l }));
    const buffer = round === 1 ? BOARD_BUFFER_S : TRANSFER_BUFFER_S;
    // anche le corse dopo mezzanotte, che il simulatore tiene nell'elenco del giorno dopo
    forEachTrip(sim, day, nextDay, (pi, departure, end) => {
      if (departure > now + HORIZON_S || end < now) return;
      const p = sim.profs[pi];
      const seq = seqs.get(p);
      if (!seq) return;
      let board = -1;
      for (let j = 0; j < seq.length; j++) {
        const t = departure + p.T[seq[j].k];
        if (board !== -1 && t < cur[seq[j].stop].time) {
          cur[seq[j].stop] = { time: t, ride: { profile: p, departure, boardK: seq[board].k, alightK: seq[j].k, stops: j - board, fromStop: seq[board].stop, terminus: seq[seq.length - 1].stop } };
        }
        // si sale alla prima fermata raggiungibile in tempo (arrivati al giro precedente, senza essere scesi da questa stessa corsa)
        if (board === -1 && prev[seq[j].stop].time + buffer <= t && (round === 1 || prev[seq[j].stop].ride)) board = j;
      }
    });
    rounds.push(cur);
  }

  // Migliore arrivo a destinazione: per ogni giro, fermata + tratto a piedi finale
  let best: { round: number; stop: number; arrive: number } | null = null;
  for (let round = 1; round <= 2; round++) {
    for (let s = 0; s < stops.length; s++) {
      const l = rounds[round][s];
      if (!l.ride || !Number.isFinite(egressM[s]) || egressM[s] > accessLimit) continue;
      const arrive = l.time + egressM[s] / WALK_SPEED;
      // un cambio deve far guadagnare almeno 2 minuti per essere proposto
      if (!best || arrive < best.arrive - (round > best.round ? 120 : 0)) best = { round, stop: s, arrive };
    }
  }
  return best ? buildItinerary(q, rounds, best) : null;
}

function buildItinerary(q: Search, rounds: Label[][], best: { round: number; stop: number; arrive: number }): Itinerary {
  const { graph, fromO, toD, stopNode, stops, origin, dest, now, accessM, egressM } = q;
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
  const wetIn = summarizeEdges(graph, pathEdges(graph, fromO, stopNode[firstStop].node), q.floodO);
  const boardTime = firstBoard.departure + firstBoard.profile.T[firstBoard.boardK];
  legs.push({ kind: 'walk', from: origin.label, to: stops[firstStop].name, meters: walkIn, seconds: walkIn / WALK_SPEED, start: boardTime - walkIn / WALK_SPEED, end: boardTime, coords: walkInCoords, ...wetIn });
  let ridesInHighWater = false;
  for (const r of rides) {
    const ride = r.label.ride!;
    const kBoard = ride.boardK;
    const kAlight = ride.alightK;
    const start = ride.departure + ride.profile.T[kBoard];
    if ((q.tideAt?.(start) ?? -Infinity) >= MOSE_THRESHOLD_CM) ridesInHighWater = true;
    legs.push({
      kind: 'ride',
      line: ride.profile.route.n,
      category: ride.profile.route.cat,
      headsign: stops[ride.terminus].name,
      from: stops[ride.fromStop].name,
      to: stops[r.stop].name,
      start,
      end: ride.departure + ride.profile.T[kAlight],
      stops: ride.stops,
      tripDeparture: ride.departure,
      coords: rideCoords(ride.profile, ride.profile.Dd[kBoard], ride.profile.Dd[kAlight]),
    });
  }
  const lastStop = best.stop;
  const walkOut = egressM[lastStop];
  const lastEnd = (legs[legs.length - 1] as Extract<Leg, { kind: 'ride' }>).end;
  const walkOutCoords = [[stops[lastStop].lon, stops[lastStop].lat] as [number, number], ...pathCoords(graph, toD, stopNode[lastStop].node).reverse(), [dest.lon, dest.lat] as [number, number]];
  const wetOut = summarizeEdges(graph, pathEdges(graph, toD, stopNode[lastStop].node), q.floodD);
  legs.push({ kind: 'walk', from: stops[lastStop].name, to: dest.label, meters: walkOut, seconds: walkOut / WALK_SPEED, start: lastEnd, end: lastEnd + walkOut / WALK_SPEED, coords: walkOutCoords, ...wetOut });
  return {
    depart: Math.max(now, legs[0].start),
    arrive: best.arrive,
    legs,
    walkMeters: walkIn + walkOut,
    rides: rides.length,
    ridesInHighWater,
    ...addSummaries(wetIn, wetOut),
  };
}
