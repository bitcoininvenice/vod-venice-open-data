'use client';

import React from 'react';
import { X, Anchor, ExternalLink } from 'lucide-react';
import { ShipItem } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';
import { useDialogA11y } from '@/components/ui/useDialogA11y';

interface ShipDetailModalProps {
  ship: ShipItem | null;
  onClose: () => void;
}

/** Scheda di una nave ricevuta via AIS: solo i dati trasmessi dalla nave, con l'ora dell'ultimo segnale. */
export const ShipDetailModal: React.FC<ShipDetailModalProps> = ({ ship, onClose }) => {
  const { t, language } = useTranslation();
  const panelRef = useDialogA11y(ship !== null, onClose);
  if (!ship) return null;
  const s = (key: string, params?: Record<string, string | number>) => t(`ui.ship.${key}`, params);
  const locale = language === 'it' ? 'it-IT' : 'en-GB';
  const lastSeen = new Date(ship.lastSeen).toLocaleString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });

  const rows: Array<[string, string | number | null]> = [
    [s('speed'), ship.speedKnots !== null ? `${ship.speedKnots} kn` : null],
    [s('course'), ship.courseDeg !== null ? `${ship.courseDeg}°` : null],
    [s('heading'), ship.heading !== null ? `${ship.heading}°` : null],
    [s('navStatus'), ship.navStatus ? s(`nav_${ship.navStatus}`) : null],
    [s('destination'), ship.destination],
    [s('eta'), ship.eta],
    [s('length'), ship.lengthMeters !== null ? `${ship.lengthMeters} m` : null],
    [s('draught'), ship.draughtMeters !== null ? `${ship.draughtMeters} m` : null],
    [s('callSign'), ship.callSign],
    ['IMO', ship.imo],
    ['MMSI', ship.mmsi],
    [s('position'), `${ship.lat.toFixed(5)}, ${ship.lon.toFixed(5)}`],
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ship-modal-title"
        tabIndex={-1}
        className="glass-panel w-full max-w-lg rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 border border-cyan-500/40 max-h-[88vh] overflow-y-auto outline-none"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--rule)] pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40 shrink-0">
              <Anchor className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {s(`category_${ship.category}`)}
              </span>
              <h2 id="ship-modal-title" className="text-lg font-bold text-[var(--ink)] truncate mt-1">{ship.name}</h2>
              <span className="text-[11px] font-mono text-[var(--ink-3)]">{s('lastSeen', { time: lastSeen })}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--rule)] text-[var(--ink-2)] cursor-pointer" aria-label={t('common.close')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-2 text-xs">
          {rows.filter(([, v]) => v !== null && v !== '').map(([label, value]) => (
            <div key={label} className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]">
              <dt className="text-[10px] uppercase font-mono text-[var(--ink-3)]">{label}</dt>
              <dd className="font-mono font-bold text-[var(--ink)] break-words">{value}</dd>
            </div>
          ))}
        </dl>

        {ship.category === 'PASSENGER' && (ship.lengthMeters ?? 0) >= 180 && (
          <p className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">{s('largeShipNotice')}</p>
        )}

        <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">{s('aisNote')}</p>
        {ship.imo && (
          <a
            href={`https://www.marinetraffic.com/en/ais/details/ships/imo:${ship.imo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
          >
            {s('moreInfo')} <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};
