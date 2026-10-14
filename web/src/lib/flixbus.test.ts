import { describe, expect, it } from 'vitest';
import { distanceAt, flixbusPositions, pointOnShape, type FlixbusData, type FlixStop } from './flixbus';

// Mestre 10:00 UTC (sosta 5 min) -> 20 km -> Padova 10:30 UTC
const stops: FlixStop[] = [
  [0, 36000, 36300, 'Venice Mestre (Stazione FS)', true],
  [20000, 38100, 38400, 'Padua', false],
];
const shape: [number, number, number][] = [[12.23, 45.48, 0], [12.16, 45.45, 8000], [12.1, 45.42, 14000]];

describe('FlixBus da orario', () => {
  it('fermo in sosta, poi avanza in proporzione al tempo', () => {
    expect(distanceAt(stops, 36100)).toEqual({ d: 0, atStop: 0, next: 1 });
    expect(distanceAt(stops, 37200)?.d).toBe(10000);
    expect(distanceAt(stops, 35000)).toBeNull();
    expect(distanceAt(stops, 39000)).toBeNull();
  });

  it('punto sul percorso ritagliato; fuori dal tratto (fuori mappa) nessuna posizione', () => {
    const p = pointOnShape(shape, 4000)!;
    expect(p.lon).toBeCloseTo(12.195, 3);
    expect(p.heading).toBeLessThan(0); // verso ovest
    expect(pointOnShape(shape, 15000)).toBeNull();
  });

  it('posizione per data di servizio in UTC', () => {
    const data: FlixbusData = { trips: [{ id: 't', line: '536', name: 'A - B', from: 'A', to: 'B', dates: ['20261015'], shape: 0, stops }], shapes: [shape] };
    const now = Date.UTC(2026, 9, 15, 10, 20); // 10:20 UTC: in viaggio, 5000 m su 20000
    const [b] = flixbusPositions(data, now);
    expect(b.next).toEqual({ name: 'Padua', at: Date.UTC(2026, 9, 15, 10, 35), venice: false });
    expect(b.atStop).toBeNull();
    expect(flixbusPositions(data, Date.UTC(2026, 9, 16, 10, 20))).toEqual([]); // il giorno dopo non c'è servizio
  });
});
