/**
 * Trip planner con tutti i mezzi pubblici sull'orario ufficiale (ACTV GTFS: navigazione, bus urbani ed
 * extraurbani, tram, People Mover; Alilaguna GTFS) e sulla rete pedonale OSM.
 *
 * Ricerca in stile RAPTOR fino a MAX_RIDES corse, con cambi alla stessa fermata o a piedi tra fermate vicine,
 * confrontata con il percorso solo a piedi; restituisce anche le alternative con meno cambi. Con l'acqua alta i
 * tratti a piedi preferiscono le calli più probabilmente asciutte (lib/dryRouting). Non considera ritardi,
 * affollamento né variazioni del servizio.
 */
import { pointAt, type SimModel, type SimProfile } from './simulationCore';
import { fromGrid } from './positionDelay';
import { metersBetween, nearestNode, pathCoords, pathEdges, shortestPaths, type ShortestPaths, type WalkGraph } from './walkGraph';
import { addSummaries, floodWeights, NO_WATER, summarizeEdges, WET_COST, type FloodWeights, type WetSummary } from './dryRouting';
import { buildNetwork, runsOf, WATER_CATEGORIES, type Network, type Run } from './transitNetwork';
import { alilagunaShapeBetween } from './alilaguna-schedule';
import { MOSE_THRESHOLD_CM } from './tideCurve';
import type { DayType, PasserellaItem, StopItem } from './types';

/** Velocità a piedi (m/s): circa 4,5 km/h, ponti e calli strette compresi. */
export const WALK_SPEED = 1.25;
/** Percorso a piedi massimo verso o da un imbarcadero (m). */
export const MAX_ACCESS_M = 1500;
/** Tempo minimo per salire a bordo dopo l'arrivo a piedi e per cambiare mezzo (s). */
export const BOARD_BUFFER_S = 60;
export const TRANSFER_BUFFER_S = 120;
/** Orizzonte della ricerca dopo l'ora di partenza (s). */
export const HORIZON_S = 3 * 3600;
/** Oltre questa distanza dalla rete il punto non è raggiungibile a piedi (m). */
export const MAX_SNAP_M = 250;
/** Mezzi abbinati ai pontili in profileStops (ultime partenze, velocità da orario): navigazione, ferry, bus del Lido */
const PLANNER_CATEGORIES = new Set(['vaporetto', 'motoscafo', 'motonave', 'ferry', 'island']);
/** Modalità «preferisci via acqua»: tratti a piedi verso e dai pontili al massimo di (m) */
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
  via?: 'alilaguna' | 'actv' | 'mixed';
  /** il primo mezzo parte prima di quanto serve ad arrivare a piedi alla fermata: si fa solo sbrigandosi */
  hurry?: HurryInfo;
}

export interface HurryInfo {
  line: string;
  category: string;
  /** fermata da cui parte il mezzo */
  stop: string;
  /** partenza (s dalla mezzanotte) */
  departs: number;
  /** tempo a piedi fino alla fermata al passo normale (s) */
  walkSeconds: number;
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
  /**
   * Partenza «adesso»: se a piedi non si arriva in tempo ma il mezzo non è ancora partito, si propone comunque
   * (Itinerary.hurry), con il percorso normale in PlanResult.ifLate.
   */
  hurry?: boolean;
  /** data del viaggio per l'orario Alilaguna (null: senza Alilaguna) */
  date?: Date | null;
}

export interface PlanResult {
  best: Itinerary | null;
  /** percorso solo a piedi, se esiste */
  walkOnly: Itinerary | null;
  /** livello massimo di marea considerato per i tratti a piedi (null se nessun allagamento) */
  floodLevelCm: number | null;
  /** metri allagati del percorso a piedi più breve, per confronto con quello più asciutto */
  shortestWalkWetMeters: number | null;
  /** se `best` va fatto di corsa: il percorso al passo normale (null se non c'è) */
  ifLate?: Itinerary | null;
  /** alternative con mezzi diversi o meno cambi, dalla più veloce (comprende `best` se non è a piedi) */
  alternatives?: Itinerary[];
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

/** Etichetta di arrivo a una fermata: come ci si è arrivati (a piedi dall'origine, con una corsa, con un cambio a piedi) */
interface Label {
  time: number;
  rides: number;
  stop: number;
  how: 'access' | 'ride' | 'walk';
  parent: Label | null;
  run?: Run;
  boardJ?: number;
  alightJ?: number;
  /** cambio a piedi: metri */
  meters?: number;
}

interface Search {
  graph: WalkGraph;
  sim: SimModel;
  net: Network;
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
  runs: Run[];
  tideAt?: (seconds: number) => number | null;
}

/** Secondi "equivalenti" di un tratto bagnato: serve a preferire l'itinerario più asciutto a parità di tempo */
const wetSeconds = (it: Itinerary) => (it.wetMeters * WET_COST) / WALK_SPEED;

/** Nodo della rete pedonale più vicino a ogni fermata, una volta per rete pedonale e rete dei mezzi. */
const stopNodeCache = new WeakMap<WalkGraph, WeakMap<Network, { node: number; meters: number }[]>>();
function stopNodes(graph: WalkGraph, net: Network): { node: number; meters: number }[] {
  let byNet = stopNodeCache.get(graph);
  if (!byNet) {
    byNet = new WeakMap();
    stopNodeCache.set(graph, byNet);
  }
  let out = byNet.get(net);
  if (!out) {
    out = net.stops.map((s) => nearestNode(graph, s.lon, s.lat));
    byNet.set(net, out);
  }
  return out;
}

/** Oltre questa distanza il percorso solo a piedi non si propone (m) */
const WALK_ONLY_MAX_M = 8000;

/**
 * Itinerario migliore da `origin` a `dest` partendo a `now` (secondi dalla mezzanotte), con tutti i mezzi:
 * navigazione, bus, tram e People Mover ACTV, Alilaguna; fino a MAX_RIDES corse con cambi alla stessa fermata o
 * a piedi tra fermate vicine. `allStops` resta per compatibilità: le fermate sono quelle di lib/transitNetwork.
 */
export function planTrip(
  graph: WalkGraph,
  sim: SimModel,
  _allStops: StopItem[],
  origin: PlannerPoint,
  dest: PlannerPoint,
  now: number,
  day: DayType,
  options: PlanOptions = {},
): PlanResult {
  const { mode = 'fastest', tideAt, passerelle = [], nextDay, maxAccessM = MAX_ACCESS_M, hurry = false, date = null } = options;
  const none: PlanResult = { best: null, walkOnly: null, floodLevelCm: null, shortestWalkWetMeters: null, alternatives: [] };
  const o = nearestNode(graph, origin.lon, origin.lat);
  const d = nearestNode(graph, dest.lon, dest.lat);
  if (o.meters > MAX_SNAP_M || d.meters > MAX_SNAP_M) return none;

  // Marea alla partenza per i tratti dall'origine, all'arrivo stimato per quelli verso la destinazione
  const reach = Math.max(WALK_ONLY_MAX_M, maxAccessM);
  const floodO = floodWeights(graph, tideAt?.(now), passerelle);
  const fromO = shortestPaths(graph, o.node, reach, floodO?.weight);
  const walkEstimate = Number.isFinite(fromO.meters[d.node]) ? fromO.meters[d.node] / WALK_SPEED : 1800;
  const floodD = floodWeights(graph, tideAt?.(now + walkEstimate), passerelle);
  const toD = shortestPaths(graph, d.node, reach, floodD?.weight);

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
    const plain = shortestPaths(graph, o.node, reach);
    shortestWalkWetMeters = summarizeEdges(graph, pathEdges(graph, plain, d.node), floodO).wetMeters;
  }
  const base = { walkOnly, floodLevelCm, shortestWalkWetMeters };
  if (mode === 'walk') return { best: walkOnly, alternatives: [], ...base };

  const net = buildNetwork(sim);
  const stopNode = stopNodes(graph, net);
  // «Preferisci via acqua»: solo mezzi d'acqua (navigazione ACTV e Alilaguna)
  const keep = mode === 'boat' ? (cat: string) => WATER_CATEGORIES.has(cat) || cat === 'alilaguna' : () => true;
  const search: Search = {
    graph, sim, net, fromO, toD, floodO, floodD, stopNode, origin, dest, now, tideAt,
    runs: runsOf(net, sim, day, nextDay, date, keep),
    accessM: stopNode.map((sn) => (sn.meters <= MAX_SNAP_M ? fromO.meters[sn.node] + o.meters + sn.meters : Infinity)),
    egressM: stopNode.map((sn) => (sn.meters <= MAX_SNAP_M ? toD.meters[sn.node] + d.meters + sn.meters : Infinity)),
  };

  /** Di corsa: lo stesso calcolo senza il tempo a piedi fino alla prima fermata, proposto se arriva prima. */
  const withHurry = (normal: Itinerary | null, alternatives: Itinerary[], limit: number): PlanResult => {
    if (!hurry) return { best: normal, alternatives, ...base };
    const rushed = raptor(search, limit, true).best;
    if (rushed?.hurry && (!normal || rushed.arrive < normal.arrive - 60)) return { best: rushed, ifLate: normal, alternatives: [rushed, ...alternatives], ...base };
    return { best: normal, alternatives, ...base };
  };
  if (mode === 'boat') {
    // meno strada a piedi possibile: fermate vicine, poi se serve quelle più lontane
    const near = raptor(search, BOAT_ACCESS_M);
    const found = near.best ? near : raptor(search, maxAccessM);
    return withHurry(found.best ?? walkOnly, found.alternatives, near.best ? BOAT_ACCESS_M : maxAccessM);
  }
  const found = raptor(search, maxAccessM);
  const viaTransit = found.best;
  const bestOverall =
    viaTransit && (!walkOnly || viaTransit.arrive + wetSeconds(viaTransit) < walkOnly.arrive + wetSeconds(walkOnly) - 60) ? viaTransit : walkOnly;
  return withHurry(bestOverall, bestOverall === walkOnly ? [] : found.alternatives, maxAccessM);
}

/** Corse al massimo per itinerario (tre cambi) */
export const MAX_RIDES = 4;
/** Un cambio in più deve far arrivare prima di almeno (s) */
const EXTRA_RIDE_GAIN_S = 120;

/**
 * Ricerca a giri in stile RAPTOR: al giro r si arriva a ogni fermata con r corse; tra un giro e l'altro cambi alla
 * stessa fermata o a piedi verso le fermate vicine. Restituisce il più veloce e le alternative con meno cambi.
 * `rushed`: si può salire su ogni mezzo che non è ancora partito, anche se a piedi non si arriverebbe in tempo.
 */
function raptor(q: Search, accessLimit: number, rushed = false): { best: Itinerary | null; alternatives: Itinerary[] } {
  const { net, runs, accessM, egressM, now } = q;
  const n = net.stops.length;
  const bestAt = new Float64Array(n).fill(Infinity);
  let prev: (Label | null)[] = net.stops.map((_, s) =>
    accessM[s] <= accessLimit ? { time: rushed ? now : now + accessM[s] / WALK_SPEED, rides: 0, stop: s, how: 'access', parent: null } : null,
  );
  const rounds: (Label | null)[][] = [prev];
  for (let r = 1; r <= MAX_RIDES; r++) {
    const cur: (Label | null)[] = new Array(n).fill(null);
    let any = false;
    for (const run of runs) {
      const pat = run.pat;
      const last = pat.stops.length - 1;
      if (run.base > now + HORIZON_S || run.base + pat.arr[last] < now) continue;
      let boardJ = -1;
      let boardLabel: Label | null = null;
      for (let j = 0; j <= last; j++) {
        const s = pat.stops[j];
        if (boardJ !== -1) {
          const t = run.base + pat.arr[j];
          if (t < bestAt[s] && t < (cur[s]?.time ?? Infinity)) {
            cur[s] = { time: t, rides: r, stop: s, how: 'ride', parent: boardLabel, run, boardJ, alightJ: j };
            any = true;
          }
        } else if (j < last) {
          const l = prev[s];
          if (!l) continue;
          // margine per salire: dall'origine a piedi, dopo un cambio a piedi, alla stessa fermata dopo un'altra corsa
          const buffer = l.how === 'access' ? (rushed ? 0 : BOARD_BUFFER_S) : l.how === 'walk' ? BOARD_BUFFER_S : TRANSFER_BUFFER_S;
          if (l.time + buffer <= run.base + pat.dep[j]) {
            boardJ = j;
            boardLabel = l;
          }
        }
      }
    }
    if (!any) break;
    // cambi a piedi verso le fermate vicine (solo dopo una corsa)
    for (let s = 0; s < n; s++) {
      const l = cur[s];
      if (!l || l.how !== 'ride') continue;
      for (const nb of net.neighbors[s]) {
        const t = l.time + nb.meters / WALK_SPEED;
        if (t < bestAt[nb.to] && t < (cur[nb.to]?.time ?? Infinity) && t < l.time + 1800) {
          cur[nb.to] = { time: t, rides: r, stop: nb.to, how: 'walk', parent: l, meters: nb.meters };
        }
      }
    }
    for (let s = 0; s < n; s++) if (cur[s] && cur[s]!.time < bestAt[s]) bestAt[s] = cur[s]!.time;
    rounds.push(cur);
    prev = cur;
  }

  // Per ogni numero di corse il miglior arrivo a destinazione (fermata + tratto a piedi finale)
  const perRound: { label: Label; arrive: number }[] = [];
  for (let r = 1; r < rounds.length; r++) {
    let best: { label: Label; arrive: number } | null = null;
    for (let s = 0; s < n; s++) {
      const l = rounds[r][s];
      // si scende da un mezzo: il cambio a piedi verso un'altra fermata non serve per finire a piedi
      if (!l || l.how !== 'ride' || !Number.isFinite(egressM[s]) || egressM[s] > accessLimit) continue;
      const arrive = l.time + egressM[s] / WALK_SPEED;
      if (!best || arrive < best.arrive) best = { label: l, arrive };
    }
    if (best) perRound.push(best);
  }
  // alternative: con più corse solo se si arriva prima di almeno EXTRA_RIDE_GAIN_S
  const kept: { label: Label; arrive: number }[] = [];
  for (const c of perRound) {
    if (kept.length === 0 || c.arrive < kept[kept.length - 1].arrive - EXTRA_RIDE_GAIN_S) kept.push(c);
  }
  if (kept.length === 0) return { best: null, alternatives: [] };
  const itineraries = kept.map((c) => buildItinerary(q, c.label, c.arrive));
  return { best: itineraries[itineraries.length - 1], alternatives: itineraries.slice().reverse() };
}

function buildItinerary(q: Search, final: Label, arrive: number): Itinerary {
  const { graph, net, fromO, toD, stopNode, origin, dest, now, accessM, egressM } = q;
  const chain: Label[] = [];
  for (let l: Label | null = final; l; l = l.parent) chain.unshift(l);
  const access = chain[0];
  const legs: Leg[] = [];
  const stopPoint = (s: number): [number, number] => [net.stops[s].lon, net.stops[s].lat];

  // a piedi fino alla prima fermata
  const firstRide = chain.find((l) => l.how === 'ride')!;
  const boardTime = firstRide.run!.base + firstRide.run!.pat.dep[firstRide.boardJ!];
  const walkIn = accessM[access.stop];
  const wetIn = summarizeEdges(graph, pathEdges(graph, fromO, stopNode[access.stop].node), q.floodO);
  legs.push({
    kind: 'walk', from: origin.label, to: net.stops[access.stop].name, meters: walkIn, seconds: walkIn / WALK_SPEED,
    start: boardTime - walkIn / WALK_SPEED, end: boardTime,
    coords: [[origin.lon, origin.lat], ...pathCoords(graph, fromO, stopNode[access.stop].node), stopPoint(access.stop)],
    ...wetIn,
  });

  let ridesInHighWater = false;
  let transferMeters = 0;
  let rides = 0;
  for (const l of chain.slice(1)) {
    if (l.how === 'walk') {
      const from = l.parent!.stop;
      transferMeters += l.meters!;
      legs.push({ kind: 'walk', from: net.stops[from].name, to: net.stops[l.stop].name, meters: l.meters!, seconds: l.meters! / WALK_SPEED, start: l.parent!.time, end: l.time, coords: [stopPoint(from), stopPoint(l.stop)], ...NO_WATER });
      continue;
    }
    rides++;
    const { pat, base } = l.run!;
    const bj = l.boardJ!;
    const aj = l.alightJ!;
    const start = base + pat.dep[bj];
    if (WATER_CATEGORIES.has(pat.category) && (q.tideAt?.(start) ?? -Infinity) >= MOSE_THRESHOLD_CM) ridesInHighWater = true;
    const coords =
      pat.profile && pat.ks
        ? rideCoords(pat.profile, pat.profile.Dd[pat.ks[bj]], pat.profile.Dd[pat.ks[aj]])
        : pat.shape && pat.dists
          ? alilagunaShapeBetween(pat.shape, pat.dists[bj], pat.dists[aj])
          : [stopPoint(pat.stops[bj]), stopPoint(pat.stops[aj])];
    legs.push({
      kind: 'ride',
      line: pat.line,
      category: pat.category,
      headsign: pat.headsign,
      from: net.stops[pat.stops[bj]].name,
      to: net.stops[pat.stops[aj]].name,
      start,
      end: base + pat.arr[aj],
      stops: aj - bj,
      coords,
      tripDeparture: base,
      ...(pat.color ? { color: pat.color } : {}),
      ...(pat.operator ? { operator: pat.operator } : {}),
    });
  }

  // a piedi dall'ultima fermata alla destinazione
  const lastStop = final.stop;
  const walkOut = egressM[lastStop];
  const lastEnd = final.time;
  const wetOut = summarizeEdges(graph, pathEdges(graph, toD, stopNode[lastStop].node), q.floodD);
  legs.push({
    kind: 'walk', from: net.stops[lastStop].name, to: dest.label, meters: walkOut, seconds: walkOut / WALK_SPEED, start: lastEnd, end: lastEnd + walkOut / WALK_SPEED,
    coords: [stopPoint(lastStop), ...pathCoords(graph, toD, stopNode[lastStop].node).reverse(), [dest.lon, dest.lat]],
    ...wetOut,
  });

  // si sale solo sbrigandosi: il mezzo parte prima di quanto serve ad arrivare a piedi alla fermata
  const first = legs.find((x) => x.kind === 'ride') as Extract<Leg, { kind: 'ride' }>;
  const hurry: HurryInfo | undefined =
    boardTime < now + walkIn / WALK_SPEED + BOARD_BUFFER_S ? { line: first.line, category: first.category, stop: first.from, departs: boardTime, walkSeconds: walkIn / WALK_SPEED } : undefined;
  return {
    depart: Math.max(now, legs[0].start),
    arrive,
    legs,
    walkMeters: walkIn + transferMeters + walkOut,
    rides,
    ridesInHighWater,
    ...(hurry ? { hurry } : {}),
    ...addSummaries(wetIn, wetOut),
  };
}
