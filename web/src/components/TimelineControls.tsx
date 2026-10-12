'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { DynamicTideState, TideSource } from '@/lib/tideCurve';
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
  Thermometer,
  Droplets,
  Plus,
  Minus,
  X,
  Wind
} from 'lucide-react';
import type { CityAirTemperature, DayType, WindField } from '@/lib/types';
import { formatTimeParts, getSolarPhase } from '@/lib/solar';
import { useTranslation } from '@/lib/i18n';
import { WIND_COLOR_STOPS } from '@/components/map/windLayer';

export interface TideSimulatorProps {
  level: number;
  formattedCm: string;
  floodedPercentText: string;
  isProtected: boolean;
  isPlayingCycle: boolean;
  onSetLevel?: (level: number) => void;
  onStepLevel: (delta: number) => void;
  onToggleCycle: () => void;
  onToggleProtection: () => void;
  onOpenModal: () => void;
  onReset: () => void;
}

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
  /** Origine del livello e stato del MOSE (misurato, stimato dalla previsione o simulato) */
  tideStatus?: Pick<DynamicTideState, 'levelSource' | 'moseStatus' | 'moseBasis' | 'forecastStale'>;
  /** Temperatura dell'aria nel centro storico (mostrata solo all'ora attuale) */
  airTemp?: CityAirTemperature | null;
  // Live sync
  onSyncLiveTime?: () => void;
  isLiveSynced?: boolean;
  // Share
  onShare?: () => Promise<boolean | void> | void;
  hasActiveLayers?: boolean;
  onOpenTideModal?: () => void;
  onStartSimulator?: () => void;
  // Contextual Wind Props
  showWind?: boolean;
  windField?: WindField | null;
  // Dock state & contextual awareness
  hasTemporalLayers?: boolean;
  simulator?: TideSimulatorProps | null;
}

const TIDE_LABEL: Record<TideSource, string> = {
  measured: 'ui.timeline.tideMeasured',
  forecast: 'ui.timeline.tideForecastEstimated',
  simulated: 'ui.timeline.tideSimulated',
  none: 'ui.timeline.tideForecastEstimated',
};

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
  tideStatus,
  airTemp,
  showWind = false,
  windField = null,
  onSyncLiveTime,
  isLiveSynced,
  onShare,
  hasActiveLayers = false,
  onOpenTideModal,
  onStartSimulator,
  hasTemporalLayers = true,
  simulator = null
}) => {
  const { t, language } = useTranslation();

  // Inizializza l'espansione: se ci sono layer temporali attivi e nessun simulatore, parte aperto;
  // se ci sono solo layer statici o e attivo il simulatore, parte compatto per lasciare massima visibilita alla mappa.
  const [isExpanded, setIsExpanded] = useState<boolean>(() => Boolean(hasTemporalLayers) && !simulator);
  const prevTemporalRef = useRef(Boolean(hasTemporalLayers));

  useEffect(() => {
    if (Boolean(hasTemporalLayers) !== prevTemporalRef.current) {
      prevTemporalRef.current = Boolean(hasTemporalLayers);
      // Quando l'utente accende un layer temporale, espandi la timeline; se li spegne tutti, richiudi
      setIsExpanded(Boolean(hasTemporalLayers) && !simulator);
    }
  }, [hasTemporalLayers, simulator]);

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

  // Sezione comune: Effemeridi solari & Meteo centro storico
  const renderSolarAndWeather = (isCompact = false) => (
    <div
      className={`flex items-center gap-1.5 px-2 ${isCompact ? 'py-0.5' : 'py-1'} rounded-lg text-xs font-mono bg-[var(--rule)]/50 border border-[var(--rule)] text-[var(--ink-2)] shrink-0`}
      title={t('ui.timeline.orologioUrbanoVenezia')}
    >
      {renderSolarIcon()}
      <span className="font-medium text-[var(--ink)]">{t(solarPhase.labelKey)}</span>
      {!isCompact && (
        <>
          <span className="hidden md:inline text-[var(--ink-3)]">·</span>
          <span className="hidden md:inline text-[var(--ink-3)]">
            {t(solarPhase.targetLabelKey)} {solarPhase.targetTime}
          </span>
        </>
      )}
      {/* Temperatura misurata adesso (confermato per test e2e) */}
      {isLiveSynced && airTemp && (
        <span
          className="flex items-center gap-1 pl-1.5 ml-0.5 border-l border-[var(--rule)]"
          title={t(airTemp.humidityPercent !== null ? 'ui.timeline.airTempHumidityTitle' : 'ui.timeline.airTempTitle', {
            station: airTemp.stationName,
            time: airTemp.observedAt.slice(11, 16),
          })}
          data-testid="timeline-air-temp"
        >
          <Thermometer className="w-3.5 h-3.5 text-rose-300 shrink-0" aria-hidden />
          <span className="font-medium text-[var(--ink)] tabular">{airTemp.celsius.toLocaleString(language === 'it' ? 'it-IT' : 'en-GB', { maximumFractionDigits: 1 })}°</span>
          {airTemp.humidityPercent !== null && (
            <>
              <Droplets className="w-3.5 h-3.5 text-sky-300 shrink-0 ml-1" aria-hidden />
              <span className="font-medium text-[var(--ink)] tabular" data-testid="timeline-humidity">
                {airTemp.humidityPercent}%<span className="sr-only"> {t('ui.timeline.humidityLabel')}</span>
              </span>
            </>
          )}
        </span>
      )}
    </div>
  );

  // Sezione comune: Pulsante di Condivisione
  const renderShareButton = () => {
    if (!onShare || !hasActiveLayers) return null;
    return (
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
    );
  };

  // Sezione comune: Badge Marea CPSM con scorciatoia rapida Simula
  const renderTideBadge = () => {
    if (!isTideActive) return null;
    return (
      <div className="flex items-center gap-1 shrink-0 animate-in fade-in duration-150">
        <button
          type="button"
          onClick={onOpenTideModal}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-[var(--ink-2)] shrink-0 cursor-pointer transition-all"
          title={t('ui.timeline.tideButtonTitle')}
        >
          <Waves className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="text-[var(--ink-3)] hidden md:inline">{t('ui.timeline.mareaPuntaSalute')}:</span>
          {tideLevel !== null && tideLevel !== undefined ? (
            <span className={`font-bold tabular ${tideLevel >= 80 ? 'text-amber-400' : 'text-blue-300'}`}>
              {tideLevel > 0 ? `+${tideLevel}` : tideLevel} cm
            </span>
          ) : (
            <span className="text-[var(--ink-3)] font-mono">{t('ui.timeline.mareaNonDisponibile')}</span>
          )}
        </button>

        {onStartSimulator && (
          <button
            type="button"
            onClick={onStartSimulator}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/35 transition-all cursor-pointer font-medium"
            title={t('ui.timeline.simulateTitle')}
          >
            <span>{t('ui.timeline.simulate')}</span>
          </button>
        )}
      </div>
    );
  };

  // Sezione comune: Badge Vento Open-Meteo
  const renderWindBadge = () => {
    if (!showWind || !windField) return null;
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono bg-teal-500/10 border border-teal-500/25 text-[var(--ink-2)] shrink-0 animate-in fade-in duration-150"
        title={`${t('ui.mapLabels.windTitle')} (${t('ui.mapLabels.windValidAt', { time: windField.validTime.slice(11, 16) })})`}
      >
        <Wind className="w-3.5 h-3.5 text-teal-400 shrink-0" />
        <span className="text-[var(--ink-3)] hidden md:inline">Vento:</span>
        <span className="font-bold text-teal-300">0–90 km/h</span>
        <span className="text-[var(--ink-3)] text-[10px] hidden lg:inline">({windField.validTime.slice(11, 16)})</span>
      </div>
    );
  };

  // 1. MODALITA SIMULATORE MAREA & MOSE INTEGRATO (Unica scheda coordinata)
  if (simulator) {
    return (
      <div className="w-full glass-panel rounded-2xl p-2.5 sm:p-3 shadow-2xl border border-cyan-500/40 flex flex-col gap-2 transition-all duration-200 animate-in fade-in duration-150">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Indicatore livello simulato */}
          <div className="flex items-center gap-2 shrink-0">
            <Waves className="w-4 h-4 text-cyan-600 dark:text-cyan-400 motion-safe:animate-pulse shrink-0" />
            <span className="text-[var(--ink-2)] text-xs sm:text-sm">
              <span className="font-semibold text-[var(--ink)]">{t('ui.floodModal.simPill')}: </span>
              <strong className={simulator.level >= 110 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-sky-700 dark:text-cyan-300 font-bold'}>
                {simulator.formattedCm}
              </strong>
              <span className="text-[11px] text-[var(--ink-2)] ml-1.5 opacity-90 whitespace-nowrap">
                {simulator.floodedPercentText}
              </span>
            </span>
            {showWind && windField && (
              <span
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-teal-400 pl-2 ml-1 border-l border-[var(--rule)]"
                title={`${t('ui.mapLabels.windTitle')} (${t('ui.mapLabels.windValidAt', { time: windField.validTime.slice(11, 16) })})`}
              >
                <Wind className="w-3 h-3 text-teal-400 shrink-0" />
                <span>0–90 km/h</span>
              </span>
            )}
          </div>

          {/* Azioni simulatore */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap ml-auto">
            {/* Step -5 / +5 cm */}
            <div className="flex items-center gap-1 border-l border-[var(--rule)] pl-1.5 sm:pl-2 shrink-0">
              <button
                type="button"
                onClick={() => simulator.onStepLevel(-5)}
                className="px-1.5 py-0.5 rounded bg-[var(--rule)]/70 hover:bg-[var(--rule)] text-[var(--ink)] text-[10px] font-mono cursor-pointer active:scale-95 border border-[var(--rule)]"
                title="-5 cm"
                aria-label="-5 cm"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => simulator.onStepLevel(5)}
                className="px-1.5 py-0.5 rounded bg-[var(--rule)]/70 hover:bg-[var(--rule)] text-[var(--ink)] text-[10px] font-mono cursor-pointer active:scale-95 border border-[var(--rule)]"
                title="+5 cm"
                aria-label="+5 cm"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Ciclo sinusoidale fluido */}
            <button
              type="button"
              onClick={simulator.onToggleCycle}
              className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono border transition-colors cursor-pointer shrink-0 ${
                simulator.isPlayingCycle
                  ? 'bg-cyan-500/20 text-cyan-800 dark:text-cyan-100 border-cyan-500/60 font-semibold shadow-sm'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 border-cyan-500/30 font-medium'
              }`}
              title={simulator.isPlayingCycle ? 'Pausa ciclo sinusoidale' : 'Avvia ciclo marea'}
            >
              {simulator.isPlayingCycle ? <Pause className="w-3 h-3 text-cyan-700 dark:text-cyan-300" /> : <Play className="w-3 h-3 text-cyan-700 dark:text-cyan-300" />}
              <span>{simulator.isPlayingCycle ? 'Pausa' : 'Avvia'}</span>
            </button>

            {/* Toggle Difesa MOSE (Sempre visibile a qualsiasi quota di marea) */}
            <button
              type="button"
              onClick={simulator.onToggleProtection}
              className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono border transition-colors cursor-pointer shrink-0 ${
                simulator.isProtected
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 border-emerald-500/40 font-semibold'
                  : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-800 dark:text-rose-200 border-rose-500/40 font-semibold'
              }`}
              title={
                simulator.isProtected
                  ? simulator.level >= 110
                    ? 'MOSE attivo: barriere alzate, laguna protetta (0% allagamento). Clicca per disattivare e vedere la laguna allagata'
                    : 'MOSE armato: difesa attiva, si alzera automaticamente sopra i 110cm. Clicca per disattivare'
                  : 'MOSE disattivato: paratie a riposo sul fondo, marea libera in laguna. Clicca per attivare'
              }
            >
              {simulator.isProtected ? 'MOSE: Difesa Attiva' : 'MOSE: Disattivato'}
            </button>

            {/* Scenari & Regolazione */}
            <button
              type="button"
              onClick={simulator.onOpenModal}
              className="px-1.5 sm:px-2 py-0.5 rounded bg-[var(--rule)]/60 hover:bg-[var(--rule)] text-[var(--ink)] border border-[var(--rule)] transition-colors cursor-pointer text-[10px] sm:text-[11px] font-medium"
              title={t('ui.floodModal.simAdjustTitle')}
            >
              {t('ui.floodModal.simAdjust')}
            </button>

            {/* Reset / Chiudi simulatore */}
            <button
              type="button"
              onClick={simulator.onReset}
              className="p-1 rounded text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--rule)] transition-colors cursor-pointer"
              title={t('ui.floodModal.simReset')}
              aria-label={t('ui.floodModal.simReset')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Slider Continuo Quota Marea (+50 cm a +200 cm) con Soglie Storiche e Operative */}
        <div className="pt-2 border-t border-[var(--rule)]/60 flex flex-col gap-1.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ink-2)] px-1">
            <span className="text-[var(--ink-3)]">{t('ui.timeline.tideSliderLabel')}</span>
            <span className="font-bold text-sky-600 dark:text-cyan-300 tabular">{simulator.formattedCm}</span>
          </div>
          <div className="relative w-full py-0.5">
            <input
              type="range"
              min={50}
              max={200}
              step={1}
              value={simulator.level}
              onChange={(e) => {
                simulator.onSetLevel?.(Number(e.target.value));
              }}
              className="w-full h-2 rounded-lg cursor-ew-resize appearance-none"
              aria-label={t('ui.timeline.tideSliderAria')}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-[var(--ink-3)] px-1">
            <span>{t('ui.timeline.tideSliderNormale')}</span>
            <span className="text-amber-500 font-semibold">{t('ui.timeline.tideSliderInizio')}</span>
            <span className="text-rose-500 font-semibold">{t('ui.timeline.tideSliderSogliaMose')}</span>
            <span className="hidden sm:inline">{t('ui.timeline.tideSliderEccezionale')}</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">{t('ui.timeline.tideSliderPicco')}</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. MODALITA COMPATTA (Compact Pill ~44px: massimizza lo spazio per layer statici o su richiesta)
  if (!isExpanded) {
    return (
      <div
        className="w-full glass-panel rounded-2xl px-3 sm:px-4 py-2 shadow-2xl flex items-center justify-between gap-2 flex-wrap transition-all duration-200"
        aria-label={t('ui.timeline.timelineRidottaAria')}
      >
        {/* Sinistra: Orologio, Live Sync, Effemeridi e Chip contestuali */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Digital Clock */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="flex items-baseline font-mono tracking-tight tabular text-[var(--ink)]">
              <span className="text-base sm:text-lg font-bold">
                {timeParts.hoursMinutes}
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-[var(--ink-2)] ml-0.5">
                :{timeParts.seconds}
              </span>
            </div>
          </div>

          {/* ORA LIVE Sync Button */}
          {onSyncLiveTime && (
            <button
              type="button"
              onClick={onSyncLiveTime}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-mono font-medium whitespace-nowrap shrink-0 border transition-all cursor-pointer ${
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
              <span className="text-[11px]">{t('timeline.liveNow')}</span>
            </button>
          )}

          <div className="h-4 w-px bg-[var(--rule)] hidden sm:block" />

          {/* Effemeridi solari & meteo compatto */}
          {renderSolarAndWeather(true)}

          {/* Marea CPSM */}
          {renderTideBadge()}

          {/* Vento Open-Meteo */}
          {renderWindBadge()}

          {/* Mobilita attiva */}
          {isTransitActive && (
            <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-mono bg-[var(--rule)]/40 border border-[var(--rule)] text-[var(--ink-2)] shrink-0">
              <Ship className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[var(--ink)] font-bold tabular">{showVehicles ? effectiveActv : effectiveAli}</span>
              <span className="text-[var(--ink-3)] text-[11px]">{showVehicles ? t('ui.timeline.corseOrario') : t('ui.timeline.battelliServizio')}</span>
            </div>
          )}
        </div>

        {/* Destra: Condivisione e Chevron di Espansione */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
          {renderShareButton()}

          {/* Chevron Espandi */}
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[var(--rule)]/70 text-[var(--ink-2)] hover:text-[var(--ink)] border border-[var(--rule)] text-xs font-mono cursor-pointer transition-all"
            title={t('ui.timeline.espandiTimeline')}
            aria-label={t('ui.timeline.espandiTimeline')}
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] font-sans font-medium">{t('ui.timeline.espandiTimeline')}</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. MODALITA ESTESA (Full Timeline Scrubber 24h & Velocita)
  return (
    <div
      className="w-full glass-panel rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-col gap-2.5 sm:gap-3 transition-all duration-200"
      aria-label={t('ui.timeline.timelineEstesaAria')}
    >
      {/* Top row: Clock, Solar Phase, Contextual Badges, Play/Pause, Day Selector, Collapse Button */}
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

          {/* Urban Core: Solar Phase Badge & Weather */}
          {renderSolarAndWeather(false)}

          {/* Contextual Tide Badge */}
          {renderTideBadge()}

          {/* Contextual Wind Badge */}
          {renderWindBadge()}

          {/* Contextual Transit Badge */}
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

        {/* Right Section: Share button, Desktop Day Selector, Collapse Button */}
        <div className="flex items-center gap-2 shrink-0">
          {renderShareButton()}

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

          {/* Chevron Riduci (permette di comprimere la timeline sia su desktop che mobile) */}
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[var(--rule)]/70 text-[var(--ink-2)] hover:text-[var(--ink)] border border-[var(--rule)] text-xs font-mono cursor-pointer transition-all"
            title={t('ui.timeline.riduciTimeline')}
            aria-label={t('ui.timeline.riduciTimeline')}
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] font-sans font-medium">{t('ui.timeline.riduciTimeline')}</span>
          </button>
        </div>
      </div>

      {/* Middle row: Interactive Time Scrubber Slider (00:00 - 24:00) */}
      <div className="flex flex-col gap-1">
        {/* Intestazione di contesto marea se attiva senza flotta ACTV */}
        {isTideActive && !isTransitActive && (
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ink-2)] px-1 mb-0.5">
            <span className="flex items-center gap-1.5 font-medium text-[var(--ink)]">
              <Waves className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{t('ui.timeline.tideEvolution24h')}</span>
              <span className="text-[var(--ink-3)] text-[10px] font-normal hidden sm:inline">
                · {t('ui.timeline.tideEvolutionHint')}
              </span>
            </span>
            {tideLevel !== null && tideLevel !== undefined ? (
              <span className={`font-bold tabular ${tideLevel >= 80 ? 'text-amber-400' : 'text-sky-400'}`}>
                {t(TIDE_LABEL[tideStatus?.levelSource ?? 'forecast'], { cm: tideLevel > 0 ? `+${tideLevel}` : `${tideLevel}` })}
              </span>
            ) : (
              <span className="text-[var(--ink-3)]">{t('ui.timeline.tideNoData')}</span>
            )}
          </div>
        )}
        {isTideActive && tideStatus && (tideStatus.forecastStale || (tideStatus.moseStatus !== 'ABBASSATO' && tideStatus.levelSource !== 'simulated')) && (
          <div className="text-[10px] font-mono px-1 mb-0.5 text-amber-400">
            {tideStatus.moseStatus !== 'ABBASSATO' && tideStatus.levelSource !== 'simulated' && (
              <span className="mr-3">{t(tideStatus.moseBasis === 'measured' ? 'ui.timeline.moseMeasured' : 'ui.timeline.moseForecast')}</span>
            )}
            {tideStatus.forecastStale && <span>{t('ui.timeline.tideForecastStale')}</span>}
          </div>
        )}
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

      {/* Bottom row: Speed Presets & Contextual Transit info */}
      <div className="flex flex-col md:flex-row flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[var(--rule)]/60 animate-in fade-in duration-150">
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

        {/* Playback orario 24h & Selettore Velocità (Raggruppati per il moto temporale) */}
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          <div className="flex items-center gap-1 bg-[var(--rule)]/60 p-0.5 rounded-lg border border-[var(--rule)] w-full md:w-auto justify-between md:justify-start">
            <button
              type="button"
              onClick={onTogglePlay}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-cyan-500 text-white shadow-sm hover:bg-cyan-400'
              }`}
              title={isPlaying ? t('ui.timeline.pausaOrarioTooltip') : t('ui.timeline.avviaOrarioTooltip')}
              aria-label={isPlaying ? t('ui.timeline.pausa') : t('ui.timeline.avvia')}
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
              <span className="text-[11px]">{isPlaying ? t('ui.timeline.pausa') : t('ui.timeline.avvia')}</span>
            </button>

            <div className="h-3.5 w-px bg-[var(--rule)] mx-0.5" />

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
        ) : showWind && windField ? (
          <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--ink-2)] w-full md:w-auto animate-in fade-in duration-150">
            <span className="text-[var(--ink-3)] uppercase font-semibold">{t('ui.timeline.windScale')}:</span>
            <div
              className="w-24 sm:w-32 h-2 rounded-full border border-[var(--rule)]"
              style={{
                background: `linear-gradient(to right, ${WIND_COLOR_STOPS.filter(([s]) => s <= 25)
                  .map(([s, [r, g, b]]) => `rgb(${r},${g},${b}) ${(s / 25) * 100}%`)
                  .join(', ')})`,
              }}
            />
            <span className="text-[var(--ink-3)]">0–90 km/h</span>
            <span className="text-[var(--ink-3)] hidden lg:inline">· {t('ui.timeline.windForecastModel')}</span>
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
