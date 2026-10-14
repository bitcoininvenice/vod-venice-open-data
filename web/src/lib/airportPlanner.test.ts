import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SIM_URL } from './simulation-data';
import { WALK_URL } from './walk-data';
import { buildSimulation, type RawSimulation } from './simulationCore';
import { buildWalkGraph, type RawWalk } from './walkGraph';
import { ACTV_STOPS_REFERENCE } from './stopsReference';
import { AIRPORT, AEROBUS_LINE, FIRST_SERVICE_FROM_S, isAirport, LONG_WALK_M, matchesAirport, PIAZZALE_ROMA, planAirport, planAirportOrTomorrow } from './airportPlanner';
import { alilagunaTripsOn } from './alilaguna-schedule';

const publicDir = existsSync(path.join(process.cwd(), 'public')) ? path.join(process.cwd(), 'public') : path.join(process.cwd(), 'web', 'public');
const read = (url: string) => JSON.parse(readFileSync(path.join(publicDir, url), 'utf8'));
const sim = buildSimulation(read(SIM_URL) as RawSimulation);
const graph = buildWalkGraph(read(WALK_URL) as RawWalk);
const rialto = { lon: 12.3359, lat: 45.438, label: 'Ponte di Rialto' };
const lido = { lon: 12.37, lat: 45.415, label: 'Lido, Gran Viale' };
/** Giorno dentro la validità stagionale dell'orario Alilaguna importato */
const date = new Date('2026-10-14T10:00:00+02:00');

describe('aeroporto Marco Polo', () => {
  it('riconosce il punto e le ricerche', () => {
    expect(isAirport(AIRPORT)).toBe(true);
    expect(isAirport(PIAZZALE_ROMA)).toBe(false);
    for (const q of ['aeroporto', 'VCE', 'Marco Polo', 'airport', 'Tessera']) expect(matchesAirport(q), q).toBe(true);
    expect(matchesAirport('Rialto')).toBe(false);
  });

  it('nessuna opzione se nessuno dei punti (o entrambi) è l\'aeroporto', () => {
    expect(planAirport(graph, sim, ACTV_STOPS_REFERENCE, rialto, lido, 36000, 'weekday', { date })).toEqual([]);
    expect(planAirport(graph, sim, ACTV_STOPS_REFERENCE, AIRPORT, AIRPORT, 36000, 'weekday', { date })).toEqual([]);
  });

  it('da Rialto: Alilaguna via acqua e ACTV con il bus 5 da Piazzale Roma, dalla più veloce', () => {
    const its = planAirport(graph, sim, ACTV_STOPS_REFERENCE, rialto, AIRPORT, 10 * 3600, 'weekday', { date });
    expect(its.map((i) => i.via).sort()).toEqual(['actv', 'alilaguna']);
    expect(its[0].arrive).toBeLessThanOrEqual(its[1].arrive);
    const actv = its.find((i) => i.via === 'actv')!;
    const bus = actv.legs[actv.legs.length - 1];
    expect(bus.kind === 'ride' && bus.line).toBe(AEROBUS_LINE);
    expect(bus.kind === 'ride' && bus.from).toBe(PIAZZALE_ROMA.label);
    const water = its.find((i) => i.via === 'alilaguna')!;
    expect(water.legs.map((l) => l.kind)).toEqual(['walk', 'ride', 'walk']);
    const ride = water.legs[1];
    expect(ride.kind === 'ride' && ride.operator).toBe('alilaguna');
    expect(ride.kind === 'ride' && /aeroporto/i.test(ride.to)).toBe(true);
    for (const it of its) {
      expect(it.depart).toBeGreaterThanOrEqual(10 * 3600);
      // ogni tratto parte dopo la fine del precedente
      for (let k = 1; k < it.legs.length; k++) expect(it.legs[k].start).toBeGreaterThanOrEqual(it.legs[k - 1].end - 1);
    }
  });

  it('dall\'aeroporto al Lido: il bus 5 viene prima del vaporetto, la barca Alilaguna parte dalla darsena', () => {
    const its = planAirport(graph, sim, ACTV_STOPS_REFERENCE, AIRPORT, lido, 10 * 3600, 'weekday', { date });
    const actv = its.find((i) => i.via === 'actv')!;
    expect(actv.legs[0].kind === 'ride' && actv.legs[0].line).toBe(AEROBUS_LINE);
    const water = its.find((i) => i.via === 'alilaguna')!;
    expect(water.legs[0].kind).toBe('walk');
    expect(water.legs[1].kind === 'ride' && /aeroporto/i.test(water.legs[1].from)).toBe(true);
  });

  it('fuori dalla validità dell\'orario Alilaguna resta solo ACTV', () => {
    expect(alilagunaTripsOn(new Date('2027-02-01T10:00:00+01:00'))).toEqual([]);
    const its = planAirport(graph, sim, ACTV_STOPS_REFERENCE, rialto, AIRPORT, 10 * 3600, 'weekday', { date: new Date('2027-02-01T10:00:00+01:00') });
    expect(its.map((i) => i.via)).toEqual(['actv']);
  });

  it('da Murano a tarda sera: niente stasera, le prime soluzioni di domani mattina', () => {
    const murano = { lon: 12.35374, lat: 45.45987, label: 'Murano' };
    const late = 23 * 3600 + 30 * 60;
    expect(planAirport(graph, sim, ACTV_STOPS_REFERENCE, murano, AIRPORT, late, 'weekday', { date })).toEqual([]);
    const r = planAirportOrTomorrow(graph, sim, ACTV_STOPS_REFERENCE, murano, AIRPORT, late, 'weekday', { day: 'weekday', date: new Date('2026-10-15T10:00:00+02:00') }, { date });
    expect(r.tomorrow).toBe(true);
    expect(r.options.length).toBeGreaterThan(0);
    for (const o of r.options) expect(o.depart).toBeGreaterThanOrEqual(FIRST_SERVICE_FROM_S);
    // di giorno nessun ripiego
    expect(planAirportOrTomorrow(graph, sim, ACTV_STOPS_REFERENCE, murano, AIRPORT, 10 * 3600, 'weekday', { day: 'weekday', date }, { date }).tomorrow).toBe(false);
  });

  it('dopo mezzanotte: il bus 5 delle 00:10 e delle 00:40 (orari GTFS 24:10, 24:40) è tra le soluzioni', () => {
    const ferrovia = { lon: 12.3215, lat: 45.4412, label: 'Ferrovia' };
    const its = planAirport(graph, sim, ACTV_STOPS_REFERENCE, ferrovia, AIRPORT, 23 * 3600 + 50 * 60, 'weekday', { date, nextDay: 'weekday' });
    const actv = its.find((i) => i.via === 'actv')!;
    const bus = actv.legs[actv.legs.length - 1];
    expect(bus.kind === 'ride' && bus.line).toBe(AEROBUS_LINE);
    expect(bus.start).toBeGreaterThanOrEqual(86400);
    // senza il giorno dopo la stessa ricerca non vede le corse dopo mezzanotte
    expect(planAirport(graph, sim, ACTV_STOPS_REFERENCE, ferrovia, AIRPORT, 23 * 3600 + 50 * 60, 'weekday', { date }).some((i) => i.via === 'actv')).toBe(false);
  });

  it('da Murano alle 23:30: vaporetto fino alle Fondamente Nove, a piedi a Piazzale Roma e bus 5 dopo mezzanotte', () => {
    const murano = { lon: 12.35374, lat: 45.45987, label: 'Murano' };
    const its = planAirport(graph, sim, ACTV_STOPS_REFERENCE, murano, AIRPORT, 23 * 3600 + 18 * 60, 'weekday', { date, nextDay: 'weekday' });
    const actv = its.find((i) => i.via === 'actv')!;
    expect(actv).toBeDefined();
    const walks = actv.legs.filter((l) => l.kind === 'walk').map((l) => l.meters);
    expect(Math.max(...walks)).toBeGreaterThan(1500);
    expect(Math.max(...walks)).toBeLessThanOrEqual(LONG_WALK_M + 300);
    expect(actv.arrive).toBeGreaterThan(86400);
  });
});
