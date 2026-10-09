'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CameraViewPreset, PaletteTheme } from '@/lib/types';
import { Compass, Moon, Sun, Sparkles, Layers, BarChart3, HelpCircle, Globe, Waves, MoreHorizontal, Construction, Search, Download, TrendingUp, TrendingDown, Activity, Menu } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { formatSignedCm, formatLocalStamp } from '@/lib/time';

interface HeaderProps {
  currentView: CameraViewPreset;
  onSelectView: (view: CameraViewPreset) => void;
  palette: PaletteTheme;
  onSelectPalette: (palette: PaletteTheme) => void;
  onOpenSpatialModal: () => void;
  onOpenLayers?: () => void;
  onOpenTutorial?: () => void;
  onOpenSearch?: () => void;
  onOpenTideModal?: () => void;
  onOpenExportModal?: () => void;
  activeCantieriCount: number;
  /** Marea reale a Punta Salute; null se la fonte CPSM non è disponibile */
  tideLevel: number | null;
  tideObservedAt?: string | null;
  tideTrend?: 'IN_AUMENTO' | 'IN_CALO' | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  palette,
  onSelectPalette,
  onOpenSpatialModal,
  onOpenLayers,
  onOpenTutorial,
  onOpenSearch,
  onOpenTideModal,
  onOpenExportModal,
  activeCantieriCount,
  tideLevel,
  tideObservedAt,
  tideTrend,
}) => {
  const { toggleLanguage, t } = useTranslation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const desktopMenuRef = useRef<HTMLDivElement>(null);

  // Menu accessibili da tastiera (pattern ARIA "menu button"): all'apertura il focus va sulla
  // prima voce, frecce/Home/End scorrono le voci, Escape chiude e riporta il focus al pulsante,
  // Tab chiude. Tap esterno chiude.
  useEffect(() => {
    if (!isMoreOpen && !isDesktopMenuOpen) return;
    const container = (isMoreOpen ? moreRef : desktopMenuRef).current;
    const items = () =>
      Array.from(
        container?.querySelectorAll<HTMLElement>('[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]') ?? [],
      );
    const trigger = () => container?.querySelector<HTMLElement>('[aria-haspopup="menu"]');
    const close = () => {
      setIsMoreOpen(false);
      setIsDesktopMenuOpen(false);
    };

    const focusTimer = requestAnimationFrame(() => items()[0]?.focus());

    const onPointer = (e: PointerEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setIsMoreOpen(false);
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(e.target as Node)) setIsDesktopMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      const list = items();
      const idx = list.indexOf(document.activeElement as HTMLElement);
      const move = (i: number) => {
        e.preventDefault();
        list[(i + list.length) % list.length]?.focus();
      };
      switch (e.key) {
        case 'Escape':
          close();
          trigger()?.focus();
          break;
        case 'Tab':
          close();
          break;
        case 'ArrowDown':
          move(idx + 1);
          break;
        case 'ArrowUp':
          move(idx <= 0 ? list.length - 1 : idx - 1);
          break;
        case 'Home':
          move(0);
          break;
        case 'End':
          move(list.length - 1);
          break;
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(focusTimer);
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [isMoreOpen, isDesktopMenuOpen]);

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
          <button
            type="button"
            onClick={onOpenTideModal}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono shrink-0 cursor-pointer transition-all ${
              tideLevel !== null && tideLevel >= 110
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 motion-safe:animate-pulse'
                : tideLevel !== null && tideLevel >= 80
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}
            title={`${t('header.tide')} · CPSM Punta Salute · ${formatLocalStamp(tideObservedAt)} · ${
              tideTrend === 'IN_AUMENTO' ? t('header.tideRising') : tideTrend === 'IN_CALO' ? t('header.tideFalling') : ''
            } · ${t('header.tideClickHint')}`}
          >
            <Waves className="w-3.5 h-3.5" aria-hidden />
            <span className="font-bold text-[var(--ink)]">{formatSignedCm(tideLevel, '')}</span>
            {tideTrend === 'IN_AUMENTO' && <TrendingUp className="w-3 h-3 text-rose-400" />}
            {tideTrend === 'IN_CALO' && <TrendingDown className="w-3 h-3 text-cyan-400" />}
          </button>

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
                {onOpenSearch && (
                  <MobileMenuItem
                    icon={<Search className="w-4 h-4 text-cyan-400" />}
                    label={t('ui.search.title')}
                    onClick={() => runAndClose(onOpenSearch)}
                  />
                )}
                {onOpenTideModal && (
                  <MobileMenuItem
                    icon={<Waves className="w-4 h-4 text-blue-400" />}
                    label={t('ui.floodModal.title')}
                    onClick={() => runAndClose(onOpenTideModal)}
                  />
                )}
                {onOpenExportModal && (
                  <MobileMenuItem
                    icon={<Download className="w-4 h-4 text-emerald-400" />}
                    label={t('ui.exportModal.title')}
                    onClick={() => runAndClose(onOpenExportModal)}
                  />
                )}
                <MobileMenuItem
                  icon={<Construction className="w-4 h-4 text-amber-400" />}
                  label={`${t('header.spatialIntersection')} (${activeCantieriCount})`}
                  onClick={() => runAndClose(onOpenSpatialModal)}
                />
                <Link
                  href="/metrics"
                  role="menuitem"
                  onClick={() => setIsMoreOpen(false)}
                  className="flex items-center gap-2.5 w-full px-2.5 py-2.5 rounded-lg text-left text-xs text-[var(--ink)] hover:bg-[var(--rule)] active:bg-[var(--rule)] focus-visible:bg-[var(--rule)] focus-visible:outline-none cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>{t('header.metrics')}</span>
                </Link>
                <Link
                  href="/sources"
                  role="menuitem"
                  onClick={() => setIsMoreOpen(false)}
                  className="flex items-center gap-2.5 w-full px-2.5 py-2.5 rounded-lg text-left text-xs text-[var(--ink)] hover:bg-[var(--rule)] active:bg-[var(--rule)] focus-visible:bg-[var(--rule)] focus-visible:outline-none cursor-pointer"
                >
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>{t('header.sources')}</span>
                </Link>
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
        {/* Global Search Omnibox */}
        {onOpenSearch && (
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[var(--rule)]/60 hover:bg-[var(--rule)] border border-[var(--rule)] text-xs text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer transition-all shrink-0"
            title={t('ui.search.title')}
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">{t('ui.search.title')}</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--ink-3)] bg-[var(--ground)] border border-[var(--rule)]">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Tide level badge (Centro Maree - clicca per simulatore) */}
        <button
          type="button"
          onClick={onOpenTideModal}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
            tideLevel !== null && tideLevel >= 110
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 motion-safe:animate-pulse'
              : tideLevel !== null && tideLevel >= 80
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}
          title={`${t('header.tide')} · CPSM Punta Salute · ${formatLocalStamp(tideObservedAt)} · ${
            tideTrend === 'IN_AUMENTO' ? t('header.tideRising') : tideTrend === 'IN_CALO' ? t('header.tideFalling') : ''
          } · ${t('header.tideClickHint')}`}
        >
          <Waves className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{t('header.tide')}:</span>
          <span className="font-bold text-[var(--ink)]">{formatSignedCm(tideLevel)}</span>
          {tideTrend === 'IN_AUMENTO' && <TrendingUp className="w-3.5 h-3.5 text-rose-400" />}
          {tideTrend === 'IN_CALO' && <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />}
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

        {/* Desktop Hamburger Dropdown Menu */}
        <div className="relative" ref={desktopMenuRef}>
          <button
            type="button"
            onClick={() => setIsDesktopMenuOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all cursor-pointer active:scale-95 ${
              isDesktopMenuOpen
                ? 'bg-cyan-500 text-white border-cyan-500 shadow-md shadow-cyan-500/30'
                : 'bg-[var(--rule)]/60 hover:bg-[var(--rule)] text-[var(--ink)] border-[var(--rule)]'
            }`}
            aria-label={t('header.menuTitle')}
            aria-haspopup="menu"
            aria-expanded={isDesktopMenuOpen}
            title={t('header.menuTitle')}
          >
            <Menu className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">{t('header.menu')}</span>
          </button>

          {isDesktopMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-[var(--rule)] bg-[var(--ground)]/95 backdrop-blur-xl shadow-2xl p-1.5 flex flex-col gap-0.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              {/* 1. Guida */}
              {onOpenTutorial && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsDesktopMenuOpen(false);
                    onOpenTutorial();
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-left text-xs text-[var(--ink)] hover:bg-[var(--rule)] active:bg-[var(--rule)] focus-visible:bg-[var(--rule)] focus-visible:outline-none transition-all cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">{t('header.guide')}</span>
                    <span className="text-[10px] text-[var(--ink-3)] font-mono">{t('header.guideHint')}</span>
                  </div>
                </button>
              )}

              {/* 2. Metriche */}
              <Link
                href="/metrics"
                role="menuitem"
                onClick={() => setIsDesktopMenuOpen(false)}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-left text-xs text-[var(--ink)] hover:bg-[var(--rule)] active:bg-[var(--rule)] focus-visible:bg-[var(--rule)] focus-visible:outline-none transition-all cursor-pointer"
              >
                <BarChart3 className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold">{t('header.metrics')}</span>
                  <span className="text-[10px] text-[var(--ink-3)] font-mono">{t('header.metricsHint')}</span>
                </div>
              </Link>

              {/* 3. Stato Fonti */}
              <Link
                href="/sources"
                role="menuitem"
                onClick={() => setIsDesktopMenuOpen(false)}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-left text-xs text-[var(--ink)] hover:bg-[var(--rule)] active:bg-[var(--rule)] focus-visible:bg-[var(--rule)] focus-visible:outline-none transition-all cursor-pointer"
              >
                <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold">{t('header.sources')}</span>
                  <span className="text-[10px] text-[var(--ink-3)] font-mono">{t('header.sourcesHint')}</span>
                </div>
              </Link>

              {/* 4. Esportazioni dati */}
              {onOpenExportModal && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsDesktopMenuOpen(false);
                    onOpenExportModal();
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-left text-xs text-[var(--ink)] hover:bg-[var(--rule)] active:bg-[var(--rule)] focus-visible:bg-[var(--rule)] focus-visible:outline-none transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">{t('ui.exportModal.title')}</span>
                    <span className="text-[10px] text-[var(--ink-3)] font-mono">{t('header.exportHint')}</span>
                  </div>
                </button>
              )}

              {/* 5. Simulatore Maree */}
              {onOpenTideModal && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsDesktopMenuOpen(false);
                    onOpenTideModal();
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-left text-xs text-[var(--ink)] hover:bg-[var(--rule)] active:bg-[var(--rule)] focus-visible:bg-[var(--rule)] focus-visible:outline-none transition-all cursor-pointer"
                >
                  <Waves className="w-4 h-4 text-blue-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">{t('ui.floodModal.title')}</span>
                    <span className="text-[10px] text-[var(--ink-3)] font-mono">{t('header.floodHint')}</span>
                  </div>
                </button>
              )}

              {/* Divisore */}
              <div className="border-t border-[var(--rule)] my-1" />

              {/* 6. Lingua */}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  toggleLanguage();
                  setIsDesktopMenuOpen(false);
                }}
                className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-left text-xs text-[var(--ink)] hover:bg-[var(--rule)] active:bg-[var(--rule)] focus-visible:bg-[var(--rule)] focus-visible:outline-none transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">{t('header.language')}</span>
                    <span className="text-[10px] text-[var(--ink-3)] font-mono">
                      {t('ui.header.currentLanguage')}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[var(--rule)] text-cyan-400 border border-[var(--rule)]">
                  {t('ui.header.switchTarget')}
                </span>
              </button>
            </div>
          )}
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
      className="flex items-center gap-2.5 w-full px-2.5 py-2.5 rounded-lg text-left text-xs text-[var(--ink)] hover:bg-[var(--rule)] active:bg-[var(--rule)] focus-visible:bg-[var(--rule)] focus-visible:outline-none cursor-pointer"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
