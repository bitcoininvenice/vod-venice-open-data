/**
 * Rete dei mezzi per il planner: tutte le fermate (pontili ACTV, fermate di bus, tram e People Mover, darsene
 * Alilaguna), le sequenze di fermate di ogni linea e le corse del giorno, più i cambi a piedi tra fermate vicine.
 *
 * Orari: ACTV dal GTFS ufficiale (simulazione), Alilaguna dal suo GTFS. Corse dopo mezzanotte incluse.
 */
import actvStops from '@/data/actv-stops.json';
import busStops from '@/data/actv-bus-stops.json';
import { forEachTrip, pointAt, type SimModel, type SimProfile } from './simulationCore';
import { fromGrid } from './positionDelay';
import { metersBetween } from './walkGraph';
import { ALILAGUNA_STOPS, alilagunaTripsOn, type AlilagunaTripTimes } from './alilaguna-schedule';
import type { DayType } from './types';

type StopKind = 'water' | 'land' | 'alilaguna';

interface NetStop {
  name: string;
  lon: number;
  lat: number;
  kind: StopKind;
}

/** Sequenza di fermate di una linea con gli orari relativi alla partenza della corsa (s) */
interface Pattern {
  stops: number[];
  /** partenza e arrivo a ogni fermata, in secondi dalla partenza della corsa */
  dep: number[];
  arr: number[];
  line: string;
  category: string;
  headsign: string;
  operator?: 'alilaguna';
  color?: string;
  /** per il tracciato: profilo della simulazione e indice della fermata nel profilo */
  profile?: SimProfile;
  ks?: number[];
  /** per il tracciato Alilaguna: percorso e distanza di ogni fermata */
  shape?: string;
  dists?: number[];
}

/** Corsa: una sequenza di fermate e l'ora di partenza (s dalla mezzanotte di oggi, oltre 86400 = dopo mezzanotte) */
export interface Run {
  pat: Pattern;
  base: number;
}

export interface Network {
  stops: NetStop[];
  /** cambi a piedi: fermate entro TRANSFER_RADIUS_M, con i metri stimati a piedi */
  neighbors: { to: number; meters: number }[][];
  simPatterns: Map<SimProfile, Pattern>;
}

/** Categorie della navigazione: le loro corse si abbinano ai pontili, le altre alle fermate di terra */
export const WATER_CATEGORIES = new Set(['vaporetto', 'motoscafo', 'motonave', 'ferry']);
/** Fermata della corsa abbinata a una fermata della rete entro (m) */
const STOP_MATCH_M = 150;
/** Cambio a piedi tra fermate entro (m in linea d'aria) */
export const TRANSFER_RADIUS_M = 450;
/** Le calli e le strade non sono in linea retta */
const DETOUR = 1.3;

const GRID = 0.003;
const key = (lon: number, lat: number) => `${Math.floor(lon / GRID)}|${Math.floor(lat / GRID)}`;

function stopGrid(stops: NetStop[], kind: (s: NetStop) => boolean): Map<string, number[]> {
  const g = new Map<string, number[]>();
  stops.forEach((s, i) => {
    if (!kind(s)) return;
    const k = key(s.lon, s.lat);
    const cell = g.get(k);
    if (cell) cell.push(i);
    else g.set(k, [i]);
  });
  return g;
}

function nearestIn(grid: Map<string, number[]>, stops: NetStop[], lon: number, lat: number, maxM: number): number {
  const cx = Math.floor(lon / GRID);
  const cy = Math.floor(lat / GRID);
  let best = -1;
  let bestD = maxM;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (const i of grid.get(`${cx + dx}|${cy + dy}`) ?? []) {
        const d = metersBetween(lon, lat, stops[i].lon, stops[i].lat);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
    }
  }
  return best;
}

/** Tutte le fermate: pontili e nodi ACTV della mappa, fermate bus del GTFS, darsene Alilaguna. */
function networkStops(): NetStop[] {
  const out: NetStop[] = [];
  for (const s of actvStops.stops as { name: string; lon: number; lat: number; mode: string }[]) {
    out.push({ name: s.name, lon: s.lon, lat: s.lat, kind: s.mode === 'navigazione' || s.mode === 'ferry' ? 'water' : 'land' });
  }
  for (const s of (busStops as { stops: { name: string; lon: number; lat: number }[] }).stops) {
    // le fermate bus già presenti come nodo della mappa (stesso nome, a pochi metri) non si ripetono
    if (out.some((o) => o.kind === 'land' && o.name === s.name && metersBetween(o.lon, o.lat, s.lon, s.lat) < 40)) continue;
    out.push({ name: s.name, lon: s.lon, lat: s.lat, kind: 'land' });
  }
  for (const s of ALILAGUNA_STOPS) out.push({ name: s.name, lon: s.lon, lat: s.lat, kind: 'alilaguna' });
  return out;
}

const netCache = new WeakMap<SimModel, Network>();

/** Rete costruita una volta per orario: fermate, sequenze delle linee ACTV e cambi a piedi. */
export function buildNetwork(sim: SimModel): Network {
  const cached = netCache.get(sim);
  if (cached) return cached;
  const stops = networkStops();
  const waterGrid = stopGrid(stops, (s) => s.kind === 'water');
  const landGrid = stopGrid(stops, (s) => s.kind === 'land');
  const allGrid = stopGrid(stops, () => true);

  const simPatterns = new Map<SimProfile, Pattern>();
  const pt: [number, number] = [0, 0];
  for (const p of sim.profs) {
    const grid = WATER_CATEGORIES.has(p.route.cat) ? waterGrid : landGrid;
    const seq: number[] = [];
    const ks: number[] = [];
    for (let k = 0; k < p.Dd.length; k++) {
      pointAt(p.sh, p.Dd[k], pt);
      const [lon, lat] = fromGrid(pt[0], pt[1]);
      const s = nearestIn(grid, stops, lon, lat, STOP_MATCH_M);
      if (s === -1) continue;
      if (seq.length > 0 && seq[seq.length - 1] === s) {
        ks[ks.length - 1] = k; // pontili o corsie della stessa fermata
        continue;
      }
      seq.push(s);
      ks.push(k);
    }
    if (seq.length < 2) continue;
    const times = ks.map((k) => p.T[k]);
    simPatterns.set(p, { stops: seq, dep: times, arr: times, line: p.route.n, category: p.route.cat, headsign: stops[seq[seq.length - 1]].name, profile: p, ks });
  }

  // Cambi a piedi tra fermate vicine (anche tra pontile, fermata bus e darsena Alilaguna)
  const neighbors: { to: number; meters: number }[][] = stops.map(() => []);
  const radiusCells = Math.ceil(TRANSFER_RADIUS_M / (GRID * 78_000));
  stops.forEach((s, i) => {
    const cx = Math.floor(s.lon / GRID);
    const cy = Math.floor(s.lat / GRID);
    for (let dx = -radiusCells; dx <= radiusCells; dx++) {
      for (let dy = -radiusCells; dy <= radiusCells; dy++) {
        for (const j of allGrid.get(`${cx + dx}|${cy + dy}`) ?? []) {
          if (j === i) continue;
          const d = metersBetween(s.lon, s.lat, stops[j].lon, stops[j].lat);
          if (d <= TRANSFER_RADIUS_M) neighbors[i].push({ to: j, meters: d * DETOUR });
        }
      }
    }
  });
  const net = { stops, neighbors, simPatterns };
  netCache.set(sim, net);
  return net;
}

/** Sequenza Alilaguna di una corsa sulle fermate della rete (le darsene sono in fondo all'elenco). */
function alilagunaPattern(net: Network, trip: AlilagunaTripTimes): { pat: Pattern; base: number } {
  const offset = net.stops.length - ALILAGUNA_STOPS.length;
  const base = trip.stops[0].dep;
  return {
    base,
    pat: {
      stops: trip.stops.map((s) => offset + s.stop),
      dep: trip.stops.map((s) => s.dep - base),
      arr: trip.stops.map((s) => s.arr - base),
      line: trip.line.replace(/^Linea\s+/i, ''),
      category: 'alilaguna',
      headsign: trip.headsign.replace(/^per\s+/i, ''),
      operator: 'alilaguna',
      color: trip.color,
      shape: trip.shape,
      dists: trip.stops.map((s) => s.dist),
    },
  };
}

/**
 * Corse del giorno (ACTV, anche dopo mezzanotte con `nextDay`, e Alilaguna della data), con un filtro sulle
 * categorie (es. solo mezzi d'acqua per «preferisci via acqua»).
 */
export function runsOf(net: Network, sim: SimModel, day: DayType, nextDay: DayType | undefined, date: Date | null, keep: (category: string) => boolean = () => true): Run[] {
  const runs: Run[] = [];
  forEachTrip(sim, day, nextDay, (pi, t0) => {
    const pat = net.simPatterns.get(sim.profs[pi]);
    if (pat && keep(pat.category)) runs.push({ pat, base: t0 });
  });
  if (date && keep('alilaguna')) for (const trip of alilagunaTripsOn(date)) runs.push(alilagunaPattern(net, trip));
  return runs;
}
