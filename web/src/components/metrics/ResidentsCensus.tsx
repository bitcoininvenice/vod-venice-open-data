'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { CENSUS, historicCentreShare, type CensusArea, type CensusPart } from '@/lib/census';
import cruscotto from '@/data/cruscotto-comuni.json';

/** Stima ISTAT più recente della popolazione del Comune (Cruscotto Italia), per confronto con il censimento. */
const LATEST = cruscotto.comuni.find((c) => c.code === '027042')?.kpi.demografia;

/**
 * Residenti, età, famiglie e abitazioni per sestiere, isola e municipalità (Censimento ISTAT 2021).
 * `badge` è l'etichetta di attendibilità della pagina metriche.
 */
export const ResidentsCensus: React.FC<{ badge?: React.ReactNode }> = ({ badge }) => {
  const { t, language } = useTranslation();
  const c = (key: string, params?: Record<string, string | number>) => t(`ui.census.${key}`, params);
  const locale = language === 'it' ? 'it-IT' : 'en-GB';
  const int = (n: number | null | undefined) => (n === null || n === undefined ? '–' : n.toLocaleString(locale));
  const pct = (n: number | null | undefined) => (n === null || n === undefined ? '–' : `${n.toLocaleString(locale, { maximumFractionDigits: 1 })}%`);
  const centre = CENSUS.historicCentre;

  return (
    <div className="p-5 rounded-2xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-4" data-testid="residents-census">
      <div>
        <h3 className="text-base font-bold text-[var(--ink)] flex items-center gap-2 flex-wrap">
          <Users className="w-4 h-4 text-sky-400" />
          {c('title')}
          {badge}
        </h3>
        <p className="text-xs text-[var(--ink-3)] mt-0.5">{c('subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          label={c('kpiCity')}
          value={int(CENSUS.city.population)}
          note={LATEST ? c('kpiCityNote', { n: int(LATEST.popolazione), date: LATEST.riferimento }) : c('censusDate')}
        />
        <Kpi label={c('kpiCentre')} value={int(centre.population)} note={c('kpiCentreNote', { pct: pct(historicCentreShare()) })} />
        <Kpi label={c('kpiOld')} value={pct(centre.pct65plus)} note={c('kpiOldNote', { city: pct(CENSUS.city.pct65plus) })} />
        <Kpi
          label={c('kpiEmpty')}
          value={pct(centre.pctDwellingsEmptyOrNonResident)}
          note={c('kpiEmptyNote', { n: int(centre.dwellingsEmptyOrNonResident), city: pct(CENSUS.city.pctDwellingsEmptyOrNonResident) })}
          accent
        />
      </div>

      <AreaTable title={c('sestieriTitle')} rows={CENSUS.sestieri} total={{ name: c('centreTotal'), ...centre }} c={c} int={int} pct={pct} />
      <AreaTable title={c('islandsTitle')} rows={CENSUS.islands.filter((i) => i.population >= 100)} c={c} int={int} pct={pct} />

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-mono text-[var(--ink-3)] uppercase font-semibold">{c('municipalitiesTitle')}</span>
        <div className="overflow-x-auto rounded-xl border border-[var(--rule)]">
          <table className="w-full text-xs font-mono min-w-[520px]">
            <thead className="bg-[var(--rule)]/40 text-[var(--ink-3)] text-[10px] uppercase">
              <tr>
                <th className="text-left p-2">{c('colArea')}</th>
                <th className="text-right p-2">{c('colResidents')}</th>
                <th className="text-right p-2">{c('colFamilies')}</th>
                <th className="text-right p-2">{c('colDwellings')}</th>
                <th className="text-right p-2">{c('colEmpty')}</th>
              </tr>
            </thead>
            <tbody>
              {CENSUS.municipalities.map((m) => (
                <tr key={m.id} className="border-t border-[var(--rule)]">
                  <td className="p-2 text-[var(--ink)] font-sans">{m.name}</td>
                  <td className="p-2 text-right">{int(m.population)}</td>
                  <td className="p-2 text-right">{int(m.families)}</td>
                  <td className="p-2 text-right">{int(m.dwellingsTotal)}</td>
                  <td className="p-2 text-right">{pct(m.pctDwellingsEmptyOrNonResident)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-[11px] text-[var(--ink-3)] leading-relaxed flex flex-col gap-1 border-t border-[var(--rule)] pt-3">
        <p>{c('methodNote')}</p>
        <p>{c('emptyDefinition')}</p>
        <p>{c('unassigned', { n: int(CENSUS.unassignedInsular.population) })}</p>
        <a href={CENSUS.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-cyan-400 hover:underline">
          {CENSUS.attribution}
        </a>
      </div>
    </div>
  );
};

function Kpi({ label, value, note, accent = false }: { label: string; value: string; note: string; accent?: boolean }) {
  return (
    <div className={`p-3 rounded-xl border flex flex-col gap-0.5 ${accent ? 'bg-rose-500/10 border-rose-500/30' : 'bg-[var(--ground)]/80 border-[var(--rule)]'}`}>
      <span className="text-[10px] font-mono uppercase text-[var(--ink-3)]">{label}</span>
      <strong className={`text-xl font-bold tabular ${accent ? 'text-rose-400' : 'text-[var(--ink)]'}`}>{value}</strong>
      <span className="text-[11px] text-[var(--ink-3)] leading-snug">{note}</span>
    </div>
  );
}

function AreaTable({
  title,
  rows,
  total,
  c,
  int,
  pct,
}: {
  title: string;
  rows: (CensusArea & { name: string; parts?: CensusPart[] })[];
  total?: CensusArea & { name: string };
  c: (key: string, params?: Record<string, string | number>) => string;
  int: (n: number | null | undefined) => string;
  pct: (n: number | null | undefined) => string;
}) {
  const row = (r: CensusArea & { name: string; parts?: CensusPart[] }, strong = false) => (
    <React.Fragment key={r.name}>
    <tr className={`border-t border-[var(--rule)] ${strong ? 'bg-[var(--rule)]/30 font-bold' : ''}`}>
      <td className="p-2 text-[var(--ink)] font-sans">{r.name}</td>
      <td className="p-2 text-right">{int(r.population)}</td>
      <td className="p-2 text-right">{int(r.densityPerKm2)}</td>
      <td className="p-2 text-right">{pct(r.pct65plus)}</td>
      <td className="p-2 text-right">{pct(r.pctUnder15)}</td>
      <td className="p-2 text-right">{pct(r.pctForeigners)}</td>
      <td className="p-2 text-right">{pct(r.pctOnePersonFamilies)}</td>
      <td className="p-2 text-right">{int(r.dwellingsTotal)}</td>
      <td className="p-2">
        <div className="flex items-center gap-2 justify-end">
          <span className="tabular w-12 text-right">{pct(r.pctDwellingsEmptyOrNonResident)}</span>
          <span className="w-16 h-1.5 rounded-full bg-[var(--rule)]/60 overflow-hidden" aria-hidden>
            <span className="block h-full bg-rose-500" style={{ width: `${Math.min(100, r.pctDwellingsEmptyOrNonResident ?? 0)}%` }} />
          </span>
        </div>
      </td>
    </tr>
    {r.parts && r.parts.some((p) => p.population >= 50) && (
      <tr className="text-[var(--ink-3)]">
        <td colSpan={9} className="px-2 pb-2 pt-0 text-[11px] font-sans">
          {c('includes', {
            parts: r.parts
              .filter((p) => p.population >= 50)
              .map((p) => `${p.name} ${int(p.population)} (${pct(p.pctDwellingsEmptyOrNonResident)} ${c('emptyShort')})`)
              .join(' · '),
          })}
        </td>
      </tr>
    )}
    </React.Fragment>
  );
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-mono text-[var(--ink-3)] uppercase font-semibold">{title}</span>
      <div className="overflow-x-auto rounded-xl border border-[var(--rule)]">
        <table className="w-full text-xs font-mono min-w-[760px]">
          <thead className="bg-[var(--rule)]/40 text-[var(--ink-3)] text-[10px] uppercase">
            <tr>
              <th className="text-left p-2">{c('colArea')}</th>
              <th className="text-right p-2">{c('colResidents')}</th>
              <th className="text-right p-2">{c('colDensity')}</th>
              <th className="text-right p-2">{c('col65')}</th>
              <th className="text-right p-2">{c('colUnder15')}</th>
              <th className="text-right p-2">{c('colForeigners')}</th>
              <th className="text-right p-2">{c('colOnePerson')}</th>
              <th className="text-right p-2">{c('colDwellings')}</th>
              <th className="text-right p-2">{c('colEmpty')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => row(r))}
            {total && row(total, true)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
