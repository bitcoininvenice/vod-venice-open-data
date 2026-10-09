// Layer di disegno della mappa estratti da MapEngine (cityLayers). Ogni funzione riceve il contesto del frame.
import type { RenderContext } from './renderContext';

export function drawCityAssets(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showCityAssets, fountains, accessibleBridges, veritasServices } = rc;
  // 13. Render City Assets (Fontanelle & Ponti Accessibili & Veritas)
  if (showCityAssets) {
    // Fountains
    if (fountains && fountains.length > 0) {
      for (const f of fountains) {
        const fx = sx(mx(f.lon));
        const fy = sy(my(f.lat));

        ctx.beginPath();
        ctx.arc(fx, fy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();
        ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (camera.s > 0.05) {
          ctx.font = '500 8.5px "DM Mono", monospace';
          ctx.fillStyle = isDark ? '#06b6d4' : '#0891b2';
          ctx.fillText(f.name, fx + 6, fy + 3);
        }
      }
    }

    // Accessible Bridges (Rampa)
    if (accessibleBridges && accessibleBridges.length > 0) {
      for (const b of accessibleBridges) {
        const bx = sx(mx(b.lon));
        const by = sy(my(b.lat));

        ctx.beginPath();
        ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
        ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        if (camera.s > 0.035) {
          ctx.font = '600 9px "DM Mono", monospace';
          ctx.fillStyle = isDark ? '#10b981' : '#047857';
          ctx.fillText(`${b.name} (Rampa)`, bx + 7, by + 3);
        }
      }
    }

    // Veritas Waste Boats
    if (veritasServices && veritasServices.length > 0) {
      for (const v of veritasServices) {
        const vx = sx(mx(v.lon));
        const vy = sy(my(v.lat));

        ctx.beginPath();
        ctx.arc(vx, vy, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#84cc16';
        ctx.fill();
        ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (camera.s > 0.035) {
          ctx.font = '500 8.5px "DM Mono", monospace';
          ctx.fillStyle = isDark ? '#84cc16' : '#4d7c0f';
          ctx.fillText(v.name, vx + 6, vy + 3);
        }
      }
    }
  }
}

export function drawParkings(rc: RenderContext): void {
  const { ctx, sx, sy, mx, my, camera, paletteTheme, showParkings, parkings } = rc;
  // 14. Render Certified Parkings (Piazzale Roma, Tronchetto & Mestre)
  if (showParkings && parkings && parkings.length > 0) {
    for (const p of parkings) {
      const px = sx(mx(p.lon));
      const py = sy(my(p.lat));

      const badgeCol = '#0284c7';

      ctx.save();
      ctx.font = '700 9.5px "DM Mono", monospace';
      const pTxt = camera.s > 0.02 ? `P · ${p.name} (${p.totalSpots} posti)` : `P · ${p.name}`;
      const pW = ctx.measureText(pTxt).width;

      ctx.fillStyle = paletteTheme === 'notte' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)';
      ctx.strokeStyle = badgeCol;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(px - pW / 2 - 5, py - 18, pW + 10, 16, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = badgeCol;
      ctx.fillText(pTxt, px - pW / 2, py - 6);
      ctx.restore();
    }
  }
}

export function drawAirQuality(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, paletteTheme, showAirQuality, airStations } = rc;
  // 15. Render ARPAV Air Quality Stations
  if (showAirQuality && airStations && airStations.length > 0) {
    for (const a of airStations) {
      const ax = sx(mx(a.lon));
      const ay = sy(my(a.lat));

      ctx.save();
      ctx.font = '600 9px "DM Mono", monospace';
      const aTxt = `ARPAV ${a.stationName} · PM10 ${a.pm10 ?? 'n.d.'} µg/m³ (media ${a.year})`;
      const aW = ctx.measureText(aTxt).width;

      ctx.fillStyle = paletteTheme === 'notte' ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.88)';
      ctx.strokeStyle = isDark ? '#10b981' : '#047857';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(ax - aW / 2 - 4, ay - 16, aW + 8, 15, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isDark ? '#10b981' : '#047857';
      ctx.fillText(aTxt, ax - aW / 2, ay - 5);
      ctx.restore();
    }
  }
}

export function drawPedestrianFlows(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, paletteTheme, showPedestrianFlows, pedestrianFlows } = rc;
  // 16. Render Smart Control Room Pedestrian Flow Counters
  if (showPedestrianFlows && pedestrianFlows && pedestrianFlows.length > 0) {
    for (const pf of pedestrianFlows) {
      const pfx = sx(mx(pf.lon));
      const pfy = sy(my(pf.lat));

      ctx.save();
      ctx.font = '700 9px "DM Mono", monospace';
      const pfTxt = pf.hourlyFlow != null
        ? `${pf.sensorName}: ${pf.hourlyFlow.toLocaleString()} p/h`
        : `Varco SCR: ${pf.sensorName}`;
      const pfW = ctx.measureText(pfTxt).width;

      ctx.fillStyle = paletteTheme === 'notte' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)';
      ctx.strokeStyle = isDark ? '#f43f5e' : '#be123c';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(pfx - pfW / 2 - 5, pfy - 16, pfW + 10, 15, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isDark ? '#f43f5e' : '#be123c';
      ctx.fillText(pfTxt, pfx - pfW / 2, pfy - 5);
      ctx.restore();
    }
  }
}

export function drawCameras(rc: RenderContext): void {
  const { ctx, cw, ch, isDark, sx, sy, mx, my, camera, showCameras, cameras } = rc;
  // 18b. Render Venice Cameras & Webcams (Anopticon Civic CCTV + Live Public Webcams)
  if (showCameras && cameras && cameras.length > 0) {
    for (const cam of cameras) {
      const cx = sx(mx(cam.lon));
      const cy = sy(my(cam.lat));
      if (cx < -60 || cx > cw + 60 || cy < -60 || cy > ch + 60) continue;

      ctx.save();

      if (cam.hasLiveFeed) {
        // Live Public Webcam (Cyan Glow & Pulse)
        const pulse = 10 + Math.sin(Date.now() / 240) * 3.5;

        // Optional field of view wedge/cone
        if (cam.bearingDeg !== undefined && camera.s > 0.02) {
          // bearing geografico (0° = nord, senso orario) -> angolo canvas (0 = est)
          const rad = ((cam.bearingDeg - 90) * Math.PI) / 180;
          const fovRad = ((cam.fovDeg || 80) * Math.PI) / 360;
          const coneLen = 32;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, coneLen, rad - fovRad, rad + fovRad);
          ctx.closePath();
          ctx.fillStyle = isDark ? 'rgba(6, 182, 212, 0.16)' : 'rgba(6, 182, 212, 0.22)';
          ctx.fill();
        }

        // Outer pulsing halo
        ctx.beginPath();
        ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.22)';
        ctx.fill();
        ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Inner pin
        ctx.beginPath();
        ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();
        ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Lens center dot
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Label tag on zoom
        if (camera.s > 0.035) {
          ctx.font = '700 8.5px "DM Mono", monospace';
          const label = `LIVE · ${cam.name}`;
          const lW = ctx.measureText(label).width;
          ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.90)' : 'rgba(255, 255, 255, 0.92)';
          ctx.beginPath();
          ctx.roundRect(cx - lW / 2 - 4, cy - 20, lW + 8, 13, 3);
          ctx.fill();
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
          ctx.fillText(label, cx - lW / 2, cy - 10);
        }
      } else {
        // CCTV Video Monitoring Camera (Anopticon)
        const isAnpr = cam.type === 'CCTV_ANPR';
        const pinColor = isAnpr ? '#e11d48' : (isDark ? '#94a3b8' : '#475569');

        // Direction tick if available
        if (cam.bearingDeg !== undefined && camera.s > 0.03) {
          const rad = ((cam.bearingDeg - 90) * Math.PI) / 180;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(rad) * 14, cy + Math.sin(rad) * 14);
          ctx.strokeStyle = pinColor;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([2, 2]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // CCTV Pin
        ctx.beginPath();
        ctx.arc(cx, cy, 3.8, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#1e293b' : '#f1f5f9';
        ctx.fill();
        ctx.strokeStyle = pinColor;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = pinColor;
        ctx.fill();

        // Label on high zoom
        if (camera.s > 0.055) {
          ctx.font = '600 7.5px "DM Mono", monospace';
          const label = `CCTV · ${cam.name}`;
          const lW = ctx.measureText(label).width;
          ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)';
          ctx.beginPath();
          ctx.roundRect(cx - lW / 2 - 3, cy - 16, lW + 6, 11, 2.5);
          ctx.fill();
          ctx.strokeStyle = pinColor;
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
          ctx.fillText(label, cx - lW / 2, cy - 8);
        }
      }

      ctx.restore();
    }
  }
}

export function drawBathingWaters(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showBathingWaters, bathingWaters } = rc;
  // 22. Render Acque di Balneazione (ARPAV)
  if (showBathingWaters && bathingWaters && bathingWaters.length > 0) {
    for (const bw of bathingWaters) {
      const bx = sx(mx(bw.lon));
      const by = sy(my(bw.lat));
      ctx.save();

      // Coastal lifesaver ring
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bx, by, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#0284c7' : '#0369a1';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Blue Flag badge
      if (bw.blueFlag) {
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (camera.s > 0.02) {
        ctx.font = '600 8px "DM Mono", monospace';
        ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
        ctx.fillText(bw.name.split('-')[1]?.trim() || bw.name, bx + 9, by + 3);
      }

      ctx.restore();
    }
  }
}

export function drawTrees(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showTrees, trees } = rc;
  // 23. Render Verde Urbano & Alberi Monumentali
  if (showTrees && trees && trees.length > 0) {
    for (const tr of trees) {
      const tx = sx(mx(tr.lon));
      const ty = sy(my(tr.lat));
      ctx.save();

      const canopyR = Math.max(5, Math.min(18, ((tr.heightMeters ?? 12) / 2) * (camera.s / 0.02)));
      // Tree foliage canopy
      ctx.beginPath();
      ctx.arc(tx, ty, canopyR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.50)';
      ctx.fill();
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Tree trunk
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(tx, ty, 2, 0, Math.PI * 2);
      ctx.fill();

      if (camera.s > 0.04) {
        ctx.font = '600 8px "DM Mono", monospace';
        ctx.fillStyle = isDark ? '#4ade80' : '#15803d';
        ctx.fillText(tr.commonName, tx + canopyR + 3, ty + 3);
      }

      ctx.restore();
    }
  }
}

export function drawEvCharging(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showEvCharging, evCharging } = rc;
  // 24a. Render Colonnine Ricarica EV (Hub Piazzale Roma & Tronchetto)
  if (showEvCharging && evCharging && evCharging.length > 0) {
    for (const ev of evCharging) {
      const ex = sx(mx(ev.lon));
      const ey = sy(my(ev.lat));
      ctx.save();
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(ex, ey, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // EV badge text
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 6.5px "DM Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('EV', ex, ey);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';

      if (camera.s > 0.035) {
        ctx.font = '600 8px "DM Mono", monospace';
        ctx.fillStyle = isDark ? '#fde047' : '#a16207';
        ctx.fillText(`${ev.availableSockets}/${ev.totalSockets} EV`, ex + 8, ey + 3);
      }
      ctx.restore();
    }
  }
}

export function drawWifiHotspots(rc: RenderContext): void {
  const { ctx, cw, ch, isDark, sx, sy, mx, my, camera, showWifiHotspots, wifiHotspots } = rc;
  // 24b. Render Hotspot Wi-Fi VeniceConnected (Comune di Venezia / Venis)
  if (showWifiHotspots && wifiHotspots && wifiHotspots.length > 0) {
    for (const wf of wifiHotspots) {
      const wx = sx(mx(wf.lon));
      const wy = sy(my(wf.lat));
      ctx.save();
      if (wx < -10 || wx > cw + 10 || wy < -10 || wy > ch + 10) {
        ctx.restore();
        continue;
      }
      ctx.fillStyle = wf.status === 'ATTIVO' ? '#6366f1' : '#64748b';
      ctx.beginPath();
      ctx.arc(wx, wy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (camera.s > 0.05) {
        ctx.font = '600 8px "DM Mono", monospace';
        ctx.fillStyle = isDark ? '#818cf8' : '#4338ca';
        ctx.fillText(`Wi-Fi · ${wf.name.slice(0, 28)}`, wx + 7, wy + 3);
      }
      ctx.restore();
    }
  }
}

export function drawTrains(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showTrains, liveTrains } = rc;
  // 32. Render Treni Live su Ponte della Libertà & RFI
  if (showTrains && liveTrains && liveTrains.length > 0) {
    for (const tr of liveTrains) {
      const tx = sx(mx(tr.lon));
      const ty = sy(my(tr.lat));
      ctx.save();

      // Sleek high-speed / regional / cargo train body
      ctx.fillStyle =
        tr.trainType === 'FRECCIAROSSA'
          ? '#dc2626'
          : tr.trainType === 'ITALO'
          ? '#991b1b'
          : tr.trainType === 'MERCITALIA_CARGO'
          ? '#15803d'
          : tr.trainType === 'EUROCITY' || tr.trainType === 'RAILJET'
          ? '#7c3aed'
          : '#2563eb';
      ctx.beginPath();
      ctx.roundRect(tx - 13, ty - 5, 26, 10, 4);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Headlight glow
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(tx + 13, ty, 2.5, 0, Math.PI * 2);
      ctx.fill();

      if (camera.s > 0.02) {
        ctx.font = 'bold 8px "DM Mono", monospace';
        ctx.fillStyle = isDark ? '#f87171' : '#b91c1c';
        ctx.fillText(tr.trainNumber, tx - 14, ty - 8);
      }
      ctx.restore();
    }
  }
}

export function drawWasteBoats(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showWasteBoats, wasteBoats } = rc;
  // 33. Render Battelli Ecologici Veritas
  if (showWasteBoats && wasteBoats && wasteBoats.length > 0) {
    for (const wb of wasteBoats) {
      const bx = sx(mx(wb.lon));
      const by = sy(my(wb.lat));
      ctx.save();

      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.arc(bx, by, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Veritas boat initial
      ctx.font = 'bold 7px "DM Sans", sans-serif';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('V', bx, by);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';

      if (camera.s > 0.04) {
        ctx.font = '600 7.5px "DM Mono", monospace';
        ctx.fillStyle = isDark ? '#a3e635' : '#4d7c0f';
        ctx.fillText(wb.boatCode, bx + 7, by + 3);
      }
      ctx.restore();
    }
  }
}

export function drawNizioleti(rc: RenderContext): void {
  const { ctx, sx, sy, mx, my, camera, showNizioleti, nizioleti } = rc;
  // 34. Render Nizioleti Tradizionali & Toponomastica
  if (showNizioleti && nizioleti && nizioleti.length > 0) {
    for (const niz of nizioleti) {
      const nx = sx(mx(niz.lon));
      const ny = sy(my(niz.lat));
      ctx.save();

      // Characteristic Venetian white plaque with black border
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(nx - 4, ny - 4, 8, 8);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(nx - 4, ny - 4, 8, 8);

      if (camera.s > 0.05) {
        ctx.font = 'bold 8px serif';
        ctx.fillStyle = '#0f172a';
        const label = `${niz.streetName} (${niz.civicNumber})`;
        const tW = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(nx + 6, ny - 6, tW + 6, 12);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(nx + 6, ny - 6, tW + 6, 12);
        ctx.fillStyle = '#000000';
        ctx.fillText(label, nx + 9, ny + 3);
      }
      ctx.restore();
    }
  }
}

export function drawWells(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showWells, wells } = rc;
  // 35. Render Vere da Pozzo Storiche
  if (showWells && wells && wells.length > 0) {
    for (const w of wells) {
      const wx = sx(mx(w.lon));
      const wy = sy(my(w.lat));
      ctx.save();

      // Well stone ring
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(wx, wy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Hole in the center
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(wx, wy, 1.8, 0, Math.PI * 2);
      ctx.fill();

      if (camera.s > 0.05) {
        ctx.font = '600 7.5px "DM Mono", monospace';
        ctx.fillStyle = isDark ? '#fbbf24' : '#b45309';
        ctx.fillText(w.name.split(' ')[4] || w.name, wx + 7, wy + 3);
      }
      ctx.restore();
    }
  }
}

export function drawBellTowers(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showBellTowers, bellTowers } = rc;
  // 36. Render Campanili & Torri Pendenti
  if (showBellTowers && bellTowers && bellTowers.length > 0) {
    for (const bt of bellTowers) {
      const bx = sx(mx(bt.lon));
      const by = sy(my(bt.lat));
      ctx.save();

      ctx.fillStyle = bt.isLeaning ? '#f97316' : '#ea580c';
      ctx.beginPath();
      ctx.arc(bx, by, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Campanile badge 'C'
      ctx.font = 'bold 7px "DM Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('C', bx, by);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';

      if (camera.s > 0.03) {
        ctx.font = 'bold 8px "DM Mono", monospace';
        ctx.fillStyle = isDark ? '#fdba74' : '#c2410c';
        ctx.fillText(bt.isLeaning ? `${bt.name} (Pendente ${bt.tiltAngleDeg}°)` : bt.name, bx + 8, by + 3);
      }
      ctx.restore();
    }
  }
}

export function drawFortresses(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showFortresses, fortressIslands } = rc;
  // 37. Render Fortezze Lagunari & Isole Storiche
  if (showFortresses && fortressIslands && fortressIslands.length > 0) {
    for (const fort of fortressIslands) {
      const fx = sx(mx(fort.lon));
      const fy = sy(my(fort.lat));
      ctx.save();

      // Star fort bastion badge
      ctx.fillStyle = '#78716c';
      ctx.beginPath();
      ctx.arc(fx, fy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#e7e5e4' : '#44403c';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Fortress badge 'F'
      ctx.font = 'bold 8px "DM Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('F', fx, fy);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';

      if (camera.s > 0.02) {
        ctx.font = 'bold 8.5px "DM Mono", monospace';
        ctx.fillStyle = isDark ? '#d6d3d1' : '#57534e';
        ctx.fillText(fort.name, fx + 10, fy + 3);
      }
      ctx.restore();
    }
  }
}

export function drawEmergencyDocks(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showEmergencyDocks, emergencyDocks } = rc;
  // 38. Render Rete Sanitaria SUEM 118, DAE & Farmacie
  if (showEmergencyDocks && emergencyDocks && emergencyDocks.length > 0) {
    for (const ed of emergencyDocks) {
      const ex = sx(mx(ed.lon));
      const ey = sy(my(ed.lat));
      ctx.save();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(ex, ey, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // SUEM Medical cross
      ctx.font = 'bold 8px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', ex, ey);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';

      if (camera.s > 0.035) {
        ctx.font = 'bold 8px "DM Mono", monospace';
        ctx.fillStyle = isDark ? '#f87171' : '#b91c1c';
        ctx.fillText(`SUEM 118 ${ed.dockCode}`, ex + 8, ey + 3);
      }
      ctx.restore();
    }
  }
}

export function drawDae(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showDae, daeList } = rc;
  if (showDae && daeList && daeList.length > 0) {
    for (const dae of daeList) {
      const dx = sx(mx(dae.lon));
      const dy = sy(my(dae.lat));
      ctx.save();

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(dx, dy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 1;
      ctx.stroke();

      // DAE cross
      ctx.font = 'bold 7px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', dx, dy);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';

      if (camera.s > 0.05) {
        ctx.font = '600 7.5px "DM Mono", monospace';
        ctx.fillStyle = isDark ? '#34d399' : '#047857';
        ctx.fillText('DAE', dx + 7, dy + 3);
      }
      ctx.restore();
    }
  }
}

export function drawPharmacies(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showPharmacies, pharmacies } = rc;
  if (showPharmacies && pharmacies && pharmacies.length > 0) {
    for (const ph of pharmacies) {
      const px = sx(mx(ph.lon));
      const py = sy(my(ph.lat));
      ctx.save();

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Pharmacy green cross
      ctx.font = 'bold 7px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', px, py);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';

      if (camera.s > 0.05) {
        ctx.font = '600 7.5px "DM Mono", monospace';
        ctx.fillStyle = isDark ? '#4ade80' : '#15803d';
        ctx.fillText(ph.name, px + 7, py + 3);
      }
      ctx.restore();
    }
  }
}
