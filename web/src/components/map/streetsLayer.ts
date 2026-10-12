import { WALK_URL } from '@/lib/walk-data';
import type { ColorScheme } from '@/lib/solar';
import { getFloodedGroundPercentage } from '@/lib/flood';
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

/**
 * Quote indicative del piano di calpestio (cm sullo ZMPS) in punti noti: ordinano le calli dalla più bassa
 * alla più alta. Nel centro storico le quote finali vengono poi calibrate sulla curva ufficiale CPSM.
 */
const FLOOD_ANCHORS = [
  { lon: 12.3385, lat: 45.4338, h: 78, r: 120 }, // San Marco Piazzetta (punto piu basso)
  { lon: 12.3370, lat: 45.4344, h: 84, r: 180 }, // San Marco Piazza
  { lon: 12.3392, lat: 45.4352, h: 87, r: 140 }, // Piazzetta Leoncini / Spadaria
  { lon: 12.3360, lat: 45.4382, h: 95, r: 130 }, // Rialto Erbaria
  { lon: 12.3368, lat: 45.4377, h: 102, r: 140 }, // Campo San Bartolomeo
  { lon: 12.3365, lat: 45.4312, h: 98, r: 150 }, // Dogana & Salute
  { lon: 12.3425, lat: 45.4345, h: 99, r: 160 }, // San Zaccaria / Schiavoni
  { lon: 12.3255, lat: 45.4445, h: 105, r: 160 }, // Cannaregio Guglie
  { lon: 12.3325, lat: 45.4455, h: 108, r: 170 }, // Misericordia / Ormesini
  { lon: 12.3280, lat: 45.4485, h: 120, r: 170 }, // Sant'Alvise
  { lon: 12.3395, lat: 45.4448, h: 128, r: 170 }, // Fondamente Nove
  { lon: 12.3265, lat: 45.4262, h: 108, r: 190 }, // Giudecca Palanca
  { lon: 12.3420, lat: 45.4260, h: 124, r: 200 }, // Giudecca Zitelle
  { lon: 12.3200, lat: 45.4280, h: 122, r: 180 }, // Giudecca Molino Stucky
  { lon: 12.3300, lat: 45.4372, h: 110, r: 160 }, // Campo San Polo
  { lon: 12.3275, lat: 45.4412, h: 118, r: 160 }, // San Giacomo dell'Orio
  { lon: 12.3235, lat: 45.4338, h: 114, r: 170 }, // Campo Santa Margherita
  { lon: 12.3280, lat: 45.4295, h: 108, r: 160 }, // Fondamenta Zattere
  { lon: 12.3215, lat: 45.4335, h: 122, r: 160 }, // Carmini / San Pantalon
  { lon: 12.3185, lat: 45.4375, h: 124, r: 170 }, // Piazzale Roma / Tolentini
  { lon: 12.3210, lat: 45.4415, h: 128, r: 180 }, // Stazione Santa Lucia / Scalzi
  { lon: 12.3525, lat: 45.4325, h: 124, r: 180 }, // Castello Garibaldi / Giardini
  { lon: 12.3500, lat: 45.4370, h: 126, r: 180 }, // Arsenale / Celestia
  { lon: 12.3660, lat: 45.4280, h: 145, r: 250 }, // Sant'Elena
  // Laguna Nord & Isole
  { lon: 12.3515, lat: 45.4545, h: 105, r: 220 }, // Murano Vetrai & Colonna
  { lon: 12.3570, lat: 45.4575, h: 118, r: 200 }, // Murano San Donato
  { lon: 12.4175, lat: 45.4855, h: 100, r: 220 }, // Burano Piazza Galuppi
  { lon: 12.4110, lat: 45.4865, h: 112, r: 200 }, // Mazzorbo
  { lon: 12.4180, lat: 45.4985, h: 115, r: 200 }, // Torcello
  { lon: 12.4080, lat: 45.4550, h: 120, r: 260 }, // Sant'Erasmo
  // Laguna Sud & Litorali
  { lon: 12.3385, lat: 45.3715, h: 100, r: 200 }, // Lido Malamocco Borgo Antico
  { lon: 12.3025, lat: 45.2980, h: 105, r: 220 }, // Pellestrina San Pietro in Volta
  { lon: 12.3010, lat: 45.2680, h: 110, r: 220 }, // Pellestrina Borgo & Portosecco
  { lon: 12.2798, lat: 45.2215, h: 90, r: 200 },  // Chioggia Piazzetta Vigo
  { lon: 12.2785, lat: 45.2185, h: 95, r: 220 },  // Chioggia Riva Vena
  { lon: 12.2778, lat: 45.2160, h: 115, r: 220 }, // Chioggia Corso del Popolo
  { lon: 12.2885, lat: 45.2140, h: 125, r: 240 }, // Sottomarina Murazzi
];

const GRID_ANCHORS = FLOOD_ANCHORS.map((a) => ({
  gx: mx(a.lon),
  gy: my(a.lat),
  h: a.h,
  r: a.r,
}));

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

// Centro storico (con Giudecca), l'area a cui si riferisce la curva CPSM del suolo allagato
const [CS_X0, CS_Y0] = toGrid(12.300, 45.450);
const [CS_X1, CS_Y1] = toGrid(12.372, 45.423);
const isCentroStorico = (x: number, y: number) => x >= CS_X0 && x <= CS_X1 && y >= CS_Y0 && y <= CS_Y1;

/** Quota (cm) a cui la curva CPSM raggiunge la percentuale indicata di suolo allagato. */
function levelForFloodedPercent(pct: number): number {
  let lo = 80;
  let hi = 170;
  if (pct <= getFloodedGroundPercentage(lo)) return lo;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (getFloodedGroundPercentage(mid) < pct) lo = mid;
    else hi = mid;
  }
  return hi;
}

/**
 * Nel centro storico sostituisce le quote stimate con quelle che riproducono la curva ufficiale CPSM:
 * le calli restano nell'ordine dato dagli anchor, e la quota di lunghezza allagata a ciascun livello
 * coincide con la percentuale di suolo allagato pubblicata (stima indicativa, non un rilievo altimetrico).
 */
export function calibrateToOfficialCurve(
  elevations: Int16Array,
  rawHeights: Float32Array,
  inArea: Uint8Array,
  flags: Uint8Array,
  edges: number[]
): void {
  const ids: number[] = [];
  let total = 0;
  for (let e = 0; e < elevations.length; e++) {
    if (flags[e] !== 0 || !inArea[e]) continue;
    ids.push(e);
    total += Math.max(1, edges[4 * e + 2]);
  }
  if (ids.length === 0 || total === 0) return;
  ids.sort((a, b) => rawHeights[a] - rawHeights[b] || a - b);
  let cum = 0;
  for (const e of ids) {
    const len = Math.max(1, edges[4 * e + 2]);
    elevations[e] = Math.ceil(levelForFloodedPercent(((cum + len / 2) / total) * 100) - 1e-6);
    cum += len;
  }
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
  const elevations = new Int16Array(m);
  const rawHeights = new Float32Array(m);
  const inCentroStorico = new Uint8Array(m);

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

    // Attribuzione altimetrica per la simulazione dell'acqua alta
    if (flags[e] === 1) {
      // I ponti sono sempre rialzati e rimangono all'asciutto
      elevations[e] = 220;
    } else {
      const ex = (nodeX[u] + nodeX[v]) * 0.5;
      const ey = (nodeY[u] + nodeY[v]) * 0.5;

      let totalW = 0.001;
      let weightedH = 138 * 0.001;

      for (let k = 0; k < GRID_ANCHORS.length; k++) {
        const z = GRID_ANCHORS[k];
        const dx = ex - z.gx;
        const dy = ey - z.gy;
        const dist = Math.hypot(dx, dy);
        if (dist < z.r * 2.2) {
          const dNorm = dist / z.r;
          const w = 1 / (1 + dNorm * dNorm * dNorm);
          weightedH += z.h * w;
          totalW += w;
        }
      }

      elevations[e] = Math.round(weightedH / totalW);
      rawHeights[e] = weightedH / totalW;
      inCentroStorico[e] = isCentroStorico(ex, ey) ? 1 : 0;
    }
  }
  offsets[m] = ptr;

  calibrateToOfficialCurve(elevations, rawHeights, inCentroStorico, flags, data.edges);

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
