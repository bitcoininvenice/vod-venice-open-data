/**
 * VOD - Venice Open Data
 * Modulo Statistiche Rifiuti Urbani e Raccolta Differenziata
 * Fonte: ARPA Veneto - Osservatorio Regionale Rifiuti (D.M. 26/05/2016, CC BY 4.0)
 * Gestore servizio: Veritas SpA
 */

import wasteRaw from '@/data/arpav-waste.json';

export interface WasteMetadata {
  source: string;
  sourceUrl: string;
  regulation: string;
  license: string;
  updatedAt: string;
  referenceYear: number;
  wasteOperator: string;
}

export interface WasteFractions {
  organicForsu: number;
  paperCardboard: number;
  multimaterial: number;
  greenWaste: number;
  bulkyWaste: number;
  streetSweeping: number;
  raee: number;
  textiles: number;
  glass: number;
  hazardousHousehold: number;
  otherRecoverable: number;
  residualDry: number;
}

export interface WasteMunicipalData {
  municipality: string;
  province: string;
  year: number;
  population: number;
  domesticHouseholds: number;
  totalWasteKg: number;
  wastePerCapitaKg: number;
  separateCollectionRate: number;
  residualWasteKg: number;
  recoveredWasteKg: number;
  fractionsKg: WasteFractions;
}

export interface WasteTimeSeriesYear {
  year: number;
  population: number;
  totalWasteKg: number;
  wastePerCapitaKg: number;
  separateRate: number;
}

export interface WasteBenchmark {
  municipality: string;
  population: number;
  totalWasteKg: number;
  wastePerCapitaKg: number;
  separateRate: number;
  zoneType: string;
  inLagoon: boolean;
}

export interface WasteMetropolitanTotal {
  territory: string;
  population: number;
  totalWasteKg: number;
  wastePerCapitaKg: number;
  separateRate: number;
  regionalVenetoAverageSeparateRate: number;
}

export interface WasteDataset {
  metadata: WasteMetadata;
  venice2024: WasteMunicipalData;
  timeSeries: WasteTimeSeriesYear[];
  benchmarks: WasteBenchmark[];
  metropolitanTotal: WasteMetropolitanTotal;
}

export const WASTE_DATA: WasteDataset = wasteRaw as WasteDataset;

export function getVeniceWaste2024(): WasteMunicipalData {
  return WASTE_DATA.venice2024;
}

export function getWasteTimeSeries(): WasteTimeSeriesYear[] {
  return WASTE_DATA.timeSeries;
}

export function getWasteBenchmarks(): WasteBenchmark[] {
  return WASTE_DATA.benchmarks;
}

export function getWasteMetropolitanTotal(): WasteMetropolitanTotal {
  return WASTE_DATA.metropolitanTotal;
}
