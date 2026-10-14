'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { useServiceNow } from '@/lib/useServiceNow';
import { lineColor, lineTextColor } from '@/lib/actvLines';
import { SPEED_VERDICT_COLORS, type ScheduleSpeedSegment, type SpeedVerdict } from '@/lib/scheduleSpeed';
import { DELAY_COLORS, delayStatus } from '@/lib/realtimeDelay';

const signedMin = (s: number) => {
  const m = Math.round(s / 60);
  return m === 0 ? '0' : m > 0 ? `+${m}` : `−${Math.abs(m)}`;
};

const LineChip: React.FC<{ line: string; category: string | null }> = ({ line, category }) => {
  const bg = lineColor(line, category);
  return (
    <span
      className="px-1.5 py-0.5 rounded-md font-mono font-bold text-[11px] min-w-[2.4rem] inline-block text-center border border-black/15"
      style={bg ? { background: bg, color: lineTextColor(line, bg) } : undefined}
    >
      {line}
    </span>
  );
};

/** Servizio ACTV in questo momento, linea per linea (nessuno storico). */
export const ServiceNowTable: React.FC = () => {
  const { t } = useTranslation();
  const s = (key: string, params?: Record<string, string | number>) => t(`ui.serviceNow.${key}`, params);
  const data = useServiceNow(true);
  const [network, setNetwork] = useState<'navigazione' | 'automobilistico'>('navigazione');
  if (data === null) return <div className="h-24 rounded-xl bg-[var(--rule)]/30 animate-pulse" aria-busy="true" />;
  const lines = data.filter((l) => l.network === network);
  const bunched = lines.reduce((n, l) => n + l.bunched.length, 0);
  return (
    <div className="flex flex-col gap-3" data-testid="service-now">
      <div className="flex flex-wrap items-center gap-2">
        {(['navigazione', 'automobilistico'] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setNetwork(n)}
            aria-pressed={network === n}
            className={`px-2.5 py-1 rounded-lg text-[11px] border cursor-pointer ${network === n ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200 font-semibold' : 'border-[var(--rule)] text-[var(--ink-2)]'}`}
          >
            {s(`network_${n}`)}
          </button>
        ))}
        <span className="text-[11px] text-[var(--ink-3)]">{s('bunchedTotal', { n: bunched })}</span>
      </div>
      {lines.length === 0 ? (
        <p className="text-xs text-[var(--ink-3)]">{s('empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] font-mono uppercase text-[var(--ink-3)] border-b border-[var(--rule)]">
                <th className="py-1.5 pr-2">{s('colLine')}</th>
                <th className="py-1.5 pr-2">{s('colGps')}</th>
                <th className="py-1.5 pr-2">{s('colWithoutGps')}</th>
                <th className="py-1.5 pr-2">{s('colAvg')}</th>
                <th className="py-1.5 pr-2">{s('colMax')}</th>
                <th className="py-1.5 pr-2">{s('colOnTime')}</th>
                <th className="py-1.5">{s('colBunched')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rule)]">
              {lines.map((l) => (
                <tr key={l.line}>
                  <td className="py-1.5 pr-2"><LineChip line={l.line} category={l.category} /></td>
                  <td className="py-1.5 pr-2 font-mono">{l.scheduled !== null ? `${l.gps} / ${l.scheduled}` : l.gps}</td>
                  <td className="py-1.5 pr-2 font-mono text-[var(--ink-2)]">{l.withoutGps ?? '—'}</td>
                  <td className="py-1.5 pr-2 font-mono" style={l.avgDelayS !== null ? { color: DELAY_COLORS[delayStatus(l.avgDelayS)] } : undefined}>
                    {l.avgDelayS !== null ? `${signedMin(l.avgDelayS)} min` : '—'}
                  </td>
                  <td className="py-1.5 pr-2 font-mono">{l.maxDelayS !== null ? `${signedMin(l.maxDelayS)} min` : '—'}</td>
                  <td className="py-1.5 pr-2 font-mono">{l.onTimeShare !== null ? `${Math.round(l.onTimeShare * 100)}%` : '—'}</td>
                  <td className={`py-1.5 font-mono ${l.bunched.length ? 'text-amber-400 font-bold' : 'text-[var(--ink-3)]'}`}>{l.bunched.length || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[10px] text-[var(--ink-3)] leading-relaxed">{s('tableNote')}</p>
    </div>
  );
};

const VERDICTS: SpeedVerdict[] = ['tooFast', 'tight', 'ok', 'partial'];

/** Tratti delle linee in cui l'orario richiede una velocità vicina o superiore ai limiti. */
export const ScheduleSpeedTable: React.FC = () => {
  const { t } = useTranslation();
  const v = (key: string, params?: Record<string, string | number>) => t(`ui.scheduleSpeed.${key}`, params);
  const [data, setData] = useState<{ segments: ScheduleSpeedSegment[]; summary: Record<SpeedVerdict, number> } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    fetch('/api/velocita-orario')
      .then((r) => r.json())
      .then((j) => (j.success ? setData({ segments: j.data, summary: j.summary }) : setFailed(true)))
      .catch(() => setFailed(true));
  }, []);
  if (failed) return <p className="text-xs text-[var(--ink-3)]">{v('unavailable')}</p>;
  if (!data) return <div className="h-24 rounded-xl bg-[var(--rule)]/30 animate-pulse" aria-busy="true" />;
  const critical = data.segments
    .filter((s) => s.verdict === 'tooFast' || s.verdict === 'tight')
    .sort((a, b) => b.legalMinS / b.scheduledS - a.legalMinS / a.scheduledS);
  return (
    <div className="flex flex-col gap-3" data-testid="schedule-speed">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {VERDICTS.map((k) => (
          <div key={k} className="p-2.5 rounded-xl border border-[var(--rule)] bg-[var(--ground)]/80 flex flex-col">
            <span className="text-[10px] font-mono uppercase text-[var(--ink-3)]">{v(`short_${k}`)}</span>
            <strong className="text-xl font-mono" style={{ color: SPEED_VERDICT_COLORS[k](true) }}>{data.summary[k]}</strong>
          </div>
        ))}
      </div>
      {critical.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] font-mono uppercase text-[var(--ink-3)] border-b border-[var(--rule)]">
                <th className="py-1.5 pr-2">{v('colLine')}</th>
                <th className="py-1.5 pr-2">{v('colStretch')}</th>
                <th className="py-1.5 pr-2">{v('scheduled')}</th>
                <th className="py-1.5 pr-2">{v('legalMin')}</th>
                <th className="py-1.5 pr-2">{v('required')}</th>
                <th className="py-1.5">{v('minLimit')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rule)]">
              {critical.map((s) => (
                <tr key={s.id}>
                  <td className="py-1.5 pr-2"><LineChip line={s.line} category={s.category} /></td>
                  <td className="py-1.5 pr-2">
                    {s.from} → {s.to}
                    <span className="block text-[10px]" style={{ color: SPEED_VERDICT_COLORS[s.verdict](true) }}>{v(`short_${s.verdict}`)}</span>
                  </td>
                  <td className="py-1.5 pr-2 font-mono">{Math.round(s.scheduledS / 60)} min</td>
                  <td className="py-1.5 pr-2 font-mono">{(s.legalMinS / 60).toFixed(1)} min</td>
                  <td className="py-1.5 pr-2 font-mono">{s.requiredKmh} km/h</td>
                  <td className="py-1.5 font-mono">{s.minLimitKmh ?? '—'} km/h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[10px] text-[var(--ink-3)] leading-relaxed">{v('tableNote')}</p>
      <Link href="/?layers=velocita_orario" className="text-[11px] text-cyan-400 hover:underline self-start">{v('openMap')}</Link>
    </div>
  );
};
