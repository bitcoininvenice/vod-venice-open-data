'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, MapPinOff, Layers, BarChart3, Activity } from 'lucide-react';
import { LAYER_COUNT, SiteFooter, SiteHeader } from '@/components/site/SiteChrome';
import { useTranslation } from '@/lib/i18n';

const CARD_CLS =
  'p-4 rounded-xl border border-[var(--rule)] bg-[var(--rule)]/20 hover:bg-[var(--rule)]/40 hover:border-cyan-500/40 transition-all group cursor-pointer flex flex-col gap-1.5';

export default function NotFound() {
  const { t } = useTranslation();
  const n = (key: string, params?: Record<string, string | number>) => t(`ui.notFound.${key}`, params);

  const shortcuts = [
    { href: '/layers', icon: Layers, iconCls: 'text-cyan-400', title: n('cardLayersTitle', { n: LAYER_COUNT }), body: n('cardLayersBody') },
    { href: '/metrics', icon: BarChart3, iconCls: 'text-cyan-400', title: n('cardMetricsTitle'), body: n('cardMetricsBody') },
    { href: '/sources', icon: Activity, iconCls: 'text-emerald-400', title: n('cardSourcesTitle'), body: n('cardSourcesBody') },
  ];

  return (
    <div className="min-h-screen bg-[var(--ground)] text-[var(--ink)] flex flex-col justify-between selection:bg-cyan-500/30">
      <SiteHeader page="notFound" subtitle={n('subtitle')} />

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

      <SiteFooter />
    </div>
  );
}
