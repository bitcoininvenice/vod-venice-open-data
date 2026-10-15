import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SIM_URL } from './simulation-data';
import { buildSimulation, type RawSimulation } from './simulationCore';
import { buildNetwork, runsOf, TRANSFER_RADIUS_M, WATER_CATEGORIES } from './transitNetwork';
import { ALILAGUNA_STOPS } from './alilaguna-schedule';

const publicDir = existsSync(path.join(process.cwd(), 'public')) ? path.join(process.cwd(), 'public') : path.join(process.cwd(), 'web', 'public');
const sim = buildSimulation(JSON.parse(readFileSync(path.join(publicDir, SIM_URL), 'utf8')) as RawSimulation);
const net = buildNetwork(sim);
const date = new Date('2026-10-14T10:00:00+02:00');

describe('rete dei mezzi del planner', () => {
  it('fermate di navigazione, di terra e darsene Alilaguna', () => {
    const kinds = new Set(net.stops.map((s) => s.kind));
    expect(kinds).toEqual(new Set(['water', 'land', 'alilaguna']));
    expect(net.stops.filter((s) => s.kind === 'alilaguna')).toHaveLength(ALILAGUNA_STOPS.length);
    expect(net.stops.filter((s) => s.kind === 'land').length).toBeGreaterThan(500);
  });

  it('linee di ogni tipo abbinate alle fermate giuste', () => {
    const cats = new Set([...net.simPatterns.values()].map((p) => p.category));
    for (const c of ['vaporetto', 'bus', 'tram', 'peoplemover', 'island']) expect(cats.has(c), c).toBe(true);
    for (const p of net.simPatterns.values()) {
      const water = WATER_CATEGORIES.has(p.category);
      for (const s of p.stops) expect(net.stops[s].kind === 'water', `${p.line} ${net.stops[s].name}`).toBe(water);
      // orari crescenti lungo la corsa
      for (let j = 1; j < p.dep.length; j++) expect(p.dep[j]).toBeGreaterThanOrEqual(p.dep[j - 1]);
    }
  });

  it('cambi a piedi simmetrici ed entro il raggio', () => {
    net.neighbors.forEach((list, i) => {
      for (const nb of list) {
        expect(nb.meters).toBeLessThanOrEqual(TRANSFER_RADIUS_M * 1.31);
        expect(net.neighbors[nb.to].some((x) => x.to === i)).toBe(true);
      }
    });
    // un pontile e la fermata Alilaguna vicina sono collegati
    const zattere = net.stops.findIndex((s) => s.kind === 'alilaguna' && /Zattere/.test(s.name));
    expect(net.neighbors[zattere].some((nb) => net.stops[nb.to].kind === 'water')).toBe(true);
  });

  it('corse ACTV e Alilaguna del giorno; filtro per «preferisci via acqua»', () => {
    const all = runsOf(net, sim, 'weekday', 'weekday', date);
    expect(all.some((r) => r.pat.operator === 'alilaguna')).toBe(true);
    expect(all.some((r) => r.pat.category === 'bus')).toBe(true);
    // corse dopo mezzanotte del giorno dopo
    expect(all.some((r) => r.base >= 86400)).toBe(true);
    const water = runsOf(net, sim, 'weekday', undefined, date, (c) => WATER_CATEGORIES.has(c) || c === 'alilaguna');
    expect(water.every((r) => WATER_CATEGORIES.has(r.pat.category) || r.pat.operator === 'alilaguna')).toBe(true);
    // senza data niente Alilaguna
    expect(runsOf(net, sim, 'weekday', undefined, null).some((r) => r.pat.operator === 'alilaguna')).toBe(false);
  });
});
