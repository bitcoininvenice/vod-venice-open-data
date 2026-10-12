import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SIM_URL } from './simulation-data';
import { WALK_URL } from './walk-data';
import { buildSimulation, type RawSimulation } from './simulationCore';
import { buildWalkGraph, type RawWalk } from './walkGraph';
import { planTrip } from './tripPlanner';
import { ACTV_STOPS_REFERENCE } from './stopsReference';

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
