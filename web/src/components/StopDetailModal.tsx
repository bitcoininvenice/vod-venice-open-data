'use client';

import React from 'react';
import { X, Anchor, Accessibility, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';
import { StopItem } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';
import { useDialogA11y } from '@/components/ui/useDialogA11y';

interface StopDetailModalProps {
  stop: StopItem | null;
  onClose: () => void;
  currentTimeSeconds: number;
}

export const StopDetailModal: React.FC<StopDetailModalProps> = ({
  stop,
  onClose
}) => {
  const { t } = useTranslation();
  const panelRef = useDialogA11y(stop !== null, onClose);
  if (!stop) return null;

  const sampleLines = stop.lines && stop.lines.length > 0 ? stop.lines : ['1', '2'];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stop-modal-title"
        tabIndex={-1}
        className="glass-panel w-full max-w-md rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-3.5 sm:gap-4 border border-cyan-500/30 animate-in fade-in zoom-in-95 duration-200 max-h-[88vh] overflow-y-auto outline-none">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--rule)] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400">
                {t('ui.stop.fermataActvModo', { mode: stop.mode.toUpperCase() })}
              </span>
              <h3 id="stop-modal-title" className="text-base font-bold text-[var(--ink)] leading-snug">
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
                {t('ui.stop.linea')} {l}
              </span>
            ))}
          </div>
        </div>

        {/* Institutional Verification Notice */}
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-blue-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>{t('ui.stop.datoIstituzionaleGtfsActv')}</span>
          </div>
          <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
            {t('ui.stop.approdoCensitoNelCatalogoOpen')}
          </p>
          <a
            href="https://actv.avmspa.it/it/content/orari-servizio-di-navigazione-0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs font-semibold border border-cyan-500/30 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t('ui.stop.orariUfficialiNavigazioneActv')}
          </a>
        </div>
      </div>
    </div>
  );
};
