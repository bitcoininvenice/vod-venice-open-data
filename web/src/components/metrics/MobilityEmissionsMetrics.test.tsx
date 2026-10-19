import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MobilityEmissionsMetrics } from './MobilityEmissionsMetrics';
import { LanguageProvider } from '@/lib/i18n';
import { propulsionReport } from '@/lib/mobilityEmissions';

describe('MobilityEmissionsMetrics', () => {
  it('mostra le corse per alimentazione senza numeri di CO2', () => {
    const data = propulsionReport('2026-10-19', [
      { mode: 'tram', operator: 'ACTV', propulsion: 'electric', trips: 300 },
      { mode: 'vaporetto', operator: 'ACTV', propulsion: 'fossil', trips: 2000 },
      { mode: 'bus', operator: 'ACTV', propulsion: 'unknown', trips: 1500 },
    ]);
    const html = renderToString(<LanguageProvider><MobilityEmissionsMetrics data={data} /></LanguageProvider>);
    expect(html).toContain('data-testid="mobility-emissions-metrics"');
    expect(html).toMatch(/3[.,]?800/);
    expect(html).not.toMatch(/CO2 Risparmiata|kg CO|tonnellate/);
  });
});
