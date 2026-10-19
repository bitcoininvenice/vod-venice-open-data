'use client';

import React, { useEffect, useState } from 'react';
import { Train, Clock, ArrowRight, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { PROVIDERS } from '@/lib/provenance/providers';
import { useTranslation } from '@/lib/i18n';
import type { TrainBoardRow, TrainStationBoard as TrainStationBoardData } from '@/server/sources/busoneTrains';

interface TrainStationBoardProps {
  initialStation?: 'santa_lucia' | 'mestre';
  showStationSelector?: boolean;
}

export const TrainStationBoard: React.FC<TrainStationBoardProps> = ({
  initialStation = 'santa_lucia',
  showStationSelector = true,
}) => {
  const { t, language } = useTranslation();
  const [station, setStation] = useState<'santa_lucia' | 'mestre'>(initialStation);
  const [tab, setTab] = useState<'departures' | 'arrivals'>('departures');
  const [board, setBoard] = useState<TrainStationBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    fetch(`/api/trains?station=${station}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setBoard(json.data);
          setError(false);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/trains?station=${station}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success && json.data) {
          setBoard(json.data);
          setError(false);
        } else {
          setError(true);
        }
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));

    const interval = setInterval(() => {
      fetch(`/api/trains?station=${station}`)
        .then((res) => res.json())
        .then((json) => {
          if (cancelled) return;
          if (json.success && json.data) {
            setBoard(json.data);
            setError(false);
          }
        })
        .catch(() => {});
    }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [station]);

  const locale = language === 'it' ? 'it-IT' : 'en-GB';
  const formatTime = (ms: number) =>
    new Date(ms).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });

  const rows: TrainBoardRow[] = board ? board[tab] : [];

  return (
    <section className="flex flex-col gap-2.5 p-3 rounded-2xl bg-[var(--rule)]/20 border border-[var(--rule)] text-xs" data-testid="train-station-board">
      {/* Header with Title and Attribution */}
      <div className="flex items-center justify-between border-b border-[var(--rule)]/50 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
            <Train className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[var(--ink)] leading-tight">
              {station === 'santa_lucia' ? t('ui.trains.santaLucia') : t('ui.trains.mestre')}
            </h4>
            <span className="text-[10px] text-[var(--ink-3)] font-mono block">
              {t('ui.trains.tabellone90minuti')}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          title={t('common.refresh')}
          className="p-1 rounded-lg hover:bg-[var(--rule)] text-[var(--ink-2)] transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Station Selector */}
      {showStationSelector && (
        <div className="grid grid-cols-2 gap-1 bg-black/20 p-0.5 rounded-xl border border-[var(--rule)]/40 text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setStation('santa_lucia')}
            className={`py-1 rounded-lg transition-all cursor-pointer ${
              station === 'santa_lucia' ? 'bg-[var(--rule)] text-[var(--ink)] shadow-sm font-semibold' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
          >
            {t('ui.trains.santaLuciaShort')}
          </button>
          <button
            type="button"
            onClick={() => setStation('mestre')}
            className={`py-1 rounded-lg transition-all cursor-pointer ${
              station === 'mestre' ? 'bg-[var(--rule)] text-[var(--ink)] shadow-sm font-semibold' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
          >
            {t('ui.trains.mestreShort')}
          </button>
        </div>
      )}

      {/* Tab Selector: Departures / Arrivals */}
      <div className="flex gap-1.5" role="tablist">
        {(['departures', 'arrivals'] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`flex-1 py-1 px-2 rounded-lg text-[11px] border cursor-pointer flex items-center justify-center gap-1.5 transition-colors ${
              tab === k
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 font-semibold'
                : 'border-[var(--rule)]/40 text-[var(--ink-2)] hover:bg-[var(--rule)]/20'
            }`}
          >
            {k === 'departures' ? <ArrowRight className="w-3 h-3" /> : <ArrowLeft className="w-3 h-3" />}
            <span>{t(`ui.trains.${k}`)}</span>
            {board && <span className="font-mono text-[10px] opacity-75">({board[k].length})</span>}
          </button>
        ))}
      </div>

      {/* Rows or State */}
      {loading && !board && (
        <div className="py-6 flex flex-col items-center justify-center gap-2 text-[var(--ink-3)] text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
          <span>{t('ui.trains.caricamentoInCorso')}</span>
        </div>
      )}

      {error && !board && (
        <div className="py-4 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{t('ui.trains.erroreCaricamento')}</span>
        </div>
      )}

      {board && rows.length === 0 && (
        <div className="py-4 text-center text-[var(--ink-3)] text-xs font-mono">
          {t('ui.trains.nessunTrenoPrevisto')}
        </div>
      )}

      {rows.length > 0 && (
        <ul className="flex flex-col divide-y divide-[var(--rule)]/40 max-h-60 overflow-y-auto pr-1">
          {rows.map((r, i) => {
            const hasDelay = (r.delayMinutes ?? 0) > 0;
            return (
              <li key={`${r.trainNumber}-${r.scheduledAt}-${i}`} className="py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex flex-col shrink-0 font-mono text-center w-12">
                    <span className="font-bold text-[var(--ink)] text-xs">{formatTime(r.scheduledAt)}</span>
                    {hasDelay && (
                      <span className="text-[10px] text-red-400 font-bold">
                        {formatTime(r.estimatedAt)}
                      </span>
                    )}
                  </div>

                  <span
                    className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] text-white shrink-0 border border-black/20"
                    style={{ backgroundColor: r.color }}
                  >
                    {r.trainNumber}
                  </span>

                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-xs font-medium text-[var(--ink)]">
                      {r.place}
                    </span>
                    <span className="text-[10px] text-[var(--ink-3)] truncate">
                      {r.operator} · {r.trainType.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 text-right">
                  {r.platform && (
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40">
                      {t('ui.trains.platform', { n: r.platform })}
                    </span>
                  )}
                  <span className={`text-[10px] font-mono font-medium ${r.delayMinutes === null ? 'text-[var(--ink-3)]' : hasDelay ? 'text-red-400' : 'text-emerald-400'}`}>
                    {r.delayMinutes === null ? t('ui.trains.scheduled') : hasDelay ? t('ui.trains.late', { min: r.delayMinutes }) : t('ui.trains.inOrario')}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Attribution Footer */}
      <div className="pt-2 border-t border-[var(--rule)]/40 flex items-center justify-between text-[10px] text-[var(--ink-3)]">
        <span className="flex items-center gap-1 font-mono">
          <Clock className="w-3 h-3 text-[var(--ink-3)]" />
          {t('ui.trains.finestra90min')}
        </span>
        <span>
          {t('ui.map.fonte')}: <a href={PROVIDERS.busone.datasetUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--ink)]">{t('ui.trains.source')}</a>
        </span>
      </div>
    </section>
  );
};
