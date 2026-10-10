'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Footprints, MapPin, Route, Ship, ArrowDownUp, Crosshair } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { InfoHeader, InfoPanel } from '@/components/ui/InfoPanel';
import { useSimulation } from '@/lib/simulationModel';
import { buildWalkGraph, type RawWalk, type WalkGraph } from '@/lib/walkGraph';
import { WALK_URL } from '@/lib/walk-data';
import { planTrip, type Itinerary, type PlannerPoint } from '@/lib/tripPlanner';
import { ACTV_STOPS_REFERENCE } from '@/lib/stopsReference';
import { clock } from '@/lib/tripView';
import { romeDayType, romeSecondsOfDay } from '@/lib/time';
import { civicLabel, parseCivicQuery, type CivicMatch } from '@/lib/civici';
import { lineColor, lineTextColor } from '@/lib/actvLines';

let walkPromise: Promise<WalkGraph> | null = null;
/** Rete pedonale: scaricata una sola volta, alla prima apertura del planner. */
function loadWalk(): Promise<WalkGraph> {
  walkPromise ??= fetch(WALK_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`rete pedonale non disponibile (${r.status})`);
      return r.json() as Promise<RawWalk>;
    })
    .then(buildWalkGraph)
    .catch((e) => {
      walkPromise = null;
      throw e;
    });
  return walkPromise;
}

export type PickTarget = 'from' | 'to';

interface TripPlannerPanelProps {
  open: boolean;
  onClose: () => void;
  from: PlannerPoint | null;
  to: PlannerPoint | null;
  onChange: (which: PickTarget, point: PlannerPoint | null) => void;
  /** chiede di scegliere il punto con un clic sulla mappa */
  onPick: (which: PickTarget) => void;
  picking: PickTarget | null;
  /** itinerario calcolato, da disegnare sulla mappa */
  onItinerary: (it: Itinerary | null) => void;
}

const WATER_STOPS = ACTV_STOPS_REFERENCE.filter((s) => s.mode === 'navigazione' || s.mode === 'ferry');

/** Campo di un luogo: fermate per nome, numero civico ("Cannaregio 3450") o punto sulla mappa. */
const PlaceInput: React.FC<{
  label: string;
  value: PlannerPoint | null;
  onChange: (p: PlannerPoint | null) => void;
  onPick: () => void;
  picking: boolean;
  testId: string;
}> = ({ label, value, onChange, onPick, picking, testId }) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [civic, setCivic] = useState<{ key: string; point: PlannerPoint | null } | null>(null);
  const q = text.trim();
  const civicQuery = parseCivicQuery(q);
  const civicKey = civicQuery ? civicLabel(civicQuery.sestiere, civicQuery.number, civicQuery.letter) : null;
  useEffect(() => {
    if (!civicKey) return;
    const ctrl = new AbortController();
    fetch(`/api/civici?q=${encodeURIComponent(civicKey)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => {
        const r = j.result as CivicMatch | null;
        setCivic({ key: civicKey, point: r ? { lon: r.lon, lat: r.lat, label: r.match === 'exact' ? civicKey : `${civicKey} (≈ ${civicLabel(r.sestiere, r.number, r.letter)})` } : null });
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [civicKey]);
  const stopHits = q.length >= 2 && !civicKey ? WATER_STOPS.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [];
  const civicPoint = civic && civic.key === civicKey ? civic.point : null;

  if (value) {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)]" data-testid={testId}>
        <MapPin className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden />
        <div className="flex-1 min-w-0">
          <span className="block text-[10px] uppercase font-mono text-[var(--ink-3)]">{label}</span>
          <span className="block text-xs font-semibold text-[var(--ink)] truncate">{value.label}</span>
        </div>
        <button type="button" onClick={() => onChange(null)} className="text-[11px] text-cyan-400 hover:underline cursor-pointer">
          {t('ui.planner.change')}
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1" data-testid={testId}>
      <label className="text-[10px] uppercase font-mono text-[var(--ink-3)]">
        {label}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('ui.planner.placeholder')}
          className="mt-1 w-full px-3 py-2 rounded-xl bg-[var(--ground)] border border-[var(--rule)] text-xs text-[var(--ink)] normal-case font-sans focus:outline-none focus:border-cyan-500/60"
        />
      </label>
      {(civicPoint || stopHits.length > 0) && (
        <ul className="flex flex-col rounded-xl border border-[var(--rule)] overflow-hidden">
          {civicPoint && (
            <li>
              <button type="button" onClick={() => onChange(civicPoint)} className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--rule)]/50 cursor-pointer">
                <MapPin className="inline w-3.5 h-3.5 mr-1 text-amber-400" aria-hidden />
                {civicPoint.label}
              </button>
            </li>
          )}
          {stopHits.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => onChange({ lon: s.lon, lat: s.lat, label: s.name })} className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--rule)]/50 cursor-pointer">
                <Ship className="inline w-3.5 h-3.5 mr-1 text-cyan-400" aria-hidden />
                {s.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={onPick}
        aria-pressed={picking}
        className={`self-start flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg border cursor-pointer ${picking ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'border-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)]'}`}
      >
        <Crosshair className="w-3.5 h-3.5" aria-hidden />
        {picking ? t('ui.planner.pickingHint') : t('ui.planner.pickOnMap')}
      </button>
    </div>
  );
};

/**
 * Trip planner a piedi + vaporetto: luoghi di partenza e arrivo, ora di partenza, itinerario migliore
 * sull'orario ufficiale ACTV e sulla rete pedonale OpenStreetMap, con l'alternativa solo a piedi.
 */
export const TripPlannerPanel: React.FC<TripPlannerPanelProps> = ({ open, onClose, from, to, onChange, onPick, picking, onItinerary }) => {
  const { t } = useTranslation();
  const sim = useSimulation(open);
  const [walk, setWalk] = useState<WalkGraph | null>(null);
  const [walkError, setWalkError] = useState(false);
  const [time, setTime] = useState('');
  useEffect(() => {
    if (!open || walk) return;
    loadWalk().then(setWalk, () => setWalkError(true));
  }, [open, walk]);

  const result = useMemo(() => {
    if (!open || !sim || !walk || !from || !to) return null;
    const now = /^\d{2}:\d{2}$/.test(time) ? Number(time.slice(0, 2)) * 3600 + Number(time.slice(3)) * 60 : romeSecondsOfDay();
    return planTrip(walk, sim, ACTV_STOPS_REFERENCE, from, to, now, romeDayType());
  }, [open, sim, walk, from, to, time]);

  useEffect(() => {
    onItinerary(result?.best ?? null);
  }, [result, onItinerary]);

  const loading = open && (!sim || (!walk && !walkError));
  const best = result?.best ?? null;
  const minutes = (s: number) => Math.max(1, Math.round(s / 60));

  return (
    <InfoPanel open={open} onClose={onClose} labelledBy="planner-title" accent="border-emerald-500/40">
      <InfoHeader id="planner-title" icon={<Route className="w-5 h-5 text-emerald-400" />} category={t('ui.planner.category')} title={t('ui.planner.title')} onClose={onClose} />
      <div className="flex flex-col gap-2">
        <PlaceInput label={t('ui.planner.from')} value={from} onChange={(p) => onChange('from', p)} onPick={() => onPick('from')} picking={picking === 'from'} testId="planner-from" />
        <button
          type="button"
          onClick={() => {
            onChange('from', to);
            onChange('to', from);
          }}
          className="self-center p-1 rounded-lg text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
          aria-label={t('ui.planner.swap')}
          title={t('ui.planner.swap')}
        >
          <ArrowDownUp className="w-4 h-4" aria-hidden />
        </button>
        <PlaceInput label={t('ui.planner.to')} value={to} onChange={(p) => onChange('to', p)} onPick={() => onPick('to')} picking={picking === 'to'} testId="planner-to" />
        <label className="flex items-center gap-2 text-[11px] text-[var(--ink-2)]">
          {t('ui.planner.departure')}
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="px-2 py-1 rounded-lg bg-[var(--ground)] border border-[var(--rule)] text-xs text-[var(--ink)] font-mono"
          />
          {!time && <span className="text-[var(--ink-3)]">{t('ui.planner.now')}</span>}
        </label>
      </div>

      {loading && from && to && <p className="text-xs text-[var(--ink-3)]">{t('ui.planner.loading')}</p>}
      {walkError && <p className="text-xs text-rose-400">{t('ui.planner.loadError')}</p>}
      {result && !best && <p className="text-xs text-amber-400">{t('ui.planner.noRoute')}</p>}

      {best && (
        <div className="flex flex-col gap-3" data-testid="planner-result">
          <div className="flex items-baseline justify-between gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-sm font-bold text-[var(--ink)]">
              {clock(best.depart)} → {clock(best.arrive)}
            </span>
            <span className="text-xs font-mono text-emerald-300">{t('ui.planner.duration', { min: minutes(best.arrive - best.depart) })}</span>
          </div>
          <ol className="flex flex-col gap-2">
            {best.legs.map((leg, i) =>
              leg.kind === 'walk' ? (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <Footprints className="w-4 h-4 text-[var(--ink-3)] shrink-0 mt-0.5" aria-hidden />
                  <span className="text-[var(--ink-2)]">
                    {t('ui.planner.walkLeg', { min: minutes(leg.seconds), m: Math.round(leg.meters / 10) * 10, to: leg.to })}
                  </span>
                </li>
              ) : (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span
                    className="px-1.5 py-0.5 rounded-md font-mono font-bold text-[11px] shrink-0 border border-black/15"
                    style={{
                      background: lineColor(leg.line, leg.category) ?? '#0ea5e9',
                      color: lineTextColor(leg.line, lineColor(leg.line, leg.category) ?? '#0ea5e9'),
                    }}
                  >
                    {leg.line}
                  </span>
                  <span className="text-[var(--ink)]">
                    <strong>{clock(leg.start)}</strong> {leg.from} → <strong>{clock(leg.end)}</strong> {leg.to}
                    <span className="block text-[11px] text-[var(--ink-3)]">{t('ui.planner.rideLeg', { headsign: leg.headsign, n: leg.stops })}</span>
                  </span>
                </li>
              ),
            )}
          </ol>
          {result?.walkOnly && best.rides > 0 && (
            <p className="text-[11px] text-[var(--ink-3)]">{t('ui.planner.walkAlternative', { min: minutes(result.walkOnly.arrive - result.walkOnly.depart) })}</p>
          )}
          {best.rides === 0 && <p className="text-[11px] text-[var(--ink-3)]">{t('ui.planner.walkBest')}</p>}
        </div>
      )}
      <p className="text-[10px] text-[var(--ink-3)] leading-relaxed">{t('ui.planner.note')}</p>
    </InfoPanel>
  );
};
