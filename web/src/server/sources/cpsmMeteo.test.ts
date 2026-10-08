import { describe, expect, it } from 'vitest';
import vento from '@/test/fixtures/cpsm-vento.json';
import ondeMare from '@/test/fixtures/cpsm-onde_mare.json';
import ondeLaguna from '@/test/fixtures/cpsm-onde_laguna.json';
import tempAcqua from '@/test/fixtures/cpsm-tempacqua.json';
import tempAria from '@/test/fixtures/cpsm-temparia.json';
import livello from '@/test/fixtures/livello.json';
import {
  buildWindStations,
  parseCpsmFeed,
  parseNumber,
  parseWaves,
  parseWind,
  platformReadings,
  tidePushRisk,
  windName,
} from './cpsmMeteo';

describe('parser CPSM', () => {
  it('vento', () => {
    expect(parseWind('172 gradi, 1.4 m/s, 1.8 m/s')).toEqual({ deg: 172, speedMs: 1.4, gustMs: 1.8 });
    expect(parseWind(undefined)).toBeNull();
  });
  it('onde', () => {
    expect(parseWaves('1.26 m, 2.01 m')).toEqual({ hs: 1.26, hmax: 2.01 });
    expect(parseWaves('')).toBeNull();
  });
  it('valori numerici con unità', () => {
    expect(parseNumber('19.7 °C')).toBe(19.7);
    expect(parseNumber('1009.9 hPa')).toBe(1009.9);
    expect(parseNumber(undefined)).toBeNull();
  });
  it('scarta righe malformate e accetta stazioni senza misura', () => {
    const rows = parseCpsmFeed([{ ID_stazione: '1', stazione: 'X' }, { foo: 1 }]);
    expect(rows).toHaveLength(1);
    expect(rows[0].value).toBeUndefined();
  });
});

describe('venti e spinta sulla marea', () => {
  it.each([
    [0, 'TRAMONTANA'], [30, 'GRECALE'], [60, 'BORA'], [90, 'LEVANTE'],
    [135, 'SCIROCCO'], [180, 'OSTRO'], [225, 'LIBECCIO'], [270, 'PONENTE'], [315, 'MAESTRALE'],
  ])('%i° -> %s', (deg, name) => {
    expect(windName(deg)).toBe(name);
  });
  it('solo Scirocco/Ostro forti aumentano la spinta', () => {
    expect(tidePushRisk(135, 11)).toBe('ALTO');
    expect(tidePushRisk(60, 20)).toBe('BASSO');
    expect(tidePushRisk(140, 3)).toBe('BASSO');
  });
});

describe('stazioni dalla fixture reale', () => {
  const feeds = {
    vento: parseCpsmFeed(vento),
    ondeMare: parseCpsmFeed(ondeMare),
    ondeLaguna: parseCpsmFeed(ondeLaguna),
    tempAcqua: parseCpsmFeed(tempAcqua),
    tempAria: parseCpsmFeed(tempAria),
    livello: parseCpsmFeed(livello),
  };

  it('include solo stazioni con vento misurato e coordinate pubblicate', () => {
    const stations = buildWindStations(feeds);
    expect(stations.length).toBeGreaterThan(5);
    for (const s of stations) {
      expect(Number.isFinite(s.lat)).toBe(true);
      expect(s.windSpeedKmh).toBeGreaterThanOrEqual(0);
      expect(s.observedAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
    }
    const platform = stations.find((s) => s.id === 'CPSM_1021');
    expect(platform?.waveHeightMeters).not.toBeNull();
    expect(platform?.stationType).toBe('PIATTAFORMA_OFFSHORE');
  });

  it('letture della piattaforma Acqua Alta', () => {
    const p = platformReadings(feeds);
    expect(p.waveHeightMeters).toBeGreaterThanOrEqual(0);
    // nella fixture la piattaforma non pubblica la temperatura dell'acqua: deve restare null, non inventata
    expect(p.waterTempC).toBeNull();
  });
});
