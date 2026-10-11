import type { RenderContext } from './renderContext';

/**
 * Disegna sulla mappa i confini ufficiali del DBGT (Database Geotopografico del Comune di Venezia)
 * e le zone di tutela territoriale/patti territoriali quando il layer showGeoportale e attivo.
 */
export function drawGeoportale(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, cw, ch, showGeoportale, geoportaleData } = rc;
  if (!showGeoportale || !geoportaleData) return;

  const { municipalities, sestieri, tutelaZones } = geoportaleData;

  ctx.save();

  // 1. Poligoni delle 6 Municipalita ufficiali DBGT
  if (municipalities && municipalities.length > 0) {
    for (const m of municipalities) {
      if (!m.rings || m.rings.length === 0) continue;

      ctx.beginPath();
      for (const ring of m.rings) {
        if (ring.length === 0) continue;
        const [firstLon, firstLat] = ring[0];
        ctx.moveTo(sx(mx(firstLon)), sy(my(firstLat)));
        for (let i = 1; i < ring.length; i++) {
          const [lon, lat] = ring[i];
          ctx.lineTo(sx(mx(lon)), sy(my(lat)));
        }
        ctx.closePath();
      }

      // Sfondo traslucido tenue
      ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.06)' : 'rgba(100, 116, 139, 0.05)';
      ctx.fill();

      // Tratto perimetrale elegante a tratteggio
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.lineWidth = camera.s > 0.03 ? 1.5 : 1.0;
      ctx.stroke();
      ctx.setLineDash([]);

      // Etichetta baricentrica Municipalita (visibile a scala media/panoramica)
      if (m.centroid && camera.s > 0.008 && camera.s < 0.08) {
        const cx = sx(mx(m.centroid[0]));
        const cy = sy(my(m.centroid[1]));
        if (cx >= -60 && cx <= cw + 60 && cy >= -20 && cy <= ch + 20) {
          ctx.save();
          ctx.font = '600 11px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = isDark ? '#f1f5f9' : '#1e293b';
          ctx.shadowColor = isDark ? '#000000' : '#ffffff';
          ctx.shadowBlur = 4;
          ctx.fillText(m.name, cx, cy);

          if (m.population && camera.s > 0.015) {
            ctx.font = '400 9px system-ui, sans-serif';
            ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
            ctx.fillText(`${m.population.toLocaleString('it-IT')} ab. · ${m.areaKm2 ?? ''} km²`, cx, cy + 13);
          }
          ctx.restore();
        }
      }
    }
  }

  // 2. Sestieri del Centro Storico (visibili con zoom piu ravvicinato)
  if (sestieri && sestieri.length > 0 && camera.s >= 0.03) {
    for (const s of sestieri) {
      if (!s.centroid) continue;
      const sxPos = sx(mx(s.centroid[0]));
      const syPos = sy(my(s.centroid[1]));
      if (sxPos < -50 || sxPos > cw + 50 || syPos < -20 || syPos > ch + 20) continue;

      ctx.save();
      ctx.font = '600 10.5px "DM Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isDark ? '#e2e8f0' : '#334155';
      ctx.shadowColor = isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)';
      ctx.shadowBlur = 3;
      ctx.fillText(`SESTIER ${s.name.toUpperCase()}`, sxPos, syPos);

      if (s.population && camera.s > 0.05) {
        ctx.font = '500 8.5px system-ui, sans-serif';
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.fillText(`${s.population.toLocaleString('it-IT')} res. (${s.code})`, sxPos, syPos + 12);
      }
      ctx.restore();
    }
  }

  // 3. Zone di Tutela Speciale & Patti Territoriali
  if (tutelaZones && tutelaZones.length > 0 && camera.s >= 0.02) {
    for (const z of tutelaZones) {
      if (!z.centroid) continue;
      const zx = sx(mx(z.centroid[0]));
      const zy = sy(my(z.centroid[1]));
      if (zx < -50 || zx > cw + 50 || zy < -20 || zy > ch + 20) continue;

      // Cerchietto di indicazione tutela
      ctx.beginPath();
      ctx.arc(zx, zy, 4, 0, Math.PI * 2);
      ctx.fillStyle = z.level.includes('MASSIMA') ? '#e11d48' : '#0284c7';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (camera.s > 0.04) {
        ctx.save();
        ctx.font = '500 8.5px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
        ctx.fillText(z.name, zx + 6, zy + 3);
        ctx.restore();
      }
    }
  }

  ctx.restore();
}
