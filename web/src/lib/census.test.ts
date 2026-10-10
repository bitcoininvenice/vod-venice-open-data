import { describe, expect, it } from 'vitest';
import { CENSUS, historicCentreShare, mostEmptiedSestiere } from './census';

describe('censimento ISTAT 2021', () => {
  it('le municipalità sommano il totale del Comune', () => {
    const sum = CENSUS.municipalities.reduce((a, m) => a + m.population, 0);
    expect(sum).toBe(CENSUS.city.population);
    expect(CENSUS.municipalities).toHaveLength(6);
  });

  it('il centro storico è la somma dei sette sestieri (Giudecca compresa)', () => {
    expect(CENSUS.sestieri.map((s) => s.name).sort()).toEqual(['Cannaregio', 'Castello', 'Dorsoduro', 'Giudecca', 'San Marco', 'San Polo', 'Santa Croce']);
    expect(CENSUS.sestieri.reduce((a, s) => a + s.population, 0)).toBe(CENSUS.historicCentre.population);
    expect(historicCentreShare()).toBeGreaterThan(10);
    expect(historicCentreShare()).toBeLessThan(30);
  });

  it('abitazioni vuote o di non residenti: percentuale coerente con i valori assoluti', () => {
    for (const s of CENSUS.sestieri) {
      expect(s.dwellingsEmptyOrNonResident).toBeLessThanOrEqual(s.dwellingsTotal);
      expect(s.pctDwellingsEmptyOrNonResident).toBeCloseTo((100 * s.dwellingsEmptyOrNonResident) / s.dwellingsTotal, 0);
    }
    const top = mostEmptiedSestiere();
    for (const s of CENSUS.sestieri) expect(top.pctDwellingsEmptyOrNonResident!).toBeGreaterThanOrEqual(s.pctDwellingsEmptyOrNonResident!);
  });

  it('fonte e licenza dichiarate', () => {
    expect(CENSUS.license).toBe('CC BY 4.0');
    expect(CENSUS.source).toMatch(/ISTAT/);
    expect(CENSUS.referenceDate).toBe('2021-12-31');
  });
});
