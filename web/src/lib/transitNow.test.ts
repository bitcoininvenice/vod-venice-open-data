import { describe, expect, it } from 'vitest';
import type { SimModel, SimProfile, SimShape } from './simulationCore';
import { fromGrid, toGrid } from './positionDelay';
import type { CanalSpeedLimitItem, StopItem } from './types';
import { bunchedPairs, compareLines, scheduledRunning, serviceNow, type ServiceVehicle } from './serviceNow';
import { lastDeparturesByStop, lastServiceBand } from './lastDepartures';
import { scheduleSpeedSegments, verdictOf } from './scheduleSpeed';

// Linea sintetica in Canal Grande: 700 m verso est, fermate ai due capi
const [x0, y0] = toGrid(12.330, 45.433);
const LEN = 700;
function shape(): SimShape {
  const xy = new Float32Array([x0, y0, x0 + LEN, y0]);
  return { xy, cum: new Float32Array([0, LEN]), n: 2 };
}
function sim(secondsBetweenStops: number, departures: number[]): SimModel {
  const sh = shape();
  const route = { n: '1', c: 'vaporetto', ci: 0, cat: 'vaporetto' };
  const prof: SimProfile = { sh, route, T: Int32Array.from([0, secondsBetweenStops]), Dd: Int32Array.from([0, LEN]) };
  const t0 = Int32Array.from(departures);
  const day = { tP: new Int32Array(departures.length), t0, t1: Int32Array.from(departures.map((d) => d + secondsBetweenStops)), count: departures.length };
  return { shapes: [sh], routes: [route], profs: [prof], daysTrips: { weekday: day, saturday: day, sunday: day } };
}
const [aLon, aLat] = fromGrid(x0, y0);
const [bLon, bLat] = fromGrid(x0 + LEN, y0);
const STOPS: StopItem[] = [
  { id: 'a', name: 'Alfa', lat: aLat, lon: aLon, mode: 'navigazione' },
  { id: 'b', name: 'Beta', lat: bLat, lon: bLon, mode: 'navigazione' },
];
const limit = (kmh: number): CanalSpeedLimitItem => ({
  id: 'l', channelName: 'Canal Grande', maxSpeedKmh: kmh, actvSpeedKmh: null, highWater: null, authority: 'comune',
  legalRef: '', sourceUrl: '', path: [[aLon, aLat], [bLon, bLat]],
});

describe('velocità richiesta dall\'orario', () => {
  it('esito con tolleranza per gli arrotondamenti', () => {
    expect(verdictOf(360, 240, 1)).toBe('tooFast');
    expect(verdictOf(360, 320, 1)).toBe('tight'); // sotto il minimo ma entro i 60 s di tolleranza
    expect(verdictOf(360, 600, 1)).toBe('ok');
    expect(verdictOf(360, 100, 0.3)).toBe('partial');
  });

  it('700 m a 7 km/h richiedono 6 minuti: in 3 minuti l\'orario è più veloce dei limiti', () => {
    const [seg] = scheduleSpeedSegments(sim(180, [36000, 37800]), STOPS, [limit(7)]);
    expect(seg.from).toBe('Alfa');
    expect(seg.to).toBe('Beta');
    expect(seg.legalMinS).toBeGreaterThan(355);
    expect(seg.legalMinS).toBeLessThan(365);
    expect(seg.verdict).toBe('tooFast');
    expect(seg.trips).toBe(2);
    expect(seg.tripsTooFast).toBe(2);
    expect(seg.requiredKmh).toBe(14);
  });

  it('con 7 minuti è compatibile; senza limite noto il tratto è escluso', () => {
    expect(scheduleSpeedSegments(sim(420, [36000]), STOPS, [limit(7)])[0].verdict).toBe('ok');
    expect(scheduleSpeedSegments(sim(180, [36000]), STOPS, [])).toHaveLength(0);
  });
});

describe('ultime partenze', () => {
  it('ultima partenza per linea e destinazione, il capolinea di arrivo escluso', () => {
    const m = lastDeparturesByStop(sim(300, [36000, 84600, 90000]), STOPS, 'weekday');
    expect(m.get(0)).toEqual([{ line: '1', category: 'vaporetto', headsign: 'Beta', time: 90000 }]);
    expect(m.has(1)).toBe(false);
  });

  it('fasce del livello', () => {
    expect(lastServiceBand(20 * 3600)).toBe('early');
    expect(lastServiceBand(22 * 3600)).toBe('evening');
    expect(lastServiceBand(24 * 3600 + 1800)).toBe('late');
    expect(lastServiceBand(26 * 3600)).toBe('night');
  });
});

describe('servizio adesso', () => {
  const v = (id: string, departure: number, delay: number | null, line = '1'): ServiceVehicle => ({ id, line, network: 'navigazione', departure, terminus: 'Lido', delaySeconds: delay });

  it('mezzi in coda: intervallo reale molto più corto di quello programmato', () => {
    // partenze a 10 minuti, il primo in ritardo di 8: adesso distano 2 minuti
    expect(bunchedPairs([v('x', 36000, 480), v('y', 36600, 0)])).toEqual([{ a: 'x', b: 'y', terminus: 'Lido', headwayS: 600, gapS: 120 }]);
    expect(bunchedPairs([v('x', 36000, 60), v('y', 36600, 0)])).toEqual([]);
    // corse ravvicinate già nell'orario: non sono "in coda"
    expect(bunchedPairs([v('x', 36000, 120), v('y', 36240, 0)])).toEqual([]);
  });

  it('corse in servizio dall\'orario, anche quelle iniziate il giorno prima', () => {
    const s = sim(3600, [36000, 85000]);
    expect(scheduledRunning(s, 'weekday', 36500).get('1')?.count).toBe(1);
    expect(scheduledRunning(s, 'weekday', 1000).get('1')?.count).toBe(1); // 85000 + 3600 > 86400 + 1000
  });

  it('riepilogo per linea: corse senza GPS, ritardi, puntualità; feed spento = nessun dato', () => {
    const running = new Map([['1', { count: 3, category: 'vaporetto' }]]);
    const [line] = serviceNow([v('x', 36000, 60), v('y', 36600, 400)], running, { navigazione: true, automobilistico: true });
    expect(line).toMatchObject({ line: '1', gps: 2, scheduled: 3, withoutGps: 1, withDelay: 2, avgDelayS: 230, maxDelayS: 400, onTimeShare: 0.5 });
    expect(serviceNow([v('x', 36000, 60)], running, { navigazione: false, automobilistico: true })).toEqual([]);
  });

  it('ordine naturale delle linee', () => {
    expect(['10', '2', 'N', '4.1', '1'].sort(compareLines)).toEqual(['1', '2', '4.1', '10', 'N']);
  });
});
