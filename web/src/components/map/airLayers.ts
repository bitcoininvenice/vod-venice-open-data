// Layer di disegno della mappa estratti da MapEngine (airLayers). Ogni funzione riceve il contesto del frame.
import type { RenderContext } from './renderContext';
import { getLiveFlight } from './mapHelpers';

export function drawFlights(rc: RenderContext): void {
  const { ctx, cw, ch, isDark, sx, sy, mx, my, camera, currentTimeSeconds, selectedFlight, paletteTheme, showFlights, flights } = rc;
  // 8. Render Venice Marco Polo Airport (VCE / LIPZ) Infrastructure & Radar
  if (showFlights) {
    // Airport Coordinates: Tessera (Runways 04R/22L and 04L/22R)
    const r1x = sx(mx(12.3378));
    const r1y = sy(my(45.4943));
    const r2x = sx(mx(12.3660));
    const r2y = sy(my(45.5163));

    const p1x = sx(mx(12.3357));
    const p1y = sy(my(45.4956));
    const p2x = sx(mx(12.3639));
    const p2y = sy(my(45.5176));

    const rAng = Math.atan2(r2y - r1y, r2x - r1x);

    // Terminal Apron & Darsena Pad (Lagoon connection to Alilaguna water transport)
    const darsenaX = sx(mx(12.3440));
    const darsenaY = sy(my(45.4920));
    const terminalX = sx(mx(12.3480));
    const terminalY = sy(my(45.4980));

    // Apron polygon
    ctx.beginPath();
    ctx.moveTo(r1x, r1y);
    ctx.lineTo(r2x, r2y);
    ctx.lineTo(terminalX + 18, terminalY + 12);
    ctx.lineTo(darsenaX, darsenaY);
    ctx.closePath();
    ctx.fillStyle = paletteTheme === 'notte' ? 'rgba(30, 41, 59, 0.45)' : 'rgba(203, 213, 225, 0.45)';
    ctx.fill();
    ctx.strokeStyle = paletteTheme === 'notte' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(100, 116, 139, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Secondary Runway / Parallel Taxiway 04L / 22R
    ctx.beginPath();
    ctx.moveTo(p1x, p1y);
    ctx.lineTo(p2x, p2y);
    ctx.strokeStyle = paletteTheme === 'notte' ? '#334155' : '#94a3b8';
    ctx.lineWidth = Math.max(3, 5 * (camera.s / 0.02));
    ctx.stroke();

    // Main Runway 04R / 22L (Heavy asphalt tarmac)
    ctx.beginPath();
    ctx.moveTo(r1x, r1y);
    ctx.lineTo(r2x, r2y);
    ctx.strokeStyle = paletteTheme === 'notte' ? '#0f172a' : '#475569';
    ctx.lineWidth = Math.max(5, 8 * (camera.s / 0.02));
    ctx.stroke();

    // Main Runway White Dashed Centerline
    ctx.beginPath();
    ctx.moveTo(r1x, r1y);
    ctx.lineTo(r2x, r2y);
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = Math.max(1, 1.8 * (camera.s / 0.02));
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Runway Threshold Piano Keys & Identifiers
    if (camera.s > 0.012) {
      ctx.save();
      ctx.translate(r1x, r1y);
      ctx.rotate(rAng);
      // 04R Threshold
      ctx.fillStyle = isDark ? '#ffffff' : '#1e293b';
      for (let k = -3; k <= 3; k += 2) {
        ctx.fillRect(0, k * 2, 7, 1.2);
      }
      ctx.font = '700 9px "DM Mono", monospace';
      ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
      ctx.fillText('04R', -22, 3);
      ctx.restore();

      ctx.save();
      ctx.translate(r2x, r2y);
      ctx.rotate(rAng);
      // 22L Threshold
      ctx.fillStyle = isDark ? '#ffffff' : '#1e293b';
      for (let k = -3; k <= 3; k += 2) {
        ctx.fillRect(-7, k * 2, 7, 1.2);
      }
      ctx.font = '700 9px "DM Mono", monospace';
      ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
      ctx.fillText('22L', 10, 3);
      ctx.restore();
    }

    // Radar Tower & Sweeping Radar Beam (Tessera radar)
    const towerX = sx(mx(12.3480));
    const towerY = sy(my(45.5020));
    const radarSweep = ((currentTimeSeconds * 0.8) + (performance.now() * 0.001)) % (Math.PI * 2);

    // Radar Range Rings
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.arc(towerX, towerY, 32, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(towerX, towerY, 68, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Sweeping Radar Cone
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(towerX, towerY);
    ctx.arc(towerX, towerY, 68, radarSweep, radarSweep + 0.45);
    ctx.closePath();
    const radGrad = ctx.createRadialGradient(towerX, towerY, 2, towerX, towerY, 68);
    radGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    radGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
    ctx.fillStyle = radGrad;
    ctx.fill();
    ctx.restore();

    // Tower Beacon Light
    ctx.beginPath();
    ctx.arc(towerX, towerY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();
    ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Airport Interactive Badge / Landmark Tag
    const badgeX = sx(mx(12.3519));
    const badgeY = sy(my(45.5053)) - (camera.s > 0.03 ? 32 : 22);

    ctx.save();
    ctx.font = '700 11px "Bricolage Grotesque", sans-serif';
    const txt = rc.t('ui.mapLabels.airport');
    const txtWidth = ctx.measureText(txt).width;

    ctx.fillStyle = paletteTheme === 'notte' ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.92)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(badgeX - txtWidth / 2 - 8, badgeY - 14, txtWidth + 16, 22, 11);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = paletteTheme === 'notte' ? '#38bdf8' : '#0284c7';
    ctx.fillText(txt, badgeX - txtWidth / 2, badgeY + 1);

    if (camera.s > 0.025) {
      ctx.font = '500 9px "DM Mono", monospace';
      ctx.fillStyle = paletteTheme === 'notte' ? '#94a3b8' : '#64748b';
      const subTxt = rc.t('ui.mapLabels.airportSub');
      ctx.fillText(subTxt, badgeX - ctx.measureText(subTxt).width / 2, badgeY + 14);
    }
    ctx.restore();

    // 9. Render Flight Paths & ILS Approach Corridors (Runway 04R)
    const fixes = [
      { name: 'CHIOGGIA FIX', alt: '3500ft', lon: 12.2450, lat: 45.2850 },
      { name: 'LIDO IAF', alt: '2200ft', lon: 12.2850, lat: 45.3850 },
      { name: 'LAGUNA FAF', alt: '1200ft', lon: 12.3120, lat: 45.4480 },
      { name: 'THR 04R', alt: '50ft', lon: 12.3378, lat: 45.4943 },
    ];

    // Draw ILS Approach Centerline over Laguna & Adriatic
    ctx.beginPath();
    ctx.moveTo(sx(mx(fixes[0].lon)), sy(my(fixes[0].lat)));
    for (let fi = 1; fi < fixes.length; fi++) {
      ctx.lineTo(sx(mx(fixes[fi].lon)), sy(my(fixes[fi].lat)));
    }
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw ILS Funnel Guide Lines (±250m)
    const f0x = sx(mx(fixes[0].lon));
    const f0y = sy(my(fixes[0].lat));
    const f3x = sx(mx(fixes[3].lon));
    const f3y = sy(my(fixes[3].lat));
    const corridorAngle = Math.atan2(f3y - f0y, f3x - f0x);
    const perpX = Math.cos(corridorAngle + Math.PI / 2);
    const perpY = Math.sin(corridorAngle + Math.PI / 2);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(f0x + perpX * 18, f0y + perpY * 18);
    ctx.lineTo(f3x + perpX * 6, f3y + perpY * 6);
    ctx.moveTo(f0x - perpX * 18, f0y - perpY * 18);
    ctx.lineTo(f3x - perpX * 6, f3y - perpY * 6);
    ctx.stroke();
    ctx.setLineDash([]);

    // Departure Climb-out vector towards NE (Friuli / Treviso)
    const depStartX = sx(mx(12.3660));
    const depStartY = sy(my(45.5163));
    const depEndX = sx(mx(12.4300));
    const depEndY = sy(my(45.5650));
    ctx.beginPath();
    ctx.moveTo(depStartX, depStartY);
    ctx.lineTo(depEndX, depEndY);
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Waypoints diamond markers (◆)
    for (const fix of fixes) {
      const wx = sx(mx(fix.lon));
      const wy = sy(my(fix.lat));

      ctx.beginPath();
      ctx.moveTo(wx, wy - 4);
      ctx.lineTo(wx + 4, wy);
      ctx.lineTo(wx, wy + 4);
      ctx.lineTo(wx - 4, wy);
      ctx.closePath();
      ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
      ctx.fill();

      if (camera.s > 0.02) {
        ctx.font = '600 9px "DM Mono", monospace';
        ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
        ctx.fillText(`${fix.name} · ${fix.alt}`, wx + 7, wy + 3);
      }
    }

    // Aircraft Trajectories (Past trail & Approach glideslope vector)
    if (flights && flights.length > 0) {
      const r04x = sx(mx(12.3378));
      const r04y = sy(my(45.4943));

      for (const f of flights) {
        const live = getLiveFlight(f);
        const fx = sx(mx(live.lon));
        const fy = sy(my(live.lat));
        const isSelected = selectedFlight?.icao24 === f.icao24;

        // 1. Past Trajectory Trail
        const rad = (live.heading * Math.PI) / 180;
        const trailLenDeg = isSelected ? 0.06 : 0.035;
        const tailLon = live.lon - Math.sin(rad) * trailLenDeg;
        const tailLat = live.lat - Math.cos(rad) * trailLenDeg;
        const tailX = sx(mx(tailLon));
        const tailY = sy(my(tailLat));

        const grad = ctx.createLinearGradient(tailX, tailY, fx, fy);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        grad.addColorStop(1, isSelected ? 'rgba(56, 189, 248, 0.95)' : 'rgba(56, 189, 248, 0.6)');

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(fx, fy);
        ctx.strokeStyle = grad;
        ctx.lineWidth = isSelected ? 3 : 1.8;
        ctx.stroke();

        // 2. Projected Approach / Glideslope Vector towards Runway 04R
        if (f.status === 'APPROACH') {
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(r04x, r04y);
          ctx.strokeStyle = isSelected ? '#fbbf24' : 'rgba(251, 191, 36, 0.5)';
          ctx.lineWidth = isSelected ? 2.5 : 1.4;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (f.status === 'DEPARTURE') {
          const headLon = live.lon + Math.sin(rad) * 0.04;
          const headLat = live.lat + Math.cos(rad) * 0.04;
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(sx(mx(headLon)), sy(my(headLat)));
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.lineWidth = 1.4;
          ctx.setLineDash([3, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Distance to VCE readout if selected
        if (isSelected) {
          const distToVceKm = (Math.hypot(live.lon - 12.3519, live.lat - 45.5053) * 111).toFixed(1);
          ctx.font = '700 10px "DM Mono", monospace';
          ctx.fillStyle = '#fbbf24';
          ctx.fillText(rc.t('ui.mapLabels.kmToVce', { km: distToVceKm }), fx + 14, fy - 10);
        }
      }
    }

    // 10. Render Airplane Silhouettes and Tags
    if (flights && flights.length > 0) {
      for (const f of flights) {
        const live = getLiveFlight(f);
        const fx = sx(mx(live.lon));
        const fy = sy(my(live.lat));

        if (fx < -60 || fx > cw + 60 || fy < -60 || fy > ch + 60) continue;

        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate((live.heading * Math.PI) / 180);

        // Airplane silhouette
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(2.5, -2);
        ctx.lineTo(11, 2);
        ctx.lineTo(11, 4.5);
        ctx.lineTo(2.5, 2.5);
        ctx.lineTo(2.5, 8);
        ctx.lineTo(6.5, 11);
        ctx.lineTo(6.5, 13);
        ctx.lineTo(0, 11.5);
        ctx.lineTo(-6.5, 13);
        ctx.lineTo(-6.5, 11);
        ctx.lineTo(-2.5, 8);
        ctx.lineTo(-2.5, 2.5);
        ctx.lineTo(-11, 4.5);
        ctx.lineTo(-11, 2);
        ctx.lineTo(-2.5, -2);
        ctx.closePath();

        ctx.fillStyle = f.onGround
          ? '#94a3b8'
          : f.status === 'APPROACH'
          ? (isDark ? '#38bdf8' : '#0284c7')
          : f.status === 'DEPARTURE'
          ? (isDark ? '#67e8f9' : '#0891b2')
          : (isDark ? '#60a5fa' : '#2563eb');
        ctx.fill();
        ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // Flight Tag
        ctx.font = '600 10px "DM Mono", monospace';
        ctx.fillStyle = f.status === 'APPROACH'
          ? (isDark ? '#38bdf8' : '#0284c7')
          : (isDark ? '#7dd3fc' : '#0369a1');
        ctx.fillText(`${f.callsign} · ${Math.round(live.alt)}m`, fx + 13, fy + 3);
      }
    }
  }
}
