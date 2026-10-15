import { WALK_URL } from '@/lib/walk-data';
import type { ColorScheme } from '@/lib/solar';
import { edgeElevations, isMainland } from '@/lib/streetElevation';

/** Arco della terraferma: escluso dal disegno delle calli e dalle statistiche dell'acqua alta */
const MAINLAND_FLAG = 2;
import { toGrid } from '@/lib/positionDelay';

const mx = (lon: number): number => toGrid(lon, 0)[0];
const my = (lat: number): number => toGrid(0, lat)[1];

export interface RawWalkData {
  origin: [number, number];
  scale: number;
  nodes: number[];
  edges: number[];
  geom: number[][];
}

export interface IndexedStreets {
  edgeCount: number;
  boxes: Float32Array;
  offsets: Int32Array;
  lengths: Int16Array;
  flags: Uint8Array;
  allCoords: Float32Array;
  elevations: Int16Array;
}

let streetsData: IndexedStreets | null = null;
let streetsRequestedAt = 0;

export const isStreetsLoaded = (): boolean => streetsData !== null;

export const getStreetsData = (): IndexedStreets | null => streetsData;

export function getStreetsStats(): { loaded: boolean; edges: number } {
  return {
    loaded: streetsData !== null,
    edges: streetsData ? streetsData.edgeCount : 0,
  };
}

export function getFloodedEdgesStats(tideCm: number): { floodedCount: number; totalCalli: number; percentage: number } {
  if (!streetsData || tideCm < 80) return { floodedCount: 0, totalCalli: 0, percentage: 0 };
  let flooded = 0;
  let calli = 0;
  const { edgeCount, flags, elevations } = streetsData;
  for (let e = 0; e < edgeCount; e++) {
    if (flags[e] === 0) {
      calli++;
      if (elevations[e] <= tideCm) flooded++;
    }
  }
  const percentage = calli > 0 ? +((flooded / calli) * 100).toFixed(1) : 0;
  return { floodedCount: flooded, totalCalli: calli, percentage };
}

export function indexRawWalk(data: RawWalkData): IndexedStreets {
  const n = data.nodes.length / 2;
  const m = data.edges.length / 4;

  const nodeX = new Float32Array(n);
  const nodeY = new Float32Array(n);
  const lon0 = data.origin[0];
  const lat0 = data.origin[1];
  const sc = data.scale;

  for (let i = 0; i < n; i++) {
    nodeX[i] = mx(lon0 + data.nodes[2 * i] / sc);
    nodeY[i] = my(lat0 + data.nodes[2 * i + 1] / sc);
  }

  let totalCoords = 0;
  for (let e = 0; e < m; e++) {
    const g = data.geom[e];
    totalCoords += 2 + (g ? g.length / 2 : 0);
  }

  const allCoords = new Float32Array(totalCoords * 2);
  const offsets = new Int32Array(m + 1);
  const lengths = new Int16Array(m);
  const flags = new Uint8Array(m);
  const boxes = new Float32Array(m * 4);

  let ptr = 0;
  for (let e = 0; e < m; e++) {
    offsets[e] = ptr;
    const u = data.edges[4 * e];
    const v = data.edges[4 * e + 1];
    // terraferma (Mestre, aeroporto, Cavallino): nella rete del planner ma non è il tessuto delle calli né del modello
    // dell'acqua alta; flag 2 = non disegnata né contata
    const midLon = lon0 + (data.nodes[2 * u] + data.nodes[2 * v]) / 2 / sc;
    const midLat = lat0 + (data.nodes[2 * u + 1] + data.nodes[2 * v + 1]) / 2 / sc;
    flags[e] = isMainland(midLon, midLat) ? MAINLAND_FLAG : data.edges[4 * e + 3];

    let x0 = nodeX[u];
    let x1 = nodeX[u];
    let y0 = nodeY[u];
    let y1 = nodeY[u];

    allCoords[ptr++] = nodeX[u];
    allCoords[ptr++] = nodeY[u];

    const g = data.geom[e];
    if (g && g.length > 0) {
      for (let k = 0; k < g.length; k += 2) {
        const gx = mx(lon0 + g[k] / sc);
        const gy = my(lat0 + g[k + 1] / sc);
        allCoords[ptr++] = gx;
        allCoords[ptr++] = gy;
        if (gx < x0) x0 = gx;
        if (gx > x1) x1 = gx;
        if (gy < y0) y0 = gy;
        if (gy > y1) y1 = gy;
      }
    }

    allCoords[ptr++] = nodeX[v];
    allCoords[ptr++] = nodeY[v];
    if (nodeX[v] < x0) x0 = nodeX[v];
    if (nodeX[v] > x1) x1 = nodeX[v];
    if (nodeY[v] < y0) y0 = nodeY[v];
    if (nodeY[v] > y1) y1 = nodeY[v];

    lengths[e] = (ptr - offsets[e]) / 2;
    boxes[4 * e] = x0;
    boxes[4 * e + 1] = y0;
    boxes[4 * e + 2] = x1;
    boxes[4 * e + 3] = y1;
  }
  offsets[m] = ptr;

  const elevations = edgeElevations(data);

  return {
    edgeCount: m,
    boxes,
    offsets,
    lengths,
    flags,
    allCoords,
    elevations,
  };
}

export function requestStreets(onReady: () => void): void {
  if (streetsData || Date.now() - streetsRequestedAt < 30_000) return;
  streetsRequestedAt = Date.now();
  fetch(WALK_URL)
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<RawWalkData>;
    })
    .then((raw) => {
      streetsData = indexRawWalk(raw);
      onReady();
    })
    .catch((e) => console.warn('Rete calli non disponibile:', e));
}

export interface StreetsPaintOptions {
  cw: number;
  ch: number;
  camera: { x0: number; y0: number; s: number };
  pal: ColorScheme;
  zoomFactor: number;
}

/**
 * Disegna calli e ponti del tessuto urbano di Venezia.
 * Viene eseguito in cache dentro baseMap sul canvas offscreen.
 */
export function paintStreets(b: CanvasRenderingContext2D, o: StreetsPaintOptions): void {
  if (!streetsData || o.zoomFactor < 1.7) return;

  const { cw, ch, camera, pal, zoomFactor } = o;
  const { edgeCount, boxes, offsets, lengths, flags, allCoords } = streetsData;

  const sx = (x: number) => (x - camera.x0) * camera.s;
  const sy = (y: number) => (y - camera.y0) * camera.s;

  // Viewport culling con margine
  const m = 12 / camera.s;
  const vx0 = camera.x0 - m;
  const vy0 = camera.y0 - m;
  const vx1 = camera.x0 + cw / camera.s + m;
  const vy1 = camera.y0 + ch / camera.s + m;

  // Fade-in progressivo tra zoomFactor 1.7 e 2.6
  const alpha = Math.min(1.0, Math.max(0.1, (zoomFactor - 1.7) / 0.9));

  // Riconoscimento tema chiaro vs scuro
  const isDark = pal.coast === '#3a4850' || pal.land === '#1a2227' || pal.ground.startsWith('#0') || pal.ground.startsWith('#1');

  // Larghezze in pixel CSS adattive
  const calleWidth = Math.max(1.2, Math.min(4.5, 1.8 * camera.s));
  const bridgeWidth = Math.max(2.0, Math.min(6.5, 2.6 * camera.s));

  b.save();
  b.lineJoin = 'round';
  b.lineCap = 'round';

  // PASS 1: Disegno calli (flag === 0)
  // Bordo / incasso calle per contrasto contro il blocco isola
  const calleCasingColor = isDark
    ? `rgba(0, 0, 0, ${(0.45 * alpha).toFixed(2)})`
    : `rgba(125, 107, 85, ${(0.32 * alpha).toFixed(2)})`;

  b.strokeStyle = calleCasingColor;
  b.lineWidth = calleWidth + 1.2;
  b.beginPath();
  let visibleCalleCount = 0;
  for (let e = 0; e < edgeCount; e++) {
    if (flags[e] !== 0) continue;
    const i = 4 * e;
    if (boxes[i + 2] < vx0 || boxes[i] > vx1 || boxes[i + 3] < vy0 || boxes[i + 1] > vy1) continue;

    visibleCalleCount++;
    const start = offsets[e];
    const len = lengths[e];
    b.moveTo(sx(allCoords[start]), sy(allCoords[start + 1]));
    for (let p = 1; p < len; p++) {
      b.lineTo(sx(allCoords[start + 2 * p]), sy(allCoords[start + 2 * p + 1]));
    }
  }
  if (visibleCalleCount > 0) {
    b.stroke();
  }

  // Riempimento calle (pietra d'Istria/masegni chiari di giorno, selciato illuminato di notte)
  const calleFillColor = isDark
    ? `rgba(215, 230, 245, ${(0.22 * alpha).toFixed(2)})`
    : `rgba(255, 255, 255, ${(0.78 * alpha).toFixed(2)})`;

  b.strokeStyle = calleFillColor;
  b.lineWidth = calleWidth;
  b.beginPath();
  for (let e = 0; e < edgeCount; e++) {
    if (flags[e] !== 0) continue;
    const i = 4 * e;
    if (boxes[i + 2] < vx0 || boxes[i] > vx1 || boxes[i + 3] < vy0 || boxes[i + 1] > vy1) continue;

    const start = offsets[e];
    const len = lengths[e];
    b.moveTo(sx(allCoords[start]), sy(allCoords[start + 1]));
    for (let p = 1; p < len; p++) {
      b.lineTo(sx(allCoords[start + 2 * p]), sy(allCoords[start + 2 * p + 1]));
    }
  }
  if (visibleCalleCount > 0) {
    b.stroke();
  }

  // PASS 2: Disegno ponti (flag === 1)
  // I ponti scavalcano l'acqua e collegano le sponde opposte
  const bridgeCasingColor = isDark
    ? `rgba(10, 15, 25, ${(0.85 * alpha).toFixed(2)})`
    : `rgba(65, 50, 35, ${(0.75 * alpha).toFixed(2)})`;

  const bridgeFillColor = isDark
    ? `rgba(255, 255, 255, ${(0.95 * alpha).toFixed(2)})`
    : `rgba(255, 255, 255, ${(0.98 * alpha).toFixed(2)})`;

  // Casing del ponte
  b.strokeStyle = bridgeCasingColor;
  b.lineWidth = bridgeWidth + 1.8;
  b.beginPath();
  let visibleBridgeCount = 0;
  for (let e = 0; e < edgeCount; e++) {
    if (flags[e] !== 1) continue;
    const i = 4 * e;
    if (boxes[i + 2] < vx0 || boxes[i] > vx1 || boxes[i + 3] < vy0 || boxes[i + 1] > vy1) continue;

    visibleBridgeCount++;
    const start = offsets[e];
    const len = lengths[e];
    b.moveTo(sx(allCoords[start]), sy(allCoords[start + 1]));
    for (let p = 1; p < len; p++) {
      b.lineTo(sx(allCoords[start + 2 * p]), sy(allCoords[start + 2 * p + 1]));
    }
  }
  if (visibleBridgeCount > 0) {
    b.stroke();
  }

  // Piano di calpestio del ponte
  b.strokeStyle = bridgeFillColor;
  b.lineWidth = bridgeWidth;
  b.beginPath();
  for (let e = 0; e < edgeCount; e++) {
    if (flags[e] !== 1) continue;
    const i = 4 * e;
    if (boxes[i + 2] < vx0 || boxes[i] > vx1 || boxes[i + 3] < vy0 || boxes[i + 1] > vy1) continue;

    const start = offsets[e];
    const len = lengths[e];
    b.moveTo(sx(allCoords[start]), sy(allCoords[start + 1]));
    for (let p = 1; p < len; p++) {
      b.lineTo(sx(allCoords[start + 2 * p]), sy(allCoords[start + 2 * p + 1]));
    }
  }
  if (visibleBridgeCount > 0) {
    b.stroke();
  }

  b.restore();
}

export interface FloodedStreetsPaintOptions {
  cw: number;
  ch: number;
  camera: { x0: number; y0: number; s: number };
  tideLevel: number;
  animate?: boolean;
}

/**
 * Disegna la simulazione volumetrica dell'acqua alta sulle calli e campielli di Venezia.
 * L'acqua allaga le vie con quota altimetrica inferiore alla marea, differenziando la profondita
 * con un gradiente cromatico e increspature animate, lasciando emersi e percorribili i ponti.
 */
export function paintFloodedStreets(ctx: CanvasRenderingContext2D, o: FloodedStreetsPaintOptions): void {
  if (!streetsData || o.tideLevel < 80) return;
  const { cw, ch, camera, tideLevel, animate = true } = o;
  const { edgeCount, boxes, offsets, lengths, flags, allCoords, elevations } = streetsData;

  const sx = (x: number) => (x - camera.x0) * camera.s;
  const sy = (y: number) => (y - camera.y0) * camera.s;

  const m = 12 / camera.s;
  const vx0 = camera.x0 - m;
  const vy0 = camera.y0 - m;
  const vx1 = camera.x0 + cw / camera.s + m;
  const vy1 = camera.y0 + ch / camera.s + m;

  // Larghezza fluida volumetrica della calle: espansa per riempire il corridoio urbano tra i muri
  const fluidBase = Math.max(4.2, Math.min(22.0, 16.0 * camera.s));
  const bridgeWidth = Math.max(2.4, Math.min(8.5, 3.2 * camera.s));

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const shallowEdges: number[] = [];
  const mediumEdges: number[] = [];
  const deepEdges: number[] = [];
  const visibleBridges: number[] = [];

  for (let e = 0; e < edgeCount; e++) {
    const i = 4 * e;
    if (boxes[i + 2] < vx0 || boxes[i] > vx1 || boxes[i + 3] < vy0 || boxes[i + 1] > vy1) continue;

    if (flags[e] === 1) {
      visibleBridges.push(e);
      continue;
    }

    if (elevations[e] <= tideLevel) {
      const depth = tideLevel - elevations[e];
      if (depth <= 8) {
        shallowEdges.push(e);
      } else if (depth <= 20) {
        mediumEdges.push(e);
      } else {
        deepEdges.push(e);
      }
    }
  }

  const renderEdgeList = (edges: number[]) => {
    ctx.beginPath();
    for (let k = 0; k < edges.length; k++) {
      const e = edges[k];
      const start = offsets[e];
      const len = lengths[e];
      ctx.moveTo(sx(allCoords[start]), sy(allCoords[start + 1]));
      for (let p = 1; p < len; p++) {
        ctx.lineTo(sx(allCoords[start + 2 * p]), sy(allCoords[start + 2 * p + 1]));
      }
    }
    ctx.stroke();
  };

  const totalFlooded = shallowEdges.length + mediumEdges.length + deepEdges.length;
  if (totalFlooded === 0 && visibleBridges.length === 0) {
    ctx.restore();
    return;
  }

  const allFlooded = shallowEdges.concat(mediumEdges, deepEdges);

  // PASS 1: Menisco fluido e alone di battente diffuso (fonde le calli adiacenti in una massa fluida continua)
  if (totalFlooded > 0) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.38)';
    ctx.lineWidth = fluidBase * 1.6;
    renderEdgeList(allFlooded);
  }

  // PASS 2: Massa d'acqua principale stratificata per profondita
  if (deepEdges.length > 0) {
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.88)';
    ctx.lineWidth = fluidBase * 1.25;
    renderEdgeList(deepEdges);
  }

  if (mediumEdges.length > 0) {
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.75)';
    ctx.lineWidth = fluidBase * 1.10;
    renderEdgeList(mediumEdges);
  }

  if (shallowEdges.length > 0) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.60)';
    ctx.lineWidth = fluidBase * 0.95;
    renderEdgeList(shallowEdges);
  }

  // PASS 3: Cuore profondo del canale allagato (colore blu marino denso nei tratti piu profondi)
  if (deepEdges.length > 0) {
    ctx.strokeStyle = 'rgba(3, 105, 161, 0.95)';
    ctx.lineWidth = fluidBase * 0.65;
    renderEdgeList(deepEdges);
  }

  // PASS 4: Increspatura e riflessi di luce dinamici dell'acqua in movimento (caustiche fluide)
  if (animate && totalFlooded > 0) {
    const time = Date.now() / 800;
    ctx.setLineDash([12, 18]);
    ctx.lineDashOffset = -time * 26;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = Math.max(1.4, fluidBase * 0.35);
    renderEdgeList(allFlooded);
    ctx.setLineDash([]);
  }

  // PASS 5: Ponti in pietra bianca emersi e asciutti: via di fuga pedonale chiaramente visibile sopra l'acqua
  if (visibleBridges.length > 0) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.90)';
    ctx.lineWidth = bridgeWidth + 2.0;
    renderEdgeList(visibleBridges);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.98)';
    ctx.lineWidth = bridgeWidth;
    renderEdgeList(visibleBridges);
  }

  ctx.restore();
}
