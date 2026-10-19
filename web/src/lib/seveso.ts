/**
 * VOD - Venice Open Data
 * Modulo Impianti a Rischio di Incidente Rilevante (RIR / Direttiva Seveso III, D.Lgs. 105/2015)
 * Fonte: ARPA Veneto - Open Data Sezione Industria / Rischi Antropogenici (CC BY 4.0)
 */

import sevesoRaw from '@/data/arpav-seveso.json';

export interface SevesoEstablishment {
  id: string;
  name: string;
  municipality: string;
  province: string;
  locality: string;
  address: string;
  lat: number;
  lon: number;
  /** Soglia Superiore (SS) o Soglia Inferiore (SI) */
  threshold: 'SS' | 'SI';
  activityCode: string;
  activityDescription: string;
  inLagoonBasin: boolean;
  safetyMeasures: string;
}

export interface SevesoMetadata {
  source: string;
  sourceUrl: string;
  regulation: string;
  license: string;
  updatedAt: string;
  totalCount: number;
  veniceCount: number;
  upperThresholdCount: number;
  lowerThresholdCount: number;
}

export interface SevesoDataset {
  metadata: SevesoMetadata;
  establishments: SevesoEstablishment[];
}

export const SEVESO_DATA: SevesoDataset = sevesoRaw as SevesoDataset;

export const SEVESO_ESTABLISHMENTS: SevesoEstablishment[] = SEVESO_DATA.establishments;

/**
 * Restituisce gli stabilimenti Seveso III filtrabili per comune o soglia.
 */
export function getSevesoEstablishments(filter?: {
  municipality?: string;
  threshold?: 'SS' | 'SI' | 'all';
  lagoonOnly?: boolean;
}): SevesoEstablishment[] {
  let list = SEVESO_ESTABLISHMENTS;
  if (!filter) return list;

  if (filter.municipality && filter.municipality !== 'all') {
    const q = filter.municipality.toLowerCase();
    list = list.filter((e) => e.municipality.toLowerCase() === q);
  }

  if (filter.threshold && filter.threshold !== 'all') {
    list = list.filter((e) => e.threshold === filter.threshold);
  }

  if (filter.lagoonOnly) {
    list = list.filter((e) => e.inLagoonBasin);
  }

  return list;
}

/**
 * Statistiche aggregate sugli stabilimenti Seveso III dell'area metropolitana.
 */
export function getSevesoSummaryStats() {
  const all = SEVESO_ESTABLISHMENTS;
  const upper = all.filter((e) => e.threshold === 'SS');
  const lower = all.filter((e) => e.threshold === 'SI');
  const venice = all.filter((e) => e.municipality === 'Venezia');
  const portMarghera = venice.filter((e) => e.locality.includes('Porto Marghera'));

  return {
    total: all.length,
    upperThreshold: upper.length,
    lowerThreshold: lower.length,
    veniceTotal: venice.length,
    portMargheraTotal: portMarghera.length,
    lagoonBasinCount: all.filter((e) => e.inLagoonBasin).length,
  };
}
