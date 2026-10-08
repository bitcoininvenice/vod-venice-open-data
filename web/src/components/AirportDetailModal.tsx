'use client';

import React, { useState } from 'react';
import { X, Plane, Navigation, Compass, Waves, Bus, Wind, Thermometer, Cloud, Check, Copy } from 'lucide-react';
import { FlightItem, AirportMetarData } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge';
import { useDialogA11y } from '@/components/ui/useDialogA11y';

const FLIGHT_CATEGORY_LABEL: Record<AirportMetarData['flightCategory'], { it: string; en: string }> = {
  VFR: { it: 'Volo a vista', en: 'Visual flight rules' },
  MVFR: { it: 'Volo a vista marginale', en: 'Marginal VFR' },
  IFR: { it: 'Volo strumentale', en: 'Instrument flight rules' },
  LIFR: { it: 'Strumentale, condizioni basse', en: 'Low IFR' },
};

interface AirportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  flights: FlightItem[];
  /** METAR reale (NOAA AWC); null se non disponibile */
  metar: AirportMetarData | null;
}

export const AirportDetailModal: React.FC<AirportDetailModalProps> = ({
  isOpen,
  onClose,
  flights,
  metar
}) => {
  const { language, t } = useTranslation();
  const [copiedMetar, setCopiedMetar] = useState(false);
  const panelRef = useDialogA11y(isOpen, onClose);
  if (!isOpen) return null;

  const handleCopyMetar = () => {
    if (metar?.rawMetar) {
      navigator.clipboard.writeText(metar.rawMetar);
      setCopiedMetar(true);
      setTimeout(() => setCopiedMetar(false), 2000);
    }
  };

  const activeArrivals = flights.filter((f) => f.status === 'APPROACH');
  const activeDepartures = flights.filter((f) => f.status === 'DEPARTURE');
  const activeTaxi = flights.filter((f) => f.status === 'TAXI' || f.onGround);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="airport-modal-title"
        tabIndex={-1}
        className="glass-panel w-full max-w-lg rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-3.5 sm:gap-4 border border-sky-500/40 animate-in fade-in zoom-in-95 duration-200 max-h-[88vh] overflow-y-auto outline-none"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--rule)] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/40 shadow-lg shadow-sky-500/10">
              <Plane className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {t('airportModal.iataIcao')}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {t('airportModal.active')}
                </span>
              </div>
              <h3 id="airport-modal-title" className="text-lg font-bold text-[var(--ink)] leading-snug">
                {t('airportModal.title')}
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

        {/* Airport Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 text-xs">
          <div className="bg-[var(--rule)]/40 p-2.5 rounded-xl border border-[var(--rule)]">
            <span className="text-[10px] text-[var(--ink-3)] block font-mono">{t('airportModal.passengersYear')}</span>
            <span className="font-mono font-bold text-sky-400 text-sm">~11.5 M</span>
            <span className="text-[9px] text-[var(--ink-3)] block">{t('airportModal.passengersRank')}</span>
          </div>
          <div className="bg-[var(--rule)]/40 p-2.5 rounded-xl border border-[var(--rule)]">
            <span className="text-[10px] text-[var(--ink-3)] block font-mono">{t('airportModal.elevation')}</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">2 m (7 ft)</span>
            <span className="text-[9px] text-[var(--ink-3)] block">{t('airportModal.lagoonEdge')}</span>
          </div>
          <div className="bg-[var(--rule)]/40 p-2.5 rounded-xl border border-[var(--rule)]">
            <span className="text-[10px] text-[var(--ink-3)] block font-mono">{t('airportModal.hubManager')}</span>
            <span className="font-mono font-bold text-[var(--ink)] text-sm">SAVE S.p.A.</span>
            <span className="text-[9px] text-[var(--ink-3)] block">{t('airportModal.hubRegion')}</span>
          </div>
        </div>

        {/* METAR LIPZ reale (NOAA Aviation Weather Center) */}
        {!metar && (
          <div className="p-3 rounded-2xl bg-[var(--rule)]/30 border border-[var(--rule)] text-xs text-[var(--ink-2)]">
            {language === 'it'
              ? 'METAR LIPZ temporaneamente non disponibile.'
              : 'LIPZ METAR temporarily unavailable.'}
          </div>
        )}
        {metar && (
          <div className="flex flex-col gap-2 p-3 rounded-2xl bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/25">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-sky-400" /> {t('airportModal.metarTitle')}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-500/30">
                  {metar.flightCategory} ({FLIGHT_CATEGORY_LABEL[metar.flightCategory][language === 'it' ? 'it' : 'en']})
                </span>
                <span className="text-[10px] font-mono text-[var(--ink-3)]">
                  QNH {metar.qnhHpa} hPa
                </span>
              </div>
            </div>

            {/* Raw METAR String Box */}
            <div className="relative group bg-[var(--surface-sunken)] p-2 rounded-xl border border-[var(--rule)] font-mono text-[11px] text-sky-600 dark:text-sky-300 flex items-center justify-between">
              <span className="select-all tracking-wide break-all font-semibold">{metar.rawMetar}</span>
              <button
                type="button"
                onClick={handleCopyMetar}
                title={language === 'it' ? 'Copia codice METAR' : 'Copy METAR code'}
                className="ml-2 p-1 rounded-lg hover:bg-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)] shrink-0 transition-colors cursor-pointer"
              >
                {copiedMetar ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Weather Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-[var(--rule)]/30 p-2 rounded-xl border border-[var(--rule)] flex flex-col">
                <span className="text-[10px] text-[var(--ink-3)] font-mono flex items-center gap-1">
                  <Wind className="w-3 h-3 text-sky-400" /> {t('airportModal.groundWind')}
                </span>
                <span className="font-mono font-bold text-[var(--ink)] mt-0.5">
                  {metar.windSpeedKnots} kt ({metar.windSpeedKmh} km/h)
                </span>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">
                  {metar.windDirectionDeg}° · {metar.windCompass}
                </span>
              </div>

              <div className="bg-[var(--rule)]/30 p-2 rounded-xl border border-[var(--rule)] flex flex-col">
                <span className="text-[10px] text-[var(--ink-3)] font-mono flex items-center gap-1">
                  <Compass className="w-3 h-3 text-amber-400" /> {t('airportModal.crosswind')}
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {metar.crosswindKnots} kt
                </span>
                <span className="text-[10px] text-[var(--ink-2)] font-mono">
                  {t('airportModal.headwind')} {metar.headwindKnots} kt
                </span>
              </div>

              <div className="bg-[var(--rule)]/30 p-2 rounded-xl border border-[var(--rule)] flex flex-col">
                <span className="text-[10px] text-[var(--ink-3)] font-mono flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-rose-400" /> {t('airportModal.tempDew')}
                </span>
                <span className="font-mono font-bold text-[var(--ink)] mt-0.5">
                  {metar.temperatureCelsius}°C / {metar.dewPointCelsius}°C
                </span>
                <span className="text-[10px] text-[var(--ink-2)] font-mono">
                  {t('airportModal.humidity')} {metar.relativeHumidityPercent}%
                </span>
              </div>

              <div className="bg-[var(--rule)]/30 p-2 rounded-xl border border-[var(--rule)] flex flex-col">
                <span className="text-[10px] text-[var(--ink-3)] font-mono flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-cyan-400" /> {t('airportModal.visibilityClouds')}
                </span>
                <span className="font-mono font-bold text-[var(--ink)] mt-0.5">
                  {metar.visibilityMeters >= 10000 ? t('airportModal.cavok') : `${metar.visibilityMeters} m`}
                </span>
                <span className="text-[9px] text-[var(--ink-3)] truncate" title={metar.cloudsDescription}>
                  {metar.cloudsDescription}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[var(--ink-3)] pt-1 border-t border-[var(--rule)]">
              <span>
                METAR ICAO · NOAA Aviation Weather Center ·{' '}
                {new Date(metar.observationTime).toLocaleString(language === 'it' ? 'it-IT' : 'en-GB', {
                  timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                })}
              </span>
              <span className="font-mono">{metar.activeRunway}</span>
            </div>
          </div>
        )}

        {/* Runways specifications */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-sky-400" /> {t('airportModal.runwaysTitle')}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-sky-500/20 flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-sky-300">{t('airportModal.mainRunway')}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
                  {language === 'it' ? 'Principale' : 'Main'}
                </span>
              </div>
              <span className="text-[11px] text-[var(--ink-2)]">{t('airportModal.dimensions')}</span>
              <span className="text-[11px] text-[var(--ink-2)]">{t('airportModal.surface')}</span>
              <span className="text-[10px] text-emerald-400 font-mono font-medium">{t('airportModal.ilsCategory')}</span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-[var(--ink)]">{t('airportModal.secondaryRunway')}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--rule)] text-[var(--ink-3)] font-mono">
                  {language === 'it' ? 'Secondaria' : 'Secondary'}
                </span>
              </div>
              <span className="text-[11px] text-[var(--ink-2)]">Dimensioni: 2,780 m × 45 m</span>
              <span className="text-[11px] text-[var(--ink-2)]">{t('airportModal.surface')}</span>
              <span className="text-[10px] text-[var(--ink-3)] font-mono font-medium">{t('airportModal.parallelUse')}</span>
            </div>
          </div>
        </div>

        {/* Intermodal Connections */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-emerald-400" /> {t('airportModal.intermodalTitle')}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 font-semibold text-blue-400">
                <Waves className="w-3.5 h-3.5" /> {t('airportModal.waterDockTitle')}
              </div>
              <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
                {t('airportModal.waterDockDesc')}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <Bus className="w-3.5 h-3.5" /> {t('airportModal.busTerminalTitle')}
              </div>
              <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
                {t('airportModal.busTerminalDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Live ADS-B Flights in vicinity */}
        <div className="flex flex-col gap-2 pt-1 border-t border-[var(--rule)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
              <Plane className="w-4 h-4 text-sky-400" /> {t('airportModal.trackedFlightsTitle')} ({flights.length})
              <ProvenanceBadge kind="live" detail="OpenSky" />
            </span>
            <span className="text-[10px] font-mono text-cyan-400">
              {activeArrivals.length} Arr · {activeDepartures.length} Dep · {activeTaxi.length} Taxi
            </span>
          </div>

          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
            {flights.length === 0 && (
              <p className="text-[11px] text-[var(--ink-3)] p-2">
                {language === 'it'
                  ? 'Nessun aereo rilevato da OpenSky nell\'area in questo momento (o servizio non raggiungibile).'
                  : 'No aircraft currently detected by OpenSky in the area (or service unreachable).'}
              </p>
            )}
            {flights.map((f) => (
              <div
                key={f.icao24}
                className="flex items-center justify-between p-2 rounded-lg bg-[var(--rule)]/40 hover:bg-[var(--rule)]/70 text-xs border border-[var(--rule)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sky-400">{f.callsign}</span>
                  <span className="text-[11px] text-[var(--ink-2)]">({f.country})</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-[var(--ink-3)]">{f.altitudeMeters} m</span>
                  <span className="text-emerald-400">{f.speedKmh} km/h</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      f.status === 'APPROACH'
                        ? 'bg-amber-500/20 text-amber-300'
                        : f.status === 'DEPARTURE'
                        ? 'bg-sky-500/20 text-sky-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {f.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--rule)] text-xs text-[var(--ink-3)]">
          <span>{t('common.coordinates')}: 45°30′19″N 12°21′07″E</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-sky-500 text-white font-medium hover:bg-sky-400 transition-all cursor-pointer shadow-lg shadow-sky-500/20"
          >
            {t('airportModal.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
