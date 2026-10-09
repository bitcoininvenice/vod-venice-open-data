// Layer di disegno della mappa estratti da MapEngine (transitLayers). Ogni funzione riceve il contesto del frame.
import type { RenderContext } from './renderContext';
import { distAt, getSimulation, pointAt } from '@/lib/simulationModel';

export function drawRoutes(rc: RenderContext): void {
  const { ctx, cw, pal, sx, sy, camera, W, showRoutes } = rc;
  // 3. Render ACTV Routes (Shapes)
  const sim = getSimulation();
  if (showRoutes && sim) {
    ctx.lineWidth = Math.max(1, 1.2 * (camera.s / (cw / W)));
    ctx.globalAlpha = 0.35;

    for (const shape of sim.shapes) {
      const xy = shape.xy;
      ctx.beginPath();
      ctx.moveTo(sx(xy[0]), sy(xy[1]));
      for (let i = 1; i < shape.n; i++) {
        ctx.lineTo(sx(xy[2 * i]), sy(xy[2 * i + 1]));
      }
      ctx.strokeStyle = pal.cats.vaporetto || '#5cc8ff';
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  }
}

export function drawSpatialBuffer(rc: RenderContext): void {
  const { ctx, sx, sy, mx, my, camera, KY, showCantieri, showSpatialBuffer, bufferRadiusMeters, cantieri } = rc;
  // 4. Render Spatial Buffer Circles around Cantieri
  if (showSpatialBuffer && showCantieri) {
    // Meter to virtual map unit: 1 degree latitude ~ 111,139 meters
    const metersToVirtual = (bufferRadiusMeters / 111139) * KY * camera.s;

    for (const c of cantieri) {
      const cx = sx(mx(c.lon));
      const cy = sy(my(c.lat));

      ctx.beginPath();
      ctx.arc(cx, cy, metersToVirtual, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

export function drawVehicles(rc: RenderContext): void {
  const { ctx, cw, ch, pal, sx, sy, currentTimeSeconds, selectedDay, paletteTheme, showVehicles, selectedCategory } = rc;
  // 5. Render Moving Fleet (Vehicles with directional trails)
  if (showVehicles) {
    const sim = getSimulation();
    const tripsData = sim?.daysTrips[selectedDay];

    if (sim && tripsData) {
      const { tP, t0, t1, count } = tripsData;
      const t = currentTimeSeconds;
      const trailSec = 45; // Ghosting trail duration


      const ptNow: [number, number] = [0, 0];
      const ptTail: [number, number] = [0, 0];

      ctx.globalCompositeOperation = paletteTheme === 'notte' ? 'lighter' : 'source-over';

      for (let i = 0; i < count; i++) {
        if (t0[i] > t || t1[i] < t) continue;
        const prof = sim.profs[tP[i]];
        const rCat: string = prof.route.cat || 'vaporetto';

        if (selectedCategory !== 'all' && rCat !== selectedCategory) continue;

        const dt = t - t0[i];
        pointAt(prof.sh, distAt(prof, dt), ptNow);
        const vx = sx(ptNow[0]);
        const vy = sy(ptNow[1]);

        if (vx < -50 || vx > cw + 50 || vy < -50 || vy > ch + 50) continue;

        const col = pal.cats[rCat] || '#5cc8ff';

        // Trail
        pointAt(prof.sh, distAt(prof, Math.max(0, dt - trailSec)), ptTail);
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        ctx.lineTo(sx(ptTail[0]), sy(ptTail[1]));
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.45;
        ctx.stroke();

        // Vehicle Glow & Dot
        ctx.beginPath();
        ctx.arc(vx, vy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.95;
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
    }
  }
}

export function drawRealtimeVehicles(rc: RenderContext): void {
  const { ctx, cw, ch, pal, isDark, sx, sy, mx, my, camera, showRealtimeVehicles, realtimeVehicles, selectedCategory } = rc;
  // 5b. Posizioni reali GTFS-RT: rombo con bordo bianco, distinguibile dai mezzi simulati (cerchi)
  if (showRealtimeVehicles && realtimeVehicles.length > 0) {
    for (const v of realtimeVehicles) {
      const cat = v.category || 'vaporetto';
      if (selectedCategory !== 'all' && cat !== selectedCategory) continue;
      const vx = sx(mx(v.lon));
      const vy = sy(my(v.lat));
      if (vx < -20 || vx > cw + 20 || vy < -20 || vy > ch + 20) continue;
      const col = pal.cats[cat] || '#34d399';
      ctx.save();
      ctx.translate(vx, vy);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = col;
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-4.5, -4.5, 9, 9);
      ctx.strokeRect(-4.5, -4.5, 9, 9);
      ctx.restore();
      if (camera.s > 0.03 && v.line) {
        ctx.font = '700 9px "DM Mono", monospace';
        ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.fillText(v.line, vx + 8, vy + 3);
      }
    }
  }
}

export function drawStops(rc: RenderContext): void {
  const { ctx, pal, isDark, sx, sy, mx, my, camera, showStops, stops } = rc;
  // 6. Render ACTV Stops & Piers
  if (showStops) {
    for (const s of stops) {
      const px = sx(mx(s.lon));
      const py = sy(my(s.lat));

      // Base anchor marker
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Stop name label if zoomed in
      if (camera.s > 0.04) {
        ctx.font = '500 10px "Bricolage Grotesque", sans-serif';
        ctx.fillStyle = pal.ink;
        ctx.fillText(s.name, px + 7, py + 3);
      }
    }
  }
}

export function drawCantieri(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showCantieri, cantieri } = rc;
  // 7. Opere pubbliche del Comune di Venezia (posizione approssimata da geocodifica)
  if (showCantieri) {
    for (const c of cantieri) {
      const cx = sx(mx(c.lon));
      const cy = sy(my(c.lat));

      // Pulsing warning halo
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.fill();

      // Worksite pin
      ctx.beginPath();
      ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? '#f59e0b' : '#d97706';
      ctx.fill();
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label
      if (camera.s > 0.035) {
        ctx.font = '600 10px "Bricolage Grotesque", sans-serif';
        ctx.fillStyle = isDark ? '#f59e0b' : '#b45309';
        ctx.fillText(`${c.titolo.slice(0, 24)}...`, cx + 9, cy - 2);
      }
    }
  }
}
