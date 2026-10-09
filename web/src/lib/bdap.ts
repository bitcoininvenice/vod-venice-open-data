/**
 * Opere pubbliche del Comune di Venezia dal Monitoraggio Opere Pubbliche (MOP) della BDAP
 * (Ragioneria Generale dello Stato, CC BY). Dati generati da pipeline/import_bdap_opere.py.
 */

export type BdapPhase = 'planned' | 'design' | 'execution' | 'completed';

export const BDAP_FUNDING_KEYS = ['state', 'eu', 'local', 'private', 'other', 'toFind'] as const;
export type BdapFundingKey = (typeof BDAP_FUNDING_KEYS)[number];

export interface BdapProject {
  cup: string;
  object: string;
  place: string | null;
  action: string | null;
  phase: BdapPhase;
  /** stato del CUP: "attivo" o "chiuso" */
  cupStatus: string;
  sector: string | null;
  subsector: string | null;
  category: string | null;
  type: string | null;
  designStart: string | null;
  executionStartPlanned: string | null;
  executionStart: string | null;
  executionEndPlanned: string | null;
  executionEnd: string | null;
  /** costo lavori + somme a disposizione previsti */
  costPlannedEur: number;
  worksCostPlannedEur: number;
  funding: Record<BdapFundingKey, number>;
  savingsEur: number;
  /** lavori iniziati e non finiti */
  inProgress: boolean;
  /** presente anche nell'Elenco Annuale dei Lavori del Comune */
  inElenco: boolean;
  lat: number | null;
  lon: number | null;
  /** ricerca usata per la posizione approssimata */
  geocodedFrom: string | null;
  /** data di osservazione del dataset (aggiunta dalle API) */
  observedAt?: string | null;
}

export interface BdapSummary {
  projects: number;
  byPhase: Record<BdapPhase, number>;
  openProjects: number;
  openCostEur: number;
  openBySector: { sector: string; count: number; costEur: number }[];
  openFundingEur: Record<BdapFundingKey, number>;
}

export interface BdapDataset {
  generatedAt: string;
  source: string;
  sourceUrl: string;
  license: string;
  observedAt: string | null;
  titolare: string;
  geocoding: string;
  summary: BdapSummary;
  located: number;
  projects: BdapProject[];
}

/** Opera con posizione sulla mappa. */
export type LocatedBdapProject = BdapProject & { lat: number; lon: number };

export const isLocatedBdap = (p: BdapProject): p is LocatedBdapProject => p.lat !== null && p.lon !== null;

/** Somma dei finanziamenti dichiarati. */
export function fundingTotal(f: Record<BdapFundingKey, number>): number {
  return BDAP_FUNDING_KEYS.reduce((n, k) => n + (f[k] || 0), 0);
}

/** Avanzamento temporale dei lavori (0-1) tra inizio effettivo e fine prevista; null se mancano le date. */
export function executionProgress(p: Pick<BdapProject, 'executionStart' | 'executionEndPlanned'>, now: Date = new Date()): number | null {
  if (!p.executionStart || !p.executionEndPlanned) return null;
  const a = Date.parse(p.executionStart);
  const b = Date.parse(p.executionEndPlanned);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return null;
  return Math.min(1, Math.max(0, (now.getTime() - a) / (b - a)));
}

/** Vero se la fine prevista dei lavori è già passata e non risulta conclusa. */
export function isOverdue(p: Pick<BdapProject, 'executionEnd' | 'executionEndPlanned' | 'phase'>, now: Date = new Date()): boolean {
  return p.phase === 'execution' && !p.executionEnd && !!p.executionEndPlanned && Date.parse(p.executionEndPlanned) < now.getTime();
}
