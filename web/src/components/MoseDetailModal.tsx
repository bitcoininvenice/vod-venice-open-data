'use client';

import React from 'react';
import { X, Waves, ShieldQuestion, Droplets, ArrowUpRight, ArrowDownRight, AlertTriangle, CalendarClock, ExternalLink } from 'lucide-react';
import { MoseGateItem } from '@/lib/types';
import type { TideCategory, TideForecast, TideStation, TideTrend } from '@/lib/contracts/tide';
import { useTranslation } from '@/lib/i18n';
import { formatLocalStamp, formatSignedCm } from '@/lib/time';
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge';
import { useDialogA11y } from '@/components/ui/useDialogA11y';

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

const CATEGORY_LABEL: Record<TideCategory, { it: string; en: string; className: string }> = {
  NORMALE: { it: 'Normale', en: 'Normal', className: 'text-blue-400' },
  SOSTENUTA: { it: 'Sostenuta', en: 'High', className: 'text-amber-400' },
  MOLTO_SOSTENUTA: { it: 'Molto sostenuta', en: 'Very high', className: 'text-orange-400' },
  ECCEZIONALE: { it: 'Eccezionale', en: 'Exceptional', className: 'text-rose-400' },
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
  const { language, t } = useTranslation();
  const it = language === 'it';
  const panelRef = useDialogA11y(isOpen, onClose);
  if (!isOpen) return null;

  const { forecast, category, trend, observedAt } = tideInfo;
  const forecastMax = forecast?.extremes.filter((e) => e.type === 'max').reduce<number | null>(
    (acc, e) => (acc === null || e.levelCm > acc ? e.levelCm : acc),
    null,
  ) ?? null;
  const thresholdReached = forecastMax !== null && forecastMax >= MOSE_THRESHOLD_CM;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mose-modal-title"
        tabIndex={-1}
        className="glass-panel w-full max-w-2xl rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 border border-blue-500/40 animate-in fade-in zoom-in-95 duration-200 max-h-[88vh] overflow-y-auto outline-none"
      >
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/30 flex flex-col justify-between gap-1">
            <span className="text-[10px] text-[var(--ink-3)] font-mono">Punta della Salute</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-[var(--ink)]">{formatSignedCm(tideLevel)}</span>
              {category && (
                <span className={`text-xs font-semibold ${CATEGORY_LABEL[category].className}`}>
                  ({CATEGORY_LABEL[category][it ? 'it' : 'en']})
                </span>
              )}
            </div>
            <span className="text-[10px] text-[var(--ink-3)]">
              {tideLevel === null
                ? (it ? 'Fonte CPSM non raggiungibile' : 'CPSM source unavailable')
                : trend
                  ? (trend === 'IN_AUMENTO' ? (it ? 'In crescita (da previsione)' : 'Rising (from forecast)') : (it ? 'In calo (da previsione)' : 'Falling (from forecast)'))
                  : (it ? 'Tendenza non disponibile' : 'Trend not available')}
            </span>
          </div>

          <div className="bg-[var(--rule)]/40 p-3 rounded-xl border border-[var(--rule)] flex flex-col justify-between gap-1">
            <span className="text-[10px] text-[var(--ink-3)] font-mono">{it ? 'Massimo previsto' : 'Forecast peak'}</span>
            <span className={`text-base font-bold font-mono ${thresholdReached ? 'text-rose-400' : 'text-[var(--ink)]'}`}>
              {formatSignedCm(forecastMax)}
            </span>
            <span className="text-[10px] text-[var(--ink-3)]">
              {forecast
                ? `${it ? 'Emessa' : 'Issued'} ${formatLocalStamp(forecast.issuedAt)}`
                : (it ? 'Previsione non disponibile' : 'Forecast not available')}
            </span>
          </div>

          <div className="bg-[var(--rule)]/40 p-3 rounded-xl border border-[var(--rule)] flex flex-col justify-between gap-1">
            <span className="text-[10px] text-[var(--ink-3)] font-mono">{t('moseModal.barrierStatus')}</span>
            <span className="text-sm font-bold font-mono text-slate-300 flex items-center gap-1.5">
              <ShieldQuestion className="w-4 h-4" /> {it ? 'Non pubblicato' : 'Not published'}
            </span>
            <span className="text-[10px] text-[var(--ink-3)]">
              {thresholdReached
                ? (it ? `Previsione ≥ +${MOSE_THRESHOLD_CM} cm: attivazione possibile` : `Forecast ≥ +${MOSE_THRESHOLD_CM} cm: activation possible`)
                : (it ? `Soglia indicativa di attivazione +${MOSE_THRESHOLD_CM} cm` : `Indicative activation threshold +${MOSE_THRESHOLD_CM} cm`)}
            </span>
          </div>
        </div>

        {/* Previsione CPSM: sempre visibile con la data di emissione */}
        {forecast && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
              <CalendarClock className="w-4 h-4 text-blue-400" />
              {it ? 'Previsione estremali CPSM' : 'CPSM forecast extremes'}
              <span className="font-mono font-normal text-[10px] text-[var(--ink-3)]">
                · {it ? 'ultimo aggiornamento' : 'last updated'} {formatLocalStamp(forecast.issuedAt)}
              </span>
            </span>
            {forecast.stale && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {it
                  ? `La previsione pubblicata su dati.venezia.it risale al ${formatLocalStamp(forecast.issuedAt)} e potrebbe non essere aggiornata. Per la previsione ufficiale corrente consultare il sito del Centro Maree.`
                  : `The forecast published on dati.venezia.it was issued on ${formatLocalStamp(forecast.issuedAt)} and may be out of date. Check the Tide Centre website for the current official forecast.`}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
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
            {it ? 'Bocche di porto' : 'Port inlets'}
            <ProvenanceBadge kind="static-reference" />
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {moseGates.map((gate) => (
              <div key={gate.id} className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-1.5">
                <strong className="text-[var(--ink)] text-xs">{gate.inletName}</strong>
                <span className="text-[11px] text-[var(--ink-2)]">{gate.channel}</span>
                <div className="flex justify-between items-center text-[10px] font-mono pt-1 border-t border-[var(--rule)]">
                  <span className="text-[var(--ink-3)]">
                    {gate.barriersCount} {it ? 'paratoie' : 'gates'}
                  </span>
                  <span className="text-cyan-400">
                    {it ? 'Mare' : 'Sea'} {formatSignedCm(gate.tideSeaCm)} · {it ? 'Laguna' : 'Lagoon'} {formatSignedCm(gate.tideLagoonCm)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rete mareografica */}
        <div className="flex flex-col gap-2 pt-1 border-t border-[var(--rule)]">
          <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-blue-400" /> {it ? 'Rete mareografica CPSM' : 'CPSM tide gauge network'} ({stations.length})
          </span>
          {stations.length === 0 ? (
            <p className="text-[11px] text-[var(--ink-3)]">{it ? 'Dati non disponibili.' : 'Data not available.'}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
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
              {it ? 'La tendenza è ricavata dal prossimo estremale previsto.' : 'Trend is derived from the next forecast extreme.'}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--rule)] text-xs text-[var(--ink-3)]">
          <a
            href="https://www.comune.venezia.it/it/content/centro-previsioni-e-segnalazioni-maree"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-[var(--ink)] hover:underline"
          >
            {it ? 'Fonte: Comune di Venezia – CPSM (dati.venezia.it)' : 'Source: City of Venice – CPSM (dati.venezia.it)'}
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
      </div>
    </div>
  );
};
