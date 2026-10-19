'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { DynamicTideState } from '@/lib/tideCurve';
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
  Wind,
  Building2,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudFog,
  Lightbulb,
} from 'lucide-react';
import type { AirportMetarData, CityAirTemperature, DayType, WindField } from '@/lib/types';
import { detectWeatherCondition, type WeatherConditionKey } from '@/lib/weatherCondition';
import { formatTimeParts, getSolarPhase } from '@/lib/solar';
import { getPublicLightingStatus } from '@/lib/publicLighting';
import { useTranslation } from '@/lib/i18n';
import { WIND_COLOR_STOPS } from '@/components/map/windLayer';
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  EPOCH_META,
  EPOCH_ORDER,
  getBuildingsAuditStats,
  isBuildingsLoaded,
  requestBuildings,
  type BuildingColorMode,
  type BuildingEpochFilter,
} from '@/components/map/buildingsLayer';

interface TideSimulatorProps {
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

export interface BuildingsDockProps {
  colorMode: BuildingColorMode;
  onColorModeChange: (mode: BuildingColorMode) => void;
  epochFilter: BuildingEpochFilter;
  onEpochFilterChange: (filter: BuildingEpochFilter) => void;
  maxYear: number | null;
  onMaxYearChange: (year: number | null) => void;
  is3DView: boolean;
  onToggle3DView: () => void;
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
  hasTransportLayers?: boolean;
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
  /** Bollettino METAR ufficiale per la condizione meteo prevalente */
  metarData?: AirportMetarData | null;
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
  // Contextual Lighting Props
  showPublicLighting?: boolean;
  // Dock state & contextual awareness
  hasTemporalLayers?: boolean;
  simulator?: TideSimulatorProps | null;
  buildings?: BuildingsDockProps | null;
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
  hasTransportLayers = false,
  showPublicLighting = false,
  actvTripsCount,
  alilagunaBoatsCount,
  peakCount,
  peakTime,
  showTide = false,
  tideLevel,
  airTemp,
  metarData = null,
  showWind = false,
  windField = null,
  onSyncLiveTime,
  isLiveSynced,
  onShare,
  hasActiveLayers = false,
  onOpenTideModal,
  onStartSimulator,
  simulator = null,
  buildings = null,
}) => {
  const { t, language } = useTranslation();
  const isIt = language === 'it';

  // Lo slider orario 24h e la velocità sono attivi quando c'è almeno un layer trasporti o illuminazione pubblica;
  // il pannello espanso si apre per trasporti, illuminazione o per il pannello Edifici 3D.
  const hasExpandableDock = Boolean(hasTransportLayers || showVehicles || showAlilaguna || buildings || showPublicLighting);
  const [isExpanded, setIsExpanded] = useState<boolean>(() => hasExpandableDock && !simulator);
  const prevExpandableRef = useRef(hasExpandableDock);

  useEffect(() => {
    if (hasExpandableDock !== prevExpandableRef.current) {
      prevExpandableRef.current = hasExpandableDock;
      setIsExpanded(hasExpandableDock && !simulator);
    }
  }, [hasExpandableDock, simulator]);

  const [, setBuildingsReadyTick] = useState(false);
  useEffect(() => {
    if (buildings && !isBuildingsLoaded()) {
      requestBuildings(() => setBuildingsReadyTick((v) => !v));
    }
  }, [buildings]);

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

  // Determina la condizione meteo prevalente (METAR LIPZ aeroporto / stazioni meteo)
  const weatherInfo = detectWeatherCondition(metarData);

  const renderWeatherIcon = (cond: WeatherConditionKey) => {
    switch (cond) {
      case 'sole':
        return <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden />;
      case 'nuvola':
        return <Cloud className="w-3.5 h-3.5 text-slate-300 shrink-0" aria-hidden />;
      case 'pioggia':
        return <CloudRain className="w-3.5 h-3.5 text-blue-400 shrink-0" aria-hidden />;
      case 'neve':
        return <CloudSnow className="w-3.5 h-3.5 text-cyan-200 shrink-0" aria-hidden />;
      case 'nebbia':
        return <CloudFog className="w-3.5 h-3.5 text-zinc-400 shrink-0" aria-hidden />;
      case 'vento':
        return <Wind className="w-3.5 h-3.5 text-teal-300 shrink-0" aria-hidden />;
    }
  };

  // Sezione comune: Effemeridi solari & Meteo centro storico
  const renderSolarAndWeather = (isCompact = false) => {
    const weatherLabel = t(`ui.timeline.weather_${weatherInfo.condition}`);
    const weatherTitle = `${t('ui.timeline.weatherLabel')}: ${weatherLabel}${weatherInfo.detail ? ` (${weatherInfo.detail})` : ''}`;

    return (
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
        {/* Meteo, Temperatura e Umidità misurate adesso (confermato per test e2e) */}
        {isLiveSynced && (airTemp || metarData) && (
          <span
            className="flex items-center gap-1.5 pl-1.5 ml-0.5 border-l border-[var(--rule)]"
            title={
              airTemp
                ? t(airTemp.humidityPercent !== null ? 'ui.timeline.airTempHumidityTitle' : 'ui.timeline.airTempTitle', {
                    station: airTemp.stationName,
                    time: airTemp.observedAt.slice(11, 16),
                  })
                : weatherTitle
            }
            data-testid="timeline-air-temp"
          >
            {/* Icona Meteo prima della temperatura */}
            <span
              className="flex items-center shrink-0 cursor-default"
              title={weatherTitle}
              data-testid="timeline-weather-condition"
            >
              {renderWeatherIcon(weatherInfo.condition)}
            </span>
            {airTemp && (
              <>
                <Thermometer className="w-3.5 h-3.5 text-rose-300 shrink-0" aria-hidden />
                <span className="font-medium text-[var(--ink)] tabular">{airTemp.celsius.toLocaleString(language === 'it' ? 'it-IT' : 'en-GB', { maximumFractionDigits: 1 })}°</span>
                {airTemp.humidityPercent !== null && (
                  <>
                    <Droplets className="w-3.5 h-3.5 text-sky-300 shrink-0 ml-0.5" aria-hidden />
                    <span className="font-medium text-[var(--ink)] tabular" data-testid="timeline-humidity">
                      {airTemp.humidityPercent}%<span className="sr-only"> {t('ui.timeline.humidityLabel')}</span>
                    </span>
                  </>
                )}
              </>
            )}
          </span>
        )}
      </div>
    );
  };

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

  // Sezione comune: Box Vento Previsto Open-Meteo
  const renderWindBadge = () => {
    if (!showWind || !windField) return null;
    return (
      <div
        className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-mono bg-teal-500/10 border border-teal-500/30 text-[var(--ink-2)] shrink-0 animate-in fade-in duration-150"
        title={`${t('ui.timeline.windForecastBoxTitle')} (${t('ui.mapLabels.windValidAt', { time: windField.validTime.slice(11, 16) })}) — ${t('ui.mapLabels.windSource')}`}
        data-testid="timeline-wind-box"
      >
        <div className="flex items-center gap-1.5">
          <Wind className="w-3.5 h-3.5 text-teal-400 shrink-0" aria-hidden />
          <span className="font-semibold text-teal-300 whitespace-nowrap">{t('ui.timeline.windForecastBoxTitle')}</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 pl-1.5 border-l border-teal-500/30">
          <div
            className="w-16 sm:w-20 h-1.5 rounded-full border border-teal-500/30 shrink-0"
            style={{
              background: `linear-gradient(to right, ${WIND_COLOR_STOPS.filter(([s]) => s <= 25)
                .map(([s, [r, g, b]]) => `rgb(${r},${g},${b}) ${(s / 25) * 100}%`)
                .join(', ')})`,
            }}
          />
          <span className="text-[10px] text-teal-200 font-bold tabular">0–90 km/h</span>
          <span className="text-[10px] text-[var(--ink-3)] hidden md:inline">({windField.validTime.slice(11, 16)})</span>
        </div>
      </div>
    );
  };

  const showTransportScrubber = Boolean(hasTransportLayers || showVehicles || showAlilaguna || showPublicLighting);

  // Sezione innestata: Controlli Edifici 3D & Storia Urbana dentro la dashboard/timeline
  const renderBuildingsDock = () => {
    if (!buildings) return null;
    const bStats = getBuildingsAuditStats();
    const {
      colorMode,
      onColorModeChange,
      epochFilter,
      onEpochFilterChange,
      maxYear,
      onMaxYearChange,
      is3DView,
      onToggle3DView,
    } = buildings;

    return (
      <div
        className="pt-2 border-t border-[var(--rule)]/60 flex flex-col gap-2 animate-in fade-in duration-150"
        data-testid="buildings-panel"
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
              {t('ui.buildings.panelTitle')}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {bStats.withYear} {t('ui.buildings.dated')} / {bStats.total.toLocaleString(language === 'it' ? 'it-IT' : 'en-GB')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {/* Tab selector (Epoca / Autore '900 / Altezze / Contesto) */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-black/25 border border-[var(--rule)] text-[10px] font-mono">
              {([
                ['period', t('ui.buildings.mode_period')],
                ['contemporary', t('ui.buildings.mode_contemporary')],
                ['floors', t('ui.buildings.mode_floors')],
                ['category', t('ui.buildings.mode_category')],
              ] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onColorModeChange(mode)}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    colorMode === mode
                      ? mode === 'contemporary'
                        ? 'bg-fuchsia-500 text-white'
                        : 'bg-amber-500 text-slate-950'
                      : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onToggle3DView}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold border transition-colors cursor-pointer shrink-0 ${
                is3DView
                  ? 'bg-cyan-500 text-white border-cyan-400'
                  : 'bg-[var(--rule)]/50 text-[var(--ink-2)] border-[var(--rule)] hover:border-cyan-400/50'
              }`}
            >
              {is3DView ? '3D ON' : '2D / 3D'}
            </button>
          </div>
        </div>

        {colorMode === 'period' && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => onEpochFilterChange('all')}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono border cursor-pointer ${
                  epochFilter === 'all'
                    ? 'bg-white/15 text-[var(--ink)] border-white/40 font-bold'
                    : 'text-[var(--ink-3)] border-[var(--rule)] hover:text-[var(--ink-2)]'
                }`}
              >
                {t('ui.buildings.filterAll')}
              </button>
              <button
                type="button"
                onClick={() => onEpochFilterChange('dated_only')}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono border cursor-pointer ${
                  epochFilter === 'dated_only'
                    ? 'bg-amber-500/25 text-amber-300 border-amber-400/50 font-bold'
                    : 'text-[var(--ink-3)] border-[var(--rule)] hover:text-[var(--ink-2)]'
                }`}
              >
                {t('ui.buildings.filterDated', { n: bStats.withYear })}
              </button>
              <button
                type="button"
                onClick={() =>
                  onEpochFilterChange(epochFilter === 'contemporary_authored' ? 'all' : 'contemporary_authored')
                }
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono border cursor-pointer ${
                  epochFilter === 'contemporary_authored'
                    ? 'bg-fuchsia-500/25 text-fuchsia-300 border-fuchsia-400/50 font-bold'
                    : 'text-[var(--ink-3)] border-[var(--rule)] hover:text-[var(--ink-2)]'
                }`}
              >
                {t('ui.buildings.filterAuthored', { n: bStats.withArchitect })}
              </button>
              {EPOCH_ORDER.map((ep) => {
                const m = EPOCH_META[ep];
                const active = epochFilter === ep;
                return (
                  <button
                    key={ep}
                    type="button"
                    onClick={() => onEpochFilterChange(active ? 'all' : ep)}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono border cursor-pointer ${
                      active
                        ? 'bg-white/15 text-[var(--ink)] border-white/50 font-bold'
                        : 'text-[var(--ink-2)] border-[var(--rule)]/70 hover:border-white/30'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-xs shrink-0" style={{ background: m.roofDark }} />
                    <span>{isIt ? m.shortIt : m.shortEn}</span>
                  </button>
                );
              })}
            </div>

            {/* Slider Timeline Storica per Anno (1000 - Oggi) */}
            <div className="flex items-center gap-2 md:w-64 shrink-0">
              <span className="text-[9px] font-mono text-[var(--ink-3)] shrink-0">
                {t('ui.buildings.upToYear')}
              </span>
              <input
                type="range"
                min={1000}
                max={2026}
                step={10}
                value={maxYear ?? 2026}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onMaxYearChange(val >= 2026 ? null : val);
                }}
                className="w-full accent-amber-400 h-1.5 cursor-pointer"
                aria-label={t('ui.buildings.upToYearAria')}
              />
              <span className="text-[10px] font-mono font-bold text-amber-300 min-w-[2.8rem] text-right">
                {maxYear ?? t('ui.buildings.now')}
              </span>
            </div>
          </div>
        )}

        {colorMode === 'contemporary' && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-mono text-[var(--ink-2)]">
              <span className="flex items-center gap-1">
<span className="w-2 h-2 rounded-xs bg-[#e879f9] shrink-0" />
<span>{t('ui.buildings.authoredLegend')}</span>
</span>
            </div>
            <button
              type="button"
              onClick={() =>
                onEpochFilterChange(epochFilter === 'contemporary_authored' ? 'all' : 'contemporary_authored')
              }
              className={`px-2 py-0.5 rounded text-[9px] font-mono border shrink-0 cursor-pointer ${
                epochFilter === 'contemporary_authored'
                  ? 'bg-fuchsia-500/25 text-fuchsia-300 border-fuchsia-400/50 font-bold'
                  : 'text-[var(--ink-2)] border-[var(--rule)] hover:border-white/30'
              }`}
            >
              {epochFilter === 'contemporary_authored'
                ? t('ui.buildings.showFabric')
                : t('ui.buildings.isolateAuthored', { n: bStats.withArchitect })}
            </button>
          </div>
        )}

        {colorMode === 'floors' && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] font-mono text-[var(--ink-2)]">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-xs bg-[#38bdf8]" />1–2p</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-xs bg-[#34d399]" />3–4p</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-xs bg-[#fbbf24]" />5–6p</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-xs bg-[#fb7185]" />&gt;6p / Torri</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-xs bg-slate-500/60" />{t('ui.buildings.levelsUnknown')}</span>
            </div>
            <span className="text-[var(--ink-3)]">
              {t('ui.buildings.sources')}
            </span>
          </div>
        )}

        {colorMode === 'category' && (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9px] font-mono text-[var(--ink-2)]">
            {CATEGORY_ORDER.map((cat) => (
              <span key={cat} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs shrink-0" style={{ background: CATEGORY_META[cat].colorDark }} />
                <span>{(isIt ? CATEGORY_META[cat].labelIt : CATEGORY_META[cat].labelEn).split(',')[0]}</span>
              </span>
            ))}
          </div>
        )}
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
              title={t(simulator.isPlayingCycle ? 'ui.floodModal.cyclePauseTitle' : 'ui.floodModal.cycleStartTitle')}
            >
              {simulator.isPlayingCycle ? <Pause className="w-3 h-3 text-cyan-700 dark:text-cyan-300" /> : <Play className="w-3 h-3 text-cyan-700 dark:text-cyan-300" />}
              <span>{t(simulator.isPlayingCycle ? 'ui.timeline.simPause' : 'ui.timeline.simStart')}</span>
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
              title={t(
                !simulator.isProtected
                  ? 'ui.timeline.moseOffTitle'
                  : simulator.level >= 110
                  ? 'ui.timeline.moseRaisedTitle'
                  : 'ui.timeline.moseArmedTitle'
              )}
            >
              {t(simulator.isProtected ? 'ui.timeline.moseOn' : 'ui.timeline.moseOff')}
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

        {/* Se anche il layer Edifici 3D è attivo durante la simulazione marea, mostra i controlli Edifici */}
        {renderBuildingsDock()}
      </div>
    );
  }

  // 2. MODALITA COMPATTA (Compact Pill ~44px: massimizza lo spazio quando non ci sono trasporti/edifici o quando ridotta)
  if (!isExpanded || (!showTransportScrubber && !buildings)) {
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

          {/* Badge Edifici 3D quando la timeline è ridotta */}
          {buildings && (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-mono bg-amber-500/15 border border-amber-500/35 text-amber-300 shrink-0 cursor-pointer hover:bg-amber-500/25"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{t('ui.buildings.buildings3d')}</span>
            </button>
          )}
        </div>

        {/* Destra: Condivisione e Chevron di Espansione (mostrato solo se ci sono trasporti o edifici) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
          {renderShareButton()}

          {hasExpandableDock && (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="p-1.5 rounded-xl bg-[var(--rule)]/70 text-[var(--ink-2)] hover:text-[var(--ink)] border border-[var(--rule)] cursor-pointer transition-all active:scale-95 flex items-center justify-center"
              title={t('ui.timeline.espandiTimeline')}
              aria-label={t('ui.timeline.espandiTimeline')}
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. MODALITA ESTESA (Pannello Edifici 3D e/o Scrubber 24h & Velocità solo con livelli Trasporti attivi)
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
          {/* Contextual Public Lighting Badge */}
          {showPublicLighting && (() => {
            const lStatus = getPublicLightingStatus(currentTimeSeconds);
            return (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-mono animate-in fade-in duration-150">
                <Lightbulb className={`w-3.5 h-3.5 shrink-0 ${lStatus.intensityFactor > 0 ? 'text-amber-400' : 'text-amber-400/50'}`} />
                <span>
                  {lStatus.state === 'day_off'
                    ? t('ui.lighting.off', { time: lStatus.ignitionTime })
                    : lStatus.state === 'night_active'
                      ? t('ui.lighting.on', { time: lStatus.extinctionTime, count: lStatus.mappedCount })
                      : t('ui.lighting.twilight', { pct: Math.round(lStatus.intensityFactor * 100) })}
                </span>
              </div>
            );
          })()}

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

          {/* Chevron Riduci */}
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="p-1.5 rounded-xl bg-[var(--rule)]/70 text-[var(--ink-2)] hover:text-[var(--ink)] border border-[var(--rule)] cursor-pointer transition-all active:scale-95 flex items-center justify-center"
            title={t('ui.timeline.riduciTimeline')}
            aria-label={t('ui.timeline.riduciTimeline')}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Pannello Edifici 3D innestato direttamente nella dashboard/timeline */}
      {renderBuildingsDock()}

      {/* Slider Orario 24h (00:00 - 24:00) e Velocità mostrati SOLO quando ci sono livelli Trasporti attivi */}
      {showTransportScrubber && (
        <>
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

            {/* Playback orario 24h & Selettore Velocità (Raggruppati per il moto temporale dei trasporti) */}
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
                <span className="text-[var(--ink-3)] hidden lg:inline">· {t('ui.mapLabels.windSource')}</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center text-[11px] text-[var(--ink-3)] font-mono">
                <span>45.437° N, 12.335° E · Laguna di Venezia</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
