'use client';

import React from 'react';
import { X, Anchor, Navigation, Accessibility, Clock, MapPin } from 'lucide-react';
import { StopItem } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

interface StopDetailModalProps {
  stop: StopItem | null;
  onClose: () => void;
  currentTimeSeconds: number;
}

export const StopDetailModal: React.FC<StopDetailModalProps> = ({
  stop,
  onClose,
  currentTimeSeconds
}) => {
  const { language, t } = useTranslation();
  if (!stop) return null;

  // Generate simulated realistic upcoming departures based on current time
  const currentMinute = Math.floor(currentTimeSeconds / 60);
  const sampleLines = stop.lines && stop.lines.length > 0 ? stop.lines : ['1', '2'];
  
  const departures = sampleLines.map((line, idx) => {
    const depMinute = (currentMinute + 3 + (idx * 6)) % 1440;
    const h = Math.floor(depMinute / 60).toString().padStart(2, '0');
    const m = (depMinute % 60).toString().padStart(2, '0');
    return {
      line,
      time: `${h}:${m}`,
      destination: idx % 2 === 0 ? "Piazzale Roma" : "Lido S.M.E.",
      waitMinutes: 3 + (idx * 6)
    };
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div className="glass-panel w-full max-w-md rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-3.5 sm:gap-4 border border-cyan-500/30 animate-in fade-in zoom-in-95 duration-200 max-h-[88vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--rule)] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400">
                {language === 'it' ? `Fermata ACTV · ${stop.mode.toUpperCase()}` : `ACTV Stop · ${stop.mode.toUpperCase()}`}
              </span>
              <h3 className="text-base font-bold text-[var(--ink)] leading-snug">
                {stop.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details & Coordinates */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-[var(--rule)]/40 p-2.5 rounded-xl border border-[var(--rule)] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[var(--ink-3)]" />
            <div>
              <span className="text-[10px] text-[var(--ink-3)] block">{t('common.coordinates')}</span>
              <span className="font-mono text-[var(--ink)]">{stop.lat.toFixed(4)}, {stop.lon.toFixed(4)}</span>
            </div>
          </div>

          <div className="bg-[var(--rule)]/40 p-2.5 rounded-xl border border-[var(--rule)] flex items-center gap-2">
            <Accessibility className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] text-[var(--ink-3)] block">{t('stopModal.accessibility')}</span>
              <span className="text-emerald-400 font-medium">{t('stopModal.accessible')}</span>
            </div>
          </div>
        </div>

        {/* Passing Lines Badges */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-mono uppercase text-[var(--ink-3)]">{t('stopModal.linesServed')}</span>
          <div className="flex flex-wrap gap-1.5">
            {sampleLines.map((l) => (
              <span
                key={l}
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
              >
                {language === 'it' ? 'Linea' : 'Route'} {l}
              </span>
            ))}
          </div>
        </div>

        {/* Upcoming Departures */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[var(--rule)]">
          <div className="flex items-center gap-1.5 text-xs text-[var(--ink-2)]">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('stopModal.upcomingDepartures')}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {departures.map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-500 text-white font-bold">
                    {d.line}
                  </span>
                  <span className="text-[var(--ink)] font-sans">{d.destination}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[var(--ink)]">{d.time}</span>
                  <span className="text-[10px] text-[var(--ink-3)] ml-1.5">({d.waitMinutes} min)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
