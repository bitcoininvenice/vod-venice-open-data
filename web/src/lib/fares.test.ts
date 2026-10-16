import { describe, expect, it } from 'vitest';
import { boatFuelCost, isExtraurbanLine, tripCost } from './fares';
import type { Leg } from './tripPlanner';

const walk: Leg = { kind: 'walk', from: 'A', to: 'B', meters: 300, seconds: 240, start: 0, end: 240, coords: [], wetMeters: 0, passerellaMeters: 0, maxDepthCm: 0 };
const ride = (line: string, category: string, from: string, to: string, startMin: number, endMin: number, operator?: 'alilaguna'): Leg => ({
  kind: 'ride', line, category, headsign: to, from, to, start: startMin * 60, end: endMin * 60, stops: 3, coords: [], tripDeparture: 0,
  ...(operator ? { operator } : {}),
});
const cost = (legs: Leg[], profile: 'ordinary' | 'veneziaUnica' | 'pass') => tripCost({ legs }, profile);

describe('costo stimato del viaggio', () => {
  it('a piedi è gratis', () => {
    expect(cost([walk], 'ordinary')).toMatchObject({ total: 0, tickets: [] });
  });

  it('turista: vaporetto 9,50 €, solo bus 1,50 €', () => {
    expect(cost([walk, ride('1', 'vaporetto', 'Rialto', 'San Marco', 10, 25), walk], 'ordinary').total).toBe(9.5);
    expect(cost([ride('4L', 'bus', 'Mestre Centro', 'Marghera', 0, 15)], 'ordinary').total).toBe(1.5);
  });

  it('un biglietto da 75 minuti copre i cambi; bus più vaporetto nello stesso biglietto è rete unica', () => {
    const c = cost([ride('T1', 'tram', 'Mestre', 'P.le Roma', 0, 20), ride('2', 'vaporetto', 'P.le Roma', 'Rialto', 25, 45)], 'ordinary');
    expect(c.tickets).toHaveLength(1);
    expect(c.tickets[0]).toMatchObject({ kind: 'reteUnica', price: 9.5, legs: [0, 1] });
  });

  it('oltre i 75 minuti serve un altro biglietto', () => {
    const c = cost([ride('12', 'vaporetto', 'F.te Nove', 'Burano', 0, 45), ride('9', 'vaporetto', 'Burano', 'Torcello', 50, 80)], 'ordinary');
    expect(c.total).toBe(19);
    expect(c.tickets).toHaveLength(2);
  });

  it('aeroporto: aerobus per il turista, compreso con Venezia Unica', () => {
    const airport = [ride('5', 'bus', 'P.le Roma', 'Aeroporto Marco Polo', 0, 25)];
    expect(cost(airport, 'ordinary').tickets[0]).toMatchObject({ kind: 'aerobus', price: 10 });
    expect(cost(airport, 'veneziaUnica').total).toBe(1.5);
    expect(cost(airport, 'pass').total).toBe(0);
  });

  it('Alilaguna con le sue tariffe, anche per chi ha l’abbonamento ACTV', () => {
    const toVenice = [ride('Blu', 'alilaguna', 'Aeroporto', 'San Zaccaria', 0, 70, 'alilaguna')];
    const toMurano = [ride('Blu', 'alilaguna', 'Aeroporto', 'Murano Colonna', 0, 30, 'alilaguna')];
    const inside = [ride('Arancio', 'alilaguna', 'Rialto', 'Guglie', 0, 20, 'alilaguna')];
    expect(cost(toVenice, 'ordinary').total).toBe(18);
    expect(cost(toMurano, 'ordinary').total).toBe(10);
    expect(cost(inside, 'ordinary').total).toBe(10);
    expect(cost(toVenice, 'veneziaUnica').total).toBe(10);
    expect(cost(toMurano, 'pass').total).toBe(5);
  });

  it('le linee extraurbane non si stimano e lo si dice', () => {
    expect(isExtraurbanLine('53E')).toBe(true);
    expect(isExtraurbanLine('OMN1')).toBe(true);
    expect(isExtraurbanLine('5')).toBe(false);
    expect(isExtraurbanLine('N')).toBe(false);
    const c = cost([ride('53E', 'bus', 'Padova', 'P.le Roma', 0, 70)], 'ordinary');
    expect(c).toMatchObject({ total: 0, unpriced: ['53E'] });
  });

  it('carburante della barca dal consumo orario', () => {
    expect(boatFuelCost(1800, 10, 2)).toEqual({ litres: 5, cost: 10 });
  });
});
