/**
 * Strutture ricettive registrate nel Comune di Venezia (GeoIDS del Comune, imposta di soggiorno), da
 * pipeline/import_geoids.py. Le attività d'impresa (alberghi, campeggi, agriturismi…) sono punti; strutture
 * complementari e locazioni turistiche, spesso case di privati, solo conteggi su celle da ~100 m e per zona.
 */
export type StayKind = 'hotel' | 'openAir' | 'agritourism' | 'other' | 'complementary' | 'touristRental';
export const BUSINESS_STAY_KINDS = ['hotel', 'openAir', 'agritourism', 'other'] as const;
export const PRIVATE_STAY_KINDS = ['complementary', 'touristRental'] as const;

export interface RegisteredBusiness {
  lon: number;
  lat: number;
  kind: (typeof BUSINESS_STAY_KINDS)[number];
  /** tipologia del Comune (es. «ALBERGHI-ALBERGHI DIFFUSI») */
  category: string | null;
  name: string | null;
  /** ragione sociale, solo se è una società o un ente */
  company: string | null;
  /** stelle o leoni */
  classification: string | null;
  address: string | null;
  rooms: number;
  beds: number;
  municipality: string;
}

export interface RegisteredStayZone {
  municipality: string;
  /** zona dell'imposta di soggiorno */
  taxZone: string | null;
  taxReductionPct: number;
  byKind: Partial<Record<StayKind, number>>;
  beds: Partial<Record<StayKind, number>>;
  rooms: Partial<Record<StayKind, number>>;
}

export interface RegisteredStaysData {
  generatedAt: string;
  extractedAt: string;
  source: string;
  sourceUrl: string;
  license: string;
  attribution: string;
  note: string;
  total: number;
  byKind: Partial<Record<StayKind, number>>;
  bedsByKind: Partial<Record<StayKind, number>>;
  zones: RegisteredStayZone[];
  origin: [number, number];
  cellDeg: [number, number];
  /** [i, j, strutture, letti, stanze] di strutture complementari e locazioni turistiche */
  privateCells: [number, number, number, number, number][];
  businesses: RegisteredBusiness[];
}

export const STAY_COLORS: Record<(typeof BUSINESS_STAY_KINDS)[number], string> = {
  hotel: '#e11d48',
  openAir: '#16a34a',
  agritourism: '#ca8a04',
  other: '#7c3aed',
};

/** Riquadro di una cella della griglia */
export function stayCellBounds(ds: Pick<RegisteredStaysData, 'origin' | 'cellDeg'>, i: number, j: number) {
  const lon0 = ds.origin[0] + i * ds.cellDeg[0];
  const lat0 = ds.origin[1] + j * ds.cellDeg[1];
  return { lon0, lat0, lon1: lon0 + ds.cellDeg[0], lat1: lat0 + ds.cellDeg[1] };
}

/** Somma per tipo: strutture e letti, per le metriche */
export function staysTotals(ds: Pick<RegisteredStaysData, 'byKind' | 'bedsByKind'>) {
  const sum = (r: Partial<Record<StayKind, number>>, kinds: readonly StayKind[]) => kinds.reduce((a, k) => a + (r[k] ?? 0), 0);
  return {
    businesses: sum(ds.byKind, BUSINESS_STAY_KINDS),
    businessBeds: sum(ds.bedsByKind, BUSINESS_STAY_KINDS),
    privateStays: sum(ds.byKind, PRIVATE_STAY_KINDS),
    privateBeds: sum(ds.bedsByKind, PRIVATE_STAY_KINDS),
  };
}
