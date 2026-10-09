import { FIBER_COLORS, fiberCellBounds, type FiberClass } from '@/lib/fiber';
import type { RenderContext } from './renderContext';

/** Copertura della rete fissa (AGCOM): celle di ~100 m colorate per tecnologia migliore. */
export function drawFiber(rc: RenderContext): void {
  const { ctx, cw, ch, isDark, sx, sy, mx, my, showFiber, fiberData } = rc;
  if (!showFiber || !fiberData) return;

  const paths: Record<FiberClass, Path2D> = { 1: new Path2D(), 2: new Path2D(), 3: new Path2D() };
  for (const [i, j, cls] of fiberData.cells) {
    const b = fiberCellBounds(fiberData, i, j);
    const x0 = sx(mx(b.lon0));
    const x1 = sx(mx(b.lon1));
    const y0 = sy(my(b.lat1));
    const y1 = sy(my(b.lat0));
    if (x1 < 0 || x0 > cw || y1 < 0 || y0 > ch) continue;
    // almeno un pixel, così a zoom basso la copertura resta visibile
    paths[cls].rect(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0));
  }

  ctx.save();
  ctx.globalAlpha = isDark ? 0.42 : 0.34;
  for (const cls of [1, 2, 3] as FiberClass[]) {
    ctx.fillStyle = FIBER_COLORS[cls];
    ctx.fill(paths[cls]);
  }
  ctx.restore();
}
