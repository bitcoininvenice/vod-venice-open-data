'use client';

import React from 'react';
import { X, Anchor, ShieldCheck, AlertTriangle, MapPin } from 'lucide-react';
import { ShipItem } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';
import { useDialogA11y } from '@/components/ui/useDialogA11y';

interface ShipDetailModalProps {
  ship: ShipItem | null;
  onClose: () => void;
}

export const ShipDetailModal: React.FC<ShipDetailModalProps> = ({
  ship,
  onClose
}) => {
  const { language, t } = useTranslation();
  const panelRef = useDialogA11y(ship !== null, onClose);
  if (!ship) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ship-modal-title"
        tabIndex={-1}
        className="glass-panel w-full max-w-lg rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-3.5 sm:gap-4 border border-cyan-500/40 animate-in fade-in zoom-in-95 duration-200 max-h-[88vh] overflow-y-auto outline-none">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--rule)] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
              <Anchor className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {ship.shipType} · {ship.flag}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> AIS LIVE
                </span>
              </div>
              <h3 id="ship-modal-title" className="text-lg font-bold text-[var(--ink)] leading-snug">
                {ship.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
            title={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Berth & Destination Banner */}
        <div className="p-3 rounded-xl bg-[var(--rule)]/40 border border-[var(--rule)] flex flex-col gap-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-[var(--ink-3)]">
              {t('ui.ship.ormeggioAssegnatoBanchina')}
            </span>
            <span className="font-mono font-bold text-cyan-400">{ship.operator}</span>
          </div>
          <span className="text-sm font-bold text-[var(--ink)] flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
            {ship.berth}
          </span>
          <span className="text-[11px] text-[var(--ink-2)]">
            {t('ui.ship.destinazione')} <strong>{ship.destination}</strong>
          </span>
        </div>

        {/* Cruise Regulation Notice (DL 103/2021) */}
        {ship.shipType === 'CRUISE' && (
          <div className={`p-3 rounded-xl border text-xs flex flex-col gap-1.5 ${
            ship.isRestrictedLagoonRoute
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}>
            <div className="flex items-center gap-2 font-bold">
              {ship.isRestrictedLagoonRoute ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>{t('ui.ship.deviazioneObbligatoriaDL103')}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{t('ui.ship.naveAutorizzataAlTronchettoMarittima')}</span>
                </>
              )}
            </div>
            <p className="text-[11px] leading-relaxed opacity-90 text-[var(--ink)]">
              {ship.isRestrictedLagoonRoute ? (
                language === 'it' ? (
                  <>Questa nave ha stazza <strong>{ship.grossTonnage.toLocaleString()} GT (&gt;25.000 GT)</strong>. Dal 2021 è vietato il passaggio nel Bacino di San Marco e Canale della Giudecca. La nave è instradata via Canale dei Petroli a <strong>Porto Marghera</strong>.</>
                ) : (
                  <>This ship measures <strong>{ship.grossTonnage.toLocaleString()} GT (&gt;25,000 GT)</strong>. Since 2021, passing through San Marco Basin and Giudecca Channel is prohibited. Rerouted via Canale dei Petroli to <strong>Porto Marghera</strong>.</>
                )
              ) : (
                language === 'it' ? (
                  <>Questa nave ha stazza <strong>{ship.grossTonnage.toLocaleString()} GT (&lt;25.000 GT)</strong>. Rientra nei limiti di salvaguardia e può attraccare regolarmente alla <strong>Stazione Marittima del Tronchetto</strong> o a San Basilio.</>
                ) : (
                  <>This ship measures <strong>{ship.grossTonnage.toLocaleString()} GT (&lt;25,000 GT)</strong>. It complies with safeguarding limits and docks at <strong>Tronchetto Passenger Terminal</strong> or San Basilio.</>
                )
              )}
            </p>
          </div>
        )}

        {/* Specs Grid */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-[var(--rule)]/40 p-2.5 rounded-xl border border-[var(--rule)]">
            <span className="text-[10px] text-[var(--ink-3)] block font-mono">
              {t('ui.ship.stazzaLorda')}
            </span>
            <span className="font-mono font-bold text-[var(--ink)] text-sm">{ship.grossTonnage.toLocaleString()} GT</span>
          </div>
          <div className="bg-[var(--rule)]/40 p-2.5 rounded-xl border border-[var(--rule)]">
            <span className="text-[10px] text-[var(--ink-3)] block font-mono">
              {t('ui.ship.lunghezza')}
            </span>
            <span className="font-mono font-bold text-cyan-400 text-sm">{ship.lengthMeters} {t('common.meters')}</span>
          </div>
          <div className="bg-[var(--rule)]/40 p-2.5 rounded-xl border border-[var(--rule)]">
            <span className="text-[10px] text-[var(--ink-3)] block font-mono">
              {t('ui.ship.pescaggio')}
            </span>
            <span className="font-mono font-bold text-emerald-400 text-sm">{ship.draughtMeters} {t('common.meters')}</span>
          </div>
        </div>

        {/* Navigation & Telemetry */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[var(--rule)]/40 p-2.5 rounded-xl border border-[var(--rule)]">
            <span className="text-[10px] text-[var(--ink-3)] block font-mono">
              {t('ui.ship.velocitaNavigazione')}
            </span>
            <span className="font-mono font-bold text-cyan-300">{ship.speedKnots} {t('common.knots')}</span>
          </div>
          <div className="bg-[var(--rule)]/40 p-2.5 rounded-xl border border-[var(--rule)]">
            <span className="text-[10px] text-[var(--ink-3)] block font-mono">
              {t('ui.ship.rottaHeading')}
            </span>
            <span className="font-mono font-bold text-sky-400">{ship.heading}°</span>
          </div>
        </div>

        {/* Identifiers Footer */}
        <div className="pt-2 border-t border-[var(--rule)] flex items-center justify-between text-[11px] font-mono text-[var(--ink-3)]">
          <span>IMO: {ship.imo} · MMSI: {ship.mmsi}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 text-white font-medium hover:bg-cyan-400 transition-all cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
