import type { PasserellaItem } from './types';

/** Quota più bassa del piano (T1.1 F, Basilica): sotto questo livello nessun percorso è previsto */
export const PASSERELLE_MIN_THRESHOLD_CM = 80;

/**
 * true se, secondo il piano, il percorso è previsto al livello di marea indicato.
 * Il Comune non pubblica lo stato di montaggio in tempo reale: è una deduzione dalla quota.
 */
export function isPasserellaExpected(p: PasserellaItem, tideCm: number | null | undefined): boolean {
  return tideCm != null && tideCm >= p.activationThresholdCm;
}

/** Percorsi previsti a un livello di marea (null/undefined: nessuno) */
export function expectedPasserelle(routes: PasserellaItem[], tideCm: number | null | undefined): PasserellaItem[] {
  return routes.filter((p) => isPasserellaExpected(p, tideCm));
}
