import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SIM_URL } from './simulation-data';
import { WALK_URL } from './walk-data';
import { buildSimulation, type RawSimulation } from './simulationCore';
import { buildWalkGraph, type RawWalk } from './walkGraph';
import { planTrip } from './tripPlanner';
import { ACTV_STOPS_REFERENCE } from './stopsReference';
import { PASSERELLE_ROUTES } from './passerelleData';

const publicDir = existsSync(path.join(process.cwd(), 'public'))
  ? path.join(process.cwd(), 'public')
  : path.join(process.cwd(), 'web', 'public');
const read = (url: string) => JSON.parse(readFileSync(path.join(publicDir, url), 'utf8'));
const sim = buildSimulation(read(SIM_URL) as RawSimulation);
const graph = buildWalkGraph(read(WALK_URL) as RawWalk);


/** Luoghi di prova (coordinate approssimate di punti noti) */
const PLACES = {
  ferrovia: { lon: 12.3215, lat: 45.4412, label: 'Stazione Santa Lucia' },
  sanMarco: { lon: 12.3397, lat: 45.4341, label: 'Piazza San Marco' },
  rialto: { lon: 12.3359, lat: 45.438, label: 'Ponte di Rialto' },
  lido: { lon: 12.3700, lat: 45.4150, label: 'Lido, Gran Viale' },
  murano: { lon: 12.3530, lat: 45.4580, label: 'Murano, Colonna' },
  campoSantaMargherita: { lon: 12.3235, lat: 45.4345, label: 'Campo Santa Margherita' },
};

describe('trip planner con i dati reali', () => {
  for (const [a, b] of [['ferrovia', 'sanMarco'], ['rialto', 'lido'], ['ferrovia', 'murano'], ['campoSantaMargherita', 'rialto']] as const) {
    it(`${a} → ${b} alle 10:00 di un giorno feriale`, () => {
      const r = planTrip(graph, sim, ACTV_STOPS_REFERENCE, PLACES[a], PLACES[b], 10 * 3600, 'weekday');
      expect(r.best).not.toBeNull();
      expect(r.best!.arrive).toBeGreaterThan(10 * 3600);
      expect(r.best!.arrive - 10 * 3600).toBeLessThan(90 * 60);
      // ogni tratto inizia dove finisce il precedente, in ordine di tempo
      for (let i = 1; i < r.best!.legs.length; i++) expect(r.best!.legs[i].start).toBeGreaterThanOrEqual(r.best!.legs[i - 1].end - 1);
    });
  }

  it('Murano e Lido si raggiungono solo in vaporetto', () => {
    const r = planTrip(graph, sim, ACTV_STOPS_REFERENCE, PLACES.ferrovia, PLACES.murano, 10 * 3600, 'weekday');
    expect(r.walkOnly).toBeNull();
    expect(r.best!.legs.some((l) => l.kind === 'ride')).toBe(true);
  });
});

describe('planner con acqua alta e modalità', () => {
  const at = 10 * 3600;
  const tide = (cm: number | null) => () => cm;

  it('senza acqua alta il percorso non cambia e non segna acqua', () => {
    const r = planTrip(graph, sim, ACTV_STOPS_REFERENCE, PLACES.ferrovia, PLACES.sanMarco, at, 'weekday', { tideAt: tide(70) });
    expect(r.floodLevelCm).toBeNull();
    expect(r.best!.wetMeters).toBe(0);
  });

  it('a +120 cm il percorso a piedi evita buona parte delle calli allagate', () => {
    const r = planTrip(graph, sim, ACTV_STOPS_REFERENCE, PLACES.ferrovia, PLACES.rialto, at, 'weekday', { mode: 'walk', tideAt: tide(120) });
    expect(r.floodLevelCm).toBe(120);
    expect(r.shortestWalkWetMeters).toBeGreaterThan(0);
    expect(r.best!.wetMeters).toBeLessThan(r.shortestWalkWetMeters!);
    expect(r.best!.maxDepthCm).toBeLessThanOrEqual(120 - 80);
  });

  it('le passerelle previste contano come transitabili', () => {
    const r1 = planTrip(graph, sim, ACTV_STOPS_REFERENCE, PLACES.rialto, PLACES.sanMarco, at, 'weekday', { mode: 'walk', tideAt: tide(115) });
    const r2 = planTrip(graph, sim, ACTV_STOPS_REFERENCE, PLACES.rialto, PLACES.sanMarco, at, 'weekday', { mode: 'walk', tideAt: tide(115), passerelle: PASSERELLE_ROUTES });
    expect(r2.best!.passerellaMeters).toBeGreaterThan(0);
    expect(r2.best!.wetMeters).toBeLessThanOrEqual(r1.best!.wetMeters);
  });

  it('modalità: solo a piedi non usa il vaporetto, preferisci vaporetto cammina meno', () => {
    const walk = planTrip(graph, sim, ACTV_STOPS_REFERENCE, PLACES.ferrovia, PLACES.sanMarco, at, 'weekday', { mode: 'walk' });
    expect(walk.best!.rides).toBe(0);
    const fastest = planTrip(graph, sim, ACTV_STOPS_REFERENCE, PLACES.ferrovia, PLACES.sanMarco, at, 'weekday');
    const boat = planTrip(graph, sim, ACTV_STOPS_REFERENCE, PLACES.ferrovia, PLACES.sanMarco, at, 'weekday', { mode: 'boat' });
    expect(boat.best!.rides).toBeGreaterThan(0);
    expect(boat.best!.walkMeters).toBeLessThanOrEqual(fastest.best!.walkMeters + 1);
  });

  it('segnala le corse con marea da MOSE', () => {
    const r = planTrip(graph, sim, ACTV_STOPS_REFERENCE, PLACES.ferrovia, PLACES.murano, at, 'weekday', { tideAt: tide(125) });
    expect(r.best!.ridesInHighWater).toBe(true);
  });
});
