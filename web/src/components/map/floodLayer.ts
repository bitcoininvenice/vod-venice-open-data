import type { RenderContext } from './renderContext';

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

/**
 * Disegna le zone allagate con effetto velo d'acqua e onde concentriche.
 * Zone, soglie e raggi sono un'approssimazione indicativa (non una mappa altimetrica ufficiale):
 * le etichette lo dichiarano. Il canvas è già scalato per il devicePixelRatio: misure in px CSS.
 */
export function drawFloodLayer(rc: RenderContext, activeTideCm: number | null): void {
  const tide = activeTideCm ?? rc.tideLevel;
  if (tide === null || tide === undefined || tide < 80) return;

  const { ctx, sx, sy, mx, my, camera, zoomed } = rc;
  const animate = !reducedMotion();
  const time = animate ? Date.now() / 900 : 0;

  for (const zone of VENICE_FLOOD_ZONES) {
    if (tide < zone.thresholdCm) continue;

    const waterDepth = tide - zone.thresholdCm;
    const screenX = sx(mx(zone.centerLon));
    const screenY = sy(my(zone.centerLat));

    // Scala del raggio da metri a pixel schermo georiferito
    const geoRadiusPx = (zone.radiusMeters / 111139) * (rc.KY || 276000) * camera.s;
    const baseRadiusPx = Math.max(14, geoRadiusPx);

    ctx.save();

    // 1. Velo d'acqua della laguna (allagamento del suolo pedonale)
    const waterGrad = ctx.createRadialGradient(
      screenX,
      screenY,
      baseRadiusPx * 0.05,
      screenX,
      screenY,
      baseRadiusPx
    );

    // Opacità proporzionale al tirante d'acqua (più profondo = più scuro)
    const depthOpacity = Math.min(0.65, 0.35 + (waterDepth / 60) * 0.3);
    waterGrad.addColorStop(0, `rgba(6, 182, 212, ${depthOpacity})`);
    waterGrad.addColorStop(0.65, `rgba(2, 132, 199, ${(depthOpacity * 0.8).toFixed(2)})`);
    waterGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');

    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.arc(screenX, screenY, baseRadiusPx, 0, Math.PI * 2);
    ctx.fill();

    // 2. Onde marine animate concentriche (increspatura marea)
    for (let w = 0; animate && w < 2; w++) {
      const phase = ((time * 0.75 + w * 0.5 + zone.thresholdCm * 0.08) % 1);
      const rippleRadius = baseRadiusPx * (0.25 + 0.75 * phase);
      const rippleAlpha = (1 - phase) * 0.55;

      ctx.strokeStyle = `rgba(125, 211, 252, ${rippleAlpha.toFixed(2)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(screenX, screenY, rippleRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. Etichetta quota d'acqua se la visuale è ravvicinata (zoomed)
    if (zoomed || camera.s > 0.02) {
      const label = `${zone.name} ~${waterDepth} cm (stima)`;
      ctx.font = 'bold 10px "DM Mono", monospace';
      const textMetrics = ctx.measureText(label);
      const paddingX = 6;
      const pillHeight = 16;
      const pillWidth = textMetrics.width + paddingX * 2;
      const pillX = screenX - pillWidth / 2;
      const pillY = screenY - pillHeight / 2;

      // Sfondo pill con sfumatura d'acqua
      ctx.fillStyle = 'rgba(10, 15, 29, 0.85)';
      ctx.strokeStyle = waterDepth >= 20 ? 'rgba(244, 63, 94, 0.8)' : 'rgba(56, 189, 248, 0.8)';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 8);
      ctx.fill();
      ctx.stroke();

      // Testo quota
      ctx.fillStyle = waterDepth >= 20 ? '#fda4af' : '#7dd3fc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, screenX, screenY);
    }

    ctx.restore();
  }
}
