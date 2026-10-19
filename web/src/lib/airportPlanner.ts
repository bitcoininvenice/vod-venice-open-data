/**
 * «Come arrivare» da e per l'aeroporto Marco Polo (VCE), con due possibilità sull'orario ufficiale:
 * - Alilaguna via acqua (GTFS Alilaguna): a piedi fino a una fermata Alilaguna, barca diretta fino alla
 *   darsena dell'aeroporto, poi il percorso coperto fino al terminal;
 * - ACTV: a piedi e in vaporetto fino a Piazzale Roma (planner esistente), poi l'autobus 5 «Aerobus».
 *
 * Il percorso pedonale tra darsena e terminal non è nella rete pedonale di VOD: si stima dalla distanza in
 * linea d'aria. Non considera ritardi, biglietti né variazioni del servizio.
 */
import { forEachTrip, NIGHT_END_S, pointAt, type SimModel, type SimProfile } from './simulationCore';
import { fromGrid } from './positionDelay';
import { metersBetween, nearestNode, pathCoords, pathEdges, shortestPaths, type WalkGraph } from './walkGraph';
import { floodWeights, NO_WATER, summarizeEdges } from './dryRouting';
import { BOARD_BUFFER_S, HORIZON_S, MAX_ACCESS_M, MAX_SNAP_M, planTrip, WALK_SPEED, type HurryInfo, type Itinerary, type Leg, type PlannerPoint, type PlanOptions } from './tripPlanner';
import { ALILAGUNA_STOPS, alilagunaShapeBetween, alilagunaTripsOn, type AlilagunaTripTimes } from './alilaguna-schedule';
import type { DayType, StopItem } from './types';
import atvoJson from '@/data/atvo-venezia.json';
import dolomitiJson from '@/data/dolomitibus-venezia.json';
import flixJson from '@/data/flixbus-venezia.json';
import { nextCoachLeg, type CoachData, type CoachLegStyle } from './coachSchedule';
import { isMestreStation, MESTRE_STATION as MESTRE_POINT } from './mestrePlanner';

/** Terminal passeggeri dell'aeroporto Marco Polo */
export const AIRPORT: PlannerPoint = { lon: 12.3385, lat: 45.505, label: 'Aeroporto Marco Polo (VCE)' };
/** Un punto entro questa distanza dal terminal è «l'aeroporto» (m) */
const AIRPORT_RADIUS_M = 1000;
/** Capolinea del bus 5 a Piazzale Roma (fermata della rete automobilistica ACTV) */
export const PIAZZALE_ROMA: PlannerPoint = { lon: 12.3192, lat: 45.4383, label: 'Piazzale Roma' };
/** Linea ACTV Aerobus tra Piazzale Roma e l'aeroporto */
export const AEROBUS_LINE = '5';
/** Percorso pedonale coperto darsena-terminal: più lungo della linea d'aria */
const DOCK_WALK_FACTOR = 1.3;
/** Fermata del bus o della barca abbinata a un punto entro (m) */
const STOP_MATCH_M = 300;
export const AEROBUS_COLOR = '#4a8018';

/** Il punto è l'aeroporto Marco Polo. */
export const isAirport = (p: { lon: number; lat: number }): boolean => metersBetween(p.lon, p.lat, AIRPORT.lon, AIRPORT.lat) <= AIRPORT_RADIUS_M;

/** Ricerca "aeroporto": il campo del planner propone l'aeroporto. */
export const matchesAirport = (q: string): boolean => /aero|airport|vce|marco\s*polo|tessera/i.test(q.trim());

export const AIRPORT_DOCKS = ALILAGUNA_STOPS.map((s, i) => (s.isAirportHub ? i : -1)).filter((i) => i >= 0);

const straightWalk = (from: PlannerPoint, to: PlannerPoint, start: number, factor = 1): Leg & { kind: 'walk' } => {
  const meters = metersBetween(from.lon, from.lat, to.lon, to.lat) * factor;
  const seconds = meters / WALK_SPEED;
  return { kind: 'walk', from: from.label, to: to.label, meters, seconds, start, end: start + seconds, coords: [[from.lon, from.lat], [to.lon, to.lat]], ...NO_WATER };
};

/** Indici del profilo più vicini a Piazzale Roma e all'aeroporto (−1 se la corsa non ci passa). */
const aerobusCache = new WeakMap<SimModel, Map<SimProfile, { kRoma: number; kAir: number }>>();
function aerobusProfiles(sim: SimModel): Map<SimProfile, { kRoma: number; kAir: number }> {
  let m = aerobusCache.get(sim);
  if (m) return m;
  m = new Map();
  const pt: [number, number] = [0, 0];
  for (const p of sim.profs) {
    if (p.route.n !== AEROBUS_LINE || p.route.cat !== 'bus') continue;
    let kRoma = -1;
    let kAir = -1;
    let bestRoma = STOP_MATCH_M;
    let bestAir = STOP_MATCH_M;
    for (let k = 0; k < p.Dd.length; k++) {
      pointAt(p.sh, p.Dd[k], pt);
      const [lon, lat] = fromGrid(pt[0], pt[1]);
      const dr = metersBetween(lon, lat, PIAZZALE_ROMA.lon, PIAZZALE_ROMA.lat);
      const da = metersBetween(lon, lat, AIRPORT.lon, AIRPORT.lat);
      if (dr < bestRoma) [bestRoma, kRoma] = [dr, k];
      if (da < bestAir) [bestAir, kAir] = [da, k];
    }
    if (kRoma >= 0 && kAir >= 0) m.set(p, { kRoma, kAir });
  }
  aerobusCache.set(sim, m);
  return m;
}

/** Primo bus 5 nel verso indicato che parte non prima di `ready` (anche dopo mezzanotte, con `nextDay`). */
function nextAerobus(sim: SimModel, day: DayType, ready: number, toAirport: boolean, nextDay?: DayType): { profile: SimProfile; departure: number; kFrom: number; kTo: number } | null {
  const profiles = aerobusProfiles(sim);
  let best: { profile: SimProfile; departure: number; kFrom: number; kTo: number; arrive: number } | null = null;
  forEachTrip(sim, day, nextDay, (pi, departure) => {
    const p = sim.profs[pi];
    const ks = profiles.get(p);
    if (!ks) return;
    const kFrom = toAirport ? ks.kRoma : ks.kAir;
    const kTo = toAirport ? ks.kAir : ks.kRoma;
    if (kFrom >= kTo) return;
    const board = departure + p.T[kFrom];
    if (board < ready || board > ready + HORIZON_S) return;
    const arrive = departure + p.T[kTo];
    if (!best || arrive < best.arrive) best = { profile: p, departure, kFrom, kTo, arrive };
  });
  return best;
}

function busLeg(bus: { profile: SimProfile; departure: number; kFrom: number; kTo: number }, from: string, to: string): Leg {
  const p = bus.profile;
  const coords: [number, number][] = [];
  const pt: [number, number] = [0, 0];
  const d0 = p.Dd[bus.kFrom];
  const d1 = p.Dd[bus.kTo];
  const steps = Math.max(2, Math.ceil((d1 - d0) / 60));
  for (let i = 0; i <= steps; i++) {
    pointAt(p.sh, d0 + ((d1 - d0) * i) / steps, pt);
    coords.push(fromGrid(pt[0], pt[1]));
  }
  return {
    kind: 'ride',
    line: AEROBUS_LINE,
    category: 'bus',
    headsign: to,
    from,
    to,
    start: bus.departure + p.T[bus.kFrom],
    end: bus.departure + p.T[bus.kTo],
    stops: bus.kTo - bus.kFrom,
    coords,
    tripDeparture: bus.departure,
    color: AEROBUS_COLOR,
  };
}

/** A piedi oltre questa distanza (m) solo se altrimenti non si arriva al bus (es. di notte da Fondamente Nove) */
export const LONG_WALK_M = 3000;

/** Tratto in città da o per Piazzale Roma: il più veloce, anche ammettendo un tratto a piedi più lungo. */
function toRoma(graph: WalkGraph, sim: SimModel, stops: StopItem[], a: PlannerPoint, b: PlannerPoint, now: number, day: DayType, options: PlanOptions): Itinerary | null {
  const base = { ...options, mode: 'fastest' as const };
  const normal = planTrip(graph, sim, stops, a, b, now, day, base).best;
  const longWalk = planTrip(graph, sim, stops, a, b, now, day, { ...base, maxAccessM: LONG_WALK_M }).best;
  // il più veloce: di notte a volte solo camminando di più si arriva in tempo all'ultimo bus
  if (!normal || !longWalk) return normal ?? longWalk;
  return longWalk.arrive < normal.arrive - 60 ? longWalk : normal;
}

/** ACTV: vaporetto/piedi fino a Piazzale Roma e bus 5, oppure al contrario. */
function viaActv(graph: WalkGraph, sim: SimModel, stops: StopItem[], venice: PlannerPoint, toAirport: boolean, now: number, day: DayType, options: PlanOptions): Itinerary | null {
  if (toAirport) {
    const first = toRoma(graph, sim, stops, venice, PIAZZALE_ROMA, now, day, options);
    if (!first) return null;
    const bus = nextAerobus(sim, day, first.arrive + BOARD_BUFFER_S, true, options.nextDay);
    if (!bus) return null;
    const ride = busLeg(bus, PIAZZALE_ROMA.label, AIRPORT.label);
    return { ...first, arrive: ride.end, legs: [...first.legs, ride], rides: first.rides + 1, via: 'actv' };
  }
  // dall'aeroporto il bus parte davanti al terminal: di corsa si prende anche quello che sta per partire
  const normalBus = nextAerobus(sim, day, now + BOARD_BUFFER_S, false, options.nextDay);
  const rushedBus = options.hurry ? nextAerobus(sim, day, now, false, options.nextDay) : null;
  const bus = rushedBus && (!normalBus || rushedBus.departure + rushedBus.profile.T[rushedBus.kTo] < normalBus.departure + normalBus.profile.T[normalBus.kTo] - 60) ? rushedBus : normalBus;
  if (!bus) return null;
  const ride = busLeg(bus, AIRPORT.label, PIAZZALE_ROMA.label) as Extract<Leg, { kind: 'ride' }>;
  const rest = toRoma(graph, sim, stops, PIAZZALE_ROMA, venice, ride.end, day, { ...options, hurry: false });
  if (!rest) return null;
  const hurry: HurryInfo | undefined = ride.start < now + BOARD_BUFFER_S ? { line: ride.line, category: 'bus', stop: AIRPORT.label, departs: ride.start, walkSeconds: 0 } : undefined;
  return { ...rest, depart: Math.max(now, ride.start - BOARD_BUFFER_S), legs: [ride, ...rest.legs], rides: rest.rides + 1, via: 'actv', ...(hurry ? { hurry } : {}) };
}

/** Alilaguna: a piedi fino a una fermata e barca diretta per l'aeroporto, oppure al contrario. */
function viaAlilaguna(graph: WalkGraph, trips: AlilagunaTripTimes[], venice: PlannerPoint, toAirport: boolean, now: number, options: PlanOptions): Itinerary | null {
  const v = nearestNode(graph, venice.lon, venice.lat);
  if (v.meters > MAX_SNAP_M) return null;
  const flood = floodWeights(graph, options.tideAt?.(now), options.passerelle ?? []);
  const sp = shortestPaths(graph, v.node, MAX_ACCESS_M, flood?.weight);
  // metri a piedi tra il punto e ogni fermata Alilaguna in città
  const walkM = ALILAGUNA_STOPS.map((s) => {
    if (s.isAirportHub) return Infinity;
    const n = nearestNode(graph, s.lon, s.lat);
    return n.meters <= MAX_SNAP_M && sp.meters[n.node] + v.meters + n.meters <= MAX_ACCESS_M ? sp.meters[n.node] + v.meters + n.meters : Infinity;
  });
  const dockWalkS = (dock: number) => (metersBetween(ALILAGUNA_STOPS[dock].lon, ALILAGUNA_STOPS[dock].lat, AIRPORT.lon, AIRPORT.lat) * DOCK_WALK_FACTOR) / WALK_SPEED;

  /** tempo per arrivare a piedi all'imbarco al passo normale (s) */
  const walkToBoard = (stop: number) => (toAirport ? walkM[stop] / WALK_SPEED : dockWalkS(stop));
  /** Barca che arriva prima; `rushed`: anche quelle che partono prima di quanto serve ad arrivare a piedi */
  const search = (rushed: boolean) => {
    let found: { trip: AlilagunaTripTimes; i: number; j: number; arrive: number } | null = null;
    for (const trip of trips) {
      for (let i = 0; i < trip.stops.length; i++) {
        for (let j = i + 1; j < trip.stops.length; j++) {
          const a = trip.stops[i];
          const b = trip.stops[j];
          const aDock = AIRPORT_DOCKS.includes(a.stop);
          const bDock = AIRPORT_DOCKS.includes(b.stop);
          if (toAirport ? !bDock || aDock || !Number.isFinite(walkM[a.stop]) : !aDock || bDock || !Number.isFinite(walkM[b.stop])) continue;
          const ready = rushed ? now : now + walkToBoard(a.stop) + BOARD_BUFFER_S;
          if (a.dep < ready || a.dep > now + HORIZON_S) continue;
          const arrive = toAirport ? b.arr + dockWalkS(b.stop) : b.arr + walkM[b.stop] / WALK_SPEED;
          if (!found || arrive < found.arrive) found = { trip, i, j, arrive };
        }
      }
    }
    return found;
  };
  const normal = search(false);
  const rushed = options.hurry ? search(true) : null;
  const best = rushed && (!normal || rushed.arrive < normal.arrive - 60) ? rushed : normal;
  if (!best) return null;
  const a = best.trip.stops[best.i];
  const b = best.trip.stops[best.j];
  const sa = ALILAGUNA_STOPS[a.stop];
  const sb = ALILAGUNA_STOPS[b.stop];
  const ride: Leg = {
    kind: 'ride',
    line: best.trip.line.replace(/^Linea\s+/i, ''),
    category: 'alilaguna',
    headsign: best.trip.headsign.replace(/^per\s+/i, ''),
    from: sa.name,
    to: sb.name,
    start: a.dep,
    end: b.arr,
    stops: best.j - best.i,
    coords: alilagunaShapeBetween(best.trip.shape, a.dist, b.dist),
    tripDeparture: best.trip.stops[0].dep,
    color: best.trip.color,
    operator: 'alilaguna',
  };
  const cityStop = toAirport ? sa : sb;
  const cityNode = nearestNode(graph, cityStop.lon, cityStop.lat).node;
  const cityM = walkM[toAirport ? a.stop : b.stop];
  const cityCoords = [[venice.lon, venice.lat] as [number, number], ...pathCoords(graph, sp, cityNode), [cityStop.lon, cityStop.lat] as [number, number]];
  const wet = summarizeEdges(graph, pathEdges(graph, sp, cityNode), flood);
  const dockPoint = { lon: (toAirport ? sb : sa).lon, lat: (toAirport ? sb : sa).lat, label: (toAirport ? sb : sa).name };
  let legs: Leg[];
  if (toAirport) {
    const walkIn: Leg = { kind: 'walk', from: venice.label, to: sa.name, meters: cityM, seconds: cityM / WALK_SPEED, start: a.dep - cityM / WALK_SPEED, end: a.dep, coords: cityCoords, ...wet };
    legs = [walkIn, ride, straightWalk(dockPoint, AIRPORT, b.arr, DOCK_WALK_FACTOR)];
  } else {
    const toDock = straightWalk(AIRPORT, dockPoint, a.dep - dockWalkS(a.stop), DOCK_WALK_FACTOR);
    const walkOut: Leg = { kind: 'walk', from: sb.name, to: venice.label, meters: cityM, seconds: cityM / WALK_SPEED, start: b.arr, end: b.arr + cityM / WALK_SPEED, coords: [...cityCoords].reverse(), ...wet };
    legs = [toDock, ride, walkOut];
  }
  const walkMeters = legs.reduce((s, l) => s + (l.kind === 'walk' ? l.meters : 0), 0);
  const boardWalk = walkToBoard(a.stop);
  const hurry: HurryInfo | undefined =
    a.dep < now + boardWalk + BOARD_BUFFER_S ? { line: ride.line, category: 'alilaguna', stop: sa.name, departs: a.dep, walkSeconds: boardWalk } : undefined;
  return { depart: Math.max(now, legs[0].start), arrive: legs[legs.length - 1].end, legs, walkMeters, rides: 1, ridesInHighWater: false, via: 'alilaguna', ...(hurry ? { hurry } : {}), ...wet };
}

/** Terminal del bus in città: Mestre se il punto è la stazione, altrimenti Piazzale Roma (Tronchetto per FlixBus) */
const TRONCHETTO: PlannerPoint = { lon: 12.305, lat: 45.442, label: 'Tronchetto' };
const AIRPORT_STOP = /aeroporto|airport|marco polo/i;

interface CoachSpec {
  data: CoachData;
  via: NonNullable<Itinerary['via']>;
  style: CoachLegStyle;
  /** fermata in città: quella di Mestre o quella di Venezia */
  cityStop: (mestre: boolean) => RegExp;
  /** linea da usare (ATVO: 35 da Piazzale Roma, 35B da Mestre) */
  line?: (mestre: boolean) => string | undefined;
  terminal: (mestre: boolean) => PlannerPoint;
}

const COACHES: CoachSpec[] = [
  {
    data: atvoJson as unknown as CoachData,
    via: 'atvo',
    style: { label: (l) => `ATVO ${l}`, color: '#0284c7', operator: 'ATVO' },
    cityStop: (m) => (m ? /mestre/i : /piazzale roma/i),
    line: (m) => (m ? '35B' : '35'),
    terminal: (m) => (m ? MESTRE_POINT : PIAZZALE_ROMA),
  },
  {
    data: dolomitiJson as unknown as CoachData,
    via: 'dolomitibus',
    style: { label: (l) => `Dolomiti Bus ${l}`, color: '#059669', operator: 'Dolomiti Bus' },
    cityStop: (m) => (m ? /mestre/i : /piazzale roma/i),
    terminal: (m) => (m ? MESTRE_POINT : PIAZZALE_ROMA),
  },
  {
    data: flixJson as unknown as CoachData,
    via: 'flixbus',
    style: { label: (l) => `FlixBus ${l}`, color: '#84cc16', operator: 'FlixBus' },
    cityStop: (m) => (m ? /mestre/i : /tronchetto/i),
    terminal: (m) => (m ? MESTRE_POINT : TRONCHETTO),
  },
];

/** Bus a orario fra la città e l'aeroporto (ATVO, Dolomiti Bus, FlixBus), con il tratto in città se serve. */
function viaCoach(
  spec: CoachSpec,
  graph: WalkGraph,
  sim: SimModel,
  stops: StopItem[],
  venice: PlannerPoint,
  toAirport: boolean,
  now: number,
  day: DayType,
  options: PlanOptions,
): Itinerary | null {
  const mestre = isMestreStation(venice);
  const terminal = spec.terminal(mestre);
  const atTerminal = mestre || metersBetween(venice.lon, venice.lat, terminal.lon, terminal.lat) < 600;
  const date = options.date ?? new Date();
  const span = options.includeCoaches ? 12 * 3600 : HORIZON_S;
  const match = toAirport
    ? { from: spec.cityStop(mestre), to: AIRPORT_STOP, line: spec.line?.(mestre) }
    : { from: AIRPORT_STOP, to: spec.cityStop(mestre), line: spec.line?.(mestre) };

  if (toAirport) {
    const connect = atTerminal ? null : toRoma(graph, sim, stops, venice, terminal, now, day, options);
    if (!atTerminal && !connect) return null;
    const ready = (connect ? connect.arrive : now) + BOARD_BUFFER_S;
    const leg = nextCoachLeg(spec.data, match, ready, ready + span, date, spec.style);
    if (!leg) return null;
    if (connect) return { ...connect, arrive: leg.end, legs: [...connect.legs, leg], rides: connect.rides + 1, via: spec.via };
    return { depart: leg.start, arrive: leg.end, legs: [leg], rides: 1, walkMeters: 0, ridesInHighWater: false, via: spec.via, ...NO_WATER };
  }
  const ready = now + BOARD_BUFFER_S;
  const leg = nextCoachLeg(spec.data, match, ready, ready + span, date, spec.style);
  if (!leg) return null;
  if (!atTerminal) {
    const rest = toRoma(graph, sim, stops, terminal, venice, leg.end, day, { ...options, hurry: false });
    if (!rest) return null;
    return { ...rest, depart: leg.start, legs: [leg, ...rest.legs], rides: rest.rides + 1, via: spec.via };
  }
  return { depart: leg.start, arrive: leg.end, legs: [leg], rides: 1, walkMeters: 0, ridesInHighWater: false, via: spec.via, ...NO_WATER };
}

/**
 * Opzioni per andare all'aeroporto o tornare in città, dalla più veloce. Vuoto se nessuno dei due punti è
 * l'aeroporto, se lo sono entrambi o se l'altro punto è fuori dalla rete pedonale di Venezia.
 */
export function planAirport(
  graph: WalkGraph,
  sim: SimModel,
  stops: StopItem[],
  from: PlannerPoint,
  to: PlannerPoint,
  now: number,
  day: DayType,
  options: PlanOptions & { date?: Date } = {},
): Itinerary[] {
  const toAirport = isAirport(to);
  if (toAirport === isAirport(from)) return [];
  const venice = toAirport ? from : to;
  const out: Itinerary[] = [];
  const water = viaAlilaguna(graph, alilagunaTripsOn(options.date ?? new Date()), venice, toAirport, now, options);
  if (water) out.push(water);
  const land = viaActv(graph, sim, stops, venice, toAirport, now, day, options);
  if (land) out.push(land);

  const isTerminal = metersBetween(venice.lon, venice.lat, PIAZZALE_ROMA.lon, PIAZZALE_ROMA.lat) < 600 || isMestreStation(venice);
  if (isTerminal || options.includeCoaches) {
    for (const spec of COACHES) {
      const it = viaCoach(spec, graph, sim, stops, venice, toAirport, now, day, options);
      if (it) out.push(it);
    }
  }

  // Tutti i mezzi insieme (es. bus 15 da Mestre, Alilaguna con un cambio): solo se arriva prima delle altre
  const mixed = planTrip(graph, sim, stops, from, to, now, day, { ...options, mode: 'fastest', date: options.date ?? new Date() }).best;
  if (mixed && mixed.rides > 0 && out.every((o) => mixed.arrive < o.arrive - 120)) out.push({ ...mixed, via: 'mixed' });


  return out.sort((a, b) => a.arrive - b.arrive);
}

/** Ora da cui cercare le prime corse del giorno dopo (s dalla mezzanotte) */
export const FIRST_SERVICE_FROM_S = 4 * 3600;

/**
 * Come planAirport; se stasera non ci sono più collegamenti, le prime opzioni di domani mattina
 * (dalle 4, con l'orario del giorno dopo). `tomorrow` indica che gli orari sono di domani.
 */
export function planAirportOrTomorrow(
  graph: WalkGraph,
  sim: SimModel,
  stops: StopItem[],
  from: PlannerPoint,
  to: PlannerPoint,
  now: number,
  day: DayType,
  next: { day: DayType; date: Date },
  options: PlanOptions & { date?: Date } = {},
): { options: Itinerary[]; tomorrow: boolean; lastBus: number | null; ifLate: Itinerary | null; ifLateTomorrow: boolean } {
  const today = planAirport(graph, sim, stops, from, to, now, day, options);
  if (today.length > 0 || isAirport(from) === isAirport(to)) {
    // se la soluzione migliore va fatta di corsa: la prima senza correre (stasera, altrimenti domani mattina)
    if (!today[0]?.hurry) return { options: today, tomorrow: false, lastBus: null, ifLate: null, ifLateTomorrow: false };
    const calm = planAirport(graph, sim, stops, from, to, now, day, { ...options, hurry: false });
    if (calm.length > 0) return { options: today, tomorrow: false, lastBus: null, ifLate: calm[0], ifLateTomorrow: false };
    const morning = planAirport(graph, sim, stops, from, to, FIRST_SERVICE_FROM_S, next.day, { ...options, date: next.date, nextDay: undefined, hurry: false });
    return { options: today, tomorrow: false, lastBus: null, ifLate: morning[0] ?? null, ifLateTomorrow: morning.length > 0 };
  }
  const morning = planAirport(graph, sim, stops, from, to, FIRST_SERVICE_FROM_S, next.day, { ...options, date: next.date, nextDay: undefined, hurry: false });
  // si cita l'ultimo bus solo se deve ancora partire stanotte
  const last = lastAerobus(sim, day, isAirport(to), options.nextDay);
  return { options: morning, tomorrow: morning.length > 0, lastBus: last !== null && last >= now && last - now <= 3 * 3600 ? last : null, ifLate: null, ifLateTomorrow: false };
}

/**
 * Ultima partenza del bus 5 della serata (da Piazzale Roma verso l'aeroporto o al contrario), comprese quelle
 * dopo mezzanotte: per dire «c'è ancora un bus, ma da qui non si arriva in tempo».
 */
export function lastAerobus(sim: SimModel, day: DayType, toAirport: boolean, nextDay?: DayType): number | null {
  const profiles = aerobusProfiles(sim);
  let last: number | null = null;
  forEachTrip(
    sim,
    day,
    nextDay,
    (pi, departure) => {
      const p = sim.profs[pi];
      const ks = profiles.get(p);
      if (!ks) return;
      const kFrom = toAirport ? ks.kRoma : ks.kAir;
      const kTo = toAirport ? ks.kAir : ks.kRoma;
      if (kFrom >= kTo) return;
      const t = departure + p.T[kFrom];
      if (last === null || t > last) last = t;
    },
    NIGHT_END_S,
  );
  return last;
}
