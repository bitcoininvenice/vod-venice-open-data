'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Compass, Droplet, ExternalLink, Gauge, Layers, Timer } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { formatSignedCm } from '@/lib/time';
import type { TideForecast, TideStation } from '@/lib/contracts/tide';
import type { LagoonWaterQualityItem } from '@/lib/types';
import {
  LAGOON_CURRENT_CHANNELS,
  OFFICIAL_LAGOON_SOURCES,
  computeLagoonCurrentState,
  evaluateArpavWaterQuality,
  type ArpavQualityStatus,
} from '@/lib/lagoonCurrents';

interface LagoonHydroPanelProps {
  forecast?: TideForecast | null;
  /** rete mareografica CPSM (stazioni con misura) */
  stations?: TideStation[];
  /** ultime misure delle sonde ARPAV (vuoto finché /api/regional-data non risponde) */
  lagoonWater?: LagoonWaterQualityItem[];
  onActivateCurrents?: () => void;
  onActivateLagoonWater?: () => void;
}

const PHASE_STYLE = {
  FLUSSO: 'bg-sky-500/15 border-sky-500/40 text-sky-300',
  RIFLUSSO: 'bg-teal-500/15 border-teal-500/40 text-teal-300',
  STANCA: 'bg-slate-500/15 border-slate-500/40 text-slate-300',
  NONE: 'bg-[var(--rule)]/30 border-[var(--rule)] text-[var(--ink-3)]',
} as const;

const QUALITY_ORDER: ArpavQualityStatus[] = ['ELEVATO', 'BUONO', 'SUFFICIENTE', 'SCARSO'];

function mean(values: Array<number | null>): number | null {
  const v = values.filter((x): x is number => x !== null);
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
}

export const LagoonHydroPanel: React.FC<LagoonHydroPanelProps> = ({
  forecast,
  stations = [],
  lagoonWater = [],
  onActivateCurrents,
  onActivateLagoonWater,
}) => {
  const { t } = useTranslation();

  // Aggiorna la fase ogni 30 secondi (conto alla rovescia verso la stanca)
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const state = useMemo(
    () => computeLagoonCurrentState(forecast, now),
    [forecast, now]
  );

  const sortedStations = useMemo(
    () => [...stations].filter((s) => Number.isFinite(s.levelCm)).sort((a, b) => b.levelCm - a.levelCm),
    [stations]
  );

  const arpav = useMemo(() => {
    if (lagoonWater.length === 0) return null;
    const counts: Record<string, number> = {};
    for (const s of lagoonWater) {
      const q = evaluateArpavWaterQuality(s.chlorophyllUgL, s.dissolvedOxygenPercent);
      if (q) counts[q.status] = (counts[q.status] ?? 0) + 1;
    }
    const latest = lagoonWater.reduce((m, s) => (s.sampledAt > m ? s.sampledAt : m), '');
    return {
      counts,
      latest,
      temp: mean(lagoonWater.map((s) => s.waterTempCelsius)),
      salinity: mean(lagoonWater.map((s) => s.salinityPsu)),
      oxygen: mean(lagoonWater.map((s) => s.dissolvedOxygenPercent)),
      chl: mean(lagoonWater.map((s) => s.chlorophyllUgL)),
    };
  }, [lagoonWater]);

  const inlets = LAGOON_CURRENT_CHANNELS.filter((c) => c.zone === 'BOCCHE_DI_PORTO');
  const others = LAGOON_CURRENT_CHANNELS.filter((c) => c.zone !== 'BOCCHE_DI_PORTO');

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Stato stimato delle correnti */}
      <section className={`p-4 rounded-xl border flex flex-col gap-2 ${PHASE_STYLE[state?.phase ?? 'NONE']}`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-mono uppercase">{t('ui.lagoonHydro.nowTitle')}</span>
          </div>
          {onActivateCurrents && (
            <button
              type="button"
              onClick={onActivateCurrents}
              className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-[11px] font-mono flex items-center gap-1 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              {t('ui.lagoonHydro.showCurrents')}
            </button>
          )}
        </div>
        {state ? (
          <>
            <p className="text-xl font-extrabold text-[var(--ink)]">{t(`ui.lagoonHydro.phase_${state.phase}`)}</p>
            <p className="text-xs text-[var(--ink-2)]">{t(`ui.lagoonHydro.phaseDesc_${state.phase}`)}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
              <div className="p-2 rounded-lg bg-black/20">
                <span className="text-[10px] font-mono text-[var(--ink-3)] uppercase">{t('ui.lagoonHydro.inlets')}</span>
                <p className="font-mono font-bold text-[var(--ink)]">~{state.inletSpeedKnotsEst} kn <span className="text-[11px] font-normal">({state.inletSpeedMsEst} m/s)</span></p>
              </div>
              <div className="p-2 rounded-lg bg-black/20">
                <span className="text-[10px] font-mono text-[var(--ink-3)] uppercase">{t('ui.lagoonHydro.cityCanals')}</span>
                <p className="font-mono font-bold text-[var(--ink)]">~{state.urbanSpeedKnotsEst} kn <span className="text-[11px] font-normal">({state.urbanSpeedMsEst} m/s)</span></p>
              </div>
              <div className="p-2 rounded-lg bg-black/20 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-mono text-[var(--ink-3)] uppercase flex items-center gap-1"><Timer className="w-3 h-3" />{t('ui.lagoonHydro.nextSlack')}</span>
                <p className="font-mono font-bold text-[var(--ink)]">
                  {`${Math.floor(state.nextSlackMinutes / 60)}h ${String(state.nextSlackMinutes % 60).padStart(2, '0')}m`}
                </p>
                <span className="text-[10px] font-mono text-[var(--ink-3)]">
                  {t('ui.lagoonHydro.nextSlackAt', { time: state.nextSlack.time, cm: formatSignedCm(state.nextSlack.levelCm) })}
                </span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--ink-2)]">{t('ui.lagoonHydro.unavailable')}</p>
        )}
        <span className="text-[10px] text-[var(--ink-3)]">{t('ui.lagoonHydro.estimateNote')}</span>
      </section>

      {/* 2. Canali */}
      <section className="p-4 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-2">
        <span className="text-xs font-mono uppercase text-[var(--ink-3)]">{t('ui.lagoonHydro.perChannel')}</span>
        <div className="flex flex-col divide-y divide-[var(--rule)]">
          {[...inlets, ...others].map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 py-1.5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--ink)] truncate">{c.name}</p>
                <p className="text-[10px] font-mono text-[var(--ink-3)]">
                  {t('ui.lagoonHydro.typicalPeak', { kn: c.maxSpeedKnots, m: c.depthMeters })}
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-300 shrink-0">
                {!state ? 'n.d.' : state.phase === 'STANCA' ? t('ui.lagoonHydro.slack') : `~${(c.maxSpeedKnots * state.speedFactor).toFixed(1)} kn`}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Rete mareografica */}
      <section className="p-4 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-mono uppercase text-[var(--ink-3)]">
            {t('ui.lagoonHydro.gaugeNetwork', { n: sortedStations.length })}
          </span>
        </div>
        {sortedStations.length === 0 ? (
          <p className="text-xs text-[var(--ink-3)]">{t('ui.lagoonHydro.stationsUnavailable')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            {sortedStations.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-1 border-b border-[var(--rule)]/60">
                <span className="text-xs text-[var(--ink-2)] truncate">{s.name}</span>
                <span className={`text-xs font-mono font-bold ${s.levelCm >= 110 ? 'text-rose-400' : s.levelCm >= 80 ? 'text-amber-400' : 'text-blue-300'}`}>
                  {formatSignedCm(s.levelCm)}
                </span>
              </div>
            ))}
          </div>
        )}
        <span className="text-[10px] text-[var(--ink-3)]">{t('ui.lagoonHydro.rmlvNote')}</span>
      </section>

      {/* 4. Qualita acque ARPAV */}
      <section className="p-4 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Droplet className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono uppercase text-[var(--ink-3)]">
              {t('ui.lagoonHydro.arpavProbes', { n: lagoonWater.length })}
            </span>
          </div>
          {onActivateLagoonWater && (
            <button
              type="button"
              onClick={onActivateLagoonWater}
              className="px-2.5 py-1 rounded-lg bg-[var(--rule)] hover:bg-cyan-500/30 text-[var(--ink)] text-[11px] font-mono flex items-center gap-1 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              {t('ui.lagoonHydro.showProbes')}
            </button>
          )}
        </div>
        {!arpav ? (
          <p className="text-xs text-[var(--ink-3)]">{t('ui.lagoonHydro.loadingArpav')}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([
                [t('ui.lagoonHydro.meanTemp'), arpav.temp, '°C'],
                [t('ui.lagoonHydro.meanSalinity'), arpav.salinity, 'PSU'],
                [t('ui.lagoonHydro.meanOxygen'), arpav.oxygen, '%'],
                [t('ui.lagoonHydro.meanChl'), arpav.chl, 'µg/l'],
              ] as const).map(([label, v, unit]) => (
                <div key={label} className="p-2 rounded-lg bg-black/20">
                  <span className="text-[10px] font-mono text-[var(--ink-3)] uppercase">{label}</span>
                  <p className="font-mono font-bold text-[var(--ink)]">{v ?? 'n.d.'} <span className="text-[11px] font-normal">{v !== null ? unit : ''}</span></p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUALITY_ORDER.filter((k) => arpav.counts[k]).map((k) => (
                <span key={k} className="px-2 py-0.5 rounded-full text-[10px] font-mono border border-[var(--rule)] text-[var(--ink-2)]">
                  {t(`ui.lagoonHydro.quality_${k}`)}: {arpav.counts[k]}
                </span>
              ))}
            </div>
            <span className="text-[10px] text-[var(--ink-3)]">
              {t('ui.lagoonHydro.arpavNote', { date: arpav.latest.split('-').reverse().join('/') })}
            </span>
          </>
        )}
      </section>

      {/* 5. Fonti ufficiali */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Object.entries(OFFICIAL_LAGOON_SOURCES).map(([key, src]) => (
          <a
            key={src.url}
            href={src.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl border border-[var(--rule)] hover:border-cyan-500/50 bg-[var(--rule)]/20 flex flex-col gap-1 transition-colors"
          >
            <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1">
              {src.name}
              <ExternalLink className="w-3 h-3 text-[var(--ink-3)]" />
            </span>
            <span className="text-[11px] text-[var(--ink-3)]">{t(`ui.lagoonHydro.source_${key}`)}</span>
          </a>
        ))}
      </section>
    </div>
  );
};
