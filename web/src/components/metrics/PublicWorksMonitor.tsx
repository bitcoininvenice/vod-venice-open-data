'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { BDAP_FUNDING_KEYS, fundingTotal, isOverdue, type BdapPhase, type BdapProject, type BdapSummary } from '@/lib/bdap';
import { FUNDING_COLOR } from '@/components/BdapWorkDetails';

interface Payload {
  data: BdapProject[];
  summary: BdapSummary;
  meta: { observedAt: string | null; sourceUrl: string };
}

const PHASES: BdapPhase[] = ['planned', 'design', 'execution', 'completed'];
const PHASE_BAR: Record<BdapPhase, string> = {
  planned: 'bg-slate-400',
  design: 'bg-sky-400',
  execution: 'bg-orange-400',
  completed: 'bg-emerald-500',
};

/**
 * Opere pubbliche del Comune di Venezia nel Monitoraggio Opere Pubbliche (BDAP):
 * fasi, settori e fonti di finanziamento delle opere non concluse, lavori in corso più costosi.
 */
export const PublicWorksMonitor: React.FC = () => {
  const { t, language } = useTranslation();
  const b = (key: string, params?: Record<string, string | number>) => t(`ui.bdap.${key}`, params);
  const locale = language === 'it' ? 'it-IT' : 'en-GB';
  const [payload, setPayload] = useState<Payload | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch('/api/opere-bdap')
      .then((r) => r.json())
      .then((j) => (j.success ? setPayload(j as Payload) : setFailed(true)))
      .catch(() => setFailed(true));
  }, []);

  if (failed) return <p className="text-xs text-[var(--ink-3)]">{b('unavailable')}</p>;
  if (!payload) return <div className="h-40 rounded-2xl bg-[var(--rule)]/20 animate-pulse" aria-busy="true" />;

  const { summary: s, data, meta } = payload;
  const millions = (v: number) => `${(v / 1e6).toLocaleString(locale, { maximumFractionDigits: 1 })} M€`;
  const fundTotal = fundingTotal(s.openFundingEur);
  const top = [...data].sort((a, c) => c.costPlannedEur - a.costPlannedEur).slice(0, 6);
  const overdueCount = data.filter((p) => isOverdue(p)).length;
  const date = meta.observedAt ? new Date(`${meta.observedAt}T12:00:00`).toLocaleDateString(locale) : null;

  const kpis: Array<[string, string, string]> = [
    [b('kpiProjects'), s.projects.toLocaleString(locale), b('kpiProjectsNote')],
    [b('kpiOpen'), s.openProjects.toLocaleString(locale), b('kpiOpenNote')],
    [b('kpiOpenCost'), millions(s.openCostEur), b('kpiOpenCostNote')],
    [b('kpiExecution'), s.byPhase.execution.toLocaleString(locale), b('kpiExecutionNote', { n: overdueCount })],
  ];

  return (
    <div className="flex flex-col gap-4" data-testid="public-works-monitor">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(([label, value, note]) => (
          <div key={label} className="p-4 rounded-2xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-1">
            <span className="text-[10px] uppercase font-mono text-[var(--ink-3)]">{label}</span>
            <span className="text-xl font-bold font-mono text-[var(--ink)]">{value}</span>
            <span className="text-[11px] text-[var(--ink-3)] leading-snug">{note}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Fasi di tutti i progetti */}
        <div className="p-5 rounded-2xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase font-mono text-[var(--ink-3)]">{b('byPhaseTitle')}</h3>
          <div className="flex h-3 rounded-full overflow-hidden bg-[var(--rule)]" role="img" aria-label={b('byPhaseTitle')}>
            {PHASES.map((ph) => (
              <div key={ph} className={PHASE_BAR[ph]} style={{ width: `${(s.byPhase[ph] / s.projects) * 100}%` }} />
            ))}
          </div>
          <ul className="grid grid-cols-2 gap-1 text-[11px]">
            {PHASES.map((ph) => (
              <li key={ph} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[var(--ink-2)]">
                  <span className={`w-2 h-2 rounded-sm ${PHASE_BAR[ph]}`} />
                  {b(`phase_${ph}`)}
                </span>
                <span className="font-mono text-[var(--ink)]">{s.byPhase[ph].toLocaleString(locale)}</span>
              </li>
            ))}
          </ul>

          <h3 className="text-xs font-bold uppercase font-mono text-[var(--ink-3)] pt-2">{b('fundingOpenTitle')}</h3>
          <div className="flex h-3 rounded-full overflow-hidden bg-[var(--rule)]" role="img" aria-label={b('fundingOpenTitle')}>
            {BDAP_FUNDING_KEYS.filter((k) => s.openFundingEur[k] > 0).map((k) => (
              <div key={k} style={{ width: `${(s.openFundingEur[k] / fundTotal) * 100}%`, background: FUNDING_COLOR[k] }} />
            ))}
          </div>
          <ul className="grid grid-cols-2 gap-1 text-[11px]">
            {BDAP_FUNDING_KEYS.filter((k) => s.openFundingEur[k] > 0).map((k) => (
              <li key={k} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[var(--ink-2)]">
                  <span className="w-2 h-2 rounded-sm" style={{ background: FUNDING_COLOR[k] }} />
                  {b(`funding_${k}`)}
                </span>
                <span className="font-mono text-[var(--ink)]">{millions(s.openFundingEur[k])}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Settori delle opere non concluse */}
        <div className="p-5 rounded-2xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase font-mono text-[var(--ink-3)]">{b('bySectorTitle')}</h3>
          <ul className="flex flex-col gap-2 text-[11px]">
            {s.openBySector.map((sec) => (
              <li key={sec.sector} className="flex flex-col gap-1">
                <div className="flex justify-between gap-2">
                  <span className="text-[var(--ink)]">{sec.sector}</span>
                  <span className="font-mono text-[var(--ink-2)] shrink-0">
                    {b('projectsCount', { n: sec.count })} · {millions(sec.costEur)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--rule)] overflow-hidden">
                  <div className="h-full bg-orange-400" style={{ width: `${(sec.costEur / Math.max(1, s.openBySector[0]?.costEur ?? 1)) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Lavori in corso più costosi */}
      <div className="p-5 rounded-2xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase font-mono text-[var(--ink-3)]">{b('topTitle')}</h3>
        <ul className="flex flex-col divide-y divide-[var(--rule)] text-xs">
          {top.map((p) => (
            <li key={p.cup} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-[var(--ink)]">
                {p.object}
                {p.place && <span className="text-[var(--ink-3)]"> · {p.place}</span>}
              </span>
              <span className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                <span className="text-orange-300">{millions(p.costPlannedEur)}</span>
                {p.executionEndPlanned && (
                  <span className={isOverdue(p) ? 'text-rose-300 flex items-center gap-1' : 'text-[var(--ink-3)]'}>
                    {isOverdue(p) && <AlertTriangle className="w-3 h-3" aria-hidden />}
                    {b('endPlannedShort', { date: new Date(`${p.executionEndPlanned}T12:00:00`).toLocaleDateString(locale, { month: 'short', year: 'numeric' }) })}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
        {b('metricsNote')}{' '}
        <a href={meta.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-cyan-400">
          {date ? b('sourceWithDate', { date }) : b('source')}
          <ExternalLink className="w-3 h-3" aria-hidden />
        </a>
      </p>
    </div>
  );
};
