import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildFlowPath, flowPointAt } from './currentFlow';
import { LAGOON_CURRENT_CHANNELS } from '@/lib/lagoonCurrents';
import { LAND_HI_URL } from '@/lib/simulation-data';
import { toGrid } from '@/lib/positionDelay';

type Rings = number[][];
const land = JSON.parse(readFileSync(join(process.cwd(), 'public', LAND_HI_URL), 'utf8')) as Rings[];

/** Punto dentro un poligono (anelli con coordinate x,y alternate; i buchi invertono). */
function onLand(x: number, y: number): boolean {
  for (const rings of land) {
    let inside = false;
    for (const r of rings) {
      for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
        const [xi, yi, xj, yj] = [r[i], r[i + 1], r[j], r[j + 1]];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
    }
    if (inside) return true;
  }
  return false;
}

describe('flusso delle correnti', () => {
  const paths = LAGOON_CURRENT_CHANNELS.map((c) => ({ c, p: buildFlowPath(c.coordinates, c.widthMeters, toGrid) }));

  it('le scie scorrono sull acqua, non sopra le isole', () => {
    for (const { c, p } of paths) {
      let samples = 0;
      let dry = 0;
      for (let s = 0; s <= p.length; s += 25) {
        for (const off of [-0.7, 0, 0.7]) {
          const [x, y] = flowPointAt(p, s, off);
          samples++;
          if (onLand(x, y)) dry++;
        }
      }
      // tolleranza: i ponti (es. Guglie e Tre Archi sul Canale di Cannaregio) nei poligoni sono terra
      expect(dry / samples, c.id).toBeLessThan(0.06);
    }
  });

  it('lo spostamento laterale resta entro la semi-larghezza del canale', () => {
    for (const { p } of paths) {
      const [cx, cy] = flowPointAt(p, p.length / 2, 0);
      const [ox, oy] = flowPointAt(p, p.length / 2, 1);
      expect(Math.hypot(ox - cx, oy - cy)).toBeLessThanOrEqual(p.half + 0.5);
    }
  });

  it('le bocche di porto partono dal mare (est) verso la laguna', () => {
    for (const id of ['bocca-lido', 'bocca-malamocco', 'bocca-chioggia']) {
      const c = LAGOON_CURRENT_CHANNELS.find((x) => x.id === id)!;
      expect(c.coordinates[0][0], id).toBeGreaterThan(c.coordinates[c.coordinates.length - 1][0]);
    }
  });
});
