/**
 * Modello della simulazione da orario ACTV: tipi, costruzione dai dati grezzi e interpolazioni.
 * Senza React: usato dalla mappa (tramite simulationModel) e dal server (ritardo dalla posizione).
 */
import { CFG } from '@/lib/simulation-data';
import type { DayType } from '@/lib/types';

export interface SimShape {
  /** coordinate x,y alternate */
  xy: Float32Array;
  /** distanza cumulativa lungo la forma per ogni vertice */
  cum: Float32Array;
  n: number;
}

export interface SimRoute {
  /** nome breve della linea */
  n: string;
  /** categoria base del dataset (vaporetto, ferry, island, bus, tram) */
  c: string;
  /** indice in CFG.cats */
  ci: number;
  /** chiave di categoria per colori e filtri (vaporetto, motoscafo, motonave, ferry, tram, bus, island) */
  cat: string;
}

export interface SimProfile {
  sh: SimShape;
  route: SimRoute;
  /** secondi dalla partenza per ogni fermata */
  T: Int32Array;
  /** distanza lungo la forma per ogni fermata */
  Dd: Int32Array;
}

export interface SimDay {
  /** indice del profilo per ogni corsa */
  tP: Int32Array;
  /** partenza (secondi dalla mezzanotte, negativa per corse iniziate il giorno prima) */
  t0: Int32Array;
  /** arrivo */
  t1: Int32Array;
  count: number;
}

export interface SimModel {
  shapes: SimShape[];
  routes: SimRoute[];
  profs: SimProfile[];
  daysTrips: Record<DayType, SimDay>;
}

export interface RawCategory {
  k: string;
  base: string;
  lines?: string[];
}

type RawProfile = [shapeIndex: number, routeIndex: number, times: number[], dists: number[]];
type RawTrip = [profileIndex: number, departure: number];

/**
 * Categoria di una linea: quella che la elenca esplicitamente (es. motoscafo per la 5.1), altrimenti la
 * categoria generica della stessa base, cioè quella senza elenco di linee (es. vaporetto per la 1).
 */
export function categoryIndex(cats: RawCategory[], route: { n: string; c: string }): number {
  let fallback = -1;
  for (let i = 0; i < cats.length; i++) {
    const c = cats[i];
    if (c.base !== route.c) continue;
    if (c.lines) {
      if (c.lines.includes(route.n)) return i;
    } else if (fallback === -1) fallback = i;
  }
  return fallback === -1 ? 0 : fallback;
}

/** Navette che restano ferme al capolinea tra una corsa e la successiva (People Mover: corse ogni 10 min, 4 min di viaggio) */
export const SHUTTLE_LAYOVER_S: Record<string, number> = { peoplemover: 6 * 60 };

/** Dati grezzi del file JSON della simulazione. */
export interface RawSimulation {
  shapes: number[][];
  routes: { n: string; c: string }[];
  profiles: RawProfile[];
  days: Record<string, { trips: RawTrip[] }>;
}

export function buildSimulation(D: RawSimulation): SimModel {
  const cats = CFG.cats as unknown as RawCategory[];

  const shapes: SimShape[] = (D.shapes as number[][]).map((a) => {
    const n = a.length / 2;
    const xy = new Float32Array(a);
    const cum = new Float32Array(n);
    for (let i = 1; i < n; i++) {
      cum[i] = cum[i - 1] + Math.hypot(xy[2 * i] - xy[2 * i - 2], xy[2 * i + 1] - xy[2 * i - 1]);
    }
    return { xy, cum, n };
  });

  const routes: SimRoute[] = (D.routes as { n: string; c: string }[]).map((r) => {
    const ci = categoryIndex(cats, r);
    return { ...r, ci, cat: cats[ci].k };
  });

  const profs: SimProfile[] = (D.profiles as unknown as RawProfile[]).map((p) => ({
    sh: shapes[p[0]],
    route: routes[p[1]],
    T: Int32Array.from(p[2]),
    Dd: Int32Array.from(p[3]),
  }));

  const days = D.days as unknown as Record<DayType, { trips: RawTrip[] }>;
  const daysTrips = {} as Record<DayType, SimDay>;
  for (const key of ['weekday', 'saturday', 'sunday'] as DayType[]) {
    const raw = days[key]?.trips ?? [];
    const count = raw.length;
    const tP = new Int32Array(count);
    const t0 = new Int32Array(count);
    const t1 = new Int32Array(count);
    raw.forEach(([p, start], i) => {
      const prof = profs[p];
      tP[i] = p;
      t0[i] = start;
      t1[i] = start + prof.T[prof.T.length - 1];
    });
    daysTrips[key] = { tP, t0, t1, count };
  }

  return { shapes, routes, profs, daysTrips };
}

/** Distanza percorsa lungo la forma dopo `dt` secondi dalla partenza (interpolazione tra fermate). */
export function distAt(p: SimProfile, dt: number): number {
  const { T, Dd } = p;
  const hi = T.length - 1;
  if (dt >= T[hi]) return Dd[hi];
  if (dt <= 0) return Dd[0];
  let l = 0;
  let r = hi;
  while (r - l > 1) {
    const m = (l + r) >> 1;
    if (T[m] <= dt) l = m;
    else r = m;
  }
  const span = T[r] - T[l];
  return span > 0 ? Dd[l] + ((Dd[r] - Dd[l]) * (dt - T[l])) / span : Dd[r];
}

/** Punto della forma alla distanza `d`, scritto in `out` per evitare allocazioni nel loop di disegno. */
export function pointAt(sh: SimShape, d: number, out: [number, number]): void {
  const { cum, xy } = sh;
  const hi = sh.n - 1;
  if (d <= 0) {
    out[0] = xy[0];
    out[1] = xy[1];
    return;
  }
  if (d >= cum[hi]) {
    out[0] = xy[2 * hi];
    out[1] = xy[2 * hi + 1];
    return;
  }
  let l = 0;
  let r = hi;
  while (r - l > 1) {
    const m = (l + r) >> 1;
    if (cum[m] <= d) l = m;
    else r = m;
  }
  const f = (d - cum[l]) / (cum[r] - cum[l] || 1);
  out[0] = xy[2 * l] + (xy[2 * r] - xy[2 * l]) * f;
  out[1] = xy[2 * l + 1] + (xy[2 * r + 1] - xy[2 * l + 1]) * f;
}
