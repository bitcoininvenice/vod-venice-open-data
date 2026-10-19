'use client';

import React, { useMemo } from 'react';
import { Building2, ShieldCheck, AlertCircle, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { BDSR_DATA, getBdsrMarketComparison } from '@/lib/bdsrCin';
import { AIRBNB_DATA } from '@/lib/airbnb';

export const BdsrCinMetrics: React.FC<{ badge?: React.ReactNode }> = ({ badge }) => {
  const { t, language } = useTranslation();
  const b = (key: string, params?: Record<string, string | number>) =>
    t(`ui.bdsrMetrics.${key}`, params);
  const locale = language === 'it' ? 'it-IT' : 'en-GB';

  const int = (n: number | null | undefined) =>
    n === null || n === undefined ? '–' : n.toLocaleString(locale);
  const pct = (n: number | null | undefined, digits = 1) =>
    n === null || n === undefined
      ? '–'
      : `${n.toLocaleString(locale, { maximumFractionDigits: digits })}%`;

  const ve = BDSR_DATA.veneziaMunicipality;
  const comparison = useMemo(
    () => getBdsrMarketComparison(AIRBNB_DATA.totalListings),
    []
  );

  return (
    <div
      className="p-5 rounded-2xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-5"
      data-testid="bdsr-cin-metrics"
    >
      {/* Header con titolo e link ufficiale al portale BDSR */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[var(--ink)] flex items-center gap-2 flex-wrap">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{b('title')}</span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              BDSR {BDSR_DATA.metadata.snapshotDate}
            </span>
            {badge}
          </h3>
          <p className="text-xs text-[var(--ink-3)] mt-0.5 leading-relaxed">
            {b('subtitle', { date: BDSR_DATA.metadata.snapshotDate })}
          </p>
        </div>
        <a
          href={BDSR_DATA.metadata.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>{b('openBdsrPortal')}</span>
        </a>
      </div>

      {/* 3 KPI di Conformità Statale */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border bg-emerald-500/10 border-emerald-500/30 flex flex-col justify-between gap-1 text-emerald-400">
          <span className="text-[10px] font-mono uppercase text-[var(--ink-2)] font-semibold flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            {b('kpiTotalStructures')}
          </span>
          <strong className="text-2xl font-mono font-extrabold tabular text-[var(--ink)]">
            {int(ve.totalStructures)}
          </strong>
          <span className="text-[11px] text-[var(--ink-3)] leading-snug">
            {b('kpiTotalStructuresNote', {
              rentals: int(ve.totalTouristRentals),
              hotels: int(ve.totalHotels),
            })}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border bg-cyan-500/10 border-cyan-500/30 flex flex-col justify-between gap-1 text-cyan-400">
          <span className="text-[10px] font-mono uppercase text-[var(--ink-2)] font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {b('kpiCinVerified')}
          </span>
          <strong className="text-2xl font-mono font-extrabold tabular text-[var(--ink)]">
            {pct(ve.pctCinVerified)}
          </strong>
          <span className="text-[11px] text-[var(--ink-3)] leading-snug">
            {b('kpiCinVerifiedNote', { count: int(ve.cinVerified) })}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border bg-rose-500/10 border-rose-500/30 flex flex-col justify-between gap-1 text-rose-400">
          <span className="text-[10px] font-mono uppercase text-[var(--ink-2)] font-semibold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {b('kpiCinMissing')}
          </span>
          <strong className="text-2xl font-mono font-extrabold tabular text-[var(--ink)]">
            {int(ve.cinMissing)}
          </strong>
          <span className="text-[11px] text-[var(--ink-3)] leading-snug">
            {b('kpiCinMissingNote', {
              count: int(ve.cinMissing),
              pct: (100 - ve.pctCinVerified).toFixed(1),
            })}
          </span>
        </div>
      </div>

      {/* Box di confronto: Anagrafe BDSR vs Mercato attivo Inside Airbnb */}
      <div className="p-3.5 rounded-xl bg-[var(--ground)]/80 border border-[var(--rule)] flex flex-col gap-1.5">
        <span className="text-xs font-mono font-bold text-amber-400 uppercase">
          {b('marketComparisonTitle')}
        </span>
        <p className="text-xs text-[var(--ink-2)] leading-relaxed">
          {b('marketComparisonNote', { pct: comparison.marketCoveragePct })}
        </p>
      </div>

      {/* Tabella 1: Ripartizione ufficiale per Macrocategoria e Categoria ISTAT */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-mono text-[var(--ink-3)] uppercase font-semibold">
          {b('categoryTableTitle')}
        </span>
        <div className="overflow-x-auto rounded-xl border border-[var(--rule)]">
          <table className="w-full text-xs font-mono min-w-[680px]">
            <thead className="bg-[var(--rule)]/40 text-[var(--ink-3)] text-[10px] uppercase">
              <tr>
                <th className="text-left p-2">{b('colMacro')}</th>
                <th className="text-center p-2">{b('colCode')}</th>
                <th className="text-right p-2">{b('colTotal')}</th>
                <th className="text-right p-2">{b('colCinVerified')}</th>
                <th className="text-right p-2">{b('colCinMissing')}</th>
                <th className="text-right p-2">{b('colPctCin')}</th>
              </tr>
            </thead>
            <tbody>
              {ve.macroCategories.map((m) => (
                <React.Fragment key={m.code}>
                  <tr className="border-t-2 border-[var(--rule)] bg-[var(--rule)]/20 font-bold">
                    <td className="p-2 font-sans text-[var(--ink)]">
                      {b(`macro_${m.code}`)}
                    </td>
                    <td className="p-2 text-center text-cyan-400">{m.code}</td>
                    <td className="p-2 text-right text-[var(--ink)]">{int(m.total)}</td>
                    <td className="p-2 text-right text-emerald-400">{int(m.cinVerified)}</td>
                    <td className="p-2 text-right text-rose-400">{int(m.cinMissing)}</td>
                    <td className="p-2 text-right text-cyan-400">{pct(m.pctCinVerified)}</td>
                  </tr>
                  {m.categoriesList.map((sub) => (
                    <tr
                      key={sub.subCode}
                      className="border-t border-[var(--rule)] hover:bg-[var(--rule)]/10 text-[11px]"
                    >
                      <td className="p-2 pl-6 font-sans text-[var(--ink-2)]">
                        {sub.categoryName} ({sub.description.slice(0, 75)}...)
                      </td>
                      <td className="p-2 text-center text-[var(--ink-3)]">{sub.subCode}</td>
                      <td className="p-2 text-right text-[var(--ink)]">{int(sub.total)}</td>
                      <td className="p-2 text-right text-[var(--ink-2)]">{int(sub.cinVerified)}</td>
                      <td className="p-2 text-right text-[var(--ink-3)]">{int(sub.cinMissing)}</td>
                      <td className="p-2 text-right text-emerald-400">{pct(sub.pctCinVerified)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabella 2: Confronto con gli altri poli turistici della Città Metropolitana */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-mono text-[var(--ink-3)] uppercase font-semibold">
          {b('comparisonTitle')}
        </span>
        <p className="text-[11px] text-[var(--ink-3)]">{b('comparisonNote')}</p>
        <div className="overflow-x-auto rounded-xl border border-[var(--rule)]">
          <table className="w-full text-xs font-mono min-w-[700px]">
            <thead className="bg-[var(--rule)]/40 text-[var(--ink-3)] text-[10px] uppercase">
              <tr>
                <th className="text-left p-2">{b('colMunicipality')}</th>
                <th className="text-right p-2">{b('colTotal')}</th>
                <th className="text-right p-2">{b('colCinVerified')}</th>
                <th className="text-right p-2">{b('colPctCin')}</th>
                <th className="text-right p-2">{b('colHotels')}</th>
                <th className="text-right p-2">{b('colExtraHotel')}</th>
                <th className="text-right p-2">{b('colPrivate')}</th>
              </tr>
            </thead>
            <tbody>
              {BDSR_DATA.metropolitanMunicipalities.map((c) => {
                const isVenice = c.name === 'Venezia';
                return (
                  <tr
                    key={c.istatCode}
                    className={`border-t border-[var(--rule)] ${
                      isVenice
                        ? 'bg-emerald-500/10 font-bold'
                        : 'hover:bg-[var(--rule)]/15'
                    }`}
                  >
                    <td className="p-2 font-sans font-medium text-[var(--ink)]">
                      {c.name}
                    </td>
                    <td className="p-2 text-right text-[var(--ink)]">{int(c.totalStructures)}</td>
                    <td className="p-2 text-right text-emerald-400">{int(c.cinVerified)}</td>
                    <td className="p-2 text-right font-bold text-cyan-400">
                      {pct(c.pctCinVerified)}
                    </td>
                    <td className="p-2 text-right text-[var(--ink-2)]">{int(c.hotels)}</td>
                    <td className="p-2 text-right text-[var(--ink-2)]">{int(c.extraHotel)}</td>
                    <td className="p-2 text-right text-[var(--ink-2)]">{int(c.privateRentals)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
