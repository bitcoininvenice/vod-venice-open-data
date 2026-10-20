'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity, AlertTriangle, Anchor, BarChart3, Bot, Box, Clock, Code2, Construction, Download, Droplets, Layers,
  MapPin, Navigation, Package, Palette, Radio, Route, Search, Share2, ShieldCheck, Ship, Sun, Thermometer, Users, Waves,
  ArrowRight, type LucideIcon,
} from 'lucide-react';
import { SiteFooter, SiteHeader, LAYER_COUNT } from '@/components/site/SiteChrome';
import { useTranslation } from '@/lib/i18n';
import { FEATURE_COUNT, FEATURE_GROUPS, type FeatureIcon } from '@/lib/features';

const ICONS: Record<FeatureIcon, LucideIcon> = {
  route: Route, radio: Radio, navigation: Navigation, anchor: Anchor, palette: Palette, ship: Ship, waves: Waves,
  droplets: Droplets, search: Search, mapPin: MapPin, clock: Clock, layers: Layers, sun: Sun, box: Box,
  thermometer: Thermometer, share: Share2, chart: BarChart3, users: Users, construction: Construction,
  download: Download, activity: Activity, code: Code2, bot: Bot, package: Package, shield: ShieldCheck, alert: AlertTriangle,
};

/** Elenco delle funzionalità di VOD, con un link per provarle sulla mappa. */
export default function FeaturesPage() {
  const { t } = useTranslation();
  const f = (key: string, params?: Record<string, string | number>) => t(`ui.featuresPage.${key}`, params);

  return (
    <div className="min-h-screen bg-[var(--ground)] text-[var(--ink)] flex flex-col">
      <SiteHeader page="features" subtitle={f('subtitle')} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        <section className="flex flex-col gap-2 max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{f('title')}</h1>
          <p className="text-sm text-[var(--ink-2)] leading-relaxed">{f('intro', { n: FEATURE_COUNT, layers: LAYER_COUNT })}</p>
        </section>

        {FEATURE_GROUPS.map((group) => (
          <section key={group.id} className="flex flex-col gap-3" aria-labelledby={`group-${group.id}`}>
            <h2 id={`group-${group.id}`} className="text-base font-bold text-[var(--ink)] border-b border-[var(--rule)] pb-2">
              {f(`group_${group.id}`)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.features.map((feat) => {
                const Icon = ICONS[feat.icon];
                const external = feat.href.startsWith('/api') || feat.href.startsWith('/downloads') || feat.href.endsWith('.txt');
                return (
                  <article
                    key={feat.id}
                    id={feat.id}
                    className="p-4 rounded-2xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-2.5 scroll-mt-24"
                    data-testid={`feature-${feat.id}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                        <Icon className="w-4.5 h-4.5 text-cyan-400" aria-hidden />
                      </span>
                      <h3 className="text-sm font-bold text-[var(--ink)]">{f(`${feat.id}_title`)}</h3>
                    </div>
                    <p className="text-xs text-[var(--ink-2)] leading-relaxed flex-1">{f(`${feat.id}_desc`)}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      {external ? (
                        <a href={feat.href} className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:underline">
                          {f('open')} <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                        </a>
                      ) : (
                        <Link href={feat.href} className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:underline">
                          {feat.href.startsWith('/?') || feat.href === '/' ? f('try') : f('open')} <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                        </Link>
                      )}
                      {feat.more && (
                        <Link href={feat.more} className="text-[11px] text-[var(--ink-3)] hover:text-cyan-400">
                          {f('more')}
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  );
}
