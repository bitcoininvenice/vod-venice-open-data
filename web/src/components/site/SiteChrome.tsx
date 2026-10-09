'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, ArrowLeft, BarChart3, Compass, Globe, Layers } from 'lucide-react';
import { ALL_LAYER_KEYS } from '@/lib/urlLayers';
import { useTranslation } from '@/lib/i18n';

/** Numero di layer della mappa: unica fonte per intestazioni, piè di pagina e pagina 404. */
export const LAYER_COUNT = ALL_LAYER_KEYS.length;

export type SitePage = 'layers' | 'metrics' | 'sources' | 'notFound';

const NAV_CLS =
  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-[var(--ink-2)] hover:text-[var(--ink)] bg-[var(--rule)]/60 hover:bg-[var(--rule)] transition-all cursor-pointer border border-[var(--rule)]';

const ACTIVE_CLS: Record<'cyan' | 'emerald', string> = {
  cyan: 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold transition-all cursor-pointer shadow-sm',
  emerald: 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold transition-all cursor-pointer shadow-sm',
};

const BADGE_CLS: Record<SitePage, string> = {
  layers: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  metrics: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  sources: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  notFound: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

const BADGE_TEXT: Record<SitePage, string> = { layers: '/layers', metrics: '/metrics', sources: '/sources', notFound: '/404' };

/** Voci di navigazione comuni alle pagine secondarie. */
function useNavItems() {
  const { t } = useTranslation();
  return [
    { page: null, href: '/', icon: <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />, label: t('ui.metricsPage.navMap'), tone: 'cyan' as const },
    { page: 'layers' as const, href: '/layers', icon: <Layers className="w-3.5 h-3.5 text-cyan-400" />, label: t('ui.metricsPage.navLayers', { n: LAYER_COUNT }), tone: 'cyan' as const },
    { page: 'metrics' as const, href: '/metrics', icon: <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />, label: t('ui.metricsPage.navMetrics'), tone: 'cyan' as const },
    { page: 'sources' as const, href: '/sources', icon: <Activity className="w-3.5 h-3.5 text-emerald-400" />, label: t('ui.metricsPage.navSources'), tone: 'emerald' as const },
  ];
}

interface SiteHeaderProps {
  page: SitePage;
  /** Sottotitolo sotto il marchio */
  subtitle: string;
  /** Pulsanti specifici della pagina (aggiorna, esporta…) */
  actions?: React.ReactNode;
}

/** Intestazione condivisa da /layers, /metrics, /sources e dalla pagina 404. */
export function SiteHeader({ page, subtitle, actions }: SiteHeaderProps) {
  const { language, toggleLanguage, t } = useTranslation();
  const items = useNavItems();
  return (
    <header className="border-b border-[var(--rule)] bg-[var(--ground)]/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight block text-[var(--ink)]">VOD – Venice Open Data</span>
              <span className="text-[10px] font-mono text-[var(--ink-3)] block -mt-0.5">{subtitle}</span>
            </div>
          </Link>
          <span className={`hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded-full border font-semibold ${BADGE_CLS[page]}`}>
            {BADGE_TEXT[page]}
          </span>
        </div>

        <nav className="flex items-center gap-2 flex-wrap">
          {items.map((it) => {
            const active = it.page === page;
            return (
              <Link key={it.href} href={it.href} aria-current={active ? 'page' : undefined} className={active ? ACTIVE_CLS[it.tone] : NAV_CLS}>
                {it.icon}
                <span>{it.label}</span>
              </Link>
            );
          })}
          {actions}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-[var(--rule)]/60 hover:bg-[var(--rule)] text-[var(--ink)] border border-[var(--rule)] transition-all cursor-pointer"
            title={t('ui.layersPage.switchLanguage')}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language.toUpperCase()}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}

/** Piè di pagina condiviso. */
export function SiteFooter() {
  const { t } = useTranslation();
  const items = useNavItems();
  return (
    <footer className="border-t border-[var(--rule)] bg-[var(--ground)] py-6 px-4 text-center text-xs text-[var(--ink-3)] font-mono">
      <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <p>{t('ui.metricsPage.footer')}</p>
        <div className="flex items-center gap-4 text-[11px] flex-wrap justify-center">
          {items.map((it) => (
            <Link key={it.href} href={it.href} className="hover:text-cyan-400 transition-colors">
              {it.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
