'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { downloadBlob } from '@/lib/dataExport';
import {
  Compass,
  Waves,
  ShieldAlert,
  Droplets,
  Wind,
  HeartPulse,
  Building2,
  Timer,
  Accessibility,
  Clock,
  ThermometerSun,
  AlertTriangle,
  Layers,
  Search,
  Download,
  RefreshCw,
  Ship,
  Plane,
  Satellite,
  Footprints,
  Car,
  Navigation,
  Trees,
  LifeBuoy,
  Info,
  Users,
  Landmark,
  Construction
} from 'lucide-react';
import tourismData from '@/data/turismo-comuni.json';
import { MunicipalProfile } from '@/components/metrics/MunicipalProfile';
import { PublicWorksMonitor } from '@/components/metrics/PublicWorksMonitor';
import { ResidentsCensus } from '@/components/metrics/ResidentsCensus';
import { ScheduleSpeedTable, ServiceNowTable } from '@/components/metrics/TransitNow';
import { CENSUS, mostEmptiedSestiere } from '@/lib/census';
import arpavLagoon from '@/data/arpav-lagoon.json';

/** Riepilogo ARPAV della balneazione sul mare Adriatico veneto (ultimo anno pubblicato) */
const BATHING = arpavLagoon.bathing;

/** Arrivi e presenze dell'ultimo anno pubblicato (Camera di Commercio, CC BY 4.0) */
const VENICE_TOURISM = tourismData.comuni.find((c) => c.code === '027042');
import { PlatformMetrics } from '@/lib/types';
import type { TideForecast } from '@/lib/contracts/tide';
import { formatSignedCm } from '@/lib/time';
import { SiteFooter, SiteHeader } from '@/components/site/SiteChrome';
import { useTranslation } from '@/lib/i18n';
import {
  calculateEmergencyAccessibility,
  calculateTransitPunctuality,
  calculateBarrierFreeIndex,
  calculateTideFloodForecast72h,
  calculateCanalBottlenecksForecast,
  calculateUrbanHeatStressForecast
} from '@/lib/spatialAnalytics';
import type { MetricBasis, CanalBottleneckForecast, MicroclimateThermalZone } from '@/lib/spatialAnalytics';

type ViewSection = 'all' | 'kpi' | 'forecast' | 'platform';
type PlatformMetricSector = 'maree_aria' | 'laguna_scienza' | 'marittimo' | 'trasporti' | 'aeroporto' | 'satelliti' | 'pedoni_citta';
type Translate = (path: string, params?: Record<string, string | number>) => string;

const BASIS_STYLE: Record<MetricBasis, string> = {
  calcolato: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  stima: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  illustrativo: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

/** Etichetta di attendibilità: ogni indicatore dichiara se è calcolato, stimato o di esempio. */
function BasisBadge({ basis, note, t }: { basis: MetricBasis; note: string; t: Translate }) {
  return (
    <span title={note} className={`px-1.5 py-0.5 rounded text-[10px] font-mono border shrink-0 ${BASIS_STYLE[basis]}`}>
      {t(`ui.metricsPage.basis_${basis}`)}
    </span>
  );
}

// Chiavi di traduzione per i valori enumerati prodotti da spatialAnalytics
const RISK_KEY: Record<CanalBottleneckForecast['riskFactor'], string> = {
  Critico: 'riskCritical',
  Elevato: 'riskHigh',
  Moderato: 'riskModerate',
};
const HEAT_KEY: Record<MicroclimateThermalZone['heatStressCategory'], string> = {
  Confortevole: 'heatComfort',
  Cautela: 'heatCaution',
  'Cautela Estrema': 'heatExtremeCaution',
  Pericolo: 'heatDanger',
};

/** Indicatore della sezione 3: titolo, unità e nota sono chiavi ui.metricsPage.card_<id>_*. */
interface PlatformCard {
  id: string;
  sector: PlatformMetricSector;
  /** Parole chiave (IT + EN) per la ricerca */
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'cyan' | 'teal' | 'emerald' | 'indigo' | 'amber' | 'sky' | 'purple';
  badge: string;
  value: (m: PlatformMetrics | null) => number | string | null | undefined;
  /** Parametri della nota (es. conteggi secondari) */
  noteParams?: (m: PlatformMetrics | null, fmt: (v: number | string | null | undefined) => string) => Record<string, string>;
}

const COLOR_CLASSES: Record<PlatformCard['color'], { box: string; text: string; strong: string; badge: string }> = {
  blue: { box: 'border-blue-500/30 from-blue-950/20 to-blue-900/10', text: 'text-blue-300', strong: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300' },
  cyan: { box: 'border-cyan-500/30 from-cyan-950/20 to-blue-950/10', text: 'text-cyan-300', strong: 'text-cyan-400', badge: 'bg-cyan-500/20 text-cyan-300' },
  teal: { box: 'border-teal-500/30 from-teal-950/20 to-emerald-950/10', text: 'text-teal-300', strong: 'text-teal-400', badge: 'bg-teal-500/20 text-teal-300' },
  emerald: { box: 'border-emerald-500/30 from-emerald-950/20 to-green-950/10', text: 'text-emerald-300', strong: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
  indigo: { box: 'border-indigo-500/30 from-indigo-950/20 to-blue-950/10', text: 'text-indigo-300', strong: 'text-indigo-400', badge: 'bg-indigo-500/20 text-indigo-300' },
  amber: { box: 'border-amber-500/30 from-amber-950/20 to-yellow-950/10', text: 'text-amber-300', strong: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' },
  sky: { box: 'border-sky-500/30 from-sky-950/20 to-cyan-950/10', text: 'text-sky-300', strong: 'text-sky-400', badge: 'bg-sky-500/20 text-sky-300' },
  purple: { box: 'border-purple-500/30 from-purple-950/20 to-indigo-950/10', text: 'text-purple-300', strong: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300' },
};

const PLATFORM_CARDS: PlatformCard[] = [
  // Maree & aria
  { id: 'tide', sector: 'maree_aria', keywords: 'marea tide punta salute cpsm', icon: Waves, color: 'blue', badge: 'CPSM', value: (m) => (m?.tideLevelCm === null || m?.tideLevelCm === undefined ? null : formatSignedCm(m.tideLevelCm)) },
  { id: 'mose', sector: 'maree_aria', keywords: 'mose paratoie gates barriers', icon: ShieldAlert, color: 'cyan', badge: 'MOSE', value: (m) => m?.moseGatesCount },
  { id: 'cpsmStations', sector: 'maree_aria', keywords: 'cpsm stazioni stations sensori sensors', icon: Droplets, color: 'teal', badge: 'CPSM', value: (m) => m?.cpsmStationsCount },
  { id: 'air', sector: 'maree_aria', keywords: 'aria air arpav pm10 no2', icon: Wind, color: 'emerald', badge: 'ARPAV', value: (m) => m?.airStationsCount },
  // Laguna & scienza
  { id: 'cnr', sector: 'laguna_scienza', keywords: 'cnr ismar onde waves acqua alta platform', icon: Waves, color: 'indigo', badge: 'CPSM / CNR', value: (m) => (m?.cnrWaveHeightMeters === null || m?.cnrWaveHeightMeters === undefined ? null : `${m.cnrWaveHeightMeters} m`) },
  { id: 'passerelle', sector: 'laguna_scienza', keywords: 'passerelle walkways acqua alta', icon: Footprints, color: 'amber', badge: 'VOD', value: (m) => m?.passerelleTotalMeters, noteParams: (m, f) => ({ mounted: f(m?.passerelleMountedCount) }) },
  { id: 'briccole', sector: 'laguna_scienza', keywords: 'briccole segnalamenti channel markers', icon: Compass, color: 'cyan', badge: 'VOD', value: (m) => m?.briccoleCount },
  {
    id: 'bathing', sector: 'laguna_scienza', keywords: 'balneazione bathing litorali beaches arpav eccellente', icon: LifeBuoy, color: 'teal', badge: 'ARPAV',
    value: () => (BATHING?.excellentPercent != null ? `${BATHING.excellentPercent}%` : null),
    noteParams: (_m, f) => ({ year: String(BATHING?.year ?? 'n.d.'), points: f(BATHING?.points), suitable: String(BATHING?.suitablePercent ?? 'n.d.') }),
  },
  // Marittimo
  { id: 'ships', sector: 'marittimo', keywords: 'navi ships porto port ais', icon: Ship, color: 'blue', badge: 'AIS', value: (m) => m?.activeShipsCount },
  { id: 'channels', sector: 'marittimo', keywords: 'canali channels marittimi petroli', icon: Compass, color: 'cyan', badge: 'n.d.', value: (m) => m?.maritimeChannelsCount },
  // Trasporti
  { id: 'actv', sector: 'trasporti', keywords: 'actv vaporetti waterbus corse trips gtfs', icon: Navigation, color: 'sky', badge: 'GTFS ACTV', value: (m) => m?.totalTrips, noteParams: (m, f) => ({ routes: f(m?.routesNavigazione), stops: f(m?.totalStops) }) },
  { id: 'alilaguna', sector: 'trasporti', keywords: 'alilaguna aeroporto airport boats', icon: Ship, color: 'teal', badge: 'Alilaguna', value: (m) => m?.alilagunaBoatsCount, noteParams: (m, f) => ({ routes: f(m?.alilagunaRoutesCount) }) },
  { id: 'parking', sector: 'trasporti', keywords: 'parcheggi parking avm', icon: Car, color: 'blue', badge: 'AVM', value: (m) => m?.totalParkingSpaces },
  // Aeroporto
  { id: 'flights', sector: 'aeroporto', keywords: 'voli flights aerei opensky ads-b', icon: Plane, color: 'sky', badge: 'OpenSky', value: (m) => m?.activeFlightsCount },
  { id: 'vce', sector: 'aeroporto', keywords: 'aeroporto airport marco polo vce movimenti', icon: Navigation, color: 'sky', badge: 'SAVE', value: (m) => m?.vceDailyMovements },
  // Satelliti
  { id: 'satellites', sector: 'satelliti', keywords: 'satelliti satellites tle sentinel iss', icon: Satellite, color: 'purple', badge: 'CelesTrak', value: (m) => m?.activeSatellitesCount },
  { id: 'sar', sector: 'satelliti', keywords: 'sar radar sentinel-1 swath', icon: Compass, color: 'purple', badge: 'ESA', value: (m) => (m?.radarEarthObservationSwathKm ? `${m.radarEarthObservationSwathKm} km` : null) },
  // Città
  {
    id: 'tourism', sector: 'pedoni_citta', keywords: 'turismo tourism presenze arrivi residenti overtourism', icon: Users, color: 'purple', badge: 'CCIAA',
    value: () => VENICE_TOURISM?.presences,
    noteParams: (_m, f) => ({
      year: String(tourismData.tourismYear),
      arrivals: f(VENICE_TOURISM?.arrivals),
      residents: f(VENICE_TOURISM?.residents),
      ratio: String(VENICE_TOURISM?.presencesPerResident ?? 'n.d.'),
    }),
  },
  { id: 'pedestrians', sector: 'pedoni_citta', keywords: 'pedoni pedestrians flussi smart control room', icon: Footprints, color: 'amber', badge: 'n.d.', value: (m) => m?.pedestrianSensorsCount },
  { id: 'cantieri', sector: 'pedoni_citta', keywords: 'cantieri worksites opere pubbliche public works', icon: Building2, color: 'amber', badge: 'Comune VE', value: (m) => m?.activeCantieri, noteParams: (m, f) => ({ near: f(m?.stopsNearWorksites200m) }) },
  { id: 'fountains', sector: 'pedoni_citta', keywords: 'fontanelle fountains acqua water', icon: Droplets, color: 'cyan', badge: 'OSM', value: (m) => m?.drinkingFountainsCount },
  { id: 'trees', sector: 'pedoni_citta', keywords: 'alberi trees verde green', icon: Trees, color: 'emerald', badge: 'n.d.', value: (m) => m?.monumentalTreesCount },
];

const SECTORS: PlatformMetricSector[] = ['maree_aria', 'laguna_scienza', 'marittimo', 'trasporti', 'aeroporto', 'satelliti', 'pedoni_citta'];

/** fetch JSON che fallisce sugli status HTTP di errore (429, 5xx) invece di leggerne il corpo. */
const getJson = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
};

export default function MetricsPage() {
  const { t, language } = useTranslation();
  const m = (key: string, params?: Record<string, string | number>) => t(`ui.metricsPage.${key}`, params);
  const locale = language === 'it' ? 'it-IT' : 'en-GB';

  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [tideForecast, setTideForecast] = useState<TideForecast | null>(null);
  const [metarTempC, setMetarTempC] = useState<number | null>(null);
  const [metarDewPointC, setMetarDewPointC] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewSection, setViewSection] = useState<ViewSection>('all');
  const [platformSector, setPlatformSector] = useState<PlatformMetricSector | 'all'>('all');

  /** Valore formattato o segnaposto ("…" in caricamento, "n.d." se la fonte non lo fornisce). */
  const fmt = (val: number | string | null | undefined): string => {
    if (loading && !metrics) return '…';
    if (val === null || val === undefined) return m('na');
    return typeof val === 'number' ? val.toLocaleString(locale) : String(val);
  };

  // Caricamento dati da API (nessun setState sincrono: chiamabile da un effetto)
  const loadData = async () => {
    try {
      const [statsRes, tideRes, weatherRes] = await Promise.allSettled([
        getJson('/api/stats'),
        getJson('/api/tide'),
        getJson('/api/weather')
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
        setMetrics(statsRes.value.data);
      }
      if (tideRes.status === 'fulfilled' && tideRes.value?.forecast) {
        setTideForecast(tideRes.value.forecast);
      }
      if (weatherRes.status === 'fulfilled' && weatherRes.value?.metar) {
        setMetarTempC(weatherRes.value.metar.temperatureCelsius ?? null);
        setMetarDewPointC(weatherRes.value.metar.dewPointCelsius ?? null);
      }
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error('Errore nel caricamento delle metriche:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    setLoading(true);
    void loadData();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch al mount: i setState avvengono dopo await
    void loadData();
  }, []);

  // Indicatori calcolati dai dataset del progetto (ognuno dichiara la propria attendibilità)
  const accessibility = useMemo(() => calculateEmergencyAccessibility(), []);
  const transit = useMemo(() => calculateTransitPunctuality(), []);
  const barrierFree = useMemo(() => calculateBarrierFreeIndex(), []);
  const tideForecastAnalysis = useMemo(() => calculateTideFloodForecast72h(tideForecast), [tideForecast]);
  const bottlenecks = useMemo(() => calculateCanalBottlenecksForecast(), []);
  const heatStress = useMemo(() => calculateUrbanHeatStressForecast(metarTempC, metarDewPointC), [metarTempC, metarDewPointC]);
  const emptiest = mostEmptiedSestiere();

  const exportJsonData = () => {
    const report = {
      platform: 'Venice Open Data (VOD)',
      exportTimestampIso: new Date().toISOString(),
      notes: {
        basis: 'Ogni sezione riporta basis (calcolato / stima / illustrativo) e basisNote.',
        licenses: 'Ogni dato segue la licenza della fonte originale (vedi /sources).'
      },
      spatialAnalytics: {
        emergencyAccessibility: accessibility,
        residentsCensus2021: { city: CENSUS.city, historicCentre: CENSUS.historicCentre, sestieri: CENSUS.sestieri, source: CENSUS.source, license: CENSUS.license },
        transitPunctuality: transit,
        barrierFreeBridges: barrierFree
      },
      forecastModels72h: {
        tideAndPedestrianFlood: tideForecastAnalysis,
        canalBottlenecks: bottlenecks,
        urbanHeatStress: heatStress
      },
      platformMetrics: metrics
    };

    downloadBlob(
      new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }),
      `vod-venice-metrics-${new Date().toISOString().slice(0, 10)}.json`
    );
  };

  const query = searchQuery.toLowerCase().trim();
  // La ricerca confronta parole chiave (italiano e inglese) e titoli tradotti
  const matches = (...texts: string[]) => !query || texts.some((tx) => tx.toLowerCase().includes(query));

  // Orari della previsione in ora di Venezia, indipendentemente dal fuso del browser
  const romeDay = (ms: number) => new Date(ms).toLocaleDateString(locale, { weekday: 'short', day: '2-digit', timeZone: 'Europe/Rome' });
  const romeTime = (ms: number) => new Date(ms).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });

  const visibleCards = PLATFORM_CARDS.filter(
    (c) => (platformSector === 'all' || c.sector === platformSector) && matches(c.keywords, m(`card_${c.id}_title`))
  );

  const showKpi =
    (viewSection === 'all' || viewSection === 'kpi') &&
    matches('emergenza emergency dae farmacie pharmacies turismo tourism sestiere trasporti transit actv ponti bridges accessibilita accessibility', m('section1Title'));
  const showForecast =
    (viewSection === 'all' || viewSection === 'forecast') &&
    matches('marea tide mose passerelle allagamento flooding canali canals calore heat metar', m('section2Title'));
  const showPlatform = viewSection === 'all' || viewSection === 'platform';

  const sectionBtnCls = (active: boolean, activeCls: string) =>
    `px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
      active ? `${activeCls} text-white shadow-md` : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--rule)]/60'
    }`;

  return (
    <div className="min-h-screen bg-[var(--ground)] text-[var(--ink)] flex flex-col justify-between selection:bg-cyan-500/30">
      <SiteHeader
        page="metrics"
        subtitle={m('brandSubtitle')}
        actions={
          <>
            <button
              type="button"
              onClick={refreshData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-[var(--rule)]/60 hover:bg-[var(--rule)] text-[var(--ink)] border border-[var(--rule)] transition-all cursor-pointer disabled:opacity-50"
              title={m('refreshTitle')}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'motion-safe:animate-spin' : ''}`} />
              <span className="hidden sm:inline">{m('refresh')}</span>
            </button>
            <button
              type="button"
              onClick={exportJsonData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition-all cursor-pointer shadow-sm shadow-cyan-500/20"
              title={m('exportTitle')}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{m('export')}</span>
            </button>
          </>
        }
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* Titolo */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--rule)] pb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30">
                {m('kicker')}
              </span>
              <span className="text-[10px] font-mono flex items-center gap-1">
                {(['calcolato', 'stima', 'illustrativo'] as const).map((b) => (
                  <span key={b} className={`px-1.5 rounded border ${BASIS_STYLE[b]}`}>{m(`basis_${b}`)}</span>
                ))}
              </span>
              {lastRefreshedAt && (
                <span className="text-[10px] font-mono text-[var(--ink-3)]">
                  {m('refreshedAt', { time: lastRefreshedAt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) })}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink)]">{m('title')}</h1>
            <p className="text-xs sm:text-sm text-[var(--ink-2)] mt-1 max-w-3xl leading-relaxed">{m('intro')}</p>
          </div>

        </div>

        {/* Indicatori principali */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Highlight
            icon={Waves}
            tone="blue"
            label={m('hlTide')}
            value={fmt(metrics?.tideLevelCm === null || metrics?.tideLevelCm === undefined ? null : formatSignedCm(metrics.tideLevelCm))}
            note={m('hlTideNote')}
          />
          <Highlight icon={HeartPulse} tone="rose" label={m('hlDae')} value={`${accessibility.daeCoverage200mPercent}%`} note={m('hlDaeNote', { n: accessibility.totalDae })} />
          <Highlight icon={Timer} tone="cyan" label={m('hlTransit')} value={`${transit.onTimePercent}%`} note={m('illustrativeNoData')} illustrative />
          <Highlight
            icon={Clock}
            tone="amber"
            label={m('hlPeak')}
            value={tideForecastAnalysis.forecastPoints.length ? formatSignedCm(tideForecastAnalysis.maxPeakCm) : fmt(null)}
            note={m('hlPeakNote', { pct: tideForecastAnalysis.maxFloodedPercent })}
          />
          <Highlight icon={Accessibility} tone="purple" label={m('hlBridges')} value={`${barrierFree.accessibilityPercentage}%`} note={m('illustrativeNoData')} illustrative />
          <Highlight
            icon={Building2}
            tone="emerald"
            label={m('hlEmptyHomes', { sestiere: emptiest.name })}
            value={`${(emptiest.pctDwellingsEmptyOrNonResident ?? 0).toLocaleString(locale)}%`}
            note={m('hlEmptyHomesNote', { centre: `${(CENSUS.historicCentre.pctDwellingsEmptyOrNonResident ?? 0).toLocaleString(locale)}%` })}
          />
        </div>

        {/* Filtri e ricerca */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2 rounded-2xl bg-[var(--rule)]/40 border border-[var(--rule)]">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button type="button" aria-pressed={viewSection === 'all'} onClick={() => setViewSection('all')} className={sectionBtnCls(viewSection === 'all', 'bg-cyan-500')}>
              {m('tabAll')}
            </button>
            <button type="button" aria-pressed={viewSection === 'kpi'} onClick={() => setViewSection('kpi')} className={sectionBtnCls(viewSection === 'kpi', 'bg-cyan-500')}>
              <HeartPulse className="w-3.5 h-3.5" />
              <span>{m('tabKpi')}</span>
            </button>
            <button type="button" aria-pressed={viewSection === 'forecast'} onClick={() => setViewSection('forecast')} className={sectionBtnCls(viewSection === 'forecast', 'bg-blue-600')}>
              <Clock className="w-3.5 h-3.5" />
              <span>{m('tabForecast')}</span>
            </button>
            <button type="button" aria-pressed={viewSection === 'platform'} onClick={() => setViewSection('platform')} className={sectionBtnCls(viewSection === 'platform', 'bg-purple-600')}>
              <Layers className="w-3.5 h-3.5" />
              <span>{m('tabPlatform', { n: PLATFORM_CARDS.length })}</span>
            </button>
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-[var(--ink-3)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={m('searchPlaceholder')}
              aria-label={m('searchPlaceholder')}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[var(--ground)] border border-[var(--rule)] text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* ===================== PROFILO DEL COMUNE (Cruscotto Italia) ===================== */}
        {showKpi && (
          <section className="flex flex-col gap-5">
            <SectionHeader icon={Landmark} iconCls="text-cyan-400" title={t('ui.municipalProfile.title')} aside={t('ui.municipalProfile.aside')} />
            <MunicipalProfile />
          </section>
        )}

        {/* ===================== OPERE PUBBLICHE (BDAP - Monitoraggio Opere Pubbliche) ===================== */}
        {showKpi && (
          <section className="flex flex-col gap-5">
            <SectionHeader icon={Construction} iconCls="text-orange-400" title={t('ui.bdap.metricsTitle')} aside={t('ui.bdap.metricsAside')} />
            <PublicWorksMonitor />
          </section>
        )}

        {/* ===================== TRASPORTO PUBBLICO ADESSO (nessuno storico) ===================== */}
        {showKpi && (
          <section className="flex flex-col gap-5">
            <SectionHeader icon={Navigation} iconCls="text-emerald-400" title={t('ui.serviceNow.sectionTitle')} aside={t('ui.serviceNow.sectionAside')} />
            <ServiceNowTable />
            <SectionHeader icon={Timer} iconCls="text-red-400" title={t('ui.scheduleSpeed.sectionTitle')} aside={t('ui.scheduleSpeed.sectionAside')} />
            <ScheduleSpeedTable />
          </section>
        )}

        {/* ===================== SEZIONE 1: INDICATORI TERRITORIALI ===================== */}
        {showKpi && (
          <section className="flex flex-col gap-5">
            <SectionHeader icon={HeartPulse} iconCls="text-rose-400" title={m('section1Title')} aside={m('section1Aside')} />

            {/* 1.1 Presidi di emergenza */}
            <div className="p-5 rounded-2xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-400" />
                    {m('emergencyTitle')}
                    <BasisBadge basis={accessibility.basis} note={m('note_emergency')} t={t} />
                  </h3>
                  <p className="text-xs text-[var(--ink-3)] mt-0.5">{m('note_emergency')}</p>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  {m('emergencyRadius')}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label={m('daeLabel')} value={m('daeValue', { n: accessibility.totalDae })} valueCls="text-rose-400" note={m('daeNote')} />
                <Stat
                  label={m('daeCoverageLabel')}
                  value={`${accessibility.daeCoverage200mPercent}%`}
                  valueCls="text-emerald-400"
                  note={m('daeCoverageNote', { n: accessibility.referencePointsCount })}
                />
                <Stat
                  label={m('pharmLabel')}
                  value={m('pharmValue', { n: accessibility.totalPharmacies })}
                  valueCls="text-cyan-400"
                  note={m('within', { m: 350, pct: accessibility.pharmacyCoverage350mPercent })}
                />
                <Stat
                  label={m('docksLabel')}
                  value={m('docksValue', { n: accessibility.totalEmergencyDocks })}
                  valueCls="text-blue-400"
                  note={m('within', { m: 400, pct: accessibility.emergencyDockPerimeterCoveragePercent })}
                />
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2">
                <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  {m('farthestTitle')}
                </span>
                <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">{m('farthestNote')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                  {accessibility.underservedAreas.map((area) => (
                    <div key={area.area} className="p-3 rounded-lg bg-[var(--ground)] border border-[var(--rule)] flex flex-col justify-between gap-1 text-xs">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <strong className="text-[var(--ink)] text-sm">{area.area}</strong>
                        <span className="text-[11px] font-mono text-rose-400 font-bold">{area.distanceToNearestDaeMeters} m</span>
                      </div>
                      <p className="text-[11px] text-[var(--ink-3)]">{m('farthestAction')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 1.2 Residenti, famiglie e abitazioni (Censimento ISTAT 2021) */}
            <ResidentsCensus badge={<BasisBadge basis="calcolato" note={m('note_census')} t={t} />} />

            {/* 1.3 Puntualità & ponti */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="p-5 rounded-2xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Timer className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-base font-bold text-[var(--ink)]">{m('transitTitle')}</h3>
                    <BasisBadge basis={transit.basis} note={m('note_transit')} t={t} />
                  </div>
                  <p className="text-xs text-[var(--ink-3)]">{m('note_transit')}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Stat label={m('onTime')} value={`${transit.onTimePercent}%`} valueCls="text-emerald-400 text-xl" boxCls="bg-emerald-500/10 border-emerald-500/30" />
                  <Stat label={m('delayMinor')} value={`${transit.minorDelayPercent}%`} valueCls="text-amber-400 text-xl" boxCls="bg-amber-500/10 border-amber-500/30" />
                  <Stat label={m('delayMajor')} value={`${transit.majorDelayPercent}%`} valueCls="text-rose-400 text-xl" boxCls="bg-rose-500/10 border-rose-500/30" />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-mono text-[var(--ink-3)] uppercase font-semibold">{m('criticalLines')}</span>
                  {transit.criticalLines.map((l) => (
                    <div key={l.line} className="p-2.5 rounded-lg bg-[var(--ground)] border border-[var(--rule)] flex flex-col gap-0.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-[var(--ink)]">{l.line}</strong>
                        <span className="font-mono text-amber-400 font-bold">{m('avgDelay', { n: l.avgDelayMinutes })}</span>
                      </div>
                      <span className="text-[11px] text-[var(--ink-3)]">{l.bottleneckCause}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Accessibility className="w-4 h-4 text-purple-400" />
                    <h3 className="text-base font-bold text-[var(--ink)]">{m('bridgesTitle')}</h3>
                    <BasisBadge basis={barrierFree.basis} note={m('note_bridges')} t={t} />
                  </div>
                  <p className="text-xs text-[var(--ink-3)]">{m('note_bridges')}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Stat
                    label={m('bridgesEquipped')}
                    value={`${barrierFree.accessibleBridgesCount} / ${barrierFree.totalHistoricBridges}`}
                    valueCls="text-emerald-400"
                    boxCls="bg-emerald-500/10 border-emerald-500/30"
                    note={m('exampleValuePct', { pct: barrierFree.accessibilityPercentage })}
                  />
                  <Stat
                    label={m('bridgesStepped')}
                    value={m('bridgesValue', { n: barrierFree.steppedBridgesCount })}
                    valueCls="text-rose-400"
                    boxCls="bg-rose-500/10 border-rose-500/30"
                    note={m('exampleValuePct', { pct: barrierFree.inaccessiblePercentage })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-mono text-[var(--ink-3)] uppercase font-semibold">{m('bridgesRefsTitle')}</span>
                  <p className="text-[11px] text-[var(--ink-3)]">{m('bridgesRefsNote')}</p>
                  {barrierFree.officialReferences.map((r) => (
                    <a
                      key={r.url}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-lg bg-[var(--ground)] border border-[var(--rule)] text-xs text-cyan-400 hover:underline"
                    >
                      {m(`ref_${r.id}`)}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===================== SEZIONE 2: STIME A 72-96 ORE ===================== */}
        {showForecast && (
          <section className="flex flex-col gap-5">
            <SectionHeader icon={Clock} iconCls="text-blue-400" title={m('section2Title')} aside={m('section2Aside')} />

            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex flex-col gap-1.5 text-xs">
              <span className="font-mono font-bold text-blue-300 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                {m('disclaimerTitle')}
              </span>
              <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">{m('disclaimerBody')}</p>
            </div>

            {/* 2.1 Allagamento */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/30 to-blue-900/10 border border-blue-500/30 flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
                    <Waves className="w-4 h-4 text-blue-400" />
                    {m('floodTitle')}
                    <BasisBadge basis={tideForecastAnalysis.basis} note={m('note_tide')} t={t} />
                  </h3>
                  <p className="text-xs text-[var(--ink-3)] mt-0.5">{m('note_tide')}</p>
                </div>
                {tideForecastAnalysis.issuedAt && (
                  <span className="text-[11px] font-mono text-cyan-400 font-semibold px-2.5 py-1 rounded bg-blue-500/20 border border-blue-500/40">
                    {m('issuedAt', { at: tideForecastAnalysis.issuedAt })}
                  </span>
                )}
              </div>

              {tideForecastAnalysis.forecastPoints.length === 0 ? (
                <p className="text-xs font-mono text-[var(--ink-3)]">{loading ? '…' : m('noForecast')}</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Stat label={m('peakMax')} value={formatSignedCm(tideForecastAnalysis.maxPeakCm)} valueCls="text-cyan-400" note={m('peakMaxNote')} />
                    <Stat label={m('floodedEst')} value={`${tideForecastAnalysis.maxFloodedPercent}%`} valueCls="text-blue-400" note={m('floodedEstNote')} />
                    <Stat
                      label={m('moseLabel')}
                      value={tideForecastAnalysis.moseDeploymentForecasted ? m('moseAbove') : m('moseBelow')}
                      valueCls={`text-base leading-tight ${tideForecastAnalysis.moseDeploymentForecasted ? 'text-amber-400' : 'text-emerald-400'}`}
                      note={tideForecastAnalysis.moseDeploymentForecasted ? m('moseAboveNote') : m('moseBelowNote')}
                    />
                    <Stat
                      label={m('passerelleLabel')}
                      value={m('hoursValue', { n: tideForecastAnalysis.hoursWithPasserelleCount })}
                      valueCls="text-amber-400"
                      note={m('passerelleNote')}
                    />
                  </div>

                  <MethodBox
                    title={m('methodTitle')}
                    aside={m('methodAside')}
                    items={[
                      [m('method'), m('tideMethod')],
                      [m('basisData'), m('tideBasis')],
                      [m('uncertainty'), m('tideUncertainty')],
                    ]}
                  />

                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="text-xs font-mono text-[var(--ink-3)] uppercase font-semibold">{m('extremesTitle')}</span>
                      <span className="text-[10px] font-mono text-[var(--ink-3)]">{m('extremesNote')}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                      {tideForecastAnalysis.forecastPoints
                        .filter((p) => p.isPeak)
                        .map((p) => (
                          <div
                            key={p.timestampMs}
                            className={`p-3 rounded-xl border flex flex-col justify-between gap-1 text-center ${
                              p.heightCm >= 110
                                ? 'bg-rose-500/15 border-rose-500/40'
                                : p.heightCm >= 95
                                ? 'bg-amber-500/15 border-amber-500/40'
                                : 'bg-[var(--ground)] border-[var(--rule)]'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono text-[var(--ink-3)]">
                              <span className="font-bold">{p.isHighTide ? m('high') : m('low')}</span>
                              <span>{romeDay(p.timestampMs)}</span>
                            </div>
                            <span className="text-xl font-mono font-bold text-[var(--ink)]">{formatSignedCm(p.heightCm)}</span>
                            <span className="text-[10px] font-mono text-[var(--ink-3)]">{romeTime(p.timestampMs)}</span>
                            <span className="text-[10px] font-mono font-bold text-cyan-400">{m('floodedShort', { pct: p.floodedPercent })}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 2.2 Canali & calore */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="p-5 rounded-2xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-base font-bold text-[var(--ink)]">{m('canalsTitle')}</h3>
                    {bottlenecks[0] && <BasisBadge basis={bottlenecks[0].basis} note={m('note_canals')} t={t} />}
                  </div>
                  <p className="text-xs text-[var(--ink-3)]">{m('note_canals')}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {bottlenecks.map((b) => {
                    const tone = b.riskFactor === 'Critico' ? 'rose' : b.riskFactor === 'Elevato' ? 'amber' : 'cyan';
                    return (
                      <div
                        key={b.canalName}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${
                          tone === 'rose'
                            ? 'bg-rose-500/10 border-rose-500/30'
                            : tone === 'amber'
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-[var(--ground)] border-[var(--rule)]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-xs font-bold text-[var(--ink)]">{b.canalName}</strong>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                              tone === 'rose' ? 'bg-rose-500/20 text-rose-300' : tone === 'amber' ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'
                            }`}
                          >
                            {m(RISK_KEY[b.riskFactor])}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-xs font-mono">
                          <MiniStat label={m('peakTransits')} value={`${b.peakHourlyTransits}/h`} />
                          <MiniStat label={m('saturationShort')} value={`${b.capacitySaturationPercent}%`} valueCls="text-cyan-400" />
                          <MiniStat label={m('speedLimit')} value={`${b.speedLimitKmh} km/h`} />
                        </div>
                        <p className="text-[10px] text-[var(--ink-2)] font-mono leading-tight bg-[var(--ground)]/60 p-2 rounded-lg border border-[var(--rule)]">
                          <strong>{m('tideSensitivity')}</strong> {b.tideSensitivity}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <MethodBox
                  title={m('methodShortTitle')}
                  aside={m('exampleScenario')}
                  items={[
                    [m('method'), m('canalsMethod')],
                    [m('basisData'), m('canalsBasis')],
                  ]}
                />
              </div>

              <div className="p-5 rounded-2xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ThermometerSun className="w-4 h-4 text-amber-400" />
                    <h3 className="text-base font-bold text-[var(--ink)]">{m('heatTitle')}</h3>
                    <BasisBadge basis={heatStress.basis} note={m('note_heat')} t={t} />
                  </div>
                  <p className="text-xs text-[var(--ink-3)]">
                    {heatStress.baseAirTempC === null
                      ? loading
                        ? '…'
                        : m('heatNoMetar')
                      : m('heatBase', { temp: heatStress.baseAirTempC, rh: heatStress.baseHumidityPercent ?? '–', at: heatStress.baseHeatIndexC ?? '–' })}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {heatStress.zones.map((z) => (
                    <div key={z.zoneName} className="p-3.5 rounded-xl bg-[var(--ground)] border border-[var(--rule)] flex flex-col justify-between gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-xs font-bold text-[var(--ink)]">{z.zoneName}</strong>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            z.heatStressCategory === 'Pericolo'
                              ? 'bg-rose-500/20 text-rose-300'
                              : z.heatStressCategory === 'Cautela Estrema'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {m(HEAT_KEY[z.heatStressCategory])}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 font-mono">
                        <span className="text-xl font-bold text-amber-400">{z.perceivedPeakTempC}°C</span>
                        <span className="text-[10px] text-[var(--ink-3)]">
                          {m('heatZoneDelta', { d: z.satelliteLstArrayAnomalyC > 0 ? `+${z.satelliteLstArrayAnomalyC}` : z.satelliteLstArrayAnomalyC })}
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--ink-3)] font-sans">
                        {z.satelliteLstArrayAnomalyC < 0 ? m('heatCooler') : m('heatWarmer')}
                      </span>
                    </div>
                  ))}
                </div>
                <MethodBox
                  title={m('methodShortTitle')}
                  aside={m('heatUncertainty')}
                  items={[
                    [m('method'), m('heatMethod')],
                    [m('basisData'), m('heatBasis')],
                  ]}
                />
              </div>
            </div>
          </section>
        )}

        {/* ===================== SEZIONE 3: INDICATORI DI PIATTAFORMA ===================== */}
        {showPlatform && (
          <section className="flex flex-col gap-5">
            <SectionHeader icon={Layers} iconCls="text-purple-400" title={m('section3Title', { n: PLATFORM_CARDS.length })} aside={m('section3Aside')} />

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
              {(['all', ...SECTORS] as const).map((id) => {
                const count = id === 'all' ? PLATFORM_CARDS.length : PLATFORM_CARDS.filter((c) => c.sector === id).length;
                const active = platformSector === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setPlatformSector(id)}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      active
                        ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-600/20'
                        : 'bg-[var(--rule)]/40 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--rule)]'
                    }`}
                  >
                    <span>{m(`sector_${id}`)}</span>
                    <span className={`text-[10px] font-mono px-1.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-[var(--rule)] text-[var(--ink-3)]'}`}>{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {visibleCards.map((c) => {
                const cls = COLOR_CLASSES[c.color];
                const Icon = c.icon;
                const params = c.noteParams?.(metrics, fmt) ?? {};
                return (
                  <div key={c.id} className={`p-4 rounded-xl border bg-gradient-to-br ${cls.box} flex flex-col justify-between gap-2`}>
                    <div className={`flex items-center justify-between text-xs gap-2 ${cls.text}`}>
                      <span className="font-semibold flex items-center gap-1.5">
                        <Icon className={`w-4 h-4 ${cls.strong}`} />
                        {m(`card_${c.id}_title`)}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${cls.badge}`}>{c.badge}</span>
                    </div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className={`text-3xl font-mono font-extrabold ${cls.strong}`}>{fmt(c.value(metrics))}</span>
                      <span className={`text-xs font-mono ${cls.text}`}>{m(`card_${c.id}_unit`)}</span>
                    </div>
                    <p className="text-[11px] text-[var(--ink-2)] font-mono leading-tight">{m(`card_${c.id}_note`, params)}</p>
                  </div>
                );
              })}
              {visibleCards.length === 0 && <p className="text-xs font-mono text-[var(--ink-3)]">{m('noResults')}</p>}
            </div>
          </section>
        )}

        {/* Metodologia */}
        <section className="p-5 rounded-2xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-[var(--ink)]">{m('methodologyTitle')}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed text-[var(--ink-2)]">
            {(['Labels', 'Methods', 'Missing'] as const).map((k) => (
              <div key={k} className="p-3 rounded-xl bg-[var(--ground)] border border-[var(--rule)]">
                <strong className="block text-[var(--ink)] mb-1">{m(`methodology${k}Title`)}</strong>
                {m(`methodology${k}Body`)}
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

const HIGHLIGHT_TONES = {
  blue: { box: 'from-blue-950/20 to-blue-900/10 border-blue-500/30', head: 'text-blue-400', value: 'text-cyan-400' },
  rose: { box: 'from-rose-950/20 to-rose-900/10 border-rose-500/30', head: 'text-rose-400', value: 'text-emerald-400' },
  cyan: { box: 'from-cyan-950/20 to-teal-900/10 border-cyan-500/30', head: 'text-cyan-400', value: 'text-cyan-300' },
  amber: { box: 'from-amber-950/20 to-amber-900/10 border-amber-500/30', head: 'text-amber-400', value: 'text-amber-300' },
  purple: { box: 'from-purple-950/20 to-purple-900/10 border-purple-500/30', head: 'text-purple-400', value: 'text-purple-300' },
  emerald: { box: 'from-emerald-950/20 to-emerald-900/10 border-emerald-500/30', head: 'text-emerald-400', value: 'text-rose-400' },
} as const;

function Highlight({
  icon: Icon,
  tone,
  label,
  value,
  note,
  illustrative = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: keyof typeof HIGHLIGHT_TONES;
  label: string;
  value: string;
  note: string;
  illustrative?: boolean;
}) {
  const c = HIGHLIGHT_TONES[tone];
  return (
    <div className={`p-3.5 rounded-2xl bg-gradient-to-br border ${c.box} flex flex-col justify-between`}>
      <div className={`flex items-center justify-between mb-1 gap-1 ${c.head}`}>
        <span className="text-[10px] font-mono uppercase font-bold">{label}</span>
        <Icon className="w-4 h-4 shrink-0" />
      </div>
      <strong className={`text-2xl font-mono font-extrabold ${c.value} ${illustrative ? 'opacity-60' : ''}`}>{value}</strong>
      <span className={`text-[10px] mt-1 ${illustrative ? 'text-amber-400 font-mono' : 'text-[var(--ink-3)]'}`}>{note}</span>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  iconCls,
  title,
  aside,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconCls: string;
  title: string;
  aside: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--rule)] pb-2 flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${iconCls}`} />
        <h2 className="text-lg font-bold text-[var(--ink)]">{title}</h2>
      </div>
      <span className="text-[11px] font-mono text-[var(--ink-3)]">{aside}</span>
    </div>
  );
}

function Stat({
  label,
  value,
  valueCls,
  note,
  boxCls = 'bg-[var(--ground)]/80 border-[var(--rule)]',
}: {
  label: string;
  value: string;
  valueCls: string;
  note?: string;
  boxCls?: string;
}) {
  return (
    <div className={`p-3.5 rounded-xl border flex flex-col ${boxCls}`}>
      <span className="text-[10px] font-mono text-[var(--ink-3)] uppercase">{label}</span>
      <strong className={`text-2xl font-mono font-bold ${valueCls}`}>{value}</strong>
      {note && <span className="text-[10px] text-[var(--ink-3)] mt-1">{note}</span>}
    </div>
  );
}

function MiniStat({ label, value, valueCls = 'text-[var(--ink)]' }: { label: string; value: string; valueCls?: string }) {
  return (
    <div>
      <span className="text-[var(--ink-3)] block text-[10px]">{label}</span>
      <strong className={`font-bold ${valueCls}`}>{value}</strong>
    </div>
  );
}

function MethodBox({ title, aside, items }: { title: string; aside: string; items: Array<[string, string]> }) {
  return (
    <div className="p-3.5 rounded-xl bg-[var(--ground)]/90 border border-[var(--rule)] flex flex-col gap-2 text-xs">
      <div className="flex items-center justify-between border-b border-[var(--rule)] pb-1.5 gap-2 flex-wrap">
        <span className="font-mono font-bold text-cyan-400 uppercase text-[10px]">{title}</span>
        <span className="text-[10px] font-mono text-amber-300">{aside}</span>
      </div>
      <div className={`grid grid-cols-1 ${items.length === 3 ? 'md:grid-cols-3' : 'sm:grid-cols-2'} gap-2.5 text-[11px] leading-relaxed`}>
        {items.map(([k, v]) => (
          <div key={k}>
            <strong className="text-[var(--ink)] block">{k}</strong>
            <span className="text-[var(--ink-2)]">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
