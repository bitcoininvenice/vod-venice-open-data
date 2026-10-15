'use client';

import React from 'react';
import { CheckCircle2, Compass, Layers, Pause, Play, Waves } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { formatSignedCm } from '@/lib/time';
import { getFloodedGroundPercentage } from '@/lib/flood';
import { resolveTideState } from '@/lib/tideCurve';
import { isPasserellaExpected } from '@/lib/passerelle';
import { MOSE_GATES } from '@/lib/moseGates';
import type { PasserellaItem } from '@/lib/types';

interface SimulatorTabProps {
  simulatedCm: number;
  liveTideLevel: number | null;
  isMoseProtected: boolean;
  isCycling: boolean;
  /** percorsi del piano (dati caricati con la finestra) */
  passerelle: PasserellaItem[];
  onToggleCycle: () => void;
  onLevelChange: (cm: number) => void;
  onResetToLive: () => void;
  onShowOnMap: () => void;
  onToggleMoseProtection?: () => void;
  onActivatePasserelle: () => void;
}

/** Classe CPSM della marea (la stessa di server/sources/tide.ts) */
function tideCode(cm: number): { key: string; color: string } {
  if (cm < 80) return { key: 'catNormal', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
  if (cm < 110) return { key: 'catSustained', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
  if (cm < 140) return { key: 'catVerySustained', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
  return { key: 'catExceptional', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
}

function floodDescKey(cm: number): string {
  if (cm < 80) return 'floodDesc0';
  if (cm < 100) return 'floodDesc80';
  if (cm < 110) return 'floodDesc100';
  if (cm < 120) return 'floodDesc110';
  if (cm < 130) return 'floodDesc120';
  return 'floodDesc130';
}

export const SimulatorTab: React.FC<SimulatorTabProps> = ({
  simulatedCm,
  liveTideLevel,
  isMoseProtected,
  isCycling,
  passerelle,
  onToggleCycle,
  onLevelChange,
  onResetToLive,
  onShowOnMap,
  onToggleMoseProtection,
  onActivatePasserelle,
}) => {
  const { t } = useTranslation();
  // Stesso modello usato dalla mappa: con il MOSE alzato il livello in città resta sotto +80 cm
  const state = resolveTideState({ simulatedTideLevel: simulatedCm, isMoseProtected });
  const cityCm = state.lagoonTideCm ?? simulatedCm;
  const floodedPercent = getFloodedGroundPercentage(cityCm);
  const code = tideCode(simulatedCm);
  const routes = [...passerelle]
    .sort((a, b) => a.activationThresholdCm - b.activationThresholdCm)
    .map((p) => ({ id: p.id, threshold: p.activationThresholdCm, name: p.name, active: isPasserellaExpected(p, cityCm) }));

  const presets = [
    { cm: 65, label: t('ui.floodModal.presetNormal') },
    { cm: 80, label: t('ui.floodModal.presetSanMarco') },
    { cm: 100, label: t('ui.floodModal.presetRialto') },
    { cm: 110, label: t('ui.floodModal.presetMose') },
    { cm: 130, label: t('ui.floodModal.presetAlert') },
    { cm: 140, label: t('ui.floodModal.presetExceptional') },
    { cm: 187, label: '2019 (+187 cm)' },
    { cm: 194, label: '1966 (+194 cm)' },
    { cm: 200, label: t('ui.floodModal.presetMax') },
  ];

  return (
    <>
      <p className="text-[11px] leading-relaxed text-[var(--ink-3)] px-1" data-testid="simulator-disclaimer">
        {t('ui.floodModal.disclaimer')}
      </p>
      {/* Livello simulato */}
      <div className="p-4 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-[var(--ink-3)] uppercase">{t('ui.floodModal.simulatedTide')}</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl sm:text-4xl font-extrabold font-mono tabular ${simulatedCm >= 110 ? 'text-rose-400' : 'text-blue-400'}`}>
                {formatSignedCm(simulatedCm)}
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${code.color}`}>{t(`ui.floodModal.${code.key}`)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={onToggleCycle}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                isCycling
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold shadow-sm'
                  : 'bg-[var(--rule)]/40 hover:bg-[var(--rule)] text-[var(--ink-2)] border-transparent'
              }`}
              title={t(isCycling ? 'ui.floodModal.cyclePauseTitle' : 'ui.floodModal.cycleStartTitle')}
            >
              {isCycling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{t(isCycling ? 'ui.floodModal.cyclePause' : 'ui.floodModal.cycleStart')}</span>
            </button>

            <button
              type="button"
              onClick={onShowOnMap}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-medium text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title={t('ui.floodModal.showOnMapSimTitle')}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{t('ui.floodModal.showOnMapSim')}</span>
            </button>

            {liveTideLevel !== null && (
              <button
                type="button"
                onClick={onResetToLive}
                className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-mono transition-all cursor-pointer"
              >
                {t('ui.floodModal.liveTide')} ({formatSignedCm(liveTideLevel)})
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <input
            type="range"
            min="50"
            max="200"
            step="1"
            value={simulatedCm}
            onChange={(e) => onLevelChange(Number(e.target.value))}
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

          <div className="flex flex-wrap gap-1.5 pt-1">
            {presets.map((sc) => (
              <button
                key={sc.cm}
                type="button"
                onClick={() => onLevelChange(sc.cm)}
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

      {/* Suolo allagato */}
      <div className="p-4 rounded-xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[var(--ink-2)]">{t('ui.floodModal.floodedArea')}</span>
          <span className={`font-bold tabular ${floodedPercent > 15 ? 'text-rose-400' : 'text-cyan-400'}`}>
            {t('ui.floodModal.floodedOfCentre', { pct: floodedPercent })}
            {state.isMoseRaised && <span className="text-emerald-400 font-normal ml-1.5 text-[10px]">{t('ui.floodModal.moseLimited')}</span>}
          </span>
        </div>
        <div className="w-full h-3 bg-[var(--rule)] rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${floodedPercent > 50 ? 'bg-rose-500' : floodedPercent > 10 ? 'bg-amber-500' : 'bg-cyan-500'}`}
            style={{ width: `${floodedPercent}%` }}
          />
        </div>
        <div className="text-[11px] font-mono text-[var(--ink-3)]">
          {state.isMoseRaised ? t('ui.floodModal.moseProtectedDesc') : t(`ui.floodModal.${floodDescKey(simulatedCm)}`)}
        </div>
      </div>

      {/* MOSE */}
      <div className="p-4 rounded-xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--ink-2)] uppercase font-semibold">{t('ui.floodModal.moseStatus')}</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${
              isMoseProtected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              {t(!isMoseProtected ? 'ui.floodModal.moseBadgeOff' : state.isMoseRaised ? 'ui.floodModal.moseBadgeActive' : 'ui.floodModal.moseBadgeArmed')}
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
                {t(isMoseProtected ? 'ui.floodModal.moseToggleOff' : 'ui.floodModal.moseToggleOn')}
              </button>
            )}
            {state.isMoseRaised ? (
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
          {MOSE_GATES.map((g) => (
            <div key={g.id} className="p-2 rounded-lg bg-[var(--rule)]/40 border border-[var(--rule)]">
              <div className="text-[var(--ink-3)]">{g.inletName}</div>
              <div className="font-bold text-[var(--ink)]">{t('ui.floodModal.gates', { n: g.barriersCount })}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Passerelle previste al livello in città */}
      <div className="p-4 rounded-xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-[var(--ink-2)] uppercase font-semibold">
            {t('ui.floodModal.passerelleActive')} ({routes.filter((r) => r.active).length}/{routes.length})
          </span>
          <button
            type="button"
            onClick={onActivatePasserelle}
            className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t('ui.floodModal.viewOnMap')}</span>
          </button>
        </div>

        <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
          {routes.map((r) => (
            <div
              key={r.id}
              className={`flex items-center justify-between p-2 rounded-lg text-xs font-mono border ${
                r.active ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-[var(--rule)]/20 border-transparent text-[var(--ink-3)] opacity-60'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="px-1.5 py-0.5 rounded bg-[var(--rule)] text-[10px] shrink-0 font-bold">+{r.threshold} cm</span>
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
  );
};
