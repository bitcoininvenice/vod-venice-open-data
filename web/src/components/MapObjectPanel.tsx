'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, Navigation, Plane, Radio, Ship } from 'lucide-react';
import type { AlilagunaBoat, FlightItem, ShipItem } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';
import { InfoHeader, InfoPanel, KeyValues, MoreDetails } from '@/components/ui/InfoPanel';
import { DELAY_COLORS, delayMinutes, type VehicleDelay } from '@/lib/realtimeDelay';
import { lineTextColor } from '@/lib/actvLines';
import { clock, resolveTrip, tripStops, type TripRef } from '@/lib/tripView';
import { useSimulation } from '@/lib/simulationModel';
import { romeSecondsOfDay } from '@/lib/time';
import { useServiceNow } from '@/lib/useServiceNow';
import { FLIXBUS_COLOR, type FlixBusPosition } from '@/lib/flixbus';
import { noticesForStop, useActvNotices } from '@/lib/useActvNotices';
import { ActvNoticeBox } from '@/components/ActvNoticeList';

/** Mezzo ACTV selezionato: posizione simulata dall'orario o reale (GTFS-RT). */
export interface VehicleSelection {
  line: string;
  category: string;
  speedKmh: number | null;
  color: string;
  headsign: string;
  source: 'gps' | 'schedule';
  /** secondi Unix dell'ultima posizione GPS */
  updatedAt?: number | null;
  /** ritardo (dalla posizione verificata con ACTV, oppure di ACTV): solo mezzi GPS che indicano la corsa */
  delay?: VehicleDelay | null;
  /** posizione e dato ACTV non coerenti: il ritardo non viene mostrato */
  delayConflict?: boolean;
  /** riferimento alla corsa dell'orario (per evidenziarla e mostrarne le fermate) */
  trip?: TripRef;
  /** id del mezzo nel feed GTFS-RT (per i mezzi in coda) */
  vehicleId?: string;
  /** nome o numero del mezzo nel feed (es. il nome del ferry o della motonave) */
  vehicleName?: string | null;
  /** rete del mezzo: distingue linee omonime (es. bus 15 e vaporetto 15) */
  network?: 'navigazione' | 'automobilistico';
}

/** Oggetti in movimento cliccati sulla mappa (le schede dei punti fissi sono in VeniceFeatureDetailModal). */
export type MapObjectSelected =
  | { type: 'ship'; data: ShipItem }
  | { type: 'flight'; data: FlightItem }
  | { type: 'vehicle'; data: VehicleSelection }
  | { type: 'alilagunaBoat'; data: AlilagunaBoat }
  | { type: 'flixbus'; data: FlixBusPosition };

interface MapObjectPanelProps {
  object: MapObjectSelected | null;
  onClose: () => void;
  onOpenAirport?: () => void;
  onOpenAlilaguna?: () => void;
  /** ora della simulazione (s dalla mezzanotte), per le fermate già servite dai mezzi da orario */
  timeSeconds?: number;
}

const VCE = { lat: 45.5053, lon: 12.3519 };

export const MapObjectPanel: React.FC<MapObjectPanelProps> = ({ object, onClose, onOpenAirport, onOpenAlilaguna, timeSeconds }) => {
  const { t, language } = useTranslation();
  if (!object) return null;
  const locale = language === 'it' ? 'it-IT' : 'en-GB';
  const time = (d: Date, withSeconds = false) =>
    d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', ...(withSeconds ? { second: '2-digit' } : {}), timeZone: 'Europe/Rome' });

  if (object.type === 'ship') {
    const ship = object.data;
    const s = (key: string, params?: Record<string, string | number>) => t(`ui.ship.${key}`, params);
    const lastSeen = new Date(ship.lastSeen);
    return (
      <InfoPanel
        open
        onClose={onClose}
        labelledBy="map-object-title"
        layer="showShips"
        accent="border-indigo-500/40"
        dataTime={s('lastSeen', { time: lastSeen.toLocaleString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }) })}
      >
        <InfoHeader
          id="map-object-title"
          icon={<Ship className="w-5 h-5 text-indigo-400" />}
          category={s(`category_${ship.category}`)}
          title={ship.name}
          subtitle={ship.navStatus ? s(`nav_${ship.navStatus}`) : undefined}
          onClose={onClose}
        />
        <KeyValues
          items={[
            [s('speed'), ship.speedKnots !== null ? `${ship.speedKnots} ${t('common.knots')}` : null, 'text-emerald-400'],
            [s('course'), ship.courseDeg !== null ? `${ship.courseDeg}°` : ship.heading !== null ? `${ship.heading}°` : null, 'text-indigo-300'],
            [s('destination'), ship.destination],
            [s('length'), ship.lengthMeters !== null ? `${ship.lengthMeters} m` : null],
          ]}
        />
        {ship.category === 'PASSENGER' && (ship.lengthMeters ?? 0) >= 180 && (
          <p className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">{s('largeShipNotice')}</p>
        )}
        <MoreDetails>
          <KeyValues
            items={[
              [s('heading'), ship.heading !== null ? `${ship.heading}°` : null],
              [s('eta'), ship.eta],
              [s('draught'), ship.draughtMeters !== null ? `${ship.draughtMeters} m` : null],
              [s('callSign'), ship.callSign],
              ['IMO', ship.imo],
              ['MMSI', ship.mmsi],
              [s('position'), `${ship.lat.toFixed(5)}, ${ship.lon.toFixed(5)}`],
            ]}
          />
          <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">{s('aisNote')}</p>
          {ship.imo && (
            <a
              href={`https://www.marinetraffic.com/en/ais/details/ships/imo:${ship.imo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
            >
              {s('moreInfo')} <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </MoreDetails>
      </InfoPanel>
    );
  }

  if (object.type === 'flight') {
    const f = object.data;
    const distKm = (Math.hypot(f.lon - VCE.lon, f.lat - VCE.lat) * 111).toFixed(1);
    return (
      <InfoPanel open onClose={onClose} labelledBy="map-object-title" layer="showFlights" accent="border-sky-500/40">
        <InfoHeader
          id="map-object-title"
          icon={<Plane className="w-5 h-5 text-sky-400" />}
          category={f.status}
          title={f.callsign}
          subtitle={`${f.country} · ${f.airport}`}
          onClose={onClose}
        />
        <KeyValues
          items={[
            [t('map.altitude'), `${f.altitudeMeters} ${t('map.meters')}`, 'text-sky-400'],
            [t('map.speed'), `${f.speedKmh} km/h`, 'text-emerald-400'],
            [t('map.track'), `${f.trackDegrees}°`],
            [t('map.vceDist'), `${distKm} km`, 'text-amber-400'],
          ]}
        />
        {onOpenAirport && (
          <button
            type="button"
            onClick={onOpenAirport}
            className="w-full py-1.5 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 text-xs font-mono border border-sky-500/40 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plane className="w-3.5 h-3.5" /> {t('map.airportDetailsButton')}
          </button>
        )}
      </InfoPanel>
    );
  }

  if (object.type === 'vehicle') {
    const v = object.data;
    const gps = v.source === 'gps';
    return (
      <InfoPanel
        open
        onClose={onClose}
        labelledBy="map-object-title"
        layer={gps ? 'showRealtimeVehicles' : 'showVehicles'}
        accent="border-cyan-500/40"
        dataTime={
          gps
            ? v.updatedAt
              ? `${t('ui.map.aggiornataAlle')} ${time(new Date(v.updatedAt * 1000), true)}`
              : t('ui.map.orarioPosizioneNonIndicato')
            : null
        }
      >
        <InfoHeader
          id="map-object-title"
          icon={gps ? <Radio className="w-5 h-5 text-emerald-400" /> : <Navigation className="w-5 h-5" style={{ color: v.color }} />}
          category={v.category}
          title={
            <span className="inline-flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded-lg text-sm font-mono font-bold border border-black/15"
                style={{ backgroundColor: v.color, color: lineTextColor(v.line, v.color) }}
              >
                {t('map.vehicleLine')} {v.line}
              </span>
            </span>
          }
          subtitle={v.headsign}
          onClose={onClose}
        />
        {gps && v.delay && <DelayBox delay={v.delay} />}
        <KeyValues
          items={[
            [t('map.estimatedSpeed'), !gps && v.speedKmh !== null ? `${v.speedKmh} km/h` : null, 'text-emerald-400'],
            [t('ui.map.vehicleName'), v.vehicleName ? (/^\d+$/.test(v.vehicleName) ? t('ui.map.vehicleNumber', { n: v.vehicleName }) : v.vehicleName) : null],
            [t('ui.map.fonte'), gps ? t('ui.map.posizioneGpsRealeGtfsRt') : t('ui.map.simulatoOrario'), gps ? 'text-emerald-400' : 'text-sky-400'],
          ]}
        />
        {gps && !v.delay && <p className="text-[11px] text-[var(--ink-3)]">{t(v.delayConflict ? 'ui.delay.conflict' : 'ui.delay.noDelay')}</p>}
        {v.line !== '–' && <LineNowBox line={v.line} vehicleId={v.vehicleId} network={v.network} />}
        {v.line !== '–' && <LineNotices line={v.line} />}
        {v.trip && <TripStopsList vehicle={v} timeSeconds={timeSeconds} />}
      </InfoPanel>
    );
  }

  if (object.type === 'flixbus') return <FlixbusCard bus={object.data} onClose={onClose} />;

  const b = object.data;
  return (
    <InfoPanel open onClose={onClose} labelledBy="map-object-title" layer="showAlilaguna" accent="border-blue-500/40">
      <InfoHeader
        id="map-object-title"
        icon={<Ship className="w-5 h-5" style={{ color: b.color }} />}
        category={b.name}
        title={b.lineName}
        subtitle={`${t('map.directionLabel')}: ${b.destination}`}
        onClose={onClose}
      />
      <KeyValues
        items={[
          [t('map.nextStopLabel'), b.nextStop, 'text-blue-400'],
          [t('map.timetableSpeed'), `~${b.speedKmh} km/h`, 'text-emerald-400'],
          [t('ui.map.partenza'), b.scheduledDeparture, 'text-amber-400'],
          [t('ui.map.arrivoPrevisto'), b.scheduledArrival, 'text-cyan-400'],
        ]}
      />
      <MoreDetails>
        <KeyValues
          items={[
            [t('map.track'), `${b.heading}°`],
            [t('ui.alilaguna.positionLabel'), t('ui.alilaguna.fromTimetable')],
          ]}
        />
        <span className="text-[11px] font-mono text-[var(--ink-3)]">GTFS: f-u20f-alilagunaspa</span>
      </MoreDetails>
      {onOpenAlilaguna && (
        <button
          type="button"
          onClick={onOpenAlilaguna}
          className="w-full py-1.5 px-3 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 text-xs font-mono border border-blue-500/40 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Ship className="w-3.5 h-3.5" /> {t('map.alilagunaDetailsButton')}
        </button>
      )}
    </InfoPanel>
  );
};

/** Ritardo del mezzo: valore attuale (quasi misurato) e arrivo stimato alla prossima fermata. */
const DelayBox: React.FC<{ delay: VehicleDelay }> = ({ delay: d }) => {
  const { t, language } = useTranslation();
  const locale = language === 'it' ? 'it-IT' : 'en-GB';
  const min = delayMinutes(d.seconds);
  const label =
    d.status === 'onTime' ? t('ui.delay.onTime') : d.status === 'early' ? t('ui.delay.early', { min: Math.abs(min) }) : t('ui.delay.late', { min });
  const formatDelay = (s: number) => {
    const m = delayMinutes(s);
    return m === 0 ? t('ui.delay.onTime').toLowerCase() : m > 0 ? `+${m} min` : `−${Math.abs(m)} min`;
  };
  const now = useNow(5000);
  const ago = Math.max(0, Math.round(now / 1000 - d.updatedAt));
  const eta = d.nextStopTime ? new Date(d.nextStopTime * 1000).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }) : null;
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-xl border" style={{ borderColor: `${DELAY_COLORS[d.status]}66`, background: `${DELAY_COLORS[d.status]}14` }}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-bold" style={{ color: DELAY_COLORS[d.status] }}>{label}</span>
        <span className="text-[10px] font-mono text-[var(--ink-3)]">{t('ui.delay.measuredAgo', { s: ago })}</span>
      </div>
      {d.nextStopName && (
        <span className="text-[11px] text-[var(--ink-2)]">
          {t('ui.delay.nextStop', { stop: d.nextStopName })}
          {eta && <> · <strong className="text-[var(--ink)]">{eta}</strong> <span className="text-[var(--ink-3)]">({t('ui.delay.estimateActv')})</span></>}
        </span>
      )}
      <span className="text-[10px] text-[var(--ink-3)]" data-testid="delay-source">
        {d.source === 'position' ? t('ui.delay.sourcePosition') : t('ui.delay.sourceActv')}
        {d.source === 'position' && d.actvSeconds !== null && (
          <> · {t('ui.delay.sourcePositionCheck', { value: formatDelay(d.actvSeconds) })}</>
        )}
      </span>
      {d.estimate === 'constant' && d.nextStopName && <span className="text-[10px] text-[var(--ink-3)]">{t('ui.delay.constantNote')}</span>}
    </div>
  );
};

/** Ora corrente aggiornata a intervalli (per i conteggi "N s fa" senza leggere l'orologio nel rendering). */
function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * Fermate della corsa del mezzo: già servite in grigio, successive con l'orario programmato e quello
 * previsto (ritardo attuale del mezzo applicato a tutte le fermate: è una stima semplice).
 */
const TripStopsList: React.FC<{ vehicle: VehicleSelection; timeSeconds?: number }> = ({ vehicle: v, timeSeconds }) => {
  const { t } = useTranslation();
  const sim = useSimulation(true);
  const nowMs = useNow(15000);
  const trip = React.useMemo(() => resolveTrip(sim, v.trip), [sim, v.trip]);
  const stops = React.useMemo(() => (trip ? tripStops(trip) : []), [trip]);
  if (!sim) return <p className="text-[11px] text-[var(--ink-3)]">{t('ui.trip.loading')}</p>;
  if (!trip || stops.length === 0) return <p className="text-[11px] text-[var(--ink-3)]">{t('ui.trip.notFound')}</p>;
  const delay = v.delay?.seconds ?? 0;
  const now = v.source === 'gps' ? romeSecondsOfDay(new Date(nowMs)) : (timeSeconds ?? romeSecondsOfDay(new Date(nowMs)));
  const nextIdx = stops.findIndex((s) => s.scheduled + delay >= now - 30);
  return (
    <div className="flex flex-col gap-1.5" data-testid="trip-stops">
      <span className="text-[11px] font-mono uppercase text-[var(--ink-3)]">{t('ui.trip.title')}</span>
      <ol className="flex flex-col">
        {stops.map((s, i) => {
          const passed = nextIdx === -1 || i < nextIdx;
          const isNext = i === nextIdx;
          return (
            <li key={`${i}-${s.scheduled}`} className="flex items-center gap-2 text-xs py-0.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 border-2"
                style={{ borderColor: passed ? '#64748b' : v.color, background: passed ? '#94a3b8' : isNext ? v.color : 'transparent' }}
                aria-hidden
              />
              <span className={`flex-1 min-w-0 truncate ${passed ? 'text-[var(--ink-3)]' : isNext ? 'font-bold text-[var(--ink)]' : 'text-[var(--ink-2)]'}`}>
                {s.name ?? t('ui.trip.unnamedStop')}
              </span>
              <span className={`font-mono tabular ${passed ? 'text-[var(--ink-3)]' : 'text-[var(--ink)]'}`}>
                {delay !== 0 && !passed ? (
                  <>
                    <s className="text-[var(--ink-3)] mr-1">{clock(s.scheduled)}</s>
                    {clock(s.scheduled + delay)}
                  </>
                ) : (
                  clock(s.scheduled)
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <span className="text-[10px] text-[var(--ink-3)]">{t(delay !== 0 ? 'ui.trip.noteDelay' : 'ui.trip.note')}</span>
    </div>
  );
};

const signedMin = (s: number) => {
  const m = Math.round(s / 60);
  return m === 0 ? '0' : m > 0 ? `+${m}` : `−${Math.abs(m)}`;
};

/** La linea del mezzo in questo momento (nessuno storico): mezzi GPS, corse in servizio, ritardi, mezzi in coda. */
const LineNowBox: React.FC<{ line: string; vehicleId?: string; network?: 'navigazione' | 'automobilistico' }> = ({ line, vehicleId, network }) => {
  const { t } = useTranslation();
  const service = useServiceNow(true);
  const l = service?.find((x) => x.line === line && (!network || x.network === network));
  if (!l) return null;
  const pair = vehicleId ? l.bunched.find((p) => p.a === vehicleId || p.b === vehicleId) : undefined;
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-[var(--rule)]/25 border border-[var(--rule)] text-[11px]" data-testid="line-now">
      <span className="text-[10px] font-mono uppercase text-[var(--ink-3)]">{t('ui.serviceNow.lineNow', { line })}</span>
      <span className="text-[var(--ink-2)]">
        {l.scheduled !== null ? t('ui.serviceNow.vehiclesOf', { gps: l.gps, n: l.scheduled }) : t('ui.serviceNow.vehicles', { gps: l.gps })}
      </span>
      {l.avgDelayS !== null && l.maxDelayS !== null && (
        <span className="text-[var(--ink-2)]">
          {t('ui.serviceNow.delaySummary', { avg: signedMin(l.avgDelayS), max: signedMin(l.maxDelayS), pct: Math.round((l.onTimeShare ?? 0) * 100) })}
        </span>
      )}
      {pair && (
        <span className="text-amber-400 font-semibold" data-testid="bunched-warning">
          {t('ui.serviceNow.bunchedHere', { gap: Math.max(1, Math.round(pair.gapS / 60)), headway: Math.round(pair.headwayS / 60), to: pair.terminus })}
        </span>
      )}
      <span className="text-[10px] text-[var(--ink-3)]">{t('ui.serviceNow.boxNote')}</span>
    </div>
  );
};

/** Avvisi ACTV che citano la linea del mezzo. */
const LineNotices: React.FC<{ line: string }> = ({ line }) => {
  const notices = useActvNotices();
  const { onLines } = noticesForStop(notices, [], [line]);
  return <ActvNoticeBox here={[]} onLines={onLines} />;
};

/** Scheda di un bus FlixBus: posizione simulata dall'orario, prossima fermata, attribuzione ODbL. */
const FlixbusCard: React.FC<{ bus: FlixBusPosition; onClose: () => void }> = ({ bus: b, onClose }) => {
  const { t, language } = useTranslation();
  const f = (key: string, params?: Record<string, string | number>) => t(`ui.flixbus.${key}`, params);
  const locale = language === 'it' ? 'it-IT' : 'en-GB';
  const hhmm = (ms: number) => new Date(ms).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
  return (
    <InfoPanel open onClose={onClose} labelledBy="map-object-title" layer="showFlixbus" accent="border-lime-500/40">
      <InfoHeader
        id="map-object-title"
        icon={<Navigation className="w-5 h-5" style={{ color: FLIXBUS_COLOR }} />}
        category={f('category')}
        title={
          <span className="px-2 py-0.5 rounded-lg text-sm font-mono font-bold text-white" style={{ backgroundColor: FLIXBUS_COLOR }}>
            FlixBus {b.trip.line}
          </span>
        }
        subtitle={`${b.trip.from} → ${b.trip.to}`}
        onClose={onClose}
      />
      <KeyValues
        items={[
          [f('route'), b.trip.name || null],
          [f('atStop'), b.atStop],
          [f('next'), b.next ? `${b.next.name} · ${hhmm(b.next.at)}` : null, 'text-lime-400'],
        ]}
      />
      <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">{f('note')}</p>
      <a
        href="https://transport.data.gouv.fr/datasets/flixbus-horaires-theoriques-du-reseau-europeen-1"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] font-mono text-cyan-400 hover:underline border-t border-[var(--rule)] pt-2"
      >
        © FlixMobility (FlixBus) · ODbL
      </a>
    </InfoPanel>
  );
};
