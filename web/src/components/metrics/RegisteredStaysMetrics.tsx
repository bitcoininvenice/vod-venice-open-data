'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { BUSINESS_STAY_KINDS, PRIVATE_STAY_KINDS, staysTotals, type RegisteredStaysData, type StayKind } from '@/lib/registeredStays';
import { AIRBNB_DATA } from '@/lib/airbnb';
import { BDSR_DATA } from '@/lib/bdsrCin';

const KINDS: StayKind[] = [...BUSINESS_STAY_KINDS, ...PRIVATE_STAY_KINDS];

/**
 * Strutture ricettive registrate al Comune (GeoIDS) per municipalità e zona dell'imposta di soggiorno, con i posti
 * letto, e il confronto con il registro del Ministero (BDSR) e gli annunci di Inside Airbnb. Solo totali: nessun
 * confronto annuncio per annuncio.
 */
export const RegisteredStaysMetrics: React.FC<{ badge?: React.ReactNode }> = ({ badge }) => {
  const { t, language } = useTranslation();
  const r = (k: string, p?: Record<string, string | number>) => t(`ui.registeredStays.${k}`, p);
  const locale = language === 'it' ? 'it-IT' : 'en-GB';
  const n = (v: number) => v.toLocaleString(locale);
  const [data, setData] = useState<RegisteredStaysData | null>(null);
  useEffect(() => {
    let alive = true;
    fetch('/api/strutture-registrate')
      .then((res) => (res.ok ? res.json() : null))
      .then((j) => alive && j?.success && setData(j.data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  if (!data) return <p className="text-xs text-[var(--ink-3)]" data-testid="registered-stays-metrics">{r('loading')}</p>;
  const tot = staysTotals(data);
  const comparison: [string, number][] = [
    [r('cmpGeoids'), data.total],
    [r('cmpBdsr'), BDSR_DATA.veneziaMunicipality.totalStructures],
    [r('cmpAirbnb'), AIRBNB_DATA.totalListings],
  ];
  return (
    <div className="flex flex-col gap-4" data-testid="registered-stays-metrics">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-[var(--ink-2)] max-w-3xl">{r('intro')}</p>
        {badge}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([
          [r('kpiBusinesses'), tot.businesses, r('kpiBeds', { beds: n(tot.businessBeds) })],
          [r('kpiPrivate'), tot.privateStays, r('kpiBeds', { beds: n(tot.privateBeds) })],
          [r('kpiTotal'), data.total, r('kpiBeds', { beds: n(tot.businessBeds + tot.privateBeds) })],
          [r('kpiDate'), data.extractedAt.split('-').reverse().join('/'), r('kpiDateNote')],
        ] as [string, number | string, string][]).map(([label, value, note]) => (
          <div key={label} className="p-4 rounded-2xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-1">
            <span className="text-[10px] uppercase font-mono text-[var(--ink-3)]">{label}</span>
            <span className="text-xl font-bold font-mono text-[var(--ink)]">{typeof value === 'number' ? n(value) : value}</span>
            <span className="text-[11px] text-[var(--ink-3)]">{note}</span>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[640px]">
          <thead>
            <tr className="text-[10px] uppercase font-mono text-[var(--ink-3)] text-left">
              <th className="p-2">{r('colZone')}</th>
              {KINDS.map((k) => (
                <th key={k} className="p-2 text-right">{t(`ui.stays.kind_${k}`).split(' (')[0]}</th>
              ))}
              <th className="p-2 text-right">{r('colBeds')}</th>
            </tr>
          </thead>
          <tbody>
            {data.zones.map((z) => (
              <tr key={`${z.municipality}-${z.taxZone}`} className="border-t border-[var(--rule)]">
                <td className="p-2 text-[var(--ink)]">
                  {z.municipality}
                  <span className="block text-[10px] text-[var(--ink-3)]">{r('taxZone', { zone: (z.taxZone ?? '–').toLowerCase(), pct: z.taxReductionPct })}</span>
                </td>
                {KINDS.map((k) => (
                  <td key={k} className="p-2 text-right font-mono">{n(z.byKind[k] ?? 0)}</td>
                ))}
                <td className="p-2 text-right font-mono">{n(KINDS.reduce((a, k) => a + (z.beds[k] ?? 0), 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] uppercase font-mono text-[var(--ink-3)]">{r('cmpTitle')}</span>
        {comparison.map(([label, v]) => (
          <div key={label} className="flex items-center justify-between text-xs border-t border-[var(--rule)] pt-1">
            <span className="text-[var(--ink-2)]">{label}</span>
            <span className="font-mono text-[var(--ink)]">{n(v)}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">{r('note')}</p>
    </div>
  );
};
