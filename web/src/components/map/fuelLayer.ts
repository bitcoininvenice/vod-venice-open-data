import type { RenderContext } from './renderContext';
import { FUEL_NO_PRICE_COLOR, formatFuelPrice, fuelRankColor, rankFuelStations } from '@/lib/fuel';

/** Raggio del segnaposto e quanto sta sopra il punto del distributore (px) */
const MARKER_R = 10;
export const MARKER_LIFT = 15;
const ICON_PX = 13;

/** Tracciati dell'icona Fuel di lucide (la stessa del pannello e della scheda), creati al primo disegno */
let fuelPaths: Path2D[] | null = null;
const fuelIcon = (): Path2D[] =>
  (fuelPaths ??= [
    'M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-6.998a2 2 0 0 0-.59-1.42L18 5',
    'M14 21V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16',
    'M2 21h13',
    'M3 9h11',
  ].map((d) => new Path2D(d)));

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
    // segnaposto tondo con la punta sul distributore e la pompa di benzina dentro
    const cy = py - MARKER_LIFT;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - 5, cy + 7);
    ctx.arc(px, cy, MARKER_R, Math.PI * 0.68, Math.PI * 2.32);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = isDark ? '#0f172a' : '#ffffff';
    ctx.stroke();
    const k = ICON_PX / 24;
    ctx.save();
    ctx.translate(px - ICON_PX / 2, cy - ICON_PX / 2);
    ctx.scale(k, k);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const path of fuelIcon()) ctx.stroke(path);
    ctx.restore();
    if (r && camera.s > PRICE_LABEL_SCALE) {
      const label = formatFuelPrice(r.price.price, 'it-IT');
      ctx.font = '700 10px "DM Mono", monospace';
      const w = ctx.measureText(label).width + 8;
      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(px + MARKER_R + 2, cy - 7, w, 14);
      ctx.fillStyle = color;
      ctx.textAlign = 'start';
      ctx.fillText(label, px + MARKER_R + 6, cy + 3.5);
    }
    ctx.restore();
  }
}
