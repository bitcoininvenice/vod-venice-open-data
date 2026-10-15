/**
 * Quote stimate delle calli (cm sullo zero mareografico di Punta della Salute), condivise da mappa e planner.
 *
 * Non esiste un rilievo altimetrico delle pavimentazioni come open data: le quote vengono da punti noti
 * (anchor) interpolati per distanza, e nel centro storico sono calibrate sulla curva ufficiale CPSM del
 * suolo allagato. La quantità di calli allagate a ogni livello è quindi affidabile, quali calli lo sono
 * è approssimato. I ponti valgono sempre come asciutti.
 */
import { getFloodedGroundPercentage } from '@/lib/flood';
import { toGrid } from '@/lib/positionDelay';

/** Rete pedonale come pubblicata in public/data/walk-*.json */
export interface RawWalkGeometry {
  origin: [number, number];
  scale: number;
  nodes: number[];
  /** [a, b, lunghezza in dm, flag (1 = ponte)] alternati */
  edges: number[];
}

/** Quota assegnata ai ponti: sempre fuori dall'acqua */
export const BRIDGE_ELEVATION_CM = 220;
/** Terraferma e litorale del Cavallino: fuori dal modello dell'acqua alta della città, sempre asciutti */
export const MAINLAND_ELEVATION_CM = 400;

/** Zone della rete pedonale fuori dal modello dell'acqua alta: Mestre e Marghera, Tessera e aeroporto, Cavallino-Treporti */
const MAINLAND_BOXES: [number, number, number, number][] = [
  [12.13, 12.3, 45.43, 45.56],
  [12.29, 12.395, 45.475, 45.56],
  [12.43, 12.6, 45.42, 45.52],
];
export const isMainland = (lon: number, lat: number) => MAINLAND_BOXES.some(([x0, x1, y0, y1]) => lon >= x0 && lon <= x1 && lat >= y0 && lat <= y1);

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

const GRID_ANCHORS = FLOOD_ANCHORS.map((a) => {
  const [gx, gy] = toGrid(a.lon, a.lat);
  return { gx, gy, h: a.h, r: a.r };
});

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

/** Quota stimata di ogni arco della rete pedonale. */
export function edgeElevations(raw: RawWalkGeometry): Int16Array {
  const n = raw.nodes.length / 2;
  const m = raw.edges.length / 4;
  const [lon0, lat0] = raw.origin;
  const nodeX = new Float32Array(n);
  const nodeY = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    [nodeX[i], nodeY[i]] = toGrid(lon0 + raw.nodes[2 * i] / raw.scale, lat0 + raw.nodes[2 * i + 1] / raw.scale);
  }
  const elevations = new Int16Array(m);
  const rawHeights = new Float32Array(m);
  const inCentroStorico = new Uint8Array(m);
  const flags = new Uint8Array(m);
  for (let e = 0; e < m; e++) {
    const u = raw.edges[4 * e];
    const v = raw.edges[4 * e + 1];
    flags[e] = raw.edges[4 * e + 3];
    if (flags[e] === 1) {
      elevations[e] = BRIDGE_ELEVATION_CM;
      continue;
    }
    const midLon = lon0 + (raw.nodes[2 * u] + raw.nodes[2 * v]) / 2 / raw.scale;
    const midLat = lat0 + (raw.nodes[2 * u + 1] + raw.nodes[2 * v + 1]) / 2 / raw.scale;
    if (isMainland(midLon, midLat)) {
      elevations[e] = MAINLAND_ELEVATION_CM;
      rawHeights[e] = MAINLAND_ELEVATION_CM;
      continue;
    }
    const ex = (nodeX[u] + nodeX[v]) * 0.5;
    const ey = (nodeY[u] + nodeY[v]) * 0.5;
    let totalW = 0.001;
    let weightedH = 138 * 0.001;
    for (const z of GRID_ANCHORS) {
      const dist = Math.hypot(ex - z.gx, ey - z.gy);
      if (dist < z.r * 2.2) {
        const dNorm = dist / z.r;
        const w = 1 / (1 + dNorm * dNorm * dNorm);
        weightedH += z.h * w;
        totalW += w;
      }
    }
    rawHeights[e] = weightedH / totalW;
    elevations[e] = Math.round(rawHeights[e]);
    inCentroStorico[e] = isCentroStorico(ex, ey) ? 1 : 0;
  }
  calibrateToOfficialCurve(elevations, rawHeights, inCentroStorico, flags, raw.edges);
  return elevations;
}
