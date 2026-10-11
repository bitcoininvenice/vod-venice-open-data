import { WALK_URL } from '@/lib/walk-data';
import type { ColorScheme } from '@/lib/solar';

/**
 * Coordinate griglia virtuale condivise con MapEngine e baseMap.
 */
const GRID_FRAME = [12.135, 12.47, 45.205, 45.555] as const;
const GRID_W = 26194;
const GRID_H = 38701;
const KX = GRID_W / (GRID_FRAME[1] - GRID_FRAME[0]);
const KY = GRID_H / (GRID_FRAME[3] - GRID_FRAME[2]);

const mx = (lon: number): number => (lon - GRID_FRAME[0]) * KX;
const my = (lat: number): number => (GRID_FRAME[3] - lat) * KY;

export interface RawWalkData {
  origin: [number, number];
  scale: number;
  nodes: number[];
  edges: number[];
  geom: number[][];
}

interface IndexedStreets {
  edgeCount: number;
  boxes: Float32Array;
  offsets: Int32Array;
  lengths: Int16Array;
  flags: Uint8Array;
  allCoords: Float32Array;
}

let streetsData: IndexedStreets | null = null;
let streetsRequestedAt = 0;

export const isStreetsLoaded = (): boolean => streetsData !== null;

export function getStreetsStats(): { loaded: boolean; edges: number } {
  return {
    loaded: streetsData !== null,
    edges: streetsData ? streetsData.edgeCount : 0,
  };
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
    flags[e] = data.edges[4 * e + 3];

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

  return {
    edgeCount: m,
    boxes,
    offsets,
    lengths,
    flags,
    allCoords,
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
    ? `rgba(56, 189, 248, ${(0.9 * alpha).toFixed(2)})`
    : `rgba(255, 255, 255, ${(0.95 * alpha).toFixed(2)})`;

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
