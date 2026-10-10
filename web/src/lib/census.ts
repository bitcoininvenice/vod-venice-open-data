/**
 * Residenti, famiglie e abitazioni del Comune di Venezia dal Censimento permanente ISTAT 2021
 * (pipeline/import_istat_census.py): Comune, municipalità, sestieri del centro storico e isole.
 */
import census from '@/data/istat-census-venezia.json';

export interface CensusArea {
  name?: string;
  population: number;
  males: number;
  females: number;
  foreigners: number;
  families: number;
  familiesOnePerson: number;
  dwellingsTotal: number;
  dwellingsOccupied: number;
  /** ISTAT A3: abitazioni vuote e abitazioni occupate solo da persone non residenti */
  dwellingsEmptyOrNonResident: number;
  residentialBuildings: number;
  sections: number;
  pctUnder15: number | null;
  pct65plus: number | null;
  pct75plus: number | null;
  oldAgeIndex: number | null;
  pctForeigners: number | null;
  avgFamilySize: number | null;
  pctOnePersonFamilies: number | null;
  pctTertiary: number | null;
  employmentRate15_64: number | null;
  pctDwellingsEmptyOrNonResident: number | null;
  dwellingsPerResident: number | null;
  areaHa?: number;
  densityPerKm2?: number;
}

/** Zona mappata a parte che appartiene a un sestiere (es. Giudecca in Dorsoduro). */
export interface CensusPart {
  name: string;
  population: number;
  families: number;
  dwellingsTotal: number;
  pctDwellingsEmptyOrNonResident: number | null;
}

export interface CensusData {
  generatedAt: string;
  source: string;
  sourceUrl: string;
  license: string;
  attribution: string;
  referenceDate: string;
  method: string;
  city: CensusArea;
  municipalities: (CensusArea & { id: number; name: string })[];
  historicCentre: CensusArea;
  /** sestieri con le zone che ne fanno parte (es. Giudecca e Sacca Fisola per Dorsoduro) */
  sestieri: (CensusArea & { name: string; parts: CensusPart[] })[];
  islands: (CensusArea & { name: string })[];
  unassignedInsular: CensusArea;
}

export const CENSUS = census as CensusData;

/** Sestiere con la quota più alta di abitazioni vuote o abitate solo da non residenti. */
export function mostEmptiedSestiere(data: CensusData = CENSUS) {
  return data.sestieri.reduce((a, b) => ((b.pctDwellingsEmptyOrNonResident ?? 0) > (a.pctDwellingsEmptyOrNonResident ?? 0) ? b : a));
}

/** Quota del centro storico sulla popolazione del Comune (%). */
export function historicCentreShare(data: CensusData = CENSUS): number {
  return Math.round((1000 * data.historicCentre.population) / data.city.population) / 10;
}
