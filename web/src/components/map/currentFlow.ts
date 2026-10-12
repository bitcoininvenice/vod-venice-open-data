// Correnti di marea come flusso di particelle che scorrono lungo l'asse reale dei canali (OpenStreetMap):
// restano nello specchio d'acqua, senza frecce, con verso e velocità dalla fase stimata.
import type { RenderContext } from './renderContext';
import type { LagoonCurrentChannel } from '@/lib/lagoonCurrents';
import { computeLagoonCurrentState } from '@/lib/lagoonCurrents';
import { dateAtRomeSeconds } from '@/lib/time';
import { prefersReducedMotion } from './mapHelpers';

/** Asse di un canale nella griglia della mappa (1 unità ≈ 1 m), con le lunghezze cumulate. */
export interface FlowPath {
  xs: Float32Array;
  ys: Float32Array;
  cum: Float32Array;
  length: number;
  /** semi-larghezza utile per distribuire le particelle (unità della griglia) */
  half: number;
}

export function buildFlowPath(coords: [number, number][], widthMeters: number, toGrid: (lon: number, lat: number) => [number, number]): FlowPath {
  const n = coords.length;
  const xs = new Float32Array(n);
  const ys = new Float32Array(n);
  const cum = new Float32Array(n);
  coords.forEach(([lon, lat], i) => {
    [xs[i], ys[i]] = toGrid(lon, lat);
    if (i > 0) cum[i] = cum[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
  });
  return { xs, ys, cum, length: cum[n - 1], half: widthMeters / 2 };
}

/**
 * Punto a distanza s lungo l'asse, spostato lateralmente di off (−1…1) della semi-larghezza utile.
 * Lo spostamento è ridotto vicino alle curve, dove il bordo esterno potrebbe toccare la riva.
 */
export function flowPointAt(p: FlowPath, s: number, off: number): [number, number] {
  const n = p.cum.length;
  const t = Math.max(0, Math.min(p.length, s));
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (p.cum[mid] <= t) lo = mid;
    else hi = mid;
  }
  const seg = p.cum[hi] - p.cum[lo] || 1;
  const a = (t - p.cum[lo]) / seg;
  const dx = (p.xs[hi] - p.xs[lo]) / seg;
  const dy = (p.ys[hi] - p.ys[lo]) / seg;
  // vicino ai vertici lo spostamento laterale si riduce, così le scie non tagliano gli angoli
  const edge = Math.min(t - p.cum[lo], p.cum[hi] - t);
  const taper = Math.min(1, edge / Math.max(1, p.half));
  const o = off * p.half * (0.35 + 0.65 * taper);
  return [p.xs[lo] + (p.xs[hi] - p.xs[lo]) * a - dy * o, p.ys[lo] + (p.ys[hi] - p.ys[lo]) * a + dx * o];
}

interface Particle {
  s: number;
  off: number;
  age: number;
  life: number;
}

const paths = new WeakMap<LagoonCurrentChannel, FlowPath>();
const particles = new Map<string, Particle[]>();
let lastFrame = 0;

/** Velocità disegnata: unità della griglia al secondo per ogni m/s di corrente (accelerata per renderla visibile) */
const VISUAL_SPEED = 220;

function spawn(p: FlowPath, anywhere: boolean): Particle {
  return {
    s: anywhere ? Math.random() * p.length : 0,
    off: (Math.random() * 2 - 1) * 0.7,
    age: 0,
    life: 2.5 + Math.random() * 3,
  };
}

function particleCount(p: FlowPath): number {
  return Math.round(Math.max(14, Math.min(260, p.length * (0.02 + p.half / 20000))));
}

/** Disegna le correnti stimate come scie che scorrono lungo i canali. */
export function drawCurrentFlow(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, cw, ch, currentTimeSeconds, showLagoonCurrents, lagoonCurrents, tideInfo, t } = rc;
  if (!showLagoonCurrents || !lagoonCurrents || lagoonCurrents.length === 0) return;

  // Fase all'ora della timeline; senza previsione valida i canali restano fermi e grigi
  const state = computeLagoonCurrentState(tideInfo?.forecast, dateAtRomeSeconds(currentTimeSeconds).getTime());
  const slack = !state || state.flowDirection === 'SLACK';
  const dir = state?.flowDirection === 'OUTBOUND' ? -1 : 1;
  const rgb = !state || slack ? (isDark ? '148, 163, 184' : '100, 116, 139') : dir < 0 ? '45, 212, 191' : '56, 189, 248';

  const now = performance.now();
  const reduced = prefersReducedMotion();
  const dt = reduced || !state ? 0 : Math.min(0.1, (now - (lastFrame || now)) / 1000);
  lastFrame = now;

  const toGrid = (lon: number, lat: number): [number, number] => [mx(lon), my(lat)];
  // scia di lunghezza quasi costante sullo schermo, più lunga dove la corrente è più forte
  const trailPx = 8 + 18 * (state?.speedFactor ?? 0);
  const lineWidth = Math.max(1, Math.min(2.4, 0.9 + 30 * camera.s));
  const margin = 40;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const chan of lagoonCurrents) {
    let path = paths.get(chan);
    if (!path) {
      path = buildFlowPath(chan.coordinates, chan.widthMeters, toGrid);
      paths.set(chan, path);
    }

    // Velo d'acqua lungo l'asse: indica il canale anche quando la corrente è ferma
    ctx.beginPath();
    for (let i = 0; i < path.xs.length; i++) {
      const x = sx(path.xs[i]);
      const y = sy(path.ys[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(${rgb}, 0.10)`;
    ctx.lineWidth = Math.max(3, Math.min(path.half * 2 * camera.s, 40));
    ctx.stroke();

    let list = particles.get(chan.id);
    const n = particleCount(path);
    if (!list || list.length !== n) {
      list = Array.from({ length: n }, () => spawn(path!, true));
      particles.set(chan.id, list);
    }

    const speed = chan.maxSpeedMs * (state?.speedFactor ?? 0) * VISUAL_SPEED;
    const trail = Math.min(path.length / 3, trailPx / camera.s);
    ctx.lineWidth = lineWidth;

    for (const p of list) {
      p.s += dir * speed * dt;
      p.age += dt;
      if (p.age > p.life) Object.assign(p, spawn(path, true));
      // chi esce da un capo rientra dall'altro, nel verso della corrente
      else if (p.s < 0 || p.s > path.length) Object.assign(p, spawn(path, false), { s: dir > 0 ? 0 : path.length });

      const [hx, hy] = flowPointAt(path, p.s, p.off);
      const x = sx(hx);
      const y = sy(hy);
      if (x < -margin || y < -margin || x > cw + margin || y > ch + margin) continue;

      // dissolvenza all'inizio e alla fine della vita della particella e ai capi del canale
      const lifeFade = Math.sin(Math.PI * Math.min(1, p.age / p.life));
      const endFade = Math.min(1, p.s / (trail * 2 + 1), (path.length - p.s) / (trail * 2 + 1));
      const alpha = (slack ? 0.35 : 0.85) * (reduced || !state ? 0.6 : lifeFade) * Math.max(0, endFade);
      if (alpha < 0.03) continue;

      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 1; k <= 3; k++) {
        const [tx, ty] = flowPointAt(path, p.s - dir * (trail * k) / 3, p.off);
        ctx.lineTo(sx(tx), sy(ty));
      }
      ctx.strokeStyle = `rgba(${rgb}, ${alpha.toFixed(2)})`;
      ctx.stroke();
    }

    if (camera.s > 0.03) {
      const label = !state ? 'n.d.' : slack ? t('ui.lagoonHydro.slack') : `~${(chan.maxSpeedKnots * state.speedFactor).toFixed(1)} kn`;
      ctx.font = '600 9px "DM Mono", monospace';
      ctx.fillStyle = isDark ? 'rgba(226, 232, 240, 0.85)' : 'rgba(15, 23, 42, 0.85)';
      ctx.fillText(label, sx(mx(chan.lon)) + 8, sy(my(chan.lat)) - 6);
    }
  }
  ctx.restore();
}
