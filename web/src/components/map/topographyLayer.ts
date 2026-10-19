/**
 * Reticolo tecnico di crocini ('+') in metri sulla griglia lagunare e quota STIMATA del piano di calpestio
 * (cm sullo ZMPS) da pochi punti noti interpolati per distanza, come in lib/streetElevation.ts: non esiste un
 * rilievo altimetrico aperto delle pavimentazioni. Le curve di livello restano disattivate sulla mappa perché
 * darebbero un'idea di precisione che il dato non ha.
 */
import { toGrid } from '@/lib/positionDelay';
import type { ColorScheme } from '@/lib/solar';
import { polygonBoxes, visiblePolygons, type LandPolygons } from './baseMap';

interface GridAnchor {
  gx: number;
  gy: number;
  h: number;
  r: number;
}

const RAW_ANCHORS = [
  { lon: 12.3385, lat: 45.4338, h: 78, r: 135 }, // San Marco Piazzetta (punto piu basso)
  { lon: 12.3370, lat: 45.4344, h: 84, r: 185 }, // San Marco Piazza
  { lon: 12.3392, lat: 45.4352, h: 87, r: 150 }, // Piazzetta Leoncini / Spadaria
  { lon: 12.3360, lat: 45.4382, h: 95, r: 145 }, // Rialto Erbaria
  { lon: 12.3368, lat: 45.4377, h: 102, r: 150 }, // Campo San Bartolomeo
  { lon: 12.3365, lat: 45.4312, h: 98, r: 160 }, // Dogana & Salute
  { lon: 12.3425, lat: 45.4345, h: 99, r: 170 }, // San Zaccaria / Schiavoni
  { lon: 12.3255, lat: 45.4445, h: 105, r: 175 }, // Cannaregio Guglie
  { lon: 12.3325, lat: 45.4455, h: 108, r: 180 }, // Misericordia / Ormesini
  { lon: 12.3280, lat: 45.4485, h: 120, r: 180 }, // Sant'Alvise
  { lon: 12.3395, lat: 45.4448, h: 128, r: 180 }, // Fondamente Nove
  { lon: 12.3265, lat: 45.4262, h: 108, r: 200 }, // Giudecca Palanca
  { lon: 12.3420, lat: 45.4260, h: 124, r: 210 }, // Giudecca Zitelle
  { lon: 12.3200, lat: 45.4280, h: 122, r: 190 }, // Giudecca Molino Stucky
  { lon: 12.3300, lat: 45.4372, h: 110, r: 175 }, // Campo San Polo
  { lon: 12.3275, lat: 45.4412, h: 118, r: 175 }, // San Giacomo dell'Orio
  { lon: 12.3235, lat: 45.4338, h: 114, r: 180 }, // Campo Santa Margherita
  { lon: 12.3280, lat: 45.4295, h: 108, r: 170 }, // Fondamenta Zattere
  { lon: 12.3215, lat: 45.4335, h: 122, r: 170 }, // Carmini / San Pantalon
  { lon: 12.3185, lat: 45.4375, h: 124, r: 180 }, // Piazzale Roma / Tolentini
  { lon: 12.3210, lat: 45.4415, h: 128, r: 190 }, // Stazione Santa Lucia / Scalzi
  { lon: 12.3525, lat: 45.4325, h: 124, r: 190 }, // Castello Garibaldi / Giardini
  { lon: 12.3500, lat: 45.4370, h: 126, r: 190 }, // Arsenale / Celestia
  { lon: 12.3660, lat: 45.4280, h: 145, r: 260 }, // Sant'Elena
  { lon: 12.3515, lat: 45.4545, h: 105, r: 230 }, // Murano Vetrai
  { lon: 12.3570, lat: 45.4575, h: 118, r: 210 }, // Murano San Donato
];

const ANCHORS: GridAnchor[] = RAW_ANCHORS.map((a) => {
  const [gx, gy] = toGrid(a.lon, a.lat);
  return { gx, gy, h: a.h, r: a.r };
});

/**
 * Stima continua della quota altimetrica del suolo (in cm sullo ZMPS) nel punto (gx, gy)
 * della griglia virtuale. Usata per le isolinee topografiche e per l'ispezione puntuale.
 */
export function groundElevationCmAt(gx: number, gy: number): number {
  let totalW = 0.0015;
  let weightedH = 136 * 0.0015;
  for (let i = 0; i < ANCHORS.length; i++) {
    const z = ANCHORS[i];
    const dx = gx - z.gx;
    const dy = gy - z.gy;
    const distSq = dx * dx + dy * dy;
    const maxR = z.r * 2.5;
    if (distSq < maxR * maxR) {
      const dNorm = Math.sqrt(distSq) / z.r;
      const w = 1 / (1 + dNorm * dNorm * dNorm);
      weightedH += z.h * w;
      totalW += w;
    }
  }
  return Math.round(weightedH / totalW);
}

// Bounding box del Centro Storico + Giudecca + Murano su cui calcolare il campo per Marching Squares
const [FIELD_X0, FIELD_Y0] = toGrid(12.302, 45.462);
const [FIELD_X1, FIELD_Y1] = toGrid(12.372, 45.422);
const COLS = 92;
const ROWS = 68;

let cachedField: Float32Array | null = null;
const contourCache = new Map<number, Float32Array>();

function ensureElevationField(): Float32Array {
  if (cachedField) return cachedField;
  const field = new Float32Array((COLS + 1) * (ROWS + 1));
  const dx = (FIELD_X1 - FIELD_X0) / COLS;
  const dy = (FIELD_Y1 - FIELD_Y0) / ROWS;
  for (let r = 0; r <= ROWS; r++) {
    const gy = FIELD_Y0 + r * dy;
    for (let c = 0; c <= COLS; c++) {
      const gx = FIELD_X0 + c * dx;
      field[r * (COLS + 1) + c] = groundElevationCmAt(gx, gy);
    }
  }
  cachedField = field;
  return field;
}

/**
 * Estrae i segmenti dell'isolinea per la quota `isoCm` con Marching Squares.
 * Restituisce un Float32Array di coordinate [x1, y1, x2, y2, ...] in unità griglia.
 */
function getContourSegments(isoCm: number): Float32Array {
  const key = Math.round(isoCm);
  const hit = contourCache.get(key);
  if (hit) return hit;

  const field = ensureElevationField();
  const dx = (FIELD_X1 - FIELD_X0) / COLS;
  const dy = (FIELD_Y1 - FIELD_Y0) / ROWS;
  const segs: number[] = [];

  const interp = (v0: number, v1: number) => {
    const denom = v1 - v0;
    if (Math.abs(denom) < 1e-5) return 0.5;
    return Math.max(0, Math.min(1, (key - v0) / denom));
  };

  for (let r = 0; r < ROWS; r++) {
    const y0 = FIELD_Y0 + r * dy;
    const y1 = y0 + dy;
    for (let c = 0; c < COLS; c++) {
      const x0 = FIELD_X0 + c * dx;
      const x1 = x0 + dx;

      const v00 = field[r * (COLS + 1) + c];
      const v10 = field[r * (COLS + 1) + c + 1];
      const v11 = field[(r + 1) * (COLS + 1) + c + 1];
      const v01 = field[(r + 1) * (COLS + 1) + c];

      const mask =
        (v00 >= key ? 1 : 0) |
        (v10 >= key ? 2 : 0) |
        (v11 >= key ? 4 : 0) |
        (v01 >= key ? 8 : 0);

      if (mask === 0 || mask === 15) continue;

      // 4 lati della cella: top (0), right (1), bottom (2), left (3)
      const pt = (edge: number): [number, number] => {
        switch (edge) {
          case 0:
            return [x0 + interp(v00, v10) * dx, y0];
          case 1:
            return [x1, y0 + interp(v10, v11) * dy];
          case 2:
            return [x0 + interp(v01, v11) * dx, y1];
          default:
            return [x0, y0 + interp(v00, v01) * dy];
        }
      };

      const addSeg = (eA: number, eB: number) => {
        const [ax, ay] = pt(eA);
        const [bx, by] = pt(eB);
        segs.push(ax, ay, bx, by);
      };

      switch (mask) {
        case 1:
        case 14:
          addSeg(3, 0);
          break;
        case 2:
        case 13:
          addSeg(0, 1);
          break;
        case 3:
        case 12:
          addSeg(3, 1);
          break;
        case 4:
        case 11:
          addSeg(1, 2);
          break;
        case 5:
          addSeg(3, 2);
          addSeg(0, 1);
          break;
        case 6:
        case 9:
          addSeg(0, 2);
          break;
        case 7:
        case 8:
          addSeg(3, 2);
          break;
        case 10:
          addSeg(3, 0);
          addSeg(1, 2);
          break;
      }
    }
  }

  const out = new Float32Array(segs);
  contourCache.set(key, out);
  return out;
}

export interface TopographyOverlayOptions {
  cw: number;
  ch: number;
  camera: { x0: number; y0: number; s: number };
  pal: ColorScheme;
  is3DView: boolean;
  tideLevelCm: number;
  showContours: boolean;
  landPolys?: LandPolygons;
}

const CONTOUR_LEVELS_CM = [85, 95, 105, 110, 120, 130];

/**
 * Disegna il reticolo tecnico di crocini '+' e, se richieste, le curve di livello della quota stimata.
 */
export function drawTopographyOverlay(
  ctx: CanvasRenderingContext2D,
  o: TopographyOverlayOptions,
): void {
  const { cw, ch, camera, pal, is3DView, tideLevelCm, showContours, landPolys } = o;
  if (!is3DView && !showContours && camera.s < 0.35) return;

  const isDark =
    pal.coast === '#3a4850' ||
    pal.land === '#1a2227' ||
    pal.ground.startsWith('#0') ||
    pal.ground.startsWith('#1');

  const sx = (x: number) => (x - camera.x0) * camera.s;
  const sy = (y: number) => (y - camera.y0) * camera.s;

  ctx.save();

  // 1. Reticolo tecnico di crocini '+'
  // Spaziatura adattiva in metri reali sulla griglia virtuale (1 unità ≈ 1 m)
  const stepM =
    camera.s >= 2.2
      ? 60
      : camera.s >= 0.9
        ? 125
        : camera.s >= 0.35
          ? 250
          : 500;

  const vx0 = camera.x0;
  const vy0 = camera.y0;
  const vx1 = camera.x0 + cw / camera.s;
  const vy1 = camera.y0 + ch / camera.s;

  const startX = Math.floor(vx0 / stepM) * stepM;
  const startY = Math.floor(vy0 / stepM) * stepM;

  const crossArm = is3DView ? 3.5 : 2.8;
  ctx.strokeStyle = isDark
    ? is3DView
      ? 'rgba(56, 189, 248, 0.28)'
      : 'rgba(148, 163, 184, 0.18)'
    : is3DView
      ? 'rgba(2, 132, 199, 0.26)'
      : 'rgba(71, 85, 105, 0.18)';
  ctx.lineWidth = 1;

  ctx.beginPath();
  for (let gx = startX; gx <= vx1; gx += stepM) {
    const px = sx(gx);
    if (px < -10 || px > cw + 10) continue;
    for (let gy = startY; gy <= vy1; gy += stepM) {
      const py = sy(gy);
      if (py < -10 || py > ch + 10) continue;
      ctx.moveTo(px - crossArm, py);
      ctx.lineTo(px + crossArm, py);
      ctx.moveTo(px, py - crossArm);
      ctx.lineTo(px, py + crossArm);
    }
  }
  ctx.stroke();

  // A zoom ravvicinato o in 3D, mostra micro-quote altimetriche (+cm ZMPS) sui crocini del centro storico
  if ((camera.s >= 1.15 || (is3DView && camera.s >= 0.55)) && showContours) {
    ctx.font = '600 8.5px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    for (let gx = startX; gx <= vx1; gx += stepM * 2) {
      if (gx < FIELD_X0 || gx > FIELD_X1) continue;
      const px = sx(gx);
      for (let gy = startY; gy <= vy1; gy += stepM * 2) {
        if (gy < FIELD_Y0 || gy > FIELD_Y1) continue;
        const py = sy(gy);
        const hCm = groundElevationCmAt(gx, gy);
        if (hCm >= 134) continue;
        const flooded = tideLevelCm >= hCm;
        ctx.fillStyle = flooded
          ? isDark
            ? 'rgba(56, 189, 248, 0.78)'
            : 'rgba(2, 132, 199, 0.82)'
          : isDark
            ? 'rgba(148, 163, 184, 0.52)'
            : 'rgba(71, 85, 105, 0.58)';
        ctx.fillText(`+${hCm}cm`, px + 4, py - 2);
      }
    }
  }

  // 2. Curve di livello altimetriche reali (Contour Lines) ritagliate sulle isole se disponibili
  if (showContours || is3DView) {
    if (landPolys && landPolys.length > 0) {
      const vis = visiblePolygons(polygonBoxes(landPolys), {
        x0: vx0 - 20,
        y0: vy0 - 20,
        x1: vx1 + 20,
        y1: vy1 + 20,
      });
      if (vis.length > 0) {
        ctx.beginPath();
        for (const p of vis) {
          for (const ring of landPolys[p]) {
            if (ring.length < 4) continue;
            ctx.moveTo(sx(ring[0]), sy(ring[1]));
            for (let k = 2; k < ring.length; k += 2) {
              ctx.lineTo(sx(ring[k]), sy(ring[k + 1]));
            }
            ctx.closePath();
          }
        }
        ctx.clip();
      }
    }

    for (const levelCm of CONTOUR_LEVELS_CM) {
      const segs = getContourSegments(levelCm);
      if (segs.length === 0) continue;

      const isMoseThreshold = levelCm === 110;
      const isSubmerged = tideLevelCm >= levelCm;

      ctx.beginPath();
      for (let i = 0; i < segs.length; i += 4) {
        const ax = segs[i];
        const ay = segs[i + 1];
        const bx = segs[i + 2];
        const by = segs[i + 3];
        if (
          (ax < vx0 && bx < vx0) ||
          (ax > vx1 && bx > vx1) ||
          (ay < vy0 && by < vy0) ||
          (ay > vy1 && by > vy1)
        ) {
          continue;
        }
        ctx.moveTo(sx(ax), sy(ay));
        ctx.lineTo(sx(bx), sy(by));
      }

      if (isMoseThreshold) {
        // Linea maestra (+110 cm ZMPS = soglia attivazione MOSE)
        ctx.strokeStyle = isDark ? 'rgba(251, 191, 36, 0.55)' : 'rgba(217, 119, 6, 0.55)';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([]);
      } else if (isSubmerged) {
        ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.50)' : 'rgba(2, 132, 199, 0.48)';
        ctx.lineWidth = 1.1;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.26)' : 'rgba(71, 85, 105, 0.24)';
        ctx.lineWidth = 0.85;
        ctx.setLineDash([4, 3]);
      }
      ctx.stroke();
    }

    // 3. Isolinea dinamica della battigia d'acqua alta
    if (tideLevelCm >= 80 && tideLevelCm <= 160) {
      const shoreSegs = getContourSegments(tideLevelCm);
      if (shoreSegs.length > 0) {
        ctx.setLineDash([]);
        ctx.beginPath();
        for (let i = 0; i < shoreSegs.length; i += 4) {
          const ax = shoreSegs[i];
          const ay = shoreSegs[i + 1];
          const bx = shoreSegs[i + 2];
          const by = shoreSegs[i + 3];
          if (
            (ax < vx0 && bx < vx0) ||
            (ax > vx1 && bx > vx1) ||
            (ay < vy0 && by < vy0) ||
            (ay > vy1 && by > vy1)
          ) {
            continue;
          }
          ctx.moveTo(sx(ax), sy(ay));
          ctx.lineTo(sx(bx), sy(by));
        }
        ctx.strokeStyle = isDark ? 'rgba(34, 211, 238, 0.92)' : 'rgba(8, 145, 178, 0.90)';
        ctx.lineWidth = 2.0;
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}
