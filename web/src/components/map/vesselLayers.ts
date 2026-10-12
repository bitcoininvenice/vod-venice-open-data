// Layer della navigazione: canali marittimi, navi AIS e barche Alilaguna.
import type { RenderContext } from './renderContext';
import { getScheduledAlilagunaBoats } from '@/lib/alilaguna-schedule';
import { MARITIME_ROUTES } from '@/lib/shipsData';
import type { ShipCategory } from '@/lib/types';
import { prefersReducedMotion } from './mapHelpers';
import { drawBoatGlyph } from './vehicleGlyphs';

export function drawShipRoutes(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showShipRoutes } = rc;
  // 11b. Render Maritime Navigational Channels & Fairways (Canale dei Petroli & Bocca di Lido -> Tronchetto)
  if (showShipRoutes) {
    for (const ch of MARITIME_ROUTES) {
      const wps = ch.waypoints;
      if (wps.length < 2) continue;

      // 1. Draw Channel Centerline
      ctx.beginPath();
      ctx.moveTo(sx(mx(wps[0].lon)), sy(my(wps[0].lat)));
      for (let wi = 1; wi < wps.length; wi++) {
        ctx.lineTo(sx(mx(wps[wi].lon)), sy(my(wps[wi].lat)));
      }
      ctx.strokeStyle = ch.color;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = Math.max(1.8, 2.5 * (camera.s / 0.02));
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1.0;

      // 2. Lateral Channel Fairway Guide Lines (representing lateral buoys / briccole)
      if (camera.s > 0.015) {
        ctx.beginPath();
        for (let wi = 0; wi < wps.length - 1; wi++) {
          const p1x = sx(mx(wps[wi].lon));
          const p1y = sy(my(wps[wi].lat));
          const p2x = sx(mx(wps[wi + 1].lon));
          const p2y = sy(my(wps[wi + 1].lat));
          const segAng = Math.atan2(p2y - p1y, p2x - p1x);
          const perpX = Math.cos(segAng + Math.PI / 2);
          const perpY = Math.sin(segAng + Math.PI / 2);
          const offsetPx = Math.max(5, 10 * (camera.s / 0.02));

          ctx.moveTo(p1x + perpX * offsetPx, p1y + perpY * offsetPx);
          ctx.lineTo(p2x + perpX * offsetPx, p2y + perpY * offsetPx);
          ctx.moveTo(p1x - perpX * offsetPx, p1y - perpY * offsetPx);
          ctx.lineTo(p2x - perpX * offsetPx, p2y - perpY * offsetPx);
        }
        ctx.strokeStyle = ch.color;
        ctx.globalAlpha = 0.22;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1.0;
      }

      // 3. Nautical Waypoints & Buoys (◆)
      for (const wp of wps) {
        const wpx = sx(mx(wp.lon));
        const wpy = sy(my(wp.lat));

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(wpx, wpy - 4.5);
        ctx.lineTo(wpx + 4.5, wpy);
        ctx.lineTo(wpx, wpy + 4.5);
        ctx.lineTo(wpx - 4.5, wpy);
        ctx.closePath();
        ctx.fillStyle = ch.color;
        ctx.fill();
        ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Waypoint Label
        if (camera.s > 0.02) {
          ctx.font = '600 8.5px "DM Mono", monospace';
          ctx.fillStyle = isDark ? ch.color : '#1e3a8a';
          ctx.fillText(`${wp.name} · ${wp.depth}`, wpx + 7, wpy + 3);
        }
        ctx.restore();
      }
    }
  }
}

/** Colori per categoria AIS */
export const SHIP_COLORS: Record<ShipCategory, string> = {
  PASSENGER: '#6366f1',
  CARGO: '#3b82f6',
  TANKER: '#ef4444',
  HIGH_SPEED: '#06b6d4',
  TUG: '#f97316',
  FISHING: '#22c55e',
  PLEASURE: '#a855f7',
  SERVICE: '#eab308',
  OTHER: '#94a3b8',
};

/** Converte #rrggbb in rgba con l'opacità indicata */
function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function drawShips(rc: RenderContext): void {
  const { ctx, cw, ch, isDark, sx, sy, mx, my, camera, selectedShipOnMap, paletteTheme, showShips, ships } = rc;
  // Navi AIS: posizione e rotta dell'ultimo segnale ricevuto, senza movimenti simulati
  if (!showShips || !ships || ships.length === 0) return;
  for (const sh of ships) {
    const shx = sx(mx(sh.lon));
    const shy = sy(my(sh.lat));
    if (shx < -60 || shx > cw + 60 || shy < -60 || shy > ch + 60) continue;

    const isSelected = selectedShipOnMap?.mmsi === sh.mmsi;
    const moving = (sh.speedKnots ?? 0) > 0.5;
    const bearing = sh.heading ?? sh.courseDeg;
    const color = SHIP_COLORS[sh.category];
    // Grandi navi un po' più grandi, entro limiti leggibili
    const scale = sh.lengthMeters ? Math.min(1.8, Math.max(0.8, sh.lengthMeters / 120)) : 1;

    // Alone pulsante nel colore della categoria, come per le sonde ARPAV: le navi si vedono a colpo d'occhio.
    // Fase diversa per ogni nave (dall'MMSI) così non lampeggiano tutte insieme; fermo con "riduci movimento".
    const phase = (Number(sh.mmsi.slice(-4)) || 0) / 1000;
    const pulse = prefersReducedMotion() ? 0.5 : (Math.sin(Date.now() / 600 + phase) + 1) / 2;
    ctx.beginPath();
    ctx.arc(shx, shy, (11 + pulse * 7) * scale, 0, Math.PI * 2);
    ctx.fillStyle = withAlpha(color, isDark ? 0.28 - pulse * 0.12 : 0.24 - pulse * 0.1);
    ctx.fill();

    ctx.save();
    ctx.translate(shx, shy);
    if (bearing !== null) {
      ctx.rotate((bearing * Math.PI) / 180);
      // Scia proporzionale alla velocità reale
      if (moving) {
        const wake = Math.min(40, (sh.speedKnots ?? 0) * 3);
        const grad = ctx.createLinearGradient(0, 8 * scale, 0, 8 * scale + wake);
        grad.addColorStop(0, isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,100,160,0.3)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-3 * scale, 8 * scale);
        ctx.lineTo(-7 * scale, 8 * scale + wake);
        ctx.lineTo(7 * scale, 8 * scale + wake);
        ctx.lineTo(3 * scale, 8 * scale);
        ctx.closePath();
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(0, -11 * scale);
      ctx.lineTo(4.5 * scale, -3 * scale);
      ctx.lineTo(4.5 * scale, 8 * scale);
      ctx.lineTo(-4.5 * scale, 8 * scale);
      ctx.lineTo(-4.5 * scale, -3 * scale);
      ctx.closePath();
    } else {
      // Rotta sconosciuta: cerchio
      ctx.beginPath();
      ctx.arc(0, 0, 5 * scale, 0, Math.PI * 2);
    }
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#fbbf24' : isDark ? '#ffffff' : '#0f172a';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.stroke();
    ctx.restore();

    if (camera.s > 0.03 || isSelected) {
      ctx.font = '600 9.5px "Bricolage Grotesque", sans-serif';
      ctx.fillStyle = paletteTheme === 'notte' ? '#e2e8f0' : '#1e293b';
      const speed = sh.speedKnots !== null && moving ? ` · ${sh.speedKnots} kn` : '';
      ctx.fillText(`${sh.name}${speed}`, shx + 10, shy - 2);
    }
  }
}

export function drawAlilaguna(rc: RenderContext): void {
  const { ctx, cw, ch, isDark, sx, sy, mx, my, camera, currentTimeSeconds, selectedAlilagunaBoat, paletteTheme, showAlilaguna, alilagunaRoutes, alilagunaStops } = rc;
  // 17. Render Alilaguna Airport Water Routes, Darsene & Boats (Transitland f-u20f-alilagunaspa)
  if (showAlilaguna) {
    // 17a. Alilaguna Navigational Routes
    if (alilagunaRoutes && alilagunaRoutes.length > 0) {
      for (const r of alilagunaRoutes) {
        if (!r.shape || r.shape.length < 2) continue;
        ctx.save();
        ctx.beginPath();
        const [p0Lon, p0Lat] = r.shape[0];
        ctx.moveTo(sx(mx(p0Lon)), sy(my(p0Lat)));
        for (let i = 1; i < r.shape.length; i++) {
          const [pLon, pLat] = r.shape[i];
          ctx.lineTo(sx(mx(pLon)), sy(my(pLat)));
        }
        ctx.strokeStyle = r.color;
        ctx.lineWidth = camera.s > 0.03 ? 2.5 : 1.8;
        ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 17b. Alilaguna Darsene & Hubs (with special spotlight on Aeroporto Marco Polo Darsena VCE)
    if (alilagunaStops && alilagunaStops.length > 0) {
      for (const st of alilagunaStops) {
        const stx = sx(mx(st.lon));
        const sty = sy(my(st.lat));
        if (stx < -60 || stx > cw + 60 || sty < -60 || sty > ch + 60) continue;

        if (st.isAirportHub) {
          // Darsena Aeroporto VCE Marco Polo - Intermodal Airport Hub
          ctx.save();
          const pulse = 10 + Math.sin(Date.now() / 250) * 3.5;
          ctx.beginPath();
          ctx.arc(stx, sty, pulse, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 85, 165, 0.2)';
          ctx.fill();
          ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(stx, sty, 5.5, 0, Math.PI * 2);
          ctx.fillStyle = '#0055a5';
          ctx.fill();
          ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Hub Label Tag
          ctx.font = '700 9.5px "Bricolage Grotesque", sans-serif';
          const hubTxt = rc.t('ui.mapLabels.airportDock');
          const hubW = ctx.measureText(hubTxt).width;
          ctx.fillStyle = 'rgba(0, 85, 165, 0.92)';
          ctx.beginPath();
          ctx.roundRect(stx - hubW / 2 - 5, sty - 22, hubW + 10, 16, 5);
          ctx.fill();
          ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.fillText(hubTxt, stx - hubW / 2, sty - 10);
          ctx.restore();
        } else {
          // Regular Alilaguna Darsena
          ctx.save();
          ctx.beginPath();
          ctx.arc(stx, sty, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#0055a5';
          ctx.fill();
          ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
          ctx.lineWidth = 1;
          ctx.stroke();

          if (camera.s > 0.04) {
            ctx.font = '600 8px "DM Mono", monospace';
            ctx.fillStyle = isDark ? '#60a5fa' : '#1e40af';
            ctx.fillText(st.name, stx + 6, sty + 3);
          }
          ctx.restore();
        }
      }
    }

    // 17c. Alilaguna Active Waterbuses in Navigation (Deterministic Official GTFS Timetable Twin)
    const scheduledAlilagunaFleet = getScheduledAlilagunaBoats(currentTimeSeconds);
    if (scheduledAlilagunaFleet.length > 0) {
      for (const b of scheduledAlilagunaFleet) {
        const bx = sx(mx(b.lon));
        const by = sy(my(b.lat));
        if (bx < -60 || bx > cw + 60 || by < -60 || by > ch + 60) continue;

        const isSelected = selectedAlilagunaBoat?.id === b.id;
        const headingRad = (b.heading * Math.PI) / 180;

        // Wake foam trail
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(headingRad);
        const wakeGrad = ctx.createLinearGradient(0, 0, 0, 32);
        wakeGrad.addColorStop(0, isSelected ? 'rgba(56, 189, 248, 0.95)' : (isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 85, 165, 0.35)'));
        wakeGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        ctx.beginPath();
        ctx.moveTo(-2, 5);
        ctx.lineTo(-6, 30);
        ctx.lineTo(6, 30);
        ctx.lineTo(2, 5);
        ctx.closePath();
        ctx.fillStyle = wakeGrad;
        ctx.fill();

        ctx.restore();

        // Scafo e cabina (icona condivisa con i mezzi ACTV)
        drawBoatGlyph(ctx, bx, by, headingRad, {
          fill: b.color,
          stroke: isSelected ? '#fbbf24' : (isDark ? '#ffffff' : '#0f172a'),
          lineWidth: isSelected ? 2.2 : 1.2,
          roof: isDark ? '#ffffff' : '#e2e8f0',
        });

        // Boat label badge
        ctx.save();
        ctx.font = '700 8.5px "DM Mono", monospace';
        const bTxt = `ALILAGUNA ${b.lineCode} (~${b.speedKmh} km/h)`;
        const bW = ctx.measureText(bTxt).width;
        ctx.fillStyle = paletteTheme === 'notte' ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.88)';
        ctx.beginPath();
        ctx.roundRect(bx - bW / 2 - 4, by - 16, bW + 8, 14, 4);
        ctx.fill();
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = b.color;
        ctx.fillText(bTxt, bx - bW / 2, by - 6);
        ctx.restore();
      }
    }
  }
}
