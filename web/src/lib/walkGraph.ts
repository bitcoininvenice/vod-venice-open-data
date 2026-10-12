/**
 * Rete pedonale di Venezia (OpenStreetMap, pipeline/import_osm_walk.py) e percorsi a piedi più brevi.
 * Il file (circa 200 KB compressi) si scarica solo quando serve il planner; il calcolo è nel browser.
 */
import { edgeElevations } from './streetElevation';

export interface RawWalk {
  origin: [number, number];
  scale: number;
  /** [x, y] interi alternati */
  nodes: number[];
  /** [a, b, lunghezza in dm, flag] alternati */
  edges: number[];
  /** geometria intermedia di ogni arco, [x, y] interi alternati */
  geom: number[][];
}

export interface WalkGraph {
  lon: Float64Array;
  lat: Float64Array;
  /** adiacenza compressa: archi del nodo i in adj[off[i]..off[i+1]) */
  off: Int32Array;
  adj: Int32Array;
  /** per ogni voce di adj: indice dell'arco */
  adjEdge: Int32Array;
  edgeA: Int32Array;
  edgeB: Int32Array;
  /** lunghezza in metri */
  edgeLen: Float32Array;
  edgeFlags: Uint8Array;
  /** quota stimata dell'arco (cm sullo ZMPS), la stessa delle calli allagate in mappa */
  edgeElev: Int16Array;
  edgeGeom: Float64Array[];
}

export function buildWalkGraph(raw: RawWalk): WalkGraph {
  const n = raw.nodes.length / 2;
  const [lon0, lat0] = raw.origin;
  const lon = new Float64Array(n);
  const lat = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    lon[i] = lon0 + raw.nodes[2 * i] / raw.scale;
    lat[i] = lat0 + raw.nodes[2 * i + 1] / raw.scale;
  }
  const m = raw.edges.length / 4;
  const edgeA = new Int32Array(m);
  const edgeB = new Int32Array(m);
  const edgeLen = new Float32Array(m);
  const edgeFlags = new Uint8Array(m);
  const deg = new Int32Array(n + 1);
  for (let e = 0; e < m; e++) {
    edgeA[e] = raw.edges[4 * e];
    edgeB[e] = raw.edges[4 * e + 1];
    edgeLen[e] = raw.edges[4 * e + 2] / 10;
    edgeFlags[e] = raw.edges[4 * e + 3];
    deg[edgeA[e] + 1]++;
    deg[edgeB[e] + 1]++;
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
  const edgeGeom = raw.geom.map((g) => {
    const out = new Float64Array(g.length);
    for (let i = 0; i < g.length; i += 2) {
      out[i] = lon0 + g[i] / raw.scale;
      out[i + 1] = lat0 + g[i + 1] / raw.scale;
    }
    return out;
  });
  return { lon, lat, off, adj, adjEdge, edgeA, edgeB, edgeLen, edgeFlags, edgeElev: edgeElevations(raw), edgeGeom };
}

/** Distanza in metri tra due punti (approssimazione equirettangolare, adatta a scala urbana). */
export function metersBetween(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const k = Math.cos((((lat1 + lat2) / 2) * Math.PI) / 180) * 111320;
  return Math.hypot((lon2 - lon1) * k, (lat2 - lat1) * 110540);
}

/** Nodo della rete più vicino a un punto e la sua distanza in metri. */
export function nearestNode(g: WalkGraph, lon: number, lat: number): { node: number; meters: number } {
  let best = -1;
  let bestD = Infinity;
  for (let i = 0; i < g.lon.length; i++) {
    const d = metersBetween(lon, lat, g.lon[i], g.lat[i]);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return { node: best, meters: bestD };
}

export interface ShortestPaths {
  /** costo da ogni nodo (Infinity se irraggiungibile): metri, moltiplicati per il peso dell'arco se indicato */
  dist: Float64Array;
  /** metri reali lungo il percorso scelto */
  meters: Float64Array;
  /** arco con cui si arriva al nodo nel percorso migliore (-1 per la sorgente) */
  via: Int32Array;
}

/**
 * Dijkstra da un nodo, fermandosi oltre `maxMeters` di costo.
 * `weight` (facoltativo) moltiplica la lunghezza di ogni arco, per esempio per evitare le calli allagate.
 */
export function shortestPaths(g: WalkGraph, source: number, maxMeters = Infinity, weight?: Float32Array): ShortestPaths {
  const n = g.lon.length;
  const dist = new Float64Array(n).fill(Infinity);
  const meters = new Float64Array(n).fill(Infinity);
  const via = new Int32Array(n).fill(-1);
  dist[source] = 0;
  meters[source] = 0;
  // coda di priorità a heap binario (nodo, distanza)
  const heapN: number[] = [source];
  const heapD: number[] = [0];
  const push = (node: number, d: number) => {
    heapN.push(node);
    heapD.push(d);
    let i = heapN.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heapD[p] <= heapD[i]) break;
      [heapN[p], heapN[i]] = [heapN[i], heapN[p]];
      [heapD[p], heapD[i]] = [heapD[i], heapD[p]];
      i = p;
    }
  };
  const pop = (): [number, number] => {
    const top: [number, number] = [heapN[0], heapD[0]];
    const lastN = heapN.pop()!;
    const lastD = heapD.pop()!;
    if (heapN.length > 0) {
      heapN[0] = lastN;
      heapD[0] = lastD;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let s = i;
        if (l < heapN.length && heapD[l] < heapD[s]) s = l;
        if (r < heapN.length && heapD[r] < heapD[s]) s = r;
        if (s === i) break;
        [heapN[s], heapN[i]] = [heapN[i], heapN[s]];
        [heapD[s], heapD[i]] = [heapD[i], heapD[s]];
        i = s;
      }
    }
    return top;
  };
  while (heapN.length > 0) {
    const [u, d] = pop();
    if (d > dist[u] || d > maxMeters) continue;
    for (let k = g.off[u]; k < g.off[u + 1]; k++) {
      const v = g.adj[k];
      const e = g.adjEdge[k];
      const nd = d + g.edgeLen[e] * (weight ? weight[e] : 1);
      if (nd < dist[v]) {
        dist[v] = nd;
        meters[v] = meters[u] + g.edgeLen[e];
        via[v] = e;
        push(v, nd);
      }
    }
  }
  return { dist, meters, via };
}

/** Archi del percorso dalla sorgente al nodo `target` (dall'ultimo al primo). */
export function pathEdges(g: WalkGraph, sp: ShortestPaths, target: number): number[] {
  const out: number[] = [];
  let u = target;
  while (sp.via[u] !== -1) {
    const e = sp.via[u];
    out.push(e);
    u = g.edgeA[e] === u ? g.edgeB[e] : g.edgeA[e];
  }
  return out;
}

/** Tracciato [lon, lat][] dalla sorgente al nodo `target`, con la geometria degli archi. */
export function pathCoords(g: WalkGraph, sp: ShortestPaths, target: number): [number, number][] {
  if (!Number.isFinite(sp.dist[target])) return [];
  const rev: [number, number][] = [[g.lon[target], g.lat[target]]];
  let u = target;
  while (sp.via[u] !== -1) {
    const e = sp.via[u];
    const from = g.edgeA[e] === u ? g.edgeB[e] : g.edgeA[e];
    const geom = g.edgeGeom[e];
    // la geometria va da edgeA a edgeB: percorsa al contrario se si arriva da edgeB
    const pts: [number, number][] = [];
    for (let i = 0; i < geom.length; i += 2) pts.push([geom[i], geom[i + 1]]);
    if (g.edgeA[e] === u) pts.reverse(); // stiamo andando da B verso A all'indietro
    for (let i = pts.length - 1; i >= 0; i--) rev.push(pts[i]);
    rev.push([g.lon[from], g.lat[from]]);
    u = from;
  }
  return rev.reverse();
}
