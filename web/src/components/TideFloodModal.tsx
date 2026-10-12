'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Waves, X, Sliders, Calendar, Volume2, Wind, Compass, Radio } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import type { TideForecast, TideStation } from '@/lib/contracts/tide';
import type { LagoonWaterQualityItem, MeteoMarineWindItem, PasserellaItem } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { LagoonHydroPanel } from './LagoonHydroPanel';
import { SimulatorTab } from './tideModal/SimulatorTab';
import { ForecastTab } from './tideModal/ForecastTab';
import { SirensTab } from './tideModal/SirensTab';
import { MeteoTab } from './tideModal/MeteoTab';
import { ChannelsTab } from './tideModal/ChannelsTab';

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
  /** percorsi su passerelle del piano (caricati quando la finestra è aperta) */
  passerelle?: PasserellaItem[];
  isPlayingCycle?: boolean;
  onToggleCycle?: () => void;
  /** rete mareografica CPSM, per la scheda Laguna */
  tideStations?: TideStation[];
  /** sonde ARPAV, per la scheda Laguna */
  lagoonWater?: LagoonWaterQualityItem[];
  onActivateCurrents?: () => void;
  onActivateLagoonWater?: () => void;
}

type ModalTab = 'simulator' | 'forecast' | 'lagoon' | 'sirens' | 'meteo' | 'channels';

const TABS: { id: ModalTab; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { id: 'simulator', icon: Sliders, label: 'ui.floodModal.tabSimulator' },
  { id: 'forecast', icon: Calendar, label: 'ui.floodModal.tabForecast' },
  { id: 'lagoon', icon: Compass, label: 'ui.floodModal.tabLagoon' },
  { id: 'sirens', icon: Volume2, label: 'ui.floodModal.tabSirens' },
  { id: 'meteo', icon: Wind, label: 'ui.floodModal.tabMeteo' },
  { id: 'channels', icon: Radio, label: 'ui.floodModal.tabChannels' },
];

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
  passerelle = [],
  isPlayingCycle,
  onToggleCycle,
  tideStations,
  lagoonWater,
  onActivateCurrents,
  onActivateLagoonWater
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ModalTab>('simulator');
  const [draftCm, setDraftCm] = useState<number | null>(null);
  const [localCycling, setLocalCycling] = useState(false);
  const isCycling = isPlayingCycle !== undefined ? isPlayingCycle : localCycling;
  const simulatedCm = simulatedTideLevel ?? draftCm ?? liveTideLevel ?? 65;

  const modalCycleRef = useRef<{ startTime: number; startLevel: number; phaseOffset: number } | null>(null);

  // Senza un ciclo globale passato dal parent, la finestra usa un ciclo locale
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
    if (onToggleCycle) onToggleCycle();
    else setLocalCycling((c) => !c);
  };

  const stopCycle = () => {
    if (isPlayingCycle && onToggleCycle) onToggleCycle();
    setLocalCycling(false);
  };

  const handleLevelChange = (cm: number) => {
    stopCycle();
    setDraftCm(cm);
    onSimulatedTideChange?.(cm);
  };

  const handleResetToLive = () => {
    stopCycle();
    setDraftCm(null);
    onSimulatedTideChange?.(null);
  };

  if (!isOpen) return null;

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

        {/* Schede */}
        <div className="flex items-center gap-1 px-4 sm:px-5 pt-2 border-b border-[var(--rule)] bg-[var(--rule)]/10 overflow-x-auto no-scrollbar shrink-0">
          {TABS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === id ? 'border-blue-500 text-blue-400 font-bold' : 'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t(label)}</span>
              {id === 'forecast' && forecast && forecast.extremes.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 text-[10px]">{forecast.extremes.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-4 flex-1">
          {activeTab === 'simulator' && (
            <SimulatorTab
              simulatedCm={simulatedCm}
              liveTideLevel={liveTideLevel}
              isMoseProtected={isMoseProtected}
              isCycling={isCycling}
              passerelle={passerelle}
              onToggleCycle={handleToggleCycle}
              onLevelChange={handleLevelChange}
              onResetToLive={handleResetToLive}
              onShowOnMap={() => {
                onSimulatedTideChange?.(simulatedCm);
                onClose();
              }}
              onToggleMoseProtection={onToggleMoseProtection}
              onActivatePasserelle={() => {
                onActivatePasserelle();
                onClose();
              }}
            />
          )}

          {activeTab === 'forecast' && (
            <ForecastTab
              forecast={forecast}
              liveTideLevel={liveTideLevel}
              onSimulate={(cm) => {
                handleLevelChange(cm);
                setActiveTab('simulator');
              }}
              onShowChannels={() => setActiveTab('channels')}
            />
          )}

          {activeTab === 'sirens' && <SirensTab simulatedCm={simulatedCm} />}

          {activeTab === 'meteo' && <MeteoTab marineWindStations={marineWindStations} />}

          {activeTab === 'channels' && <ChannelsTab />}

          {activeTab === 'lagoon' && (
            <LagoonHydroPanel
              forecast={forecast}
              stations={tideStations}
              lagoonWater={lagoonWater}
              onActivateCurrents={onActivateCurrents ? () => { onActivateCurrents(); onClose(); } : undefined}
              onActivateLagoonWater={onActivateLagoonWater ? () => { onActivateLagoonWater(); onClose(); } : undefined}
            />
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
