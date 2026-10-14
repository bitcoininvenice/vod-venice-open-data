import { describe, expect, it } from 'vitest';
import type { SimModel, SimProfile, SimShape } from './simulationCore';
import { fromGrid, toGrid } from './positionDelay';
import { nextScheduledDeparture, scheduledArrivals, scheduledDepartures } from './scheduledDepartures';
import { forEachTrip } from './simulationCore';

// Navetta sintetica: 3 fermate a 400 m, 2 minuti tra una e l'altra, corse ogni 10 minuti
const [x0, y0] = toGrid(12.31, 45.44);
function sim(): SimModel {
  const sh: SimShape = { xy: new Float32Array([x0, y0, x0 + 800, y0]), cum: new Float32Array([0, 800]), n: 2 };
  const route = { n: 'PM', c: 'peoplemover', ci: 7, cat: 'peoplemover' };
  const prof: SimProfile = { sh, route, T: Int32Array.from([0, 120, 240]), Dd: Int32Array.from([0, 400, 800]) };
  const deps = Array.from({ length: 20 }, (_, i) => 36000 + i * 600);
  const day = { tP: new Int32Array(deps.length), t0: Int32Array.from(deps), t1: Int32Array.from(deps.map((d) => d + 240)), count: deps.length };
  return { shapes: [sh], routes: [route], profs: [prof], daysTrips: { weekday: day, saturday: day, sunday: day } };
}

describe('partenze da orario', () => {
  it('dalla fermata intermedia nei prossimi 30 minuti; il capolinea d\'arrivo non è una partenza', () => {
    const s = sim();
    const [lon, lat] = fromGrid(x0 + 400, y0);
    const deps = scheduledDepartures(s, { lon, lat }, 'weekday', 36000, 30 * 60);
    expect(deps.map((d) => d.time)).toEqual([36120, 36720, 37320]);
    expect(deps[0].line).toBe('PM');
    const [elon, elat] = fromGrid(x0 + 800, y0);
    expect(scheduledDepartures(s, { lon: elon, lat: elat }, 'weekday', 36000)).toEqual([]);
  });

  it('senza corse nei prossimi 90 minuti: la prossima di oggi, altrimenti quella di domani', () => {
    const s = sim();
    const [lon, lat] = fromGrid(x0, y0);
    // alle 8: nessuna corsa entro le 9:30, la prima è alle 10
    expect(scheduledDepartures(s, { lon, lat }, 'weekday', 8 * 3600)).toEqual([]);
    expect(nextScheduledDeparture(s, { lon, lat }, 'weekday', 'weekday', 8 * 3600)).toMatchObject({ time: 36000, tomorrow: false, line: 'PM' });
    // alle 22: servizio finito, riprende domani alle 10
    expect(nextScheduledDeparture(s, { lon, lat }, 'weekday', 'saturday', 22 * 3600)).toMatchObject({ time: 36000, tomorrow: true });
    // il capolinea d'arrivo non ha partenze
    const [elon, elat] = fromGrid(x0 + 800, y0);
    expect(nextScheduledDeparture(s, { lon: elon, lat: elat }, 'weekday', 'weekday', 8 * 3600)).toBeNull();
  });

  it('le corse dopo mezzanotte del giorno dopo si vedono da oggi, spostate di 24 ore', () => {
    const s = sim();
    // corse di "domani": una alle 00:10 (corsa notturna di stasera) e una alle 10:00
    const next = { tP: new Int32Array(2), t0: Int32Array.from([600, 36000]), t1: Int32Array.from([840, 36240]), count: 2 };
    s.daysTrips.saturday = next;
    const seen: number[] = [];
    forEachTrip(s, 'weekday', 'saturday', (_p, t0) => t0 >= 86400 && seen.push(t0));
    expect(seen).toEqual([87000]); // 00:10 domani; le 10:00 sono oltre la finestra della notte
    const [lon, lat] = fromGrid(x0, y0);
    expect(scheduledDepartures(s, { lon, lat }, 'weekday', 23 * 3600 + 50 * 60, 90 * 60, 'saturday').map((d) => d.time)).toEqual([87000]);
    // senza il giorno dopo non si vede
    expect(scheduledDepartures(s, { lon, lat }, 'weekday', 23 * 3600 + 50 * 60)).toEqual([]);
  });

  it('arrivi: dalla fermata intermedia e al capolinea, non al capolinea di partenza', () => {
    const s = sim();
    const [lon, lat] = fromGrid(x0 + 800, y0);
    expect(scheduledArrivals(s, { lon, lat }, 'weekday', 36000, 30 * 60).map((a) => a.time)).toEqual([36240, 36840, 37440]);
    const [slon, slat] = fromGrid(x0, y0);
    expect(scheduledArrivals(s, { lon: slon, lat: slat }, 'weekday', 36000)).toEqual([]);
  });
});
