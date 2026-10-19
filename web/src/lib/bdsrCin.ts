/**
 * Banca Dati Strutture Ricettive (BDSR) del Ministero del Turismo: conteggi per comune e categoria ISTAT dal CSV
 * «BDSR in numeri» (pipeline/import_bdsr_cin.py). Il sito non dichiara una licenza: art. 52 c. 2 del CAD,
 * riuso citando la fonte. Tutti i numeri, regione e province comprese, sono calcolati dal CSV.
 */
import rawBdsr from '@/data/bdsr-cin-veneto.json';

export interface BdsrProvinceSummary {
  code: string;
  name: string;
  totalStructures: number;
  cinVerified: number;
  cinNotVerified: number;
  pctCinVerified: number;
}

export interface BdsrSubCategory {
  subCode: string;
  categoryCode: string;
  categoryName: string;
  description: string;
  total: number;
  cinVerified: number;
  cinMissing: number;
  pctCinVerified: number;
}

export interface BdsrMacroCategory {
  code: 'A' | 'B' | 'C' | string;
  name: string;
  total: number;
  cinVerified: number;
  cinMissing: number;
  pctCinVerified: number;
  categoriesList: BdsrSubCategory[];
}

export interface BdsrMetropolitanMunicipality {
  istatCode: string;
  name: string;
  totalStructures: number;
  cinVerified: number;
  cinMissing: number;
  hotels: number;
  extraHotel: number;
  privateRentals: number;
  pctCinVerified: number;
}

export interface BdsrDataset {
  metadata: {
    source: string;
    sourceUrl: string;
    snapshotDate: string;
    license: string;
    attribution: string;
  };
  venetoRegion: {
    totalStructures: number;
    cinVerified: number;
    cinNotVerified: number;
    pctCinVerified: number;
    provinces: BdsrProvinceSummary[];
  };
  veneziaMunicipality: {
    istatCode: string;
    name: string;
    totalStructures: number;
    cinVerified: number;
    cinInVerification: number;
    cinMissing: number;
    pctCinVerified: number;
    totalTouristRentals: number;
    entrepreneurialRentals: number;
    privateNonEntrepreneurialRentals: number;
    totalHotels: number;
    macroCategories: BdsrMacroCategory[];
  };
  metropolitanMunicipalities: BdsrMetropolitanMunicipality[];
}

export const BDSR_DATA = rawBdsr as unknown as BdsrDataset;

/** Restituisce i dati BDSR ufficiali completi per Venezia e il Veneto. */
export function getBdsrData(): BdsrDataset {
  return BDSR_DATA;
}

/** Confronto tra registro anagrafico BDSR (Ministero) e offerta di mercato Inside Airbnb. */
export function getBdsrMarketComparison(airbnbListingsCount: number) {
  const bdsr = BDSR_DATA.veneziaMunicipality;
  const bdsrRentals = bdsr.totalTouristRentals;
  const delta = bdsrRentals - airbnbListingsCount;
  const marketCoveragePct = Math.round((airbnbListingsCount / (bdsrRentals || 1)) * 1000) / 10;

  return {
    bdsrTotalStructures: bdsr.totalStructures,
    bdsrCinVerified: bdsr.cinVerified,
    bdsrPctVerified: bdsr.pctCinVerified,
    bdsrTouristRentals: bdsrRentals,
    bdsrEntrepreneurialRentals: bdsr.entrepreneurialRentals,
    bdsrPrivateRentals: bdsr.privateNonEntrepreneurialRentals,
    airbnbListingsCount,
    deltaListingsVsRegistered: delta,
    marketCoveragePct,
  };
}
