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

interface FloodedOpenSpace {
  id: string;
  name: string;
  thresholdCm: number;
  centerLon: number;
  centerLat: number;
  polygon: [number, number][];
}

const VENICE_FLOODED_SPACES: FloodedOpenSpace[] = [
  {
    id: 'piazza_san_marco',
    name: 'Piazza San Marco',
    thresholdCm: 84,
    centerLon: 12.3373,
    centerLat: 45.4344,
    polygon: [
      [12.3359, 45.43415],
      [12.3385, 45.43405],
      [12.3388, 45.43460],
      [12.3360, 45.43465],
    ],
  },
  {
    id: 'piazzetta_san_marco',
    name: 'Piazzetta San Marco',
    thresholdCm: 78,
    centerLon: 12.3385,
    centerLat: 45.4336,
    polygon: [
      [12.3382, 45.4332],
      [12.3389, 45.4332],
      [12.3389, 45.4341],
      [12.3382, 45.4341],
    ],
  },
  {
    id: 'erbaria_rialto',
    name: 'Rialto Erbaria',
    thresholdCm: 95,
    centerLon: 12.3358,
    centerLat: 45.4383,
    polygon: [
      [12.3350, 45.4379],
      [12.3366, 45.4378],
      [12.3368, 45.4386],
      [12.3352, 45.4387],
    ],
  },
  {
    id: 'riva_schiavoni',
    name: 'Riva degli Schiavoni',
    thresholdCm: 98,
    centerLon: 12.3425,
    centerLat: 45.4343,
    polygon: [
      [12.3400, 45.4338],
      [12.3445, 45.4342],
      [12.3445, 45.4347],
      [12.3400, 45.4343],
    ],
  },
  {
    id: 'dogana_salute',
    name: 'Dogana & Salute',
    thresholdCm: 98,
    centerLon: 12.3365,
    centerLat: 45.4312,
    polygon: [
      [12.3355, 45.4308],
      [12.3375, 45.4310],
      [12.3375, 45.4315],
      [12.3355, 45.4314],
    ],
  },
  {
    id: 'fondamenta_guglie',
    name: 'Cannaregio Guglie',
    thresholdCm: 105,
    centerLon: 12.3255,
    centerLat: 45.4444,
    polygon: [
      [12.3245, 45.4440],
      [12.3268, 45.4442],
      [12.3268, 45.4448],
      [12.3245, 45.4446],
    ],
  },
  {
    id: 'fondamenta_ormesini',
    name: 'Misericordia & Ormesini',
    thresholdCm: 108,
    centerLon: 12.3325,
    centerLat: 45.4454,
    polygon: [
      [12.3305, 45.4450],
      [12.3345, 45.4453],
      [12.3345, 45.4458],
      [12.3305, 45.4455],
    ],
  },
  {
    id: 'zattere_gesuati',
    name: 'Fondamenta Zattere',
    thresholdCm: 108,
    centerLon: 12.3280,
    centerLat: 45.4293,
    polygon: [
      [12.3260, 45.4290],
      [12.3300, 45.4292],
      [12.3300, 45.4297],
      [12.3260, 45.4295],
    ],
  },
  {
    id: 'campo_san_polo',
    name: 'Campo San Polo',
    thresholdCm: 110,
    centerLon: 12.3300,
    centerLat: 45.4372,
    polygon: [
      [12.3292, 45.4368],
      [12.3308, 45.4368],
      [12.3308, 45.4376],
      [12.3292, 45.4376],
    ],
  },
  {
    id: 'campo_santa_margherita',
    name: 'Campo Santa Margherita',
    thresholdCm: 114,
    centerLon: 12.3236,
    centerLat: 45.4338,
    polygon: [
      [12.3230, 45.4332],
      [12.3242, 45.4332],
      [12.3242, 45.4345],
      [12.3230, 45.4345],
    ],
  },
  {
    id: 'campo_san_giacomo_orio',
    name: 'San Giacomo dell\'Orio',
    thresholdCm: 118,
    centerLon: 12.3275,
    centerLat: 45.4412,
    polygon: [
      [12.3268, 45.4408],
      [12.3282, 45.4408],
      [12.3282, 45.4416],
      [12.3268, 45.4416],
    ],
  },
];

function paintFloodedOpenSpaces(
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

  ctx.save();
  for (const space of VENICE_FLOODED_SPACES) {
    if (tide < space.thresholdCm) continue;

    const depth = tide - space.thresholdCm;
    const alpha = Math.min(0.72, 0.40 + (depth / 45) * 0.32);

    // Specchio d'acqua continuo sulla pavimentazione dello spazio aperto
    ctx.beginPath();
    const pts = space.polygon;
    ctx.moveTo(sx(mx(pts[0][0])), sy(my(pts[0][1])));
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(sx(mx(pts[i][0])), sy(my(pts[i][1])));
    }
    ctx.closePath();

    // Gradiente d'acqua fluida (blu vivo con riflesso azzurrato)
    ctx.fillStyle = depth >= 20
      ? `rgba(2, 132, 199, ${alpha.toFixed(2)})`
      : `rgba(14, 165, 233, ${alpha.toFixed(2)})`;
    ctx.fill();

    // Contorno del battente d'acqua
    ctx.strokeStyle = `rgba(56, 189, 248, ${(alpha * 0.8).toFixed(2)})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Onde e riflessi di luce concentrici sulla superficie allagata
    if (animate) {
      const cx = sx(mx(space.centerLon));
      const cy = sy(my(space.centerLat));
      for (let w = 0; w < 2; w++) {
        const phase = ((time * 0.6 + w * 0.5 + space.thresholdCm * 0.05) % 1);
        const r = 16 + phase * 50;
        ctx.strokeStyle = `rgba(255, 255, 255, ${((1 - phase) * 0.45).toFixed(2)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * 1.6, r * 0.75, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

/**
 * Disegna le zone allagate con effetto volumetrico sull'ordito delle calli, specchi d'acqua continui sui campi
 * e onde marine animate. Il canvas e' gia' scalato per il devicePixelRatio.
 */
export function drawFloodLayer(rc: RenderContext, activeTideCm: number | null): void {
  const tide = activeTideCm ?? rc.tideLevel;
  if (tide === null || tide === undefined || tide < 80) return;

  const { ctx, sx, sy, mx, my, camera, zoomed, cw, ch } = rc;
  const animate = !reducedMotion();
  const time = animate ? Date.now() / 900 : 0;

  // 1. Allagamento volumetrico delle calli e ponti emersi
  const streetsReady = isStreetsLoaded();
  if (streetsReady && (zoomed || camera.s > 0.015)) {
    paintFloodedStreets(ctx, { cw, ch, camera, tideLevel: tide, animate });

    // 2. Specchi d'acqua continui su piazze, campi e fondamenta aperte
    paintFloodedOpenSpaces(ctx, { sx, sy, mx, my, tide, animate, time });
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
