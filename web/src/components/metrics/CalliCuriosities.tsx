'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import curiosita from '@/data/calli-curiosita.json';

interface Place {
  name: string;
  lat: number;
  lon: number;
  osmId: number;
  meters?: number;
  widthM?: number;
}

const OSM_WAY = 'https://www.openstreetmap.org/way/';

/** «Come arrivare» con il luogo come arrivo e il link alla via su OpenStreetMap, per verificarla */
const PlaceLinks: React.FC<{ p: Place }> = ({ p }) => {
  const { t } = useTranslation();
  const plan = `/?${new URLSearchParams({ open: 'planner', a: `${p.lat},${p.lon}`, aNome: p.name }).toString()}`;
  return (
    <span className="flex gap-2 text-[10px] font-mono shrink-0">
      <Link href={plan} className="text-emerald-400 hover:underline">{t('ui.calli.planHere')}</Link>
      <a href={`${OSM_WAY}${p.osmId}`} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">OSM</a>
    </span>
  );
};

const Ranking: React.FC<{ title: string; items: Place[]; value: (p: Place) => string; testId: string }> = ({ title, items, value, testId }) => (
  <div className="p-4 rounded-2xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-2" data-testid={testId}>
    <h3 className="text-xs font-bold uppercase font-mono text-[var(--ink-3)]">{title}</h3>
    <ol className="flex flex-col gap-1.5">
      {items.map((p, i) => (
        <li key={`${p.osmId}-${i}`} className="flex items-baseline justify-between gap-2 text-xs">
          <span className="min-w-0">
            <span className="font-mono text-[var(--ink-3)] mr-1.5">{i + 1}.</span>
            <span className="text-[var(--ink)]">{p.name}</span>
            <span className="font-mono text-[var(--ink-2)] ml-1.5">{value(p)}</span>
          </span>
          <PlaceLinks p={p} />
        </li>
      ))}
    </ol>
  </div>
);

/**
 * Curiosità sulle calli del centro storico calcolate da OpenStreetMap (pipeline/import_osm_curiosita.py):
 * calli più strette fra quelle misurate, calli e fondamenta più lunghe, ponti e distanza fra un ponte e l'altro.
 */
export const CalliCuriosities: React.FC = () => {
  const { t, language } = useTranslation();
  const c = (key: string, params?: Record<string, string | number>) => t(`ui.calli.${key}`, params);
  const locale = language === 'it' ? 'it-IT' : 'en-GB';
  const m = (v?: number) => `${(v ?? 0).toLocaleString(locale)} m`;
  const cm = (v?: number) => `${Math.round((v ?? 0) * 100)} cm`;
  const g = curiosita.bridgeGap;
  const date = new Date(curiosita.generatedAt).toLocaleDateString(locale);

  const kpis: Array<[string, string, string]> = [
    [c('kpiBridges'), curiosita.counts.bridges.toLocaleString(locale), c('kpiBridgesNote')],
    [c('kpiGap'), m(g.medianM), c('kpiGapNote', { mean: m(g.meanM) })],
    [c('kpiFarthest'), m(g.farthest.meters), c('kpiFarthestNote', { name: g.farthest.name })],
    [c('kpiSotoporteghi'), curiosita.counts.sotoporteghi.toLocaleString(locale), c('kpiSotoporteghiNote')],
  ];

  return (
    <div className="flex flex-col gap-4" data-testid="calli-curiosities">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(([label, value, note]) => (
          <div key={label} className="p-4 rounded-2xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-1">
            <span className="text-[10px] uppercase font-mono text-[var(--ink-3)]">{label}</span>
            <span className="text-xl font-bold font-mono text-[var(--ink)]">{value}</span>
            <span className="text-[11px] text-[var(--ink-3)] leading-snug">{note}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Ranking title={c('narrowestTitle', { n: curiosita.counts.withWidth })} items={curiosita.narrowest} value={(p) => cm(p.widthM)} testId="calli-narrowest" />
        <Ranking title={c('longestCalliTitle')} items={curiosita.longestCalli} value={(p) => m(p.meters)} testId="calli-longest" />
        <Ranking title={c('longestFondamenteTitle')} items={curiosita.longestFondamente} value={(p) => m(p.meters)} testId="calli-fondamente" />
        <Ranking title={c('longestBridgesTitle')} items={curiosita.longestBridges} value={(p) => m(p.meters)} testId="calli-bridges" />
      </div>
      <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
        {c('note', { area: curiosita.area, date, closest: g.closest.name, closestM: m(g.closest.meters) })}{' '}
        <a href={curiosita.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">{curiosita.attribution}</a>
      </p>
    </div>
  );
};
