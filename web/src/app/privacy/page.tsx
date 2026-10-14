'use client';

import React from 'react';
import { SiteFooter, SiteHeader } from '@/components/site/SiteChrome';
import { useTranslation } from '@/lib/i18n';

/** Contatto per le richieste sulla privacy e dei titolari dei dati: messaggio diretto all'account Instagram del progetto. */
const INSTAGRAM_HANDLE = 'veniceopendata';
const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

const SECTIONS = ['noCookies', 'analytics', 'hosting', 'browser', 'sources', 'rights', 'nonCommercial', 'licenses', 'disclaimer', 'takedown'] as const;

/** Informativa privacy: cosa raccoglie VOD (poco) e chi lo tratta. */
export default function PrivacyPage() {
  const { t } = useTranslation();
  const p = (key: string, params?: Record<string, string | number>) => t(`ui.privacyPage.${key}`, params);

  return (
    <div className="min-h-screen bg-[var(--ground)] text-[var(--ink)] flex flex-col">
      <SiteHeader page="privacy" subtitle={p('subtitle')} />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <section className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{p('title')}</h1>
          <p className="text-sm text-[var(--ink-2)] leading-relaxed">{p('intro')}</p>
        </section>

        {SECTIONS.map((id) => (
          <section key={id} className="flex flex-col gap-2" aria-labelledby={`privacy-${id}`}>
            <h2 id={`privacy-${id}`} className="text-base font-bold border-b border-[var(--rule)] pb-2">{p(`${id}Title`)}</h2>
            <p className="text-sm text-[var(--ink-2)] leading-relaxed">{p(`${id}Body`)}</p>
          </section>
        ))}

        <section className="flex flex-col gap-2" aria-labelledby="privacy-contact">
          <h2 id="privacy-contact" className="text-base font-bold border-b border-[var(--rule)] pb-2">{p('contactTitle')}</h2>
          <p className="text-sm text-[var(--ink-2)] leading-relaxed" data-testid="privacy-contact">
            {p('contactBody')}{' '}
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
              @{INSTAGRAM_HANDLE}
            </a>
            {p('contactInstagram')}
          </p>
          <p className="text-xs text-[var(--ink-3)] font-mono">{p('updated', { date: '14/10/2026' })}</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
