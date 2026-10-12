import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { TideForecastChart } from './TideForecastChart';
import { LanguageProvider } from '@/lib/i18n';
import type { TideForecast, TideForecastExtreme } from '@/lib/contracts/tide';

describe('TideForecastChart', () => {
  const sampleExtremes: TideForecastExtreme[] = [
    { at: '2026-10-13 00:40:00', type: 'max', levelCm: 65 },
    { at: '2026-10-13 06:05:00', type: 'min', levelCm: 10 },
    { at: '2026-10-13 12:15:00', type: 'max', levelCm: 85 },
    { at: '2026-10-13 18:35:00', type: 'min', levelCm: 0 },
  ];
  const render = (el: React.ReactElement) => renderToString(<LanguageProvider>{el}</LanguageProvider>);
  const forecast = (extremes: TideForecastExtreme[], stale = false): TideForecast => ({ issuedAt: '2026-10-12 18:00:00', stale, extremes });

  it('renderizza il grafico SVG con la curva e i punti estremali', () => {
    const html = render(
      <TideForecastChart forecast={forecast(sampleExtremes)} liveTideLevel={84} />
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
    const html = render(
      <TideForecastChart forecast={forecast([{ at: '2026-10-13 12:00:00', type: 'max', levelCm: 50 }])} />
    );
    expect(html).not.toContain('<svg');
  });

  it('avvisa quando la previsione non è più aggiornata', () => {
    const html = render(<TideForecastChart forecast={forecast(sampleExtremes, true)} />);
    expect(html).toContain('non più aggiornata');
  });

  it('separa i giorni alla mezzanotte di Venezia', () => {
    const html = render(
      <TideForecastChart forecast={forecast([...sampleExtremes, { at: '2026-10-14 01:10:00', type: 'max', levelCm: 70 }, { at: '2026-10-14 07:20:00', type: 'min', levelCm: 5 }])} />
    );
    expect(html).toContain('14 ottobre');
  });
});
