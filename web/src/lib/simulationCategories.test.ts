import { describe, expect, it } from 'vitest';
import { categoryIndex, type RawCategory } from './simulationCore';
import { CFG } from './simulation-data';
import { ALILAGUNA_ROUTES } from './alilaguna-schedule';

const cats = CFG.cats as unknown as RawCategory[];
const key = (n: string, c: string) => cats[categoryIndex(cats, { n, c })] as RawCategory & { k: string };

describe('categorie della flotta', () => {
  it('le linee non elencate restano vaporetti, quelle elencate prendono la loro categoria', () => {
    expect(key('1', 'vaporetto').k).toBe('vaporetto');
    expect(key('2', 'vaporetto').k).toBe('vaporetto');
    expect(key('5.1', 'vaporetto').k).toBe('motoscafo');
    expect(key('12', 'vaporetto').k).toBe('motonave');
    expect(key('PM', 'peoplemover').k).toBe('peoplemover');
  });
});

describe('Alilaguna: periodo di servizio dal calendario GTFS', () => {
  it('ogni linea ha inizio e fine del servizio, non "365 giorni"', () => {
    for (const r of ALILAGUNA_ROUTES) {
      expect(r.serviceFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.serviceTo! >= r.serviceFrom!).toBe(true);
    }
  });
});
