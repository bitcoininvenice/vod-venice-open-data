// Layer di disegno della mappa estratti da MapEngine (lagoonLayers). Ogni funzione riceve il contesto del frame.
import type { RenderContext } from './renderContext';
import { getScheduledAlilagunaBoats } from '@/lib/alilaguna-schedule';

import { MARITIME_ROUTES } from '@/lib/shipsData';
import type { MoseGateItem, ShipCategory } from '@/lib/types';

const DEFAULT_MOSE_GATES = [
  {
    id: 'mose-lido-treporti',
    inletName: 'Lido Treporti',
    channel: 'Bocca di Porto di Lido Nord (Canale Treporti)',
    lat: 45.4353,
    lon: 12.4176,
    startLon: 12.4140,
    startLat: 45.4344,
    endLon: 12.4212,
    endLat: 45.4362,
    barriersCount: 21,
    status: 'ABBASSATO' as const,
  },
  {
    id: 'mose-lido-sannicolo',
    inletName: 'Lido San Nicolò',
    channel: 'Bocca di Porto di Lido Sud (Canale San Nicolò)',
    lat: 45.4293,
    lon: 12.4126,
    startLon: 12.4114,
    startLat: 45.4320,
    endLon: 12.4138,
    endLat: 45.4265,
    barriersCount: 20,
    status: 'ABBASSATO' as const,
  },
  {
    id: 'mose-malamocco',
    inletName: 'Malamocco',
    channel: 'Canale dei Petroli / Bocca Centrale',
    lat: 45.3308,
    lon: 12.3312,
    startLon: 12.3312,
    startLat: 45.3323,
    endLon: 12.3313,
    endLat: 45.3292,
    barriersCount: 19,
    status: 'ABBASSATO' as const,
  },
  {
    id: 'mose-chioggia',
    inletName: 'Chioggia',
    channel: 'Bocca di Porto Sud / Chioggia',
    lat: 45.2326,
    lon: 12.2965,
    startLon: 12.2968,
    startLat: 45.2348,
    endLon: 12.2962,
    endLat: 45.2305,
    barriersCount: 18,
    status: 'ABBASSATO' as const,
  },
];

export function drawMose(rc: RenderContext): void {
  const { ctx, isDark, sx, sy, mx, my, camera, paletteTheme, showMose, moseGates, tideLevel, rawTideLevel, isMoseProtected } = rc;
  const seaTide = rawTideLevel ?? tideLevel ?? 0;
  const isSimulationOrMose = showMose || (seaTide >= 80);
  if (!isSimulationOrMose) return;

  const gates = (moseGates && moseGates.length > 0) ? moseGates : DEFAULT_MOSE_GATES;
  const isProtected = isMoseProtected !== false;
  const isSimulating = rawTideLevel !== undefined && rawTideLevel !== null;
  const time = Date.now() / 1000;
  const reduced = prefersReducedMotion();

  gates.forEach((gate, gateIdx) => {
    // Coordinate dei due estremi attraverso la bocca di porto
    const sLon = gate.startLon ?? DEFAULT_MOSE_GATES[gateIdx]?.startLon ?? (gate.lon - 0.003);
    const sLat = gate.startLat ?? DEFAULT_MOSE_GATES[gateIdx]?.startLat ?? (gate.lat + 0.003);
    const eLon = gate.endLon ?? DEFAULT_MOSE_GATES[gateIdx]?.endLon ?? (gate.lon + 0.003);
    const eLat = gate.endLat ?? DEFAULT_MOSE_GATES[gateIdx]?.endLat ?? (gate.lat - 0.003);

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

    const isGateActivated = isSimulating
      ? (seaTide >= 110 && isProtected)
      : (gate.status === 'ATTIVATO' || (seaTide >= 110 && isProtected));

    ctx.save();

    if (isGateActivated) {
      // 1. ALONE DI DIFESA LAGUNARE: Velo calmo e protetto sul versante laguna (-nx, -ny)
      const haloWidth = Math.max(4.0, Math.min(8.0, 3.0 + 35 * camera.s));
      ctx.beginPath();
      ctx.moveTo(x1 - nx * 3, y1 - ny * 3);
      ctx.lineTo(x2 - nx * 3, y2 - ny * 3);
      ctx.strokeStyle = isDark ? 'rgba(16, 185, 129, 0.28)' : 'rgba(5, 150, 105, 0.20)';
      ctx.lineWidth = haloWidth;
      ctx.lineCap = 'butt';
      ctx.stroke();

      // 2. FRANGIFLUTTI E MOTO ONDOSO ADRIATICO: Schiuma fine e increspatura sul lato mare (+nx, +ny)
      const wavePulse = reduced ? 0.6 : (0.45 + 0.35 * Math.sin(time * 3.2 + gateIdx * 1.8));
      const foamOffset = Math.max(2.4, Math.min(4.5, 2.0 + 15 * camera.s));
      ctx.beginPath();
      ctx.moveTo(x1 + nx * foamOffset, y1 + ny * foamOffset);
      ctx.lineTo(x2 + nx * foamOffset, y2 + ny * foamOffset);
      ctx.strokeStyle = `rgba(255, 255, 255, ${wavePulse.toFixed(2)})`;
      ctx.lineWidth = Math.max(1.4, Math.min(2.6, 1.2 + 10 * camera.s));
      ctx.setLineDash([5, 3, 8, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. BASAMENTO IN CEMENTO ARMATO SUBACQUEO (CASSONI DI ALLOGGIAMENTO)
      const flapThick = Math.max(2.8, Math.min(5.2, 2.2 + 22 * camera.s));
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = flapThick + 1.2;
      ctx.lineCap = 'butt';
      ctx.stroke();

      // 4. LE ICONICHE PARATOIE GIALLE DEL MOSE (PARATIE METALLICHE MODULARI)
      const count = gate.barriersCount || 20;

      // 4a. Cerniera ambrata di base
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = flapThick;
      ctx.lineCap = 'butt';
      ctx.stroke();

      // 4b. Disegno modulare delle singole paratie in giallo canarino vivo (#facc15 / #eab308)
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
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = flapThick;
        ctx.lineCap = 'butt';
        ctx.stroke();

        // Riflesso sullo spigolo superiore della paratoia metallica
        ctx.beginPath();
        ctx.moveTo(gx0 + nx * 0.6, gy0 + ny * 0.6);
        ctx.lineTo(gx1 + nx * 0.6, gy1 + ny * 0.6);
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = Math.max(0.8, flapThick * 0.3);
        ctx.stroke();
      }

      // 5. SPALLE E CASSONI DI TESTATA IN CEMENTO
      const capRadius = Math.max(2.2, Math.min(4.2, 1.8 + 15 * camera.s));
      [ [x1, y1], [x2, y2] ].forEach(([cx, cy], endIdx) => {
        ctx.beginPath();
        ctx.arc(cx, cy, capRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#475569';
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Fanale marittimo di navigazione (rosso / verde compatto)
        const lightCol = endIdx === 0 ? '#ef4444' : '#10b981';
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(1.2, capRadius * 0.55), 0, Math.PI * 2);
        ctx.fillStyle = lightCol;
        ctx.fill();
      });

    } else {
      // MOSE ABBASSATO SUL FONDALE (CANALE LIBERO E NAVIGABILE)
      // 1. Tracciato tecnico subacqueo dei cassoni sul fondale (-14m)
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.40)' : 'rgba(2, 132, 199, 0.35)';
      ctx.lineWidth = Math.max(1.6, Math.min(3.0, 1.2 + 10 * camera.s));
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Spalle di testata con fanali verdi marittimi fissi (via libera)
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

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

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
  // 19. Evidenziazione pulita delle sole calli con passerelle (CPSM / Protezione Civile)
  if (showPasserelle && passerelle && passerelle.length > 0) {
    const haloWidth = Math.max(4.5, Math.min(8.5, 3.5 + 40 * camera.s));
    const coreWidth = Math.max(2.0, Math.min(3.6, 1.6 + 18 * camera.s));

    for (const p of passerelle) {
      if (!p.path || p.path.length < 2) continue;
      ctx.save();

      ctx.beginPath();
      p.path.forEach((pt, idx) => {
        const px = sx(mx(pt[0]));
        const py = sy(my(pt[1]));
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });

      // 1. Alone luminoso delicato lungo il corridoio della calle
      ctx.strokeStyle = p.isMounted
        ? (isDark ? 'rgba(251, 191, 36, 0.32)' : 'rgba(217, 119, 6, 0.24)')
        : 'rgba(148, 163, 184, 0.20)';
      ctx.lineWidth = haloWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // 2. Tracciato pulito di evidenziazione della passerella
      ctx.strokeStyle = p.isMounted
        ? (isDark ? '#fbbf24' : '#d97706')
        : (isDark ? '#94a3b8' : '#78716c');
      ctx.lineWidth = coreWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

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
        ctx.fillText(rc.t('ui.mapLabels.freightDock', { min: d.maxStayMinutes }), dx + 8, dy + 3);
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
