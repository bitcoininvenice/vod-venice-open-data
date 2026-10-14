'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { downloadBlob } from '@/lib/dataExport';
import { SiteFooter, SiteHeader } from '@/components/site/SiteChrome';
import { useTranslation } from '@/lib/i18n';
import { CAMPO_SITE } from '@/server/sources/campo';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ShieldCheck,
  Radio,
  Database,
  Clock,
  Search,
  Download,
  Info,
  ExternalLink
} from 'lucide-react';
import type { SourceHealth } from '@/server/sourceHealth';

interface HealthApiResponse {
  status: 'ok' | 'stale' | 'degraded';
  checkedAt: string;
  sources: SourceHealth[];
}

/**
 * Metadati delle fonti: solo informazioni verificabili (ente, portale, licenza dichiarata nella
 * pipeline o nel portale, formato, frequenza con cui VOD rilegge il dato). La nota opzionale è
 * una chiave ui.sourcesPage.meta_<id>.
 */
interface SourceMetadata {
  institution: string;
  portalUrl: string;
  portalName: string;
  license: string;
  format: string;
  /** Chiave di traduzione della frequenza di aggiornamento in VOD */
  refresh: 'r15s' | 'r20s' | 'r60s' | 'r5min' | 'r10min' | 'r15min' | 'r30min' | 'r60min' | 'weekly' | 'census';
  hasNote?: boolean;
}

const COMUNE = 'Comune di Venezia';
const SOURCES_METADATA: Record<string, SourceMetadata> = {
  tide: { institution: `${COMUNE} – Centro Maree (CPSM)`, portalUrl: 'https://dati.venezia.it', portalName: 'dati.venezia.it', license: 'CC BY', format: 'JSON', refresh: 'r60s' },
  'tide-forecast': { institution: `${COMUNE} – Centro Maree (CPSM)`, portalUrl: 'https://dati.venezia.it', portalName: 'dati.venezia.it', license: 'CC BY', format: 'JSON', refresh: 'r10min' },
  metar: { institution: 'NOAA Aviation Weather Center', portalUrl: 'https://aviationweather.gov', portalName: 'aviationweather.gov', license: 'Public domain (NOAA)', format: 'METAR JSON', refresh: 'r5min' },
  'gtfs-rt-nav': { institution: 'AVM / ACTV', portalUrl: 'https://actv.avmspa.it', portalName: 'tpl.actv.it', license: '—', format: 'GTFS-RT (protobuf)', refresh: 'r20s', hasNote: true },
  'gtfs-rt-aut': { institution: 'AVM / ACTV', portalUrl: 'https://actv.avmspa.it', portalName: 'tpl.actv.it', license: '—', format: 'GTFS-RT (protobuf)', refresh: 'r20s', hasNote: true },
  'cpsm-meteo': { institution: `${COMUNE} – Centro Maree (CPSM)`, portalUrl: 'https://dati.venezia.it', portalName: 'dati.venezia.it', license: 'CC BY', format: 'JSON', refresh: 'r5min' },
  aisstream: { institution: 'aisstream.io', portalUrl: 'https://aisstream.io', portalName: 'aisstream.io', license: 'Messaggi AIS pubblici', format: 'WebSocket JSON', refresh: 'r60s', hasNote: true },
  opensky: { institution: 'OpenSky Network', portalUrl: 'https://opensky-network.org', portalName: 'opensky-network.org', license: 'OpenSky Terms of Use', format: 'REST JSON', refresh: 'r15s', hasNote: true },
  'open-meteo': { institution: 'Open-Meteo (modelli DWD ICON / ECMWF)', portalUrl: 'https://open-meteo.com', portalName: 'open-meteo.com', license: 'CC BY 4.0', format: 'REST JSON', refresh: 'r30min', hasNote: true },
  'cams-air': { institution: 'Copernicus CAMS via Open-Meteo', portalUrl: 'https://open-meteo.com/en/docs/air-quality-api', portalName: 'open-meteo.com', license: 'CC BY 4.0', format: 'REST JSON', refresh: 'r30min', hasNote: true },
  'open-meteo-marine': { institution: 'Open-Meteo Marine', portalUrl: 'https://open-meteo.com/en/docs/marine-weather-api', portalName: 'open-meteo.com', license: 'CC BY 4.0', format: 'REST JSON', refresh: 'r30min', hasNote: true },
  'gtfs-static': { institution: 'ACTV (Open Data)', portalUrl: 'https://actv.avmspa.it', portalName: 'actv.avmspa.it', license: 'CC BY', format: 'GTFS', refresh: 'weekly' },
  'opere-pubbliche': { institution: COMUNE, portalUrl: 'https://dati.venezia.it', portalName: 'dati.venezia.it', license: 'CC BY', format: 'CSV', refresh: 'weekly', hasNote: true },
  wifi: { institution: COMUNE, portalUrl: 'https://dati.venezia.it', portalName: 'dati.venezia.it', license: 'CC BY', format: 'GeoJSON', refresh: 'weekly' },
  arpav: { institution: 'ARPAV', portalUrl: 'https://www.arpa.veneto.it', portalName: 'arpa.veneto.it', license: 'CC BY 4.0', format: 'CSV', refresh: 'weekly', hasNote: true },
  'osm-cameras': { institution: 'OpenStreetMap contributors', portalUrl: 'https://www.openstreetmap.org', portalName: 'openstreetmap.org', license: 'ODbL 1.0', format: 'Overpass JSON', refresh: 'weekly' },
  'osm-dae': { institution: 'OpenStreetMap contributors', portalUrl: 'https://www.openstreetmap.org', portalName: 'openstreetmap.org', license: 'ODbL 1.0', format: 'Overpass JSON', refresh: 'weekly', hasNote: true },
  'osm-pharmacies': { institution: 'OpenStreetMap contributors', portalUrl: 'https://www.openstreetmap.org', portalName: 'openstreetmap.org', license: 'ODbL 1.0', format: 'Overpass JSON', refresh: 'weekly', hasNote: true },
  'osm-fountains': { institution: 'OpenStreetMap contributors', portalUrl: 'https://www.openstreetmap.org', portalName: 'openstreetmap.org', license: 'ODbL 1.0', format: 'Overpass JSON', refresh: 'weekly' },
  'venice-tap-water': { institution: 'Venice Tap Water', portalUrl: 'https://www.venicetapwater.org', portalName: 'venicetapwater.org', license: 'Uso con citazione della fonte', format: 'KML', refresh: 'weekly', hasNote: true },
  'osm-poi': { institution: 'OpenStreetMap contributors', portalUrl: 'https://www.openstreetmap.org', portalName: 'openstreetmap.org', license: 'ODbL 1.0', format: 'Overpass JSON', refresh: 'weekly', hasNote: true },
  'osm-waterways': { institution: 'OpenStreetMap contributors', portalUrl: 'https://www.openstreetmap.org', portalName: 'openstreetmap.org', license: 'ODbL 1.0', format: 'Overpass JSON', refresh: 'weekly', hasNote: true },
  'osm-civici': { institution: 'OpenStreetMap contributors', portalUrl: 'https://www.openstreetmap.org', portalName: 'openstreetmap.org', license: 'ODbL 1.0', format: 'Overpass JSON', refresh: 'weekly', hasNote: true },
  'osm-walk': { institution: 'OpenStreetMap contributors', portalUrl: 'https://www.openstreetmap.org', portalName: 'openstreetmap.org', license: 'ODbL 1.0', format: 'Overpass JSON', refresh: 'weekly', hasNote: true },
  'osm-parks': { institution: 'OpenStreetMap contributors', portalUrl: 'https://www.openstreetmap.org', portalName: 'openstreetmap.org', license: 'ODbL 1.0', format: 'Overpass JSON', refresh: 'weekly', hasNote: true },
  'arpav-pollen': { institution: 'ARPAV', portalUrl: 'https://www.arpa.veneto.it/dati-ambientali/open-data', portalName: 'arpa.veneto.it', license: 'CC BY 4.0', format: 'CSV', refresh: 'weekly', hasNote: true },
  'cciaa-turismo': { institution: 'Camera di Commercio Venezia Rovigo', portalUrl: 'https://opengovernment.unioncamere.gov.it', portalName: 'opengovernment.unioncamere.gov.it', license: 'CC BY 4.0', format: 'CSV', refresh: 'weekly', hasNote: true },
  'arpav-lagoon': { institution: 'ARPAV', portalUrl: 'https://www.arpa.veneto.it/dati-ambientali/open-data/file-e-allegati/soaml/laguna-di-venezia/dati-sonda', portalName: 'arpa.veneto.it', license: 'CC BY 4.0', format: 'CSV', refresh: 'weekly', hasNote: true },
  'istat-census': { institution: 'ISTAT', portalUrl: 'https://www.istat.it/notizia/basi-territoriali-e-variabili-censuarie/', portalName: 'istat.it (basi territoriali e variabili censuarie)', license: 'CC BY 4.0', format: 'XLSX + Shapefile', refresh: 'census', hasNote: true },
  'cruscotto-italia': { institution: 'Cruscotto Italia – AgID', portalUrl: 'https://cruscotto-italia.dati.gov.it', portalName: 'cruscotto-italia.dati.gov.it', license: 'CC BY 4.0', format: 'MCP (comune_kpi)', refresh: 'weekly', hasNote: true },
  campo: { institution: 'Comunità CAMPO', portalUrl: CAMPO_SITE, portalName: 'CAMPO (API GeoJSON)', license: 'CC BY 4.0', format: 'GeoJSON', refresh: 'r60min', hasNote: true },
  'actv-avvisi': { institution: 'ACTV / AVM S.p.A.', portalUrl: 'https://avm.avmspa.it/it/content/infomobilit%C3%A0-avmactv-venezia', portalName: 'actv.avmspa.it/rss.xml', license: 'Contenuti ACTV (citati con link)', format: 'RSS', refresh: 'r15min', hasNote: true },
  'comune-ordinanze': { institution: COMUNE, portalUrl: 'https://www.comune.venezia.it/it/ordinanze', portalName: 'comune.venezia.it/it/ordinanze', license: 'Atti pubblici', format: 'REST JSON + HTML', refresh: 'r60min', hasNote: true },
  'osm-toponyms': { institution: 'OpenStreetMap contributors', portalUrl: 'https://www.openstreetmap.org', portalName: 'openstreetmap.org', license: 'ODbL 1.0', format: 'Overpass JSON', refresh: 'weekly', hasNote: true },
  'packet-broker': { institution: 'The Things Network – Packet Broker', portalUrl: 'https://packetbroker.net', portalName: 'mapper.packetbroker.net', license: 'Dati pubblicati dai proprietari', format: 'REST JSON', refresh: 'r10min', hasNote: true },
  'bdap-mop': { institution: 'MEF – Ragioneria Generale dello Stato (BDAP)', portalUrl: 'https://bdap-opendata.rgs.mef.gov.it/opendata/spd_mop_prg_mon_reg05_01_9999', portalName: 'bdap-opendata.rgs.mef.gov.it', license: 'CC BY', format: 'CSV (CKAN)', refresh: 'weekly', hasNote: true },
  'agcom-fiber': { institution: 'AGCOM – BroadbandMap', portalUrl: 'https://maps.agcom.it', portalName: 'maps.agcom.it', license: 'CC BY 4.0', format: 'ArcGIS REST (griglia 20 m)', refresh: 'weekly', hasNote: true },
  'alilaguna-gtfs': { institution: 'Alilaguna S.p.A.', portalUrl: 'https://www.alilaguna.it', portalName: 'alilaguna.it (GTFS)', license: '—', format: 'GTFS', refresh: 'weekly', hasNote: true },
};

// Dettagli prodotti da /api/health, tradotti quando noti
const DETAIL_KEYS: Record<string, string> = {
  'fonte non raggiungibile o senza data': 'detailUnreachable',
  "emissione dell'ultima previsione": 'detailForecastIssue',
  'quota esaurita o servizio non raggiungibile': 'detailQuota',
  'nessuna nave ricevuta nell’ultima lettura': 'detailNoShips',
  'AISSTREAM_API_KEY non configurata': 'detailAisNotConfigured',
  'orario importato non più valido': 'detailTimetableExpired',
};

type FilterCategory = 'all' | 'live' | 'dataset' | 'anomalies';

export default function SourcesPage() {
  const { t, language } = useTranslation();
  const s_ = (key: string, params?: Record<string, string | number>) => t(`ui.sourcesPage.${key}`, params);
  const locale = language === 'it' ? 'it-IT' : 'en-GB';

  const [data, setData] = useState<HealthApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadFailed, setLoadFailed] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');

  // Nessun setState sincrono: chiamabile dall'effetto di mount
  const loadHealth = () =>
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: HealthApiResponse) => {
        setData(json);
        setLoadFailed(false);
        setLastRefreshedAt(new Date());
      })
      .catch((err) => {
        console.error('Errore nel caricamento dello stato delle fonti:', err);
        setLoadFailed(true);
      })
      .finally(() => setIsLoading(false));

  const fetchHealth = () => {
    setIsLoading(true);
    void loadHealth();
  };

  useEffect(() => {
    void loadHealth();
  }, []);

  const exportJsonData = () => {
    if (!data) return;
    const report = {
      platform: 'Venice Open Data (VOD)',
      reportType: 'Source health and data freshness',
      exportTimestampIso: new Date().toISOString(),
      healthReport: data,
      metadataCatalog: SOURCES_METADATA
    };
    downloadBlob(
      new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }),
      `vod-venice-sources-health-${new Date().toISOString().slice(0, 10)}.json`
    );
  };

  /** Nome tradotto della fonte (fallback al nome restituito dall'API). */
  const sourceName = (src: SourceHealth) => {
    const key = `ui.sourcesPage.name_${src.id}`;
    const translated = t(key);
    return translated === key ? src.name : translated;
  };

  const ageLabel = (ageMinutes: number | null) => {
    if (ageMinutes === null) return s_('ageNone');
    if (ageMinutes <= 0) return s_('ageNow');
    if (ageMinutes < 60) return s_('ageMinutes', { n: ageMinutes });
    if (ageMinutes < 1440) return s_('ageHours', { n: Math.round(ageMinutes / 60) });
    return s_('ageDays', { n: Math.round(ageMinutes / 1440) });
  };

  const thresholdLabel = (min: number) => (min < 60 ? `${min} min` : min < 1440 ? `${Math.round(min / 60)} h` : `${Math.round(min / 1440)} d`);

  const totalSources = data?.sources?.length ?? 0;
  const okSources = data?.sources?.filter((s) => s.status === 'ok').length ?? 0;
  const staleSources = data?.sources?.filter((s) => s.status === 'stale').length ?? 0;
  const downSources = data?.sources?.filter((s) => s.status === 'down').length ?? 0;

  const filteredSources = useMemo(() => {
    if (!data?.sources) return [];
    const q = searchQuery.toLowerCase().trim();
    return data.sources.filter((s) => {
      if (selectedFilter === 'live' && s.kind !== 'live') return false;
      if (selectedFilter === 'dataset' && s.kind !== 'dataset') return false;
      if (selectedFilter === 'anomalies' && s.status === 'ok') return false;
      if (!q) return true;
      const meta = SOURCES_METADATA[s.id];
      return [s.name, s.id, meta?.institution, meta?.license, meta?.format, s.detail]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [data, selectedFilter, searchQuery]);


  return (
    <div className="min-h-screen bg-[var(--ground)] text-[var(--ink)] flex flex-col justify-between selection:bg-cyan-500/30">
      <SiteHeader
        page="sources"
        subtitle={s_('brandSubtitle')}
        actions={
          <>
            <button
              type="button"
              onClick={fetchHealth}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-[var(--rule)]/60 hover:bg-[var(--rule)] text-[var(--ink)] border border-[var(--rule)] transition-all cursor-pointer disabled:opacity-50"
              title={s_('refreshTitle')}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? 'motion-safe:animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t('ui.metricsPage.refresh')}</span>
            </button>
            <button
              type="button"
              onClick={exportJsonData}
              disabled={!data}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition-all cursor-pointer shadow-sm shadow-cyan-500/20 disabled:opacity-50"
              title={s_('exportTitle')}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('ui.metricsPage.export')}</span>
            </button>
          </>
        }
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--rule)] pb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                {s_('kicker')}
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
                {s_('okCount', { ok: okSources, total: totalSources })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink)]">{s_('title')}</h1>
            <p className="text-xs sm:text-sm text-[var(--ink-2)] mt-1 max-w-3xl">{s_('intro', { n: totalSources || '…' })}</p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
            <span className="text-xs font-mono text-[var(--ink-3)]">
              {s_('lastCheck')}{' '}
              <strong className="text-[var(--ink)]">
                {lastRefreshedAt
                  ? lastRefreshedAt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : s_('inProgress')}
              </strong>
            </span>
          </div>
        </div>

        {loadFailed && (
          <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-rose-300">
            {s_('loadFailed')}
          </div>
        )}

        <section className="rounded-2xl p-4 sm:p-5 bg-[var(--rule)]/30 border border-cyan-500/30 flex items-start gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm sm:text-base font-bold text-[var(--ink)]">{s_('transparencyTitle')}</h2>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed max-w-4xl">{s_('transparencyBody')}</p>
          </div>
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col justify-between">
            <span className="text-[11px] font-mono text-[var(--ink-3)] uppercase font-semibold">{s_('overall')}</span>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  !data ? 'bg-[var(--ink-3)]' : data.status === 'ok' ? 'bg-emerald-400' : data.status === 'stale' ? 'bg-amber-400' : 'bg-rose-400'
                }`}
              />
              <strong className="text-base font-mono font-bold uppercase text-[var(--ink)]">
                {!data ? '…' : data.status === 'ok' ? s_('overallOk') : data.status === 'stale' ? s_('overallStale') : s_('overallDegraded')}
              </strong>
            </div>
            <span className="text-[10px] font-mono text-[var(--ink-3)] mt-1">{s_('monitored', { n: totalSources })}</span>
          </div>
          <Counter tone="emerald" label={s_('okLabel')} value={okSources} note={s_('okNote')} />
          <Counter tone="amber" label={s_('staleLabel')} value={staleSources} note={s_('staleNote')} />
          <Counter tone="rose" label={s_('downLabel')} value={downSources} note={s_('downNote')} />
        </section>

        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--rule)]/20 p-2 sm:p-2.5 rounded-2xl border border-[var(--rule)]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--ink-3)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={s_('searchPlaceholder')}
              aria-label={s_('searchPlaceholder')}
              className="w-full bg-[var(--ground)] border border-[var(--rule)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-cyan-500/60 font-mono transition-colors"
            />
          </div>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {(
              [
                { id: 'all', label: s_('filterAll', { n: totalSources }) },
                { id: 'live', label: s_('filterLive') },
                { id: 'dataset', label: s_('filterDataset') },
                { id: 'anomalies', label: s_('filterAnomalies', { n: staleSources + downSources }) }
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={selectedFilter === tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                  selectedFilter === tab.id
                    ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/20'
                    : 'bg-[var(--ground)] text-[var(--ink-2)] hover:text-[var(--ink)] border border-[var(--rule)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="text-xs font-mono text-[var(--ink-3)] px-1">{s_('shown', { n: filteredSources.length })}</div>

          {filteredSources.length === 0 ? (
            <div className="p-12 text-center border border-[var(--rule)] rounded-2xl bg-[var(--rule)]/10 flex flex-col items-center gap-2">
              <Activity className="w-8 h-8 text-[var(--ink-3)]" />
              <p className="text-sm font-semibold text-[var(--ink-2)]">{isLoading ? '…' : s_('noMatch')}</p>
              {!isLoading && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFilter('all');
                  }}
                  className="text-xs font-mono text-cyan-400 underline hover:text-cyan-300 cursor-pointer"
                >
                  {s_('resetFilters')}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredSources.map((s) => {
                const meta = SOURCES_METADATA[s.id];
                const detailKey = s.detail ? DETAIL_KEYS[s.detail] : undefined;
                return (
                  <div
                    key={s.id}
                    className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between gap-3.5 transition-all shadow-sm text-[var(--ink)] ${
                      s.status === 'ok'
                        ? 'bg-emerald-500/5 border-emerald-500/25 hover:border-emerald-500/40'
                        : s.status === 'stale'
                        ? 'bg-amber-500/5 border-amber-500/25 hover:border-amber-500/40'
                        : 'bg-rose-500/5 border-rose-500/25 hover:border-rose-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                            s.kind === 'live' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                          }`}
                        >
                          {s.kind === 'live' ? <Radio className="w-4 h-4" /> : <Database className="w-4 h-4" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h3 className="text-sm font-bold text-[var(--ink)] leading-snug">{sourceName(s)}</h3>
                          {meta && (
                            <a
                              href={meta.portalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors underline truncate mt-0.5"
                            >
                              <span>{meta.institution}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold shrink-0 flex items-center gap-1.5 border ${
                          s.status === 'ok'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : s.status === 'stale'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {s.status === 'ok' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : s.status === 'stale' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span>{s_(`status_${s.status}`)}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs font-mono text-[var(--ink-2)] bg-[var(--rule)]/30 px-3 py-1.5 rounded-xl border border-[var(--rule)]/60">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{ageLabel(s.ageMinutes)}</span>
                      </div>
                      <span className="text-[10px] text-[var(--ink-3)]">{s_('threshold', { t: thresholdLabel(s.maxAgeMinutes) })}</span>
                    </div>

                    {meta && (
                      <div className="flex flex-col gap-1.5 text-[11px] font-mono">
                        <div className="flex items-center justify-between gap-2 text-[10px] text-[var(--ink-3)] flex-wrap">
                          <span>
                            {s_('format')}: {meta.format} · {s_(`refresh_${meta.refresh}`)}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-[var(--rule)]/50 text-[var(--ink-2)]">
                            {meta.license === '—' ? s_('licenseUnconfirmed') : meta.license}
                          </span>
                        </div>
                        {meta.hasNote && <p className="text-[11px] text-[var(--ink-2)] leading-snug">{s_(`meta_${s.id}`)}</p>}
                      </div>
                    )}

                    {s.detail && (
                      <div className="text-[11px] text-amber-400/90 font-mono italic bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                        {s_('note')}: {detailKey ? s_(detailKey) : s.detail}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl p-5 sm:p-6 bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-4 mt-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-[var(--ink)]">{s_('methodTitle')}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed text-[var(--ink-2)]">
            {(['Freshness', 'Cache', 'Licenses'] as const).map((k) => (
              <div key={k} className="p-3.5 rounded-xl bg-[var(--ground)] border border-[var(--rule)]">
                <strong className="block text-[var(--ink)] mb-1">{s_(`method${k}Title`)}</strong>
                {s_(`method${k}Body`)}
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

const COUNTER_TONES = {
  emerald: { box: 'bg-emerald-500/10 border-emerald-500/30', label: 'text-emerald-300', value: 'text-emerald-400', note: 'text-emerald-300/80' },
  amber: { box: 'bg-amber-500/10 border-amber-500/30', label: 'text-amber-300', value: 'text-amber-400', note: 'text-amber-300/80' },
  rose: { box: 'bg-rose-500/10 border-rose-500/30', label: 'text-rose-300', value: 'text-rose-400', note: 'text-rose-300/80' },
} as const;

function Counter({ tone, label, value, note }: { tone: keyof typeof COUNTER_TONES; label: string; value: number; note: string }) {
  const c = COUNTER_TONES[tone];
  return (
    <div className={`p-4 rounded-2xl border flex flex-col justify-between ${c.box}`}>
      <span className={`text-[11px] font-mono uppercase font-semibold ${c.label}`}>{label}</span>
      <span className={`text-2xl sm:text-3xl font-bold font-mono mt-1 ${c.value}`}>{value}</span>
      <span className={`text-[10px] font-mono mt-1 ${c.note}`}>{note}</span>
    </div>
  );
}
