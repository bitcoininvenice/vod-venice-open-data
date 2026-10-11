import type { RenderContext } from './renderContext';
import { isStreetsLoaded, paintFloodedStreets } from './streetsLayer';

export interface FloodZone {
  id: string;
  name: string;
  thresholdCm: number;
  centerLon: number;
  centerLat: number;
  radiusMeters: number;
  criticalSpots?: string;
}

export const VENICE_FLOOD_ZONES: FloodZone[] = [
  {
    id: 'san_marco',
    name: 'San Marco',
    thresholdCm: 80,
    centerLon: 12.3385,
    centerLat: 45.4340,
    radiusMeters: 220,
    criticalSpots: 'Basilica, Piazzetta'
  },
  {
    id: 'rialto',
    name: 'Rialto & Erbaria',
    thresholdCm: 95,
    centerLon: 12.3360,
    centerLat: 45.4382,
    radiusMeters: 160,
    criticalSpots: 'Ruga Orefici'
  },
  {
    id: 'dogana_salute',
    name: 'Dogana & Salute',
    thresholdCm: 100,
    centerLon: 12.3365,
    centerLat: 45.4312,
    radiusMeters: 140,
    criticalSpots: 'Fondamenta Salute'
  },
  {
    id: 'san_zaccaria',
    name: 'San Zaccaria',
    thresholdCm: 100,
    centerLon: 12.3425,
    centerLat: 45.4345,
    radiusMeters: 150,
    criticalSpots: 'Riva Schiavoni'
  },
  {
    id: 'cannaregio_guglie',
    name: 'Cannaregio (Guglie)',
    thresholdCm: 105,
    centerLon: 12.3255,
    centerLat: 45.4445,
    radiusMeters: 170,
    criticalSpots: 'Ponte delle Guglie'
  },
  {
    id: 'misericordia',
    name: 'Misericordia',
    thresholdCm: 108,
    centerLon: 12.3325,
    centerLat: 45.4455,
    radiusMeters: 180,
    criticalSpots: 'Ormesini'
  },
  {
    id: 'san_polo',
    name: 'Campo San Polo',
    thresholdCm: 110,
    centerLon: 12.3300,
    centerLat: 45.4372,
    radiusMeters: 150,
    criticalSpots: 'San Silvestro'
  },
  {
    id: 'giudecca_palanca',
    name: 'Giudecca (Palanca)',
    thresholdCm: 110,
    centerLon: 12.3265,
    centerLat: 45.4262,
    radiusMeters: 190,
    criticalSpots: 'Sant\'Eufemia'
  },
  {
    id: 'santa_margherita',
    name: 'Santa Margherita',
    thresholdCm: 115,
    centerLon: 12.3235,
    centerLat: 45.4338,
    radiusMeters: 160,
    criticalSpots: 'San Pantalon'
  },
  {
    id: 'san_giacomo_orio',
    name: 'San Giacomo dell\'Orio',
    thresholdCm: 120,
    centerLon: 12.3275,
    centerLat: 45.4412,
    radiusMeters: 150,
    criticalSpots: 'Riva de Biasio'
  },
  {
    id: 'piazzale_roma',
    name: 'Piazzale Roma',
    thresholdCm: 125,
    centerLon: 12.3185,
    centerLat: 45.4375,
    radiusMeters: 170,
    criticalSpots: 'Santa Chiara'
  },
  {
    id: 'castello_garibaldi',
    name: 'Castello (Garibaldi)',
    thresholdCm: 125,
    centerLon: 12.3525,
    centerLat: 45.4325,
    radiusMeters: 170,
    criticalSpots: 'Riva Sette Martiri'
  },
  {
    id: 'ferrovia_scalzi',
    name: 'Stazione Santa Lucia',
    thresholdCm: 130,
    centerLon: 12.3210,
    centerLat: 45.4415,
    radiusMeters: 180,
    criticalSpots: 'Lista di Spagna'
  },
  {
    id: 'fondamente_nove',
    name: 'Fondamente Nove',
    thresholdCm: 130,
    centerLon: 12.3395,
    centerLat: 45.4448,
    radiusMeters: 160,
    criticalSpots: 'Gesuiti'
  }
];

const reducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

function paintSanMarcoPiazzaWater(
  ctx: CanvasRenderingContext2D,
  o: {
    sx: (x: number) => number;
    sy: (y: number) => number;
    mx: (lon: number) => number;
    my: (lat: number) => number;
    tide: number;
    animate: boolean;
    time: number;
  }
): void {
  const { sx, sy, mx, my, tide, animate, time } = o;
  const depth = tide - 80;
  const alpha = Math.min(0.65, 0.35 + (depth / 50) * 0.3);

  ctx.save();

  // Poligono Piazza San Marco
  const piazzaPts = [
    [12.3359, 45.43415],
    [12.3385, 45.43405],
    [12.3388, 45.43460],
    [12.3360, 45.43465],
  ];

  ctx.beginPath();
  ctx.moveTo(sx(mx(piazzaPts[0][0])), sy(my(piazzaPts[0][1])));
  for (let i = 1; i < piazzaPts.length; i++) {
    ctx.lineTo(sx(mx(piazzaPts[i][0])), sy(my(piazzaPts[i][1])));
  }
  ctx.closePath();
  ctx.fillStyle = `rgba(14, 165, 233, ${alpha.toFixed(2)})`;
  ctx.fill();

  // Poligono Piazzetta San Marco verso il Molo
  const piazzettaPts = [
    [12.3382, 45.4332],
    [12.3389, 45.4332],
    [12.3389, 45.4341],
    [12.3382, 45.4341],
  ];

  ctx.beginPath();
  ctx.moveTo(sx(mx(piazzettaPts[0][0])), sy(my(piazzettaPts[0][1])));
  for (let i = 1; i < piazzettaPts.length; i++) {
    ctx.lineTo(sx(mx(piazzettaPts[i][0])), sy(my(piazzettaPts[i][1])));
  }
  ctx.closePath();
  ctx.fillStyle = `rgba(2, 132, 199, ${(alpha * 1.15).toFixed(2)})`;
  ctx.fill();

  // Onde e riflessi di luce sulla superficie allagata della piazza
  if (animate) {
    const cx = sx(mx(12.3373));
    const cy = sy(my(45.4344));
    for (let w = 0; w < 2; w++) {
      const phase = ((time * 0.6 + w * 0.5) % 1);
      const r = 20 + phase * 65;
      ctx.strokeStyle = `rgba(224, 242, 254, ${((1 - phase) * 0.4).toFixed(2)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 1.8, r * 0.7, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Disegna le zone allagate con effetto volumetrico sull'ordito delle calli, specchio d'acqua in piazza
 * e onde marine animate. Il canvas e' gia' scalato per il devicePixelRatio.
 */
export function drawFloodLayer(rc: RenderContext, activeTideCm: number | null): void {
  const tide = activeTideCm ?? rc.tideLevel;
  if (tide === null || tide === undefined || tide < 80) return;

  const { ctx, sx, sy, mx, my, camera, zoomed, cw, ch } = rc;
  const animate = !reducedMotion();
  const time = animate ? Date.now() / 900 : 0;

  // 1. Allagamento delle calli e ponti emersi
  const streetsReady = isStreetsLoaded();
  if (streetsReady && (zoomed || camera.s > 0.015)) {
    paintFloodedStreets(ctx, { cw, ch, camera, tideLevel: tide, animate });

    // 2. Allagamento specchio d'acqua Piazza San Marco
    if (tide >= 80) {
      paintSanMarcoPiazzaWater(ctx, { sx, sy, mx, my, tide, animate, time });
    }
  }

  // 3. Alone di marea regionale / macro view
  const haloOpacityFactor = streetsReady && zoomed ? 0.35 : 1.0;
  for (const zone of VENICE_FLOOD_ZONES) {
    if (tide < zone.thresholdCm) continue;

    const waterDepth = tide - zone.thresholdCm;
    const screenX = sx(mx(zone.centerLon));
    const screenY = sy(my(zone.centerLat));

    // Scala del raggio da metri a pixel schermo georiferito
    const geoRadiusPx = (zone.radiusMeters / 111139) * (rc.KY || 276000) * camera.s;
    const baseRadiusPx = Math.max(14, geoRadiusPx);

    ctx.save();

    // Velo d'acqua della laguna (allagamento del suolo pedonale)
    const waterGrad = ctx.createRadialGradient(
      screenX,
      screenY,
      baseRadiusPx * 0.05,
      screenX,
      screenY,
      baseRadiusPx
    );

    const depthOpacity = Math.min(0.65, 0.25 + (waterDepth / 60) * 0.3) * haloOpacityFactor;
    waterGrad.addColorStop(0, `rgba(6, 182, 212, ${depthOpacity.toFixed(2)})`);
    waterGrad.addColorStop(0.65, `rgba(2, 132, 199, ${(depthOpacity * 0.8).toFixed(2)})`);
    waterGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');

    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.arc(screenX, screenY, baseRadiusPx, 0, Math.PI * 2);
    ctx.fill();

    // Onde marine animate concentriche (se la vista e' d'insieme o le calli non sono ancora caricate)
    if (animate && (!streetsReady || !zoomed)) {
      for (let w = 0; w < 2; w++) {
        const phase = ((time * 0.75 + w * 0.5 + zone.thresholdCm * 0.08) % 1);
        const rippleRadius = baseRadiusPx * (0.25 + 0.75 * phase);
        const rippleAlpha = (1 - phase) * 0.55 * haloOpacityFactor;

        ctx.strokeStyle = `rgba(125, 211, 252, ${rippleAlpha.toFixed(2)})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(screenX, screenY, rippleRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Etichetta quota d'acqua se la visuale e' ravvicinata (zoomed)
    if (zoomed || camera.s > 0.02) {
      const label = `${zone.name} ~${waterDepth} cm`;
      ctx.font = 'bold 10px "DM Mono", monospace';
      const textMetrics = ctx.measureText(label);
      const paddingX = 6;
      const pillHeight = 16;
      const pillWidth = textMetrics.width + paddingX * 2;
      const pillX = screenX - pillWidth / 2;
      const pillY = screenY - pillHeight / 2;

      ctx.fillStyle = 'rgba(10, 15, 29, 0.85)';
      ctx.strokeStyle = waterDepth >= 20 ? 'rgba(244, 63, 94, 0.8)' : 'rgba(56, 189, 248, 0.8)';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = waterDepth >= 20 ? '#fda4af' : '#7dd3fc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, screenX, screenY);
    }

    ctx.restore();
  }
}
