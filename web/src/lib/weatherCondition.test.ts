import { describe, it, expect } from 'vitest';
import { detectWeatherCondition } from './weatherCondition';
import type { AirportMetarData } from './types';

function mockMetar(overrides: Partial<AirportMetarData> = {}): AirportMetarData {
  return {
    icao: 'LIPZ',
    iata: 'VCE',
    stationName: 'Venezia Tessera',
    rawMetar: 'LIPZ 171420Z 08006KT CAVOK 16/11 Q1018',
    observationTime: '2026-10-17T14:20:00Z',
    windDirectionDeg: 80,
    windCompass: 'E',
    windSpeedKnots: 6,
    windSpeedKmh: 11.1,
    visibilityMeters: 10000,
    temperatureCelsius: 16,
    dewPointCelsius: 11,
    relativeHumidityPercent: 72,
    qnhHpa: 1018,
    flightCategory: 'VFR',
    cloudsDescription: 'Cielo sereno',
    activeRunway: '04R',
    crosswindKnots: 4,
    headwindKnots: 5,
    runwayCondition: 'Asciutta',
    officialSource: 'NOAA',
    ...overrides,
  };
}

describe('detectWeatherCondition', () => {
  it('rileva condizione sole/sereno con CAVOK', () => {
    const res = detectWeatherCondition(mockMetar());
    expect(res.condition).toBe('sole');
    expect(res.labelIt).toBe('Sereno');
    expect(res.labelEn).toBe('Clear');
  });

  it('rileva pioggia con codice RA o -RA', () => {
    const res = detectWeatherCondition(
      mockMetar({ rawMetar: 'LIPZ 171420Z 05010KT 5000 -RA BKN020 14/12 Q1015' })
    );
    expect(res.condition).toBe('pioggia');
    expect(res.labelIt).toBe('Pioggia');
  });

  it('rileva neve con codice SN', () => {
    const res = detectWeatherCondition(
      mockMetar({ rawMetar: 'LIPZ 171420Z 02008KT 3000 SN OVC010 01/00 Q1012' })
    );
    expect(res.condition).toBe('neve');
    expect(res.labelIt).toBe('Neve');
  });

  it('rileva nebbia con codice FG o visibilita ridotta', () => {
    const res = detectWeatherCondition(
      mockMetar({
        rawMetar: 'LIPZ 171420Z 00000KT 0300 FG VV001 08/08 Q1022',
        visibilityMeters: 300,
      })
    );
    expect(res.condition).toBe('nebbia');
    expect(res.labelIt).toBe('Nebbia');
  });

  it('rileva vento forte se velocita >= 35 km/h o groppi', () => {
    const res = detectWeatherCondition(
      mockMetar({
        rawMetar: 'LIPZ 171420Z 05022KT 9999 FEW030 15/10 Q1016',
        windSpeedKmh: 40.7,
      })
    );
    expect(res.condition).toBe('vento');
    expect(res.labelIt).toBe('Vento forte');
  });

  it('rileva nuvole con cielo coperto OVC o BKN', () => {
    const res = detectWeatherCondition(
      mockMetar({
        rawMetar: 'LIPZ 171420Z 12005KT 9999 OVC015 15/12 Q1017',
        cloudsDescription: 'Cielo coperto',
      })
    );
    expect(res.condition).toBe('nuvola');
    expect(res.labelIt).toBe('Nuvoloso');
  });

  it('gestisce fallback pulito se metar non e disponibile', () => {
    expect(detectWeatherCondition(null).condition).toBe('sole');
    expect(detectWeatherCondition(null, 45).condition).toBe('vento');
  });
});
