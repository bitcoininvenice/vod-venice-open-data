'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CameraViewPreset, PaletteTheme } from '@/lib/types';
import { Moon, Sun, Sparkles, Layers, BarChart3, HelpCircle, Globe, Waves, MoreHorizontal, Search, Download, TrendingUp, TrendingDown, Activity, Menu, Bot, Route } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { formatSignedCm, formatLocalStamp } from '@/lib/time';
import Image from 'next/image';

interface HeaderProps {
  currentView: CameraViewPreset;
  onSelectView: (view: CameraViewPreset) => void;
  palette: PaletteTheme;
  onSelectPalette: (palette: PaletteTheme) => void;
  onOpenLayers?: () => void;
  onOpenTutorial?: () => void;
  onOpenSearch?: () => void;
  onOpenTripPlanner?: () => void;
  onOpenTideModal?: () => void;
  onOpenExportModal?: () => void;
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
  onOpenLayers,
  onOpenTutorial,
  onOpenSearch,
  onOpenTripPlanner,
  onOpenTideModal,
  onOpenExportModal,
  tideLevel,
  tideObservedAt,
  tideTrend,
}) => {
  const { t } = useTranslation();
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
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0a0f1d] ring-1 ring-white/10 flex items-center justify-center shadow-lg shadow-cyan-500/10 shrink-0 overflow-hidden">
            <Image src="/logo-mark.png" alt="" aria-hidden width={28} height={28} priority className="w-[85%] h-[85%] object-contain" />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-[var(--ink)] whitespace-nowrap">
              <span className="min-[400px]:hidden md:inline xl:hidden" aria-hidden>VOD</span>
              <span className="hidden min-[400px]:inline md:hidden xl:inline">{t('header.title')}</span>
              <span className="sr-only min-[400px]:hidden md:inline xl:hidden">{t('header.title')}</span>
              {/* Per lettori di schermo e motori di ricerca: cosa è la pagina, oltre al marchio */}
              <span className="sr-only"> – {t('header.seoTagline')}</span>
            </h1>
            <p className="sr-only">{t('header.seoIntro')}</p>
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

          <HeaderMenu
            mobile
            onOpenSearch={onOpenSearch}
            onOpenTripPlanner={onOpenTripPlanner}
            onOpenTutorial={onOpenTutorial}
            onOpenTideModal={onOpenTideModal}
            onOpenExportModal={onOpenExportModal}
            palette={palette}
            onSelectPalette={onSelectPalette}
          />
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

        {/* Come arrivare: percorso a piedi e in vaporetto */}
        {onOpenTripPlanner && (
          <button
            type="button"
            onClick={onOpenTripPlanner}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-300 cursor-pointer transition-all shrink-0"
            title={t('ui.planner.title')}
            data-testid="open-planner"
          >
            <Route className="w-3.5 h-3.5" aria-hidden />
            <span className="hidden xl:inline">{t('ui.planner.title')}</span>
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

        <HeaderMenu
          mobile={false}
          onOpenTutorial={onOpenTutorial}
          onOpenTideModal={onOpenTideModal}
          onOpenExportModal={onOpenExportModal}
          palette={palette}
          onSelectPalette={onSelectPalette}
        />
      </div>
    </header>
  );
};

interface MenuEntry {
  key: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
  /** link a una pagina oppure azione */
  href?: string;
  action?: () => void;
}

const ENTRY_CLASS =
  'flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-left text-xs text-[var(--ink)] hover:bg-[var(--rule)] active:bg-[var(--rule)] focus-visible:bg-[var(--rule)] focus-visible:outline-none transition-all cursor-pointer';

/**
 * Menu dell'header, uguale su desktop e mobile. Su mobile ha in più le azioni che sul desktop stanno già
 * nell'header (ricerca, come arrivare, tema della mappa). Accessibile da tastiera (pattern ARIA «menu button»):
 * all'apertura il focus va sulla prima voce, frecce/Home/End scorrono, Escape chiude e torna al pulsante.
 */
function HeaderMenu({
  mobile,
  onOpenSearch,
  onOpenTripPlanner,
  onOpenTutorial,
  onOpenTideModal,
  onOpenExportModal,
  palette,
  onSelectPalette,
}: {
  mobile: boolean;
  onOpenSearch?: () => void;
  onOpenTripPlanner?: () => void;
  onOpenTutorial?: () => void;
  onOpenTideModal?: () => void;
  onOpenExportModal?: () => void;
  palette: PaletteTheme;
  onSelectPalette: (palette: PaletteTheme) => void;
}) {
  const { toggleLanguage, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const container = ref.current;
    const items = () => Array.from(container?.querySelectorAll<HTMLElement>('[role="menuitem"], [role="menuitemradio"]') ?? []);
    const trigger = () => container?.querySelector<HTMLElement>('[aria-haspopup="menu"]');
    const focusTimer = requestAnimationFrame(() => items()[0]?.focus());
    const onPointer = (e: PointerEvent) => {
      if (container && !container.contains(e.target as Node)) setOpen(false);
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
          setOpen(false);
          trigger()?.focus();
          break;
        case 'Tab':
          setOpen(false);
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
  }, [open]);

  const entries: MenuEntry[] = [
    // solo su mobile: sul desktop sono pulsanti dell'header
    ...(mobile && onOpenSearch ? [{ key: 'search', icon: <Search className="w-4 h-4 text-cyan-400 shrink-0" />, label: t('ui.search.title'), hint: t('header.searchHint'), action: onOpenSearch }] : []),
    ...(mobile && onOpenTripPlanner ? [{ key: 'planner', icon: <Route className="w-4 h-4 text-emerald-400 shrink-0" />, label: t('ui.planner.title'), hint: t('header.plannerHint'), action: onOpenTripPlanner }] : []),
    ...(onOpenTutorial ? [{ key: 'guide', icon: <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />, label: t('header.guide'), hint: t('header.guideHint'), action: onOpenTutorial }] : []),
    { key: 'features', icon: <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />, label: t('ui.featuresPage.navLabel'), hint: t('ui.featuresPage.subtitle'), href: '/features' },
    { key: 'metrics', icon: <BarChart3 className="w-4 h-4 text-cyan-400 shrink-0" />, label: t('header.metrics'), hint: t('header.metricsHint'), href: '/metrics' },
    { key: 'sources', icon: <Activity className="w-4 h-4 text-emerald-400 shrink-0" />, label: t('header.sources'), hint: t('header.sourcesHint'), href: '/sources' },
    { key: 'layers', icon: <Layers className="w-4 h-4 text-cyan-400 shrink-0" />, label: t('header.layersList'), hint: t('header.layersListHint'), href: '/layers' },
    { key: 'mcp', icon: <Bot className="w-4 h-4 text-cyan-400 shrink-0" />, label: t('header.connectAi'), hint: t('header.connectAiHint'), href: '/mcp' },
    ...(onOpenExportModal ? [{ key: 'export', icon: <Download className="w-4 h-4 text-emerald-400 shrink-0" />, label: t('ui.exportModal.title'), hint: t('header.exportHint'), action: onOpenExportModal }] : []),
    ...(onOpenTideModal ? [{ key: 'tide', icon: <Waves className="w-4 h-4 text-blue-400 shrink-0" />, label: t('ui.floodModal.title'), hint: t('header.floodHint'), action: onOpenTideModal }] : []),
  ];

  const palettes: { key: PaletteTheme; icon: React.ReactNode; label: string; active: string }[] = [
    { key: 'notte', icon: <Moon className="w-4 h-4" />, label: t('ui.header.notte'), active: 'bg-cyan-500 text-white' },
    { key: 'carta', icon: <Sun className="w-4 h-4" />, label: t('ui.header.carta'), active: 'bg-amber-600 text-white' },
    { key: 'dynamic', icon: <Sparkles className="w-4 h-4" />, label: t('ui.header.dinamica'), active: 'bg-purple-600 text-white' },
  ];

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div className="relative" ref={ref} data-testid={mobile ? 'header-menu-mobile' : 'header-menu'}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          mobile
            ? `p-1.5 rounded-lg border cursor-pointer active:scale-95 transition-all ${open ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-[var(--rule)] text-[var(--ink)] border-[var(--rule)]'}`
            : `flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all cursor-pointer active:scale-95 ${
                open ? 'bg-cyan-500 text-white border-cyan-500 shadow-md shadow-cyan-500/30' : 'bg-[var(--rule)]/60 hover:bg-[var(--rule)] text-[var(--ink)] border-[var(--rule)]'
              }`
        }
        aria-label={mobile ? t('ui.header.altreAzioni') : t('header.menuTitle')}
        aria-haspopup="menu"
        aria-expanded={open}
        title={mobile ? undefined : t('header.menuTitle')}
      >
        {mobile ? (
          <MoreHorizontal className="w-4 h-4" aria-hidden />
        ) : (
          <>
            <Menu className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">{t('header.menu')}</span>
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-64 max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-2xl border border-[var(--rule)] bg-[var(--ground)]/95 backdrop-blur-xl shadow-2xl p-1.5 flex flex-col gap-0.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {entries.map((e) => {
            const body = (
              <>
                {e.icon}
                <div className="flex flex-col">
                  <span className="font-semibold">{e.label}</span>
                  <span className="text-[10px] text-[var(--ink-3)] font-mono">{e.hint}</span>
                </div>
              </>
            );
            return e.href ? (
              <Link key={e.key} href={e.href} role="menuitem" onClick={() => setOpen(false)} className={ENTRY_CLASS}>
                {body}
              </Link>
            ) : (
              <button key={e.key} type="button" role="menuitem" onClick={() => run(e.action!)} className={ENTRY_CLASS}>
                {body}
              </button>
            );
          })}

          <div className="border-t border-[var(--rule)] my-1" />

          {/* Tema della mappa: solo su mobile (sul desktop è nell'header) */}
          {mobile && (
            <>
              <span className="px-3 pt-1 text-[10px] uppercase font-mono text-[var(--ink-3)]">{t('ui.header.paletteMappa')}</span>
              <div className="flex gap-1 px-2 pb-1">
                {palettes.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    role="menuitemradio"
                    aria-checked={palette === p.key}
                    onClick={() => run(() => onSelectPalette(p.key))}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[10px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                      palette === p.key ? p.active : 'bg-[var(--rule)]/60 text-[var(--ink-2)]'
                    }`}
                  >
                    {p.icon}
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <button type="button" role="menuitem" onClick={() => run(toggleLanguage)} className={`${ENTRY_CLASS} justify-between`}>
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold">{t('header.language')}</span>
                <span className="text-[10px] text-[var(--ink-3)] font-mono">{t('ui.header.currentLanguage')}</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[var(--rule)] text-cyan-400 border border-[var(--rule)]">
              {t('ui.header.switchTarget')}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
