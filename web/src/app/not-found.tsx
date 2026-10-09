'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, ArrowLeft, MapPinOff, Layers, BarChart3, Activity } from 'lucide-react';
import { ALL_LAYER_KEYS } from '@/lib/urlLayers';
import { useTranslation } from '@/lib/i18n';

const NAV_CLS =
  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-[var(--ink-2)] hover:text-[var(--ink)] bg-[var(--rule)]/60 hover:bg-[var(--rule)] transition-all cursor-pointer border border-[var(--rule)]';
const CARD_CLS =
  'p-4 rounded-xl border border-[var(--rule)] bg-[var(--rule)]/20 hover:bg-[var(--rule)]/40 hover:border-cyan-500/40 transition-all group cursor-pointer flex flex-col gap-1.5';

export default function NotFound() {
  const { t } = useTranslation();
  const n = (key: string, params?: Record<string, string | number>) => t(`ui.notFound.${key}`, params);
  const layersLabel = t('ui.metricsPage.navLayers', { n: ALL_LAYER_KEYS.length });

  const shortcuts = [
    { href: '/layers', icon: Layers, iconCls: 'text-cyan-400', title: n('cardLayersTitle', { n: ALL_LAYER_KEYS.length }), body: n('cardLayersBody') },
    { href: '/metrics', icon: BarChart3, iconCls: 'text-cyan-400', title: n('cardMetricsTitle'), body: n('cardMetricsBody') },
    { href: '/sources', icon: Activity, iconCls: 'text-emerald-400', title: n('cardSourcesTitle'), body: n('cardSourcesBody') },
  ];

  return (
    <div className="min-h-screen bg-[var(--ground)] text-[var(--ink)] flex flex-col justify-between selection:bg-cyan-500/30">
      <header className="border-b border-[var(--rule)] bg-[var(--ground)]/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight block text-[var(--ink)]">VOD – Venice Open Data</span>
                <span className="text-[10px] font-mono text-[var(--ink-3)] block -mt-0.5">{n('subtitle')}</span>
              </div>
            </Link>
            <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-semibold">
              /404
            </span>
          </div>

          <nav className="flex items-center gap-2 flex-wrap">
            <Link href="/" className={NAV_CLS}>
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('ui.metricsPage.navMap')}</span>
            </Link>
            <Link href="/layers" className={NAV_CLS}>
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>{layersLabel}</span>
            </Link>
            <Link href="/metrics" className={NAV_CLS}>
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('ui.metricsPage.navMetrics')}</span>
            </Link>
            <Link href="/sources" className={NAV_CLS}>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('ui.metricsPage.navSources')}</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16 flex flex-col items-center justify-center text-center">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-xl shadow-cyan-500/5">
            <MapPinOff className="w-12 h-12 text-cyan-400" />
          </div>
          <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            HTTP 404
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--ink)] mb-3">
          <span className="text-cyan-500">{n('errorPrefix')} </span>
          {n('title')}
        </h1>
        <p className="text-sm sm:text-base text-[var(--ink-2)] max-w-lg mb-8 leading-relaxed">{n('body')}</p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-mono text-sm font-semibold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>{n('ctaMap')}</span>
          </Link>
          <Link
            href="/metrics"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--rule)] hover:bg-[var(--rule)]/80 text-[var(--ink)] border border-[var(--rule)] font-mono text-sm font-medium transition-all cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>{n('ctaMetrics')}</span>
          </Link>
        </div>

        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          {shortcuts.map(({ href, icon: Icon, iconCls, title, body }) => (
            <Link key={href} href={href} className={CARD_CLS}>
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${iconCls} group-hover:scale-110 transition-transform`} />
                <strong className="text-xs font-bold text-[var(--ink)]">{title}</strong>
              </div>
              <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">{body}</p>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t border-[var(--rule)] bg-[var(--ground)] py-6 px-4 text-center text-xs text-[var(--ink-3)] font-mono">
        <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>{t('ui.metricsPage.footer')}</p>
          <div className="flex items-center gap-4 text-[11px] flex-wrap justify-center">
            <Link href="/" className="hover:text-cyan-400 transition-colors">{t('ui.metricsPage.navMap')}</Link>
            <Link href="/layers" className="hover:text-cyan-400 transition-colors">{layersLabel}</Link>
            <Link href="/metrics" className="hover:text-cyan-400 transition-colors">{t('ui.metricsPage.navMetrics')}</Link>
            <Link href="/sources" className="hover:text-cyan-400 transition-colors">{t('ui.metricsPage.navSources')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
