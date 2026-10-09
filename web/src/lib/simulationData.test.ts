import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GRID, LAND_HI_URL, LAND_LO, SIM_STATS, SIM_URL } from './simulation-data';
import { polygonBoxes, visiblePolygons } from '@/components/map/baseMap';

const pub = (url: string) => join(__dirname, '../../public', url);

describe('dati della simulazione fuori dal bundle', () => {
  it('i file statici esistono e hanno un nome con hash (cache senza scadenza)', () => {
    for (const url of [SIM_URL, LAND_HI_URL]) {
      expect(url).toMatch(/^\/data\/[a-z-]+-[0-9a-f]{12}\.json$/);
      expect(existsSync(pub(url))).toBe(true);
    }
  });

  it('il riepilogo nel bundle corrisponde al file completo', () => {
    const sim = JSON.parse(readFileSync(pub(SIM_URL), 'utf8'));
    expect(SIM_STATS.routeModes.length).toBe(sim.routes.length);
    expect(SIM_STATS.trips.weekday).toBe(sim.days.weekday.trips.length);
    expect(GRID.W).toBeGreaterThan(0);
  });

  it('le isole dettagliate hanno più poligoni di quelle leggere nel bundle', () => {
    const hi = JSON.parse(readFileSync(pub(LAND_HI_URL), 'utf8'));
    expect(hi.length).toBeGreaterThan(LAND_LO.length);
  });
});

describe('mappa di base', () => {
  it('scarta i poligoni fuori dalla vista', () => {
    const polys = [[[0, 0, 10, 0, 10, 10]], [[100, 100, 110, 100, 110, 110]]];
    const boxes = polygonBoxes(polys);
    expect(Array.from(boxes)).toEqual([0, 0, 10, 10, 100, 100, 110, 110]);
    expect(visiblePolygons(boxes, { x0: -5, y0: -5, x1: 20, y1: 20 })).toEqual([0]);
    expect(visiblePolygons(boxes, { x0: 50, y0: 50, x1: 105, y1: 105 })).toEqual([1]);
    expect(visiblePolygons(boxes, { x0: 200, y0: 200, x1: 300, y1: 300 })).toEqual([]);
    expect(polygonBoxes(polys)).toBe(boxes); // calcolato una sola volta
  });
});
