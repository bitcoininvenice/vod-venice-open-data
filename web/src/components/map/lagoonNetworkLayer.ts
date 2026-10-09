import { MARKER_COLORS, type MarkerKind } from '@/lib/lagoonNetwork';
import type { RenderContext } from './renderContext';

/** Canali e rii (linee) e briccole/segnalamenti (punti) da OpenStreetMap. */
export function drawLagoonNetwork(rc: RenderContext): void {
  const { ctx, cw, ch, isDark, sx, sy, mx, my, camera, showCanals, showMarineSignals, lagoonNetwork } = rc;
  if (!lagoonNetwork) return;

  if (showCanals) {
    ctx.save();
    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.75)' : 'rgba(2, 132, 199, 0.7)';
    ctx.lineWidth = camera.s > 0.04 ? 2 : 1.2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (const c of lagoonNetwork.canals) {
      c.coords.forEach(([lon, lat], i) => {
        const x = sx(mx(lon));
        const y = sy(my(lat));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
    }
    ctx.stroke();

    // Nomi dei canali da vicino, a metà del tracciato
    if (camera.s > 0.05) {
      ctx.font = 'italic 600 9px "DM Sans", sans-serif';
      ctx.fillStyle = isDark ? '#7dd3fc' : '#075985';
      for (const c of lagoonNetwork.canals) {
        if (!c.name || c.coords.length < 2) continue;
        const [lon, lat] = c.coords[Math.floor(c.coords.length / 2)];
        const x = sx(mx(lon));
        const y = sy(my(lat));
        if (x < 0 || x > cw || y < 0 || y > ch) continue;
        ctx.fillText(c.name, x + 4, y - 4);
      }
    }
    ctx.restore();
  }

  if (showMarineSignals) {
    // Punti raggruppati per tipo; da lontano piccoli quadrati, da vicino cerchi
    const r = camera.s > 0.06 ? 3 : camera.s > 0.03 ? 2 : 1.2;
    const paths = new Map<MarkerKind, Path2D>();
    for (const [lon, lat, kind] of lagoonNetwork.markers) {
      const x = sx(mx(lon));
      const y = sy(my(lat));
      if (x < -4 || x > cw + 4 || y < -4 || y > ch + 4) continue;
      let p = paths.get(kind);
      if (!p) paths.set(kind, (p = new Path2D()));
      p.moveTo(x + r, y);
      p.arc(x, y, r, 0, Math.PI * 2);
    }
    ctx.save();
    for (const [kind, p] of paths) {
      ctx.fillStyle = MARKER_COLORS[kind];
      ctx.fill(p);
    }
    ctx.restore();
  }
}
