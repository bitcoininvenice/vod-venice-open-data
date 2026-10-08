import type { MoseGateItem } from '@/lib/types';
import type { Provenance } from '@/lib/provenance';

export type TideTrend = 'IN_AUMENTO' | 'IN_CALO';

export interface TideStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  levelCm: number;
  /** Data/ora della misura come pubblicata dal Comune (ora locale Europe/Rome, "YYYY-MM-DD HH:mm:ss") */
  observedAt: string;
}

export interface TideForecastExtreme {
  /** Ora locale Europe/Rome dell'estremale, "YYYY-MM-DD HH:mm:ss" */
  at: string;
  type: 'max' | 'min';
  levelCm: number;
}

export interface TideForecast {
  /** Data di emissione della previsione CPSM (DATA_PREVISIONE), ora locale Europe/Rome */
  issuedAt: string;
  /** true se l'emissione è più vecchia della soglia di freschezza */
  stale: boolean;
  extremes: TideForecastExtreme[];
}

export type TideCategory = 'NORMALE' | 'SOSTENUTA' | 'MOLTO_SOSTENUTA' | 'ECCEZIONALE';

export interface TideResponse {
  ok: boolean;
  data: {
    /** Punta della Salute, stazione di riferimento per Venezia. null se la fonte non risponde. */
    reference: TideStation | null;
    category: TideCategory | null;
    trend: TideTrend | null;
    stations: TideStation[];
    forecast: TideForecast | null;
    moseGates: MoseGateItem[];
  };
  meta: {
    levels: Provenance;
    forecast: Provenance;
    mose: Provenance;
  };
}
