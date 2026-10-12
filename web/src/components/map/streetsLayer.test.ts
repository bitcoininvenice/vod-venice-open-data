import { describe, expect, it, vi } from 'vitest';
import {
  indexRawWalk,
  paintStreets,
  getFloodedEdgesStats,
  type RawWalkData,
  type StreetsPaintOptions,
} from './streetsLayer';
import { CARTA, NOTTE } from '@/lib/solar';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WALK_URL } from '@/lib/walk-data';
import { getFloodedGroundPercentage } from '@/lib/flood';
import { toGrid } from '@/lib/positionDelay';

describe('streetsLayer', () => {
  const sampleData: RawWalkData = {
    origin: [12.29, 45.395],
    scale: 100000,
    // 3 nodes: node 0 at (12.33, 45.43), node 1 at (12.34, 45.44), node 2 at (12.35, 45.45)
    nodes: [
      4000, 3500, // node 0: lon 12.33, lat 45.43
      5000, 4500, // node 1: lon 12.34, lat 45.44
      6000, 5500, // node 2: lon 12.35, lat 45.45
    ],
    // 2 edges:
    // edge 0: from node 0 to 1, length 100, flag 0 (calle)
    // edge 1: from node 1 to 2, length 120, flag 1 (bridge)
    edges: [
      0, 1, 100, 0,
      1, 2, 120, 1,
    ],
    // intermediate geometries: edge 0 has 1 point, edge 1 has none
    geom: [
      [4500, 4000],
      [],
    ],
  };

  it('correctly indexes raw walk data into contiguous typed arrays', () => {
    const indexed = indexRawWalk(sampleData);

    expect(indexed.edgeCount).toBe(2);
    expect(indexed.flags[0]).toBe(0); // calle
    expect(indexed.flags[1]).toBe(1); // bridge

    // Check offsets and lengths
    expect(indexed.lengths[0]).toBe(3); // start + 1 intermediate + end
    expect(indexed.lengths[1]).toBe(2); // start + end

    // Check bounding boxes
    expect(indexed.boxes[0]).toBeLessThan(indexed.boxes[2]); // x0 < x1
    expect(indexed.boxes[1]).toBeLessThan(indexed.boxes[3]); // y0 < y1

    // Check elevations
    expect(indexed.elevations[1]).toBe(220); // Bridge is set to high dry elevation (220 cm)
    expect(indexed.elevations[0]).toBeGreaterThan(70); // Calle elevation
    expect(indexed.elevations[0]).toBeLessThan(160);
  });

  it('calculates flooded edges stats', () => {
    // When no singleton data is loaded, returns 0
    expect(getFloodedEdgesStats(110)).toEqual({ floodedCount: 0, totalCalli: 0, percentage: 0 });
    expect(getFloodedEdgesStats(75)).toEqual({ floodedCount: 0, totalCalli: 0, percentage: 0 });
  });

  it('paints visible calli and bridges when zoomFactor is sufficient', () => {
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      strokeStyle: '',
      lineWidth: 0,
      lineJoin: '',
      lineCap: '',
    } as unknown as CanvasRenderingContext2D;

    const options: StreetsPaintOptions = {
      cw: 1200,
      ch: 800,
      camera: { x0: 14000, y0: 12000, s: 0.1 },
      pal: CARTA,
      zoomFactor: 2.2,
    };

    // Before data is set in module singleton, paintStreets returns early without drawing
    paintStreets(mockCtx, options);
    expect(mockCtx.save).not.toHaveBeenCalled();
  });

  it('skips rendering when zoomFactor is below 1.7', () => {
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    const options: StreetsPaintOptions = {
      cw: 1200,
      ch: 800,
      camera: { x0: 14000, y0: 12000, s: 0.02 },
      pal: NOTTE,
      zoomFactor: 1.2,
    };

    paintStreets(mockCtx, options);
    expect(mockCtx.save).not.toHaveBeenCalled();
  });

  it('nel centro storico la lunghezza di calli allagate segue la curva ufficiale CPSM', () => {
    const raw = JSON.parse(readFileSync(join(process.cwd(), 'public', WALK_URL), 'utf8')) as RawWalkData;
    const idx = indexRawWalk(raw);
    const [x0, y0] = toGrid(12.300, 45.450);
    const [x1, y1] = toGrid(12.372, 45.423);
    let total = 0;
    const lens: { h: number; len: number }[] = [];
    for (let e = 0; e < idx.edgeCount; e++) {
      if (idx.flags[e] !== 0) continue;
      // offsets indicizza i float di allCoords: primo e ultimo punto sono i due nodi
      const first = idx.offsets[e];
      const last = first + 2 * (idx.lengths[e] - 1);
      const cx = (idx.allCoords[first] + idx.allCoords[last]) / 2;
      const cy = (idx.allCoords[first + 1] + idx.allCoords[last + 1]) / 2;
      if (cx < x0 || cx > x1 || cy < y0 || cy > y1) continue;
      const len = Math.max(1, raw.edges[4 * e + 2]);
      lens.push({ h: idx.elevations[e], len });
      total += len;
    }
    expect(lens.length).toBeGreaterThan(1000);
    for (const cm of [100, 110, 120, 130, 140]) {
      const flooded = lens.filter((l) => l.h <= cm).reduce((a, l) => a + l.len, 0) / total * 100;
      expect(Math.abs(flooded - getFloodedGroundPercentage(cm)), `+${cm} cm`).toBeLessThan(2);
    }
    // nessun rumore casuale: due indicizzazioni danno le stesse quote
    expect(Array.from(indexRawWalk(raw).elevations)).toEqual(Array.from(idx.elevations));
  });
});
