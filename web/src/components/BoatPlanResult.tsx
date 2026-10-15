'use client';

import React from 'react';
import { Anchor, ArrowRightLeft, Ban, Droplets, ScrollText } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { clock } from '@/lib/tripView';
import { ASSUMED_KMH, type BoatResult, type BoatRule } from '@/lib/boatRouting';
import type { OrdinanceItem } from '@/lib/contracts/ordinances';

/** Testo Unico della circolazione acquea: pagina del Comune con l'atto e le modifiche */
const TESTO_UNICO_URL = 'https://www.comune.venezia.it/it/content/normativa-circolazione-acquea';

const RuleList: React.FC<{ rules: BoatRule[]; icon: React.ReactNode; title: string; testId: string }> = ({ rules, icon, title, testId }) =>
  rules.length === 0 ? null : (
    <div className="flex flex-col gap-1" data-testid={testId}>
      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--ink-2)]">
        {icon}
        {title}
      </span>
      <ul className="flex flex-col gap-1 pl-5 list-disc text-[11px] text-[var(--ink-2)]">
        {rules.map((r) => (
          <li key={r.id}>
            {r.label} <span className="text-[var(--ink-3)]">({r.ref})</span>
          </li>
        ))}
      </ul>
    </div>
  );

/**
 * Risultato del planner in barca propria: orari, canali percorsi, regole del Testo Unico rispettate o che
 * hanno cambiato strada, marea, ordinanze in vigore sui canali e avvertenze.
 */
export const BoatPlanResult: React.FC<{ result: BoatResult; resident: boolean; ordinances: OrdinanceItem[] }> = ({ result, resident, ordinances }) => {
  const { t } = useTranslation();
  if (!result.ok) {
    const key = result.reason === 'restricted' && !resident ? 'restrictedZtl' : result.reason;
    return (
      <p className="text-xs text-amber-400" data-testid="planner-boat-error">
        {t(`ui.planner.boat_fail_${key}`)}
      </p>
    );
  }
  const p = result.plan;
  const minutes = Math.max(1, Math.round((p.arrive - p.depart) / 60));
  const named = p.stretches.filter((s) => s.meters >= 30);
  return (
    <div className="flex flex-col gap-3" data-testid="planner-boat-result">
      <div className="flex items-baseline justify-between gap-2 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30">
        <span className="text-sm font-bold text-[var(--ink)]">
          {clock(p.depart)} → {clock(p.arrive)}
        </span>
        <span className="text-xs font-mono text-teal-300">{t('ui.planner.boat_duration', { min: minutes, km: (p.meters / 1000).toFixed(1) })}</span>
      </div>
      <ol className="flex flex-col gap-1 text-xs text-[var(--ink-2)]" data-testid="planner-boat-canals">
        {named.map((s, i) => (
          <li key={i} className="flex items-start gap-2">
            <Anchor className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" aria-hidden />
            <span>
              {s.name ?? t('ui.planner.boat_unnamed')} <span className="text-[var(--ink-3)]">· {Math.round(s.meters / 10) * 10} m</span>
            </span>
          </li>
        ))}
      </ol>
      <RuleList rules={p.avoided} icon={<Ban className="w-3.5 h-3.5 text-amber-400" aria-hidden />} title={t('ui.planner.boat_avoided')} testId="planner-boat-avoided" />
      <RuleList rules={p.onRoute} icon={<ArrowRightLeft className="w-3.5 h-3.5 text-teal-400" aria-hidden />} title={t('ui.planner.boat_onRoute')} testId="planner-boat-rules" />
      {p.tideRule !== 'none' && (
        <p className="flex items-start gap-1.5 text-[11px] text-sky-300" data-testid="planner-boat-tide">
          <Droplets className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />
          {t(p.tideRule === 'noMotor' ? 'ui.planner.boat_tideNoMotor' : 'ui.planner.boat_tideSlow')}
        </p>
      )}
      {ordinances.length > 0 && (
        <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px]" data-testid="planner-boat-ordinances">
          <span className="font-semibold text-amber-300">{t('ui.planner.boat_ordinances', { n: ordinances.length })}</span>
          <ul className="flex flex-col gap-1">
            {ordinances.map((o) => (
              <li key={o.id}>
                <a href={o.url} target="_blank" rel="noopener noreferrer" className="underline text-[var(--ink-2)]">
                  {o.number} – {o.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-[11px] text-[var(--ink-3)]">
        {t('ui.planner.boat_speedNote')}
        {p.osmLimitMeters >= 100 && <> {t('ui.planner.boat_osmLimits', { km: (p.osmLimitMeters / 1000).toFixed(1) })}</>}
        {p.assumedMeters >= 100 && <> {t('ui.planner.boat_assumed', { km: (p.assumedMeters / 1000).toFixed(1), kmh: ASSUMED_KMH })}</>}
        {(p.snapFromM >= 60 || p.snapToM >= 60) && <> {t('ui.planner.boat_snap')}</>}
      </p>
      <p className="flex items-start gap-1.5 text-[11px] text-[var(--ink-3)]">
        <ScrollText className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />
        <span>
          {t('ui.planner.boat_legal')}{' '}
          <a href={TESTO_UNICO_URL} target="_blank" rel="noopener noreferrer" className="underline">
            {t('ui.planner.boat_legalLink')}
          </a>
        </span>
      </p>
    </div>
  );
};
