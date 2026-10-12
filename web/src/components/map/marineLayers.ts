// Layer meteo-marini: stazioni oceanografiche e vento sul mare.
import type { RenderContext } from './renderContext';

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

        const wave = w.waveHeightMeters != null ? ` · Hs ${w.waveHeightMeters} m` : '';
        const crosswind = w.metar?.crosswindKnots;
        const subText = isOffshore
          ? `${rc.t('ui.mapLabels.offshorePlatform')}${wave}`
          : isAirport
          ? (crosswind != null ? rc.t('ui.mapLabels.crosswind', { kt: crosswind }) : '')
          : `${w.stationName.split('-')[0].trim()}${wave}`;

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
