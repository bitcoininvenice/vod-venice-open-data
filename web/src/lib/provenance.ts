/**
 * Provenienza di un dataset mostrato in piattaforma.
 *
 * - live: misura letta da una fonte esterna a ogni richiesta (con cache breve)
 * - schedule-simulation: posizioni calcolate da orari e percorsi ufficiali (GTFS), non tracciamento reale
 * - static-reference: censimento/anagrafica statica inclusa nel codice, non aggiornata automaticamente
 * - community: mappatura collaborativa non verificata da un ente
 */
export type ProvenanceKind = 'live' | 'schedule-simulation' | 'static-reference' | 'community';

export interface Provenance {
  kind: ProvenanceKind;
  source: string;
  sourceUrl?: string;
  license?: string;
  /** ISO timestamp dell'ultima lettura riuscita dalla fonte (solo per kind = live) */
  fetchedAt?: string;
  /** ISO timestamp della misura riportata dalla fonte, se diversa da fetchedAt */
  observedAt?: string;
  note?: string;
}

export const PROVENANCE_LABEL: Record<ProvenanceKind, { it: string; en: string }> = {
  live: { it: 'Dato live', en: 'Live data' },
  'schedule-simulation': { it: 'Simulato da orario ufficiale', en: 'Simulated from official timetable' },
  'static-reference': { it: 'Censimento statico', en: 'Static reference data' },
  community: { it: 'Mappatura collaborativa', en: 'Community mapping' },
};

export function staticReference(source: string, note?: string, sourceUrl?: string): Provenance {
  return { kind: 'static-reference', source, sourceUrl, note };
}
