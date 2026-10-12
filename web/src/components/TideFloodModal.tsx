'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Waves,
  X,
  ShieldAlert,
  CheckCircle2,
  Layers,
  Sliders,
  Calendar,
  Volume2,
  Wind,
  TrendingUp,
  TrendingDown,
  Compass,
  Play,
  Pause
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { formatSignedCm, formatLocalStamp } from '@/lib/time';
import type { TideForecast } from '@/lib/contracts/tide';
import type { MeteoMarineWindItem } from '@/lib/types';
import { getFloodedGroundPercentage, meanDirectionDeg, romeLocalNow } from '@/lib/flood';
import { PASSERELLE_DATA } from '@/lib/passerelleData';
import { Modal } from '@/components/ui/Modal';

interface TideFloodModalProps {
  isOpen: boolean;
  onClose: () => void;
  liveTideLevel: number | null;
  onActivatePasserelle: () => void;
  simulatedTideLevel?: number | null;
  onSimulatedTideChange?: (cm: number | null) => void;
  isMoseProtected?: boolean;
  onToggleMoseProtection?: () => void;
  forecast?: TideForecast | null;
  marineWindStations?: MeteoMarineWindItem[];
  isPlayingCycle?: boolean;
  onToggleCycle?: () => void;
}

function formatExtremeStamp(atStr: string, language: 'it' | 'en'): string {
  try {
    const [d, t = '00:00:00'] = atStr.split(' ');
    const [y, m, day] = d.split('-');
    const [hh, mm] = t.split(':');
    const date = new Date(Number(y), Number(m) - 1, Number(day), Number(hh), Number(mm));
    const dayName = new Intl.DateTimeFormat(language === 'it' ? 'it-IT' : 'en-US', { weekday: 'short' }).format(date);
    return `${dayName.toUpperCase()} ${day}/${m} ${hh}:${mm}`;
  } catch {
    return atStr;
  }
}

export const TideFloodModal: React.FC<TideFloodModalProps> = ({
  isOpen,
  onClose,
  liveTideLevel,
  onActivatePasserelle,
  simulatedTideLevel,
  onSimulatedTideChange,
  isMoseProtected = true,
  onToggleMoseProtection,
  forecast,
  marineWindStations = [],
  isPlayingCycle,
  onToggleCycle
}) => {
  const { t, language } = useTranslation();
  type ModalTab = 'simulator' | 'forecast' | 'sirens' | 'meteo';
  const [activeTab, setActiveTab] = useState<ModalTab>('simulator');
  const [draftCm, setDraftCm] = useState<number | null>(null);
  const [localCycling, setLocalCycling] = useState(false);
  const isCycling = isPlayingCycle !== undefined ? isPlayingCycle : localCycling;
  const simulatedCm = simulatedTideLevel ?? draftCm ?? liveTideLevel ?? 65;

  const modalCycleRef = useRef<{ startTime: number; startLevel: number; phaseOffset: number } | null>(null);

  // Se non c'è onToggleCycle globale passato dal parent, usa l'interval locale di fallback
  useEffect(() => {
    if (onToggleCycle || !localCycling || !isOpen) {
      modalCycleRef.current = null;
      return;
    }

    if (!modalCycleRef.current) {
      const start = Math.max(55, Math.min(195, simulatedCm));
      const ratio = Math.max(-1, Math.min(1, (start - 125) / 70));
      modalCycleRef.current = {
        startTime: Date.now(),
        startLevel: start,
        phaseOffset: Math.asin(ratio),
      };
      setDraftCm(start);
      onSimulatedTideChange?.(start);
    }

    const interval = setInterval(() => {
      const params = modalCycleRef.current;
      if (!params) return;
      const elapsed = Date.now() - params.startTime;
      const angle = (2 * Math.PI * elapsed) / 20000 + params.phaseOffset;
      const val = Math.round(125 + 70 * Math.sin(angle));
      setDraftCm(val);
      onSimulatedTideChange?.(val);
    }, 60);

    return () => clearInterval(interval);
  }, [localCycling, isOpen, onSimulatedTideChange, onToggleCycle, simulatedCm]);

  const handleToggleCycle = () => {
    if (onToggleCycle) {
      onToggleCycle();
    } else {
      setLocalCycling((c) => !c);
    }
  };

  const handleLevelChange = (cm: number) => {
    if (isPlayingCycle && onToggleCycle) {
      onToggleCycle();
    }
    setLocalCycling(false);
    setDraftCm(cm);
    onSimulatedTideChange?.(cm);
  };

  const handleResetToLive = () => {
    if (isPlayingCycle && onToggleCycle) {
      onToggleCycle();
    }
    setLocalCycling(false);
    setDraftCm(null);
    onSimulatedTideChange?.(null);
  };

  // Primo colmo ≥ +110 cm ancora nel futuro (gli estremali passati non contano)
  const futureMosePeak = useMemo(() => {
    if (!forecast?.extremes || !isOpen) return null;
    const now = romeLocalNow();
    return forecast.extremes.find((e) => e.type === 'max' && e.levelCm >= 110 && e.at > now) ?? null;
  }, [forecast, isOpen]);

  const meteoAnalysis = useMemo(() => {
    if (!marineWindStations || marineWindStations.length === 0) return null;
    const withWind = marineWindStations.filter((s) => s.windSpeedKnots > 0);
    if (withWind.length === 0) return null;

    const avgDeg = meanDirectionDeg(withWind.map((s) => s.windDirectionDeg));
    if (avgDeg === null) return null;
    const maxGust = Math.max(...withWind.map((s) => s.gustSpeedKnots));
    const cnrPlatform = marineWindStations.find((s) => s.id.includes('CNR') || s.stationType === 'PIATTAFORMA_OFFSHORE');

    const isScirocco = avgDeg >= 100 && avgDeg <= 180;
    const isBora = (avgDeg >= 20 && avgDeg <= 80) || avgDeg >= 340;

    return {
      avgDeg,
      maxGust,
      cnrPlatform,
      isScirocco,
      isBora,
      stations: marineWindStations.slice(0, 6)
    };
  }, [marineWindStations]);

  if (!isOpen) return null;

  const floodedPercent = (isMoseProtected && simulatedCm >= 110)
    ? 0
    : getFloodedGroundPercentage(simulatedCm);
  const isMoseRaised = simulatedCm >= 110 && isMoseProtected;

  // Tratte passerelle dal dataset usato anche dalla mappa (una sola fonte)
  const effectiveCm = (isMoseProtected && simulatedCm >= 110) ? 70 : simulatedCm;
  const passerelleRoutes = [...PASSERELLE_DATA]
    .sort((x, y) => x.activationThresholdCm - y.activationThresholdCm)
    .map((p) => ({ id: p.id, threshold: p.activationThresholdCm, name: p.name, active: effectiveCm >= p.activationThresholdCm }));

  // Classificazione CPSM della marea (stessa di server/sources/tide.ts)
  const getTideCode = (cm: number) => {
    if (cm < 80) return { label: t('ui.floodModal.catNormal'), color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
    if (cm < 110) return { label: t('ui.floodModal.catSustained'), color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    if (cm < 140) return { label: t('ui.floodModal.catVerySustained'), color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    return { label: t('ui.floodModal.catExceptional'), color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
  };

  // Sirene CPSM: le percentuali vengono dalla stessa tabella usata dal simulatore
  const sirenLevels = [
    { level: 0, quota: '< +110 cm', tones: 0, active: simulatedCm < 110, color: 'border-blue-500/30 bg-blue-500/5 text-blue-400' },
    { level: 1, quota: '+110 cm', tones: 1, active: simulatedCm >= 110 && simulatedCm < 120, color: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
    { level: 2, quota: '+120 cm', tones: 2, active: simulatedCm >= 120 && simulatedCm < 130, color: 'border-orange-500/30 bg-orange-500/10 text-orange-300' },
    { level: 3, quota: '+130 cm', tones: 3, active: simulatedCm >= 130 && simulatedCm < 140, color: 'border-rose-500/30 bg-rose-500/10 text-rose-300' },
    { level: 4, quota: '≥ +140 cm', tones: 4, active: simulatedCm >= 140, color: 'border-purple-500/40 bg-purple-500/15 text-purple-300' },
  ].map((s) => ({
    ...s,
    title: t(`ui.floodModal.sirenLevel${s.level}`),
    desc: s.level === 0 ? t('ui.floodModal.sirenDesc0') : t('ui.floodModal.sirenDescN', { pct: getFloodedGroundPercentage(100 + s.level * 10) }),
  }));

  const codeInfo = getTideCode(simulatedCm);

  return (
    <Modal onClose={onClose} label={t('ui.floodModal.title')} panelClassName="relative w-full max-w-2xl bg-[var(--ground)] border border-[var(--rule)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--rule)] bg-[var(--rule)]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--ink)]">
                {t('ui.floodModal.title')}
              </h2>
              <p className="text-xs text-[var(--ink-3)] font-mono">
                {t('ui.floodModal.subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('ui.floodModal.close')}
            className="p-1.5 rounded-lg text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--rule)] cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 sm:px-5 pt-2 border-b border-[var(--rule)] bg-[var(--rule)]/10 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{t('ui.floodModal.tabSimulator')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('forecast')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'forecast'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('ui.floodModal.tabForecast')}</span>
            {forecast?.extremes && forecast.extremes.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 text-[10px]">
                {forecast.extremes.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sirens')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sirens'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{t('ui.floodModal.tabSirens')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('meteo')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'meteo'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>{t('ui.floodModal.tabMeteo')}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-4 flex-1">
          {/* TAB 1: SIMULATORE & ALLAGAMENTO */}
          {activeTab === 'simulator' && (
            <>
              {/* Slider & Simulated Level */}
              <div className="p-4 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono text-[var(--ink-3)] uppercase">
                      {t('ui.floodModal.simulatedTide')}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl sm:text-4xl font-extrabold font-mono tabular ${simulatedCm >= 110 ? 'text-rose-400' : 'text-blue-400'}`}>
                        {formatSignedCm(simulatedCm)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${codeInfo.color}`}>
                        {codeInfo.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <button
                      type="button"
                      onClick={handleToggleCycle}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                        isCycling
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold shadow-sm'
                          : 'bg-[var(--rule)]/40 hover:bg-[var(--rule)] text-[var(--ink-2)] border-transparent'
                      }`}
                      title={isCycling ? 'Metti in pausa il ciclo continuo di marea' : 'Avvia il ciclo continuo sia nella modale che sulla mappa'}
                    >
                      {isCycling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isCycling ? (language === 'it' ? 'Pausa simulazione' : 'Pause simulation') : (language === 'it' ? 'Avvia simulazione marea' : 'Start tide simulation')}</span>
                    </button>

                    {/* Bottone rapido: Vedi sulla mappa (chiude la modale con la simulazione attiva) */}
                    <button
                      type="button"
                      onClick={() => {
                        onSimulatedTideChange?.(simulatedCm);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-medium text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                      title={language === 'it' ? 'Chiudi la modale e controlla la marea direttamente sulla mappa' : 'Close modal and control tide directly on map'}
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>{language === 'it' ? 'Vedi sulla mappa' : 'View on map'}</span>
                    </button>

                    {liveTideLevel !== null && (
                      <button
                        type="button"
                        onClick={handleResetToLive}
                        className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-mono transition-all cursor-pointer"
                      >
                        {t('ui.floodModal.liveTide')} ({formatSignedCm(liveTideLevel)})
                      </button>
                    )}
                  </div>
                </div>

                {/* Range Slider */}
                <div className="flex flex-col gap-2">
                  <input
                    type="range"
                    min="50"
                    max="200"
                    step="1"
                    value={simulatedCm}
                    onChange={(e) => handleLevelChange(Number(e.target.value))}
                    aria-label={t('ui.floodModal.simulatedTide')}
                    className="w-full h-2 bg-[var(--rule)] rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[var(--ink-3)]">
                    <span>+50 cm</span>
                    <span>{t('ui.floodModal.tick80')}</span>
                    <span>{t('ui.floodModal.tick110')}</span>
                    <span>{t('ui.floodModal.tick140')}</span>
                    <span>+170 cm</span>
                    <span>+200 cm</span>
                  </div>

                  {/* Quick Scenario Presets */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { cm: 65, label: t('ui.floodModal.presetNormal') },
                      { cm: 80, label: t('ui.floodModal.presetSanMarco') },
                      { cm: 100, label: t('ui.floodModal.presetRialto') },
                      { cm: 110, label: t('ui.floodModal.presetMose') },
                      { cm: 130, label: t('ui.floodModal.presetAlert') },
                      { cm: 140, label: t('ui.floodModal.presetExceptional') },
                      { cm: 187, label: '2019 (+187 cm)' },
                      { cm: 194, label: '1966 (+194 cm)' },
                      { cm: 200, label: 'Max (+200 cm)' },
                    ].map((sc) => (
                      <button
                        key={sc.cm}
                        type="button"
                        onClick={() => handleLevelChange(sc.cm)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                          simulatedCm === sc.cm
                            ? 'bg-blue-500 text-white border-blue-400 font-bold shadow-sm'
                            : 'bg-[var(--rule)]/40 hover:bg-[var(--rule)] text-[var(--ink-2)] border-transparent'
                        }`}
                      >
                        {sc.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Flooding Ground Progress Bar */}
              <div className="p-4 rounded-xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--ink-2)]">{t('ui.floodModal.floodedArea')}</span>
                  <span className={`font-bold tabular ${floodedPercent > 15 ? 'text-rose-400' : 'text-cyan-400'}`}>
                    {t('ui.floodModal.floodedOfCentre', { pct: floodedPercent })}
                    {simulatedCm >= 110 && isMoseProtected && (
                      <span className="text-emerald-400 font-normal ml-1.5 text-[10px]">(Calmierato da MOSE)</span>
                    )}
                  </span>
                </div>

                <div className="w-full h-3 bg-[var(--rule)] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      floodedPercent > 50 ? 'bg-rose-500' : floodedPercent > 10 ? 'bg-amber-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${floodedPercent}%` }}
                  />
                </div>

                <div className="text-[11px] font-mono text-[var(--ink-3)]">
                  {simulatedCm >= 110 && isMoseProtected
                    ? 'Con il sistema MOSE sollevato alle tre bocche di porto, la laguna e isolata dal mare Adriatico. Il livello dell\'acqua nel centro storico resta calmierato attorno a +85 cm (allagamento circoscritto alla sola Piazza San Marco, il restante 95% della citta e protetto).'
                    : t(
                        simulatedCm < 80
                          ? 'ui.floodModal.floodDesc0'
                          : simulatedCm < 100
                          ? 'ui.floodModal.floodDesc80'
                          : simulatedCm < 110
                          ? 'ui.floodModal.floodDesc100'
                          : simulatedCm < 120
                          ? 'ui.floodModal.floodDesc110'
                          : simulatedCm < 130
                          ? 'ui.floodModal.floodDesc120'
                          : 'ui.floodModal.floodDesc130'
                      )}
                </div>
              </div>

              {/* MOSE Status Matrix */}
              <div className="p-4 rounded-xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[var(--ink-2)] uppercase font-semibold">
                      {t('ui.floodModal.moseStatus')}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      isMoseProtected
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-semibold'
                    }`}>
                      {isMoseProtected
                        ? (simulatedCm >= 110 ? 'DIFESA ATTIVA (CITTA PROTETTA · 0% ALLAGAMENTO)' : 'DIFESA ARMATA (SOGLIA 110 cm)')
                        : 'DISATTIVATO (MAREA INTEGRALE IN CITTA)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    {onToggleMoseProtection && (
                      <button
                        type="button"
                        onClick={onToggleMoseProtection}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-medium transition-all cursor-pointer ${
                          isMoseProtected
                            ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30'
                            : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {isMoseProtected ? 'Disattiva MOSE (Simula Allagamento)' : 'Attiva MOSE (Proteggi Laguna)'}
                      </button>
                    )}
                    {isMoseRaised ? (
                      <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t('ui.floodModal.moseRaised')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                        <Waves className="w-3.5 h-3.5" />
                        {t('ui.floodModal.moseDown')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded-lg bg-[var(--rule)]/40 border border-[var(--rule)]">
                    <div className="text-[var(--ink-3)]">Lido Treporti</div>
                    <div className="font-bold text-[var(--ink)]">{t('ui.floodModal.gates', { n: 21 })}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--rule)]/40 border border-[var(--rule)]">
                    <div className="text-[var(--ink-3)]">Lido San Nicolò</div>
                    <div className="font-bold text-[var(--ink)]">{t('ui.floodModal.gates', { n: 20 })}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--rule)]/40 border border-[var(--rule)]">
                    <div className="text-[var(--ink-3)]">Malamocco</div>
                    <div className="font-bold text-[var(--ink)]">{t('ui.floodModal.gates', { n: 19 })}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--rule)]/40 border border-[var(--rule)]">
                    <div className="text-[var(--ink-3)]">Chioggia</div>
                    <div className="font-bold text-[var(--ink)]">{t('ui.floodModal.gates', { n: 18 })}</div>
                  </div>
                </div>
              </div>

              {/* Elevated Walkways (Passerelle) Tratte */}
              <div className="p-4 rounded-xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[var(--ink-2)] uppercase font-semibold">
                    {t('ui.floodModal.passerelleActive')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onActivatePasserelle();
                      onClose();
                    }}
                    className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{t('ui.floodModal.viewOnMap')}</span>
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  {passerelleRoutes.map((r) => (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs font-mono border ${
                        r.active
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-[var(--rule)]/20 border-transparent text-[var(--ink-3)] opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="px-1.5 py-0.5 rounded bg-[var(--rule)] text-[10px] shrink-0 font-bold">
                          +{r.threshold} cm
                        </span>
                        <span className="truncate">{r.name}</span>
                      </div>
                      <span className="text-[10px] shrink-0 font-semibold ml-2">
                        {r.active ? t('ui.floodModal.walkwayNeeded') : t('ui.floodModal.walkwayNotNeeded')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: PREVISIONE UFFICIALE 72-96h (previsione.json) */}
          {activeTab === 'forecast' && (
            <div className="flex flex-col gap-3">
              {forecast?.issuedAt && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] text-xs font-mono">
                  <span className="text-[var(--ink-3)]">
                    {t('ui.floodModal.bulletinIssued')}: <strong className="text-[var(--ink)]">{formatLocalStamp(forecast.issuedAt)}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px]">
                    {t('ui.floodModal.officialForecast')}
                  </span>
                </div>
              )}

              {/* Future MOSE Alert Banner if any upcoming extreme >= 110cm */}
              {futureMosePeak && (
                <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs font-mono flex items-start gap-2.5 text-amber-200">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300">
                      {t('ui.floodModal.futureMoseWarning')} {formatSignedCm(futureMosePeak.levelCm)}
                    </span>
                    <p className="text-[11px] text-amber-300/80 mt-0.5">
                      {t('ui.floodModal.futureMoseBody', { at: formatExtremeStamp(futureMosePeak.at, language) })}
                    </p>
                  </div>
                </div>
              )}

              {/* Nota metodologica e serie storica */}
              <div className="p-3 rounded-xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-1 text-[11px] font-mono text-[var(--ink-3)]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--ink-2)]">{t('ui.floodModal.forecastNoteTitle')}</span>
                  <span className="text-cyan-400">Punta della Salute</span>
                </div>
                <p>{t('ui.floodModal.forecastNoteBody')}</p>
              </div>

              {/* Forecast Extremes List */}
              <div className="flex flex-col gap-2">
                {forecast?.extremes && forecast.extremes.length > 0 ? (
                  forecast.extremes.map((ex, i) => {
                    const isMax = ex.type === 'max';
                    const isMose = ex.levelCm >= 110;
                    return (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
                          isMose
                            ? 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                            : isMax && ex.levelCm >= 80
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                            : 'bg-[var(--rule)]/25 border-[var(--rule)] text-[var(--ink)]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg shrink-0 ${isMax ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                            {isMax ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-bold text-sm">
                              {formatExtremeStamp(ex.at, language)}
                            </div>
                            <div className="text-[11px] text-[var(--ink-3)]">
                              {isMax ? t('ui.floodModal.peakMax') : t('ui.floodModal.peakMin')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right flex flex-col items-end">
                            <span className={`text-base font-bold font-mono ${isMose ? 'text-rose-400' : isMax ? 'text-amber-400' : 'text-blue-400'}`}>
                              {formatSignedCm(ex.levelCm)}
                            </span>
                            {getFloodedGroundPercentage(ex.levelCm) > 0 && (
                              <span className="text-[10px] text-blue-300 font-mono font-semibold">
                                {t('ui.floodModal.floodedShort', { pct: getFloodedGroundPercentage(ex.levelCm) })}
                              </span>
                            )}
                            {isMose && (
                              <div className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-semibold mt-0.5">
                                MOSE
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleLevelChange(ex.levelCm);
                              setActiveTab('simulator');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[var(--rule)] hover:bg-blue-500 hover:text-white text-[11px] font-mono transition-all cursor-pointer"
                            title={t('ui.floodModal.simulatePeak')}
                          >
                            {t('ui.floodModal.simulate')}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-xs font-mono text-[var(--ink-3)] bg-[var(--rule)]/20 rounded-xl">
                    {t('ui.floodModal.noForecast')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SIRENE ACUSTICHE */}
          {activeTab === 'sirens' && (
            <div className="flex flex-col gap-3">
              <div className="p-3.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] text-xs font-mono">
                <div className="flex items-center gap-2 font-bold text-[var(--ink)] mb-1">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span>{t('ui.floodModal.sirenTitle')}</span>
                </div>
                <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
                  {t('ui.floodModal.sirenNoticeTime')}
                </p>
              </div>

              {/* Siren Scale */}
              <div className="flex flex-col gap-2">
                {sirenLevels.map((s) => (
                  <div
                    key={s.level}
                    className={`p-3.5 rounded-xl border flex flex-col gap-1.5 transition-all ${
                      s.active ? `${s.color} border-2 shadow-sm` : 'bg-[var(--rule)]/15 border-[var(--rule)] opacity-70 text-[var(--ink-2)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">{s.title}</span>
                        <span className="text-[11px] font-mono opacity-80 font-semibold">{s.quota}</span>
                      </div>
                      {s.active && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 font-bold">
                          {t('ui.floodModal.sirenActiveForTide')}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      {s.desc}
                    </p>
                    <div className="flex items-center gap-1.5 pt-1">
                      {s.tones === 0 ? (
                        <span className="text-[10px] font-mono text-[var(--ink-3)]">{t('ui.floodModal.noTones')}</span>
                      ) : (
                        Array.from({ length: s.tones }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-2 rounded-full transition-all ${
                              s.active ? 'bg-current' : 'bg-[var(--rule)]'
                            }`}
                            style={{ width: `${20 + idx * 10}px` }}
                          />
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: METEO-MARINO CPSM (VENTO & ONDE) */}
          {activeTab === 'meteo' && (
            <div className="flex flex-col gap-3">
              <div className="p-3.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] text-xs font-mono">
                <div className="flex items-center gap-2 font-bold text-[var(--ink)] mb-1">
                  <Wind className="w-4 h-4 text-cyan-400" />
                  <span>{t('ui.floodModal.marineTitle')}</span>
                </div>
                <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
                  {t('ui.floodModal.marineSubtitle')}
                </p>
              </div>

              {/* Wind Regime Diagnosis */}
              {meteoAnalysis && (
                <div className={`p-3 rounded-xl border text-xs font-mono ${
                  meteoAnalysis.isScirocco
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                    : meteoAnalysis.isBora
                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-200'
                    : 'bg-[var(--rule)]/25 border-[var(--rule)] text-[var(--ink-2)]'
                }`}>
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    <span>{t('ui.floodModal.windSummary', { deg: meteoAnalysis.avgDeg, gust: meteoAnalysis.maxGust })}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {meteoAnalysis.isScirocco
                      ? t('ui.floodModal.windRegimeScirocco')
                      : meteoAnalysis.isBora
                      ? t('ui.floodModal.windRegimeBora')
                      : t('ui.floodModal.windRegimeStandard')}
                  </p>
                </div>
              )}

              {/* Station Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {marineWindStations.slice(0, 6).map((st) => (
                  <div key={st.id} className="p-3 rounded-xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--ink)] truncate">{st.stationName}</span>
                      <span className="text-[10px] text-cyan-400 font-semibold shrink-0 ml-1">{st.windDirection}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-[var(--ink-3)]">
                      <div>
                        {t('ui.floodModal.wind')}: <strong className="text-[var(--ink)]">{st.windSpeedKnots} kt</strong> ({st.windSpeedKmh} km/h)
                      </div>
                      <div>
                        {t('ui.floodModal.gust')}: <strong className="text-[var(--ink)]">{st.gustSpeedKnots} kt</strong>
                      </div>
                      {st.waveHeightMeters !== null && (
                        <div className="col-span-2 text-cyan-300">
                          {t('ui.floodModal.wave')}: <strong className="text-[var(--ink)]">{st.waveHeightMeters} m</strong>
                        </div>
                      )}
                      {st.airTempCelsius !== undefined && (
                        <div>
                          {t('ui.floodModal.temp')}: <strong className="text-[var(--ink)]">{st.airTempCelsius}°C</strong>
                        </div>
                      )}
                      {st.pressureHpa !== undefined && (
                        <div>
                          {t('ui.floodModal.pressure')}: <strong className="text-[var(--ink)]">{st.pressureHpa} hPa</strong>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Official Scientific Lineage */}
          <div className="text-[10px] font-mono text-[var(--ink-3)] border-t border-[var(--rule)] pt-3">
            {t('ui.floodModal.cpsmInfo')}
          </div>

          {/* Action Explore on Map */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[var(--rule)]">
            <span className="text-[11px] font-mono text-[var(--ink-3)]">
              {simulatedCm >= 80 ? t('ui.floodModal.exploreMapInfo') : t('ui.floodModal.passerelleNone')}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-mono font-semibold shadow-lg hover:shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <Waves className="w-4 h-4" />
              <span>{t('ui.floodModal.exploreMap')}</span>
            </button>
          </div>
        </div>
    </Modal>
  );
};
