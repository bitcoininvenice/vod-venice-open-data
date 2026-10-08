// Layer di disegno della mappa estratti da MapEngine (environmentLayers). Ogni funzione riceve il contesto del frame.
import type { RenderContext } from './renderContext';
import { getLiveSatellite } from './mapHelpers';

export function drawSatellites(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, currentTimeSeconds, selectedSatellite, paletteTheme, showSatellites, satellites } = rc;
  // 18. Render Earth Observation Satellites (Copernicus Sentinel-1/2, COSMO-SkyMed, ISS, Landsat, Galileo)
  if (showSatellites && satellites && satellites.length > 0) {
    for (const sat of satellites) {
      const live = getLiveSatellite(sat, currentTimeSeconds);
      const satX = sx(mx(live.lon));
      const satY = sy(my(live.lat));
      const isSelected = selectedSatellite?.id === sat.id;

      const satCol = sat.type === 'SAR_RADAR'
        ? (isDark ? '#e879f9' : '#a21caf')
        : sat.type === 'OPTICAL'
        ? (isDark ? '#38bdf8' : '#0284c7')
        : sat.type === 'SPACE_STATION'
        ? (isDark ? '#fbbf24' : '#b45309')
        : sat.type === 'NAVIGATION'
        ? (isDark ? '#34d399' : '#047857')
        : (isDark ? '#a78bfa' : '#6d28d9');

      // 1. Draw Orbital Ground Track across the Lagoon & Adriatic
      if (live.track.length > 1) {
        ctx.save();
        ctx.beginPath();
        live.track.forEach((pt, idx) => {
          const px = sx(mx(pt[0]));
          const py = sy(my(pt[1]));
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.strokeStyle = isSelected ? (isDark ? '#f0abfc' : '#a21caf') : satCol;
        ctx.lineWidth = isSelected ? 2.5 : 1.2;
        ctx.setLineDash(isSelected ? [6, 4] : [4, 6]);
        ctx.globalAlpha = isSelected ? 0.85 : 0.45;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1.0;
        ctx.restore();
      }

      // 2. Draw Radar/Sensor Swath Footprint projection on ground
      const swathRadius = Math.max(35, Math.min(180, (sat.swathWidthKm / 2.5) * (camera.s / 0.02)));
      ctx.save();
      ctx.translate(satX, satY);
      ctx.rotate((live.heading * Math.PI) / 180);

      // Swath scanning polygon
      ctx.beginPath();
      ctx.ellipse(0, 0, swathRadius * 0.45, swathRadius, 0, 0, Math.PI * 2);
      ctx.fillStyle = isSelected
        ? 'rgba(232, 121, 249, 0.16)'
        : sat.type === 'SAR_RADAR'
        ? 'rgba(232, 121, 249, 0.07)'
        : 'rgba(56, 189, 248, 0.06)';
      ctx.fill();
      ctx.strokeStyle = isSelected ? (isDark ? '#e879f9' : '#a21caf') : satCol;
      ctx.lineWidth = isSelected ? 1.5 : 0.8;
      ctx.setLineDash([3, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Satellite Icon Silhouette
      // Central satellite bus
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3.5, -4, 7, 8);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.strokeRect(-3.5, -4, 7, 8);

      // Golden Multi-layer thermal insulation core
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-2, -2.5, 4, 5);

      // Solar panel array wings (Left & Right)
      // Solar panel 1 (Left wing)
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-16, -3, 11, 6);
      ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(-16, -3, 11, 6);
      // Solar panel grid lines
      ctx.beginPath();
      ctx.moveTo(-10.5, -3);
      ctx.lineTo(-10.5, 3);
      ctx.stroke();

      // Solar panel 2 (Right wing)
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(5, -3, 11, 6);
      ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(5, -3, 11, 6);
      ctx.beginPath();
      ctx.moveTo(10.5, -3);
      ctx.lineTo(10.5, 3);
      ctx.stroke();

      // Radar SAR Antenna / Nadir Optical Sensor Boom
      if (sat.type === 'SAR_RADAR') {
        ctx.strokeStyle = isDark ? '#e879f9' : '#a21caf';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.lineTo(0, 9);
        ctx.stroke();
        // Reflector/feed
        ctx.beginPath();
        ctx.arc(0, 9.5, 2.5, 0, Math.PI);
        ctx.stroke();
      } else {
        ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
        ctx.beginPath();
        ctx.arc(0, 5, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // 4. Satellite Label Tag
      if (camera.s > 0.012 || isSelected) {
        ctx.save();
        ctx.font = '700 9px "DM Mono", monospace';
        const satLabel = `${sat.name.split('(')[0].trim()} · ${sat.altitudeKm}km`;
        const sW = ctx.measureText(satLabel).width;

        ctx.fillStyle = paletteTheme === 'notte' ? 'rgba(15, 23, 42, 0.90)' : 'rgba(255, 255, 255, 0.92)';
        ctx.beginPath();
        ctx.roundRect(satX - sW / 2 - 4, satY - 22, sW + 8, 14, 4);
        ctx.fill();
        ctx.strokeStyle = isSelected ? (isDark ? '#f0abfc' : '#a21caf') : satCol;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = isSelected ? (isDark ? '#f0abfc' : '#a21caf') : satCol;
        ctx.fillText(satLabel, satX - sW / 2, satY - 12);

        // Subtext readout
        if (isSelected || camera.s > 0.03) {
          ctx.font = '600 8px "DM Mono", monospace';
          ctx.fillStyle = isDark ? '#e2e8f0' : '#475569';
          ctx.fillText(`${sat.resolution} · ${sat.operator.split('/')[0].trim()}`, satX - sW / 2, satY + 18);
        }
        ctx.restore();
      }
    }
  }
}

export function drawSubsidence(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showSubsidence, subsidencePoints } = rc;
  // 29. Render Subsidenza InSAR (Copernicus EGMS)
  if (showSubsidence && subsidencePoints && subsidencePoints.length > 0) {
    for (const sub of subsidencePoints) {
      const sxPos = sx(mx(sub.lon));
      const syPos = sy(my(sub.lat));
      ctx.save();

      // Pulsating displacement circle
      const rateColor = sub.velocityMmYear < -2.0
        ? (isDark ? '#f43f5e' : '#be123c')
        : (isDark ? '#fb923c' : '#c2410c');
      ctx.fillStyle = rateColor;
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(sxPos, syPos, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1.0;
      ctx.beginPath();
      ctx.arc(sxPos, syPos, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      if (camera.s > 0.03) {
        ctx.font = 'bold 8px "DM Mono", monospace';
        ctx.fillStyle = rateColor;
        ctx.fillText(`${sub.velocityMmYear} mm/a`, sxPos + 7, syPos + 3);
      }
      ctx.restore();
    }
  }
}

export function drawMorphology(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showMorphology, lagoonMorphology } = rc;
  // 30. Render Morfologia Barene & Velme (Natura 2000)
  if (showMorphology && lagoonMorphology && lagoonMorphology.length > 0) {
    for (const morph of lagoonMorphology) {
      if (!morph.coordinates || morph.coordinates.length < 3) continue;
      ctx.save();
      ctx.beginPath();
      morph.coordinates.forEach((pt, idx) => {
        const px = sx(mx(pt[0]));
        const py = sy(my(pt[1]));
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fillStyle = morph.type === 'BARENA_NATURALE' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(14, 165, 233, 0.20)';
      ctx.fill();
      ctx.strokeStyle = isDark ? '#10b981' : '#047857';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center label
      const cx = sx(mx(morph.center[0]));
      const cy = sy(my(morph.center[1]));
      if (camera.s > 0.02) {
        ctx.font = 'bold 8.5px "DM Mono", monospace';
        ctx.fillStyle = isDark ? '#34d399' : '#047857';
        ctx.fillText(`${morph.name} (${morph.areaHectares}ha)`, cx - 30, cy);
      }
      ctx.restore();
    }
  }
}

export function drawHeatIslands(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showHeatIslands, heatIslands } = rc;
  // 39. Render Isole di Calore / LST Satellitare Copernicus
  if (showHeatIslands && heatIslands && heatIslands.length > 0) {
    for (const hi of heatIslands) {
      const hx = sx(mx(hi.lon));
      const hy = sy(my(hi.lat));
      ctx.save();

      const isHot = hi.coolingEffect === 'ISOLA_DI_CALORE';
      const rad = Math.max(14, 28 * (camera.s / 0.03));

      // Radial gradient heatmap blob
      const grad = ctx.createRadialGradient(hx, hy, 2, hx, hy, rad);
      if (isHot) {
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
        grad.addColorStop(0.6, 'rgba(249, 115, 22, 0.25)');
        grad.addColorStop(1, 'rgba(249, 115, 22, 0.0)');
      } else {
        grad.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
        grad.addColorStop(0.6, 'rgba(14, 165, 233, 0.25)');
        grad.addColorStop(1, 'rgba(14, 165, 233, 0.0)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(hx, hy, rad, 0, Math.PI * 2);
      ctx.fill();

      if (camera.s > 0.02) {
        ctx.font = 'bold 8px "DM Mono", monospace';
        ctx.fillStyle = isHot ? (isDark ? '#f87171' : '#b91c1c') : (isDark ? '#38bdf8' : '#0284c7');
        ctx.fillText(`${hi.surfaceTempCelsius}°C (${hi.airTempDelta > 0 ? '+' : ''}${hi.airTempDelta}°C)`, hx - 20, hy);
      }
      ctx.restore();
    }
  }
}

export function drawLagoonWater(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showLagoonWater, lagoonWaterQuality } = rc;
  // 40. Render Acque Lagunari ARPAV (Dati Sonda Multiparametrici)
  if (showLagoonWater && lagoonWaterQuality && lagoonWaterQuality.length > 0) {
    for (const wq of lagoonWaterQuality) {
      const wx = sx(mx(wq.lon));
      const wy = sy(my(wq.lat));
      ctx.save();

      // Pulsing halo in cyan
      const pulse = (Math.sin(Date.now() / 600 + wq.lat * 10) + 1) / 2;
      ctx.fillStyle = isDark ? 'rgba(6, 182, 212, 0.25)' : 'rgba(2, 132, 199, 0.25)';
      ctx.beginPath();
      ctx.arc(wx, wy, 10 + pulse * 6, 0, Math.PI * 2);
      ctx.fill();

      // Station dot
      ctx.fillStyle = isDark ? '#06b6d4' : '#0284c7';
      ctx.beginPath();
      ctx.arc(wx, wy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Water quality initial 'W'
      ctx.font = 'bold 7px "DM Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('W', wx, wy);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';

      if (camera.s > 0.02) {
        ctx.font = 'bold 8px "DM Mono", monospace';
        ctx.fillStyle = isDark ? '#22d3ee' : '#0369a1';
        ctx.fillText(`${wq.salinityPsu} PSU · ${wq.waterTempCelsius}°C`, wx + 8, wy + 3);
      }
      ctx.restore();
    }
  }
}

export function drawAccommodations(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showAccommodations, touristAccommodations } = rc;
  // 41. Render Strutture Ricettive & Overtourism (Regione del Veneto)
  if (showAccommodations && touristAccommodations && touristAccommodations.length > 0) {
    for (const acc of touristAccommodations) {
      const ax = sx(mx(acc.lon));
      const ay = sy(my(acc.lat));
      ctx.save();

      // Heatmap zone circle scaled by beds
      const baseRadius = Math.max(16, 26 * (camera.s / 0.03));
      const isCritical = acc.densityCategory === 'CRITICA';
      const grad = ctx.createRadialGradient(ax, ay, 2, ax, ay, baseRadius);
      if (isCritical) {
        grad.addColorStop(0, 'rgba(236, 72, 153, 0.50)');
        grad.addColorStop(0.7, 'rgba(217, 70, 239, 0.25)');
        grad.addColorStop(1, 'rgba(217, 70, 239, 0.0)');
      } else {
        grad.addColorStop(0, 'rgba(168, 85, 247, 0.45)');
        grad.addColorStop(0.7, 'rgba(147, 51, 234, 0.20)');
        grad.addColorStop(1, 'rgba(147, 51, 234, 0.0)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ax, ay, baseRadius, 0, Math.PI * 2);
      ctx.fill();

      // Center core icon
      ctx.fillStyle = isCritical ? '#ec4899' : '#a855f7';
      ctx.beginPath();
      ctx.arc(ax, ay, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Hotel initial 'H'
      ctx.font = 'bold 7px "DM Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('H', ax, ay);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';

      if (camera.s > 0.02) {
        ctx.font = 'bold 8px "DM Mono", monospace';
        ctx.fillStyle = isCritical ? (isDark ? '#f472b6' : '#be185d') : (isDark ? '#c084fc' : '#7e22ce');
        ctx.fillText(`${acc.totalBeds.toLocaleString()} letti (${acc.bedsPerResidentRatio}x res)`, ax + 9, ay + 3);
      }
      ctx.restore();
    }
  }
}

export function drawBikeRoutes(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showBikeRoutes, regionalBikeRoutes } = rc;
  // 42. Render Ciclovia delle Isole di Venezia
  if (showBikeRoutes && regionalBikeRoutes && regionalBikeRoutes.length > 0) {
    for (const br of regionalBikeRoutes) {
      if (!br.path || br.path.length < 2) continue;
      ctx.save();
      ctx.strokeStyle = isDark ? '#10b981' : '#047857';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      br.path.forEach((pt, idx) => {
        const px = sx(mx(pt[0]));
        const py = sy(my(pt[1]));
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Start & End markers
      const startPt = br.path[0];
      const endPt = br.path[br.path.length - 1];
      const sxStart = sx(mx(startPt[0]));
      const syStart = sy(my(startPt[1]));
      const sxEnd = sx(mx(endPt[0]));
      const syEnd = sy(my(endPt[1]));

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(sxStart, syStart, 4.5, 0, Math.PI * 2);
      ctx.arc(sxEnd, syEnd, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Bike Route Label
      const midPt = br.path[Math.floor(br.path.length / 2)];
      const mxMid = sx(mx(midPt[0]));
      const myMid = sy(my(midPt[1]));
      if (camera.s > 0.015) {
        ctx.font = 'bold 8.5px "DM Mono", monospace';
        ctx.fillStyle = isDark ? '#34d399' : '#065f46';
        ctx.fillText(`${br.routeName} (${br.lengthKm} km)`, mxMid + 6, myMid - 4);
      }
      ctx.restore();
    }
  }
}

export function drawPollenStations(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showPollenStations, pollenMonitoringStations } = rc;
  // 43. Render Bollettino Pollini ARPAV
  if (showPollenStations && pollenMonitoringStations && pollenMonitoringStations.length > 0) {
    for (const pol of pollenMonitoringStations) {
      const px = sx(mx(pol.lon));
      const py = sy(my(pol.lat));
      ctx.save();

      const isHigh = pol.overallAllergyRisk === 'ALTO';
      ctx.fillStyle = isHigh ? '#f59e0b' : '#84cc16';
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Pollen initial 'P'
      ctx.font = 'bold 7px "DM Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', px, py);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';

      if (camera.s > 0.02) {
        ctx.font = 'bold 8px "DM Mono", monospace';
        ctx.fillStyle = isHigh ? (isDark ? '#fbbf24' : '#b45309') : (isDark ? '#a3e635' : '#4d7c0f');
        ctx.fillText(`Pollini: Rischio ${pol.overallAllergyRisk}`, px + 8, py + 3);
      }
      ctx.restore();
    }
  }
}

export function drawTributaries(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showTributaries, lagoonTributaryRivers } = rc;
  // 44. Render Fiumi Tributari & Bacino Scolante
  if (showTributaries && lagoonTributaryRivers && lagoonTributaryRivers.length > 0) {
    for (const riv of lagoonTributaryRivers) {
      if (!riv.path || riv.path.length < 2) continue;
      ctx.save();
      ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      riv.path.forEach((pt, idx) => {
        const px = sx(mx(pt[0]));
        const py = sy(my(pt[1]));
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Mouth delta point
      const mouthPt = riv.path[riv.path.length - 1];
      const mxMouth = sx(mx(mouthPt[0]));
      const myMouth = sy(my(mouthPt[1]));
      ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
      ctx.beginPath();
      ctx.arc(mxMouth, myMouth, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      if (camera.s > 0.015) {
        ctx.font = 'bold 8px "DM Mono", monospace';
        ctx.fillStyle = isDark ? '#7dd3fc' : '#0369a1';
        ctx.fillText(`${riv.riverName} (${riv.avgFlowM3s} m³/s)`, mxMouth + 8, myMouth + 3);
      }
      ctx.restore();
    }
  }
}
