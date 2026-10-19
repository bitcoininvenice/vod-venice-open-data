import { describe, expect, it } from 'vitest';
import {
  WASTE_DATA,
  getVeniceWaste2024,
  getWasteTimeSeries,
  getWasteBenchmarks,
  getWasteMetropolitanTotal,
} from './waste';

describe('waste lib', () => {
  it('loads waste dataset with proper metadata', () => {
    expect(WASTE_DATA.metadata).toBeDefined();
    expect(WASTE_DATA.metadata.source).toContain('ARPA Veneto');
    expect(WASTE_DATA.metadata.referenceYear).toBe(2024);
  });

  it('provides detailed 2024 data for Venice', () => {
    const venice = getVeniceWaste2024();
    expect(venice.municipality).toBe('Venezia');
    expect(venice.population).toBeGreaterThan(200000);
    expect(venice.totalWasteKg).toBeGreaterThan(100000000);
    expect(venice.wastePerCapitaKg).toBeGreaterThan(500);
    expect(venice.separateCollectionRate).toBeGreaterThan(50);
    expect(venice.residualWasteKg + venice.recoveredWasteKg).toBe(venice.totalWasteKg);

    const f = venice.fractionsKg;
    expect(f.organicForsu).toBeGreaterThan(0);
    expect(f.paperCardboard).toBeGreaterThan(0);
    expect(f.multimaterial).toBeGreaterThan(0);
    expect(f.residualDry).toBe(venice.residualWasteKg);
  });

  it('provides a 10-year time series from 2015 to 2024', () => {
    const series = getWasteTimeSeries();
    expect(series.length).toBe(10);
    expect(series[0].year).toBe(2015);
    expect(series[series.length - 1].year).toBe(2024);

    // RD percentage should have grown over time
    expect(series[series.length - 1].separateRate).toBeGreaterThan(series[0].separateRate);
  });

  it('provides municipality benchmarks with tourist highlights', () => {
    const benchmarks = getWasteBenchmarks();
    expect(benchmarks.length).toBeGreaterThan(5);

    const cavallino = benchmarks.find((b) => b.municipality === 'Cavallino-Treporti');
    expect(cavallino).toBeDefined();
    expect(cavallino!.wastePerCapitaKg).toBeGreaterThan(1000); // tourist load

    const mira = benchmarks.find((b) => b.municipality === 'Mira');
    expect(mira).toBeDefined();
    expect(mira!.separateRate).toBeGreaterThan(80); // mainland high recycling
  });

  it('provides metropolitan total aggregates', () => {
    const metro = getWasteMetropolitanTotal();
    expect(metro.population).toBeGreaterThan(800000);
    expect(metro.totalWasteKg).toBeGreaterThan(400000000);
    expect(metro.separateRate).toBeGreaterThan(70);
  });
});
