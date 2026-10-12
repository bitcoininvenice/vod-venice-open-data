import type { WindField } from '@/lib/types';
import type { RenderContext } from './renderContext';
import { prefersReducedMotion } from './mapHelpers';

/**
 * Vento animato in stile Windy: un campo colorato per intensità e particelle che seguono le linee
 * di flusso, con una scia che sfuma. I dati sono la previsione Open-Meteo su griglia (/api/wind-field).
 */

/** Scala colori per velocità del vento (m/s), simile a quella delle mappe meteo. */
export const WIND_COLOR_STOPS: Array<[number, [number, number, number]]> = [
  [0, [98, 113, 183]],
  [3, [57, 97, 159]],
  [5, [74, 148, 169]],
  [7, [77, 141, 123]],
  [9, [83, 165, 83]],
  [11, [53, 159, 53]],
  [13, [167, 157, 81]],
  [15, [159, 127, 58]],
  [17, [161, 108, 92]],
  [20, [129, 58, 78]],
  [25, [175, 80, 136]],
  [30, [117, 74, 147]],
];

export function windColor(speedMs: number): [number, number, number] {
  const stops = WIND_COLOR_STOPS;
  if (speedMs <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [s1, c1] = stops[i];
    if (speedMs <= s1) {
      const [s0, c0] = stops[i - 1];
      const f = (speedMs - s0) / (s1 - s0);
      return [0, 1, 2].map((k) => Math.round(c0[k] + f * (c1[k] - c0[k]))) as [number, number, number];
    }
  }
  return stops[stops.length - 1][1];
}

/** Interpolazione bilineare del vento (u, v in m/s) in un punto; null fuori dalla griglia. */
export function sampleWind(field: WindField, lon: number, lat: number): [number, number] | null {
  const fi = (lon - field.lon0) / field.dLon;
  const fj = (lat - field.lat0) / field.dLat;
  if (fi < 0 || fj < 0 || fi > field.nx - 1 || fj > field.ny - 1) return null;
  const i0 = Math.min(Math.floor(fi), field.nx - 2);
  const j0 = Math.min(Math.floor(fj), field.ny - 2);
  const ti = fi - i0;
  const tj = fj - j0;
  const at = (arr: number[], i: number, j: number) => arr[j * field.nx + i];
  const lerp2 = (arr: number[]) =>
    (at(arr, i0, j0) * (1 - ti) + at(arr, i0 + 1, j0) * ti) * (1 - tj) +
    (at(arr, i0, j0 + 1) * (1 - ti) + at(arr, i0 + 1, j0 + 1) * ti) * tj;
  return [lerp2(field.u), lerp2(field.v)];
}

const TRAIL = 8;
/** Pixel percorsi per frame (a 60 fps) per ogni m/s di vento */
const PX_PER_MS = 0.2;

interface Particle {
  xs: Float32Array;
  ys: Float32Array;
  len: number;
  age: number;
  maxAge: number;
}

const state: {
  field: WindField | null;
  particles: Particle[];
  colorCanvas: HTMLCanvasElement | null;
  lastFrame: number;
} = { field: null, particles: [], colorCanvas: null, lastFrame: 0 };


function buildColorCanvas(field: WindField): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = field.nx;
  c.height = field.ny;
  const g = c.getContext('2d')!;
  const img = g.createImageData(field.nx, field.ny);
  for (let j = 0; j < field.ny; j++) {
    for (let i = 0; i < field.nx; i++) {
      const k = j * field.nx + i;
      const [r, gg, b] = windColor(Math.hypot(field.u[k], field.v[k]));
      // Le righe del campo vanno da sud a nord, quelle dell'immagine dall'alto in basso
      const p = ((field.ny - 1 - j) * field.nx + i) * 4;
      img.data[p] = r;
      img.data[p + 1] = gg;
      img.data[p + 2] = b;
      img.data[p + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

export function drawWindFlow(rc: RenderContext): void {
  const { ctx, cw, ch, isDark, mx, my, camera, sx, sy, showMarineWind, windField } = rc;
  if (!showMarineWind || !windField) {
    state.particles = [];
    return;
  }
  if (state.field !== windField) {
    state.field = windField;
    state.colorCanvas = buildColorCanvas(windField);
    state.particles = [];
  }

  // 1. Campo colorato: la griglia (un pixel per punto) viene ingrandita con interpolazione
  const left = sx(mx(windField.lon0 - windField.dLon / 2));
  const right = sx(mx(windField.lon0 + (windField.nx - 0.5) * windField.dLon));
  const top = sy(my(windField.lat0 + (windField.ny - 0.5) * windField.dLat));
  const bottom = sy(my(windField.lat0 - windField.dLat / 2));
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.globalAlpha = isDark ? 0.42 : 0.32;
  if (state.colorCanvas) ctx.drawImage(state.colorCanvas, left, top, right - left, bottom - top);
  ctx.restore();

  if (prefersReducedMotion()) return;

  // Conversioni coordinate di griglia <-> lon/lat (proiezione lineare della mappa)
  const kx = mx(1) - mx(0);
  const ky = my(1) - my(0);
  const lonAt = (x: number) => (x - mx(0)) / kx;
  const latAt = (y: number) => (y - my(0)) / ky;

  // Area visibile in coordinate di griglia, limitata alla copertura del campo
  const vx0 = Math.max(camera.x0, mx(windField.lon0));
  const vx1 = Math.min(camera.x0 + cw / camera.s, mx(windField.lon0 + (windField.nx - 1) * windField.dLon));
  const vy0 = Math.max(camera.y0, my(windField.lat0 + (windField.ny - 1) * windField.dLat));
  const vy1 = Math.min(camera.y0 + ch / camera.s, my(windField.lat0));
  if (vx1 <= vx0 || vy1 <= vy0) return;

  const now = performance.now();
  const dt = state.lastFrame ? Math.min(3, (now - state.lastFrame) / 16.7) : 1;
  state.lastFrame = now;

  const target = Math.min(2200, Math.max(300, Math.round((cw * ch) / 650)));
  const spawn = (p: Particle) => {
    p.xs[0] = vx0 + Math.random() * (vx1 - vx0);
    p.ys[0] = vy0 + Math.random() * (vy1 - vy0);
    p.len = 1;
    p.age = 0;
    p.maxAge = 40 + Math.random() * 60;
  };
  while (state.particles.length < target) {
    const p: Particle = { xs: new Float32Array(TRAIL), ys: new Float32Array(TRAIL), len: 1, age: 0, maxAge: 0 };
    spawn(p);
    p.age = Math.random() * p.maxAge; // età sfalsate: niente "ondate" sincronizzate
    state.particles.push(p);
  }
  if (state.particles.length > target) state.particles.length = target;

  // 2. Avanzamento: spostamento in pixel proporzionale alla velocità, indipendente dallo zoom
  const step = (PX_PER_MS * dt) / camera.s;
  for (const p of state.particles) {
    p.age += dt;
    const x = p.xs[0];
    const y = p.ys[0];
    const w = sampleWind(windField, lonAt(x), latAt(y));
    if (!w || p.age > p.maxAge || x < vx0 || x > vx1 || y < vy0 || y > vy1) {
      spawn(p);
      continue;
    }
    for (let k = Math.min(p.len, TRAIL - 1); k > 0; k--) {
      p.xs[k] = p.xs[k - 1];
      p.ys[k] = p.ys[k - 1];
    }
    p.xs[0] = x + w[0] * step;
    p.ys[0] = y - w[1] * step; // v verso nord = y di griglia decrescente
    p.len = Math.min(p.len + 1, TRAIL);
  }

  // 3. Scie: un tratto per "età" del segmento, più trasparente verso la coda
  ctx.save();
  ctx.lineWidth = 1.1;
  ctx.lineCap = 'round';
  const rgb = isDark ? '255, 255, 255' : '15, 23, 42';
  for (let k = 1; k < TRAIL; k++) {
    ctx.beginPath();
    for (const p of state.particles) {
      if (p.len <= k) continue;
      ctx.moveTo(sx(p.xs[k - 1]), sy(p.ys[k - 1]));
      ctx.lineTo(sx(p.xs[k]), sy(p.ys[k]));
    }
    ctx.strokeStyle = `rgba(${rgb}, ${(0.85 * (1 - (k - 1) / (TRAIL - 1))).toFixed(2)})`;
    ctx.stroke();
  }
  ctx.restore();
}
