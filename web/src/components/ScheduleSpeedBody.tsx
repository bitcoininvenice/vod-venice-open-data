'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { KeyValues } from '@/components/ui/InfoPanel';
import { GEOMETRY_MARGIN, ROUNDING_S, SPEED_VERDICT_COLORS, type ScheduleSpeedSegment } from '@/lib/scheduleSpeed';
import { COMUNE_REGULATION_URL, ORDINANCE_93_2007_URL } from '@/lib/waterSpeedLimits';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

/** Scheda di un tratto di linea: tempo dell'orario contro tempo minimo rispettando i limiti noti. */
export const ScheduleSpeedBody: React.FC<{ segment: ScheduleSpeedSegment }> = ({ segment: s }) => {
  const { t } = useTranslation();
  const v = (key: string, params?: Record<string, string | number>) => t(`ui.scheduleSpeed.${key}`, params);
  const color = SPEED_VERDICT_COLORS[s.verdict](true);
  return (
    <div className="flex flex-col gap-3" data-testid="schedule-speed-card">
      <div className="p-3 rounded-xl border text-xs font-semibold" style={{ borderColor: `${color}66`, background: `${color}14`, color }}>
        {v(`verdict_${s.verdict}`)}
      </div>
      <KeyValues
        items={[
          [v('length'), `${s.lengthM} m`],
          [v('scheduled'), `${mmss(s.scheduledS)} min`],
          [v('legalMin'), s.verdict === 'partial' ? null : `${mmss(s.legalMinS)} min`],
          [v('required'), `${s.requiredKmh} km/h`],
          [v('minLimit'), s.minLimitKmh !== null ? `${s.minLimitKmh} km/h` : null],
          [v('limitedShare'), `${Math.round((s.limitedM / s.lengthM) * 100)}%`],
          [v('trips'), s.tripsTooFast > 0 ? v('tripsTooFast', { n: s.trips, k: s.tripsTooFast }) : String(s.trips)],
        ]}
      />
      <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">{v('method', { s: ROUNDING_S, pct: GEOMETRY_MARGIN * 100 })}</p>
      <p className="text-[11px] text-[var(--ink-3)] border-t border-[var(--rule)] pt-2 leading-relaxed">
        {v('note')}{' '}
        <a href={COMUNE_REGULATION_URL} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">{v('regulation')}</a>
        {' · '}
        <a href={ORDINANCE_93_2007_URL} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">{v('ordinance93')}</a>
      </p>
    </div>
  );
};
