// Layer di disegno della mappa estratti da MapEngine (transitLayers). Ogni funzione riceve il contesto del frame.
import type { RenderContext } from './renderContext';
import { distAt, getSimulation, pointAt } from '@/lib/simulationModel';
import { DELAY_COLORS, isFresh } from '@/lib/realtimeDelay';
import { lineColor, needsDarkOutline } from '@/lib/actvLines';
import { drawVehicleGlyph, headingFromMotion } from './vehicleGlyphs';
import type { SimModel, SimProfile } from '@/lib/simulationCore';
import { clock, tripStops, type TripStop } from '@/lib/tripView';

/** Linea e categoria di ogni forma (dalla prima corsa che la usa), calcolate una volta per modello. */
const shapeRoutes = new WeakMap<SimModel, Map<object, { n: string; cat: string }>>();
function routeOfShape(sim: SimModel) {
  let m = shapeRoutes.get(sim);
  if (!m) {
    m = new Map();
    for (const p of sim.profs) if (!m.has(p.sh)) m.set(p.sh, { n: p.route.n, cat: p.route.cat });
    shapeRoutes.set(sim, m);
  }
  return m;
}

export function drawRoutes(rc: RenderContext): void {
  const { ctx, cw, pal, isDark, sx, sy, camera, W, showRoutes } = rc;
  // 3. Tracciati ACTV: vaporetti nel colore ufficiale della linea, bus e tram nel colore del tipo di mezzo
  const sim = getSimulation();
  if (showRoutes && sim) {
    const width = Math.max(1, 1.2 * (camera.s / (cw / W)));
    const routes = routeOfShape(sim);
    for (const shape of sim.shapes) {
      const r = routes.get(shape);
      const col = lineColor(r?.n, r?.cat) ?? pal.cats[r?.cat ?? 'vaporetto'] ?? '#5cc8ff';
      const xy = shape.xy;
      ctx.beginPath();
      ctx.moveTo(sx(xy[0]), sy(xy[1]));
      for (let i = 1; i < shape.n; i++) {
        ctx.lineTo(sx(xy[2 * i]), sy(xy[2 * i + 1]));
      }
      // linee chiare (es. la 1, bianca) con un bordo scuro sui temi chiari
      if (!isDark && needsDarkOutline(col)) {
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = width + 1.5;
        ctx.stroke();
      }
      // con una corsa selezionata il resto della rete resta sullo sfondo
      ctx.globalAlpha = rc.selectedTrip ? 0.12 : 0.5;
      ctx.strokeStyle = col;
      ctx.lineWidth = width;
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
  const { ctx, cw, ch, pal, isDark, sx, sy, currentTimeSeconds, selectedDay, paletteTheme, showVehicles, selectedCategory } = rc;
  // 5. Render Moving Fleet (Vehicles with directional trails)
  if (showVehicles) {
    const sim = getSimulation();
    const tripsData = sim?.daysTrips[selectedDay];

    if (sim && tripsData) {
      const { tP, t0, t1, count } = tripsData;
      const t = currentTimeSeconds;
      const trailSec = 45; // Ghosting trail duration
      // icone più piccole a scala urbana intera, piene da vicino
      const glyphScale = Math.max(0.6, Math.min(1.1, 0.45 + 12 * rc.camera.s));


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

        const col = lineColor(prof.route.n, rCat) ?? pal.cats[rCat] ?? '#5cc8ff';

        // Trail
        pointAt(prof.sh, distAt(prof, Math.max(0, dt - trailSec)), ptTail);
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        ctx.lineTo(sx(ptTail[0]), sy(ptTail[1]));
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.45;
        ctx.stroke();

        // Icona orientata nel verso di marcia: barca per i mezzi acquei, autobus o tram in terraferma
        const heading = headingFromMotion(sx(ptTail[0]), sy(ptTail[1]), vx, vy) ?? 0;
        ctx.globalAlpha = 0.95;
        drawVehicleGlyph(ctx, rCat, vx, vy, heading, {
          fill: col,
          stroke: !isDark && needsDarkOutline(col) ? '#334155' : isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.85)',
          lineWidth: 1,
          scale: glyphScale,
          roof: isDark ? '#e2e8f0' : '#ffffff',
        });
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
    }
  }
}

export function drawRealtimeVehicles(rc: RenderContext): void {
  const { ctx, cw, ch, pal, isDark, sx, sy, mx, my, camera, showRealtimeVehicles, realtimeVehicles, selectedCategory } = rc;
  // 5b. Posizioni reali GTFS-RT: stessa icona dei mezzi da orario ma con bordo marcato e punto «live»
  if (showRealtimeVehicles && realtimeVehicles.length > 0) {
    for (const v of realtimeVehicles) {
      const cat = v.category || 'vaporetto';
      if (selectedCategory !== 'all' && cat !== selectedCategory) continue;
      const vx = sx(mx(v.lon));
      const vy = sy(my(v.lat));
      if (vx < -20 || vx > cw + 20 || vy < -20 || vy > ch + 20) continue;
      const col = lineColor(v.line, cat) ?? pal.cats[cat] ?? '#34d399';
      // direzione dal GPS (gradi da nord, in senso orario); senza direzione l'icona punta a nord
      const heading = ((v.bearing ?? 0) * Math.PI) / 180;
      drawVehicleGlyph(ctx, cat, vx, vy, heading, {
        fill: col,
        stroke: isDark ? '#ffffff' : '#0f172a',
        lineWidth: 1.8,
        scale: Math.max(0.75, Math.min(1.2, 0.6 + 12 * camera.s)),
        roof: isDark ? '#e2e8f0' : '#ffffff',
      });
      // punto «live»: distingue la posizione reale da quella calcolata dall'orario
      ctx.beginPath();
      ctx.arc(vx + 6, vy - 6, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = '#22c55e';
      ctx.fill();
      ctx.strokeStyle = isDark ? '#0f172a' : '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Anello del ritardo stimato da ACTV (solo se recente): verde in orario, giallo 3-5 min, rosso oltre
      if (v.delay && isFresh(v.delay.updatedAt)) {
        ctx.beginPath();
        ctx.arc(vx, vy, 10, 0, Math.PI * 2);
        ctx.strokeStyle = DELAY_COLORS[v.delay.status];
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }
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

/** Fermate della corsa, calcolate una volta per profilo e partenza. */
const stopsCache = new WeakMap<SimProfile, Map<number, TripStop[]>>();
function cachedStops(profile: SimProfile, departure: number): TripStop[] {
  let byDeparture = stopsCache.get(profile);
  if (!byDeparture) stopsCache.set(profile, (byDeparture = new Map()));
  let stops = byDeparture.get(departure);
  if (!stops) byDeparture.set(departure, (stops = tripStops({ profile, departure })));
  return stops;
}

/**
 * Corsa del mezzo selezionato: tracciato nel colore della linea sopra la rete attenuata, fermate già
 * servite in grigio e successive con l'orario previsto (ritardo del mezzo compreso).
 */
export function drawSelectedTrip(rc: RenderContext): void {
  const { ctx, sx, sy, mx, my, isDark, camera, selectedTrip: trip } = rc;
  if (!trip) return;
  const { profile, departure, color, delaySeconds, now } = trip;
  const xy = profile.sh.xy;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sx(xy[0]), sy(xy[1]));
  for (let i = 1; i < profile.sh.n; i++) ctx.lineTo(sx(xy[2 * i]), sy(xy[2 * i + 1]));
  ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.55)' : 'rgba(15,23,42,0.45)';
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();

  const showLabels = camera.s > 0.02;
  for (const st of cachedStops(profile, departure)) {
    const expected = st.scheduled + delaySeconds;
    const passed = expected < now - 30;
    const px = sx(mx(st.lon));
    const py = sy(my(st.lat));
    ctx.beginPath();
    ctx.arc(px, py, passed ? 3.5 : 5, 0, Math.PI * 2);
    ctx.fillStyle = passed ? '#94a3b8' : isDark ? '#0f172a' : '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = passed ? '#64748b' : color;
    ctx.stroke();
    if (showLabels && st.name) {
      ctx.font = passed ? '500 9px "DM Mono", monospace' : '700 9px "DM Mono", monospace';
      ctx.textAlign = 'start';
      ctx.fillStyle = passed ? '#94a3b8' : isDark ? '#ffffff' : '#0f172a';
      ctx.fillText(passed ? st.name : `${clock(expected)} ${st.name}`, px + 8, py + 3);
    }
  }
  ctx.restore();
}

/** Itinerario del planner: tratti a piedi tratteggiati, corse nel colore della linea, partenza e arrivo. */
export function drawItinerary(rc: RenderContext): void {
  const { ctx, sx, sy, mx, my, isDark, itinerary } = rc;
  if (!itinerary) return;
  const path = (coords: [number, number][]) => {
    ctx.beginPath();
    coords.forEach(([lon, lat], i) => (i === 0 ? ctx.moveTo(sx(mx(lon)), sy(my(lat))) : ctx.lineTo(sx(mx(lon)), sy(my(lat)))));
  };
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const leg of itinerary.legs) {
    if (leg.coords.length < 2) continue;
    path(leg.coords);
    if (leg.kind === 'walk') {
      ctx.setLineDash([2, 6]);
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      const col = lineColor(leg.line, leg.category) ?? '#0ea5e9';
      ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(15,23,42,0.5)';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.strokeStyle = col;
      ctx.lineWidth = 5;
      ctx.stroke();
    }
  }
  const first = itinerary.legs[0]?.coords[0];
  const lastLeg = itinerary.legs[itinerary.legs.length - 1];
  const last = lastLeg?.coords[lastLeg.coords.length - 1];
  for (const [pt, label, color] of [[first, 'A', '#10b981'], [last, 'B', '#ef4444']] as const) {
    if (!pt) continue;
    const px = sx(mx(pt[0]));
    const py = sy(my(pt[1]));
    ctx.beginPath();
    ctx.arc(px, py, 9, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '700 10px "DM Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, px, py + 3.5);
  }
  ctx.restore();
}
