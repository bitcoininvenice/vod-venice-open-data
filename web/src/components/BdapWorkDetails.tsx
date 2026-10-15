'use client';

import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { BDAP_FUNDING_KEYS, executionProgress, fundingTotal, isOverdue, type BdapFundingKey, type BdapProject } from '@/lib/bdap';
import { KeyValues, MoreDetails } from '@/components/ui/InfoPanel';
import { PROVIDERS } from '@/lib/provenance/providers';

const BDAP_URL = PROVIDERS.bdap.url;

export const FUNDING_COLOR: Record<BdapFundingKey, string> = {
  state: '#3b82f6',
  eu: '#facc15',
  local: '#10b981',
  private: '#a855f7',
  other: '#94a3b8',
  toFind: '#ef4444',
};

const PHASE_CLASS: Record<BdapProject['phase'], string> = {
  planned: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  design: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  execution: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
  completed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
};

const formatDate = (iso: string | null, locale: string) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }) : null;

/**
 * Dati del Monitoraggio Opere Pubbliche (BDAP) di un'opera: fase, date, costo, finanziamenti.
 * Usato nella scheda del layer "Opere in corso" e, per CUP, nella scheda delle opere dell'Elenco Annuale.
 */
export const BdapWorkDetails: React.FC<{ project: BdapProject; showPlace?: boolean }> = ({ project: p, showPlace = true }) => {
  const { t, language } = useTranslation();
  const b = (key: string, params?: Record<string, string | number>) => t(`ui.bdap.${key}`, params);
  const locale = language === 'it' ? 'it-IT' : 'en-GB';
  const eur = (v: number) => `€ ${Math.round(v).toLocaleString(locale)}`;
  const progress = executionProgress(p);
  const overdue = isOverdue(p);
  const total = fundingTotal(p.funding);

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono uppercase ${PHASE_CLASS[p.phase]}`}>{b(`phase_${p.phase}`)}</span>
        {p.sector && <span className="text-[11px] text-[var(--ink-3)]">{p.sector}</span>}
      </div>

      {overdue && (
        <p className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />
          {b('overdue', { date: formatDate(p.executionEndPlanned, locale) ?? '' })}
        </p>
      )}

      <KeyValues
        items={[
          [b('costPlanned'), eur(p.costPlannedEur), 'text-orange-300'],
          [b('executionStart'), formatDate(p.executionStart, locale)],
          [b('executionEndPlanned'), formatDate(p.executionEndPlanned, locale)],
          [b('executionEnd'), formatDate(p.executionEnd, locale)],
        ]}
      />

      {progress !== null && p.phase === 'execution' && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[10px] font-mono text-[var(--ink-3)]">
            <span>{b('timeElapsed')}</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--rule)] overflow-hidden">
            <div className={`h-full ${overdue ? 'bg-rose-400' : 'bg-orange-400'}`} style={{ width: `${progress * 100}%` }} />
          </div>
          <span className="text-[10px] text-[var(--ink-3)]">{b('timeElapsedNote')}</span>
        </div>
      )}

      {total > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase font-mono text-[var(--ink-3)]">{b('funding')}</span>
          <div className="flex h-2 rounded-full overflow-hidden bg-[var(--rule)]" role="img" aria-label={b('funding')}>
            {BDAP_FUNDING_KEYS.filter((k) => p.funding[k] > 0).map((k) => (
              <div key={k} style={{ width: `${(p.funding[k] / total) * 100}%`, background: FUNDING_COLOR[k] }} />
            ))}
          </div>
          <ul className="flex flex-col gap-0.5 text-[11px]">
            {BDAP_FUNDING_KEYS.filter((k) => p.funding[k] > 0).map((k) => (
              <li key={k} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[var(--ink-2)]">
                  <span className="w-2 h-2 rounded-sm" style={{ background: FUNDING_COLOR[k] }} />
                  {b(`funding_${k}`)}
                </span>
                <span className="font-mono text-[var(--ink)]">{eur(p.funding[k])}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <MoreDetails>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
          {(
            [
              ['CUP', p.cup],
              [b('action'), p.action],
              [b('place'), showPlace ? p.place : null],
              [b('subsector'), p.subsector],
              [b('category'), p.category],
              [b('type'), p.type],
              [b('designStart'), formatDate(p.designStart, locale)],
              [b('executionStartPlanned'), formatDate(p.executionStartPlanned, locale)],
              [b('worksCost'), p.worksCostPlannedEur ? eur(p.worksCostPlannedEur) : null],
              [b('savings'), p.savingsEur ? eur(p.savingsEur) : null],
              [b('cupStatus'), p.cupStatus],
            ] as Array<[string, string | null]>
          )
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <React.Fragment key={k}>
                <dt className="text-[var(--ink-3)]">{k}</dt>
                <dd className={`text-[var(--ink)] break-words ${k === 'CUP' ? 'font-mono' : ''}`}>{v}</dd>
              </React.Fragment>
            ))}
        </dl>
      </MoreDetails>

      <a href={BDAP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] text-[var(--ink-3)] hover:text-cyan-400 self-start">
        {p.observedAt ? b('sourceWithDate', { date: formatDate(p.observedAt, locale) ?? '' }) : b('source')}
        <ExternalLink className="w-3 h-3" aria-hidden />
      </a>
    </div>
  );
};
