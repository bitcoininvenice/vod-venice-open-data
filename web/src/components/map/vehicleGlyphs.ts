// Icone dei mezzi viste dall'alto, orientate nel verso di marcia: barca per vaporetti, motoscafi,
// motonavi, ferry e Alilaguna; autobus e tram per la terraferma. Condivise da tutti i layer dei mezzi.
import { isWaterCategory } from '@/lib/actvLines';

export interface GlyphStyle {
  fill: string;
  stroke: string;
  lineWidth: number;
  /** fattore di scala (1 = dimensione delle barche Alilaguna) */
  scale?: number;
  /** colore del tetto/cabina */
  roof?: string;
}

/** Scafo con cabina; la prua punta verso l'alto prima della rotazione. */
export function drawBoatGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, headingRad: number, s: GlyphStyle): void {
  const k = s.scale ?? 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(headingRad);
  ctx.scale(k, k);
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(4.5, -3);
  ctx.lineTo(4.5, 9);
  ctx.lineTo(-4.5, 9);
  ctx.lineTo(-4.5, -3);
  ctx.closePath();
  ctx.fillStyle = s.fill;
  ctx.fill();
  ctx.strokeStyle = s.stroke;
  ctx.lineWidth = s.lineWidth / k;
  ctx.stroke();
  ctx.fillStyle = s.roof ?? '#ffffff';
  ctx.fillRect(-2.5, -3, 5, 8);
  ctx.restore();
}

/** Autobus (o tram, più lungo e snodato) visto dall'alto, con parabrezza davanti. */
export function drawRoadGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, headingRad: number, s: GlyphStyle, tram = false): void {
  const k = s.scale ?? 1;
  const half = tram ? 12 : 8.5;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(headingRad);
  ctx.scale(k, k);
  ctx.beginPath();
  ctx.roundRect(-3.8, -half, 7.6, half * 2, 2);
  ctx.fillStyle = s.fill;
  ctx.fill();
  ctx.strokeStyle = s.stroke;
  ctx.lineWidth = s.lineWidth / k;
  ctx.stroke();
  // parabrezza e tetto
  ctx.fillStyle = s.roof ?? '#ffffff';
  ctx.fillRect(-2.6, -half + 1.2, 5.2, 2.2);
  ctx.globalAlpha *= 0.55;
  ctx.fillRect(-1.2, -half + 4.5, 2.4, half * 2 - 6.5);
  if (tram) {
    ctx.globalAlpha /= 0.55;
    ctx.strokeStyle = s.roof ?? '#ffffff';
    ctx.lineWidth = 1 / k;
    ctx.beginPath();
    ctx.moveTo(-3.8, 0);
    ctx.lineTo(3.8, 0);
    ctx.stroke();
  }
  ctx.restore();
}

/** Icona giusta per la categoria ACTV (acqua o terra). */
export function drawVehicleGlyph(ctx: CanvasRenderingContext2D, category: string, x: number, y: number, headingRad: number, s: GlyphStyle): void {
  if (isWaterCategory(category)) drawBoatGlyph(ctx, x, y, headingRad, { ...s, scale: (s.scale ?? 1) * (category === 'ferry' ? 1.25 : 1) });
  else drawRoadGlyph(ctx, x, y, headingRad, s, category === 'tram');
}

/** Angolo di rotazione (rad) per un movimento da (x0, y0) a (x1, y1) sullo schermo; la prua punta verso l'alto. */
export function headingFromMotion(x0: number, y0: number, x1: number, y1: number): number | null {
  const dx = x1 - x0;
  const dy = y1 - y0;
  if (dx * dx + dy * dy < 0.25) return null;
  return Math.atan2(dx, -dy);
}
