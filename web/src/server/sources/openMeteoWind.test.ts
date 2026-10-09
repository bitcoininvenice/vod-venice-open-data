import { describe, expect, it } from 'vitest';
import { WIND_GRID, openMeteoWindUrl, parseOpenMeteoWind, toUV } from './openMeteoWind';

const point = (speed: number, dir: number) => ({ current: { time: '2026-10-09T10:30', wind_speed_10m: speed, wind_direction_10m: dir } });

describe('Open-Meteo vento', () => {
  it('converte la direzione meteorologica in componenti u/v', () => {
    const [u, v] = toUV(10, 0); // da nord: soffia verso sud
    expect(u).toBeCloseTo(0);
    expect(v).toBeCloseTo(-10);
    const [u2, v2] = toUV(5, 90); // da est: soffia verso ovest
    expect(u2).toBeCloseTo(-5);
    expect(v2).toBeCloseTo(0);
  });

  it('chiede tutti i punti della griglia in una sola richiesta', () => {
    const url = new URL(openMeteoWindUrl());
    expect(url.searchParams.get('latitude')!.split(',')).toHaveLength(WIND_GRID.nx * WIND_GRID.ny);
    expect(url.searchParams.get('wind_speed_unit')).toBe('ms');
  });

  it('legge la griglia e rifiuta risposte incomplete', () => {
    const n = WIND_GRID.nx * WIND_GRID.ny;
    const field = parseOpenMeteoWind(Array.from({ length: n }, (_, i) => point(i === 3 ? 12 : 4, 135)));
    expect(field.u).toHaveLength(n);
    expect(field.maxSpeedMs).toBe(12);
    expect(field.validTime).toBe('2026-10-09T10:30');
    expect(() => parseOpenMeteoWind([point(4, 135)])).toThrow();
    expect(() => parseOpenMeteoWind(Array.from({ length: n }, () => ({ current: {} })))).toThrow();
  });
});
