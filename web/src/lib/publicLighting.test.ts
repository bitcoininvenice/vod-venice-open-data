import { describe, expect, it } from 'vitest';
import { getPublicLightingStatus, LIGHTING_DATA, nearestLightingPoint, OPEN_PUBLIC_LIGHTING } from './publicLighting';

describe('lampioni da OpenStreetMap', () => {
  it('vengono da OpenStreetMap, senza potenze, lumen o nomi inventati', () => {
    expect(LIGHTING_DATA.attribution).toMatch(/OpenStreetMap/);
    expect(OPEN_PUBLIC_LIGHTING.length).toBeGreaterThan(100);
    for (const p of OPEN_PUBLIC_LIGHTING.slice(0, 200)) {
      expect(p.osmUrl).toMatch(/^https:\/\/www\.openstreetmap\.org\/node\/\d+$/);
      for (const k of ['watts', 'lumens', 'colorTempK', 'name']) expect(p).not.toHaveProperty(k);
    }
  });

  it('accesi di notte e spenti di giorno secondo il sole, senza consumi stimati', () => {
    const date = new Date('2026-06-21T12:00:00+02:00');
    const night = getPublicLightingStatus(23.5 * 3600, date);
    expect(night.state).toBe('night_active');
    expect(night.intensityFactor).toBe(1);
    expect(night.mappedCount).toBe(OPEN_PUBLIC_LIGHTING.length);
    const day = getPublicLightingStatus(13 * 3600, date);
    expect(day.state).toBe('day_off');
    expect(day.intensityFactor).toBe(0);
    expect(day).not.toHaveProperty('totalKw');
  });

  it('trova il lampione più vicino', () => {
    const p = OPEN_PUBLIC_LIGHTING[0];
    expect(nearestLightingPoint(OPEN_PUBLIC_LIGHTING, p.lat, p.lon)?.id).toBe(p.id);
  });
});
