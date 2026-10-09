// Layer di disegno della mappa estratti da MapEngine (lagoonLayers). Ogni funzione riceve il contesto del frame.
import type { RenderContext } from './renderContext';
import { getScheduledAlilagunaBoats } from '@/lib/alilaguna-schedule';

import { MARITIME_CHANNELS, getLiveShip } from './mapHelpers';

export function drawMose(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, paletteTheme, showMose, moseGates } = rc;
  // 11. Render MOSE Defense Barriers at the 3 Bocche di Porto (Lido, Malamocco, Chioggia)
  if (showMose && moseGates && moseGates.length > 0) {
    for (const gate of moseGates) {
      const gx = sx(mx(gate.lon));
      const gy = sy(my(gate.lat));

      // Draw barrier line across channel
      const barWidth = Math.max(28, 48 * (camera.s / 0.02));
      const isActivated = gate.status === 'ATTIVATO';
      const isRaising = gate.status === 'IN_SOLLEVAMENTO';
      const isUnknown = gate.status === 'NON_DISPONIBILE';
      const barrierCol = isActivated ? '#ef4444' : isRaising ? '#f59e0b' : isUnknown ? '#94a3b8' : '#10b981';

      ctx.save();
      // Barrier line with end anchors
      ctx.beginPath();
      ctx.moveTo(gx - barWidth / 2, gy);
      ctx.lineTo(gx + barWidth / 2, gy);
      ctx.strokeStyle = barrierCol;
      ctx.lineWidth = Math.max(3, 4.5 * (camera.s / 0.02));
      ctx.lineCap = 'round';
      if (!isActivated) ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Mooring caissons / Abutments on both sides
      ctx.fillStyle = isDark ? '#ffffff' : '#475569';
      ctx.beginPath();
      ctx.arc(gx - barWidth / 2, gy, 3, 0, Math.PI * 2);
      ctx.arc(gx + barWidth / 2, gy, 3, 0, Math.PI * 2);
      ctx.fill();

      // Gate Status Tag
      ctx.font = '700 9px "DM Mono", monospace';
      const gateTag = `MOSE ${gate.inletName} (${gate.barriersCount}p)`;
      const tagW = ctx.measureText(gateTag).width;

      ctx.fillStyle = paletteTheme === 'notte' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)';
      ctx.strokeStyle = barrierCol;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(gx - tagW / 2 - 4, gy - 16, tagW + 8, 14, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = barrierCol;
      ctx.fillText(gateTag, gx - tagW / 2, gy - 6);
      ctx.restore();
    }
  }
}

export function drawShipRoutes(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, selectedShipOnMap, showShipRoutes } = rc;
  // 11b. Render Maritime Navigational Channels & Fairways (Canale dei Petroli & Bocca di Lido -> Tronchetto)
  if (showShipRoutes) {
    for (const ch of MARITIME_CHANNELS) {
      const wps = ch.waypoints;
      if (wps.length < 2) continue;

      const isChannelSelected = selectedShipOnMap?.routeId === ch.id;

      // 1. Draw Channel Centerline
      ctx.beginPath();
      ctx.moveTo(sx(mx(wps[0].lon)), sy(my(wps[0].lat)));
      for (let wi = 1; wi < wps.length; wi++) {
        ctx.lineTo(sx(mx(wps[wi].lon)), sy(my(wps[wi].lat)));
      }
      ctx.strokeStyle = ch.color;
      ctx.globalAlpha = isChannelSelected ? 0.95 : 0.5;
      ctx.lineWidth = isChannelSelected ? Math.max(3, 4.5 * (camera.s / 0.02)) : Math.max(1.8, 2.5 * (camera.s / 0.02));
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1.0;

      // 2. Lateral Channel Fairway Guide Lines (representing lateral buoys / briccole)
      if (camera.s > 0.015 || isChannelSelected) {
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
        ctx.globalAlpha = isChannelSelected ? 0.45 : 0.22;
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
        if (camera.s > 0.02 || isChannelSelected) {
          ctx.font = '600 8.5px "DM Mono", monospace';
          ctx.fillStyle = isChannelSelected ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? ch.color : '#1e3a8a');
          ctx.fillText(`${wp.name} · ${wp.depth}`, wpx + 7, wpy + 3);
        }
        ctx.restore();
      }
    }
  }
}

export function drawShips(rc: RenderContext): void {
  const { ctx, cw, ch, isDark, sx, sy, mx, my, camera, currentTimeSeconds, selectedShipOnMap, paletteTheme, showShips, ships } = rc;
  // 12. Render Ships & Cruise Vessels (Tronchetto / Marittima AIS Traffic)
  if (showShips && ships && ships.length > 0) {
    for (const sh of ships) {
      const live = getLiveShip(sh, currentTimeSeconds);
      const shx = sx(mx(live.lon));
      const shy = sy(my(live.lat));

      if (shx < -80 || shx > cw + 80 || shy < -80 || shy > ch + 80) continue;

      const isSelected = selectedShipOnMap?.mmsi === sh.mmsi;
      const headingRad = (live.heading * Math.PI) / 180;

      // 1. Ship Wake Trail (behind vessel)
      if (sh.speedKnots > 0.5) {
        ctx.save();
        ctx.translate(shx, shy);
        ctx.rotate(headingRad);
        const wakeLen = Math.min(80, isSelected ? sh.speedKnots * 7 : sh.speedKnots * 4);
        const wakeGrad = ctx.createLinearGradient(0, 0, 0, wakeLen);
        wakeGrad.addColorStop(0, isSelected ? 'rgba(56, 189, 248, 0.95)' : (isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 100, 160, 0.35)'));
        wakeGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

        ctx.beginPath();
        ctx.moveTo(-3, 8);
        ctx.lineTo(-9, 8 + wakeLen);
        ctx.lineTo(9, 8 + wakeLen);
        ctx.lineTo(3, 8);
        ctx.closePath();
        ctx.fillStyle = wakeGrad;
        ctx.fill();
        ctx.restore();
      }

      // 2. Projected Heading Course Vector
      if (sh.speedKnots > 0.5) {
        const forwardDist = isSelected ? 0.025 : 0.015;
        const forwardLon = live.lon + Math.sin(headingRad) * forwardDist;
        const forwardLat = live.lat + Math.cos(headingRad) * forwardDist;
        ctx.beginPath();
        ctx.moveTo(shx, shy);
        ctx.lineTo(sx(mx(forwardLon)), sy(my(forwardLat)));
        ctx.strokeStyle = isSelected ? '#fbbf24' : (isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(30, 41, 59, 0.45)');
        ctx.lineWidth = isSelected ? 2.5 : 1.2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 3. When Selected, draw direct vector to destination berth with Nautical Miles readout
      if (isSelected) {
        const berthCoord = sh.routeId === 'CANALE_PETROLI'
          ? { lon: 12.2450, lat: 45.4420 }
          : sh.routeId === 'FAST_FERRY_ISTRIA'
          ? { lon: 12.3160, lat: 45.4335 }
          : { lon: 12.3050, lat: 45.4418 };
        const bx = sx(mx(berthCoord.lon));
        const by = sy(my(berthCoord.lat));

        ctx.beginPath();
        ctx.moveTo(shx, shy);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Nautical distance badge
        const distNM = (Math.hypot(live.lon - berthCoord.lon, live.lat - berthCoord.lat) * 60).toFixed(1);
        ctx.font = '700 10px "DM Mono", monospace';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(`${distNM} NM · ${sh.berth.split(',')[0]}`, shx + 14, shy - 14);
      }

      // 4. Ship Hull & Superstructure (Rotated to heading)
      ctx.save();
      ctx.translate(shx, shy);
      ctx.rotate(headingRad);

      const isCruise = sh.shipType === 'CRUISE';
      const isTug = sh.shipType === 'TUG';
      const isHydrofoil = sh.shipType === 'HYDROFOIL';

      const hullColor = isCruise
        ? (sh.isRestrictedLagoonRoute ? '#f59e0b' : '#6366f1')
        : isTug
        ? '#f97316'
        : isHydrofoil
        ? '#06b6d4'
        : '#3b82f6';

      const sScale = isCruise ? Math.max(1.2, sh.lengthMeters / 180) : 1.0;

      // Ship Hull Polygon
      ctx.beginPath();
      ctx.moveTo(0, -14 * sScale); // Bow
      ctx.lineTo(5 * sScale, -4 * sScale);
      ctx.lineTo(5 * sScale, 12 * sScale);
      ctx.lineTo(-5 * sScale, 12 * sScale);
      ctx.lineTo(-5 * sScale, -4 * sScale);
      ctx.closePath();
      ctx.fillStyle = hullColor;
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#fbbf24' : (isDark ? '#ffffff' : '#0f172a');
      ctx.lineWidth = isSelected ? 2 : 1.2;
      ctx.stroke();

      // Superstructure / Deck for cruise ships
      if (isCruise) {
        ctx.fillStyle = isDark ? '#ffffff' : '#e2e8f0';
        ctx.fillRect(-3 * sScale, -5 * sScale, 6 * sScale, 12 * sScale);
        // Funnel
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-2 * sScale, 3 * sScale, 4 * sScale, 3 * sScale);
      }

      ctx.restore(); // Undo rotation and translation

      // Ship Label Tag
      ctx.font = '600 10px "Bricolage Grotesque", sans-serif';
      const shipLabel = isCruise
        ? `${sh.name} (${sh.speedKnots} kn)`
        : isTug
        ? `${sh.name} (Rimorchiatore)`
        : isHydrofoil
        ? `${sh.name} (Aliscafo)`
        : `${sh.name}`;

      ctx.fillStyle = paletteTheme === 'notte' ? '#e2e8f0' : '#1e293b';
      ctx.fillText(shipLabel, shx + 10, shy - 2);

      // Berth subtext
      if (camera.s > 0.02 || isSelected) {
        ctx.font = '500 8.5px "DM Mono", monospace';
        ctx.fillStyle = sh.isRestrictedLagoonRoute
          ? (isDark ? '#f59e0b' : '#b45309')
          : (isDark ? '#38bdf8' : '#0284c7');
        ctx.fillText(sh.berth, shx + 10, shy + 9);
      }
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
          const hubTxt = 'Darsena VCE Aeroporto (Alilaguna Hub)';
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

        // Waterbus Hull
        ctx.beginPath();
        ctx.moveTo(0, -10); // bow
        ctx.lineTo(4.5, -3);
        ctx.lineTo(4.5, 9);
        ctx.lineTo(-4.5, 9);
        ctx.lineTo(-4.5, -3);
        ctx.closePath();
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#fbbf24' : (isDark ? '#ffffff' : '#0f172a');
        ctx.lineWidth = isSelected ? 2.2 : 1.2;
        ctx.stroke();

        // Cabin Roof
        ctx.fillStyle = isDark ? '#ffffff' : '#e2e8f0';
        ctx.fillRect(-2.5, -3, 5, 8);
        ctx.restore();

        // Boat label badge
        ctx.save();
        ctx.font = '700 8.5px "DM Mono", monospace';
        const bTxt = `ALILAGUNA ${b.lineCode} (${b.speedKmh} km/h)`;
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

export function drawPasserelle(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showPasserelle, passerelle } = rc;
  // 19. Render Passerelle per Acqua Alta (CPSM / Protezione Civile)
  if (showPasserelle && passerelle && passerelle.length > 0) {
    for (const p of passerelle) {
      if (!p.path || p.path.length < 2) continue;
      ctx.save();

      // Outer walkway board outline
      ctx.beginPath();
      p.path.forEach((pt, idx) => {
        const px = sx(mx(pt[0]));
        const py = sy(my(pt[1]));
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });

      // Wooden planks glow & styling
      ctx.strokeStyle = p.isMounted ? '#f59e0b' : '#78716c';
      ctx.lineWidth = Math.max(3.5, 6 * (camera.s / 0.05));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = p.isMounted ? 0.95 : 0.45;
      ctx.stroke();

      // Elevated metal stilt legs / planks dashes
      ctx.strokeStyle = isDark ? '#ffffff' : '#44403c';
      ctx.lineWidth = Math.max(1.5, 2.5 * (camera.s / 0.05));
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Stanchion marker posts at vertices
      p.path.forEach((pt) => {
        const px = sx(mx(pt[0]));
        const py = sy(my(pt[1]));
        ctx.fillStyle = p.isMounted ? '#fbbf24' : '#a8a29e';
        ctx.beginPath();
        ctx.arc(px, py, Math.max(2.5, 4 * (camera.s / 0.05)), 0, Math.PI * 2);
        ctx.fill();
      });

      // Label when zoomed in
      if (camera.s > 0.06) {
        const midPt = p.path[Math.floor(p.path.length / 2)];
        const lx = sx(mx(midPt[0]));
        const ly = sy(my(midPt[1]));
        ctx.font = '700 8.5px "DM Mono", monospace';
        const label = `${p.name.split('-')[0].trim()} (${p.lengthMeters}m)`;
        const lW = ctx.measureText(label).width;
        ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.92)';
        ctx.fillRect(lx - lW / 2 - 3, ly - 14, lW + 6, 12);
        ctx.fillStyle = isDark ? '#f59e0b' : '#b45309';
        ctx.fillText(label, lx - lW / 2, ly - 5);
      }

      ctx.restore();
    }
  }
}

export function drawMarineSignals(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, currentTimeSeconds, showMarineSignals, briccole } = rc;
  // 20. Render Briccole & Fanali di Canale
  if (showMarineSignals && briccole && briccole.length > 0) {
    for (const br of briccole) {
      const bx = sx(mx(br.lon));
      const by = sy(my(br.lat));
      ctx.save();

      // 3 or 5 wooden oak piles
      const pileCount = br.type === 'DAMA_5_PALI' ? 5 : 3;
      const pileRadius = Math.max(1.5, 2.5 * (camera.s / 0.04));
      const pileOffset = Math.max(2.5, 4.5 * (camera.s / 0.04));

      ctx.fillStyle = br.material === 'ROVERE_NATURALE' ? '#854d0e' : '#059669';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 0.8;

      for (let i = 0; i < pileCount; i++) {
        const ang = (i / pileCount) * Math.PI * 2;
        const px = bx + Math.cos(ang) * pileOffset;
        const py = by + Math.sin(ang) * pileOffset;
        ctx.beginPath();
        ctx.arc(px, py, pileRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Central pile for Dama
      if (br.type === 'DAMA_5_PALI') {
        ctx.beginPath();
        ctx.arc(bx, by, pileRadius * 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Active Lantern / Beacon
      if (br.lightColor !== 'NONE') {
        const flashPhase = (currentTimeSeconds * 2 + (parseInt(br.id.replace(/\D/g, ''), 10) || 1)) % 3;
        const isFlashing = flashPhase < 1.2;
        const lColor = br.lightColor === 'GREEN' ? '#10b981' : br.lightColor === 'RED' ? '#ef4444' : '#f8fafc';

        if (isFlashing) {
          // Glowing lantern aura
          ctx.beginPath();
          ctx.arc(bx, by, Math.max(6, 12 * (camera.s / 0.04)), 0, Math.PI * 2);
          ctx.fillStyle = br.lightColor === 'GREEN' ? 'rgba(16, 185, 129, 0.35)' : br.lightColor === 'RED' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.35)';
          ctx.fill();
        }

        // Lantern core
        ctx.beginPath();
        ctx.arc(bx, by, Math.max(2, 3.5 * (camera.s / 0.04)), 0, Math.PI * 2);
        ctx.fillStyle = lColor;
        ctx.fill();
        ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      if (camera.s > 0.05) {
        ctx.font = '600 8px "DM Mono", monospace';
        ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
        ctx.fillText(br.code, bx + 8, by + 3);
      }

      ctx.restore();
    }
  }
}

export function drawOceanStations(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, currentTimeSeconds, showOceanStations, oceanStations } = rc;
  // 21. Render Piattaforma Oceanografica CNR-ISMAR & Boe Ondametriche
  if (showOceanStations && oceanStations && oceanStations.length > 0) {
    for (const st of oceanStations) {
      const ox = sx(mx(st.lon));
      const oy = sy(my(st.lat));
      ctx.save();

      // Animated ocean wave concentric ripple circles (60 FPS)
      const wavePhase = (currentTimeSeconds * 1.5) % 3;
      const maxRipple = Math.max(16, 32 * (camera.s / 0.02));
      for (let r = 1; r <= 3; r++) {
        const rippleR = (((wavePhase + r) % 3) / 3) * maxRipple;
        const alpha = 1 - (rippleR / maxRipple);
        ctx.beginPath();
        ctx.arc(ox, oy, rippleR, 0, Math.PI * 2);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1;
        ctx.globalAlpha = alpha * 0.5;
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      if (st.type === 'OCEANOGRAPHIC_PLATFORM') {
        // Steel Lattice Tower / Platform icon
        ctx.fillStyle = '#0e7490';
        ctx.fillRect(ox - 7, oy - 7, 14, 14);
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(ox - 7, oy - 7, 14, 14);

        // Helipad circle & cross
        ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.beginPath();
        ctx.arc(ox, oy, 4, 0, Math.PI * 2);
        ctx.stroke();

        // Telemetry readout
        ctx.font = '700 8.5px "DM Mono", monospace';
        const tag = `CNR ISMAR · Hs ${st.waveHeightMeters ?? 'n.d.'} m · ${st.waterTempC ?? 'n.d.'} °C`;
        const tW = ctx.measureText(tag).width;
        ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.92)';
        ctx.fillRect(ox - tW / 2 - 4, oy - 22, tW + 8, 13);
        ctx.strokeStyle = isDark ? '#06b6d4' : '#0891b2';
        ctx.strokeRect(ox - tW / 2 - 4, oy - 22, tW + 8, 13);
        ctx.fillStyle = isDark ? '#22d3ee' : '#0891b2';
        ctx.fillText(tag, ox - tW / 2, oy - 12);
      } else {
        // Wave buoy floating marker
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(ox, oy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = '600 8px "DM Mono", monospace';
        ctx.fillStyle = isDark ? '#fbbf24' : '#b45309';
        ctx.fillText(st.waveHeightMeters === null ? st.name.slice(0, 26) : `Hs ${st.waveHeightMeters} m`, ox + 8, oy + 3);
      }

      ctx.restore();
    }
  }
}

export function drawCanalLimits(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showCanalLimits, canalSpeedLimits } = rc;
  // 25. Render Limiti di Velocità & Aree Blu (Canali)
  if (showCanalLimits && canalSpeedLimits && canalSpeedLimits.length > 0) {
    for (const limit of canalSpeedLimits) {
      if (!limit.path || limit.path.length < 2) continue;
      ctx.save();
      ctx.beginPath();
      limit.path.forEach((pt, idx) => {
        const px = sx(mx(pt[0]));
        const py = sy(my(pt[1]));
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      // Speed route line
      ctx.strokeStyle = limit.color;
      ctx.lineWidth = Math.max(3, 5 * (camera.s / 0.04));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.85;
      ctx.stroke();

      // Dashed center guideline
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Speedometer badge at midpoint
      if (camera.s > 0.03) {
        const midIdx = Math.floor(limit.path.length / 2);
        const midPt = limit.path[midIdx];
        const lx = sx(mx(midPt[0]));
        const ly = sy(my(midPt[1]));
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(lx, ly, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = limit.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 9px "DM Mono", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${limit.maxSpeedKmh}`, lx, ly);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
      }
      ctx.restore();
    }
  }
}

export function drawBridges(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showBridges, bridges, tideLevel } = rc;
  // 26. Render Franchi di Tiro Ponti & Altezze Marea
  if (showBridges && bridges && bridges.length > 0) {
    for (const b of bridges) {
      const bx = sx(mx(b.lon));
      const by = sy(my(b.lat));
      ctx.save();

      const liveClearance = b.clearanceCmZeroMarea - tideLevel;
      const isNavigable = liveClearance >= 160;

      // Bridge arch icon
      ctx.fillStyle = isNavigable ? '#06b6d4' : '#ef4444';
      ctx.beginPath();
      ctx.arc(bx, by, 5, Math.PI, 0, false); // Arch shape
      ctx.fill();
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      if (camera.s > 0.04) {
        ctx.font = 'bold 7.5px "DM Mono", monospace';
        ctx.fillStyle = isNavigable
          ? (isDark ? '#22d3ee' : '#0891b2')
          : (isDark ? '#f87171' : '#dc2626');
        ctx.fillText(`${b.bridgeName.split(' ')[1] || b.bridgeName} (${liveClearance}cm)`, bx + 7, by + 3);
      }
      ctx.restore();
    }
  }
}

export function drawGondolas(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showGondolas, gondolas } = rc;
  // 27. Render Traghetti da Parada & Stazi Gondole
  if (showGondolas && gondolas && gondolas.length > 0) {
    for (const g of gondolas) {
      const gx = sx(mx(g.lon));
      const gy = sy(my(g.lat));
      ctx.save();

      // If traghetto with crossing path, draw dotted crossing line
      if (g.crossingPath && g.crossingPath.length === 2) {
        const p1x = sx(mx(g.crossingPath[0][0]));
        const p1y = sy(my(g.crossingPath[0][1]));
        const p2x = sx(mx(g.crossingPath[1][0]));
        const p2y = sy(my(g.crossingPath[1][1]));
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Gondola badge
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(gx, gy, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Gondola letter glyph
      ctx.font = 'bold 7px "DM Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('G', gx, gy);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';

      if (camera.s > 0.045) {
        ctx.font = '600 8px "DM Mono", monospace';
        ctx.fillStyle = isDark ? '#d8b4fe' : '#7e22ce';
        ctx.fillText(g.type === 'TRAGHETTO_DA_PARADA' ? `Parada (€${g.priceEur})` : `Stazio (${g.activeGondolas})`, gx + 8, gy + 3);
      }
      ctx.restore();
    }
  }
}

export function drawDocks(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showDocks, docks } = rc;
  // 28. Render Rive d'Approdo Pubbliche & Merci
  if (showDocks && docks && docks.length > 0) {
    for (const d of docks) {
      const dx = sx(mx(d.lon));
      const dy = sy(my(d.lat));
      ctx.save();
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(dx, dy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Riva initial
      ctx.font = 'bold 7px "DM Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('R', dx, dy);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';

      if (camera.s > 0.04) {
        ctx.font = '600 8px "DM Mono", monospace';
        ctx.fillStyle = isDark ? '#60a5fa' : '#1d4ed8';
        ctx.fillText(`Riva Merci (${d.maxStayMinutes}m)`, dx + 8, dy + 3);
      }
      ctx.restore();
    }
  }
}

export function drawMarineWind(rc: RenderContext): void {
  const { ctx, cw, ch, isDark, sx, sy, mx, my, camera, showMarineWind, marineWindStations } = rc;
  // 31. Render Stazioni Vento Meteomarine & Bollettini METAR (Scirocco / Bora / ENAV)
  if (showMarineWind && marineWindStations && marineWindStations.length > 0) {
    for (const w of marineWindStations) {
      const wx = sx(mx(w.lon));
      const wy = sy(my(w.lat));

      // Culling visibilità canvas
      if (wx < -60 || wx > cw + 60 || wy < -60 || wy > ch + 60) continue;

      ctx.save();

      const isCritical = w.tidePushRisk === 'CRITICO' || w.tidePushRisk === 'ALTO';
      const isAirport = w.stationType === 'AEROPORTO';
      const isOffshore = w.stationType === 'PIATTAFORMA_OFFSHORE';

      // Colori per Dark mode e Light mode
      const primaryColor = isAirport
        ? (isDark ? '#38bdf8' : '#0284c7')
        : isCritical
        ? (isDark ? '#fb7185' : '#dc2626')
        : (isDark ? '#2dd4bf' : '#0d9488');

      const haloColor = isAirport
        ? (isDark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(2, 132, 199, 0.16)')
        : isCritical
        ? (isDark ? 'rgba(251, 113, 133, 0.25)' : 'rgba(220, 38, 38, 0.18)')
        : (isDark ? 'rgba(45, 212, 191, 0.22)' : 'rgba(13, 148, 136, 0.16)');

      // Halo esterno
      ctx.beginPath();
      ctx.arc(wx, wy, isCritical ? 14 : 11, 0, Math.PI * 2);
      ctx.fillStyle = haloColor;
      ctx.fill();

      // Cerchio base stazione
      ctx.beginPath();
      ctx.arc(wx, wy, 7, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? '#090d16' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Punto centrale
      ctx.beginPath();
      ctx.arc(wx, wy, 3, 0, Math.PI * 2);
      ctx.fillStyle = primaryColor;
      ctx.fill();

      // Freccia direzionale del vento
      const rad = (w.windDirectionDeg * Math.PI) / 180;
      const arrowLen = Math.min(30, Math.max(16, 12 + w.windSpeedKmh * 0.32));

      ctx.save();
      ctx.translate(wx, wy);
      ctx.rotate(rad);

      // Asta della freccia
      ctx.strokeStyle = primaryColor;
      ctx.fillStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -arrowLen);
      ctx.stroke();

      // Punta della freccia
      ctx.beginPath();
      ctx.moveTo(0, -arrowLen - 6);
      ctx.lineTo(4.5, -arrowLen + 2);
      ctx.lineTo(0, -arrowLen - 1);
      ctx.lineTo(-4.5, -arrowLen + 2);
      ctx.closePath();
      ctx.fill();

      // Barbe anemometriche
      if (w.windSpeedKnots >= 15) {
        ctx.beginPath();
        ctx.moveTo(0, -arrowLen + 6);
        ctx.lineTo(6, -arrowLen + 3);
        ctx.stroke();
      }
      if (w.windSpeedKnots >= 25) {
        ctx.beginPath();
        ctx.moveTo(0, -arrowLen + 11);
        ctx.lineTo(6, -arrowLen + 8);
        ctx.stroke();
      }

      ctx.restore();

      // Badge testuale ad alta leggibilità
      if (camera.s > 0.009) {
        const labelText = isAirport && w.metar
          ? `LIPZ METAR ${w.windSpeedKnots}kt (${w.metar.flightCategory})`
          : `${w.windDirection} ${w.windSpeedKmh}km/h (${w.windSpeedKnots}kt)`;

        const subText = isOffshore
          ? `CNR Piattaforma · Hs ${w.waveHeightMeters}m`
          : isAirport
          ? `RWY 04R crosswind ${w.metar?.crosswindKnots ?? 4}kt`
          : `${w.stationName.split('-')[0].trim()} · Hs ${w.waveHeightMeters}m`;

        ctx.font = 'bold 9px "DM Mono", monospace';
        const mainMetrics = ctx.measureText(labelText);
        const badgeW = mainMetrics.width + 12;
        const badgeH = camera.s > 0.02 ? 26 : 16;
        const pillX = wx + 12;
        const pillY = wy - (badgeH / 2);

        // Sfondo badge per contrasto perfetto in dark e light mode
        ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)';
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, badgeW, badgeH, 4);
        ctx.fill();
        ctx.stroke();

        // Testo
        ctx.fillStyle = primaryColor;
        ctx.fillText(labelText, pillX + 6, pillY + (camera.s > 0.02 ? 10 : 11));

        if (camera.s > 0.02) {
          ctx.font = '8px "DM Sans", sans-serif';
          ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
          ctx.fillText(subText, pillX + 6, pillY + 21);
        }
      }

      ctx.restore();
    }
  }
}
