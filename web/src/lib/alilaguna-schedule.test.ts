import { describe, expect, it } from 'vitest';
import { ALILAGUNA_FEED_META, ALILAGUNA_ROUTES, ALILAGUNA_STOPS, getScheduledAlilagunaBoats, isAlilagunaTimetableValid } from './alilaguna-schedule';

const IN_SEASON = new Date('2026-07-15T10:00:00Z');
const OUT_OF_SEASON = new Date('2026-01-15T10:00:00Z');

describe('Alilaguna da GTFS ufficiale', () => {
  it('carica linee, fermate e corse dal feed', () => {
    expect(ALILAGUNA_ROUTES.map((r) => r.lineCode).sort()).toEqual(['ARANCIO', 'BLU', 'ROSSA']);
    expect(ALILAGUNA_STOPS.some((s) => s.isAirportHub)).toBe(true);
    expect(ALILAGUNA_FEED_META.dailyTrips).toBeGreaterThan(100);
    for (const r of ALILAGUNA_ROUTES) {
      expect(r.shape.length).toBeGreaterThan(10);
      expect(r.frequencyMinutes).toBeGreaterThan(0);
    }
  });

  it('a metà giornata in stagione ci sono barche in navigazione vicino a Venezia', () => {
    const boats = getScheduledAlilagunaBoats(12 * 3600, IN_SEASON);
    expect(boats.length).toBeGreaterThan(0);
    for (const b of boats) {
      expect(b.lat).toBeGreaterThan(45.3);
      expect(b.lat).toBeLessThan(45.6);
      expect(b.lon).toBeGreaterThan(12.2);
      expect(b.lon).toBeLessThan(12.5);
    }
  });

  it('fuori dalla validità dell\'orario non mostra barche', () => {
    expect(isAlilagunaTimetableValid(OUT_OF_SEASON)).toBe(false);
    expect(getScheduledAlilagunaBoats(12 * 3600, OUT_OF_SEASON)).toEqual([]);
  });

  it('alle 3 di notte non ci sono corse', () => {
    expect(getScheduledAlilagunaBoats(3 * 3600, IN_SEASON)).toEqual([]);
  });
});
