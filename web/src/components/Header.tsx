'use client';

import React from 'react';
import { CameraViewPreset, PaletteTheme } from '@/lib/types';
import { Compass, Moon, Sun, Sparkles, Activity, Layers, BarChart3, ShieldAlert, HelpCircle } from 'lucide-react';

interface HeaderProps {
  currentView: CameraViewPreset;
  onSelectView: (view: CameraViewPreset) => void;
  palette: PaletteTheme;
  onSelectPalette: (palette: PaletteTheme) => void;
  onOpenSpatialModal: () => void;
  onOpenStatsModal: () => void;
  onOpenLayers?: () => void;
  onOpenTutorial?: () => void;
  activeVehiclesCount: number;
  activeCantieriCount: number;
  tideLevel?: number;
  activeShipsCount?: number;
  activeFlightsCount?: number;
  airAqi?: number;
  activeSatellitesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  palette,
  onSelectPalette,
  onOpenSpatialModal,
  onOpenStatsModal,
  onOpenLayers,
  onOpenTutorial,
  activeVehiclesCount,
  activeCantieriCount,
  tideLevel = 76,
  activeShipsCount = 8,
  activeFlightsCount = 7,
  airAqi = 36,
  activeSatellitesCount = 6
}) => {
  return (
    <header className="w-full border-b border-[var(--rule)] bg-[var(--ground)]/90 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3 z-30 shrink-0">
      {/* Top row: Brand & Mobile Action Buttons */}
      <div className="flex items-center justify-between w-full md:w-auto gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-[var(--ink)]">
                VOD <span className="font-normal text-[var(--ink-2)] text-xs sm:text-sm">· Venice Open Data</span>
              </h1>
              <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                LAGUNA & TERRAFERMA
              </span>
            </div>
            <p className="text-[11px] text-[var(--ink-2)] hidden lg:block">
              Cruscotto Geospaziale di Venezia: Maree, Qualità dell'Aria, Navi AIS, Voli, Pedoni e Trasporti
            </p>
          </div>
        </div>

        {/* Mobile-only quick actions */}
        <div className="flex items-center gap-1.5 md:hidden">
          {/* Tide Pill Mobile */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <span>🌊</span>
            <span className="font-bold text-[var(--ink)]">+{tideLevel}</span>
          </div>

          {/* Spatial Mobile Trigger */}
          <button
            type="button"
            onClick={onOpenSpatialModal}
            className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 cursor-pointer"
            title="Incrocio Spaziale"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>

          {/* Stats Mobile Trigger */}
          <button
            type="button"
            onClick={onOpenStatsModal}
            className="p-1.5 rounded-lg bg-[var(--rule)] text-cyan-400 border border-[var(--rule)] cursor-pointer"
            title="Metriche"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          {/* Tutorial / Help Mobile Trigger */}
          {onOpenTutorial && (
            <button
              type="button"
              onClick={onOpenTutorial}
              className="p-1.5 rounded-lg bg-[var(--rule)] text-amber-400 border border-[var(--rule)] cursor-pointer"
              title="Guida & Tutorial"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

          {/* Layers Mobile Trigger */}
          {onOpenLayers && (
            <button
              type="button"
              onClick={onOpenLayers}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-medium cursor-pointer"
              title="Apri Livelli e Filtri"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="text-[11px]">Filtri</span>
            </button>
          )}
        </div>
      </div>

      {/* Camera View Switcher (Horizontally scrollable on mobile) */}
      <div className="w-full md:w-auto overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
        <div className="flex items-center bg-[var(--rule)]/60 p-1 rounded-full border border-[var(--rule)] w-max mx-auto md:mx-0">
          {(['lagoon', 'venezia', 'mestre', 'lido', 'aeroporto'] as CameraViewPreset[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onSelectView(v)}
              className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                currentView === v
                  ? 'bg-cyan-500 text-white shadow-sm font-semibold'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              {v === 'lagoon' ? 'Laguna' : v === 'venezia' ? 'Venezia' : v === 'mestre' ? 'Mestre' : v === 'lido' ? 'Lido' : 'Aeroporto VCE'}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Action Badges & Tools (hidden on mobile, shown on md:) */}
      <div className="hidden md:flex items-center gap-2">
        {/* Tide level badge (Centro Maree) */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30">
          <span>🌊 Marea:</span>
          <span className="font-bold text-[var(--ink)]">+{tideLevel} cm</span>
        </div>

        {/* Air Quality badge (ARPAV) */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <span>🍃 Aria:</span>
          <span className="font-bold text-[var(--ink)]">AQI {airAqi}</span>
        </div>

        {/* Ships badge (AIS) */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
          <span>🚢 Navi:</span>
          <span className="font-bold text-[var(--ink)]">{activeShipsCount} AIS</span>
        </div>

        {/* Satellites badge (Copernicus / ASI) */}
        <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/30">
          <span>🛰️ Satelliti:</span>
          <span className="font-bold text-[var(--ink)]">{activeSatellitesCount} ESA/ASI</span>
        </div>

        {/* Spatial Query Tool trigger */}
        <button
          type="button"
          onClick={onOpenSpatialModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all cursor-pointer"
          title="Incrocio Spaziale: Fermate ACTV entro raggio dai cantieri"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Incrocio Spaziale</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-[10px] font-mono">
            {activeCantieriCount} cantieri
          </span>
        </button>

        {/* Stats modal trigger */}
        <button
          type="button"
          onClick={onOpenStatsModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--rule)] hover:bg-[var(--rule)]/80 text-[var(--ink)] border border-[var(--rule)] transition-all cursor-pointer"
        >
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden lg:inline">Metriche</span>
        </button>

        {/* Tutorial / Guide trigger */}
        {onOpenTutorial && (
          <button
            type="button"
            onClick={onOpenTutorial}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--rule)] hover:bg-[var(--rule)]/80 text-[var(--ink)] border border-[var(--rule)] transition-all cursor-pointer"
            title="Guida interattiva e scelta preset"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Guida</span>
          </button>
        )}

        {/* Theme / Palette Switcher */}
        <div className="flex items-center bg-[var(--rule)]/60 p-0.5 rounded-lg border border-[var(--rule)]">
          <button
            type="button"
            onClick={() => onSelectPalette('notte')}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              palette === 'notte' ? 'bg-cyan-500 text-white' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
            title="Palette Notte (Scuro ad alto contrasto)"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSelectPalette('carta')}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              palette === 'carta' ? 'bg-amber-600 text-white' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
            title="Palette Carta (Mappa storica chiara)"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSelectPalette('dynamic')}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              palette === 'dynamic' ? 'bg-purple-600 text-white' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
            title="Palette Dinamica (Sincronizzata con alba e tramonto di Venezia)"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
