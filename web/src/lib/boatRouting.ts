/**
 * Percorso in barca con un mezzo privato (diporto) sulla rete dei canali di OpenStreetMap, con le regole del
 * Testo Unico della circolazione acquea (Ord. 274/2015) trascritte in pipeline/import_osm_boat.py:
 * sensi unici (art. 7), divieti alle unità a motore (art. 2 c.3 Rii Blu, art. 8), Canal Grande vietato
 * al diporto nei feriali 8-12 (art. 20), ZTL vietata al diporto salvo residenti e concessionari (art. 18).
 * Velocità: il limite del canale (regolamento comunale, ordinanza 93/2007), altrimenti il maxspeed di
 * OpenStreetMap, altrimenti ASSUMED_KMH. Con la marea si applicano le regole dell'art. 3 del regolamento comunale.
 *
 * Indicativo, non per la navigazione: fanno fede gli atti vigenti, le ordinanze temporanee e la segnaletica.
 */
import { canalLimit, HIGH_WATER_CM, LOW_WATER_CM, urbanArea } from './waterSpeedLimits';
import { metersBetween } from './walkGraph';
import { ordinancesForCanal } from './canalOrdinances';
import type { OrdinanceItem } from './contracts/ordinances';
import type { DayType } from './types';

/** Velocità ipotizzata nei canali di cui VOD non ha il limite (km/h) */
export const ASSUMED_KMH = 11;
/** Velocità nei rii senza nome del centro storico, Murano e Burano (come i rii comunali, km/h) */
const RIO_KMH = 5;
/** Oltre questa distanza dall'acqua il punto non è collegato alla rete dei canali (m) */
const MAX_SNAP_M = 250;

type BoatRuleKind = 'oneway' | 'noMotor' | 'noPleasure';

export interface BoatRule {
  id: string;
  kind: BoatRuleKind;
  /** articolo del Testo Unico */
  ref: string;
  label: string;
  /** fascia oraria in minuti dalla mezzanotte [da, a); assente = tutto il giorno */
  hours?: [number, number];
  /** feriali = lunedì-sabato; lunven = lunedì-venerdì; assente = tutti i giorni */
  days?: 'feriali' | 'lunven';
  /** archi: e = (per i sensi unici) consentito solo da a verso b, ~e = solo da b verso a */
  edges: number[];
}

export interface RawBoat {
  origin: [number, number];
  scale: number;
  nodes: number[];
  /** [a, b, lunghezza in dm, indice del nome, maxspeed OSM in decimi di km/h (0 se assente)] alternati */
  edges: number[];
  names: string[];
  geom: number[][];
  rules: BoatRule[];
  rulesUrl: string;
}

export interface BoatGraph {
  lon: Float64Array;
  lat: Float64Array;
  off: Int32Array;
  adj: Int32Array;
  adjEdge: Int32Array;
  edgeA: Int32Array;
  edgeB: Int32Array;
  edgeLen: Float32Array;
  /** nome del canale (null se OSM non lo indica) */
  edgeName: (string | null)[];
  /** limite di velocità (km/h) e da dove viene: 1 atto ufficiale, 2 OpenStreetMap, 0 ipotizzato */
  edgeKmh: Float32Array;
  edgeKnown: Uint8Array;
  /** tratto nella ZTL (rii e canali urbani del Comune): vietato al diporto salvo residenti e concessionari */
  edgeZtl: Uint8Array;
  /** regola con la marea (art. 3): 1 = 5 km/h con +110 / −50 cm, 2 = vietato a motore con +110 cm */
  edgeTide: Uint8Array;
  edgeGeom: Float64Array[];
  rules: BoatRule[];
  /** regole che toccano ogni arco: indice della regola e verso consentito (1 a→b, −1 b→a, 0 nessun verso) */
  edgeRules: { rule: number; dir: number }[][];
  rulesUrl: string;
}

export function buildBoatGraph(raw: RawBoat): BoatGraph {
  const n = raw.nodes.length / 2;
  const [lon0, lat0] = raw.origin;
  const lon = new Float64Array(n);
  const lat = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    lon[i] = lon0 + raw.nodes[2 * i] / raw.scale;
    lat[i] = lat0 + raw.nodes[2 * i + 1] / raw.scale;
  }
  const m = raw.edges.length / 5;
  const edgeA = new Int32Array(m);
  const edgeB = new Int32Array(m);
  const edgeLen = new Float32Array(m);
  const edgeName: (string | null)[] = new Array(m);
  const edgeKmh = new Float32Array(m);
  const edgeKnown = new Uint8Array(m);
  const edgeZtl = new Uint8Array(m);
  const edgeTide = new Uint8Array(m);
  const deg = new Int32Array(n + 1);
  for (let e = 0; e < m; e++) {
    const a = raw.edges[5 * e];
    const b = raw.edges[5 * e + 1];
    edgeA[e] = a;
    edgeB[e] = b;
    edgeLen[e] = raw.edges[5 * e + 2] / 10;
    const ni = raw.edges[5 * e + 3];
    const osmKmh = raw.edges[5 * e + 4] / 10;
    const name = ni >= 0 ? raw.names[ni] : null;
    edgeName[e] = name;
    deg[a + 1]++;
    deg[b + 1]++;
    const ends: [number, number][] = [
      [lon[a], lat[a]],
      [lon[b], lat[b]],
    ];
    const limit = canalLimit(name, ends);
    if (limit) {
      edgeKmh[e] = limit.maxSpeedKmh;
      edgeKnown[e] = 1;
      edgeZtl[e] = limit.authority === 'comune' ? 1 : 0;
      edgeTide[e] = limit.highWater === 'slow5' ? 1 : limit.highWater === 'noMotor' ? 2 : 0;
    } else if (osmKmh > 0) {
      edgeKmh[e] = osmKmh;
      edgeKnown[e] = 2;
    } else {
      edgeKmh[e] = ASSUMED_KMH;
    }
  }
  const off = new Int32Array(n + 1);
  for (let i = 0; i < n; i++) off[i + 1] = off[i] + deg[i + 1];
  const fill = off.slice(0, n);
  const adj = new Int32Array(2 * m);
  const adjEdge = new Int32Array(2 * m);
  for (let e = 0; e < m; e++) {
    adj[fill[edgeA[e]]] = edgeB[e];
    adjEdge[fill[edgeA[e]]++] = e;
    adj[fill[edgeB[e]]] = edgeA[e];
    adjEdge[fill[edgeB[e]]++] = e;
  }
  // Tratti senza nome in città: sono rii (ZTL, 5 km/h) se si collegano a un rio o al Canal Grande; gli altri
  // (raccordi lagunari verso Tronchetto, Giudecca, Bacino) restano fuori dalla ZTL. Due passate per i rii senza
  // nome in fila.
  for (let pass = 0; pass < 2; pass++) {
    for (let e = 0; e < m; e++) {
      if (edgeName[e] || edgeZtl[e]) continue;
      const urban = urbanArea([
        [lon[edgeA[e]], lat[edgeA[e]]],
        [lon[edgeB[e]], lat[edgeB[e]]],
      ]);
      if (!urban) continue;
      let touchesRio = false;
      for (const v of [edgeA[e], edgeB[e]]) {
        for (let k = off[v]; k < off[v + 1]; k++) if (adjEdge[k] !== e && edgeZtl[adjEdge[k]]) touchesRio = true;
      }
      if (!touchesRio) continue;
      edgeKmh[e] = RIO_KMH;
      edgeKnown[e] = 1;
      edgeZtl[e] = 1;
      edgeTide[e] = urban === 'centro' ? 2 : 0;
    }
  }
  const edgeGeom = raw.geom.map((g) => {
    const out = new Float64Array(g.length);
    for (let i = 0; i < g.length; i += 2) {
      out[i] = lon0 + g[i] / raw.scale;
      out[i + 1] = lat0 + g[i + 1] / raw.scale;
    }
    return out;
  });
  const edgeRules: { rule: number; dir: number }[][] = Array.from({ length: m }, () => []);
  raw.rules.forEach((r, ri) => {
    for (const code of r.edges) {
      const e = code >= 0 ? code : ~code;
      if (e < m) edgeRules[e].push({ rule: ri, dir: r.kind === 'oneway' ? (code >= 0 ? 1 : -1) : 0 });
    }
  });
  return { lon, lat, off, adj, adjEdge, edgeA, edgeB, edgeLen, edgeName, edgeKmh, edgeKnown, edgeZtl, edgeTide, edgeGeom, rules: raw.rules, edgeRules, rulesUrl: raw.rulesUrl };
}

/** La regola vale all'ora indicata (secondi dalla mezzanotte) e nel tipo di giorno? */
export function ruleActive(rule: Pick<BoatRule, 'hours' | 'days'>, seconds: number, day: DayType): boolean {
  if (rule.days === 'feriali' && day === 'sunday') return false;
  if (rule.days === 'lunven' && day !== 'weekday') return false;
  if (!rule.hours) return true;
  const min = (((seconds % 86400) + 86400) % 86400) / 60;
  return min >= rule.hours[0] && min < rule.hours[1];
}

export interface BoatOptions {
  /** residente nel centro storico o nelle isole, o concessionario di uno spazio acqueo (art. 18) */
  resident: boolean;
  /** marea in città alla partenza (cm), null se non nota */
  tideCm?: number | null;
}

interface BoatStretch {
  name: string | null;
  meters: number;
  /** tracciato del tratto [lon, lat] */
  path: [number, number][];
}

export interface BoatPlan {
  /** secondi dalla mezzanotte */
  depart: number;
  arrive: number;
  meters: number;
  /** tracciato [lon, lat], dal punto di partenza a quello di arrivo */
  coords: [number, number][];
  /** canali percorsi in ordine, tratti consecutivi con lo stesso nome uniti */
  stretches: BoatStretch[];
  /** metri in canali senza limite noto (velocità ipotizzata) e con il limite indicato solo su OpenStreetMap */
  assumedMeters: number;
  osmLimitMeters: number;
  /** distanza dei punti dall'acqua (m) */
  snapFromM: number;
  snapToM: number;
  /** regole rispettate lungo il percorso (sensi unici percorsi, divieti a orario non attivi adesso) */
  onRoute: BoatRule[];
  /** regole attive che hanno fatto cambiare strada rispetto al percorso più breve */
  avoided: BoatRule[];
  /** regole con la marea applicate (5 km/h o rii vietati) */
  tideRule: 'none' | 'slow' | 'noMotor';
}

type BoatFailure = 'farFromWater' | 'restricted' | 'noRoute';

export type BoatResult = { ok: true; plan: BoatPlan } | { ok: false; reason: BoatFailure };

interface EdgeState {
  /** l'arco si può percorrere nel verso indicato (1 a→b, −1 b→a) all'ora indicata? */
  allowed: (e: number, dir: number, seconds: number) => boolean;
  speedMs: (e: number) => number;
}

function edgeState(g: BoatGraph, day: DayType, opts: BoatOptions): EdgeState & { tideRule: BoatPlan['tideRule'] } {
  const tide = opts.tideCm ?? null;
  const highWater = tide !== null && tide >= HIGH_WATER_CM;
  const slowTide = tide !== null && (tide >= HIGH_WATER_CM || tide <= LOW_WATER_CM);
  return {
    tideRule: highWater ? 'noMotor' : slowTide ? 'slow' : 'none',
    allowed: (e, dir, seconds) => {
      if (g.edgeZtl[e] && !opts.resident) return false;
      if (highWater && g.edgeTide[e] === 2) return false;
      for (const { rule, dir: ok } of g.edgeRules[e]) {
        const r = g.rules[rule];
        if (!ruleActive(r, seconds, day)) continue;
        if (r.kind === 'oneway' ? ok !== dir : true) return false;
      }
      return true;
    },
    speedMs: (e) => ((slowTide && g.edgeTide[e] === 1 ? Math.min(5, g.edgeKmh[e]) : g.edgeKmh[e]) * 1000) / 3600,
  };
}

/** Archi utilizzabili in almeno un verso a quell'ora (per agganciare i punti solo all'acqua percorribile). */
function usableNode(g: BoatGraph, st: EdgeState, node: number, seconds: number): boolean {
  for (let k = g.off[node]; k < g.off[node + 1]; k++) {
    const e = g.adjEdge[k];
    if (st.allowed(e, 1, seconds) || st.allowed(e, -1, seconds)) return true;
  }
  return false;
}

function nearest(g: BoatGraph, lon: number, lat: number, ok: (i: number) => boolean): { node: number; meters: number } {
  let best = -1;
  let bestD = Infinity;
  for (let i = 0; i < g.lon.length; i++) {
    const d = metersBetween(lon, lat, g.lon[i], g.lat[i]);
    if (d < bestD && ok(i)) {
      bestD = d;
      best = i;
    }
  }
  return { node: best, meters: bestD };
}

/** Dijkstra sul tempo (le regole a orario si valutano all'ora in cui si entra nel tratto). */
function search(g: BoatGraph, st: EdgeState, src: number, dst: number, depart: number): { time: Float64Array; via: Int32Array } {
  const n = g.lon.length;
  const time = new Float64Array(n).fill(Infinity);
  const via = new Int32Array(n).fill(-1);
  time[src] = depart;
  const heapN: number[] = [src];
  const heapT: number[] = [depart];
  const swap = (i: number, j: number) => {
    [heapN[i], heapN[j]] = [heapN[j], heapN[i]];
    [heapT[i], heapT[j]] = [heapT[j], heapT[i]];
  };
  while (heapN.length > 0) {
    const u = heapN[0];
    const t = heapT[0];
    const lastN = heapN.pop()!;
    const lastT = heapT.pop()!;
    if (heapN.length > 0) {
      heapN[0] = lastN;
      heapT[0] = lastT;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let s = i;
        if (l < heapN.length && heapT[l] < heapT[s]) s = l;
        if (r < heapN.length && heapT[r] < heapT[s]) s = r;
        if (s === i) break;
        swap(i, s);
        i = s;
      }
    }
    if (t > time[u]) continue;
    if (u === dst) break;
    for (let k = g.off[u]; k < g.off[u + 1]; k++) {
      const v = g.adj[k];
      const e = g.adjEdge[k];
      const dir = g.edgeA[e] === u ? 1 : -1;
      if (!st.allowed(e, dir, t)) continue;
      const nt = t + g.edgeLen[e] / st.speedMs(e);
      if (nt < time[v]) {
        time[v] = nt;
        via[v] = e;
        heapN.push(v);
        heapT.push(nt);
        let i = heapN.length - 1;
        while (i > 0) {
          const p = (i - 1) >> 1;
          if (heapT[p] <= heapT[i]) break;
          swap(p, i);
          i = p;
        }
      }
    }
  }
  return { time, via };
}

/** Archi del percorso da src a dst (in ordine) e il nodo da cui si entra in ciascuno. */
function pathEdges(g: BoatGraph, via: Int32Array, src: number, dst: number): { e: number; from: number }[] {
  const out: { e: number; from: number }[] = [];
  let u = dst;
  while (u !== src && via[u] !== -1) {
    const e = via[u];
    const from = g.edgeA[e] === u ? g.edgeB[e] : g.edgeA[e];
    out.push({ e, from });
    u = from;
  }
  return u === src ? out.reverse() : [];
}

/**
 * Percorso più veloce in barca da `from` a `to` partendo a `depart` (secondi dalla mezzanotte) nel giorno `day`.
 */
export function planBoat(
  g: BoatGraph,
  from: { lon: number; lat: number },
  to: { lon: number; lat: number },
  depart: number,
  day: DayType,
  opts: BoatOptions,
): BoatResult {
  const st = edgeState(g, day, opts);
  const anyO = nearest(g, from.lon, from.lat, () => true);
  const anyD = nearest(g, to.lon, to.lat, () => true);
  if (anyO.meters > MAX_SNAP_M || anyD.meters > MAX_SNAP_M) return { ok: false, reason: 'farFromWater' };
  const o = nearest(g, from.lon, from.lat, (i) => usableNode(g, st, i, depart));
  const d = nearest(g, to.lon, to.lat, (i) => usableNode(g, st, i, depart));
  if (o.meters > MAX_SNAP_M || d.meters > MAX_SNAP_M) return { ok: false, reason: 'restricted' };
  const { time, via } = search(g, st, o.node, d.node, depart);
  if (!Number.isFinite(time[d.node])) return { ok: false, reason: 'noRoute' };
  const edges = pathEdges(g, via, o.node, d.node);

  const coords: [number, number][] = [[from.lon, from.lat]];
  const stretches: BoatStretch[] = [];
  let meters = 0;
  let assumedMeters = 0;
  let osmLimitMeters = 0;
  const onRoute = new Set<number>();
  let t = depart;
  for (const { e, from: u } of edges) {
    const forward = g.edgeA[e] === u;
    const geom = g.edgeGeom[e];
    const pts: [number, number][] = [[g.lon[g.edgeA[e]], g.lat[g.edgeA[e]]]];
    for (let i = 0; i < geom.length; i += 2) pts.push([geom[i], geom[i + 1]]);
    pts.push([g.lon[g.edgeB[e]], g.lat[g.edgeB[e]]]);
    if (!forward) pts.reverse();
    coords.push(...(coords.length === 1 ? pts : pts.slice(1)));
    const len = g.edgeLen[e];
    meters += len;
    if (g.edgeKnown[e] === 0) assumedMeters += len;
    else if (g.edgeKnown[e] === 2) osmLimitMeters += len;
    const name = g.edgeName[e];
    const last = stretches[stretches.length - 1];
    if (last && last.name === name) {
      last.meters += len;
      last.path.push(...pts.slice(1));
    } else stretches.push({ name, meters: len, path: pts });
    for (const { rule } of g.edgeRules[e]) {
      const r = g.rules[rule];
      // sensi unici percorsi e divieti a orario che adesso non valgono: utile sapere che esistono
      if (r.kind === 'oneway' || !ruleActive(r, t, day)) onRoute.add(rule);
    }
    t += len / st.speedMs(e);
  }
  coords.push([to.lon, to.lat]);

  // Regole che hanno allungato il percorso: attive sul percorso più veloce senza regole
  const free: EdgeState = { allowed: (e) => !g.edgeZtl[e] || opts.resident, speedMs: st.speedMs };
  const freeSearch = search(g, free, o.node, d.node, depart);
  const avoided = new Set<number>();
  if (freeSearch.time[d.node] < time[d.node] - 1) {
    let tf = depart;
    for (const { e, from: u } of pathEdges(g, freeSearch.via, o.node, d.node)) {
      const dir = g.edgeA[e] === u ? 1 : -1;
      for (const { rule, dir: ok } of g.edgeRules[e]) {
        const r = g.rules[rule];
        if (ruleActive(r, tf, day) && (r.kind !== 'oneway' || ok !== dir)) avoided.add(rule);
      }
      tf += g.edgeLen[e] / st.speedMs(e);
    }
  }
  return {
    ok: true,
    plan: {
      depart,
      arrive: time[d.node],
      meters,
      coords,
      stretches,
      assumedMeters,
      osmLimitMeters,
      snapFromM: o.meters,
      snapToM: d.meters,
      onRoute: [...onRoute].filter((i) => !avoided.has(i)).map((i) => g.rules[i]),
      avoided: [...avoided].map((i) => g.rules[i]),
      tideRule: st.tideRule,
    },
  };
}

/** Ordinanze di traffico acqueo in vigore oggi sui canali del percorso (per nome o per il punto del Comune). */
export function ordinancesOnRoute(plan: BoatPlan, ordinances: OrdinanceItem[]): OrdinanceItem[] {
  const active = ordinances.filter((o) => o.status === 'active');
  if (active.length === 0) return [];
  const out = new Map<string, OrdinanceItem>();
  for (const s of plan.stretches) for (const o of ordinancesForCanal(s.name, s.path, active)) out.set(o.id, o);
  return [...out.values()];
}
