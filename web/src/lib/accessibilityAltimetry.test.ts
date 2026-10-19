import { describe, it, expect } from 'vitest';
import { calculateAltimetricAccessibility, historicCentrePharmacies, sestiereFromAddress } from './accessibilityAltimetry';
import { getFloodedGroundPercentage } from './flood';

describe('farmacie e acqua alta', () => {
  it('ricava il sestiere dall\'indirizzo veneziano', () => {
    expect(sestiereFromAddress('Dorsoduro 1053/C')).toBe('Dorsoduro');
    expect(sestiereFromAddress('San Polo 21')).toBe('San Polo');
    expect(sestiereFromAddress('Via Piave 3, Mestre')).toBeNull();
  });

  it('usa solo farmacie di OpenStreetMap con il sestiere nell\'indirizzo, nessun presidio scritto a mano', () => {
    const list = historicCentrePharmacies();
    expect(list.length).toBeGreaterThan(10);
    expect(list.every((p) => p.id.startsWith('osm_'))).toBe(true);
  });

  it('più marea, meno farmacie all\'asciutto; suolo allagato dalla curva CPSM', () => {
    const low = calculateAltimetricAccessibility(80);
    const high = calculateAltimetricAccessibility(140);
    expect(high.pharmaciesDry).toBeLessThanOrEqual(low.pharmaciesDry);
    expect(high.cityFloodedPercent).toBe(getFloodedGroundPercentage(140));
    expect(high.sestieri).toHaveLength(6);
    expect(high).not.toHaveProperty('isHospitalAccessible');
    expect(high.sestieri[0]).not.toHaveProperty('isolationRiskScore');
  });
});
