import { describe, it, expect } from 'vitest';
import { distanceAt, pointOnShape, atvoPositions, ATVO_COLOR } from './atvo';
import atvoJson from '@/data/atvo-venezia.json';
import type { AtvoData, AtvoStop, AtvoShape } from './atvo';

describe('atvo', () => {
  it('ha il colore distintivo azzurro ATVO', () => {
    expect(ATVO_COLOR).toBe('#0284c7');
  });

  it('calcola correttamente la distanza e la fermata su una tratta', () => {
    const stops: AtvoStop[] = [
      [0, 1000, 1000, 'Venezia P.le Roma', true],
      [14000, 2200, 2200, 'Aeroporto Marco Polo', true],
    ];

    expect(distanceAt(stops, 999)).toBeNull();
    expect(distanceAt(stops, 2201)).toBeNull();

    // Fermo al capolinea
    const atOrigin = distanceAt(stops, 1000);
    expect(atOrigin?.d).toBe(0);
    expect(atOrigin?.atStop).toBe(0);

    // A meta percorso (t = 1600s, esattamente meta tempo tra 1000 e 2200)
    const mid = distanceAt(stops, 1600);
    expect(mid?.d).toBe(7000);
    expect(mid?.atStop).toBeNull();
    expect(mid?.next).toBe(1);
  });

  it('interpola le coordinate su uno shape', () => {
    const shape: AtvoShape = [
      [12.31, 45.43, 0],
      [12.33, 45.45, 1000],
    ];

    const p = pointOnShape(shape, 500);
    expect(p).not.toBeNull();
    expect(p?.lon).toBeCloseTo(12.32, 2);
    expect(p?.lat).toBeCloseTo(45.44, 2);
    expect(p?.heading).toBeDefined();
  });

  it('calcola le posizioni dei bus in servizio dal dataset completo', () => {
    const data = atvoJson as unknown as AtvoData;
    expect(data.trips.length).toBeGreaterThan(100);
    // 35 e 35B, una forma per direzione
    expect(data.shapes.length).toBe(4);

    // Data di test inclusa nelle date di calendario
    const testDate = data.trips[0].dates[0];
    const y = Number(testDate.slice(0, 4));
    const m = Number(testDate.slice(4, 6)) - 1;
    const d = Number(testDate.slice(6, 8));
    // Ore 10:00:00 UTC (10 * 3600 = 36000s)
    const testEpochMs = Date.UTC(y, m, d, 10, 0, 0);

    const positions = atvoPositions(data, testEpochMs);
    expect(positions.length).toBeGreaterThan(0);
    expect(positions[0].trip.line).toBeDefined();
    expect(positions[0].lon).toBeGreaterThan(12.0);
    expect(positions[0].lat).toBeGreaterThan(45.0);
  });
});
