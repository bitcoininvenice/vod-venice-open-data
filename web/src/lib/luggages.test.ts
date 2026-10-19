import { describe, expect, it } from 'vitest';
import { LUGGAGE_DATA, OPEN_LUGGAGE_STORAGE, nearestLuggageStorage } from './luggages';

describe('depositi bagagli da OpenStreetMap', () => {
  it('vengono da OpenStreetMap, senza prezzi, valutazioni né gestore', () => {
    expect(LUGGAGE_DATA.attribution).toMatch(/OpenStreetMap/);
    expect(OPEN_LUGGAGE_STORAGE.length).toBeGreaterThan(0);
    for (const s of OPEN_LUGGAGE_STORAGE) {
      expect(s.osmUrl).toMatch(/^https:\/\/www\.openstreetmap\.org\//);
      expect(['locker', 'staffed']).toContain(s.type);
      expect(s.lat).toBeGreaterThan(45.2);
      expect(s.lat).toBeLessThan(45.56);
      for (const k of ['pricePerDay', 'rating', 'reviewCount', 'operator', 'network']) expect(s).not.toHaveProperty(k);
    }
  });

  it('trova i depositi più vicini a un punto', () => {
    const near = nearestLuggageStorage(OPEN_LUGGAGE_STORAGE, 45.4825, 12.2325, 2);
    expect(near.length).toBeLessThanOrEqual(2);
    if (near.length === 2) expect(near[0].distanceMeters).toBeLessThanOrEqual(near[1].distanceMeters);
  });
});
