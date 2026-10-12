// Layer della marea: paratie del MOSE e percorsi su passerelle (le correnti sono in currentFlow.ts).
import type { RenderContext } from './renderContext';
import { MOSE_GATES } from '@/lib/moseGates';
import { PASSERELLE_MIN_THRESHOLD_CM, isPasserellaExpected } from '@/lib/passerelle';
import { prefersReducedMotion } from './mapHelpers';

export function drawMose(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showMose, tide } = rc;
  const dynamicPhase = tide.moseStatus;
  const isGateRaised = dynamicPhase !== 'ABBASSATO';
  // Le paratie compaiono da sole quando sono (o si stimano) alzate
  if (!showMose && !isGateRaised) return;

  const dynamicProgress = tide.moseLiftProgress;
  const time = Date.now() / 1000;
  const reduced = prefersReducedMotion();

  MOSE_GATES.forEach((gate, gateIdx) => {
    // Coordinate dei due estremi attraverso la bocca di porto
    const sLon = gate.startLon ?? gate.lon - 0.003;
    const sLat = gate.startLat ?? gate.lat + 0.003;
    const eLon = gate.endLon ?? gate.lon + 0.003;
    const eLat = gate.endLat ?? gate.lat - 0.003;

    const x1 = sx(mx(sLon));
    const y1 = sy(my(sLat));
    const x2 = sx(mx(eLon));
    const y2 = sy(my(eLat));

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 2) return;

    const ux = dx / len;
    const uy = dy / len;
    // Normale che punta verso l'Adriatico (est / mare aperto, nx > 0)
    let nx = -uy;
    let ny = ux;
    if (nx < 0) {
      nx = -nx;
      ny = -ny;
    }

    ctx.save();
    if (tide.moseBasis === 'forecast') ctx.globalAlpha = 0.6;

    if (isGateRaised) {
      // 1. ALONE DI DIFESA LAGUNARE: Velo calmo e protetto sul versante laguna (-nx, -ny)
      const haloWidth = Math.max(4.0, Math.min(8.0, 3.0 + 35 * camera.s)) * dynamicProgress;
      if (haloWidth > 1) {
        ctx.beginPath();
        ctx.moveTo(x1 - nx * 3, y1 - ny * 3);
        ctx.lineTo(x2 - nx * 3, y2 - ny * 3);
        ctx.strokeStyle = isDark ? 'rgba(16, 185, 129, 0.28)' : 'rgba(5, 150, 105, 0.20)';
        ctx.lineWidth = haloWidth;
        ctx.lineCap = 'butt';
        ctx.stroke();
      }

      // 2. FRANGIFLUTTI E MOTO ONDOSO ADRIATICO: Schiuma fine e increspatura sul lato mare (+nx, +ny)
      const wavePulse = reduced ? 0.6 : (0.45 + 0.35 * Math.sin(time * 3.2 + gateIdx * 1.8));
      const foamOffset = Math.max(2.4, Math.min(4.5, 2.0 + 15 * camera.s));
      ctx.beginPath();
      ctx.moveTo(x1 + nx * foamOffset, y1 + ny * foamOffset);
      ctx.lineTo(x2 + nx * foamOffset, y2 + ny * foamOffset);
      ctx.strokeStyle = `rgba(255, 255, 255, ${(wavePulse * dynamicProgress).toFixed(2)})`;
      ctx.lineWidth = Math.max(1.4, Math.min(2.6, 1.2 + 10 * camera.s));
      ctx.setLineDash([5, 3, 8, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. EFFETTO ARIA COMPRESSA IN SOLLEVAMENTO: Bolle e spuma di galleggiamento
      if (dynamicPhase === 'IN_SOLLEVAMENTO' && !reduced) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(224, 242, 254, ${(0.55 + 0.35 * Math.sin(time * 6.5 + gateIdx * 1.5)).toFixed(2)})`;
        ctx.lineWidth = Math.max(2.0, 3.8 * camera.s);
        ctx.setLineDash([3, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 4. BASAMENTO IN CEMENTO ARMATO SUBACQUEO (CASSONI DI ALLOGGIAMENTO)
      const maxFlapThick = Math.max(2.8, Math.min(5.2, 2.2 + 22 * camera.s));
      const flapThick = maxFlapThick * (0.35 + 0.65 * dynamicProgress);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = maxFlapThick + 1.2;
      ctx.lineCap = 'butt';
      ctx.stroke();

      // 5. PARATOIE GIALLE DEL MOSE MODULARI
      const count = gate.barriersCount || 20;

      // Cerniera ambrata di base
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = flapThick;
      ctx.lineCap = 'butt';
      ctx.stroke();

      // Disegno modulare delle paratie in giallo
      const yellowColor = dynamicPhase === 'IN_SOLLEVAMENTO' || dynamicPhase === 'IN_ABBASSAMENTO'
        ? '#eab308'
        : '#facc15';

      for (let k = 0; k < count; k++) {
        const t0 = (k + 0.12) / count;
        const t1 = (k + 0.88) / count;
        const gx0 = x1 + ux * len * t0;
        const gy0 = y1 + uy * len * t0;
        const gx1 = x1 + ux * len * t1;
        const gy1 = y1 + uy * len * t1;

        ctx.beginPath();
        ctx.moveTo(gx0, gy0);
        ctx.lineTo(gx1, gy1);
        ctx.strokeStyle = yellowColor;
        ctx.lineWidth = flapThick;
        ctx.lineCap = 'butt';
        ctx.stroke();

        // Riflesso superiore
        ctx.beginPath();
        ctx.moveTo(gx0 + nx * 0.6, gy0 + ny * 0.6);
        ctx.lineTo(gx1 + nx * 0.6, gy1 + ny * 0.6);
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = Math.max(0.6, flapThick * 0.28);
        ctx.stroke();
      }

      // 6. SPALLE E CASSONI DI TESTATA IN CEMENTO CON FANALI MARITTIMI
      const capRadius = Math.max(2.2, Math.min(4.2, 1.8 + 15 * camera.s));
      [ [x1, y1], [x2, y2] ].forEach(([cx, cy], endIdx) => {
        ctx.beginPath();
        ctx.arc(cx, cy, capRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#475569';
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Fanale: se in sollevamento o abbassamento lampeggia ambra; se attivo fisso rosso/verde
        let lightCol = endIdx === 0 ? '#ef4444' : '#10b981';
        if (dynamicPhase === 'IN_SOLLEVAMENTO' || dynamicPhase === 'IN_ABBASSAMENTO') {
          const isFlash = Math.floor(time * 3.5 + endIdx) % 2 === 0;
          lightCol = isFlash ? '#f59e0b' : '#78350f';
        }

        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(1.2, capRadius * 0.55), 0, Math.PI * 2);
        ctx.fillStyle = lightCol;
        ctx.fill();
      });


    } else {
      // MOSE ABBASSATO SUL FONDALE (CANALE LIBERO E NAVIGABILE)
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.40)' : 'rgba(2, 132, 199, 0.35)';
      ctx.lineWidth = Math.max(1.6, Math.min(3.0, 1.2 + 10 * camera.s));
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      const capRadius = Math.max(2.0, Math.min(3.6, 1.6 + 12 * camera.s));
      [ [x1, y1], [x2, y2] ].forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, capRadius, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#334155' : '#64748b';
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Fanale verde canale navigabile aperto
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(1.0, capRadius * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
      });
    }

    ctx.restore();
  });
}

export function drawPasserelle(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, showPasserelle, passerelle, tide } = rc;
  // Con il layer acceso: tutti i percorsi, evidenziati quelli previsti al livello attuale.
  // Senza layer: compaiono da soli i percorsi la cui quota è raggiunta dalla marea in città.
  if (!passerelle || passerelle.length === 0) return;
  const level = tide.lagoonTideCm;
  if (!showPasserelle && (level ?? 0) < PASSERELLE_MIN_THRESHOLD_CM) return;

  const haloWidth = Math.max(4.5, Math.min(8.5, 3.5 + 40 * camera.s));
  const coreWidth = Math.max(2.0, Math.min(3.6, 1.6 + 18 * camera.s));

  for (const p of passerelle) {
    if (p.variantOf || p.path.length < 2) continue;
    const expected = isPasserellaExpected(p, level);
    if (!showPasserelle && !expected) continue;
    ctx.save();

    ctx.beginPath();
    p.path.forEach((pt, idx) => {
      const px = sx(mx(pt[0]));
      const py = sy(my(pt[1]));
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Alone lungo la calle, poi il tracciato (indicativo) del percorso
    ctx.strokeStyle = expected
      ? (isDark ? 'rgba(251, 191, 36, 0.32)' : 'rgba(217, 119, 6, 0.24)')
      : 'rgba(148, 163, 184, 0.20)';
    ctx.lineWidth = haloWidth;
    ctx.stroke();

    ctx.strokeStyle = expected
      ? (isDark ? '#fbbf24' : '#d97706')
      : (isDark ? '#94a3b8' : '#78716c');
    ctx.lineWidth = coreWidth;
    ctx.stroke();

    ctx.restore();
  }
}
