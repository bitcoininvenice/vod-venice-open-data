import { describe, expect, it } from 'vitest';
import { ARPAV_AIR_STATIONS, classifyAirQuality } from './airQuality';

describe('classificazione qualità aria (limiti UE)', () => {
  it('entro i limiti 2030 -> BUONA', () => {
    expect(classifyAirQuality({ pm10: 18, pm25: 9, no2: 15, pm10Exceedances: 5 })).toBe('BUONA');
  });
  it('entro i limiti vigenti ma oltre quelli 2030 -> ACCETTABILE', () => {
    expect(classifyAirQuality({ pm10: 26, pm25: 16, no2: 24, pm10Exceedances: 29 })).toBe('ACCETTABILE');
  });
  it('oltre 35 superamenti giornalieri di PM10 -> SCADENTE', () => {
    expect(classifyAirQuality({ pm10: 28, pm25: null, no2: 25, pm10Exceedances: 36 })).toBe('SCADENTE');
  });
  it('i valori mancanti non influenzano la classificazione', () => {
    expect(classifyAirQuality({ pm10: null, pm25: null, no2: 10, pm10Exceedances: null })).toBe('BUONA');
  });
});

describe('stazioni ARPAV importate', () => {
  it('hanno posizione e anno di riferimento', () => {
    expect(ARPAV_AIR_STATIONS.length).toBeGreaterThan(0);
    for (const s of ARPAV_AIR_STATIONS) {
      expect(s.year).toBeGreaterThanOrEqual(2020);
      expect(s.lastUpdate).toContain(String(s.year));
    }
  });
});
