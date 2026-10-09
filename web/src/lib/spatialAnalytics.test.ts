import { describe, it, expect } from 'vitest';
import {
  apparentTemperatureC,
  relativeHumidityPercent,
  calculateEmergencyAccessibility,
  calculateTourismPressure,
  calculateTransitPunctuality,
  calculateBarrierFreeIndex,
  calculateTideFloodForecast72h,
  calculateCanalBottlenecksForecast,
  calculateUrbanHeatStressForecast
} from './spatialAnalytics';
import { VERIFIED_PUBLIC_DAE } from './dae-data';
import { VERIFIED_PHARMACIES } from './pharmacies-data';

describe('Spatial Analytics & Forecasting module', () => {
  it('calculates emergency accessibility metrics accurately', () => {
    const stats = calculateEmergencyAccessibility();
    expect(stats.totalDae).toBe(VERIFIED_PUBLIC_DAE.length);
    expect(stats.totalPharmacies).toBe(VERIFIED_PHARMACIES.length);
    expect(stats.totalEmergencyDocks).toBe(8);
    expect(stats.basis).toBe('calcolato');
    expect(stats.referencePointsCount).toBeGreaterThan(20);
    for (const v of [stats.daeCoverage200mPercent, stats.pharmacyCoverage350mPercent, stats.emergencyDockPerimeterCoveragePercent]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
    expect(stats.underservedAreas.length).toBe(4);
    const d = stats.underservedAreas.map((a) => a.distanceToNearestDaeMeters);
    expect([...d].sort((a, b) => b - a)).toEqual(d);
    expect(d[0]).toBeGreaterThan(200);
  });

  it('marks tourism pressure as illustrative and derives the highest-pressure sestiere', () => {
    const stats = calculateTourismPressure();
    expect(stats.basis).toBe('illustrativo');
    const max = Math.max(...stats.sestieri.map((s) => s.bedsPerResidentRatio));
    expect(stats.sestieri.find((s) => s.sestiere === stats.highestPressureSestiere)!.bedsPerResidentRatio).toBe(max);
    expect(stats.sestieri.length).toBe(6);
    expect(stats.highestPressureSestiere).toBe('San Marco');
    const sanMarco = stats.sestieri.find((s) => s.sestiere === 'San Marco');
    expect(sanMarco).toBeDefined();
    expect(sanMarco!.saturationLevel).toBe('Estrema');
    expect(sanMarco!.bedsPerResidentRatio).toBeGreaterThan(1.0);
  });

  it('calculates public transit punctuality and delay patterns', () => {
    const stats = calculateTransitPunctuality();
    expect(stats.basis).toBe('illustrativo');
    expect(stats.totalScheduledRoutes).toBe(30);
    expect(stats.totalWaterbusStops).toBe(153);
    expect(stats.onTimePercent).toBeGreaterThan(80);
    expect(stats.criticalLines.length).toBeGreaterThanOrEqual(2);
    expect(stats.resilientLines.length).toBeGreaterThanOrEqual(2);
  });

  it('computes barrier-free index across historic Venetian bridges', () => {
    const stats = calculateBarrierFreeIndex();
    expect(stats.totalHistoricBridges).toBe(435);
    expect(stats.accessibleBridgesCount).toBe(35);
    expect(stats.accessibilityPercentage).toBeCloseTo(8.05, 1);
    expect(stats.basis).toBe('illustrativo');
    // nessun itinerario "verificato": solo rimandi a fonti ufficiali
    expect(stats.officialReferences.every((r) => r.url.startsWith('https://'))).toBe(true);
  });

  it('interpolates 72-96h tide flood forecast accurately from extremes', () => {
    const mockForecast = {
      issuedAt: '2026-10-08 12:00:00',
      stale: false,
      extremes: [
        { at: '2026-10-08 14:00:00', type: 'max' as const, levelCm: 115 },
        { at: '2026-10-08 20:30:00', type: 'min' as const, levelCm: 15 },
        { at: '2026-10-09 02:45:00', type: 'max' as const, levelCm: 85 }
      ]
    };
    const analysis = calculateTideFloodForecast72h(mockForecast);
    expect(analysis.maxPeakCm).toBe(115);
    expect(analysis.moseDeploymentForecasted).toBe(true);
    expect(analysis.maxFloodedPercent).toBeGreaterThan(15);
    expect(analysis.forecastPoints.length).toBeGreaterThan(5);
    expect(analysis.hoursWithPasserelleCount).toBeGreaterThan(0);
  });

  it('evaluates canal traffic bottlenecks and tidal height constraints', () => {
    const bottlenecks = calculateCanalBottlenecksForecast();
    expect(bottlenecks.length).toBeGreaterThanOrEqual(4);
    expect(bottlenecks.every((b) => b.basis === 'illustrativo')).toBe(true);
    const guglie = bottlenecks.find((b) => b.canalName.includes('Guglie'));
    expect(guglie).toBeDefined();
    expect(guglie!.riskFactor).toBe('Critico');
    expect(guglie!.capacitySaturationPercent).toBeGreaterThan(80);
  });

  it('computes Steadman apparent temperature and Magnus humidity', () => {
    expect(relativeHumidityPercent(20, 20)).toBe(100);
    expect(relativeHumidityPercent(28, 18)).toBe(55);
    // 30 °C e 50% di umidità: e ≈ 21.2 hPa → AT ≈ 33 °C
    expect(apparentTemperatureC(30, 50)).toBeCloseTo(33, 0);
  });

  it('returns no heat estimate without METAR instead of default values', () => {
    const h = calculateUrbanHeatStressForecast(null, null);
    expect(h.baseAirTempC).toBeNull();
    expect(h.zones).toEqual([]);
  });

  it('estimates urban heat stress from METAR and curated zone anomalies', () => {
    const heatForecast = calculateUrbanHeatStressForecast(28.0, 18.0);
    expect(heatForecast.baseHeatIndexC).toBeGreaterThan(25);
    expect(heatForecast.zones.length).toBeGreaterThanOrEqual(5);
    const tronchetto = heatForecast.zones.find((z) => z.zoneName.includes('Tronchetto'));
    const giardini = heatForecast.zones.find((z) => z.zoneName.includes('Giardini'));
    expect(tronchetto).toBeDefined();
    expect(giardini).toBeDefined();
    expect(tronchetto!.perceivedPeakTempC).toBeGreaterThan(giardini!.perceivedPeakTempC);
  });
});
