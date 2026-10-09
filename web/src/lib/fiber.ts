/**
 * Copertura della rete fissa dalla Broadband Map di AGCOM (CC BY 4.0), aggregata dalla pipeline
 * import_agcom_fiber.py su celle di ~100 m con la tecnologia migliore presente.
 * Il file dei dati resta lato server (/api/fiber): qui solo tipi e funzioni condivise.
 */

/** 3 = FTTH, 2 = FTTC, 1 = ADSL */
export type FiberClass = 1 | 2 | 3;

/** [i, j, classe, operatori FTTH (bit: 1 Open Fiber, 2 TIM Wholesale, 4 altri)] */
export type FiberCell = [number, number, FiberClass, number];

export interface FiberDataset {
  generatedAt: string;
  /** Data della pubblicazione AGCOM (AAAA-MM-GG) */
  dataDate: string;
  source: string;
  sourceUrl: string;
  license: string;
  origin: [number, number];
  cellDeg: [number, number];
  sourceCells20m: number;
  counts: Record<'FTTH' | 'FTTC' | 'ADSL', number>;
  cells: FiberCell[];
}

export const FIBER_CLASS_KEY: Record<FiberClass, 'ftth' | 'fttc' | 'adsl'> = { 3: 'ftth', 2: 'fttc', 1: 'adsl' };

export const FIBER_COLORS: Record<FiberClass, string> = {
  3: '#22c55e',
  2: '#f59e0b',
  1: '#ef4444',
};

export function fiberOperators(mask: number): string[] {
  const out: string[] = [];
  if (mask & 1) out.push('Open Fiber');
  if (mask & 2) out.push('TIM Wholesale');
  if (mask & 4) out.push('altri');
  return out;
}

/** Bordi lon/lat di una cella */
export function fiberCellBounds(ds: Pick<FiberDataset, 'origin' | 'cellDeg'>, i: number, j: number) {
  const lon0 = ds.origin[0] + i * ds.cellDeg[0];
  const lat0 = ds.origin[1] + j * ds.cellDeg[1];
  return { lon0, lat0, lon1: lon0 + ds.cellDeg[0], lat1: lat0 + ds.cellDeg[1] };
}

/** Indice per ricerca rapida della cella in un punto */
export function indexFiberCells(ds: FiberDataset): Map<string, FiberCell> {
  return new Map(ds.cells.map((c) => [`${c[0]}:${c[1]}`, c]));
}

export function fiberCellAt(ds: FiberDataset, index: Map<string, FiberCell>, lon: number, lat: number): FiberCell | null {
  const i = Math.floor((lon - ds.origin[0]) / ds.cellDeg[0]);
  const j = Math.floor((lat - ds.origin[1]) / ds.cellDeg[1]);
  return index.get(`${i}:${j}`) ?? null;
}
