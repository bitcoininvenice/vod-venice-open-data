'use client';

import React, { useEffect, useState } from 'react';
import { X, Plane, Navigation, Compass, Waves, Bus, Wind, Thermometer, Cloud, Check, Copy } from 'lucide-react';
import { FlightItem, AirportMetarData } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge';
import { InfoPanel } from '@/components/ui/InfoPanel';
import { startPolling } from '@/lib/polling';
import type { AirportBoard, BoardRow } from '@/lib/airportBoard';

/** Sito ufficiale dell'aeroporto (orari dei voli: non sono dati aperti, solo il link) */
const AIRPORT_SITE = 'https://www.veneziaairport.it';

/** Partenze e arrivi di bus, Alilaguna e FlixBus nei prossimi 90 minuti (/api/aeroporto), ogni minuto. */
const AirportConnections: React.FC = () => {
  const { t, language } = useTranslation();
  const [board, setBoard] = useState<AirportBoard | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<'departures' | 'arrivals'>('departures');
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch('/api/aeroporto')
        .then((r) => r.json())
        .then((j) => {
          if (cancelled) return;
          setBoard(j.success ? { departures: j.departures, arrivals: j.arrivals } : null);
          setFailed(!j.success);
        })
        .catch(() => !cancelled && setFailed(true));
    const stop = startPolling(load, 60_000);
    return () => {
      cancelled = true;
      stop();
    };
  }, []);
  const locale = language === 'it' ? 'it-IT' : 'en-GB';
  const hhmm = (ms: number) => new Date(ms).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
  const rows: BoardRow[] = board ? board[tab] : [];
  return (
    <section className="flex flex-col gap-2" data-testid="airport-board" aria-label={t('ui.airportBoard.title')}>
      <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
        <Bus className="w-4 h-4 text-emerald-400" /> {t('ui.airportBoard.title')}
        <ProvenanceBadge kind="schedule-simulation" detail="GTFS" />
      </span>
      <div className="flex gap-1.5" role="tablist">
        {(['departures', 'arrivals'] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`px-2.5 py-1 rounded-lg text-[11px] border cursor-pointer ${tab === k ? 'bg-sky-500/20 border-sky-500/50 text-sky-200 font-semibold' : 'border-[var(--rule)] text-[var(--ink-2)]'}`}
          >
            {t(`ui.airportBoard.${k}`)}
            {board && <span className="ml-1 font-mono">{board[k].length}</span>}
          </button>
        ))}
      </div>
      {!board && !failed && <div className="h-10 rounded-xl bg-[var(--rule)]/30 animate-pulse" aria-busy="true" />}
      {failed && <p className="text-[11px] text-[var(--ink-3)]">{t('ui.airportBoard.unavailable')}</p>}
      {board && rows.length === 0 && <p className="text-[11px] text-[var(--ink-3)]">{t(`ui.airportBoard.none_${tab}`)}</p>}
      {rows.length > 0 && (
        <ul className="flex flex-col divide-y divide-[var(--rule)] text-xs max-h-56 overflow-y-auto pr-1" data-testid={`airport-board-${tab}`}>
          {rows.map((r, i) => (
            <li key={`${r.kind}-${r.line}-${r.at}-${i}`} className="py-1.5 flex items-center gap-2">
              <span className="font-mono font-bold text-[var(--ink)] w-11 shrink-0">{hhmm(r.at)}</span>
              <span
                className="px-1.5 py-0.5 rounded-md font-mono font-bold text-[11px] min-w-[2.2rem] text-center border border-black/15 shrink-0"
                style={r.color ? { background: r.color, color: '#fff' } : undefined}
              >
                {r.line}
              </span>
              <span className="flex-1 min-w-0 truncate text-[var(--ink-2)]">
                {tab === 'departures' ? '→' : '←'} {r.place}
              </span>
              <span className="text-[10px] text-[var(--ink-3)] shrink-0">{t(`ui.airportBoard.kind_${r.kind}`)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[10px] text-[var(--ink-3)] leading-relaxed">
        {t('ui.airportBoard.note')}{' '}
        <a href={AIRPORT_SITE} target="_blank" rel="noopener noreferrer" className="underline">
          veneziaairport.it
        </a>
      </p>
    </section>
  );
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
  const { t } = useTranslation();
  const [copiedMetar, setCopiedMetar] = useState(false);
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
    <InfoPanel open={isOpen} onClose={onClose} labelledBy="airport-modal-title" layer="showFlights" accent="border-sky-500/40">
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
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 motion-safe:animate-pulse" /> {t('airportModal.active')}
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
            {t('ui.airport.metarLipzTemporaneamenteNonDisponibile')}
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
                  {metar.flightCategory} ({t(`ui.airport.flightCat_${metar.flightCategory}`)})
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
                title={t('ui.airport.copiaCodiceMetar')}
                className="ml-2 p-1 rounded-lg hover:bg-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)] shrink-0 transition-colors cursor-pointer"
              >
                {copiedMetar ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Weather Breakdown Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
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
                {new Date(metar.observationTime).toLocaleString(t('ui.airport.itIt'), {
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
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-sky-500/20 flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-sky-300">{t('airportModal.mainRunway')}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
                  {t('ui.airport.principale')}
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
                  {t('ui.airport.secondaria')}
                </span>
              </div>
              <span className="text-[11px] text-[var(--ink-2)]">{t('ui.airport.dimensionsSecondary')}</span>
              <span className="text-[11px] text-[var(--ink-2)]">{t('airportModal.surface')}</span>
              <span className="text-[10px] text-[var(--ink-3)] font-mono font-medium">{t('airportModal.parallelUse')}</span>
            </div>
          </div>
        </div>

        <AirportConnections />

        {/* Intermodal Connections */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-emerald-400" /> {t('airportModal.intermodalTitle')}
          </span>
          <div className="grid grid-cols-1 gap-2 text-xs">
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
                {t('ui.airport.nessunAereoRilevatoOpenskyNell')}
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
    </InfoPanel>
  );
};
