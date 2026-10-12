'use client';

import React from 'react';
import { Volume2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { getFloodedGroundPercentage, getSirenTones } from '@/lib/flood';

const SIREN_STYLES = [
  { quota: '< +110 cm', color: 'border-blue-500/30 bg-blue-500/5 text-blue-400' },
  { quota: '+110 cm', color: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  { quota: '+120 cm', color: 'border-orange-500/30 bg-orange-500/10 text-orange-300' },
  { quota: '+130 cm', color: 'border-rose-500/30 bg-rose-500/10 text-rose-300' },
  { quota: '≥ +140 cm', color: 'border-purple-500/40 bg-purple-500/15 text-purple-300' },
];

/** Scala delle sirene CPSM: i toni dipendono dalla marea prevista, non dal MOSE. */
export const SirensTab: React.FC<{ simulatedCm: number }> = ({ simulatedCm }) => {
  const { t } = useTranslation();
  const activeTones = getSirenTones(simulatedCm);
  const sirenLevels = SIREN_STYLES.map((s, level) => ({
    ...s,
    level,
    tones: level,
    active: activeTones === level,
    title: t(`ui.floodModal.sirenLevel${level}`),
    desc: level === 0 ? t('ui.floodModal.sirenDesc0') : t('ui.floodModal.sirenDescN', { pct: getFloodedGroundPercentage(100 + level * 10) }),
  }));

  return (
    <div className="flex flex-col gap-3">
      <div className="p-3.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] text-xs font-mono">
        <div className="flex items-center gap-2 font-bold text-[var(--ink)] mb-1">
          <Volume2 className="w-4 h-4 text-cyan-400" />
          <span>{t('ui.floodModal.sirenTitle')}</span>
        </div>
        <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
          {t('ui.floodModal.sirenNoticeTime')}
        </p>
      </div>

      {/* Siren Scale */}
      <div className="flex flex-col gap-2">
        {sirenLevels.map((s) => (
          <div
            key={s.level}
            className={`p-3.5 rounded-xl border flex flex-col gap-1.5 transition-all ${
              s.active ? `${s.color} border-2 shadow-sm` : 'bg-[var(--rule)]/15 border-[var(--rule)] opacity-70 text-[var(--ink-2)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs">{s.title}</span>
                <span className="text-[11px] font-mono opacity-80 font-semibold">{s.quota}</span>
              </div>
              {s.active && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 font-bold">
                  {t('ui.floodModal.sirenActiveForTide')}
                </span>
              )}
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              {s.desc}
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              {s.tones === 0 ? (
                <span className="text-[10px] font-mono text-[var(--ink-3)]">{t('ui.floodModal.noTones')}</span>
              ) : (
                Array.from({ length: s.tones }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 rounded-full transition-all ${
                      s.active ? 'bg-current' : 'bg-[var(--rule)]'
                    }`}
                    style={{ width: `${20 + idx * 10}px` }}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
