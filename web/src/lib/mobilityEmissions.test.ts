import { describe, expect, it } from 'vitest';
import { calculateItineraryEmissions, fossilScore, propulsionOf, propulsionReport } from './mobilityEmissions';
import type { Leg } from './tripPlanner';

const ride = (category: string, startMin: number, endMin: number, operator?: string, line = '1'): Leg => ({
  kind: 'ride', line, category, headsign: '', from: 'A', to: 'B', start: startMin * 60, end: endMin * 60, stops: 2, coords: [], tripDeparture: 0,
  ...(operator ? { operator } : {}),
});
const walk: Leg = { kind: 'walk', from: 'A', to: 'B', meters: 400, seconds: 300, start: 0, end: 300, coords: [], wetMeters: 0, passerellaMeters: 0, maxDepthCm: 0 };

describe('alimentazione dei mezzi', () => {
  it('tram, People Mover e treni elettrici; barche e bus extraurbani termici; bus urbani ACTV non noti', () => {
    expect(propulsionOf('tram')).toBe('electric');
    expect(propulsionOf('peoplemover')).toBe('electric');
    expect(propulsionOf('bus', 'Trenitalia')).toBe('electric');
    expect(propulsionOf('vaporetto')).toBe('fossil');
    expect(propulsionOf('bus', 'ATVO')).toBe('fossil');
    expect(propulsionOf('bus')).toBe('unknown');
  });

  it('tempo del viaggio per alimentazione, dall\'orario, e ordinamento «più ecologico»', () => {
    const tram = calculateItineraryEmissions({ legs: [walk, ride('tram', 10, 30, undefined, 'T1')] });
    expect(tram).toMatchObject({ walkSeconds: 300, electricSeconds: 1200, fossilSeconds: 0, isZeroEmission: true });
    const boat = calculateItineraryEmissions({ legs: [ride('vaporetto', 0, 25)] });
    expect(boat).toMatchObject({ fossilSeconds: 1500, isZeroEmission: false });
    expect(fossilScore(tram)).toBeLessThan(fossilScore(boat));
    expect(boat).not.toHaveProperty('totalGrams');
  });

  it('riepilogo delle corse per alimentazione', () => {
    const r = propulsionReport('2026-10-19', [
      { mode: 'tram', operator: 'ACTV', propulsion: 'electric', trips: 300 },
      { mode: 'vaporetto', operator: 'ACTV', propulsion: 'fossil', trips: 2000 },
    ]);
    expect(r.total).toBe(2300);
    expect(r.modes[0].mode).toBe('vaporetto');
  });
});
