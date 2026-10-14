/**
 * Velocità richiesta dall'orario ACTV confrontata con i limiti di velocità dei canali (nessuno storico).
 *
 * Per ogni tratto tra due fermate consecutive di una linea: il tempo minimo legale è la somma, sui pezzi
 * del percorso che corrono in un canale con limite noto, di lunghezza / limite (per ACTV il limite ACTV,
 * se diverso). I pezzi senza limite noto contano zero: il minimo legale è una stima per difetto.
 * Il tempo programmato comprende anche attracco e partenza, quindi la navigazione reale è più veloce:
 * se anche così l'orario resta sotto il minimo legale (con un minuto di tolleranza per gli arrotondamenti
 * dell'orario), l'orario non è compatibile con i limiti. Il contrario non si può dire.
 */
import type { SimModel, SimProfile, SimShape } from './simulationCore';
import { pointAt } from './simulationCore';
import { fromGrid, toGrid } from './positionDelay';
import { profileStops } from './tripPlanner';
import type { CanalSpeedLimitItem, StopItem } from './types';

/** Distanza massima tra il percorso della linea e il tracciato del canale (m) */
export const LIMIT_MATCH_M = 25;
/** Passo di campionamento del percorso (m) */
const STEP_M = 10;
/** Tolleranza per gli orari arrotondati al minuto (s) */
export const ROUNDING_S = 60;
/** Sotto questa quota di percorso con limite noto il tratto non è valutabile */
export const MIN_LIMITED_SHARE = 0.5;
const CELL = 100;

export type SpeedVerdict = 'tooFast' | 'tight' | 'ok' | 'partial';

export interface ScheduleSpeedSegment {
  id: string;
  line: string;
  category: string;
  from: string;
  to: string;
  lengthM: number;
  /** metri del tratto in canali con limite noto */
  limitedM: number;
  /** tempo minimo rispettando i limiti noti (s) */
  legalMinS: number;
  /** tempo programmato più breve tra le corse del giorno feriale (s) */
  scheduledS: number;
  /** velocità media richiesta dall'orario sul tratto (km/h, per difetto) */
  requiredKmh: number;
  /** limite più basso incontrato nel tratto (km/h) */
  minLimitKmh: number | null;
  /** corse feriali sul tratto e quante con tempo sotto il minimo legale (tolleranza inclusa) */
  trips: number;
  tripsTooFast: number;
  verdict: SpeedVerdict;
  /** tracciato [lon, lat] semplificato */
  path: [number, number][];
}

type Seg = { ax: number; ay: number; bx: number; by: number; kmh: number };

/** Indice spaziale dei tracciati con limite, in coordinate di griglia (≈ metri). */
function limitIndex(limits: CanalSpeedLimitItem[]) {
  const cells = new Map<string, Seg[]>();
  for (const l of limits) {
    const kmh = l.actvSpeedKmh ?? l.maxSpeedKmh;
    const pts = l.path.map(([lon, lat]) => toGrid(lon, lat));
    for (let i = 1; i < pts.length; i++) {
      const s: Seg = { ax: pts[i - 1][0], ay: pts[i - 1][1], bx: pts[i][0], by: pts[i][1], kmh };
      const x0 = Math.floor((Math.min(s.ax, s.bx) - LIMIT_MATCH_M) / CELL);
      const x1 = Math.floor((Math.max(s.ax, s.bx) + LIMIT_MATCH_M) / CELL);
      const y0 = Math.floor((Math.min(s.ay, s.by) - LIMIT_MATCH_M) / CELL);
      const y1 = Math.floor((Math.max(s.ay, s.by) + LIMIT_MATCH_M) / CELL);
      for (let cx = x0; cx <= x1; cx++)
        for (let cy = y0; cy <= y1; cy++) {
          const k = `${cx}|${cy}`;
          const list = cells.get(k) ?? [];
          list.push(s);
          cells.set(k, list);
        }
    }
  }
  /** limite nel punto; con più canali vicini (incroci) il più alto, per restare una stima per difetto */
  return (x: number, y: number): number | null => {
    const list = cells.get(`${Math.floor(x / CELL)}|${Math.floor(y / CELL)}`);
    if (!list) return null;
    let best: number | null = null;
    for (const s of list) {
      const dx = s.bx - s.ax;
      const dy = s.by - s.ay;
      const len2 = dx * dx + dy * dy;
      const t = len2 > 0 ? Math.max(0, Math.min(1, ((x - s.ax) * dx + (y - s.ay) * dy) / len2)) : 0;
      const d = Math.hypot(x - (s.ax + t * dx), y - (s.ay + t * dy));
      if (d <= LIMIT_MATCH_M && (best === null || s.kmh > best)) best = s.kmh;
    }
    return best;
  };
}

/** Minimo legale e metri con limite noto di un pezzo di percorso. */
function legalTime(sh: SimShape, d0: number, d1: number, limitAt: (x: number, y: number) => number | null) {
  const pt: [number, number] = [0, 0];
  const n = Math.max(1, Math.round((d1 - d0) / STEP_M));
  const step = (d1 - d0) / n;
  let legalMinS = 0;
  let limitedM = 0;
  let minLimit: number | null = null;
  for (let i = 0; i < n; i++) {
    pointAt(sh, d0 + step * (i + 0.5), pt);
    const kmh = limitAt(pt[0], pt[1]);
    if (kmh === null) continue;
    legalMinS += step / (kmh / 3.6);
    limitedM += step;
    minLimit = minLimit === null ? kmh : Math.min(minLimit, kmh);
  }
  return { legalMinS, limitedM, minLimit };
}

function pathOf(sh: SimShape, d0: number, d1: number): [number, number][] {
  const out: [number, number][] = [];
  const pt: [number, number] = [0, 0];
  const steps = Math.max(2, Math.ceil((d1 - d0) / 40));
  for (let i = 0; i <= steps; i++) {
    pointAt(sh, d0 + ((d1 - d0) * i) / steps, pt);
    const [lon, lat] = fromGrid(pt[0], pt[1]);
    out.push([+lon.toFixed(6), +lat.toFixed(6)]);
  }
  return out;
}

export function verdictOf(legalMinS: number, scheduledS: number, limitedShare: number): SpeedVerdict {
  if (limitedShare < MIN_LIMITED_SHARE) return 'partial';
  if (scheduledS + ROUNDING_S < legalMinS) return 'tooFast';
  if (scheduledS < legalMinS * 1.15) return 'tight';
  return 'ok';
}

/**
 * Tratti tra fermate consecutive delle linee di navigazione nel giorno feriale.
 * `stops` va passato sempre uguale (ACTV_STOPS_REFERENCE): le sequenze di fermate sono in cache per modello.
 */
export function scheduleSpeedSegments(sim: SimModel, stops: StopItem[], limits: CanalSpeedLimitItem[]): ScheduleSpeedSegment[] {
  const limitAt = limitIndex(limits);
  const seqs = profileStops(sim, stops);
  const tripsOf = new Map<SimProfile, number>();
  const day = sim.daysTrips.weekday;
  for (let i = 0; i < day.count; i++) {
    const p = sim.profs[day.tP[i]];
    tripsOf.set(p, (tripsOf.get(p) ?? 0) + 1);
  }
  const geometry = new Map<string, ReturnType<typeof legalTime>>();
  const shapeId = new Map<SimShape, number>();
  const bySegment = new Map<string, ScheduleSpeedSegment>();

  for (const p of sim.profs) {
    const seq = seqs.get(p);
    const trips = tripsOf.get(p) ?? 0;
    if (!seq || trips === 0) continue;
    if (!shapeId.has(p.sh)) shapeId.set(p.sh, shapeId.size);
    for (let i = 1; i < seq.length; i++) {
      const kA = seq[i - 1].k;
      const kB = seq[i].k;
      const d0 = p.Dd[kA];
      const d1 = p.Dd[kB];
      const scheduledS = p.T[kB] - p.T[kA];
      if (d1 - d0 < 50 || scheduledS <= 0) continue;
      const gKey = `${shapeId.get(p.sh)}|${d0}|${d1}`;
      let g = geometry.get(gKey);
      if (!g) {
        g = legalTime(p.sh, d0, d1, limitAt);
        geometry.set(gKey, g);
      }
      if (g.limitedM === 0) continue;
      const from = stops[seq[i - 1].stop].name;
      const to = stops[seq[i].stop].name;
      const id = `${p.route.n}|${from}|${to}`;
      const tooFast = scheduledS + ROUNDING_S < g.legalMinS ? trips : 0;
      const cur = bySegment.get(id);
      if (cur) {
        cur.trips += trips;
        cur.tripsTooFast += tooFast;
        if (scheduledS < cur.scheduledS) {
          cur.scheduledS = scheduledS;
          cur.requiredKmh = +(((d1 - d0) / scheduledS) * 3.6).toFixed(1);
          cur.verdict = verdictOf(cur.legalMinS, scheduledS, cur.limitedM / cur.lengthM);
        }
        continue;
      }
      const lengthM = Math.round(d1 - d0);
      bySegment.set(id, {
        id,
        line: p.route.n,
        category: p.route.cat,
        from,
        to,
        lengthM,
        limitedM: Math.round(g.limitedM),
        legalMinS: Math.round(g.legalMinS),
        scheduledS,
        requiredKmh: +(((d1 - d0) / scheduledS) * 3.6).toFixed(1),
        minLimitKmh: g.minLimit,
        trips,
        tripsTooFast: tooFast,
        verdict: verdictOf(g.legalMinS, scheduledS, g.limitedM / lengthM),
        path: pathOf(p.sh, d0, d1),
      });
    }
  }
  return [...bySegment.values()];
}

/** Colore del tratto per esito del confronto (tema scuro / chiaro) */
export const SPEED_VERDICT_COLORS: Record<SpeedVerdict, (isDark: boolean) => string> = {
  tooFast: () => '#ef4444',
  tight: (d) => (d ? '#fbbf24' : '#d97706'),
  ok: (d) => (d ? '#34d399' : '#059669'),
  partial: (d) => (d ? '#94a3b8' : '#64748b'),
};
