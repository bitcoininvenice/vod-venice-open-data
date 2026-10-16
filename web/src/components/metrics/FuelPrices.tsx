'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { FUEL_KINDS, FUEL_ZONES, formatFuelPrice, fuelRankColor, type FuelExtreme, type FuelKind, type FuelSummary } from '@/lib/fuel';
import { PROVIDERS } from '@/lib/provenance/providers';

interface Payload {
  summary: Record<FuelKind, FuelSummary>;
  meta: { extractedAt: string | null };
}

/** Litri di un pieno per la differenza fra il distributore più caro e il più economico */
const TANK_LITRES = 40;

/**
 * Prezzi dei carburanti per zona (centro storico e isole, Lido e Pellestrina, terraferma, Chioggia, altri comuni):
 * stesse regole dei colori della mappa, dal dataset aperto del MIMIT.
 */
export const FuelPrices: React.FC = () => {
  const { t, language } = useTranslation();
  const f = (key: string, params?: Record<string, string | number>) => t(`ui.fuel.${key}`, params);
  const locale = language === 'it' ? 'it-IT' : 'en-GB';
  const [payload, setPayload] = useState<Payload | null>(null);
  const [failed, setFailed] = useState(false);
  const [kind, setKind] = useState<FuelKind>('benzina');

  useEffect(() => {
    fetch('/api/carburanti')
      .then((r) => r.json())
      .then((j) => (j.success && j.summary ? setPayload(j as Payload) : setFailed(true)))
      .catch(() => setFailed(true));
  }, []);

  if (failed) return <p className="text-xs text-[var(--ink-3)]">{f('metricsUnavailable')}</p>;
  if (!payload) return <div className="h-40 rounded-2xl bg-[var(--rule)]/20 animate-pulse" aria-busy="true" />;

  const s = payload.summary[kind];
  const eur = (v: number | null) => (v === null ? '–' : `${formatFuelPrice(v, locale)} €`);
  const signed = (v: number | null) => (v === null ? '–' : `${v > 0 ? '+' : ''}${formatFuelPrice(v, locale)} €`);
  const where = (x: FuelExtreme | null) => (x ? `${x.station.brand} · ${x.station.address}, ${x.station.comune}` : '');
  const spread = s.all.min && s.all.max ? s.all.max.price - s.all.min.price : null;
  const date = payload.meta.extractedAt ? new Date(`${payload.meta.extractedAt}T12:00:00`).toLocaleDateString(locale) : null;

  const kpis: Array<[string, string, string, string?]> = [
    [f('kpiCheapest'), eur(s.all.min?.price ?? null), where(s.all.min), fuelRankColor(0)],
    [f('kpiExpensive'), eur(s.all.max?.price ?? null), where(s.all.max), fuelRankColor(1)],
    [f('kpiMedian'), eur(s.all.median), f('kpiMedianNote', { n: s.all.count, total: s.all.total })],
    [
      f('kpiSpread'),
      eur(spread),
      spread !== null && kind !== 'metano' ? f('kpiSpreadNote', { litres: TANK_LITRES, eur: `${(spread * TANK_LITRES).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` }) : '',
    ],
  ];

  return (
    <div className="flex flex-col gap-4" data-testid="fuel-prices-metrics">
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('ui.layerPanel.fuelFilter')}>
        {FUEL_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            aria-pressed={kind === k}
            className={`px-2.5 py-1 rounded-full border text-[11px] font-mono cursor-pointer ${kind === k ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200' : 'border-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)]'}`}
          >
            {f(`kind_${k}`)}
          </button>
        ))}
        {date && <span className="ml-auto text-[11px] font-mono text-[var(--ink-3)]">{f('extracted', { date })}</span>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(([label, value, note, color]) => (
          <div key={label} className="p-4 rounded-2xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-1">
            <span className="text-[10px] uppercase font-mono text-[var(--ink-3)]">{label}</span>
            <span className="text-xl font-bold font-mono" style={{ color: color ?? 'var(--ink)' }}>{value}</span>
            <span className="text-[11px] text-[var(--ink-3)] leading-snug">{note}</span>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-2xl bg-[var(--rule)]/20 border border-[var(--rule)] overflow-x-auto">
        <table className="w-full text-xs min-w-[520px]" data-testid="fuel-zones">
          <thead>
            <tr className="text-[10px] font-mono uppercase text-[var(--ink-3)] text-left">
              <th className="font-normal pb-2">{f('zone')}</th>
              <th className="font-normal pb-2 text-right">{f('stations')}</th>
              <th className="font-normal pb-2 text-right">{f('min')}</th>
              <th className="font-normal pb-2 text-right">{f('mean')}</th>
              <th className="font-normal pb-2 text-right">{f('median')}</th>
              <th className="font-normal pb-2 text-right">{f('max')}</th>
            </tr>
          </thead>
          <tbody>
            {FUEL_ZONES.map((z) => {
              const zs = s.byZone[z];
              return (
                <tr key={z} className="border-t border-[var(--rule)] text-[var(--ink-2)]">
                  <td className="py-1.5 text-[var(--ink)]">{f(`zone_${z}`)}</td>
                  <td className="py-1.5 text-right font-mono tabular">{f('countOfTotal', { n: zs.count, total: zs.total })}</td>
                  <td className="py-1.5 text-right font-mono tabular" title={where(zs.min)}>{eur(zs.min?.price ?? null)}</td>
                  <td className="py-1.5 text-right font-mono tabular">{eur(zs.mean)}</td>
                  <td className="py-1.5 text-right font-mono tabular">{eur(zs.median)}</td>
                  <td className="py-1.5 text-right font-mono tabular" title={where(zs.max)}>{eur(zs.max?.price ?? null)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {s.all.withoutPrices > 0 && (
        <p className="text-[11px] text-[var(--ink-2)]" data-testid="fuel-without-prices">
          {f('withoutPrices', {
            n: s.all.withoutPrices,
            zones: FUEL_ZONES.filter((z) => s.byZone[z].withoutPrices > 0)
              .map((z) => `${f(`zone_${z}`)} ${s.byZone[z].withoutPrices}`)
              .join(', '),
          })}
        </p>
      )}
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-[var(--ink-2)]">
        <li className="p-3 rounded-xl border border-[var(--rule)]">
          <span className="block font-mono text-[var(--ink)]">{signed(s.attendedPremium)}</span>
          {f('attendedPremium')}
        </li>
        <li className="p-3 rounded-xl border border-[var(--rule)]">
          <span className="block font-mono text-[var(--ink)]">{signed(s.highwayPremium)}</span>
          {f('highwayPremium')}
        </li>
        <li className="p-3 rounded-xl border border-[var(--rule)]">
          <span className="block font-mono text-[var(--ink)]">{s.stale}</span>
          {f('staleCount', { days: 7 })}
        </li>
      </ul>

      <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">{f('metricsNote')}</p>
      <div className="flex flex-wrap gap-4 text-[11px] font-mono">
        <Link href="/?layers=carburanti" className="text-cyan-400 hover:underline">{f('openMap')}</Link>
        <a href={PROVIDERS.mimitFuel.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-1">
          {f('source')} <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
