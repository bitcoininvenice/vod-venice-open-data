// Layer dei canali: segnalamenti, limiti di velocità, ponti, gondole e approdi.
import type { RenderContext } from './renderContext';
import { effectiveSpeedLimit, speedColor } from '@/lib/waterSpeedLimits';

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

export function drawCanalLimits(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, cw, ch, showCanalLimits, canalSpeedLimits, tide } = rc;
  // Limiti di velocità dagli atti ufficiali sui tracciati OSM; con l'acqua alta valgono le regole dell'art. 3
  if (!showCanalLimits || !canalSpeedLimits || canalSpeedLimits.length === 0) return;
  const tideCm = tide.lagoonTideCm;
  const width = Math.max(2, Math.min(7, 2 + 60 * camera.s));
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const limit of canalSpeedLimits) {
    if (limit.path.length < 2) continue;
    const eff = effectiveSpeedLimit(limit, tideCm);
    const pts = limit.path.map(([lon, lat]) => [sx(mx(lon)), sy(my(lat))] as const);
    if (pts.every(([x, y]) => x < -40 || y < -40 || x > cw + 40 || y > ch + 40)) continue;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.strokeStyle = speedColor(eff.kmh, isDark);
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = width;
    // circolazione a motore vietata per la marea: tratteggio
    ctx.setLineDash(eff.noMotor ? [6, 5] : []);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // valore al centro del tratto, da vicino
    if (camera.s > 0.06 && pts.length >= 2) {
      const [lx, ly] = pts[Math.floor(pts.length / 2)];
      const label = eff.noMotor ? '⛔' : `${eff.kmh}`;
      ctx.beginPath();
      ctx.arc(lx, ly, 8.5, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? '#0f172a' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = speedColor(eff.kmh, isDark);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = 'bold 8.5px "DM Mono", monospace';
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, lx, ly + 0.5);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
    }
  }
  ctx.restore();
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
      ctx.fillText(rc.t('ui.mapLabels.gondolaInitial'), gx, gy);
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
      ctx.fillText(rc.t('ui.mapLabels.dockInitial'), dx, dy);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';

      if (camera.s > 0.04) {
        ctx.font = '600 8px "DM Mono", monospace';
        ctx.fillStyle = isDark ? '#60a5fa' : '#1d4ed8';
        ctx.fillText(rc.t('ui.mapLabels.freightDock', { min: d.maxStayMinutes }), dx + 8, dy + 3);
      }
      ctx.restore();
    }
  }
}
