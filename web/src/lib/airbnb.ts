/**
 * Locazioni brevi Inside Airbnb (CC BY 4.0) incrociate con il Censimento ISTAT 2021 (CC BY 4.0),
 * elaborate da pipeline/import_inside_airbnb.py:
 * - statistiche reali per sestiere, isola e area di terraferma (senza id, nomi host o codici CIN individuali);
 * - griglia di densità su celle di ~100 m nell'area della mappa VOD.
 */
import rawAirbnb from '@/data/inside-airbnb-venezia.json';
import type { TouristAccommodationItem } from './types';

/** [i, j, totale_annunci, interi_appartamenti, multi_host, prezzo_mediano_eur] */
export type AirbnbCell = [number, number, number, number, number, number];

/** [lon, lat, room_type_code (0=entire, 1=private, 2=hotel, 3=shared), price_eur, host_count, availability_365, reviews_ltm, has_license, zone_idx] */
export type AirbnbPointTuple = [number, number, 0 | 1 | 2 | 3, number, number, number, number, 0 | 1, number];

export type AirbnbRoomType = 'entire_home_apt' | 'private_room' | 'hotel_room' | 'shared_room';

export interface AirbnbListingPoint {
  id: string;
  lon: number;
  lat: number;
  roomType: AirbnbRoomType;
  priceEur: number | null;
  hostListingsCount: number;
  availabilityDays: number;
  reviewsLtm: number;
  hasLicense: boolean;
  zoneId: string;
  zoneName: string;
  sestiereOrLocation: string;
  snapshotDate: string;
}

/** 1 = 1-3 annunci, 2 = 4-9 annunci, 3 = 10-19 annunci, 4 = >= 20 annunci nella cella da ~100 m */
export type AirbnbClass = 1 | 2 | 3 | 4;

export interface AirbnbSummaryStats {
  totalStructures: number;
  totalBeds: number;
  hotelCount: number;
  extraHotelCount: number;
  entireHomeApt: number;
  privateRoom: number;
  sharedRoom: number;
  multiHostListings: number;
  pctMultiHost: number;
  commercial5PlusListings: number;
  pctCommercial5Plus: number;
  withLicense: number;
  pctWithLicense: number;
  activeReviewsLtm: number;
  medianPriceEur: number | null;
  meanPriceEur: number | null;
  avgAvailabilityDays: number;
  listingsPer100Dwellings: number;
  bedsPerResidentRatio: number;
  istatPopulation: number;
  istatDwellingsTotal: number;
  istatDwellingsEmpty: number;
  istatPctEmpty: number;
  densityCategory: 'CRITICA' | 'MOLTO_ALTA' | 'ALTA' | 'MODERATA';
}

export interface AirbnbDataset {
  generatedAt: string;
  snapshotDate: string;
  source: string;
  sourceUrl: string;
  license: string;
  attribution: string;
  totalListings: number;
  city: AirbnbSummaryStats;
  historicCentre: AirbnbSummaryStats;
  zones: TouristAccommodationItem[];
  origin: [number, number];
  cellDeg: [number, number];
  cells: AirbnbCell[];
  points?: AirbnbPointTuple[];
}

export const AIRBNB_DATA = rawAirbnb as unknown as AirbnbDataset;

export const AIRBNB_ZONES: TouristAccommodationItem[] = AIRBNB_DATA.zones;

const ROOM_TYPES: readonly AirbnbRoomType[] = [
  'entire_home_apt',
  'private_room',
  'hotel_room',
  'shared_room',
];

export const AIRBNB_LISTING_POINTS: AirbnbListingPoint[] = (AIRBNB_DATA.points ?? []).map((pt, idx) => {
  const [lon, lat, rtCode, price, hostCount, avail, revLtm, hasLic, zoneIdx] = pt;
  const zone = AIRBNB_DATA.zones[zoneIdx] ?? AIRBNB_DATA.zones[0];
  return {
    id: `airbnb_pt_${idx}`,
    lon,
    lat,
    roomType: ROOM_TYPES[rtCode] ?? 'entire_home_apt',
    priceEur: price > 0 ? price : null,
    hostListingsCount: hostCount,
    availabilityDays: avail,
    reviewsLtm: revLtm,
    hasLicense: hasLic === 1,
    zoneId: zone?.id ?? 'ACC_SAN_MARCO',
    zoneName: zone?.zoneName ?? 'Venezia',
    sestiereOrLocation: zone?.sestiereOrLocation ?? 'Venezia',
    snapshotDate: AIRBNB_DATA.snapshotDate,
  };
});

export const AIRBNB_ROOM_COLORS: Record<AirbnbRoomType, string> = {
  entire_home_apt: '#f43f5e', // Intero appartamento (rosa/corallo Airbnb)
  private_room: '#a855f7',    // Stanza privata B&B (viola)
  hotel_room: '#0ea5e9',      // Camera d'albergo (azzurro)
  shared_room: '#f59e0b',     // Posto letto condiviso (ambra)
};

export const AIRBNB_CELL_COLORS: Record<AirbnbClass, string> = {
  1: '#a855f7', // 1-3 annunci (~100 m)
  2: '#d946ef', // 4-9 annunci
  3: '#ec4899', // 10-19 annunci
  4: '#f43f5e', // >= 20 annunci
};

export function airbnbCellClass(totalListings: number): AirbnbClass {
  if (totalListings >= 20) return 4;
  if (totalListings >= 10) return 3;
  if (totalListings >= 4) return 2;
  return 1;
}

export function airbnbCellBounds(
  ds: Pick<AirbnbDataset, 'origin' | 'cellDeg'>,
  i: number,
  j: number,
) {
  const lon0 = ds.origin[0] + i * ds.cellDeg[0];
  const lat0 = ds.origin[1] + j * ds.cellDeg[1];
  return { lon0, lat0, lon1: lon0 + ds.cellDeg[0], lat1: lat0 + ds.cellDeg[1] };
}

export interface AirbnbRoomTypeStat {
  roomType: AirbnbRoomType;
  count: number;
  sharePct: number;
  meanPriceEur: number | null;
  medianPriceEur: number | null;
  avgAvailabilityDays: number;
  avgReviewsLtm: number;
}

export interface AirbnbPriceBracketStat {
  id: 'under100' | 'from100to199' | 'from200to299' | 'from300to499' | 'over500';
  count: number;
  sharePct: number;
  historicCentreCount: number;
  otherAreasCount: number;
}

export interface AirbnbHostBracketStat {
  id: 'single' | 'small_2_4' | 'medium_5_19' | 'large_20_plus';
  count: number;
  sharePct: number;
  meanPriceEur: number | null;
  medianPriceEur: number | null;
  entireHomePct: number;
}

export interface AirbnbAvailabilityBracketStat {
  id: 'zero' | 'occasional_1_90' | 'seasonal_91_180' | 'yearRound_181_365';
  count: number;
  sharePct: number;
}

export interface AirbnbZoneDetailedPrice {
  zoneId: string;
  pricedCount: number;
  entireMeanEur: number | null;
  entireMedianEur: number | null;
  privateMeanEur: number | null;
  privateMedianEur: number | null;
  p25Eur: number | null;
  p75Eur: number | null;
  avgReviewsLtm: number;
}

export interface AirbnbDetailedStats {
  pricedListingsCount: number;
  p10PriceEur: number | null;
  p25PriceEur: number | null;
  p75PriceEur: number | null;
  p90PriceEur: number | null;
  historicvsMainlandPriceRatio: number | null;
  byRoomType: AirbnbRoomTypeStat[];
  priceBrackets: AirbnbPriceBracketStat[];
  hostBrackets: AirbnbHostBracketStat[];
  maxHostPortfolioSize: number;
  availabilityBrackets: AirbnbAvailabilityBracketStat[];
  totalReviewsLtm: number;
  avgReviewsPerListingLtm: number;
  zoneDetails: Record<string, AirbnbZoneDetailedPrice>;
  gridStats: {
    totalCells: number;
    highDensityCells10Plus: number;
    extremeDensityCells20Plus: number;
    maxListingsInSingleCell: number;
  };
}

function calcMean(vals: number[]): number | null {
  if (vals.length === 0) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function calcPercentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return Math.round(sorted[lo]);
  return Math.round(sorted[lo] * (hi - idx) + sorted[hi] * (idx - lo));
}

function calcMedian(vals: number[]): number | null {
  if (vals.length === 0) return null;
  const sorted = [...vals].sort((a, b) => a - b);
  return calcPercentile(sorted, 0.5);
}

let cachedDetailedStats: AirbnbDetailedStats | null = null;

/** Calcola le statistiche di dettaglio sugli 8.844 annunci e sulle 14 zone di Venezia. */
export function getAirbnbDetailedStats(): AirbnbDetailedStats {
  if (cachedDetailedStats) return cachedDetailedStats;

  const pts = AIRBNB_LISTING_POINTS;
  const total = pts.length || 1;
  const historicZoneIds = new Set(
    AIRBNB_ZONES.filter((z) => z.macroArea === 'historic_centre').map((z) => z.id)
  );
  const mainlandZoneIds = new Set(
    AIRBNB_ZONES.filter((z) => z.macroArea === 'terraferma').map((z) => z.id)
  );

  const allPrices = pts
    .map((p) => p.priceEur)
    .filter((v): v is number => v !== null && v > 0)
    .sort((a, b) => a - b);

  const historicPrices = pts
    .filter((p) => historicZoneIds.has(p.zoneId) && p.priceEur !== null && p.priceEur > 0)
    .map((p) => p.priceEur as number);
  const mainlandPrices = pts
    .filter((p) => mainlandZoneIds.has(p.zoneId) && p.priceEur !== null && p.priceEur > 0)
    .map((p) => p.priceEur as number);

  const histMean = calcMean(historicPrices);
  const mainMean = calcMean(mainlandPrices);
  const historicvsMainlandPriceRatio =
    histMean && mainMean ? Math.round((histMean / mainMean) * 100) / 100 : null;

  const byRoomType: AirbnbRoomTypeStat[] = ROOM_TYPES.map((rt) => {
    const sub = pts.filter((p) => p.roomType === rt);
    const prices = sub.map((p) => p.priceEur).filter((v): v is number => v !== null && v > 0);
    const avgAvail =
      sub.length > 0 ? Math.round(sub.reduce((s, x) => s + x.availabilityDays, 0) / sub.length) : 0;
    const avgRev =
      sub.length > 0
        ? Math.round((sub.reduce((s, x) => s + x.reviewsLtm, 0) / sub.length) * 10) / 10
        : 0;
    return {
      roomType: rt,
      count: sub.length,
      sharePct: Math.round((sub.length / total) * 1000) / 10,
      meanPriceEur: calcMean(prices),
      medianPriceEur: calcMedian(prices),
      avgAvailabilityDays: avgAvail,
      avgReviewsLtm: avgRev,
    };
  });

  const pricedPts = pts.filter((p) => p.priceEur !== null && p.priceEur > 0);
  const pricedTotal = pricedPts.length || 1;
  const bracketDefs: Array<{
    id: AirbnbPriceBracketStat['id'];
    test: (price: number) => boolean;
  }> = [
    { id: 'under100', test: (v) => v < 100 },
    { id: 'from100to199', test: (v) => v >= 100 && v < 200 },
    { id: 'from200to299', test: (v) => v >= 200 && v < 300 },
    { id: 'from300to499', test: (v) => v >= 300 && v < 500 },
    { id: 'over500', test: (v) => v >= 500 },
  ];

  const priceBrackets: AirbnbPriceBracketStat[] = bracketDefs.map(({ id, test }) => {
    const matching = pricedPts.filter((p) => test(p.priceEur as number));
    const histCount = matching.filter((p) => historicZoneIds.has(p.zoneId)).length;
    return {
      id,
      count: matching.length,
      sharePct: Math.round((matching.length / pricedTotal) * 1000) / 10,
      historicCentreCount: histCount,
      otherAreasCount: matching.length - histCount,
    };
  });

  const hostDefs: Array<{
    id: AirbnbHostBracketStat['id'];
    test: (n: number) => boolean;
  }> = [
    { id: 'single', test: (n) => n <= 1 },
    { id: 'small_2_4', test: (n) => n >= 2 && n <= 4 },
    { id: 'medium_5_19', test: (n) => n >= 5 && n <= 19 },
    { id: 'large_20_plus', test: (n) => n >= 20 },
  ];

  const hostBrackets: AirbnbHostBracketStat[] = hostDefs.map(({ id, test }) => {
    const sub = pts.filter((p) => test(p.hostListingsCount));
    const prices = sub.map((p) => p.priceEur).filter((v): v is number => v !== null && v > 0);
    const entireCount = sub.filter((p) => p.roomType === 'entire_home_apt').length;
    return {
      id,
      count: sub.length,
      sharePct: Math.round((sub.length / total) * 1000) / 10,
      meanPriceEur: calcMean(prices),
      medianPriceEur: calcMedian(prices),
      entireHomePct: sub.length > 0 ? Math.round((entireCount / sub.length) * 1000) / 10 : 0,
    };
  });

  const maxHostPortfolioSize = pts.reduce((max, p) => Math.max(max, p.hostListingsCount), 0);

  const availDefs: Array<{
    id: AirbnbAvailabilityBracketStat['id'];
    test: (d: number) => boolean;
  }> = [
    { id: 'zero', test: (d) => d === 0 },
    { id: 'occasional_1_90', test: (d) => d >= 1 && d <= 90 },
    { id: 'seasonal_91_180', test: (d) => d >= 91 && d <= 180 },
    { id: 'yearRound_181_365', test: (d) => d >= 181 },
  ];

  const availabilityBrackets: AirbnbAvailabilityBracketStat[] = availDefs.map(({ id, test }) => {
    const sub = pts.filter((p) => test(p.availabilityDays));
    return {
      id,
      count: sub.length,
      sharePct: Math.round((sub.length / total) * 1000) / 10,
    };
  });

  const totalReviewsLtm = pts.reduce((s, p) => s + p.reviewsLtm, 0);
  const avgReviewsPerListingLtm = Math.round((totalReviewsLtm / total) * 10) / 10;

  const zoneDetails: Record<string, AirbnbZoneDetailedPrice> = {};
  for (const z of AIRBNB_ZONES) {
    const zPts = pts.filter((p) => p.zoneId === z.id);
    const zPrices = zPts
      .map((p) => p.priceEur)
      .filter((v): v is number => v !== null && v > 0)
      .sort((a, b) => a - b);
    const entirePrices = zPts
      .filter((p) => p.roomType === 'entire_home_apt' && p.priceEur !== null && p.priceEur > 0)
      .map((p) => p.priceEur as number);
    const privatePrices = zPts
      .filter((p) => p.roomType === 'private_room' && p.priceEur !== null && p.priceEur > 0)
      .map((p) => p.priceEur as number);
    const zRev =
      zPts.length > 0
        ? Math.round((zPts.reduce((s, p) => s + p.reviewsLtm, 0) / zPts.length) * 10) / 10
        : 0;

    zoneDetails[z.id] = {
      zoneId: z.id,
      pricedCount: zPrices.length,
      entireMeanEur: calcMean(entirePrices),
      entireMedianEur: calcMedian(entirePrices),
      privateMeanEur: calcMean(privatePrices),
      privateMedianEur: calcMedian(privatePrices),
      p25Eur: calcPercentile(zPrices, 0.25),
      p75Eur: calcPercentile(zPrices, 0.75),
      avgReviewsLtm: zRev,
    };
  }

  const cells = AIRBNB_DATA.cells;
  const highDensityCells10Plus = cells.filter((c) => c[2] >= 10).length;
  const extremeDensityCells20Plus = cells.filter((c) => c[2] >= 20).length;
  const maxListingsInSingleCell = cells.reduce((m, c) => Math.max(m, c[2]), 0);

  cachedDetailedStats = {
    pricedListingsCount: allPrices.length,
    p10PriceEur: calcPercentile(allPrices, 0.1),
    p25PriceEur: calcPercentile(allPrices, 0.25),
    p75PriceEur: calcPercentile(allPrices, 0.75),
    p90PriceEur: calcPercentile(allPrices, 0.9),
    historicvsMainlandPriceRatio,
    byRoomType,
    priceBrackets,
    hostBrackets,
    maxHostPortfolioSize,
    availabilityBrackets,
    totalReviewsLtm,
    avgReviewsPerListingLtm,
    zoneDetails,
    gridStats: {
      totalCells: cells.length,
      highDensityCells10Plus,
      extremeDensityCells20Plus,
      maxListingsInSingleCell,
    },
  };

  return cachedDetailedStats;
}

