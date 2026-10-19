'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n';
import type { Propulsion, PropulsionReport } from '@/lib/mobilityEmissions';

const COLORS: Record<Propulsion, string> = { electric: '#10b981', fossil: '#f97316', unknown: '#94a3b8' };

/**
 * Corse di oggi del trasporto pubblico per alimentazione, dagli orari ufficiali (/api/emissions). Nessuna stima di
 * CO2: mancano fattori di emissione ufficiali per i mezzi lagunari.
 */
export const MobilityEmissionsMetrics: React.FC<{ data: PropulsionReport | null; badge?: React.ReactNode }> = ({ data, badge }) => {
  const { t, language } = useTranslation();
  const e = (k: string, p?: Record<string, string | number>) => t(`ui.mobilityEmissions.${k}`, p);
  const locale = language === 'it' ? 'it-IT' : 'en-GB';
  const n = (v: number) => v.toLocaleString(locale);
  const pct = (v: number) => (data && data.total ? `${Math.round((v / data.total) * 100)}%` : '–');
  return (
    <div className="flex flex-col gap-4" data-testid="mobility-emissions-metrics">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-[var(--ink-2)] max-w-3xl">{e('intro')}</p>
        {badge}
      </div>
      {!data ? (
        <p className="text-xs text-[var(--ink-3)]">{e('loading')}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {([['total', data.total], ['electric', data.totals.electric], ['fossil', data.totals.fossil], ['unknown', data.totals.unknown]] as const).map(([k, v]) => (
              <div key={k} className="p-4 rounded-2xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-1">
                <span className="text-[10px] uppercase font-mono text-[var(--ink-3)]">{e(`kpi_${k}`)}</span>
                <span className="text-xl font-bold font-mono" style={{ color: k === 'total' ? 'var(--ink)' : COLORS[k] }}>{n(v)}</span>
                {k !== 'total' && <span className="text-[11px] text-[var(--ink-3)]">{pct(v)}</span>}
              </div>
            ))}
          </div>
          <div className="flex h-3 rounded-full overflow-hidden border border-[var(--rule)]" aria-hidden>
            {(['electric', 'fossil', 'unknown'] as const).map((k) => (
              <div key={k} style={{ width: pct(data.totals[k]), background: COLORS[k] }} />
            ))}
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase font-mono text-[var(--ink-3)] text-left">
                <th className="p-2">{e('colMode')}</th>
                <th className="p-2">{e('colPropulsion')}</th>
                <th className="p-2 text-right">{e('colTrips')}</th>
              </tr>
            </thead>
            <tbody>
              {data.modes.map((m) => (
                <tr key={`${m.operator}-${m.mode}`} className="border-t border-[var(--rule)]">
                  <td className="p-2 text-[var(--ink)]">
                    {m.operator} · {e(`mode_${m.mode}`)}
                  </td>
                  <td className="p-2" style={{ color: COLORS[m.propulsion] }}>{e(`prop_${m.propulsion}`)}</td>
                  <td className="p-2 text-right font-mono">{n(m.trips)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">{e('note', { date: new Date(`${data.date}T12:00:00`).toLocaleDateString(locale) })}</p>
        </>
      )}
    </div>
  );
};
