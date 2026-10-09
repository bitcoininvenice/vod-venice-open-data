import { describe, expect, it } from 'vitest';
import { projectTo3D, unprojectFrom3D } from './map3d';

describe('map3d', () => {
  it("l'inversa riporta il punto sul piano della mappa", () => {
    for (const [x, y] of [[0, 0], [400, 300], [800, 600], [123, 577], [799, 12]]) {
      const p = projectTo3D(x, y, 800, 600);
      const back = unprojectFrom3D(p.x, p.y, 800, 600);
      expect(back.x).toBeCloseTo(x, 6);
      expect(back.y).toBeCloseTo(y, 6);
    }
  });

  it('il centro resta fermo e il bordo inferiore si avvicina (più grande)', () => {
    expect(projectTo3D(400, 300, 800, 600)).toEqual({ x: 400, y: 300 });
    const bottom = projectTo3D(800, 600, 800, 600);
    const top = projectTo3D(800, 0, 800, 600);
    expect(bottom.x - 400).toBeGreaterThan(top.x - 400);
  });
});
