'use client';

import React from 'react';
import { X, Plane, Waves, ExternalLink, Ship, Clock, Compass, ShieldCheck } from 'lucide-react';
import { AlilagunaRoute, AlilagunaStop, AlilagunaBoat } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';
import { InfoPanel } from '@/components/ui/InfoPanel';
import { ALILAGUNA_FEED_META } from '@/lib/alilaguna-schedule';

interface AlilagunaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  routes: AlilagunaRoute[];
  stops: AlilagunaStop[];
  boats: AlilagunaBoat[];
}

export const AlilagunaDetailModal: React.FC<AlilagunaDetailModalProps> = ({
  isOpen,
  onClose,
  routes,
  boats
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <InfoPanel open={isOpen} onClose={onClose} labelledBy="alilaguna-modal-title" layer="showAlilaguna" accent="border-blue-500/40">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--rule)] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <Ship className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Alilaguna S.p.A.
                </span>
                <a
                  href="https://www.transit.land/feeds/f-u20f-alilagunaspa"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  Transitland: f-u20f-alilagunaspa <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <span className="text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {t('ui.alilaguna.badgeSimulated')}
                </span>
              </div>
              <h3 id="alilaguna-modal-title" className="text-lg font-bold text-[var(--ink)] leading-snug">
                {t('alilagunaModal.title')}
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

        {/* Airport Hub Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-500/15 via-sky-500/10 to-amber-500/15 border border-blue-500/30 flex flex-col items-start justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-[var(--ink-3)] font-bold">
                {t('ui.alilaguna.interscambioAeroportoVce')}
              </span>
              <p className="font-semibold text-[var(--ink)]">
                {t('ui.alilaguna.darsenaAeroportoMarcoPoloTessera')}
              </p>
              <p className="text-[11px] text-[var(--ink-2)]">
                {t('ui.alilaguna.accessoCopertoConTapisRoulant')}
              </p>
            </div>
          </div>
          <div className="bg-[var(--ground)]/70 px-3 py-1.5 rounded-lg border border-[var(--rule)] shrink-0 text-right">
            <span className="text-[10px] text-[var(--ink-3)] block font-mono">
              {t('ui.alilaguna.frequenzaMedia')}
            </span>
            <span className="font-mono font-bold text-amber-400">
              {t('ui.alilaguna.ogni1530Min')}
            </span>
          </div>
        </div>

        {/* Lines Grid */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-cyan-400" /> {t('alilagunaModal.linesTitle')}
          </span>
          <div className="grid grid-cols-1 gap-2 text-xs">
            {routes.map((r) => (
              <div
                key={r.id}
                className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-2 hover:border-cyan-500/40 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-white shadow-sm"
                      style={{ backgroundColor: r.color }}
                    >
                      {r.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {t('ui.alilaguna.ogniMinuti', { min: r.frequencyMinutes })}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-medium text-[var(--ink)]">{r.description}</span>
                  <span className="text-[10px] font-mono text-[var(--ink-3)] truncate">
                    {t('ui.alilaguna.testo')}: {r.terminalA} → {t('ui.alilaguna.testo2')}: {r.terminalB}
                  </span>
                </div>

                <div className="pt-1.5 border-t border-[var(--rule)] flex items-center justify-between text-[10px] font-mono text-[var(--ink-2)]">
                  <span>{r.stops.length} {t('ui.alilaguna.fermatePontili')}</span>
                  <span className="text-emerald-400 font-semibold">{t('ui.alilaguna.attiva365Gg')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Fleet Telemetry */}
        <div className="flex flex-col gap-2 pt-1 border-t border-[var(--rule)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-blue-400" /> {t('ui.alilaguna.flottaAlilagunaNavigazione')} ({boats.length} {t('ui.alilaguna.battelliAttivi')})
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">
              {ALILAGUNA_FEED_META.dailyTrips} {t('ui.alilaguna.corseGiornoOrario')}
            </span>
          </div>

          {boats.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] text-center text-xs text-[var(--ink-2)]">
              <Clock className="w-4 h-4 mx-auto mb-1 text-amber-400" />
              {t('ui.alilaguna.nessunBattelloNavigazioneAllorarioSelezi')}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {boats.map((b) => (
                <div
                  key={b.id}
                  className="p-2.5 rounded-xl bg-[var(--rule)]/40 border border-[var(--rule)] flex flex-col gap-1 hover:border-blue-500/40 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <strong className="text-[var(--ink)] text-xs truncate">{b.name}</strong>
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-white shrink-0 ml-1"
                      style={{ backgroundColor: b.color }}
                      title={b.lineName}
                    >
                      {b.lineCode}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 truncate">
                    {t('ui.alilaguna.verso')} {b.destination}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--ink-2)] truncate">
                    {t('ui.alilaguna.prox')} {b.nextStop}
                  </span>
                  {b.scheduledDeparture && (
                    <div className="text-[9px] font-mono text-amber-400/90 flex justify-between">
                      <span>{t('ui.alilaguna.part')} {b.scheduledDeparture}</span>
                      <span>{t('ui.alilaguna.arr')} {b.scheduledArrival}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-[10px] font-mono pt-1 border-t border-[var(--rule)] text-[var(--ink-3)]">
                    <span>{b.speedKmh} km/h</span>
                    <span>{t('ui.alilaguna.fromTimetable')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Open Data & Transitland Info Banner */}
        <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] text-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> {t('ui.alilaguna.gemelloDigitaleDeterministicoGtfs')}
            </span>
            <span className="text-[10px] font-mono text-[var(--ink-3)]">
              Transitland: f-u20f-alilagunaspa
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-[var(--ink-2)]">
            {t('ui.alilaguna.simulationNote', {
              trips: ALILAGUNA_FEED_META.dailyTrips,
              from: `${ALILAGUNA_FEED_META.validFrom.slice(6, 8)}/${ALILAGUNA_FEED_META.validFrom.slice(4, 6)}/${ALILAGUNA_FEED_META.validFrom.slice(0, 4)}`,
              to: `${ALILAGUNA_FEED_META.validTo.slice(6, 8)}/${ALILAGUNA_FEED_META.validTo.slice(4, 6)}/${ALILAGUNA_FEED_META.validTo.slice(0, 4)}`,
            })}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--rule)] text-xs text-[var(--ink-3)]">
          <span>{t('ui.alilaguna.sourceTransitland')}</span>
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
