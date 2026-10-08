'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  BarChart3,
  Navigation,
  Anchor,
  Construction,
  Compass,
  ShieldAlert,
  Waves,
  Wind,
  Ship,
  Plane,
  Footprints,
  Car,
  Droplets,
  Accessibility,
  Satellite,
  Orbit,
  Trees,
  LifeBuoy,
  Zap,
} from 'lucide-react';
import { PlatformMetrics } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';
import { formatSignedCm } from '@/lib/time';
import { useDialogA11y } from '@/components/ui/useDialogA11y';

/** Valore numerico o segnaposto: in caricamento "…", senza fonte collegata "n.d.". */
const show = (loaded: boolean, v: number | string | null | undefined) => (!loaded ? '…' : v === null || v === undefined ? 'n.d.' : v);

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type MetricCategory = 'all' | 'maree_aria' | 'laguna_scienza' | 'marittimo' | 'trasporti' | 'aeroporto' | 'satelliti' | 'pedoni_citta';

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const { language, t } = useTranslation();
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<MetricCategory>('all');
  const panelRef = useDialogA11y(isOpen, onClose);
  const loaded = metrics !== null;

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setMetrics(data.data);
      })
      .catch((err) => console.error(err));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Statistiche piattaforma"
        tabIndex={-1}
        className="glass-panel w-full max-w-4xl rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 border border-cyan-500/30 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto outline-none"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--rule)] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 text-cyan-400 flex items-center justify-center border border-cyan-500/40 shrink-0 shadow-lg shadow-cyan-500/10">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30">
                  Venice Open Data Analytics
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  ● {language === 'it' ? '9 SETTORI URBANI INCROCIATI' : '9 URBAN SECTORS INTERSECTED'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[var(--ink)] leading-snug">
                {language === 'it' ? 'Cruscotto Metriche Geospaziali & Dati Aperti di Venezia' : 'Geospatial Metrics & Venice Open Data Dashboard'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          {[
            { id: 'all', label: language === 'it' ? 'Tutti i Dati' : 'All Data', count: 26 },
            { id: 'maree_aria', label: language === 'it' ? 'Maree & Aria ARPAV' : 'Tides & ARPAV Air', count: 4 },
            { id: 'laguna_scienza', label: language === 'it' ? 'CNR, Onde & Passerelle' : 'CNR, Waves & Walkways', count: 4 },
            { id: 'marittimo', label: language === 'it' ? 'Porto, AIS & Canali' : 'Port, AIS & Channels', count: 3 },
            { id: 'trasporti', label: language === 'it' ? 'ACTV & Alilaguna' : 'ACTV & Alilaguna', count: 4 },
            { id: 'aeroporto', label: language === 'it' ? 'Voli & VCE Hub' : 'Flights & VCE Hub', count: 2 },
            { id: 'satelliti', label: language === 'it' ? 'Satelliti & Radar SAR' : 'Satellites & SAR Radar', count: 2 },
            { id: 'pedoni_citta', label: language === 'it' ? 'Flussi & Servizi Città' : 'Pedestrian Flows & City Services', count: 7 }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as MetricCategory)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-white font-semibold shadow-md shadow-cyan-500/20'
                  : 'bg-[var(--rule)]/40 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--rule)]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-[var(--rule)] text-[var(--ink-3)]'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* SECTION 1: MAREE & MOSE (CPSM) */}
          {(activeTab === 'all' || activeTab === 'maree_aria') && (
            <>
              <div className="bg-gradient-to-br from-blue-950/30 to-blue-900/10 p-3.5 rounded-xl border border-blue-500/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-blue-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Waves className="w-4 h-4 text-blue-400" />
                    <span>Livello Marea Live</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">CPSM</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-[var(--ink)]">
                    {loaded ? formatSignedCm(metrics.tideLevelCm, '') : '…'}
                  </span>
                  <span className="text-xs font-mono text-blue-400">cm (Punta Salute)</span>
                </div>
                <span className="text-[11px] text-[var(--ink-2)] font-mono leading-tight">
                  Misura CPSM da dati.venezia.it · San Marco inizia ad allagarsi da +80 cm
                </span>
              </div>

              <div className="bg-gradient-to-br from-indigo-950/30 to-indigo-900/10 p-3.5 rounded-xl border border-indigo-500/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-indigo-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Waves className="w-4 h-4 text-indigo-400" />
                    <span>Sistema MOSE</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">4 Barriere</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-emerald-400">
                    {show(loaded, metrics?.moseGatesCount)}
                  </span>
                  <span className="text-xs font-mono text-indigo-300">paratoie a scomparsa</span>
                </div>
                <span className="text-[11px] text-[var(--ink-2)] font-mono leading-tight">
                  Stato operativo non pubblicato in tempo reale · soglia indicativa +110 cm
                </span>
              </div>
            </>
          )}

          {/* SECTION 2: QUALITÀ DELL'ARIA (ARPAV) */}
          {(activeTab === 'all' || activeTab === 'maree_aria') && (
            <>
              <div className="bg-gradient-to-br from-emerald-950/30 to-emerald-900/10 p-3.5 rounded-xl border border-emerald-500/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Wind className="w-4 h-4 text-emerald-400" />
                    <span>Qualità dell&apos;Aria AQI</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">ARPAV</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-emerald-400">
                    {show(loaded, metrics?.averageAqi)}
                  </span>
                  <span className="text-xs font-mono text-emerald-300">AQI medio</span>
                </div>
                <span className="text-[11px] text-[var(--ink-2)] font-mono leading-tight">
                  Feed orario ARPAV non ancora collegato: nessun valore in tempo reale
                </span>
              </div>
            </>
          )}

          {/* SECTION 3: TRAFFICO MARITTIMO & CROCIERE (VTS) */}
          {(activeTab === 'all' || activeTab === 'marittimo') && (
            <>
              <div className="bg-gradient-to-br from-indigo-950/30 to-purple-950/10 p-3.5 rounded-xl border border-indigo-500/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-indigo-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Ship className="w-4 h-4 text-indigo-400" />
                    <span>Flotta Navale & Crociere</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">Anagrafica</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-[var(--ink)]">
                    {show(loaded, metrics?.activeShipsCount)}
                  </span>
                  <span className="text-xs font-mono text-indigo-300">navi in anagrafica banchine</span>
                </div>
                <span className="text-[11px] text-[var(--ink-2)] font-mono leading-tight">
                  Stazza totale: {loaded ? `${(metrics.totalGrossTonnage / 1000).toFixed(1)}k GT` : '…'} · elenco di riferimento, non AIS live
                </span>
              </div>

              <div className="bg-gradient-to-br from-amber-950/30 to-orange-950/10 p-3.5 rounded-xl border border-amber-500/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-amber-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Compass className="w-4 h-4 text-amber-400" />
                    <span>Canali Marittimi Censiti</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">Batimetria</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-amber-400">
                    {show(loaded, metrics?.maritimeChannelsCount)}
                  </span>
                  <span className="text-xs font-mono text-amber-300">rotte commerciali</span>
                </div>
                <span className="text-[11px] text-[var(--ink-2)] font-mono leading-tight">
                  Canale dei Petroli (-14.5m), Bocca Lido-Tronchetto (-11.0m), Linea 17, Aliscafi
                </span>
              </div>
            </>
          )}

          {/* SECTION 4: VOLI & AEROPORTO MARCO POLO VCE */}
          {(activeTab === 'all' || activeTab === 'aeroporto') && (
            <>
              <div className="bg-gradient-to-br from-sky-950/30 to-blue-950/10 p-3.5 rounded-xl border border-sky-500/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-sky-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Plane className="w-4 h-4 text-sky-400" />
                    <span>Voli Radar nel Raggio Lagunare</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">OpenSky / ADS-B</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-sky-400">
                    {show(loaded, metrics?.activeFlightsCount)}
                  </span>
                  <span className="text-xs font-mono text-sky-300">aerei rilevati ora</span>
                </div>
                <span className="text-[11px] text-[var(--ink-2)] font-mono leading-tight">
                  Transponder ADS-B nell&apos;area TMA di Venezia (OpenSky Network)
                </span>
              </div>
            </>
          )}

          {/* SECTION 5: TRASPORTO PUBBLICO ACTV & ALILAGUNA */}
          {(activeTab === 'all' || activeTab === 'trasporti') && (
            <>
              <div className="bg-[var(--rule)]/40 p-3.5 rounded-xl border border-[var(--rule)] flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-[var(--ink-2)]">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Navigation className="w-4 h-4 text-cyan-400" />
                    <span>Rete ACTV (Acqua + Terra)</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">GTFS ACTV</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-[var(--ink)]">
                    {show(loaded, metrics?.totalRoutes)}
                  </span>
                  <span className="text-xs font-mono text-[var(--ink-2)]">linee nel GTFS</span>
                </div>
                <span className="text-[11px] text-[var(--ink-2)] font-mono leading-tight">
                  {show(loaded, metrics?.routesNavigazione)} navigazione · {show(loaded, metrics?.routesAutomobilistico)} gomma &amp; tram ({loaded ? metrics.totalTrips.toLocaleString('it-IT') : '…'} corse feriali)
                </span>
              </div>

              <div className="bg-gradient-to-br from-blue-950/30 to-amber-950/10 p-3.5 rounded-xl border border-blue-500/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-blue-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Ship className="w-4 h-4 text-blue-400" />
                    <span>Navigazione Aeroporto Alilaguna</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">Transitland</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-[var(--ink)]">
                    {show(loaded, metrics?.alilagunaRoutesCount)}
                  </span>
                  <span className="text-xs font-mono text-blue-300">linee dedicate</span>
                </div>
                <span className="text-[11px] text-[var(--ink-2)] font-mono leading-tight">
                  21 darsene · {show(loaded, metrics?.alilagunaBoatsCount)} barche in servizio ora (simulate da orario)
                </span>
              </div>

              <div className="bg-gradient-to-br from-emerald-950/30 to-teal-950/10 p-3.5 rounded-xl border border-teal-500/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-teal-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Car className="w-4 h-4 text-teal-400" />
                    <span>Parcheggi Interscambio AVM</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300">AVM / P.le Roma</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-emerald-400">
                    {show(loaded, metrics?.freeParkingSpots?.toLocaleString('it-IT'))}
                  </span>
                  <span className="text-xs font-mono text-teal-300">posti liberi</span>
                </div>
                <span className="text-[11px] text-[var(--ink-2)] font-mono leading-tight">
                  AVM non pubblica un&apos;API di disponibilità posti · capienza totale {loaded ? metrics.totalParkingSpaces.toLocaleString('it-IT') : '…'}
                </span>
              </div>
            </>
          )}

          {/* SECTION 6: SMART CONTROL ROOM, FLUSSI PEDONALI & CITTÀ */}
          {(activeTab === 'all' || activeTab === 'pedoni_citta') && (
            <>
              <div className="bg-gradient-to-br from-rose-950/30 to-pink-950/10 p-3.5 rounded-xl border border-rose-500/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-rose-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Footprints className="w-4 h-4 text-rose-400" />
                    <span>Flussi Pedonali Orari</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">Smart Control Room</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-rose-400">
                    {show(loaded, metrics?.totalHourlyPedestrians?.toLocaleString('it-IT'))}
                  </span>
                  <span className="text-xs font-mono text-rose-300">passaggi/ora</span>
                </div>
                <span className="text-[11px] text-[var(--ink-2)] font-mono leading-tight">
                  La Smart Control Room non pubblica conteggi aperti in tempo reale
                </span>
              </div>

              <div className="bg-gradient-to-br from-cyan-950/30 to-blue-950/10 p-3.5 rounded-xl border border-cyan-500/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-cyan-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Droplets className="w-4 h-4 text-cyan-400" />
                    <span>Fontanelle Potabili Comunali</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">dati.venezia.it</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-cyan-400">
                    {show(loaded, metrics?.drinkingFountainsCount)}
                  </span>
                  <span className="text-xs font-mono text-cyan-300">fontane pubbliche</span>
                </div>
                <span className="text-[11px] text-[var(--ink-2)] font-mono leading-tight">
                  Rete idrica potabile censita · Acqua gratis per residenti e turisti nei campielli
                </span>
              </div>

              <div className="bg-gradient-to-br from-emerald-950/30 to-green-950/10 p-3.5 rounded-xl border border-emerald-500/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Accessibility className="w-4 h-4 text-emerald-400" />
                    <span>Ponti Accessibili Censiti</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Barriere Zero</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-emerald-400">
                    {show(loaded, metrics?.accessibleBridgesCount)}
                  </span>
                  <span className="text-xs font-mono text-emerald-300">ponti con rampe</span>
                </div>
                <span className="text-[11px] text-[var(--ink-2)] font-mono leading-tight">
                  Ponti con rampe agevolate o servoscala elettro-meccanico per disabili e passeggini
                </span>
              </div>

              <div className="bg-gradient-to-br from-amber-950/30 to-yellow-950/10 p-3.5 rounded-xl border border-amber-500/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-amber-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Construction className="w-4 h-4 text-amber-400" />
                    <span>Cantieri & Occupazioni Suolo</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">Comune LL.PP.</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-amber-400">
                    {show(loaded, metrics?.activeCantieri)}
                  </span>
                  <span className="text-xs font-mono text-amber-300">cantieri attivi</span>
                </div>
                <span className="text-[11px] text-[var(--ink-2)] font-mono leading-tight">
                  Investimento: € {loaded ? `${(metrics.totalInvestmentCantieri / 1000000).toFixed(2)}M` : '…'} · {show(loaded, metrics?.stopsNearWorksites200m)} fermate nel buffer 200m
                </span>
              </div>

              <div className="bg-gradient-to-br from-green-950/30 to-emerald-950/10 p-3.5 rounded-xl border border-green-500/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-green-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Trees className="w-4 h-4 text-green-400" />
                    <span>Verde & Alberi Monumentali</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-green-500/20 text-green-300">Catasto Verde</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-green-400">
                    {show(loaded, metrics?.monumentalTreesCount)}
                  </span>
                  <span className="text-xs font-mono text-green-300">alberi monumentali</span>
                </div>
                <span className="text-[11px] text-[var(--ink-2)] font-mono leading-tight">
                  Giardini Reali, Biennale, Sant&apos;Elena, Papadopoli · Assorbimento CO₂: ~220 kg/anno
                </span>
              </div>

              <div className="bg-gradient-to-br from-indigo-950/30 to-blue-950/10 p-3.5 rounded-xl border border-indigo-500/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-indigo-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Zap className="w-4 h-4 text-indigo-400" />
                    <span>Ricarica EV & Wi-Fi Pubblico</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">Smart City</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-indigo-400">
                    {loaded ? metrics.evChargingStationsCount + metrics.wifiHotspotsCount : '…'}
                  </span>
                  <span className="text-xs font-mono text-indigo-300">presidi digitali & green</span>
                </div>
                <span className="text-[11px] text-[var(--ink-2)] font-mono leading-tight">
                  {show(loaded, metrics?.evChargingStationsCount)} hub EV Ultra-Fast (P.le Roma, Tronchetto) · {show(loaded, metrics?.wifiHotspotsCount)} hotspot VeniceConnected
                </span>
              </div>
            </>
          )}

          {/* SECTION 7: OSSERVAZIONE DELLA TERRA & SATELLITI ESA/ASI */}
          {(activeTab === 'all' || activeTab === 'satelliti') && (
            <>
              <div className="bg-gradient-to-br from-indigo-950/30 to-violet-950/10 p-3.5 rounded-xl border border-indigo-500/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-indigo-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Satellite className="w-4 h-4 text-indigo-400" />
                    <span>Costellazioni Radar & Ottiche</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">Copernicus & ASI</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-indigo-400">
                    {show(loaded, metrics?.activeSatellitesCount)}
                  </span>
                  <span className="text-xs font-mono text-indigo-300">satelliti censiti</span>
                </div>
                <span className="text-[11px] text-[var(--ink-2)] font-mono leading-tight">
                  {show(loaded, metrics?.copernicusSentinelsCount)} Sentinel ESA · COSMO-SkyMed CSG-2 ASI · ISS · Landsat 9 · Galileo GNSS
                </span>
              </div>

              <div className="bg-gradient-to-br from-purple-950/30 to-pink-950/10 p-3.5 rounded-xl border border-purple-500/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-purple-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Orbit className="w-4 h-4 text-purple-400" />
                    <span>Interferometria Subsidenza & MOSE</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">DInSAR Radar</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-purple-400">
                    {show(loaded, metrics?.radarEarthObservationSwathKm)}
                  </span>
                  <span className="text-xs font-mono text-purple-300">km ampiezza scansione SAR</span>
                </div>
                <span className="text-[11px] text-[var(--ink-2)] font-mono leading-tight">
                  Precisione millimetrica DInSAR per sprofondamento suolo lagunare e cerniere paratoie MOSE
                </span>
              </div>
            </>
          )}

          {/* SECTION 8: SCIENZE MARINE, CNR, ONDE & PASSERELLE */}
          {(activeTab === 'all' || activeTab === 'laguna_scienza') && (
            <>
              <div className="bg-gradient-to-br from-amber-950/30 to-yellow-950/10 p-3.5 rounded-xl border border-amber-500/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-amber-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Rete Passerelle Acqua Alta</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">CPSM / Prot. Civile</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-amber-400">
                    {show(loaded, metrics?.passerelleTotalMeters?.toLocaleString('it-IT'))}
                  </span>
                  <span className="text-xs font-mono text-amber-300">metri di passerelle censite</span>
                </div>
                <span className="text-[11px] text-[var(--ink-2)] font-mono leading-tight">
                  {show(loaded, metrics?.passerelleMountedCount)} percorsi montati in opera · Piazza San Marco, Rialto, Ferrovia, Formosa
                </span>
              </div>

              <div className="bg-gradient-to-br from-cyan-950/30 to-teal-950/10 p-3.5 rounded-xl border border-cyan-500/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-cyan-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <span>Piattaforma CNR-ISMAR &quot;Acqua Alta&quot;</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">Ricerca Marina</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-cyan-400">
                    {show(loaded, metrics?.cnrWaveHeightMeters)}
                  </span>
                  <span className="text-xs font-mono text-cyan-300">onda significativa (Hs, m)</span>
                </div>
                <span className="text-[11px] text-[var(--ink-2)] font-mono leading-tight">
                  Feed della piattaforma non ancora collegato · livello marea disponibile nel layer MOSE
                </span>
              </div>

              <div className="bg-gradient-to-br from-emerald-950/30 to-teal-950/10 p-3.5 rounded-xl border border-emerald-500/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Anchor className="w-4 h-4 text-emerald-400" />
                    <span>Briccole & Fanali di Canale</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Provv. OO.PP.</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-emerald-400">
                    {show(loaded, metrics?.briccoleCount)}
                  </span>
                  <span className="text-xs font-mono text-emerald-300">segnalamenti nautici censiti</span>
                </div>
                <span className="text-[11px] text-[var(--ink-2)] font-mono leading-tight">
                  Dame a 5 pali, briccole in rovere naturale ed ecologiche, lanterne ritmiche canali San Marco e Giudecca
                </span>
              </div>

              <div className="bg-gradient-to-br from-sky-950/30 to-blue-950/10 p-3.5 rounded-xl border border-sky-500/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-sky-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <LifeBuoy className="w-4 h-4 text-sky-400" />
                    <span>Acque Balneazione Litorali</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">ARPAV Veneto</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-sky-400">
                    {show(loaded, metrics?.bathingWaterStationsCount)}
                  </span>
                  <span className="text-xs font-mono text-sky-300">spiagge Bandiera Blu</span>
                </div>
                <span className="text-[11px] text-[var(--ink-2)] font-mono leading-tight">
                  Qualità Eccellente · Lido Blue Moon, Murazzi, Alberoni WWF e Pellestrina Diga Sud
                </span>
              </div>
            </>
          )}
        </div>

        {/* Source citation */}
        <div className="text-[11px] text-[var(--ink-3)] leading-relaxed pt-2 border-t border-[var(--rule)] flex flex-wrap gap-x-4 gap-y-1 items-center justify-between">
          <span>
            <b>{language === 'it' ? 'Fonti Istituzionali:' : 'Institutional Sources:'}</b> CPSM Centro Maree · ARPAV · CNR-ISMAR · ISPRA RML · Guardia Costiera VTS · ENAV/OpenSky · Smart Control Room Tronchetto · Comune di Venezia (dati.venezia.it) · ACTV / AVM · Alilaguna S.p.A. · Venis S.p.A. · Copernicus Data Space (ESA) · ASI Open Data · CelesTrak NORAD · Veritas.
          </span>
          <span className="font-mono text-[10px] text-cyan-400">
            PostgreSQL / PostGIS Engine
          </span>
        </div>
      </div>
    </div>
  );
};
