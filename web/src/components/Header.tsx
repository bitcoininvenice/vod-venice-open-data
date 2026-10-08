'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CameraViewPreset, PaletteTheme } from '@/lib/types';
import { Compass, Moon, Sun, Sparkles, Layers, BarChart3, HelpCircle, Globe, Waves, MoreHorizontal, Ship, Satellite, Construction } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { formatSignedCm, formatLocalStamp } from '@/lib/time';

interface HeaderProps {
  currentView: CameraViewPreset;
  onSelectView: (view: CameraViewPreset) => void;
  palette: PaletteTheme;
  onSelectPalette: (palette: PaletteTheme) => void;
  onOpenSpatialModal: () => void;
  onOpenStatsModal: () => void;
  onOpenLayers?: () => void;
  onOpenTutorial?: () => void;
  activeCantieriCount: number;
  /** Marea reale a Punta Salute; null se la fonte CPSM non è disponibile */
  tideLevel: number | null;
  tideObservedAt?: string | null;
  activeShipsCount: number;
  activeSatellitesCount: number;
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
  activeCantieriCount,
  tideLevel,
  tideObservedAt,
  activeShipsCount,
  activeSatellitesCount
}) => {
  const { language, toggleLanguage, t } = useTranslation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Chiude il menu "Altro" con tap esterno o Escape
  useEffect(() => {
    if (!isMoreOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setIsMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMoreOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [isMoreOpen]);

  const runAndClose = (action: () => void) => {
    setIsMoreOpen(false);
    action();
  };

  const viewLabels: Record<CameraViewPreset, string> = {
    lagoon: t('header.viewLagoon'),
    venezia: t('header.viewVenice'),
    mestre: t('header.viewMestre'),
    lido: t('header.viewLido'),
    aeroporto: t('header.viewAirport')
  };

  return (
    <header className="w-full border-b border-[var(--rule)] bg-[var(--ground)]/90 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-1.5 sm:gap-3 relative z-[45] shrink-0">
      {/* Top row: Brand & Mobile Action Buttons */}
      <div className="flex items-center justify-between w-full md:w-auto gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-[var(--ink)] whitespace-nowrap">
              <span className="min-[400px]:hidden md:inline xl:hidden" aria-hidden>VOD</span>
              <span className="hidden min-[400px]:inline md:hidden xl:inline">{t('header.title')}</span>
              <span className="sr-only min-[400px]:hidden md:inline xl:hidden">{t('header.title')}</span>
            </h1>
          </div>
        </div>

        {/* Mobile: azioni principali sempre visibili + menu "Altro" per le secondarie */}
        <div className="flex items-center gap-1.5 md:hidden shrink-0">
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30 shrink-0"
            title={`${t('header.tide')} · CPSM Punta Salute · ${formatLocalStamp(tideObservedAt)}`}
          >
            <Waves className="w-3.5 h-3.5" aria-hidden />
            <span className="font-bold text-[var(--ink)]">{formatSignedCm(tideLevel, '')}</span>
          </div>

          {onOpenLayers && (
            <button
              type="button"
              onClick={onOpenLayers}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-mono font-semibold cursor-pointer active:scale-95 transition-all shrink-0"
              aria-label={t('header.filters')}
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" aria-hidden />
              <span className="text-[11px]">{t('header.filters')}</span>
            </button>
          )}

          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setIsMoreOpen((v) => !v)}
              className={`p-1.5 rounded-lg border cursor-pointer active:scale-95 transition-all ${
                isMoreOpen ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-[var(--rule)] text-[var(--ink)] border-[var(--rule)]'
              }`}
              aria-label={t('ui.header.altreAzioni')}
              aria-haspopup="menu"
              aria-expanded={isMoreOpen}
            >
              <MoreHorizontal className="w-4 h-4" aria-hidden />
            </button>

            {isMoreOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-[var(--rule)] bg-[var(--ground)] shadow-2xl p-1.5 flex flex-col gap-0.5 z-50"
              >
                <MobileMenuItem
                  icon={<Construction className="w-4 h-4 text-amber-400" />}
                  label={`${t('header.spatialIntersection')} (${activeCantieriCount})`}
                  onClick={() => runAndClose(onOpenSpatialModal)}
                />
                <MobileMenuItem
                  icon={<BarChart3 className="w-4 h-4 text-cyan-400" />}
                  label={t('header.metrics')}
                  onClick={() => runAndClose(onOpenStatsModal)}
                />
                {onOpenTutorial && (
                  <MobileMenuItem
                    icon={<HelpCircle className="w-4 h-4 text-amber-400" />}
                    label={t('header.guide')}
                    onClick={() => runAndClose(onOpenTutorial)}
                  />
                )}
                <MobileMenuItem
                  icon={<Globe className="w-4 h-4 text-cyan-400" />}
                  label={t('ui.header.linguaItalianoEnglish')}
                  onClick={() => runAndClose(toggleLanguage)}
                />
                <div className="border-t border-[var(--rule)] my-1" />
                <span className="px-2.5 pt-0.5 text-[10px] uppercase font-mono text-[var(--ink-3)]">
                  {t('ui.header.paletteMappa')}
                </span>
                <div className="grid grid-cols-3 gap-1 p-1">
                  {([
                    { key: 'notte', icon: <Moon className="w-4 h-4" />, label: t('ui.header.notte'), active: 'bg-cyan-500 text-white' },
                    { key: 'carta', icon: <Sun className="w-4 h-4" />, label: t('ui.header.carta'), active: 'bg-amber-600 text-white' },
                    { key: 'dynamic', icon: <Sparkles className="w-4 h-4" />, label: t('ui.header.dinamica'), active: 'bg-purple-600 text-white' },
                  ] as const).map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      role="menuitemradio"
                      aria-checked={palette === p.key}
                      onClick={() => runAndClose(() => onSelectPalette(p.key))}
                      className={`flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] font-mono cursor-pointer transition-all ${
                        palette === p.key ? p.active : 'bg-[var(--rule)]/50 text-[var(--ink-2)]'
                      }`}
                    >
                      {p.icon}
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Camera View Switcher (Horizontally scrollable on mobile) */}
      <div className="w-full md:w-auto overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
        <div className="flex items-center bg-[var(--rule)]/60 p-0.5 sm:p-1 rounded-full border border-[var(--rule)] w-max mx-auto md:mx-0">
          {(['lagoon', 'venezia', 'mestre', 'lido', 'aeroporto'] as CameraViewPreset[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onSelectView(v)}
              className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                currentView === v
                  ? 'bg-cyan-500 text-white shadow-sm font-semibold'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              {viewLabels[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Action Badges & Tools (hidden on mobile, shown on md:) */}
      <div className="hidden md:flex items-center gap-1.5 lg:gap-2 shrink-0">
        {/* Tide level badge (Centro Maree) */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap bg-blue-500/10 text-blue-400 border border-blue-500/30"
          title={`${t('header.tide')} · CPSM Punta Salute · ${formatLocalStamp(tideObservedAt)}`}
        >
          <Waves className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{t('header.tide')}:</span>
          <span className="font-bold text-[var(--ink)]">{formatSignedCm(tideLevel)}</span>
        </div>

        {/* Ships badge (anagrafica banchine, non AIS live) */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
          <Ship className="w-3.5 h-3.5" />
          <span>{t('header.ships')}:</span>
          <span className="font-bold text-[var(--ink)]">{activeShipsCount}</span>
        </div>

        {/* Satellites badge (Copernicus / ASI) */}
        <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/30">
          <Satellite className="w-3.5 h-3.5" />
          <span>{t('header.satellites')}:</span>
          <span className="font-bold text-[var(--ink)]">{activeSatellitesCount} ESA/ASI</span>
        </div>

        {/* Spatial Query Tool trigger */}
        <button
          type="button"
          onClick={onOpenSpatialModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all cursor-pointer"
          title={t('header.spatialTitle')}
        >
          <Construction className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">{t('header.spatialIntersection')}:</span>
          <span className="font-bold text-[var(--ink)]">
            {activeCantieriCount}
            <span className="hidden lg:inline"> {t('header.cantieriCount')}</span>
          </span>
        </button>

        {/* Stats modal trigger */}
        <button
          type="button"
          onClick={onOpenStatsModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--rule)] hover:bg-[var(--rule)]/80 text-[var(--ink)] border border-[var(--rule)] transition-all cursor-pointer"
        >
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden lg:inline">{t('header.metrics')}</span>
        </button>

        {/* Tutorial / Guide trigger */}
        {onOpenTutorial && (
          <button
            type="button"
            onClick={onOpenTutorial}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--rule)] hover:bg-[var(--rule)]/80 text-[var(--ink)] border border-[var(--rule)] transition-all cursor-pointer"
            title={t('header.guide')}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">{t('header.guide')}</span>
          </button>
        )}

        {/* Language Switcher Desktop */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-[var(--rule)]/60 hover:bg-[var(--rule)] text-[var(--ink)] border border-[var(--rule)] transition-all cursor-pointer"
          title={t('header.switchLanguageTitle')}
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>{language.toUpperCase()}</span>
        </button>

        {/* Theme / Palette Switcher */}
        <div className="flex items-center bg-[var(--rule)]/60 p-0.5 rounded-lg border border-[var(--rule)]">
          <button
            type="button"
            onClick={() => onSelectPalette('notte')}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              palette === 'notte' ? 'bg-cyan-500 text-white' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
            title={t('header.paletteDarkTitle')}
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSelectPalette('carta')}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              palette === 'carta' ? 'bg-amber-600 text-white' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
            title={t('header.paletteLightTitle')}
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSelectPalette('dynamic')}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              palette === 'dynamic' ? 'bg-purple-600 text-white' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
            title={t('header.paletteDynamicTitle')}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

function MobileMenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2.5 w-full px-2.5 py-2.5 rounded-lg text-left text-xs text-[var(--ink)] hover:bg-[var(--rule)] active:bg-[var(--rule)] cursor-pointer"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
