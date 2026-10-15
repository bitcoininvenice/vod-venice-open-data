'use client';

import React from 'react';
import { X, Waves, ShieldQuestion, Droplets, ArrowUpRight, ArrowDownRight, AlertTriangle, CalendarClock, ExternalLink } from 'lucide-react';
import { MoseGateItem } from '@/lib/types';
import type { TideCategory, TideForecast, TideStation, TideTrend } from '@/lib/contracts/tide';
import { useTranslation } from '@/lib/i18n';
import { formatLocalStamp, formatSignedCm } from '@/lib/time';
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge';
import { InfoPanel } from '@/components/ui/InfoPanel';
import { PROVIDERS } from '@/lib/provenance/providers';

interface MoseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  moseGates: MoseGateItem[];
  stations: TideStation[];
  tideLevel: number | null;
  tideInfo: {
    observedAt: string | null;
    trend: TideTrend | null;
    category: TideCategory | null;
    forecast: TideForecast | null;
  };
}

const CATEGORY_CLASS: Record<TideCategory, string> = {
  NORMALE: 'text-blue-400',
  SOSTENUTA: 'text-amber-400',
  MOLTO_SOSTENUTA: 'text-orange-400',
  ECCEZIONALE: 'text-rose-400',
};

/** Soglia di riferimento per l'attivazione del MOSE (previsione di marea). */
const MOSE_THRESHOLD_CM = 110;

export const MoseDetailModal: React.FC<MoseDetailModalProps> = ({
  isOpen,
  onClose,
  moseGates,
  stations,
  tideLevel,
  tideInfo
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const { forecast, category, trend, observedAt } = tideInfo;
  const forecastMax = forecast?.extremes.filter((e) => e.type === 'max').reduce<number | null>(
    (acc, e) => (acc === null || e.levelCm > acc ? e.levelCm : acc),
    null,
  ) ?? null;
  const thresholdReached = forecastMax !== null && forecastMax >= MOSE_THRESHOLD_CM;

  return (
    <InfoPanel open={isOpen} onClose={onClose} labelledBy="mose-modal-title" layer="showMose" accent="border-blue-500/40">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--rule)] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/40 shadow-lg shadow-blue-500/10">
              <Waves className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  CPSM Centro Maree · MOSE
                </span>
                <ProvenanceBadge kind="live" detail={observedAt ? formatLocalStamp(observedAt) : undefined} />
              </div>
              <h3 id="mose-modal-title" className="text-lg font-bold text-[var(--ink)] leading-snug">
                {t('moseModal.title')}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Livello attuale, previsione, stato MOSE */}
        <div className="grid grid-cols-1 gap-2.5 text-xs">
          <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/30 flex flex-col justify-between gap-1">
            <span className="text-[10px] text-[var(--ink-3)] font-mono">Punta della Salute</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-[var(--ink)]">{formatSignedCm(tideLevel)}</span>
              {category && (
                <span className={`text-xs font-semibold ${CATEGORY_CLASS[category]}`}>
                  ({t(`ui.mose.cat_${category}`)})
                </span>
              )}
            </div>
            <span className="text-[10px] text-[var(--ink-3)]">
              {tideLevel === null
                ? (t('ui.mose.fonteCpsmNonRaggiungibile'))
                : trend
                  ? (trend === 'IN_AUMENTO' ? (t('ui.mose.crescitaPrevisione')) : (t('ui.mose.caloPrevisione')))
                  : (t('ui.mose.tendenzaNonDisponibile'))}
            </span>
          </div>

          <div className="bg-[var(--rule)]/40 p-3 rounded-xl border border-[var(--rule)] flex flex-col justify-between gap-1">
            <span className="text-[10px] text-[var(--ink-3)] font-mono">{t('ui.mose.massimoPrevisto')}</span>
            <span className={`text-base font-bold font-mono ${thresholdReached ? 'text-rose-400' : 'text-[var(--ink)]'}`}>
              {formatSignedCm(forecastMax)}
            </span>
            <span className="text-[10px] text-[var(--ink-3)]">
              {forecast
                ? `${t('ui.mose.emessa')} ${formatLocalStamp(forecast.issuedAt)}`
                : (t('ui.mose.previsioneNonDisponibile'))}
            </span>
          </div>

          <div className="bg-[var(--rule)]/40 p-3 rounded-xl border border-[var(--rule)] flex flex-col justify-between gap-1">
            <span className="text-[10px] text-[var(--ink-3)] font-mono">{t('moseModal.barrierStatus')}</span>
            <span className="text-sm font-bold font-mono text-slate-300 flex items-center gap-1.5">
              <ShieldQuestion className="w-4 h-4" /> {t('ui.mose.nonPubblicato')}
            </span>
            <span className="text-[10px] text-[var(--ink-3)]">
              {thresholdReached
                ? t('ui.mose.attivazionePossibile', { cm: MOSE_THRESHOLD_CM })
                : t('ui.mose.sogliaIndicativa', { cm: MOSE_THRESHOLD_CM })}
            </span>
          </div>
        </div>

        {/* Previsione CPSM: sempre visibile con la data di emissione */}
        {forecast && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
              <CalendarClock className="w-4 h-4 text-blue-400" />
              {t('ui.mose.previsioneEstremaliCpsm')}
              <span className="font-mono font-normal text-[10px] text-[var(--ink-3)]">
                · {t('ui.mose.ultimoAggiornamento')} {formatLocalStamp(forecast.issuedAt)}
              </span>
            </span>
            {forecast.stale && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {t('ui.mose.forecastMaybeOld', { issued: formatLocalStamp(forecast.issuedAt) })}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {forecast.extremes.slice(0, 8).map((e) => (
                <div key={e.at} className="p-2 rounded-lg bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col">
                  <span className="text-[10px] font-mono text-[var(--ink-3)]">{formatLocalStamp(e.at)}</span>
                  <span className={`font-mono font-bold ${e.levelCm >= MOSE_THRESHOLD_CM ? 'text-rose-400' : 'text-[var(--ink)]'}`}>
                    {e.type === 'max' ? '▲' : '▼'} {formatSignedCm(e.levelCm)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schiere MOSE con livelli reali delle stazioni più vicine */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
            {t('ui.mose.bocchePorto')}
            <ProvenanceBadge kind="static-reference" />
          </span>
          <div className="grid grid-cols-1 gap-2 text-xs">
            {moseGates.map((gate) => (
              <div key={gate.id} className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-1.5">
                <strong className="text-[var(--ink)] text-xs">{gate.inletName}</strong>
                <span className="text-[11px] text-[var(--ink-2)]">{gate.channel}</span>
                <div className="flex justify-between items-center text-[10px] font-mono pt-1 border-t border-[var(--rule)]">
                  <span className="text-[var(--ink-3)]">
                    {gate.barriersCount} {t('ui.mose.paratoie')}
                  </span>
                  <span className="text-cyan-400">
                    {t('ui.mose.mare')} {formatSignedCm(gate.tideSeaCm)} · {t('ui.mose.laguna')} {formatSignedCm(gate.tideLagoonCm)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rete mareografica */}
        <div className="flex flex-col gap-2 pt-1 border-t border-[var(--rule)]">
          <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-blue-400" /> {t('ui.mose.reteMareograficaCpsm')} ({stations.length})
          </span>
          {stations.length === 0 ? (
            <p className="text-[11px] text-[var(--ink-3)]">{t('ui.mose.datiNonDisponibili')}</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {stations.map((s) => (
                <div key={s.id} className="p-2.5 rounded-xl bg-[var(--rule)]/40 border border-[var(--rule)] flex flex-col gap-0.5">
                  <span className="text-[10px] text-[var(--ink-3)] truncate" title={s.name}>{s.name}</span>
                  <span className="text-base font-bold font-mono text-[var(--ink)]">{formatSignedCm(s.levelCm)}</span>
                  <span className="text-[10px] font-mono text-[var(--ink-3)]">{formatLocalStamp(s.observedAt)}</span>
                </div>
              ))}
            </div>
          )}
          {trend && (
            <span className="text-[10px] text-[var(--ink-3)] flex items-center gap-1">
              {trend === 'IN_AUMENTO' ? <ArrowUpRight className="w-3 h-3 text-amber-400" /> : <ArrowDownRight className="w-3 h-3 text-blue-400" />}
              {t('ui.mose.tendenzaRicavataDalProssimoEstremale')}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--rule)] text-xs text-[var(--ink-3)]">
          <a
            href={PROVIDERS.cpsm.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-[var(--ink)] hover:underline"
          >
            {t('ui.mose.fonteComuneVeneziaCpsmDati')}
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-400 transition-all cursor-pointer shadow-lg shadow-blue-500/20"
          >
            {t('common.close')}
          </button>
        </div>
    </InfoPanel>
  );
};
