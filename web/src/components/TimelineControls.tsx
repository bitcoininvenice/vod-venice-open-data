'use client';

import React, { useState } from 'react';
import {
  Play,
  Pause,
  Calendar,
  Clock,
  Waves,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Ship,
  Share2,
  Check,
  Thermometer
} from 'lucide-react';
import type { CityAirTemperature, DayType } from '@/lib/types';
import { formatTimeParts, getSolarPhase } from '@/lib/solar';
import { useTranslation } from '@/lib/i18n';

export interface TimelineControlsProps {
  currentTimeSeconds: number;
  onTimeChange: (seconds: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  selectedDay: DayType;
  onDayChange: (day: DayType) => void;
  // Contextual Transit Props
  showVehicles?: boolean;
  showAlilaguna?: boolean;
  actvTripsCount?: number;
  alilagunaBoatsCount?: number;
  peakCount?: number;
  peakTime?: string;
  // Contextual Tide Props
  showTide?: boolean;
  tideLevel?: number | null;
  /** Temperatura dell'aria nel centro storico (mostrata solo all'ora attuale) */
  airTemp?: CityAirTemperature | null;
  // Live sync
  onSyncLiveTime?: () => void;
  isLiveSynced?: boolean;
  // Share
  onShare?: () => Promise<boolean | void> | void;
  hasActiveLayers?: boolean;
  onOpenTideModal?: () => void;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  currentTimeSeconds,
  onTimeChange,
  isPlaying,
  onTogglePlay,
  speed,
  onSpeedChange,
  selectedDay,
  onDayChange,
  showVehicles = false,
  showAlilaguna = false,
  actvTripsCount,
  alilagunaBoatsCount,
  peakCount,
  peakTime,
  showTide = false,
  tideLevel,
  airTemp,
  onSyncLiveTime,
  isLiveSynced,
  onShare,
  hasActiveLayers = false,
  onOpenTideModal
}) => {
  const { t, language } = useTranslation();
  const [isExpandedMobile, setIsExpandedMobile] = useState<boolean>(false);
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const copied = shareState === 'copied';
  const sliderValue = Math.floor(currentTimeSeconds / 60);

  const handleShareClick = async () => {
    if (!onShare) return;
    let ok = false;
    try {
      ok = (await onShare()) !== false;
    } catch (err) {
      console.error('Share action failed:', err);
    }
    setShareState(ok ? 'copied' : 'failed');
    setTimeout(() => setShareState('idle'), 2500);
  };

  // Solar Phase & Astronomical Ephemeris for Venice
  const solarPhase = getSolarPhase(currentTimeSeconds);
  const timeParts = formatTimeParts(currentTimeSeconds);

  // Contextual calculations
  const isTransitActive = Boolean(showVehicles || showAlilaguna);
  // "…" finché la simulazione da orario non è caricata
  const effectiveActv = actvTripsCount ?? '…';
  const effectiveAli = alilagunaBoatsCount ?? 0;
  const isTideActive = Boolean(showTide);

  const dayLabels: Record<DayType, string> = {
    weekday: t('timeline.weekday'),
    saturday: t('timeline.saturday'),
    sunday: t('timeline.sunday')
  };

  const speedOptions = [
    { val: 1, label: t('ui.timeline.n1Reale') },
    { val: 5, label: t('ui.timeline.n5Naturale') },
    { val: 20, label: t('ui.timeline.n20Fluido') },
    { val: 180, label: '180×' },
    { val: 720, label: '720×' },
  ];

  const renderSolarIcon = () => {
    switch (solarPhase.icon) {
      case 'sun':
        return <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'sunrise':
        return <Sunrise className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
      case 'sunset':
        return <Sunset className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'moon':
      default:
        return <Moon className="w-3.5 h-3.5 text-indigo-300 shrink-0" />;
    }
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-col gap-2.5 sm:gap-3 transition-all duration-200">
      {/* Top row: Clock, Solar Phase, Contextual Badges, Play/Pause, Day Selector */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--rule)] pb-2 sm:pb-3">
        {/* Left Section: Urban Clock, Live Button, Solar Ephemeris & Contextual Layer Chips */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Digital Clock */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 shrink-0" />
            <div className="flex items-baseline font-mono tracking-tight tabular text-[var(--ink)]">
              <span className="text-xl sm:text-2xl font-bold">
                {timeParts.hoursMinutes}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[var(--ink-2)] ml-0.5 sm:ml-1">
                :{timeParts.seconds}
              </span>
            </div>
          </div>

          {/* ORA LIVE Sync Button */}
          {onSyncLiveTime && (
            <button
              type="button"
              onClick={onSyncLiveTime}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono font-medium whitespace-nowrap shrink-0 border transition-all cursor-pointer ${
                isLiveSynced
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm'
                  : 'bg-[var(--rule)]/60 text-[var(--ink-2)] border-[var(--rule)] hover:text-[var(--ink)]'
              }`}
              title={t('ui.timeline.agganciaAllOrarioEsattoAttuale')}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                {isLiveSynced && (
                  <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLiveSynced ? 'bg-emerald-400' : 'bg-[var(--ink-3)]'}`} />
              </span>
              <span className="text-[11px] sm:text-xs">{t('timeline.liveNow')}</span>
            </button>
          )}

          <div className="h-5 w-px bg-[var(--rule)] hidden sm:block" />

          {/* Urban Core: Solar Phase Badge (Always Visible) */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono bg-[var(--rule)]/50 border border-[var(--rule)] text-[var(--ink-2)] shrink-0"
            title={t('ui.timeline.orologioUrbanoVenezia')}
          >
            {renderSolarIcon()}
            <span className="font-medium text-[var(--ink)]">{t(solarPhase.labelKey)}</span>
            <span className="hidden md:inline text-[var(--ink-3)]">·</span>
            <span className="hidden md:inline text-[var(--ink-3)]">
              {t(solarPhase.targetLabelKey)} {solarPhase.targetTime}
            </span>
            {/* Temperatura misurata adesso: con l'orario spostato non corrisponderebbe all'ora mostrata */}
            {isLiveSynced && airTemp && (
              <span
                className="flex items-center gap-1 pl-1.5 ml-0.5 border-l border-[var(--rule)]"
                title={t('ui.timeline.airTempTitle', { station: airTemp.stationName, time: airTemp.observedAt.slice(11, 16) })}
                data-testid="timeline-air-temp"
              >
                <Thermometer className="w-3.5 h-3.5 text-rose-300 shrink-0" aria-hidden />
                <span className="font-medium text-[var(--ink)] tabular">{airTemp.celsius.toLocaleString(language === 'it' ? 'it-IT' : 'en-GB', { maximumFractionDigits: 1 })}°</span>
              </span>
            )}
          </div>

          {/* Contextual Tide Badge (Visible only when Tide / MOSE layer is active) */}
          {isTideActive && (
            <button
              type="button"
              onClick={onOpenTideModal}
              className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-[var(--ink-2)] shrink-0 animate-in fade-in duration-150 cursor-pointer transition-all"
              title={t('ui.timeline.tideButtonTitle')}
            >
              <Waves className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-[var(--ink-3)]">{t('ui.timeline.mareaPuntaSalute')}:</span>
              {tideLevel !== null && tideLevel !== undefined ? (
                <span className={`font-bold tabular ${tideLevel >= 80 ? 'text-amber-400' : 'text-blue-300'}`}>
                  {tideLevel > 0 ? `+${tideLevel}` : tideLevel} cm
                </span>
              ) : (
                <span className="text-[var(--ink-3)] font-mono">{t('ui.timeline.mareaNonDisponibile')}</span>
              )}
            </button>
          )}

          {/* Contextual Transit Badge (Visible only when ACTV or Alilaguna layers are active) */}
          {isTransitActive && (
            <div className="hidden lg:flex items-center gap-2 whitespace-nowrap pl-1 animate-in fade-in duration-150">
              <Ship className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div className="text-xs font-mono text-[var(--ink-2)]">
                {showVehicles && showAlilaguna ? (
                  <span>
                    <span className="text-[var(--ink-3)]">{t('ui.timeline.flottaActv')}:</span>{' '}
                    <strong className="text-[var(--ink)] tabular">{effectiveActv}</strong>
                    <span className="text-[var(--ink-3)] mx-1">·</span>
                    <span className="text-[var(--ink-3)]">{t('ui.timeline.flottaAlilaguna')}:</span>{' '}
                    <strong className="text-[var(--ink)] tabular">{effectiveAli}</strong>
                  </span>
                ) : showVehicles ? (
                  <span>
                    <strong className="text-[var(--ink)] tabular">{effectiveActv}</strong>{' '}
                    <span className="text-[var(--ink-2)]" title={t('ui.timeline.corseServizioSecondoLOrario')}>
                      {t('ui.timeline.corseOrario')}
                    </span>
                  </span>
                ) : (
                  <span>
                    <strong className="text-[var(--ink)] tabular">{effectiveAli}</strong>{' '}
                    <span className="text-[var(--ink-2)]">{t('ui.timeline.battelliServizio')}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Section: Share button, Play/Pause button, Mobile Expander, Desktop Day Selector */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Share Button (appare solo quando c'è almeno 1 layer selezionato) */}
          {onShare && hasActiveLayers && (
            <button
              type="button"
              onClick={handleShareClick}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl font-medium text-xs transition-all cursor-pointer border ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                  : 'bg-[var(--rule)]/70 text-[var(--ink-2)] hover:text-[var(--ink)] border-[var(--rule)] hover:bg-[var(--rule)]'
              }`}
              title={copied ? t('timeline.shareSuccess') : shareState === 'failed' ? t('timeline.shareFailed') : t('timeline.share')}
              aria-live="polite"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline text-emerald-400 font-medium">
                    {t('timeline.shareSuccess')}
                  </span>
                </>
              ) : (
                <>
                  <Share2 className={`w-3.5 h-3.5 ${shareState === 'failed' ? 'text-rose-400' : 'text-cyan-400'}`} />
                  <span className="hidden sm:inline">
                    {shareState === 'failed' ? t('timeline.shareFailed') : t('timeline.share')}
                  </span>
                </>
              )}
            </button>
          )}

          {/* Quick Play/Pause button */}
          <button
            type="button"
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-400'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('ui.timeline.pausa')}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">{t('ui.timeline.avvia')}</span>
              </>
            )}
          </button>

          {/* Mobile expand button */}
          <button
            type="button"
            onClick={() => setIsExpandedMobile((p) => !p)}
            className="flex xl:hidden items-center gap-1 px-2 py-1.5 rounded-xl bg-[var(--rule)]/70 text-[var(--ink-2)] hover:text-[var(--ink)] border border-[var(--rule)] text-xs font-mono cursor-pointer"
            title={t('ui.timeline.mostraOpzioniVelocitaCalendario')}
          >
            <span>{speed}×</span>
            {isExpandedMobile ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Desktop Day Selector (Contextual: visible only if ACTV GTFS layer is active) */}
          {showVehicles && (
            <div className="hidden xl:flex items-center gap-1 bg-[var(--rule)]/60 p-1 rounded-xl border border-[var(--rule)] animate-in fade-in duration-150">
              <Calendar className="w-3.5 h-3.5 text-[var(--ink-3)] ml-1 mr-1" />
              {(['weekday', 'saturday', 'sunday'] as DayType[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDayChange(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedDay === d
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                  }`}
                >
                  {dayLabels[d]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle row: Interactive Time Scrubber Slider (00:00 - 24:00) */}
      <div className="flex flex-col gap-1">
        <div className="relative w-full py-1">
          <input
            type="range"
            min={0}
            max={1439}
            step={1}
            value={sliderValue}
            onChange={(e) => onTimeChange(Number(e.target.value) * 60)}
            className="w-full h-2 rounded-lg cursor-ew-resize appearance-none"
            aria-label={t('ui.timeline.orarioGiorno')}
          />
        </div>

        {/* Ticks for 24h timeline */}
        <div className="flex justify-between text-[10px] sm:text-[11px] font-mono text-[var(--ink-3)] px-1">
          <span>00:00</span>
          <span className="hidden sm:inline">04:00</span>
          <span>08:00</span>
          <span>12:00</span>
          <span>16:00</span>
          <span className="hidden sm:inline">20:00</span>
          <span>24:00</span>
        </div>
      </div>

      {/* Bottom row / Expandable section on Mobile */}
      <div
        className={`${
          isExpandedMobile ? 'flex' : 'hidden xl:flex'
        } flex-col md:flex-row flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[var(--rule)]/60 animate-in fade-in duration-150`}
      >
        {/* Mobile Tide Badge (shown in expanded drawer if small screen) */}
        {isTideActive && (
          <div className="flex sm:hidden items-center justify-between w-full text-xs font-mono bg-blue-500/10 p-2 rounded-lg border border-blue-500/25">
            <span className="flex items-center gap-1.5 text-blue-300">
              <Waves className="w-3.5 h-3.5" />
              <span>{t('ui.timeline.mareaPuntaSalute')}:</span>
            </span>
            <span className="font-bold tabular text-[var(--ink)]">
              {tideLevel !== null && tideLevel !== undefined ? `${tideLevel > 0 ? `+${tideLevel}` : tideLevel} cm` : t('ui.timeline.mareaNonDisponibile')}
            </span>
          </div>
        )}

        {/* Mobile Day Selector (Contextual: when expanded and ACTV layer is active) */}
        {showVehicles && (
          <div className="flex xl:hidden items-center justify-between w-full md:w-auto gap-2">
            <span className="text-[11px] text-[var(--ink-3)] font-mono">{t('ui.timeline.giorno')}</span>
            <div className="flex items-center gap-1 bg-[var(--rule)]/60 p-0.5 rounded-lg border border-[var(--rule)] flex-1 justify-end">
              {(['weekday', 'saturday', 'sunday'] as DayType[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDayChange(d)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    selectedDay === d
                      ? 'bg-cyan-500 text-white'
                      : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                  }`}
                >
                  {dayLabels[d]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Speed Presets (Always active for time travel across 24h) */}
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          <div className="flex items-center gap-1 bg-[var(--rule)]/60 p-0.5 rounded-lg border border-[var(--rule)] w-full md:w-auto justify-between md:justify-start">
            <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono px-1.5 hidden sm:inline">
              {t('timeline.speed')}
            </span>
            {speedOptions.map((s) => (
              <button
                key={s.val}
                type="button"
                onClick={() => onSpeedChange(s.val)}
                className={`px-2 py-0.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
                  speed === s.val
                    ? 'bg-cyan-500 text-white font-semibold'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contextual Metric or Urban Astronomical Footprint */}
        {showVehicles ? (
          <div className="flex items-center justify-between w-full md:w-auto text-[11px] sm:text-xs text-[var(--ink-2)] font-mono">
            <span className="md:hidden">
              {t('ui.timeline.corseOrario2')}{' '}
              <strong className="text-emerald-400 tabular">{effectiveActv}</strong>
            </span>
            {peakCount !== undefined && peakTime && (
              <span>
                {t('ui.timeline.picco')}{' '}
                <span className="text-cyan-400 font-bold tabular">{peakCount}</span>{' '}
                {t('ui.timeline.corseAlle')}{' '}
                <span className="text-[var(--ink)] font-bold tabular">{peakTime}</span>
              </span>
            )}
          </div>
        ) : showAlilaguna ? (
          <div className="flex items-center justify-between w-full md:w-auto text-[11px] sm:text-xs text-[var(--ink-2)] font-mono">
            <span>
              {t('ui.timeline.flottaAlilaguna')}:{' '}
              <strong className="text-teal-400 tabular">{effectiveAli}</strong> {t('ui.timeline.battelliServizio')}
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center text-[11px] text-[var(--ink-3)] font-mono">
            <span>45.437° N, 12.335° E · Laguna di Venezia</span>
          </div>
        )}
      </div>
    </div>
  );
};
