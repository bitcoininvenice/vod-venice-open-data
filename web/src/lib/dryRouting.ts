/**
 * Percorsi a piedi "più probabilmente asciutti" con l'acqua alta.
 *
 * Una calle è considerata allagata quando la sua quota stimata (lib/streetElevation) è sotto il livello
 * di marea in città; i ponti restano asciutti; dove il piano del Comune prevede una passerella a quel
 * livello la calle conta come transitabile. È una stima: quote e tracciati delle passerelle sono indicativi.
 */
import type { PasserellaItem } from './types';
import { PASSERELLE_MIN_THRESHOLD_CM } from './passerelle';
import type { WalkGraph } from './walkGraph';

/** Ogni metro allagato pesa come (1 + WET_COST) metri asciutti, più la profondità */
export const WET_COST = 4;
/** Distanza massima tra una calle e il tracciato (indicativo) di una passerella */
const PASSERELLA_SNAP_M = 25;

/** stato di ogni arco: 0 asciutto, EDGE_WET allagato, EDGE_PASSERELLA su passerella */
const EDGE_WET = 1;
const EDGE_PASSERELLA = 2;

export interface FloodWeights {
  levelCm: number;
  weight: Float32Array;
  /** EDGE_DRY / EDGE_WET / EDGE_PASSERELLA per ogni arco */
  state: Uint8Array;
}

/** Distanza in metri di un punto da un segmento (piano locale equirettangolare). */
function segmentDistance(lon: number, lat: number, a: [number, number], b: [number, number]): number {
  const kx = Math.cos((lat * Math.PI) / 180) * 111320;
  const ky = 110540;
  const px = (lon - a[0]) * kx;
  const py = (lat - a[1]) * ky;
  const dx = (b[0] - a[0]) * kx;
  const dy = (b[1] - a[1]) * ky;
  const len2 = dx * dx + dy * dy;
  const t = len2 > 0 ? Math.max(0, Math.min(1, (px * dx + py * dy) / len2)) : 0;
  return Math.hypot(px - t * dx, py - t * dy);
}

const thresholdCache = new WeakMap<WalkGraph, WeakMap<PasserellaItem[], Float32Array>>();

/** Per ogni arco la quota più bassa a cui una passerella del piano lo copre (Infinity se nessuna). */
function passerellaThresholds(g: WalkGraph, passerelle: PasserellaItem[]): Float32Array {
  let byList = thresholdCache.get(g);
  if (!byList) thresholdCache.set(g, (byList = new WeakMap()));
  const cached = byList.get(passerelle);
  if (cached) return cached;

  const m = g.edgeA.length;
  const out = new Float32Array(m).fill(Infinity);
  const routes = passerelle.filter((p) => !p.variantOf && p.path.length >= 2);
  const pad = 0.0005; // ~40 m
  const boxes = routes.map((p) => {
    const lons = p.path.map((c) => c[0]);
    const lats = p.path.map((c) => c[1]);
    return [Math.min(...lons) - pad, Math.min(...lats) - pad, Math.max(...lons) + pad, Math.max(...lats) + pad];
  });
  for (let e = 0; e < m; e++) {
    if (g.edgeFlags[e] === 1) continue;
    const lon = (g.lon[g.edgeA[e]] + g.lon[g.edgeB[e]]) / 2;
    const lat = (g.lat[g.edgeA[e]] + g.lat[g.edgeB[e]]) / 2;
    routes.forEach((p, r) => {
      const b = boxes[r];
      if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3] || p.activationThresholdCm >= out[e]) return;
      for (let i = 0; i < p.path.length - 1; i++) {
        if (segmentDistance(lon, lat, p.path[i], p.path[i + 1]) <= PASSERELLA_SNAP_M) {
          out[e] = p.activationThresholdCm;
          return;
        }
      }
    });
  }
  byList.set(passerelle, out);
  return out;
}

/**
 * Pesi degli archi per il livello di marea indicato; null se a quel livello non si allaga nulla
 * (il percorso resta quello più breve).
 */
export function floodWeights(g: WalkGraph, levelCm: number | null | undefined, passerelle: PasserellaItem[] = []): FloodWeights | null {
  if (levelCm == null || levelCm < PASSERELLE_MIN_THRESHOLD_CM) return null;
  const m = g.edgeA.length;
  const weight = new Float32Array(m).fill(1);
  const state = new Uint8Array(m);
  const thresholds = passerelle.length > 0 ? passerellaThresholds(g, passerelle) : null;
  let anyWet = false;
  for (let e = 0; e < m; e++) {
    if (g.edgeFlags[e] === 1 || g.edgeElev[e] > levelCm) continue;
    if (thresholds && levelCm >= thresholds[e]) {
      state[e] = EDGE_PASSERELLA;
      weight[e] = 1.1; // in fila sulla passerella si va un po' più piano
      continue;
    }
    state[e] = EDGE_WET;
    weight[e] = 1 + WET_COST + (levelCm - g.edgeElev[e]) / 10;
    anyWet = true;
  }
  return anyWet ? { levelCm, weight, state } : null;
}

export interface WetSummary {
  wetMeters: number;
  passerellaMeters: number;
  /** profondità stimata massima lungo il tratto (cm) */
  maxDepthCm: number;
}

export const NO_WATER: WetSummary = { wetMeters: 0, passerellaMeters: 0, maxDepthCm: 0 };

/** Metri allagati, su passerella e profondità massima stimata lungo una sequenza di archi. */
export function summarizeEdges(g: WalkGraph, edges: number[], fw: FloodWeights | null): WetSummary {
  if (!fw) return NO_WATER;
  const out = { wetMeters: 0, passerellaMeters: 0, maxDepthCm: 0 };
  for (const e of edges) {
    if (fw.state[e] === EDGE_WET) {
      out.wetMeters += g.edgeLen[e];
      out.maxDepthCm = Math.max(out.maxDepthCm, fw.levelCm - g.edgeElev[e]);
    } else if (fw.state[e] === EDGE_PASSERELLA) {
      out.passerellaMeters += g.edgeLen[e];
    }
  }
  return out;
}

export function addSummaries(a: WetSummary, b: WetSummary): WetSummary {
  return { wetMeters: a.wetMeters + b.wetMeters, passerellaMeters: a.passerellaMeters + b.passerellaMeters, maxDepthCm: Math.max(a.maxDepthCm, b.maxDepthCm) };
}
