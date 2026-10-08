import { describe, expect, it } from 'vitest';
import { parseOpenSkyStates } from './opensky';

const state = (overrides: Record<number, unknown> = {}) => {
  const base: unknown[] = ['4ca7b5', 'RYR12AB ', 'Ireland', 0, 0, 12.35, 45.5, 900, false, 70, 42, -4, null, 950, '1234', false, 0];
  Object.entries(overrides).forEach(([i, v]) => (base[Number(i)] = v));
  return base;
};

describe('parseOpenSkyStates', () => {
  it('normalizza un aereo in avvicinamento', () => {
    const [f] = parseOpenSkyStates({ time: 1, states: [state()] });
    expect(f).toMatchObject({ icao24: '4ca7b5', callsign: 'RYR12AB', status: 'APPROACH', altitudeMeters: 900, speedKmh: 252 });
  });
  it('classifica a terra come TAXI e in salita come DEPARTURE', () => {
    const [ground, climb] = parseOpenSkyStates({ time: 1, states: [state({ 8: true }), state({ 11: 6 })] });
    expect(ground.status).toBe('TAXI');
    expect(climb.status).toBe('DEPARTURE');
  });
  it('scarta stati senza posizione', () => {
    expect(parseOpenSkyStates({ time: 1, states: [state({ 5: null })] })).toEqual([]);
  });
  it('states null significa nessun aereo, non un errore', () => {
    expect(parseOpenSkyStates({ time: 1, states: null })).toEqual([]);
  });
});
