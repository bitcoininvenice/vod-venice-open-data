import type { RenderContext } from './renderContext';
import { OPEN_PUBLIC_LIGHTING, getPublicLightingStatus, type PublicLightingPoint } from '@/lib/publicLighting';

/** Alone dei lampioni: raggio a terra indicativo (m) e colore caldo, uguali per tutti (potenze non note) */
const GLOW_M = 14;
const GLOW_RGB = '255, 196, 120';

/**
 * Lampioni mappati su OpenStreetMap: di notte un alone caldo (accensione stimata dal sole), di giorno con lo zoom
 * un punto discreto. Nessuna fotometria inventata: stesso alone per tutti.
 */
export function drawPublicLighting(rc: RenderContext): void {
  const { ctx, camera, cw, ch, sx, sy, mx, my, currentTimeSeconds, showPublicLighting, publicLighting } = rc;
  if (!showPublicLighting) return;
  const points = publicLighting && publicLighting.length > 0 ? publicLighting : OPEN_PUBLIC_LIGHTING;
  if (points.length === 0) return;
  const { intensityFactor: intensity } = getPublicLightingStatus(currentTimeSeconds);
  if (intensity <= 0.005 && camera.s < 0.2) return;

  const margin = 40;
  const radius = Math.max(2.5, GLOW_M * camera.s);
  ctx.save();
  if (intensity > 0.005) ctx.globalCompositeOperation = 'lighter';
  for (const p of points) {
    const x = sx(mx(p.lon));
    const y = sy(my(p.lat));
    if (x < -margin || x > cw + margin || y < -margin || y > ch + margin) continue;
    if (intensity > 0.005) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, `rgba(${GLOW_RGB}, ${0.75 * intensity})`);
      g.addColorStop(1, `rgba(${GLOW_RGB}, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#b45309';
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Lampione sotto il clic (per aprire la scheda) */
export function hitTestPublicLighting(
  points: PublicLightingPoint[],
  clickX: number,
  clickY: number,
  screenFn: (lon: number, lat: number) => readonly [number, number],
  hitDistancePx = 16,
): PublicLightingPoint | null {
  let best: { dist: number; point: PublicLightingPoint } | null = null;
  for (const p of points) {
    const [px, py] = screenFn(p.lon, p.lat);
    const d = Math.hypot(clickX - px, clickY - py);
    if (d <= hitDistancePx && (!best || d < best.dist)) best = { dist: d, point: p };
  }
  return best ? best.point : null;
}
