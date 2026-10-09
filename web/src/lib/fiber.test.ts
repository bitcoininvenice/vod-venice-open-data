import { describe, expect, it } from 'vitest';
import dataset from '@/data/agcom-fiber.json';
import { fiberCellAt, fiberCellBounds, fiberOperators, indexFiberCells, type FiberDataset } from './fiber';

const ds = dataset as unknown as FiberDataset;

describe('copertura fibra AGCOM', () => {
  it('dichiara fonte, licenza e data della pubblicazione', () => {
    expect(ds.license).toBe('CC BY 4.0');
    expect(ds.source).toMatch(/Agcom/i);
    expect(ds.dataDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(ds.cells.length).toBe(ds.counts.FTTH + ds.counts.FTTC + ds.counts.ADSL);
  });

  it('trova la cella in un punto e i suoi bordi la contengono', () => {
    const index = indexFiberCells(ds);
    const [i, j] = ds.cells[0];
    const b = fiberCellBounds(ds, i, j);
    const cell = fiberCellAt(ds, index, (b.lon0 + b.lon1) / 2, (b.lat0 + b.lat1) / 2);
    expect(cell).toBe(ds.cells[0]);
    expect(fiberCellAt(ds, index, 0, 0)).toBeNull();
  });

  it('a Rialto la rete arriva in FTTH', () => {
    const cell = fiberCellAt(ds, indexFiberCells(ds), 12.3358, 45.438);
    expect(cell?.[2]).toBe(3);
  });

  it('decodifica gli operatori', () => {
    expect(fiberOperators(3)).toEqual(['Open Fiber', 'TIM Wholesale']);
    expect(fiberOperators(0)).toEqual([]);
  });
});
