import { describe, it, expect } from 'vitest';
import { BDSR_DATA, getBdsrData, getBdsrMarketComparison } from './bdsrCin';

describe('BDSR CIN Ministero del Turismo dataset', () => {
  it('carica il dataset del 17/10/2026 con la fonte e la base legale del riuso', () => {
    const data = getBdsrData();
    expect(data.metadata.snapshotDate).toBe('17/10/2026');
    expect(data.metadata.source).toContain('Ministero del Turismo');
    expect(data.metadata.license).toMatch(/art\. 52/);
    // regione e province calcolate dal CSV, non scritte a mano: la somma delle province fa la regione
    const sum = data.venetoRegion.provinces.reduce((a, p) => a + p.totalStructures, 0);
    expect(sum).toBe(data.venetoRegion.totalStructures);
    expect(data.venetoRegion.provinces.find((p) => p.name === 'Venezia')?.totalStructures).toBeGreaterThan(data.veneziaMunicipality.totalStructures);
  });

  it('contiene i dati ufficiali corretti per il Comune di Venezia', () => {
    const ve = BDSR_DATA.veneziaMunicipality;
    expect(ve.name).toBe('Venezia');
    expect(ve.istatCode).toBe('027042');
    expect(ve.totalStructures).toBe(10266);
    expect(ve.cinVerified).toBe(9884);
    expect(ve.cinMissing).toBe(380);
    expect(ve.pctCinVerified).toBeGreaterThan(96.0);
    expect(ve.totalHotels).toBe(470);
    expect(ve.entrepreneurialRentals).toBe(4090);
    expect(ve.privateNonEntrepreneurialRentals).toBe(5107);
    expect(ve.totalTouristRentals).toBe(9197);
  });

  it('include le 3 macro-categorie ISTAT ufficiali (Alberghi, Extralberghiero, Privati)', () => {
    const macros = BDSR_DATA.veneziaMunicipality.macroCategories;
    expect(macros.length).toBe(3);
    const codes = macros.map((m) => m.code);
    expect(codes).toEqual(['A', 'B', 'C']);

    const hotelMacro = macros.find((m) => m.code === 'A');
    expect(hotelMacro?.total).toBe(470);

    const extraMacro = macros.find((m) => m.code === 'B');
    expect(extraMacro?.total).toBe(4595);

    const privateMacro = macros.find((m) => m.code === 'C');
    expect(privateMacro?.total).toBe(5201);
  });

  it('confronta coerentemente i dati anagrafici BDSR con gli annunci attivi Inside Airbnb', () => {
    const comp = getBdsrMarketComparison(8844);
    expect(comp.bdsrTouristRentals).toBe(9197);
    expect(comp.airbnbListingsCount).toBe(8844);
    expect(comp.deltaListingsVsRegistered).toBe(353);
    expect(comp.marketCoveragePct).toBeCloseTo(96.2, 1);
  });

  it('include il confronto intercomunale per la Città Metropolitana di Venezia', () => {
    const comuni = BDSR_DATA.metropolitanMunicipalities;
    expect(comuni.length).toBeGreaterThanOrEqual(6);
    const top = comuni[0];
    expect(top.name).toBe('Venezia');
    expect(top.totalStructures).toBe(10266);

    const jesolo = comuni.find((c) => c.name === 'Jesolo');
    expect(jesolo?.totalStructures).toBe(5312);

    const bibione = comuni.find((c) => c.name === 'San Michele al Tagliamento');
    expect(bibione?.totalStructures).toBe(8824);
  });
});
