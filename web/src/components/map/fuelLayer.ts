import type { RenderContext } from './renderContext';
import { FUEL_NO_PRICE_COLOR, formatFuelPrice, fuelRankColor, rankFuelStations } from '@/lib/fuel';

/** Sopra questa scala si scrive il prezzo accanto al distributore */
const PRICE_LABEL_SCALE = 0.03;

/**
 * Distributori di carburante: dal verde (più economico dell'area) al rosso (più caro) per il carburante scelto,
 * grigi senza un prezzo aggiornato. Da vicino il prezzo accanto al segnaposto.
 */
export function drawFuelStations(rc: RenderContext): void {
  const { ctx, cw, ch, isDark, sx, sy, mx, my, camera, showFuel, fuelStations, fuelFilter } = rc;
  if (!showFuel || !fuelStations || fuelStations.length === 0) return;
  const ranks = rankFuelStations(fuelStations, fuelFilter, Date.now());
  // prima i grigi, poi dal più caro al più economico: i verdi restano sopra
  const ordered = [...fuelStations].sort((a, b) => (ranks.get(b.id)?.rank ?? 2) - (ranks.get(a.id)?.rank ?? 2));
  for (const s of ordered) {
    const px = sx(mx(s.lon));
    const py = sy(my(s.lat));
    if (px < -40 || px > cw + 40 || py < -40 || py > ch + 40) continue;
    const r = ranks.get(s.id);
    const color = r ? fuelRankColor(r.rank) : FUEL_NO_PRICE_COLOR;
    ctx.save();
    // goccia con la punta sul punto esatto
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.bezierCurveTo(px - 7, py - 8, px - 7, py - 17, px, py - 17);
    ctx.bezierCurveTo(px + 7, py - 17, px + 7, py - 8, px, py);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = isDark ? '#0f172a' : '#ffffff';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py - 11.5, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    if (r && camera.s > PRICE_LABEL_SCALE) {
      const label = formatFuelPrice(r.price.price, 'it-IT');
      ctx.font = '700 10px "DM Mono", monospace';
      const w = ctx.measureText(label).width + 8;
      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(px + 7, py - 18, w, 14);
      ctx.fillStyle = color;
      ctx.textAlign = 'start';
      ctx.fillText(label, px + 11, py - 7.5);
    }
    ctx.restore();
  }
}
