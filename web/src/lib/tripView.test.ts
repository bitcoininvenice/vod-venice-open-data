import { describe, expect, it } from 'vitest';
import type { SimModel, SimProfile, SimShape } from './simulationCore';
import { toGrid } from './positionDelay';
import { clock, resolveTrip, tripStops } from './tripView';
import type { StopItem } from './types';

const A = { lon: 12.3, lat: 45.43 };
const [x0, y0] = toGrid(A.lon, A.lat);
const sh: SimShape = { xy: Float32Array.from([x0, y0, x0 + 1000, y0, x0 + 2000, y0]), cum: Float32Array.from([0, 1000, 2000]), n: 3 };
const profile: SimProfile = { sh, route: { n: '2', c: 'vaporetto', ci: 0, cat: 'vaporetto' }, T: Int32Array.from([0, 300, 330, 600]), Dd: Int32Array.from([0, 1000, 1005, 2000]) };
const empty = { tP: new Int32Array(0), t0: new Int32Array(0), t1: new Int32Array(0), count: 0 };
const sim: SimModel = {
  shapes: [sh], routes: [profile.route], profs: [profile],
  daysTrips: { weekday: { tP: Int32Array.from([0]), t0: Int32Array.from([36000]), t1: Int32Array.from([36600]), count: 1 }, saturday: empty, sunday: empty },
};

const stop = (name: string, metersEast: number): StopItem => {
  const perDegree = toGrid(A.lon + 1, A.lat)[0] - x0;
  return { id: name, name, lat: A.lat, lon: A.lon + metersEast / perDegree, mode: 'navigazione' };
};

describe('corsa del mezzo selezionato', () => {
  it('risolve la corsa per indice (mezzi da orario) e per linea e partenza (mezzi GPS)', () => {
    expect(resolveTrip(sim, { line: '2', profileIndex: 0, departure: 36000 })?.departure).toBe(36000);
    expect(resolveTrip(sim, { line: '2', startTime: '10:00:00', startDate: '20261012' })?.profile).toBe(profile);
    expect(resolveTrip(sim, { line: '2', startTime: '11:00:00', startDate: '20261012' })).toBeNull();
    expect(resolveTrip(null, { line: '2', profileIndex: 0, departure: 1 })).toBeNull();
  });

  it('fermate con nome e orario; i pontili consecutivi della stessa fermata contano una volta', () => {
    const stops = tripStops({ profile, departure: 36000 }, [stop('Partenza', 0), stop('Mezzo', 1000), stop('Arrivo', 2000)]);
    expect(stops.map((s) => s.name)).toEqual(['Partenza', 'Mezzo', 'Arrivo']);
    expect(stops.map((s) => clock(s.scheduled))).toEqual(['10:00', '10:05', '10:10']);
  });

  it('per i bus il nome viene dalle fermate bus, non dai pontili', () => {
    const bus: SimProfile = { ...profile, route: { n: '4L', c: 'bus', ci: 1, cat: 'bus' } };
    const busStop = (name: string, metersEast: number): StopItem => ({ ...stop(name, metersEast), mode: 'bus' });
    const stops = tripStops({ profile: bus, departure: 36000 }, [stop('Pontile', 0), busStop('Piazzale Roma', 0), busStop('Mestre Centro', 1000), busStop('Via Piave', 2000)]);
    expect(stops.map((s) => s.name)).toEqual(['Piazzale Roma', 'Mestre Centro', 'Via Piave']);
    const tram: SimProfile = { ...profile, route: { n: 'T1', c: 'tram', ci: 2, cat: 'tram' } };
    expect(tripStops({ profile: tram, departure: 36000 }, [stop('Pontile', 0)]).map((s) => s.name)).toEqual([null, null, null, null]);
  });

  it('orario anche dopo mezzanotte', () => {
    expect(clock(25 * 3600 + 5 * 60)).toBe('01:05');
  });
});
