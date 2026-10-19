'use client';

import React, { useMemo, useState } from 'react';
import { HeartPulse } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { calculateAltimetricAccessibility } from '@/lib/accessibilityAltimetry';

const TIDE_LEVELS = [80, 90, 100, 110, 120, 130, 140];

/**
 * Farmacie del centro storico e acqua alta: suolo allagato dalla curva CPSM, residenti over 65 dal Censimento
 * ISTAT, farmacie (OpenStreetMap) con la quota del suolo stimata sopra o sotto la marea scelta.
 */
export const AccessibilityAltimetricMetrics: React.FC<{ badge?: React.ReactNode }> = ({ badge }) => {
  const { t, language } = useTranslation();
  const m = (key: string, params?: Record<string, string | number>) => t(`ui.altimetricAccessibility.${key}`, params);
  const locale = language === 'it' ? 'it-IT' : 'en-GB';
  const [tideCm, setTideCm] = useState(110);
  const s = useMemo(() => calculateAltimetricAccessibility(tideCm), [tideCm]);
  const n = (v: number) => v.toLocaleString(locale);
  return (
    <div className="p-5 rounded-2xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-4" data-testid="altimetric-accessibility-metrics">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[var(--ink)] flex items-center gap-2 flex-wrap">
            <HeartPulse className="w-4 h-4 text-rose-400" />
            <span>{m('title')}</span>
            {badge}
          </h3>
          <p className="text-xs text-[var(--ink-3)] mt-0.5 leading-relaxed">{m('subtitle')}</p>
        </div>
        <div className="flex items-center gap-1 flex-wrap" role="group" aria-label={m('tideSelector')}>
          {TIDE_LEVELS.map((cm) => (
            <button
              key={cm}
              type="button"
              onClick={() => setTideCm(cm)}
              aria-pressed={tideCm === cm}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono cursor-pointer ${tideCm === cm ? 'bg-cyan-500 text-white font-bold' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'}`}
            >
              +{cm}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/25">
          <span className="text-[11px] font-mono text-cyan-400 uppercase">{m('kpiFloodedGround')}</span>
          <p className="text-2xl font-mono font-bold text-cyan-300">{s.cityFloodedPercent}%</p>
          <p className="text-[11px] text-[var(--ink-3)]">{m('kpiFloodedGroundNote')}</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
          <span className="text-[11px] font-mono text-emerald-400 uppercase">{m('kpiPharmaciesDry')}</span>
          <p className="text-2xl font-mono font-bold text-emerald-300">
            {s.pharmaciesDry}/{s.pharmacies}
          </p>
          <p className="text-[11px] text-[var(--ink-3)]">{m('kpiPharmaciesDryNote')}</p>
        </div>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[10px] uppercase font-mono text-[var(--ink-3)] text-left">
            <th className="p-2">{m('colSestiere')}</th>
            <th className="p-2 text-right">{m('colPopulation')}</th>
            <th className="p-2 text-right">{m('colOver65')}</th>
            <th className="p-2 text-right">{m('colPharmacies')}</th>
          </tr>
        </thead>
        <tbody>
          {s.sestieri.map((d) => (
            <tr key={d.sestiere} className="border-t border-[var(--rule)]">
              <td className="p-2 text-[var(--ink)]">{d.sestiere}</td>
              <td className="p-2 text-right font-mono">{n(d.population)}</td>
              <td className="p-2 text-right font-mono">
                {n(d.over65)} ({d.pctOver65}%)
              </td>
              <td className="p-2 text-right font-mono">
                {d.pharmaciesDry}/{d.pharmacies}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">{m('note')}</p>
    </div>
  );
};
