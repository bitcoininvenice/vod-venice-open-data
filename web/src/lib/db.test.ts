import { describe, expect, it } from 'vitest';
import { calculateDistanceMeters, findStopsNearCantieri } from './db';

describe('calculateDistanceMeters', () => {
  it('distanza nulla tra punti coincidenti', () => {
    expect(calculateDistanceMeters(45.4371, 12.3358, 45.4371, 12.3358)).toBe(0);
  });
  it('Rialto - San Marco circa 650 m', () => {
    const d = calculateDistanceMeters(45.4380, 12.3358, 45.4341, 12.3388);
    expect(d).toBeGreaterThan(400);
    expect(d).toBeLessThan(700);
  });
});

describe('findStopsNearCantieri', () => {
  it('rispetta il raggio e ordina per distanza', async () => {
    const res = await findStopsNearCantieri(200);
    expect(res.every((r) => r.distanzaMetri <= 200)).toBe(true);
    const d = res.map((r) => r.distanzaMetri);
    expect([...d].sort((a, b) => a - b)).toEqual(d);
  });
  it('un raggio maggiore non riduce i risultati', async () => {
    expect((await findStopsNearCantieri(500)).length).toBeGreaterThanOrEqual((await findStopsNearCantieri(100)).length);
  });
});
