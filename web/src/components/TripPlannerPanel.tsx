'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Footprints, MapPin, Route, Ship, ArrowDownUp, Crosshair, Droplets, Plane } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { InfoHeader, InfoPanel } from '@/components/ui/InfoPanel';
import { useSimulation } from '@/lib/simulationModel';
import { buildWalkGraph, type RawWalk, type WalkGraph } from '@/lib/walkGraph';
import { WALK_URL } from '@/lib/walk-data';
import { planTrip, type Itinerary, type PlanMode, type PlannerPoint } from '@/lib/tripPlanner';
import { DELAY_COLORS, delayStatus } from '@/lib/realtimeDelay';
import { parseGtfsTime } from '@/lib/positionDelay';
import { startPolling } from '@/lib/polling';
import type { RealtimeVehicleDto } from '@/lib/contracts/realtime';
import type { PasserellaItem } from '@/lib/types';
import { ACTV_STOPS_REFERENCE } from '@/lib/stopsReference';
import { clock } from '@/lib/tripView';
import { romeDayType, romeSecondsOfDay } from '@/lib/time';
import { civicLabel, parseCivicQuery, type CivicMatch } from '@/lib/civici';
import { lineColor, lineTextColor } from '@/lib/actvLines';
import { buildBoatGraph, ordinancesOnRoute, planBoat, type BoatGraph, type RawBoat } from '@/lib/boatRouting';
import { BOAT_URL } from '@/lib/boat-data';
import type { OrdinanceItem } from '@/lib/contracts/ordinances';
import { BoatPlanResult } from '@/components/BoatPlanResult';
import { AIRPORT, isAirport, matchesAirport, planAirport } from '@/lib/airportPlanner';

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

let boatPromise: Promise<BoatGraph> | null = null;
/** Rete dei canali con le regole del Testo Unico: scaricata solo alla prima scelta della modalità in barca. */
function loadBoat(): Promise<BoatGraph> {
  boatPromise ??= fetch(BOAT_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`rete dei canali non disponibile (${r.status})`);
      return r.json() as Promise<RawBoat>;
    })
    .then(buildBoatGraph)
    .catch((e) => {
      boatPromise = null;
      throw e;
    });
  return boatPromise;
}

/** Ordinanze del Comune (per gli avvisi sui canali del percorso in barca), una volta sola. */
function useOrdinances(enabled: boolean): OrdinanceItem[] {
  const [data, setData] = useState<OrdinanceItem[]>([]);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetch('/api/ordinanze')
      .then((r) => r.json())
      .then((j) => !cancelled && Array.isArray(j.data) && setData(j.data))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return data;
}

export type PickTarget = 'from' | 'to';

/** Ora di partenza scelta (HH:MM) in secondi dalla mezzanotte, altrimenti adesso a Venezia. */
const departSeconds = (time: string): number => (/^\d{2}:\d{2}$/.test(time) ? Number(time.slice(0, 2)) * 3600 + Number(time.slice(3)) * 60 : romeSecondsOfDay());

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
  /** livello di marea in città all'ora indicata (secondi dalla mezzanotte): reale, previsto o simulato */
  tideAt?: (seconds: number) => number | null;
  /** percorsi su passerelle del piano */
  passerelle?: PasserellaItem[];
}

const ACTV_SITE = 'https://actv.avmspa.it/it';
const MODES: PlanMode[] = ['fastest', 'walk', 'boat', 'private'];

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
  const airportHit = q.length >= 2 && !civicKey && matchesAirport(q);

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
      {(civicPoint || airportHit || stopHits.length > 0) && (
        <ul className="flex flex-col rounded-xl border border-[var(--rule)] overflow-hidden">
          {airportHit && (
            <li>
              <button type="button" onClick={() => onChange(AIRPORT)} className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--rule)]/50 cursor-pointer" data-testid="planner-airport-option">
                <Plane className="inline w-3.5 h-3.5 mr-1 text-sky-400" aria-hidden />
                {AIRPORT.label}
              </button>
            </li>
          )}
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

/** Mezzi GPS ACTV (/api/realtime/vehicles) ogni 30 s, solo finché servono. */
function useLiveVehicles(enabled: boolean): RealtimeVehicleDto[] | null {
  const [data, setData] = useState<RealtimeVehicleDto[] | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = () =>
      fetch('/api/realtime/vehicles')
        .then((r) => r.json())
        .then((j) => !cancelled && setData(Array.isArray(j.data) ? j.data : null))
        .catch(() => !cancelled && setData(null));
    const stop = startPolling(load, 30_000);
    return () => {
      cancelled = true;
      stop();
    };
  }, [enabled]);
  return enabled ? data : null;
}

/**
 * Trip planner a piedi + vaporetto: luoghi di partenza e arrivo, ora di partenza, itinerario migliore
 * sull'orario ufficiale ACTV e sulla rete pedonale OpenStreetMap, con l'alternativa solo a piedi.
 */
export const TripPlannerPanel: React.FC<TripPlannerPanelProps> = ({ open, onClose, from, to, onChange, onPick, picking, onItinerary, tideAt, passerelle }) => {
  const { t } = useTranslation();
  const sim = useSimulation(open);
  const [walk, setWalk] = useState<WalkGraph | null>(null);
  const [walkError, setWalkError] = useState(false);
  const [time, setTime] = useState('');
  const [mode, setMode] = useState<PlanMode>('fastest');
  const [boat, setBoat] = useState<BoatGraph | null>(null);
  const [boatError, setBoatError] = useState(false);
  const [resident, setResident] = useState(false);
  const isPrivate = mode === 'private';
  useEffect(() => {
    if (!open || walk) return;
    loadWalk().then(setWalk, () => setWalkError(true));
  }, [open, walk]);
  useEffect(() => {
    if (!open || !isPrivate || boat) return;
    loadBoat().then(setBoat, () => setBoatError(true));
  }, [open, isPrivate, boat]);
  const ordinances = useOrdinances(open && isPrivate);

  // Da o per l'aeroporto: opzioni Alilaguna (via acqua) e ACTV (bus 5 da Piazzale Roma), dalla più veloce
  const airportTrip = !!from && !!to && isAirport(from) !== isAirport(to);
  const [airportChoice, setAirportChoice] = useState<'alilaguna' | 'actv' | null>(null);
  const airportOptions = useMemo(() => {
    if (!open || isPrivate || !airportTrip || !sim || !walk || !from || !to) return null;
    return planAirport(walk, sim, ACTV_STOPS_REFERENCE, from, to, departSeconds(time), romeDayType(), { tideAt, passerelle });
  }, [open, isPrivate, airportTrip, sim, walk, from, to, time, tideAt, passerelle]);
  const result = useMemo(() => {
    if (!open || isPrivate || !sim || !walk || !from || !to) return null;
    if (airportOptions) {
      const best = airportOptions.find((o) => o.via === airportChoice) ?? airportOptions[0] ?? null;
      return { best, walkOnly: null, floodLevelCm: null, shortestWalkWetMeters: null };
    }
    return planTrip(walk, sim, ACTV_STOPS_REFERENCE, from, to, departSeconds(time), romeDayType(), { mode, tideAt, passerelle });
  }, [open, isPrivate, sim, walk, from, to, time, mode, tideAt, passerelle, airportOptions, airportChoice]);

  // In barca propria: rete dei canali e regole del Testo Unico (lib/boatRouting)
  const boatResult = useMemo(() => {
    if (!open || !isPrivate || !boat || !from || !to) return null;
    const now = departSeconds(time);
    return planBoat(boat, from, to, now, romeDayType(), { resident, tideCm: tideAt?.(now) ?? null });
  }, [open, isPrivate, boat, from, to, time, resident, tideAt]);
  const boatOrdinances = useMemo(() => (boatResult?.ok ? ordinancesOnRoute(boatResult.plan, ordinances) : []), [boatResult, ordinances]);
  const boatItinerary = useMemo<Itinerary | null>(() => {
    if (!boatResult?.ok || !from || !to) return null;
    const p = boatResult.plan;
    return {
      depart: p.depart,
      arrive: p.arrive,
      legs: [{ kind: 'boat', from: from.label, to: to.label, meters: p.meters, seconds: p.arrive - p.depart, start: p.depart, end: p.arrive, coords: p.coords }],
      walkMeters: 0,
      rides: 0,
      ridesInHighWater: false,
      wetMeters: 0,
      passerellaMeters: 0,
      maxDepthCm: 0,
    };
  }, [boatResult, from, to]);

  useEffect(() => {
    onItinerary(isPrivate ? boatItinerary : (result?.best ?? null));
  }, [isPrivate, boatItinerary, result, onItinerary]);

  const best = result?.best ?? null;
  // Ritardo attuale delle corse proposte (solo partenza "adesso" e mezzi già in viaggio con il GPS)
  const rideLegs = useMemo(() => (best && !time ? best.legs.map((l, i) => (l.kind === 'ride' ? { i, line: l.line, departure: l.tripDeparture } : null)).filter((x) => x !== null) : []), [best, time]);
  const vehicles = useLiveVehicles(open && rideLegs.length > 0);
  const liveDelays = useMemo(() => {
    if (!vehicles || rideLegs.length === 0) return null;
    const m = new Map<number, number>();
    for (const r of rideLegs) {
      const v = vehicles.find((x) => x.line === r.line && parseGtfsTime(x.startTime) === r.departure && x.delay);
      if (v?.delay) m.set(r.i, v.delay.seconds);
    }
    return m;
  }, [vehicles, rideLegs]);
  const lastRide = rideLegs[rideLegs.length - 1];
  const liveArrival = best && lastRide && liveDelays?.has(lastRide.i) ? best.arrive + (liveDelays.get(lastRide.i) as number) : null;
  const liveLabel = (s: number) => {
    const m = Math.round(s / 60);
    return delayStatus(s) === 'onTime' ? t('ui.planner.liveOnTime') : m > 0 ? t('ui.planner.liveLate', { min: m }) : t('ui.planner.liveEarly', { min: Math.abs(m) });
  };

  const loading = open && (isPrivate ? !boat && !boatError : !sim || (!walk && !walkError));
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
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('ui.planner.modeLabel')}>
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 rounded-lg text-[11px] border cursor-pointer ${
                mode === m ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold' : 'border-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              {t(`ui.planner.mode_${m}`)}
            </button>
          ))}
        </div>
        {isPrivate && (
          <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-[11px] text-[var(--ink-2)]" data-testid="planner-boat-options">
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={resident} onChange={(e) => setResident(e.target.checked)} className="mt-0.5 accent-teal-500" data-testid="planner-boat-resident" />
              <span>{t('ui.planner.boat_resident')}</span>
            </label>
            <span className="text-[10px] text-[var(--ink-3)]">{resident ? t('ui.planner.boat_residentNote') : t('ui.planner.boat_ztlNote')}</span>
          </div>
        )}
      </div>

      {loading && from && to && <p className="text-xs text-[var(--ink-3)]">{isPrivate ? t('ui.planner.boat_loading') : t('ui.planner.loading')}</p>}
      {!isPrivate && walkError && <p className="text-xs text-rose-400">{t('ui.planner.loadError')}</p>}
      {isPrivate && boatError && <p className="text-xs text-rose-400">{t('ui.planner.boat_loadError')}</p>}
      {result && !best && <p className="text-xs text-amber-400">{airportOptions ? t('ui.planner.airportNoRoute') : t('ui.planner.noRoute')}</p>}
      {boatResult && <BoatPlanResult result={boatResult} resident={resident} ordinances={boatOrdinances} />}

      {best && (
        <div className="flex flex-col gap-3" data-testid="planner-result">
          {airportOptions && airportOptions.length > 0 && (
            <div className="flex flex-col gap-1.5" role="radiogroup" aria-label={t('ui.planner.airportOptions')} data-testid="planner-airport-options">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--ink-2)]">
                <Plane className="w-3.5 h-3.5 text-sky-400" aria-hidden />
                {t('ui.planner.airportOptions')}
              </span>
              {airportOptions.map((o) => (
                <button
                  key={o.via}
                  type="button"
                  role="radio"
                  aria-checked={best === o}
                  onClick={() => setAirportChoice(o.via ?? null)}
                  data-testid={`planner-airport-${o.via}`}
                  className={`flex items-baseline justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-left text-[11px] cursor-pointer ${
                    best === o ? 'bg-sky-500/15 border-sky-500/50 text-[var(--ink)]' : 'border-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)]'
                  }`}
                >
                  <span className="font-semibold">{t(`ui.planner.airport_${o.via}`)}</span>
                  <span className="font-mono shrink-0">
                    {clock(o.depart)} → {clock(o.arrive)} · {t('ui.planner.duration', { min: minutes(o.arrive - o.depart) })}
                  </span>
                </button>
              ))}
            </div>
          )}
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
                    {leg.wetMeters >= 10 && (
                      <span className="block text-[11px] text-amber-400">{t('ui.planner.legWet', { m: Math.round(leg.wetMeters / 10) * 10, cm: leg.maxDepthCm })}</span>
                    )}
                  </span>
                </li>
              ) : leg.kind === 'ride' ? (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span
                    className="px-1.5 py-0.5 rounded-md font-mono font-bold text-[11px] shrink-0 border border-black/15"
                    style={{
                      background: leg.color ?? lineColor(leg.line, leg.category) ?? '#0ea5e9',
                      color: lineTextColor(leg.operator ? null : leg.line, leg.color ?? lineColor(leg.line, leg.category) ?? '#0ea5e9'),
                    }}
                  >
                    {leg.line}
                  </span>
                  <span className="text-[var(--ink)]">
                    <strong>{clock(leg.start)}</strong> {leg.from} → <strong>{clock(leg.end)}</strong> {leg.to}
                    <span className="block text-[11px] text-[var(--ink-3)]">
                      {leg.operator === 'alilaguna' ? `${t('ui.planner.operatorAlilaguna')} · ` : leg.category === 'bus' ? `${t('ui.planner.operatorBus')} · ` : ''}
                      {t('ui.planner.rideLeg', { headsign: leg.headsign, n: leg.stops })}
                    </span>
                    {liveDelays && liveDelays.get(i) !== undefined && (
                      <span className="block text-[11px] font-semibold" style={{ color: DELAY_COLORS[delayStatus(liveDelays.get(i) as number)] }} data-testid="planner-live-delay">
                        {liveLabel(liveDelays.get(i) as number)}
                      </span>
                    )}
                  </span>
                </li>
              ) : null,
            )}
          </ol>
          {result?.floodLevelCm != null && (
            <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-[11px] text-[var(--ink-2)]" data-testid="planner-flood">
              <span className="flex items-center gap-1.5 font-semibold text-sky-300">
                <Droplets className="w-3.5 h-3.5" aria-hidden />
                {t('ui.planner.floodTitle', { cm: result.floodLevelCm })}
              </span>
              <span>
                {best.wetMeters >= 10
                  ? t('ui.planner.wetSummary', { m: Math.round(best.wetMeters / 10) * 10, cm: best.maxDepthCm })
                  : t('ui.planner.drySummary')}
              </span>
              {best.passerellaMeters >= 10 && <span>{t('ui.planner.passerelleUsed', { m: Math.round(best.passerellaMeters / 10) * 10 })}</span>}
              {best.rides === 0 && result.shortestWalkWetMeters != null && result.shortestWalkWetMeters - best.wetMeters >= 20 && (
                <span>{t('ui.planner.dryComparison', { m: Math.round(result.shortestWalkWetMeters / 10) * 10 })}</span>
              )}
              <span className="text-[10px] text-[var(--ink-3)]">{t('ui.planner.floodEstimate')}</span>
            </div>
          )}
          {best.ridesInHighWater && (
            <p className="text-[11px] text-amber-400" data-testid="planner-actv-warning">
              {t('ui.planner.actvHighWater')}{' '}
              <a href={ACTV_SITE} target="_blank" rel="noopener noreferrer" className="underline">actv.avmspa.it</a>
            </p>
          )}
          {result?.walkOnly && best.rides > 0 && (
            <p className="text-[11px] text-[var(--ink-3)]">{t('ui.planner.walkAlternative', { min: minutes(result.walkOnly.arrive - result.walkOnly.depart) })}</p>
          )}
          {liveArrival !== null && liveArrival > best.arrive + 59 && (
            <p className="text-[11px] text-[var(--ink-2)]" data-testid="planner-live-arrival">
              {t('ui.planner.liveArrival', { time: clock(liveArrival) })}
              {result?.walkOnly && result.walkOnly.arrive < liveArrival && <> {t('ui.planner.liveWalkFaster', { time: clock(result.walkOnly.arrive) })}</>}
            </p>
          )}
          {best.rides === 0 && <p className="text-[11px] text-[var(--ink-3)]">{t('ui.planner.walkBest')}</p>}
          {airportOptions && <p className="text-[11px] text-[var(--ink-3)]" data-testid="planner-airport-note">{t('ui.planner.airportNote')}</p>}
        </div>
      )}
      <p className="text-[10px] text-[var(--ink-3)] leading-relaxed">{isPrivate ? t('ui.planner.boat_note') : t('ui.planner.note')}</p>
    </InfoPanel>
  );
};
