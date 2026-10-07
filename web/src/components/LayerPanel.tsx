'use client';

import React, { useState } from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Construction,
  Anchor,
  Navigation,
  CircleDot,
  SlidersHorizontal,
  Plane,
  X,
  Ship,
  Waves,
  Droplets,
  Car,
  Wind,
  Footprints,
  Compass,
  Satellite,
  ChevronDown,
  ChevronUp,
  Trees,
  Wifi,
  Zap,
  LifeBuoy,
  ShieldAlert
} from 'lucide-react';
import { TransportModeCategory } from '@/lib/types';

interface LayerPanelProps {
  showRoutes: boolean;
  onToggleRoutes: () => void;
  showStops: boolean;
  onToggleStops: () => void;
  showVehicles: boolean;
  onToggleVehicles: () => void;
  showCantieri: boolean;
  onToggleCantieri: () => void;
  showFlights?: boolean;
  onToggleFlights?: () => void;
  flightsCount?: number;
  showShips: boolean;
  onToggleShips: () => void;
  shipsCount?: number;
  showShipRoutes?: boolean;
  onToggleShipRoutes?: () => void;
  showAlilaguna?: boolean;
  onToggleAlilaguna?: () => void;
  alilagunaBoatsCount?: number;
  showMose: boolean;
  onToggleMose: () => void;
  showPasserelle?: boolean;
  onTogglePasserelle?: () => void;
  passerelleCount?: number;
  showMarineSignals?: boolean;
  onToggleMarineSignals?: () => void;
  briccoleCount?: number;
  showOceanStations?: boolean;
  onToggleOceanStations?: () => void;
  oceanStationsCount?: number;
  showBathingWaters?: boolean;
  onToggleBathingWaters?: () => void;
  bathingWatersCount?: number;
  showTrees?: boolean;
  onToggleTrees?: () => void;
  treesCount?: number;
  showServicesVenice?: boolean;
  onToggleServicesVenice?: () => void;
  servicesVeniceCount?: number;
  showCityAssets: boolean;
  onToggleCityAssets: () => void;
  showParkings: boolean;
  onToggleParkings: () => void;
  showAirQuality: boolean;
  onToggleAirQuality: () => void;
  showPedestrianFlows: boolean;
  onTogglePedestrianFlows: () => void;
  showSatellites?: boolean;
  onToggleSatellites?: () => void;
  satellitesCount?: number;
  showSpatialBuffer: boolean;
  onToggleSpatialBuffer: () => void;
  bufferRadiusMeters: number;
  onBufferRadiusChange: (radius: number) => void;
  selectedCategory: TransportModeCategory | 'all';
  onSelectCategory: (cat: TransportModeCategory | 'all') => void;
  categoryCounts: Record<string, number>;
  categoryColors: Record<string, string>;
  onClose?: () => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  showRoutes,
  onToggleRoutes,
  showStops,
  onToggleStops,
  showVehicles,
  onToggleVehicles,
  showCantieri,
  onToggleCantieri,
  showFlights = true,
  onToggleFlights,
  flightsCount = 0,
  showShips,
  onToggleShips,
  shipsCount = 0,
  showShipRoutes = true,
  onToggleShipRoutes,
  showAlilaguna = true,
  onToggleAlilaguna,
  alilagunaBoatsCount = 0,
  showMose,
  onToggleMose,
  showPasserelle = true,
  onTogglePasserelle,
  passerelleCount = 0,
  showMarineSignals = true,
  onToggleMarineSignals,
  briccoleCount = 0,
  showOceanStations = true,
  onToggleOceanStations,
  oceanStationsCount = 0,
  showBathingWaters = true,
  onToggleBathingWaters,
  bathingWatersCount = 0,
  showTrees = true,
  onToggleTrees,
  treesCount = 0,
  showServicesVenice = true,
  onToggleServicesVenice,
  servicesVeniceCount = 0,
  showCityAssets,
  onToggleCityAssets,
  showParkings,
  onToggleParkings,
  showAirQuality,
  onToggleAirQuality,
  showPedestrianFlows,
  onTogglePedestrianFlows,
  showSatellites = true,
  onToggleSatellites,
  satellitesCount = 0,
  showSpatialBuffer,
  onToggleSpatialBuffer,
  bufferRadiusMeters,
  onBufferRadiusChange,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  categoryColors,
  onClose
}) => {
  const [sectionOpen, setSectionOpen] = useState({
    mobility: true,
    lagoon: true,
    city: true,
    actv: true
  });

  const toggleSection = (section: keyof typeof sectionOpen) => {
    setSectionOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const CATEGORIES: { key: TransportModeCategory; label: string }[] = [
    { key: 'vaporetto', label: 'Vaporetto' },
    { key: 'motoscafo', label: 'Motoscafo' },
    { key: 'motonave', label: 'Motonave' },
    { key: 'ferry', label: 'Ferry-boat' },
    { key: 'tram', label: 'Tram T1/T2' },
    { key: 'bus', label: 'Bus Terraferma' },
    { key: 'island', label: 'Bus Isole' },
  ];

  return (
    <aside className="glass-panel rounded-2xl p-3.5 sm:p-4 shadow-xl flex flex-col gap-3.5 max-h-[85vh] overflow-y-auto">
      {/* Mobile grab handle */}
      <div className="w-10 h-1 bg-[var(--rule)]/80 rounded-full mx-auto md:hidden" />

      {/* Title */}
      <div className="flex items-center justify-between border-b border-[var(--rule)] pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
            Open Data Layers & Filtri
          </h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
            title="Chiudi pannello filtri"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* SECTION 1: Mobilità & Trasporti */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => toggleSection('mobility')}
          className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-bold">
            🚢 Mobilità & Trasporti
          </span>
          {sectionOpen.mobility ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {sectionOpen.mobility && (
          <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
            {/* 1. Vehicles */}
            <button
              type="button"
              onClick={onToggleVehicles}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                showVehicles
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5" />
                <span>Flotta ACTV Live</span>
              </div>
              {showVehicles ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            {/* 2. Routes (Shapes) */}
            <button
              type="button"
              onClick={onToggleRoutes}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                showRoutes
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <CircleDot className="w-3.5 h-3.5" />
                <span>Linee & Percorsi (Shapes)</span>
              </div>
              {showRoutes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            {/* 3. Stops */}
            <button
              type="button"
              onClick={onToggleStops}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                showStops
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Anchor className="w-3.5 h-3.5" />
                <span>Fermate e Pontili Imbarco</span>
              </div>
              {showStops ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            {/* 4. Ships & Cruise Vessels (Tronchetto / Marittima AIS) */}
            <button
              type="button"
              onClick={onToggleShips}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                showShips
                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40 shadow-sm'
                  : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Ship className="w-3.5 h-3.5 text-indigo-400" />
                <span>Navi AIS & Tronchetto</span>
              </div>
              <div className="flex items-center gap-1.5">
                {shipsCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                    {shipsCount}
                  </span>
                )}
                {showShips ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </div>
            </button>

            {/* 4b. Maritime Navigational Routes */}
            {onToggleShipRoutes && (
              <button
                type="button"
                onClick={onToggleShipRoutes}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  showShipRoutes
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rotte & Canali Marittimi</span>
                </div>
                {showShipRoutes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* 4c. Alilaguna S.p.A. Transitland Feed */}
            {onToggleAlilaguna && (
              <button
                type="button"
                onClick={onToggleAlilaguna}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  showAlilaguna
                    ? 'bg-blue-600/15 text-blue-300 border-blue-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Waves className="w-3.5 h-3.5 text-blue-400" />
                  <div className="flex flex-col text-left">
                    <span className="leading-tight">Alilaguna Aeroporto VCE</span>
                    <span className="text-[9px] font-mono text-cyan-400">GTFS f-u20f-alilagunaspa</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {alilagunaBoatsCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold">
                      {alilagunaBoatsCount}
                    </span>
                  )}
                  {showAlilaguna ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* 5. Airplanes / ADS-B Flights */}
            {onToggleFlights && (
              <button
                type="button"
                onClick={onToggleFlights}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  showFlights
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Plane className="w-3.5 h-3.5 text-sky-400" />
                  <span>Voli ADS-B (Marco Polo VCE)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {flightsCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold">
                      {flightsCount}
                    </span>
                  )}
                  {showFlights ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* 6. Parkings Live (Piazzale Roma & Tronchetto) */}
            <button
              type="button"
              onClick={onToggleParkings}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                showParkings
                  ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                  : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Car className="w-3.5 h-3.5 text-teal-400" />
                <span>Parcheggi P.le Roma / Tronchetto</span>
              </div>
              {showParkings ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* SECTION 2: Laguna & Maree */}
      <div className="flex flex-col gap-2 pt-2 border-t border-[var(--rule)]">
        <button
          type="button"
          onClick={() => toggleSection('lagoon')}
          className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-bold">
            🌊 Laguna & Maree
          </span>
          {sectionOpen.lagoon ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {sectionOpen.lagoon && (
          <div className="flex flex-col gap-2 animate-in fade-in duration-150">
            {/* Barriere MOSE & Rete CPSM */}
            <button
              type="button"
              onClick={onToggleMose}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                showMose
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/40 shadow-sm'
                  : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Waves className="w-3.5 h-3.5 text-blue-400" />
                <span>Barriere MOSE & Maree CPSM</span>
              </div>
              {showMose ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            {/* Passerelle Acqua Alta CPSM */}
            {onTogglePasserelle && (
              <button
                type="button"
                onClick={onTogglePasserelle}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  showPasserelle
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Passerelle Acqua Alta (CPSM)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {passerelleCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                      {passerelleCount}
                    </span>
                  )}
                  {showPasserelle ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Briccole & Fanali Canale */}
            {onToggleMarineSignals && (
              <button
                type="button"
                onClick={onToggleMarineSignals}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  showMarineSignals
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Anchor className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Briccole & Fanali Canale</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {briccoleCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      {briccoleCount}
                    </span>
                  )}
                  {showMarineSignals ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Piattaforma CNR & Boe Ondametriche */}
            {onToggleOceanStations && (
              <button
                type="button"
                onClick={onToggleOceanStations}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  showOceanStations
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Piattaforma CNR & Boe Onde</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {oceanStationsCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                      {oceanStationsCount}
                    </span>
                  )}
                  {showOceanStations ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Spiagge & Acque Balneazione ARPAV */}
            {onToggleBathingWaters && (
              <button
                type="button"
                onClick={onToggleBathingWaters}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  showBathingWaters
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <LifeBuoy className="w-3.5 h-3.5 text-sky-400" />
                  <span>Balneazione Lido & Pellestrina</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {bathingWatersCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold">
                      {bathingWatersCount}
                    </span>
                  )}
                  {showBathingWaters ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Spatial Buffer PostGIS */}
            <div className="flex flex-col gap-1.5 bg-[var(--rule)]/30 p-2.5 rounded-xl border border-[var(--rule)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--ink)] flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3 h-3 text-amber-400" /> Buffer Spaziale Cantieri
                </span>
                <button
                  type="button"
                  onClick={onToggleSpatialBuffer}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded cursor-pointer ${
                    showSpatialBuffer
                      ? 'bg-amber-500 text-white font-bold'
                      : 'bg-[var(--rule)] text-[var(--ink-2)]'
                  }`}
                >
                  {showSpatialBuffer ? 'Attivo' : 'Spento'}
                </button>
              </div>

              {showSpatialBuffer && (
                <div className="flex flex-col gap-1 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[var(--ink-2)]">Raggio impatto:</span>
                    <span className="font-mono font-bold text-amber-400">{bufferRadiusMeters} m</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={500}
                    step={25}
                    value={bufferRadiusMeters}
                    onChange={(e) => onBufferRadiusChange(Number(e.target.value))}
                    className="w-full h-1.5"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: Città & Ambiente */}
      <div className="flex flex-col gap-2 pt-2 border-t border-[var(--rule)]">
        <button
          type="button"
          onClick={() => toggleSection('city')}
          className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-bold">
            🏛️ Città & Ambiente
          </span>
          {sectionOpen.city ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {sectionOpen.city && (
          <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
            {/* Cantieri */}
            <button
              type="button"
              onClick={onToggleCantieri}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                showCantieri
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Construction className="w-3.5 h-3.5 text-amber-400" />
                <span>Cantieri & Suolo Pubblico</span>
              </div>
              {showCantieri ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            {/* Fontanelle & Ponti Accessibili */}
            <button
              type="button"
              onClick={onToggleCityAssets}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                showCityAssets
                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                  : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span>Fontanelle & Ponti Raccordati</span>
              </div>
              {showCityAssets ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            {/* Verde Urbano & Alberi Monumentali */}
            {onToggleTrees && (
              <button
                type="button"
                onClick={onToggleTrees}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  showTrees
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Trees className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verde & Alberi Monumentali</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {treesCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      {treesCount}
                    </span>
                  )}
                  {showTrees ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Ricarica EV & Wi-Fi VeniceConnected */}
            {onToggleServicesVenice && (
              <button
                type="button"
                onClick={onToggleServicesVenice}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  showServicesVenice
                    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40 shadow-sm'
                    : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wifi className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ricarica EV & Wi-Fi Pubblico</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {servicesVeniceCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                      {servicesVeniceCount}
                    </span>
                  )}
                  {showServicesVenice ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}

            {/* Qualità Aria ARPAV */}
            <button
              type="button"
              onClick={onToggleAirQuality}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                showAirQuality
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Wind className="w-3.5 h-3.5 text-emerald-400" />
                <span>Qualità Aria ARPAV</span>
              </div>
              {showAirQuality ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            {/* Flussi Pedonali Smart Control Room */}
            <button
              type="button"
              onClick={onTogglePedestrianFlows}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                showPedestrianFlows
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Footprints className="w-3.5 h-3.5 text-rose-400" />
                <span>Flussi Pedonali & Access Fee</span>
              </div>
              {showPedestrianFlows ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            {/* Satelliti & Radar SAR (Copernicus / ASI) */}
            <button
              type="button"
              onClick={onToggleSatellites}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                showSatellites
                  ? 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30'
                  : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Satellite className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Satelliti & Radar SAR (ESA/ASI)</span>
              </div>
              <div className="flex items-center gap-1.5">
                {satellitesCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-fuchsia-500/20 text-fuchsia-300">
                    {satellitesCount}
                  </span>
                )}
                {showSatellites ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </div>
            </button>
          </div>
        )}
      </div>

      {/* SECTION 4: Filtri Mezzi ACTV (Visibile solo se il layer Flotta ACTV Live è attivo) */}
      {showVehicles && (
        <div className="flex flex-col gap-2 pt-2 border-t border-[var(--rule)]">
          <button
            type="button"
            onClick={() => toggleSection('actv')}
            className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
          >
            <span className="flex items-center gap-1.5 font-bold">
              ⚡ Flotta ACTV per Tipo
            </span>
            {sectionOpen.actv ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {sectionOpen.actv && (
            <div className="flex flex-col gap-1 animate-in fade-in duration-150">
              {selectedCategory !== 'all' && (
                <div className="flex justify-end pb-1">
                  <button
                    type="button"
                    onClick={() => onSelectCategory('all')}
                    className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
                  >
                    Mostra tutti i tipi
                  </button>
                </div>
              )}
              {CATEGORIES.map((c) => {
                const count = categoryCounts[c.key] || 0;
                const color = categoryColors[c.key] || '#5cc8ff';
                const isSelected = selectedCategory === c.key;

                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => onSelectCategory(isSelected ? 'all' : c.key)}
                    className={`flex items-center justify-between p-1.5 px-2.5 rounded-lg text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--rule)] text-[var(--ink)] font-bold ring-1 ring-cyan-500'
                        : 'text-[var(--ink-2)] hover:bg-[var(--rule)]/50 hover:text-[var(--ink)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                      <span>{c.label}</span>
                    </div>
                    <span className="font-mono text-[11px] tabular text-[var(--ink-3)]">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
