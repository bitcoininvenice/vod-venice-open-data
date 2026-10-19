import { describe, expect, it } from 'vitest';
import { findStops, resolvePlace, stopsNear } from './places';
import { hhmm, tripContext, type TripContext } from './context';

describe('luoghi riconosciuti dagli strumenti di calcolo', () => {
  it('coordinate, aeroporto, civici, fermate e indirizzi', () => {
    expect(resolvePlace('45.4341, 12.3388')).toMatchObject({ kind: 'coordinates', lat: 45.4341, lon: 12.3388 });
    expect(resolvePlace('40.0,12.3')).toBeNull(); // fuori area
    expect(resolvePlace('marco polo')?.kind).toBe('airport');
    expect(resolvePlace('VCE')?.kind).toBe('airport');
    expect(resolvePlace('mestre')?.kind).toBe('station');
    expect(resolvePlace('Mestre Stazione')?.kind).toBe('station');
    expect(resolvePlace('stazione di mestre')?.kind).toBe('station');
    const civic = resolvePlace('CN 3450');
    expect(civic?.kind).toBe('civic');
    expect(civic?.label).toMatch(/^Cannaregio 3450/);
    expect(resolvePlace('Rialto')).toMatchObject({ kind: 'stop' });
    expect(resolvePlace('cannaregio calle minestra')).toMatchObject({ kind: 'address', approximate: true });
    expect(resolvePlace('xyzzzz qwerty')).toBeNull();
  });

  it('fermate per nome e vicine, ACTV e Alilaguna', () => {
    const hits = findStops('aeroporto', 10);
    expect(hits.some((s) => s.operator === 'Alilaguna')).toBe(true);
    expect(hits.some((s) => s.operator === 'ACTV')).toBe(true);
    const near = stopsNear(45.504509, 12.339084, 50);
    expect(near.some((s) => /MARCO POLO/i.test(s.name))).toBe(true);
  });
});

describe('giorno e ora del viaggio', () => {
  const now = new Date('2026-10-14T08:30:00Z'); // 10:30 a Venezia, mercoledì
  it('adesso, oppure data e ora indicate', () => {
    const live = tripContext(null, null, now) as TripContext;
    expect(live.isNow).toBe(true);
    expect(live.dateLabel).toBe('2026-10-14');
    expect(live.timeLabel).toBe('10:30');
    expect(live.day).toBe('weekday');
    const sat = tripContext('2026-10-17', '07:05', now) as TripContext;
    expect(sat).toMatchObject({ isNow: false, seconds: 7 * 3600 + 5 * 60, day: 'saturday', nextDay: 'sunday', timeLabel: '07:05' });
  });

  it('errori espliciti sul formato', () => {
    expect(tripContext('14/10/2026', null, now)).toEqual({ error: expect.stringMatching(/YYYY-MM-DD/) });
    expect(tripContext(null, '25:00', now)).toEqual({ error: expect.stringMatching(/HH:MM/) });
  });

  it('orari oltre la mezzanotte', () => {
    expect(hhmm(86400 + 600)).toBe('00:10');
    expect(hhmm(36000)).toBe('10:00');
  });
});
