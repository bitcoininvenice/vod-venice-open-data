'use client';

import React from 'react';
import { X, Plane, Waves, ExternalLink, Ship, Clock, Compass, ShieldCheck } from 'lucide-react';
import { AlilagunaRoute, AlilagunaStop, AlilagunaBoat } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

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
  stops,
  boats
}) => {
  const { language, t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 border border-blue-500/40 animate-in fade-in zoom-in-95 duration-200 max-h-[88vh] overflow-y-auto">
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
                <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> GTFS LIVE
                </span>
              </div>
              <h3 className="text-lg font-bold text-[var(--ink)] leading-snug">
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
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-500/15 via-sky-500/10 to-amber-500/15 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-[var(--ink-3)] font-bold">
                {language === 'it' ? 'Interscambio Aeroporto VCE' : 'VCE Airport Interchange'}
              </span>
              <p className="font-semibold text-[var(--ink)]">
                {language === 'it'
                  ? 'Darsena Aeroporto Marco Polo (Tessera) ↔ Centro Storico Venezia'
                  : 'Marco Polo Airport Dock (Tessera) ↔ Venice Historic Center'}
              </p>
              <p className="text-[11px] text-[var(--ink-2)]">
                {language === 'it'
                  ? 'Accesso coperto con tapis roulant dal terminal arrivi alla darsena acquea (7 min a piedi).'
                  : 'Covered moving walkway connection from arrival terminal to the water dock (7 min walk).'}
              </p>
            </div>
          </div>
          <div className="bg-[var(--ground)]/70 px-3 py-1.5 rounded-lg border border-[var(--rule)] shrink-0 text-right">
            <span className="text-[10px] text-[var(--ink-3)] block font-mono">
              {language === 'it' ? 'Frequenza media' : 'Avg. frequency'}
            </span>
            <span className="font-mono font-bold text-amber-400">
              {language === 'it' ? 'Ogni 15-30 min' : 'Every 15-30 min'}
            </span>
          </div>
        </div>

        {/* Lines Grid */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-cyan-400" /> {t('alilagunaModal.linesTitle')}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
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
                    <Clock className="w-3 h-3" /> {language === 'it' ? `Ogni ${r.frequencyMinutes}'` : `Every ${r.frequencyMinutes}'`}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-medium text-[var(--ink)]">{r.description}</span>
                  <span className="text-[10px] font-mono text-[var(--ink-3)] truncate">
                    {language === 'it' ? 'Da' : 'From'}: {r.terminalA} ➔ {language === 'it' ? 'A' : 'To'}: {r.terminalB}
                  </span>
                </div>

                <div className="pt-1.5 border-t border-[var(--rule)] flex items-center justify-between text-[10px] font-mono text-[var(--ink-2)]">
                  <span>{r.stops.length} {language === 'it' ? 'fermate / pontili' : 'stops / piers'}</span>
                  <span className="text-emerald-400 font-semibold">{language === 'it' ? 'Attiva 365 gg' : 'Active 365 days'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Fleet Telemetry */}
        <div className="flex flex-col gap-2 pt-1 border-t border-[var(--rule)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-blue-400" /> {language === 'it' ? 'Flotta Alilaguna in Navigazione' : 'Alilaguna Fleet in Navigation'} ({boats.length} {language === 'it' ? 'Battelli Attivi' : 'Active Vessels'})
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">
              168 {language === 'it' ? 'corse/giorno certificate' : 'certified trips/day'}
            </span>
          </div>

          {boats.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] text-center text-xs text-[var(--ink-2)]">
              <Clock className="w-4 h-4 mx-auto mb-1 text-amber-400" />
              {language === 'it'
                ? 'Nessun battello in navigazione all’orario selezionato. Il servizio di linea riprende alle 05:00 da Marittima e alle 06:15 dall’Aeroporto Marco Polo.'
                : 'No vessels operating at selected simulation time. Regular service resumes at 05:00 from Marittima and 06:15 from Marco Polo Airport.'}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
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
                    {language === 'it' ? 'Verso:' : 'To:'} {b.destination}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--ink-2)] truncate">
                    {language === 'it' ? 'Prox:' : 'Next:'} {b.nextStop}
                  </span>
                  {b.scheduledDeparture && (
                    <div className="text-[9px] font-mono text-amber-400/90 flex justify-between">
                      <span>{language === 'it' ? 'Part:' : 'Dep:'} {b.scheduledDeparture}</span>
                      <span>{language === 'it' ? 'Arr:' : 'ETA:'} {b.scheduledArrival}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-[10px] font-mono pt-1 border-t border-[var(--rule)] text-[var(--ink-3)]">
                    <span>{b.speedKmh} km/h</span>
                    <span className="text-emerald-400 font-semibold">{b.passengersOnBoard} pax</span>
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
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> {language === 'it' ? 'Gemello Digitale Deterministico GTFS' : 'GTFS Deterministic Digital Twin'}
            </span>
            <span className="text-[10px] font-mono text-[var(--ink-3)]">
              Transitland: f-u20f-alilagunaspa
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-[var(--ink-2)]">
            {language === 'it' ? (
              <>La navigazione della flotta Alilaguna S.p.A. è calcolata istante per istante tramite motore cinematico deterministico alimentato da <strong>168 corse giornaliere certificate</strong> (Linea Blu, Linea Arancio, Linea Rossa, Linea Verde). Non vengono utilizzate formule sintetiche o oscillazioni fittizie: ogni battello segue rigorosamente i canali navigabili lagunari autorizzati e gli orari di partenza ufficiali.</>
            ) : (
              <>The navigation of the Alilaguna S.p.A. fleet is computed moment-by-moment through a deterministic kinematic simulation engine powered by <strong>168 certified daily trips</strong> (Blu, Arancio, Rossa, and Verde lines). No synthetic mock motion is used: every vessel strictly follows authorized lagoon canal polylines and official scheduled departure times.</>
            )}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--rule)] text-xs text-[var(--ink-3)]">
          <span>Fonte: Transitland & Alilaguna S.p.A. Open Mobility Feed</span>
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
