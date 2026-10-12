import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { TideForecastChart } from './TideForecastChart';
import type { TideForecastExtreme } from '@/lib/contracts/tide';

describe('TideForecastChart', () => {
  const sampleExtremes: TideForecastExtreme[] = [
    { at: '2026-10-13 00:40:00', type: 'max', levelCm: 65 },
    { at: '2026-10-13 06:05:00', type: 'min', levelCm: 10 },
    { at: '2026-10-13 12:15:00', type: 'max', levelCm: 85 },
    { at: '2026-10-13 18:35:00', type: 'min', levelCm: 0 },
  ];

  it('renderizza il grafico SVG con la curva e i punti estremali', () => {
    const html = renderToString(
      <TideForecastChart extremes={sampleExtremes} liveTideLevel={84} />
    );

    // Contiene l'elemento SVG con viewBox
    expect(html).toContain('viewBox="0 0 800 310"');
    // Contiene il percorso SVG della curva di marea
    expect(html).toContain('<path');
    // Contiene i riferimenti altimetrici chiave
    expect(html).toContain('+80 cm San Marco');
    expect(html).toContain('Punta della Salute (ZMPS)');
    // Contiene la scala graduata
    expect(html).toContain('+75');
    expect(html).toContain('+50');
    expect(html).toContain('0');
  });

  it('mostra messaggio di fallback se mancano estremali sufficienti', () => {
    const html = renderToString(
      <TideForecastChart extremes={[{ at: '2026-10-13 12:00:00', type: 'max', levelCm: 50 }]} />
    );
    expect(html).not.toContain('<svg');
  });
});
