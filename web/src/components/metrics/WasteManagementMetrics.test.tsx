import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { WasteManagementMetrics } from './WasteManagementMetrics';
import { LanguageProvider } from '@/lib/i18n';
import { WASTE_DATA } from '@/lib/waste';

describe('WasteManagementMetrics', () => {
  const render = (el: React.ReactElement) =>
    renderToString(<LanguageProvider>{el}</LanguageProvider>);

  it('renders waste management metrics dashboard, KPI cards and fractions table', () => {
    const html = render(<WasteManagementMetrics />);

    expect(html).toContain('data-testid="waste-management-metrics"');
    expect(html).toMatch(/da verificare|to be checked/i);

    // 63.8% separate collection rate
    expect(html).toContain('63,8%');
    // Total waste in thousand tonnes: 165.314 t
    expect(html).toContain('165.314 t');
    // Per capita kg
    expect(html).toContain('656,5 kg');

    // Fractions table rows
    expect(html).toContain('Organico Umido (FORSU)');
    expect(html).toContain('Carta e Cartone');
    expect(html).toContain('Secco Residuo Indifferenziato');

    // Logistics sections
    expect(html).toContain('Raccolta Acquea con Barche Compattatrici');
    expect(html).toContain('Campane con Calotta Elettronica');
    expect(html).toContain('Ecodistretto e Discarica Zero a Fusina');

    // Source link
    expect(html).toContain(WASTE_DATA.metadata.sourceUrl);
  });
});
