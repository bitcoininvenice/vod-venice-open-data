/**
 * Servizio ACTV adesso, senza storico: per ogni linea il ritardo dei mezzi GPS in questo momento,
 * le corse in servizio secondo l'orario ma senza posizione nel feed e le coppie di mezzi in coda.
 * Funzioni pure: i dati arrivano da /api/realtime/vehicles e dall'orario ufficiale (simulazione).
 */
import type { SimModel } from './simulationCore';
import type { DayType } from './types';

/** Mezzi in coda: intervallo programmato almeno di… (s) */
const BUNCH_MIN_HEADWAY_S = 6 * 60;
/** …e intervallo reale sotto un terzo di quello programmato e comunque sotto… (s) */
const BUNCH_MAX_GAP_S = 4 * 60;
/** Puntuale: ritardo tra −1 e +3 min (stessa soglia delle schede, vedi delayStatus) */
const ON_TIME = (s: number) => s >= -60 && s < 180;

export interface ServiceVehicle {
  id: string;
  line: string | null;
  network: 'navigazione' | 'automobilistico';
  /** partenza programmata della corsa (s dalla mezzanotte del giorno di servizio), se nota */
  departure: number | null;
  /** destinazione della corsa (per separare le direzioni), se nota */
  terminus: string | null;
  delaySeconds: number | null;
}

export interface BunchedPair {
  /** id dei due mezzi (il primo è quello partito prima) */
  a: string;
  b: string;
  terminus: string;
  /** intervallo programmato tra le due corse e intervallo reale adesso (s) */
  headwayS: number;
  gapS: number;
}

export interface LineNow {
  line: string;
  category: string | null;
  network: 'navigazione' | 'automobilistico';
  /** mezzi della linea con posizione GPS adesso */
  gps: number;
  /** corse in servizio adesso secondo l'orario; null se l'orario non ha la linea */
  scheduled: number | null;
  /** corse in servizio senza posizione nel feed (indizio, non prova di soppressione); null se non calcolabile */
  withoutGps: number | null;
  /** mezzi con un ritardo verificato */
  withDelay: number;
  avgDelayS: number | null;
  maxDelayS: number | null;
  /** quota di mezzi puntuali (−1…+3 min) tra quelli con ritardo */
  onTimeShare: number | null;
  bunched: BunchedPair[];
}

const WATER = new Set(['vaporetto', 'motoscafo', 'motonave', 'ferry', 'island']);
const networkOfCategory = (cat: string): 'navigazione' | 'automobilistico' => (WATER.has(cat) ? 'navigazione' : 'automobilistico');

const PREV_DAY: Record<DayType, DayType> = { weekday: 'weekday', saturday: 'weekday', sunday: 'saturday' };

/**
 * Corse in servizio in questo momento per linea, secondo l'orario del giorno (e quelle del giorno prima
 * ancora in corsa dopo mezzanotte). `prevDay` va passato quando il giorno prima era di tipo diverso
 * (es. lunedì dopo la domenica).
 */
/** Chiave di una linea: lo stesso numero può essere un vaporetto e un bus (es. 15) */
const lineKey = (line: string, network: 'navigazione' | 'automobilistico') => `${line}|${network}`;

export function scheduledRunning(sim: SimModel, day: DayType, secondsOfDay: number, prevDay: DayType = PREV_DAY[day]): Map<string, { count: number; category: string; line: string }> {
  const out = new Map<string, { count: number; category: string; line: string }>();
  const add = (d: DayType, t: number) => {
    const trips = sim.daysTrips[d];
    for (let i = 0; i < trips.count; i++) {
      if (trips.t0[i] > t || trips.t1[i] < t) continue;
      const route = sim.profs[trips.tP[i]].route;
      const key = lineKey(route.n, networkOfCategory(route.cat));
      const e = out.get(key) ?? { count: 0, category: route.cat, line: route.n };
      e.count++;
      out.set(key, e);
    }
  };
  add(day, secondsOfDay);
  if (secondsOfDay < 6 * 3600) add(prevDay, secondsOfDay + 86400);
  return out;
}

/** Coppie di mezzi della stessa linea e direzione arrivati troppo vicini rispetto all'orario. */
export function bunchedPairs(vehicles: ServiceVehicle[]): BunchedPair[] {
  const groups = new Map<string, (ServiceVehicle & { departure: number; delaySeconds: number })[]>();
  for (const v of vehicles) {
    if (v.line === null || v.departure === null || v.delaySeconds === null || v.terminus === null) continue;
    const key = `${v.line}|${v.network}|${v.terminus}`;
    const list = groups.get(key) ?? [];
    list.push(v as ServiceVehicle & { departure: number; delaySeconds: number });
    groups.set(key, list);
  }
  const out: BunchedPair[] = [];
  for (const list of groups.values()) {
    list.sort((x, y) => x.departure - y.departure);
    for (let i = 1; i < list.length; i++) {
      const first = list[i - 1];
      const second = list[i];
      const headwayS = second.departure - first.departure;
      const gapS = second.departure + second.delaySeconds - (first.departure + first.delaySeconds);
      if (headwayS >= BUNCH_MIN_HEADWAY_S && gapS < Math.min(BUNCH_MAX_GAP_S, headwayS / 3)) {
        out.push({ a: first.id, b: second.id, terminus: first.terminus as string, headwayS, gapS: Math.max(0, gapS) });
      }
    }
  }
  return out;
}

/** Ordine naturale delle linee: 1, 2, 4.1, 5.2, 10, N, T1… */
export function compareLines(a: string, b: string): number {
  return a.localeCompare(b, 'it', { numeric: true, sensitivity: 'base' });
}

/**
 * Riepilogo per linea. `running`: corse in servizio dall'orario; `feedOk`: reti il cui feed ha risposto
 * (senza feed non si può dire quali corse manchino).
 */
export function serviceNow(
  vehicles: ServiceVehicle[],
  running: Map<string, { count: number; category: string; line?: string }>,
  feedOk: Record<'navigazione' | 'automobilistico', boolean>,
): LineNow[] {
  const byLine = new Map<string, ServiceVehicle[]>();
  for (const v of vehicles) {
    if (!v.line) continue;
    const k = lineKey(v.line, v.network);
    const list = byLine.get(k) ?? [];
    list.push(v);
    byLine.set(k, list);
  }
  const bunched = bunchedPairs(vehicles);
  const keys = new Set([...byLine.keys(), ...running.keys()]);
  const out: LineNow[] = [];
  for (const key of keys) {
    const list = byLine.get(key) ?? [];
    const sched = running.get(key) ?? null;
    const [line, net] = key.split('|') as [string, 'navigazione' | 'automobilistico' | undefined];
    const network = net ?? (sched ? networkOfCategory(sched.category) : (list[0]?.network ?? 'navigazione'));
    if (!feedOk[network]) continue;
    const delays = list.map((v) => v.delaySeconds).filter((d): d is number => d !== null);
    out.push({
      line,
      category: sched?.category ?? null,
      network,
      gps: list.length,
      scheduled: sched?.count ?? null,
      withoutGps: sched ? Math.max(0, sched.count - list.length) : null,
      withDelay: delays.length,
      avgDelayS: delays.length ? Math.round(delays.reduce((s, d) => s + d, 0) / delays.length) : null,
      maxDelayS: delays.length ? Math.max(...delays) : null,
      onTimeShare: delays.length ? delays.filter(ON_TIME).length / delays.length : null,
      bunched: bunched.filter((p) => list.some((v) => v.id === p.a)),
    });
  }
  // solo le linee con qualcosa da dire adesso: mezzi visibili o corse in servizio
  return out.filter((l) => l.gps > 0 || (l.scheduled ?? 0) > 0).sort((a, b) => compareLines(a.line, b.line) || a.network.localeCompare(b.network));
}
