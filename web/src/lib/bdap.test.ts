import { describe, expect, it } from 'vitest';
import data from '@/data/bdap-opere-venezia.json';
import operePubbliche from '@/data/opere-pubbliche.json';
import { executionProgress, fundingTotal, isLocatedBdap, isOverdue, type BdapDataset } from './bdap';

const ds = data as unknown as BdapDataset;

describe('opere BDAP', () => {
  it('il file generato è coerente', () => {
    expect(ds.license).toMatch(/CC BY/);
    expect(ds.summary.projects).toBeGreaterThan(500);
    const phases = Object.values(ds.summary.byPhase).reduce((a, b) => a + b, 0);
    expect(phases).toBe(ds.summary.projects);
    expect(ds.projects.every((p) => p.inProgress || p.inElenco)).toBe(true);
    // solo le opere in esecuzione hanno una posizione
    expect(ds.projects.filter(isLocatedBdap).every((p) => p.inProgress && p.geocodedFrom)).toBe(true);
    expect(ds.located).toBe(ds.projects.filter(isLocatedBdap).length);
  });

  it('le opere collegate esistono nell’elenco annuale del Comune', () => {
    const cups = new Set(operePubbliche.works.map((w) => w.cup).filter(Boolean));
    for (const p of ds.projects.filter((x) => x.inElenco)) expect(cups.has(p.cup)).toBe(true);
  });

  it('avanzamento e ritardo dalle date', () => {
    const p = { executionStart: '2026-01-01', executionEndPlanned: '2026-12-31', executionEnd: null, phase: 'execution' as const };
    expect(executionProgress(p, new Date('2026-07-02'))).toBeCloseTo(0.5, 1);
    expect(executionProgress(p, new Date('2025-01-01'))).toBe(0);
    expect(executionProgress({ executionStart: null, executionEndPlanned: '2026-12-31' })).toBeNull();
    expect(isOverdue(p, new Date('2027-02-01'))).toBe(true);
    expect(isOverdue(p, new Date('2026-02-01'))).toBe(false);
    expect(fundingTotal({ state: 1, eu: 2, local: 3, private: 0, other: 0, toFind: 4 })).toBe(10);
  });
});
