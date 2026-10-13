import { describe, expect, it } from 'vitest';
import osmWaterways from '@/data/osm-waterways.json';
import { buildSpeedLimits, effectiveSpeedLimit, HIGH_WATER_CM } from './waterSpeedLimits';

const limits = buildSpeedLimits(osmWaterways.canals as { id: number; name: string | null; coords: [number, number][] }[]);
const byName = (n: string) => limits.filter((l) => l.channelName === n);

describe('limiti di velocità dagli atti ufficiali', () => {
  it('regolamento comunale: Canal Grande, Cannaregio, Rio Novo e rii', () => {
    expect(byName('Canal Grande').length).toBeGreaterThan(0);
    for (const l of byName('Canal Grande')) expect([l.maxSpeedKmh, l.actvSpeedKmh, l.highWater]).toEqual([7, 11, 'slow5']);
    for (const l of byName('Canale di Cannaregio')) expect([l.maxSpeedKmh, l.actvSpeedKmh]).toEqual([5, 7]);
    for (const l of byName('Rio Novo')) expect([l.maxSpeedKmh, l.actvSpeedKmh]).toEqual([5, null]);
    const rii = limits.filter((l) => l.authority === 'comune' && l.channelName.startsWith('Rio'));
    expect(rii.length).toBeGreaterThan(150);
    expect(rii.every((l) => l.maxSpeedKmh === 5)).toBe(true);
  });

  it('ordinanza 93/2007: solo canali con un limite unico, con l articolo', () => {
    expect(byName('Canale Orfano')[0]).toMatchObject({ maxSpeedKmh: 14, authority: 'provveditorato' });
    expect(byName('Canale delle Tresse')[0].maxSpeedKmh).toBe(11);
    expect(byName('Ghebo dei Cani')[0].legalRef).toContain('art. 14');
    // tratti parziali e canali della Capitaneria non inclusi
    expect(byName('Canale Tortolo')).toHaveLength(0);
    expect(byName('Canale della Giudecca')).toHaveLength(0);
  });

  it('ogni limite ha atto, link e tracciato', () => {
    for (const l of limits) {
      expect(l.legalRef.length).toBeGreaterThan(10);
      expect(l.sourceUrl).toMatch(/^https:\/\//);
      expect(l.path.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('con l acqua alta valgono le regole dell art. 3', () => {
    const cg = byName('Canal Grande')[0];
    expect(effectiveSpeedLimit(cg, 80)).toMatchObject({ kmh: 7, actvKmh: 11, tideRule: false });
    expect(effectiveSpeedLimit(cg, HIGH_WATER_CM)).toMatchObject({ kmh: 5, actvKmh: 5, tideRule: true });
    expect(effectiveSpeedLimit(cg, -55)).toMatchObject({ kmh: 5, tideRule: true });
    const rio = limits.find((l) => l.highWater === 'noMotor')!;
    expect(effectiveSpeedLimit(rio, 115)).toMatchObject({ noMotor: true, kmh: null });
    expect(effectiveSpeedLimit(rio, -60)).toMatchObject({ noMotor: false, kmh: 5 });
    expect(effectiveSpeedLimit(rio, null)).toMatchObject({ noMotor: false });
  });
});
