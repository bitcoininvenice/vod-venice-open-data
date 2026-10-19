import { describe, it, expect } from 'vitest';
import { distanceAt, pointOnShape, dolomitiPositions, DOLOMITI_COLOR } from './dolomitibus';
import dolomitiJson from '@/data/dolomitibus-venezia.json';
import type { DolomitiData, DolomitiStop, DolomitiShape } from './dolomitibus';

describe('dolomitibus', () => {
  it('ha il colore distintivo verde Dolomiti', () => {
    expect(DOLOMITI_COLOR).toBe('#059669');
  });

  it('calcola correttamente la distanza e la fermata su una tratta', () => {
    const stops: DolomitiStop[] = [
      [0, 1000, 1000, 'Venezia P.le Roma', true],
      [8600, 1600, 1600, 'Mestre Stazione FS', true],
      [19000, 2200, 2200, 'Aeroporto Marco Polo', true],
    ];

    expect(distanceAt(stops, 999)).toBeNull();
    expect(distanceAt(stops, 2201)).toBeNull();

    // Fermo al capolinea
    const atOrigin = distanceAt(stops, 1000);
    expect(atOrigin?.d).toBe(0);
    expect(atOrigin?.atStop).toBe(0);

    // In viaggio verso Mestre (t = 1300s, a metà tra 1000 e 1600)
    const mid = distanceAt(stops, 1300);
    expect(mid?.d).toBe(4300);
    expect(mid?.atStop).toBeNull();
    expect(mid?.next).toBe(1);
  });

  it('interpola le coordinate su uno shape', () => {
    const shape: DolomitiShape = [
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
    const data = dolomitiJson as unknown as DolomitiData;
    expect(data.trips.length).toBeGreaterThan(0);
    expect(data.shapes.length).toBe(2);

    // Orario in cui è attiva la prima corsa (es. ore 08:00 UTC = 28800s, corsa 06:20-09:30)
    const testDate = data.trips[0].dates[0];
    const y = Number(testDate.slice(0, 4));
    const m = Number(testDate.slice(4, 6)) - 1;
    const d = Number(testDate.slice(6, 8));
    const testEpochMs = Date.UTC(y, m, d, 8, 0, 0);

    const positions = dolomitiPositions(data, testEpochMs);
    expect(positions.length).toBeGreaterThan(0);
    expect(positions[0].trip.line).toBe('72');
    expect(positions[0].lon).toBeGreaterThan(12.0);
    expect(positions[0].lat).toBeGreaterThan(45.0);
  });
});
