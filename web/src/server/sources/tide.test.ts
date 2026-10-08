import { describe, expect, it } from 'vitest';
import livello from '@/test/fixtures/livello.json';
import previsione from '@/test/fixtures/previsione.json';
import {
  metersStringToCm,
  nextExtreme,
  parseTideForecast,
  parseTideLevels,
  REFERENCE_STATION_ID,
  romeLocalToDate,
  tideCategory,
  trendFromForecast,
} from './tide';

describe('metersStringToCm', () => {
  it('converte il formato pubblicato dal Comune', () => {
    expect(metersStringToCm('0.17 m')).toBe(17);
    expect(metersStringToCm('-0.05 m')).toBe(-5);
    expect(metersStringToCm('1,10 m')).toBe(110);
  });
  it('restituisce null per valori non numerici', () => {
    expect(metersStringToCm('n.d.')).toBeNull();
  });
});

describe('parseTideLevels', () => {
  it('normalizza tutte le stazioni della fixture reale', () => {
    const stations = parseTideLevels(livello);
    expect(stations.length).toBe(livello.length);
    const ref = stations.find((s) => s.id === REFERENCE_STATION_ID);
    expect(ref?.name).toMatch(/Punta Salute/);
    expect(ref?.levelCm).toBe(12);
    expect(ref?.observedAt).toBe('2026-10-08 01:50:00');
  });
  it('scarta le stazioni pubblicate senza misura (anomalia intermittente del portale)', () => {
    const raw = livello.map((s) => ({ ID_stazione: s.ID_stazione, stazione: s.stazione, latDDN: s.latDDN, lonDDE: s.lonDDE }));
    expect(parseTideLevels(raw)).toEqual([]);
  });
  it('scarta le stazioni con valore non numerico', () => {
    const raw = [{ ID_stazione: '1', stazione: 'X', latDDN: '45', lonDDE: '12', data: '2026-01-01 00:00:00', valore: '--' }];
    expect(parseTideLevels(raw)).toEqual([]);
  });
  it('rifiuta payload con forma inattesa', () => {
    expect(() => parseTideLevels({ foo: 'bar' })).toThrow();
  });
});

describe('romeLocalToDate', () => {
  it('applica CEST (UTC+2) in estate', () => {
    expect(romeLocalToDate('2026-07-01 12:00:00').toISOString()).toBe('2026-07-01T10:00:00.000Z');
  });
  it('applica CET (UTC+1) in inverno', () => {
    expect(romeLocalToDate('2026-01-15 12:00:00').toISOString()).toBe('2026-01-15T11:00:00.000Z');
  });
});

describe('parseTideForecast', () => {
  const issuedAt = '2026-09-21 17:00:00';

  it('espone sempre la data di emissione', () => {
    const f = parseTideForecast(previsione, new Date('2026-09-21T16:00:00Z'));
    expect(f?.issuedAt).toBe(issuedAt);
    expect(f?.extremes.length).toBeGreaterThan(0);
  });

  it('non segnala come vecchia una previsione emessa da poche ore', () => {
    const f = parseTideForecast(previsione, new Date('2026-09-21T20:00:00Z'));
    expect(f?.stale).toBe(false);
  });

  it('segnala come non aggiornata una previsione emessa da oltre 24 ore, senza nasconderla', () => {
    const f = parseTideForecast(previsione, new Date('2026-10-08T00:00:00Z'));
    expect(f?.stale).toBe(true);
    expect(f?.issuedAt).toBe(issuedAt);
    expect(f?.extremes.length).toBeGreaterThan(0);
  });

  it('ordina gli estremali per data', () => {
    const f = parseTideForecast(previsione)!;
    const ats = f.extremes.map((e) => e.at);
    expect([...ats].sort()).toEqual(ats);
  });

  it('restituisce null per una previsione vuota', () => {
    expect(parseTideForecast([])).toBeNull();
  });
});

describe('trend e prossimo estremale', () => {
  const forecast = {
    issuedAt: '2026-10-08 00:00:00',
    stale: false,
    extremes: [
      { at: '2026-10-08 04:00:00', type: 'min' as const, levelCm: -10 },
      { at: '2026-10-08 10:00:00', type: 'max' as const, levelCm: 85 },
    ],
  };
  it('in calo se il prossimo estremale è un minimo', () => {
    expect(trendFromForecast(forecast, new Date('2026-10-08T00:00:00Z'))).toBe('IN_CALO');
  });
  it('in aumento se il prossimo estremale è un massimo', () => {
    expect(trendFromForecast(forecast, new Date('2026-10-08T03:00:00Z'))).toBe('IN_AUMENTO');
  });
  it('nessuna tendenza se la previsione non copre il futuro', () => {
    expect(nextExtreme(forecast, new Date('2026-10-09T00:00:00Z'))).toBeNull();
    expect(trendFromForecast(forecast, new Date('2026-10-09T00:00:00Z'))).toBeNull();
  });
});

describe('tideCategory (soglie CPSM)', () => {
  it.each([
    [17, 'NORMALE'],
    [80, 'SOSTENUTA'],
    [109, 'SOSTENUTA'],
    [110, 'MOLTO_SOSTENUTA'],
    [140, 'ECCEZIONALE'],
  ])('%i cm -> %s', (cm, cat) => {
    expect(tideCategory(cm)).toBe(cat);
  });
});
