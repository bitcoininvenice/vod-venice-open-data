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
  type ArpavWaterQualityEvaluation,
} from '@/lib/lagoonCurrents';

interface LagoonHydroPanelProps {
  liveTideLevel: number | null;
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
} as const;

const QUALITY_ORDER: ArpavWaterQualityEvaluation['status'][] = ['ELEVATO', 'BUONO', 'SUFFICIENTE', 'SCARSO', 'CATTIVO'];

function mean(values: Array<number | null>): number | null {
  const v = values.filter((x): x is number => x !== null);
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
}

export const LagoonHydroPanel: React.FC<LagoonHydroPanelProps> = ({
  liveTideLevel,
  forecast,
  stations = [],
  lagoonWater = [],
  onActivateCurrents,
  onActivateLagoonWater,
}) => {
  const { language } = useTranslation();
  const isIt = language === 'it';

  // Aggiorna la fase ogni 30 secondi (conto alla rovescia verso la stanca)
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const state = useMemo(
    () => computeLagoonCurrentState(liveTideLevel ?? 0, forecast?.extremes ?? null, now),
    [liveTideLevel, forecast, now]
  );

  const sortedStations = useMemo(
    () => [...stations].filter((s) => Number.isFinite(s.levelCm)).sort((a, b) => b.levelCm - a.levelCm),
    [stations]
  );

  const arpav = useMemo(() => {
    if (lagoonWater.length === 0) return null;
    const counts: Record<string, number> = {};
    for (const s of lagoonWater) {
      const q = evaluateArpavWaterQuality(s.chlorophyllUgL, s.dissolvedOxygenPercent, s.salinityPsu);
      counts[q.status] = (counts[q.status] ?? 0) + 1;
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
      {/* 1. Stato idrodinamico live */}
      <section className={`p-4 rounded-xl border flex flex-col gap-2 ${PHASE_STYLE[state.phase]}`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-mono uppercase">{isIt ? 'Stato delle correnti ora' : 'Current state now'}</span>
          </div>
          {onActivateCurrents && (
            <button
              type="button"
              onClick={onActivateCurrents}
              className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-[11px] font-mono flex items-center gap-1 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              {isIt ? 'Mostra correnti in mappa' : 'Show currents on map'}
            </button>
          )}
        </div>
        <p className="text-xl font-extrabold text-[var(--ink)]">{isIt ? state.labelIt : state.labelEn}</p>
        <p className="text-xs text-[var(--ink-2)]">{isIt ? state.descIt : state.descEn}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
          <div className="p-2 rounded-lg bg-black/20">
            <span className="text-[10px] font-mono text-[var(--ink-3)] uppercase">{isIt ? 'Bocche di porto' : 'Sea inlets'}</span>
            <p className="font-mono font-bold text-[var(--ink)]">~{state.inletSpeedKnotsEst} kn <span className="text-[11px] font-normal">({state.inletSpeedMsEst} m/s)</span></p>
          </div>
          <div className="p-2 rounded-lg bg-black/20">
            <span className="text-[10px] font-mono text-[var(--ink-3)] uppercase">{isIt ? 'Canali urbani' : 'City canals'}</span>
            <p className="font-mono font-bold text-[var(--ink)]">~{state.urbanSpeedKnotsEst} kn <span className="text-[11px] font-normal">({state.urbanSpeedMsEst} m/s)</span></p>
          </div>
          <div className="p-2 rounded-lg bg-black/20 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono text-[var(--ink-3)] uppercase flex items-center gap-1"><Timer className="w-3 h-3" />{isIt ? 'Prossima stanca' : 'Next slack'}</span>
            <p className="font-mono font-bold text-[var(--ink)]">
              {state.nextSlackMinutes !== null
                ? `${Math.floor(state.nextSlackMinutes / 60)}h ${String(state.nextSlackMinutes % 60).padStart(2, '0')}m`
                : 'n.d.'}
            </p>
            {state.nextSlackLabel && <span className="text-[10px] font-mono text-[var(--ink-3)]">{state.nextSlackLabel}</span>}
          </div>
        </div>
        <span className="text-[10px] text-[var(--ink-3)]">
          {isIt
            ? 'Stima cinematica dalla marea CPSM (colmi e cavi previsti) e da velocita tipiche di letteratura. Nessun ente pubblica correnti lagunari misurate in tempo reale come open data. Non usare per la navigazione.'
            : 'Kinematic estimate from the CPSM tide (forecast highs and lows) and typical literature speeds. No agency publishes measured real-time lagoon currents as open data. Not for navigation.'}
        </span>
      </section>

      {/* 2. Canali */}
      <section className="p-4 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-2">
        <span className="text-xs font-mono uppercase text-[var(--ink-3)]">{isIt ? 'Correnti stimate per canale' : 'Estimated currents per channel'}</span>
        <div className="flex flex-col divide-y divide-[var(--rule)]">
          {[...inlets, ...others].map((c) => {
            const kn = (c.maxSpeedKnots * state.speedFactor).toFixed(1);
            return (
              <div key={c.id} className="flex items-center justify-between gap-2 py-1.5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--ink)] truncate">{c.name}</p>
                  <p className="text-[10px] font-mono text-[var(--ink-3)]">
                    {isIt ? 'picco tipico' : 'typical peak'} {c.maxSpeedKnots} kn · {c.depthMeters} m
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-300 shrink-0">
                  {state.phase === 'STANCA' ? (isIt ? 'stanca' : 'slack') : `~${kn} kn`}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Rete mareografica */}
      <section className="p-4 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-mono uppercase text-[var(--ink-3)]">
            {isIt ? `Rete mareografica CPSM (${sortedStations.length} stazioni)` : `CPSM tide-gauge network (${sortedStations.length} stations)`}
          </span>
        </div>
        {sortedStations.length === 0 ? (
          <p className="text-xs text-[var(--ink-3)]">{isIt ? 'Dati delle stazioni non disponibili.' : 'Station data unavailable.'}</p>
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
        <span className="text-[10px] text-[var(--ink-3)]">
          {isIt
            ? 'Molti sensori lagunari sono condivisi con la rete RMLV di ISPRA, che pubblica anche serie storiche e meteo-marine.'
            : 'Many lagoon sensors are shared with the ISPRA RMLV network, which also publishes historical and marine-weather series.'}
        </span>
      </section>

      {/* 4. Qualita acque ARPAV */}
      <section className="p-4 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Droplet className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono uppercase text-[var(--ink-3)]">
              {isIt ? `Sonde ARPAV in laguna (${lagoonWater.length})` : `ARPAV lagoon probes (${lagoonWater.length})`}
            </span>
          </div>
          {onActivateLagoonWater && (
            <button
              type="button"
              onClick={onActivateLagoonWater}
              className="px-2.5 py-1 rounded-lg bg-[var(--rule)] hover:bg-cyan-500/30 text-[var(--ink)] text-[11px] font-mono flex items-center gap-1 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              {isIt ? 'Mostra sonde in mappa' : 'Show probes on map'}
            </button>
          )}
        </div>
        {!arpav ? (
          <p className="text-xs text-[var(--ink-3)]">{isIt ? 'Caricamento delle misure ARPAV...' : 'Loading ARPAV measurements...'}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([
                [isIt ? 'Temp. media' : 'Mean temp.', arpav.temp, '°C'],
                [isIt ? 'Salinita media' : 'Mean salinity', arpav.salinity, 'PSU'],
                [isIt ? 'Ossigeno medio' : 'Mean oxygen', arpav.oxygen, '%'],
                [isIt ? 'Clorofilla media' : 'Mean chlorophyll', arpav.chl, 'µg/l'],
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
                  {k}: {arpav.counts[k]}
                </span>
              ))}
            </div>
            <span className="text-[10px] text-[var(--ink-3)]">
              {isIt
                ? `Ultimo campionamento ${arpav.latest.split('-').reverse().join('/')}. Misure periodiche, non in tempo reale. Le classi sono indicative (clorofilla e ossigeno), non la classificazione ufficiale WFD.`
                : `Latest sampling ${arpav.latest.split('-').reverse().join('/')}. Periodic measurements, not real time. Classes are indicative (chlorophyll and oxygen), not the official WFD classification.`}
            </span>
          </>
        )}
      </section>

      {/* 5. Fonti ufficiali */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Object.values(OFFICIAL_LAGOON_SOURCES).map((src) => (
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
            <span className="text-[11px] text-[var(--ink-3)]">{src.networkDesc}</span>
          </a>
        ))}
      </section>
    </div>
  );
};
