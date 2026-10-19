import { BUILDINGS_AUDIT_STATS, BUILDINGS_URL } from '@/lib/buildings-data';
import type { ColorScheme } from '@/lib/solar';
import { groundElevationCmAt } from './topographyLayer';

export type BuildingColorMode = 'period' | 'contemporary' | 'floors' | 'category';

export type BuildingEpochKey =
  | 'pre_1400'
  | '1400_1599'
  | '1600_1799'
  | '1800_1899'
  | '1900_1949'
  | 'post_1950'
  | 'unknown';

export type BuildingEpochFilter = 'all' | 'dated_only' | 'contemporary_authored' | BuildingEpochKey;

export type BuildingCategory =
  | 'religious'
  | 'palazzo'
  | 'scuola'
  | 'public'
  | 'industrial'
  | 'commercial'
  | 'residential';

export type ContemporaryInterventionType = 'new' | 'reuse' | 'pavilion';

export interface RawBuildingItem {
  /** Rings delta-encoded in decimeters (gridScale = 10) */
  r: number[][];
  /** Construction year (only when documented in Wikidata/OSM) */
  y?: number;
  /** Year precision ('exact' | 'century' | 'circa') */
  yp?: string;
  /** Year source ('wikidata' | 'osm' | 'mic' | 'ptrc') */
  ys?: string;
  /** Building levels (documented) */
  l?: number;
  /** Building height in meters (documented) */
  h?: number;
  /** Category */
  c?: BuildingCategory;
  /** Name or civic address */
  n?: string;
  /** Wikidata QID */
  w?: string;
  /** Heritage protection flag */
  hr?: number;
  /** Architectural style */
  st?: string;
  /** Sestiere / island */
  s?: string;
  /** Documented architect / designer (20th c. & contemporary repertoire) */
  ar?: string;
  /** Year of 20th c. / contemporary construction or adaptive reuse intervention */
  cy?: number;
  /** Type of contemporary intervention in the historic fabric ('new' | 'reuse' | 'pavilion') */
  ct?: ContemporaryInterventionType;
  /** Source of contemporary cataloguing ('mic' | 'ptrc' | 'wikidata') */
  cs?: 'mic' | 'ptrc' | 'wikidata';
}

export interface RawBuildingsFile {
  generatedAt: string;
  gridScale: number;
  source: string;
  stats: typeof BUILDINGS_AUDIT_STATS;
  buildings: RawBuildingItem[];
}

export interface HistoricBuildingFeature {
  id: number;
  name: string;
  category: BuildingCategory;
  year: number | null;
  yearPrecision: 'exact' | 'century' | 'circa' | 'unknown';
  yearSource: 'wikidata' | 'osm' | 'mic' | 'ptrc' | 'none';
  epoch: BuildingEpochKey;
  levels: number | null;
  heightM: number | null;
  estimatedHeightM: number;
  wikidata: string | null;
  heritage: boolean;
  architecturalStyle: string | null;
  sestiere: string | null;
  /** Architetto documentato in Wikidata (P84) */
  architect: string | null;
  /** Anno dell'intervento contemporaneo o del '900 (distinto dall'anno dell'edificio ospitante nei riusi) */
  contemporaryYear: number | null;
  /** Tipologia di rapporto col tessuto storico ('new' = nuova edificazione, 'reuse' = innesto/riuso, 'pavilion' = padiglione Biennale) */
  contemporaryType: ContemporaryInterventionType | null;
  /** Fonte del repertorio contemporaneo ('mic' | 'ptrc' | 'wikidata') */
  contemporarySource: 'mic' | 'ptrc' | 'wikidata' | null;
  /** Quota altimetrica stimata del piano di calpestio (cm su ZMPS) */
  groundElevationCm: number;
  /** Grid coordinates of building centroid */
  gx: number;
  gy: number;
}

interface IndexedBuildings {
  count: number;
  /** Bounding boxes in grid units: [x0, y0, x1, y1] per building */
  boxes: Float32Array;
  /** Centroids in grid units: [cx, cy] per building */
  centroids: Float32Array;
  /** Start offset into ringCoords (in floats) per building */
  ringOffsets: Int32Array;
  /** Number of vertices in outer ring per building */
  ringLengths: Int16Array;
  /** Outer ring coordinates in grid units: [x0, y0, x1, y1, ...] */
  ringCoords: Float32Array;
  /** Construction year (0 = unknown) */
  years: Int16Array;
  /** Epoch index (0..6) */
  epochs: Uint8Array;
  /** Category index (0..6) */
  categories: Uint8Array;
  /** Documented levels (0 = unknown) */
  levels: Uint8Array;
  /** Documented height in decimeters (0 = unknown) */
  heightsDm: Uint16Array;
  /** LoD1 extrusion height in meters (documented or typological) */
  extrusionM: Float32Array;
  /** Raw items for metadata lookup on click/hover */
  items: RawBuildingItem[];
}

export const EPOCH_ORDER: BuildingEpochKey[] = [
  'pre_1400',
  '1400_1599',
  '1600_1799',
  '1800_1899',
  '1900_1949',
  'post_1950',
  'unknown',
];

export const EPOCH_META: Record<
  BuildingEpochKey,
  {
    index: number;
    colorDark: string;
    colorLight: string;
    roofDark: string;
    roofLight: string;
    labelIt: string;
    labelEn: string;
    shortIt: string;
    shortEn: string;
  }
> = {
  pre_1400: {
    index: 0,
    colorDark: '#dc2626',
    colorLight: '#b91c1c',
    roofDark: '#ef4444',
    roofLight: '#dc2626',
    labelIt: 'Prima del 1400 (Bizantino / Gotico)',
    labelEn: 'Before 1400 (Byzantine / Gothic)',
    shortIt: '< 1400',
    shortEn: '< 1400',
  },
  '1400_1599': {
    index: 1,
    colorDark: '#ea580c',
    colorLight: '#c2410c',
    roofDark: '#f97316',
    roofLight: '#ea580c',
    labelIt: '1400–1599 (Rinascimento)',
    labelEn: '1400–1599 (Renaissance)',
    shortIt: '1400–1599',
    shortEn: '1400–1599',
  },
  '1600_1799': {
    index: 2,
    colorDark: '#d97706',
    colorLight: '#b45309',
    roofDark: '#f59e0b',
    roofLight: '#d97706',
    labelIt: '1600–1799 (Barocco / Settecento)',
    labelEn: '1600–1799 (Baroque / 18th c.)',
    shortIt: '1600–1799',
    shortEn: '1600–1799',
  },
  '1800_1899': {
    index: 3,
    colorDark: '#0d9488',
    colorLight: '#0f766e',
    roofDark: '#14b8a6',
    roofLight: '#0d9488',
    labelIt: '1800–1899 (Ottocento)',
    labelEn: '1800–1899 (19th c.)',
    shortIt: '1800–1899',
    shortEn: '1800–1899',
  },
  '1900_1949': {
    index: 4,
    colorDark: '#0284c7',
    colorLight: '#0369a1',
    roofDark: '#38bdf8',
    roofLight: '#0284c7',
    labelIt: '1900–1949 ( Primo Novecento)',
    labelEn: '1900–1949 (Early 20th c.)',
    shortIt: '1900–1949',
    shortEn: '1900–1949',
  },
  post_1950: {
    index: 5,
    colorDark: '#6366f1',
    colorLight: '#4f46e5',
    roofDark: '#818cf8',
    roofLight: '#6366f1',
    labelIt: 'Dal 1950 a oggi (Contemporaneo)',
    labelEn: '1950–Present (Contemporary)',
    shortIt: '≥ 1950',
    shortEn: '≥ 1950',
  },
  unknown: {
    index: 6,
    colorDark: 'rgba(100, 116, 139, 0.34)',
    colorLight: 'rgba(100, 116, 139, 0.30)',
    roofDark: 'rgba(148, 163, 184, 0.42)',
    roofLight: 'rgba(100, 116, 139, 0.38)',
    labelIt: 'Anno non documentato in open data',
    labelEn: 'Year undocumented in open data',
    shortIt: 'Non datato',
    shortEn: 'Undated',
  },
};

export const CATEGORY_ORDER: BuildingCategory[] = [
  'religious',
  'palazzo',
  'scuola',
  'public',
  'industrial',
  'commercial',
  'residential',
];

export const CATEGORY_META: Record<
  BuildingCategory,
  {
    index: number;
    colorDark: string;
    colorLight: string;
    labelIt: string;
    labelEn: string;
    defaultHeightM: number;
  }
> = {
  religious: {
    index: 0,
    colorDark: '#f43f5e',
    colorLight: '#e11d48',
    labelIt: 'Chiese, basiliche e campanili',
    labelEn: 'Churches, basilicas & bell towers',
    defaultHeightM: 22,
  },
  palazzo: {
    index: 1,
    colorDark: '#f59e0b',
    colorLight: '#d97706',
    labelIt: 'Palazzi storici e Ca’ veneziane',
    labelEn: 'Historic palaces & Venetian Ca’',
    defaultHeightM: 16,
  },
  scuola: {
    index: 2,
    colorDark: '#a855f7',
    colorLight: '#9333ea',
    labelIt: 'Scuole Grandi e confraternite',
    labelEn: 'Scuole Grandi & confraternities',
    defaultHeightM: 18,
  },
  public: {
    index: 3,
    colorDark: '#06b6d4',
    colorLight: '#0891b2',
    labelIt: 'Musei, teatri, biblioteche ed edifici civici',
    labelEn: 'Museums, theatres, libraries & civic buildings',
    defaultHeightM: 15,
  },
  industrial: {
    index: 4,
    colorDark: '#10b981',
    colorLight: '#059669',
    labelIt: 'Arsenale e archeologia industriale',
    labelEn: 'Arsenale & industrial heritage',
    defaultHeightM: 14,
  },
  commercial: {
    index: 5,
    colorDark: '#3b82f6',
    colorLight: '#2563eb',
    labelIt: 'Fondaci, mercati e strutture storiche',
    labelEn: 'Fondaci, markets & historic structures',
    defaultHeightM: 13,
  },
  residential: {
    index: 6,
    colorDark: 'rgba(100, 116, 139, 0.34)',
    colorLight: 'rgba(100, 116, 139, 0.30)',
    labelIt: 'Tessuto edilizio residenziale (OSM civici)',
    labelEn: 'Residential urban fabric (OSM civic units)',
    defaultHeightM: 10.5,
  },
};

export function classifyYearEpoch(year: number | undefined | null): BuildingEpochKey {
  if (!year || year <= 0) return 'unknown';
  if (year < 1400) return 'pre_1400';
  if (year < 1600) return '1400_1599';
  if (year < 1800) return '1600_1799';
  if (year < 1900) return '1800_1899';
  if (year < 1950) return '1900_1949';
  return 'post_1950';
}

let buildingsData: IndexedBuildings | null = null;
let buildingsRequestedAt = 0;

export const isBuildingsLoaded = (): boolean => buildingsData !== null;
export const getBuildingsAuditStats = () => BUILDINGS_AUDIT_STATS;

function indexRawBuildings(raw: RawBuildingsFile): IndexedBuildings {
  const items = raw.buildings;
  const count = items.length;
  const invScale = 1 / (raw.gridScale || 10);

  let totalFloats = 0;
  for (let i = 0; i < count; i++) {
    const outer = items[i].r[0];
    if (outer) totalFloats += outer.length;
  }

  const boxes = new Float32Array(count * 4);
  const centroids = new Float32Array(count * 2);
  const ringOffsets = new Int32Array(count);
  const ringLengths = new Int16Array(count);
  const ringCoords = new Float32Array(totalFloats);
  const years = new Int16Array(count);
  const epochs = new Uint8Array(count);
  const categories = new Uint8Array(count);
  const levels = new Uint8Array(count);
  const heightsDm = new Uint16Array(count);
  const extrusionM = new Float32Array(count);

  let ptr = 0;
  for (let i = 0; i < count; i++) {
    const item = items[i];
    const outer = item.r[0] || [];
    const nPts = Math.floor(outer.length / 2);
    ringOffsets[i] = ptr;
    ringLengths[i] = nPts;

    let accX = 0;
    let accY = 0;
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    let sumX = 0;
    let sumY = 0;

    for (let k = 0; k < nPts; k++) {
      accX += outer[2 * k];
      accY += outer[2 * k + 1];
      const gx = accX * invScale;
      const gy = accY * invScale;
      ringCoords[ptr++] = gx;
      ringCoords[ptr++] = gy;
      if (gx < x0) x0 = gx;
      if (gx > x1) x1 = gx;
      if (gy < y0) y0 = gy;
      if (gy > y1) y1 = gy;
      sumX += gx;
      sumY += gy;
    }

    boxes[4 * i] = x0;
    boxes[4 * i + 1] = y0;
    boxes[4 * i + 2] = x1;
    boxes[4 * i + 3] = y1;
    centroids[2 * i] = nPts > 0 ? sumX / nPts : 0;
    centroids[2 * i + 1] = nPts > 0 ? sumY / nPts : 0;

    const y = item.y || 0;
    years[i] = y;
    const epKey = classifyYearEpoch(y);
    epochs[i] = EPOCH_META[epKey].index;

    const catKey: BuildingCategory = item.c && item.c in CATEGORY_META ? item.c : 'residential';
    categories[i] = CATEGORY_META[catKey].index;

    const lvl = item.l || 0;
    const hM = item.h || 0;
    levels[i] = lvl;
    heightsDm[i] = Math.round(hM * 10);

    if (hM > 0) {
      extrusionM[i] = Math.min(99, hM);
    } else if (lvl > 0) {
      extrusionM[i] = Math.min(60, lvl * 3.5);
    } else {
      extrusionM[i] = CATEGORY_META[catKey].defaultHeightM;
    }
  }

  return {
    count,
    boxes,
    centroids,
    ringOffsets,
    ringLengths,
    ringCoords,
    years,
    epochs,
    categories,
    levels,
    heightsDm,
    extrusionM,
    items,
  };
}

export function requestBuildings(onReady: () => void): void {
  if (buildingsData || Date.now() - buildingsRequestedAt < 30_000) return;
  buildingsRequestedAt = Date.now();
  fetch(BUILDINGS_URL)
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<RawBuildingsFile>;
    })
    .then((raw) => {
      buildingsData = indexRawBuildings(raw);
      onReady();
    })
    .catch((e) => console.warn('Dataset edifici storici non disponibile:', e));
}

export interface BuildingsPaintOptions {
  cw: number;
  ch: number;
  camera: { x0: number; y0: number; s: number };
  pal: ColorScheme;
  zoomFactor: number;
  colorMode: BuildingColorMode;
  epochFilter: BuildingEpochFilter;
  /** Optional timeline upper bound year (e.g., 1500 shows only buildings built <= 1500) */
  maxYear?: number | null;
  /** Whether 3D isometric perspective is active */
  extrude3D: boolean;
  /** Optional highlighted/selected building id */
  selectedBuildingId?: number | null;
  /** Livello di marea attivo in cm ZMPS per disegnare il battente d'acqua 3D sulle facciate */
  tideLevelCm?: number;
}

function getFloorsColor(
  levels: number,
  heightDm: number,
  extrusionM: number,
  isDark: boolean,
  isDocumented: boolean,
): { wall: string; roof: string } {
  if (!isDocumented) {
    // Tipologia stimata (non misurata su singolo edificio): grigio tecnico neutro con leggera variazione per altezza
    if (extrusionM >= 16) {
      return isDark
        ? { wall: 'rgba(100, 116, 139, 0.52)', roof: 'rgba(148, 163, 184, 0.62)' }
        : { wall: 'rgba(100, 116, 139, 0.45)', roof: 'rgba(148, 163, 184, 0.55)' };
    }
    return isDark
      ? { wall: 'rgba(71, 85, 105, 0.34)', roof: 'rgba(100, 116, 139, 0.42)' }
      : { wall: 'rgba(100, 116, 139, 0.28)', roof: 'rgba(148, 163, 184, 0.36)' };
  }
  const effectiveFloors = levels > 0 ? levels : Math.max(1, Math.round(heightDm / 35));
  if (effectiveFloors <= 2) {
    return isDark
      ? { wall: '#0284c7', roof: '#38bdf8' }
      : { wall: '#0369a1', roof: '#0284c7' };
  }
  if (effectiveFloors <= 4) {
    return isDark
      ? { wall: '#10b981', roof: '#34d399' }
      : { wall: '#059669', roof: '#10b981' };
  }
  if (effectiveFloors <= 6) {
    return isDark
      ? { wall: '#d97706', roof: '#fbbf24' }
      : { wall: '#b45309', roof: '#f59e0b' };
  }
  return isDark
    ? { wall: '#e11d48', roof: '#fb7185' }
    : { wall: '#be123c', roof: '#f43f5e' };
}

function passesFilter(
  year: number,
  epochIdx: number,
  item: RawBuildingItem | undefined,
  epochFilter: BuildingEpochFilter,
  maxYear?: number | null,
): boolean {
  const effectiveYear = item?.cy && epochFilter === 'contemporary_authored' ? item.cy : year;
  if (maxYear !== undefined && maxYear !== null && maxYear < 2026) {
    if (effectiveYear <= 0 || effectiveYear > maxYear) return false;
  }
  if (epochFilter === 'all') return true;
  if (epochFilter === 'dated_only') return year > 0 || Boolean(item?.cy);
  if (epochFilter === 'contemporary_authored') {
    return Boolean(item?.ar) || Boolean(item?.cy && item.cy >= 1900) || year >= 1900;
  }
  return EPOCH_ORDER[epochIdx] === epochFilter;
}

/**
 * Disegna le impronte 2D e i volumi estrusi 2.5D/3D degli edifici veneziani.
 * Rispetta rigorosamente il principio anti-false-precision:
 * in modalità 'period', solo gli edifici con anno documentato (Wikidata P571 / OSM start_date)
 * sono colorati per epoca; il tessuto residenziale privo di data aperta resta grigio tecnico.
 * In modalità 'contemporary', evidenzia le architetture d'autore del '900 e contemporanee
 * (architetto in Wikidata, P84) distinguendo nuova edificazione,
 * innesti/riusi in edifici storici e padiglioni della Biennale.
 */
export function drawBuildings(ctx: CanvasRenderingContext2D, o: BuildingsPaintOptions): void {
  if (!buildingsData) return;

  const {
    cw,
    ch,
    camera,
    pal,
    zoomFactor,
    colorMode,
    epochFilter,
    maxYear,
    extrude3D,
    selectedBuildingId,
    tideLevelCm = 0,
  } = o;

  const {
    count,
    boxes,
    centroids,
    ringOffsets,
    ringLengths,
    ringCoords,
    years,
    epochs,
    categories,
    levels,
    heightsDm,
    extrusionM,
    items,
  } = buildingsData;

  const sx = (x: number) => (x - camera.x0) * camera.s;
  const sy = (y: number) => (y - camera.y0) * camera.s;

  const margin = 40 / camera.s;
  const vx0 = camera.x0 - margin;
  const vy0 = camera.y0 - margin;
  const vx1 = camera.x0 + cw / camera.s + margin;
  const vy1 = camera.y0 + ch / camera.s + margin;

  const isDark =
    pal.coast === '#3a4850' ||
    pal.land === '#1a2227' ||
    pal.ground.startsWith('#0') ||
    pal.ground.startsWith('#1');

  // Scala di estrusione verticale in pixel schermo per metro d'altezza (supporta zoom ravvicinato fino a camera.s = 8.0)
  const zScale = extrude3D
    ? Math.min(6.2, Math.max(0.45, camera.s * 0.58))
    : camera.s >= 0.9
      ? Math.min(2.6, camera.s * 0.24)
      : 0;

  // Raccogli gli indici visibili nel viewport
  const visible: number[] = [];
  for (let i = 0; i < count; i++) {
    const bx0 = boxes[4 * i];
    const by0 = boxes[4 * i + 1];
    const bx1 = boxes[4 * i + 2];
    const by1 = boxes[4 * i + 3];
    if (bx1 < vx0 || bx0 > vx1 || by1 < vy0 || by0 > vy1) continue;

    // A zoom molto basso mostra tutti gli edifici monumentali/datati e campiona il residenziale minuto
    const catIdx = categories[i];
    const year = years[i];
    const item = items[i];
    if (zoomFactor < 1.35 && catIdx === 6 && year === 0 && !item.ar && i % 2 !== 0) continue;

    if (!passesFilter(year, epochs[i], item, epochFilter, maxYear)) continue;
    visible.push(i);
  }

  // Painter's algorithm: ordina da Nord a Sud (gy crescente) così i volumi più a Sud coprono quelli a Nord
  if (zScale > 0.15) {
    visible.sort((a, b) => {
      const dy = centroids[2 * a + 1] - centroids[2 * b + 1];
      if (Math.abs(dy) > 0.5) return dy;
      return extrusionM[a] - extrusionM[b];
    });
  }

  ctx.save();
  ctx.lineJoin = 'round';

  for (let v = 0; v < visible.length; v++) {
    const i = visible[v];
    const offset = ringOffsets[i];
    const nPts = ringLengths[i];
    if (nPts < 3) continue;

    const year = years[i];
    const item = items[i];
    const epKey = EPOCH_ORDER[epochs[i]];
    const catKey = CATEGORY_ORDER[categories[i]];
    const lvl = levels[i];
    const hDm = heightsDm[i];
    const extM = extrusionM[i];
    const dz = zScale > 0.15 ? extM * zScale : 0;

    const isContemporaryEntry = Boolean(item.ar) || Boolean(item.cy && item.cy >= 1900) || year >= 1900;

    let wallColor: string;
    let roofColor: string;
    const isHighlighted =
      (colorMode === 'period' && (year > 0 || Boolean(item.ar))) ||
      (colorMode === 'contemporary' && isContemporaryEntry) ||
      (colorMode === 'floors' && (lvl > 0 || hDm > 0)) ||
      (colorMode === 'category' && catKey !== 'residential');

    if (colorMode === 'contemporary') {
      if (item.ct === 'reuse') {
        // Innesto / Riuso d'autore dentro edificio storico (Scarpa, Ando, Koolhaas, Chipperfield, Piano)
        wallColor = isDark ? '#c026d3' : '#a21caf';
        roofColor = isDark ? '#e879f9' : '#d946ef';
      } else if (item.ct === 'pavilion') {
        // Padiglione d'autore ai Giardini della Biennale (Scarpa, Aalto, Fehn, Rietveld, Stirling)
        wallColor = isDark ? '#059669' : '#047857';
        roofColor = isDark ? '#34d399' : '#10b981';
      } else if (item.ct === 'new' || item.ar) {
        // Nuova architettura d'autore nel tessuto storico (Gardella, Samonà, Trincanato, Valle, Rossi, De Carlo, Zucchi)
        wallColor = isDark ? '#0284c7' : '#0369a1';
        roofColor = isDark ? '#38bdf8' : '#0ea5e9';
      } else if (year >= 1900) {
        // Altro edificio del '900 censito in Wikidata
        wallColor = isDark ? '#4f46e5' : '#4338ca';
        roofColor = isDark ? '#818cf8' : '#6366f1';
      } else {
        // Tessuto storico pre-1900: grigio tecnico neutro per far emergere gli innesti contemporanei
        wallColor = isDark ? 'rgba(71, 85, 105, 0.25)' : 'rgba(100, 116, 139, 0.22)';
        roofColor = isDark ? 'rgba(100, 116, 139, 0.32)' : 'rgba(148, 163, 184, 0.28)';
      }
    } else if (colorMode === 'period') {
      const m = EPOCH_META[epKey];
      wallColor = isDark ? m.colorDark : m.colorLight;
      roofColor = isDark ? m.roofDark : m.roofLight;
    } else if (colorMode === 'floors') {
      const fc = getFloorsColor(lvl, hDm, extM, isDark, lvl > 0 || hDm > 0);
      wallColor = fc.wall;
      roofColor = fc.roof;
    } else {
      const cm = CATEGORY_META[catKey];
      wallColor = isDark ? cm.colorDark : cm.colorLight;
      roofColor = wallColor;
    }

    const isSelected = selectedBuildingId === i;

    // 1. Disegno pareti laterali estruse (se dz >= 1.2 px)
    if (dz >= 1.2 && (isHighlighted || camera.s >= 0.55 || extrude3D)) {
      ctx.fillStyle = wallColor;
      ctx.beginPath();
      for (let k = 0; k < nPts; k++) {
        const nextK = (k + 1) % nPts;
        const xA = sx(ringCoords[offset + 2 * k]);
        const yA = sy(ringCoords[offset + 2 * k + 1]);
        const xB = sx(ringCoords[offset + 2 * nextK]);
        const yB = sy(ringCoords[offset + 2 * nextK + 1]);
        // Disegna le facciate rivolte verso la camera (sud/est/ovest)
        ctx.moveTo(xA, yA);
        ctx.lineTo(xB, yB);
        ctx.lineTo(xB, yB - dz);
        ctx.lineTo(xA, yA - dz);
        ctx.closePath();
      }
      ctx.fill();

      // 1b. Fascia di sommersione idrica 3D sulle pareti (calibrata in cm ZMPS)
      if (tideLevelCm >= 80) {
        const groundCm = groundElevationCmAt(centroids[2 * i], centroids[2 * i + 1]);
        if (tideLevelCm > groundCm) {
          // Esaltazione visiva del battente d'acqua al piano terra per leggibilità 3D
          const depthM = (tideLevelCm - groundCm) / 100;
          const waterDz = Math.min(dz * 0.85, Math.max(1.8, depthM * zScale * 3.6));
          ctx.fillStyle = isDark ? 'rgba(6, 182, 212, 0.52)' : 'rgba(2, 132, 199, 0.48)';
          ctx.beginPath();
          for (let k = 0; k < nPts; k++) {
            const nextK = (k + 1) % nPts;
            const xA = sx(ringCoords[offset + 2 * k]);
            const yA = sy(ringCoords[offset + 2 * k + 1]);
            const xB = sx(ringCoords[offset + 2 * nextK]);
            const yB = sy(ringCoords[offset + 2 * nextK + 1]);
            ctx.moveTo(xA, yA);
            ctx.lineTo(xB, yB);
            ctx.lineTo(xB, yB - waterDz);
            ctx.lineTo(xA, yA - waterDz);
            ctx.closePath();
          }
          ctx.fill();

          // Linea luminosa del pelo libero dell'acqua lungo il perimetro dell'edificio
          ctx.strokeStyle = isDark ? 'rgba(34, 211, 238, 0.88)' : 'rgba(2, 132, 199, 0.85)';
          ctx.lineWidth = Math.min(1.8, Math.max(0.9, camera.s * 0.45));
          ctx.beginPath();
          for (let k = 0; k < nPts; k++) {
            const px = sx(ringCoords[offset + 2 * k]);
            const py = sy(ringCoords[offset + 2 * k + 1]) - waterDz;
            if (k === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    }

    // 2. Disegno impronta tetto (traslata di -dz lungo Y)
    ctx.beginPath();
    for (let k = 0; k < nPts; k++) {
      const px = sx(ringCoords[offset + 2 * k]);
      const py = sy(ringCoords[offset + 2 * k + 1]) - dz;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    ctx.fillStyle = roofColor;
    ctx.fill();

    if (isSelected) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.4;
      ctx.stroke();
    } else if (Boolean(item.ar) && (colorMode === 'contemporary' || epochFilter === 'contemporary_authored')) {
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.78)' : 'rgba(15, 23, 42, 0.75)';
      ctx.lineWidth = 1.25;
      ctx.stroke();
    } else if (isHighlighted && camera.s >= 0.35) {
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.38)' : 'rgba(15, 23, 42, 0.42)';
      ctx.lineWidth = dz >= 1.5 ? 0.9 : 0.65;
      ctx.stroke();
    } else if (camera.s >= 0.85) {
      ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(71, 85, 105, 0.20)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // 3. Etichetta anno / nome / architetto sui monumenti principali e sulle opere d'autore
    const showAuthoredLabel =
      Boolean(item.ar) &&
      (colorMode === 'contemporary' || epochFilter === 'contemporary_authored') &&
      camera.s >= 0.45;

    if (
      showAuthoredLabel ||
      (isHighlighted && camera.s >= 1.35 && year > 0) ||
      (camera.s >= 2.8 && (year > 0 || item.n))
    ) {
      const cx = sx(centroids[2 * i]);
      const cy = sy(centroids[2 * i + 1]) - dz;
      const shortArch = item.ar ? item.ar.split('(')[0].trim() : '';
      const dispYear = item.cy || year;
      let label = '';
      if (showAuthoredLabel) {
        label =
          camera.s >= 1.35 && item.n
            ? `${item.n} · ${shortArch} (${dispYear})`
            : `${shortArch} (${dispYear})`;
      } else {
        label =
          camera.s >= 2.1 && item.n
            ? year > 0
              ? `${item.n} (${year})`
              : item.n
            : String(year);
      }
      if (label) {
        ctx.font = '600 9.5px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isDark ? 'rgba(2, 6, 23, 0.84)' : 'rgba(255, 255, 255, 0.90)';
        const tw = ctx.measureText(label).width;
        ctx.fillRect(cx - tw / 2 - 3, cy - 6, tw + 6, 12);
        ctx.fillStyle = showAuthoredLabel
          ? isDark
            ? '#f0abfc'
            : '#701a75'
          : isDark
            ? '#f8fafc'
            : '#0f172a';
        ctx.fillText(label, cx, cy);
      }
    }
  }

  ctx.restore();
}

function pointInRing(
  px: number,
  py: number,
  ringCoords: Float32Array,
  offset: number,
  nPts: number,
): boolean {
  let inside = false;
  for (let i = 0, j = nPts - 1; i < nPts; j = i++) {
    const xi = ringCoords[offset + 2 * i];
    const yi = ringCoords[offset + 2 * i + 1];
    const xj = ringCoords[offset + 2 * j];
    const yj = ringCoords[offset + 2 * j + 1];
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function getBuildingById(id: number): HistoricBuildingFeature | null {
  if (!buildingsData || id < 0 || id >= buildingsData.count) return null;
  const item = buildingsData.items[id];
  const year = buildingsData.years[id] > 0 ? buildingsData.years[id] : null;
  const catKey = CATEGORY_ORDER[buildingsData.categories[id]];
  const epKey = EPOCH_ORDER[buildingsData.epochs[id]];
  const lvl = buildingsData.levels[id] > 0 ? buildingsData.levels[id] : null;
  const hM = buildingsData.heightsDm[id] > 0 ? +(buildingsData.heightsDm[id] / 10).toFixed(1) : null;
  const gx = buildingsData.centroids[2 * id];
  const gy = buildingsData.centroids[2 * id + 1];
  const groundElevationCm = Math.round(groundElevationCmAt(gx, gy));

  return {
    id,
    name: item.n || (catKey === 'residential' ? 'Unità edilizia residenziale' : 'Edificio storico'),
    category: catKey,
    year,
    yearPrecision: (item.yp as HistoricBuildingFeature['yearPrecision']) || (year ? 'exact' : 'unknown'),
    yearSource: (item.ys as HistoricBuildingFeature['yearSource']) || (year ? 'wikidata' : 'none'),
    epoch: epKey,
    levels: lvl,
    heightM: hM,
    estimatedHeightM: +buildingsData.extrusionM[id].toFixed(1),
    wikidata: item.w || null,
    heritage: item.hr === 1,
    architecturalStyle: item.st || null,
    sestiere: item.s || null,
    architect: item.ar || null,
    contemporaryYear: item.cy || null,
    contemporaryType: item.ct || null,
    contemporarySource: item.cs || null,
    groundElevationCm,
    gx,
    gy,
  };
}

/**
 * Hit-testing di un edificio in coordinate griglia (gx, gy), tenendo conto anche dello shift
 * verticale del tetto quando l'estrusione 3D è attiva.
 */
export function buildingAt(
  gx: number,
  gy: number,
  cameraS: number,
  extrude3D: boolean,
  epochFilter: BuildingEpochFilter = 'all',
  maxYear?: number | null,
): HistoricBuildingFeature | null {
  if (!buildingsData) return null;
  const {
    count,
    boxes,
    centroids,
    ringOffsets,
    ringLengths,
    ringCoords,
    years,
    epochs,
    extrusionM,
    items,
  } = buildingsData;

  const zScale = extrude3D
    ? Math.min(6.2, Math.max(0.45, cameraS * 0.58))
    : cameraS >= 0.9
      ? Math.min(2.6, cameraS * 0.24)
      : 0;

  const pad = Math.max(4, 8 / Math.max(0.25, cameraS));

  // Priorità agli edifici datati / monumentali (che sono all'inizio dell'array prima dei civici residenziali)
  let bestId = -1;
  let bestDistSq = Infinity;

  for (let i = 0; i < count; i++) {
    if (!passesFilter(years[i], epochs[i], items[i], epochFilter, maxYear)) continue;

    // In 3D il tetto è spostato verso l'alto di dz = extM * zScale pixel schermo = extM * (zScale / cameraS) unità griglia
    const gridLift = zScale > 0.15 ? extrusionM[i] * (zScale / Math.max(0.1, cameraS)) : 0;

    const bx0 = boxes[4 * i] - pad;
    const by0 = boxes[4 * i + 1] - gridLift - pad;
    const bx1 = boxes[4 * i + 2] + pad;
    const by1 = boxes[4 * i + 3] + pad;

    if (gx < bx0 || gx > bx1 || gy < by0 || gy > by1) continue;

    const offset = ringOffsets[i];
    const nPts = ringLengths[i];

    // Controlla point-in-polygon sulla base oppure sul tetto traslato
    if (
      pointInRing(gx, gy, ringCoords, offset, nPts) ||
      (gridLift > 0 && pointInRing(gx, gy + gridLift, ringCoords, offset, nPts))
    ) {
      // Se troviamo un edificio monumentale/datato, restituiscilo subito
      if (years[i] > 0 || i < 850) {
        return getBuildingById(i);
      }
      if (bestId === -1) {
        bestId = i;
      }
    } else {
      const cx = centroids[2 * i];
      const cy = centroids[2 * i + 1] - gridLift * 0.5;
      const dSq = (gx - cx) * (gx - cx) + (gy - cy) * (gy - cy);
      if (dSq <= pad * pad && dSq < bestDistSq) {
        bestDistSq = dSq;
        bestId = i;
      }
    }
  }

  return bestId !== -1 ? getBuildingById(bestId) : null;
}
