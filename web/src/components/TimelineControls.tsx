'use client';

import React, { useState } from 'react';
import { Play, Pause, Calendar, Clock, Waves, ChevronDown, ChevronUp } from 'lucide-react';
import { DayType } from '@/lib/types';
import { formatTime } from '@/lib/solar';
import { useTranslation } from '@/lib/i18n';

interface TimelineControlsProps {
  currentTimeSeconds: number;
  onTimeChange: (seconds: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  selectedDay: DayType;
  onDayChange: (day: DayType) => void;
  totalActiveVehicles: number;
  peakCount: number;
  peakTime: string;
  onSyncLiveTime?: () => void;
  isLiveSynced?: boolean;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  currentTimeSeconds,
  onTimeChange,
  isPlaying,
  onTogglePlay,
  speed,
  onSpeedChange,
  selectedDay,
  onDayChange,
  totalActiveVehicles,
  peakCount,
  peakTime,
  onSyncLiveTime,
  isLiveSynced
}) => {
  const { language, t } = useTranslation();
  const [isExpandedMobile, setIsExpandedMobile] = useState<boolean>(false);
  const sliderValue = Math.floor(currentTimeSeconds / 60);

  const dayLabels: Record<DayType, string> = {
    weekday: t('timeline.weekday'),
    saturday: t('timeline.saturday'),
    sunday: t('timeline.sunday')
  };

  const speedOptions = [
    { val: 1, label: language === 'it' ? '1× Reale' : '1× Real' },
    { val: 5, label: language === 'it' ? '5× Naturale' : '5× Natural' },
    { val: 20, label: language === 'it' ? '20× Fluido' : '20× Smooth' },
    { val: 180, label: '180×' },
    { val: 720, label: '720×' },
  ];

  return (
    <div className="w-full glass-panel rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-col gap-2.5 sm:gap-3 transition-all duration-200">
      {/* Top row: Clock, Live button, Play/Pause, and mobile expand trigger */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--rule)] pb-2 sm:pb-3">
        {/* Clock & ORA LIVE */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 shrink-0" />
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight tabular text-[var(--ink)]">
              {formatTime(currentTimeSeconds)}
            </span>
          </div>

          {onSyncLiveTime && (
            <button
              type="button"
              onClick={onSyncLiveTime}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-all cursor-pointer ${
                isLiveSynced
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-sm'
                  : 'bg-[var(--rule)]/60 text-[var(--ink-2)] border-[var(--rule)] hover:text-[var(--ink)]'
              }`}
              title={language === 'it' ? 'Aggancia all\'orario esatto attuale di Venezia' : 'Lock to exact current Venice time'}
            >
              <span className={`w-2 h-2 rounded-full ${isLiveSynced ? 'bg-rose-500 animate-ping' : 'bg-[var(--ink-3)]'}`} />
              <span className="text-[11px] sm:text-xs">{t('timeline.liveNow')}</span>
            </button>
          )}

          <div className="h-5 w-px bg-[var(--rule)] hidden md:block" />
          <div className="hidden md:flex items-center gap-2">
            <Waves className="w-4 h-4 text-emerald-400" />
            <div className="text-xs">
              <span className="font-mono font-bold text-sm sm:text-base text-[var(--ink)] tabular">
                {totalActiveVehicles}
              </span>{' '}
              <span className="text-[var(--ink-2)]">{language === 'it' ? 'mezzi attivi' : 'active vessels'}</span>
            </div>
          </div>
        </div>

        {/* Right tools: Play/Pause button + Mobile expander */}
        <div className="flex items-center gap-2">
          {/* Quick Play/Pause on mobile top bar */}
          <button
            type="button"
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-400'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'it' ? 'Pausa' : 'Pause'}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">{language === 'it' ? 'Avvia' : 'Play'}</span>
              </>
            )}
          </button>

          {/* Mobile expand button */}
          <button
            type="button"
            onClick={() => setIsExpandedMobile((p) => !p)}
            className="flex md:hidden items-center gap-1 px-2 py-1.5 rounded-xl bg-[var(--rule)]/70 text-[var(--ink-2)] hover:text-[var(--ink)] border border-[var(--rule)] text-xs font-mono cursor-pointer"
            title={language === 'it' ? 'Mostra opzioni velocità e calendario' : 'Show speed and calendar options'}
          >
            <span>{speed}×</span>
            {isExpandedMobile ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Desktop Day Selector */}
          <div className="hidden md:flex items-center gap-1 bg-[var(--rule)]/60 p-1 rounded-xl border border-[var(--rule)]">
            <Calendar className="w-3.5 h-3.5 text-[var(--ink-3)] ml-1 mr-1" />
            {(['weekday', 'saturday', 'sunday'] as DayType[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onDayChange(d)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedDay === d
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                }`}
              >
                {dayLabels[d]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Middle row: Interactive Time Scrubber Slider */}
      <div className="flex flex-col gap-1">
        <div className="relative w-full py-1">
          <input
            type="range"
            min={0}
            max={1439}
            step={1}
            value={sliderValue}
            onChange={(e) => onTimeChange(Number(e.target.value) * 60)}
            className="w-full h-2 rounded-lg cursor-ew-resize appearance-none"
            aria-label={language === 'it' ? 'Orario del giorno' : 'Time of day'}
          />
        </div>

        {/* Ticks for timeline */}
        <div className="flex justify-between text-[10px] sm:text-[11px] font-mono text-[var(--ink-3)] px-1">
          <span>00:00</span>
          <span className="hidden sm:inline">04:00</span>
          <span>08:00</span>
          <span>12:00</span>
          <span>16:00</span>
          <span className="hidden sm:inline">20:00</span>
          <span>24:00</span>
        </div>
      </div>

      {/* Bottom row / Expandable section on Mobile */}
      <div
        className={`${
          isExpandedMobile ? 'flex' : 'hidden md:flex'
        } flex-col md:flex-row flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[var(--rule)]/60 animate-in fade-in duration-150`}
      >
        {/* Mobile Day Selector (when expanded) */}
        <div className="flex md:hidden items-center justify-between w-full gap-2">
          <span className="text-[11px] text-[var(--ink-3)] font-mono">{language === 'it' ? 'Giorno:' : 'Day:'}</span>
          <div className="flex items-center gap-1 bg-[var(--rule)]/60 p-0.5 rounded-lg border border-[var(--rule)] flex-1 justify-end">
            {(['weekday', 'saturday', 'sunday'] as DayType[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onDayChange(d)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  selectedDay === d
                    ? 'bg-cyan-500 text-white'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                }`}
              >
                {dayLabels[d]}
              </button>
            ))}
          </div>
        </div>

        {/* Speed Presets */}
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          <div className="flex items-center gap-1 bg-[var(--rule)]/60 p-0.5 rounded-lg border border-[var(--rule)] w-full md:w-auto justify-between md:justify-start">
            <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono px-1.5 hidden sm:inline">
              {t('timeline.speed')}
            </span>
            {speedOptions.map((s) => (
              <button
                key={s.val}
                type="button"
                onClick={() => onSpeedChange(s.val)}
                className={`px-2 py-0.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
                  speed === s.val
                    ? 'bg-cyan-500 text-white font-semibold'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fleet & Peak summary */}
        <div className="flex items-center justify-between w-full md:w-auto text-[11px] sm:text-xs text-[var(--ink-2)] font-mono">
          <span className="md:hidden">
            {language === 'it' ? 'Mezzi attivi:' : 'Active vessels:'}{' '}
            <strong className="text-emerald-400">{totalActiveVehicles}</strong>
          </span>
          <span>
            {language === 'it' ? 'Picco:' : 'Peak:'}{' '}
            <span className="text-cyan-400 font-bold">{peakCount}</span>{' '}
            {language === 'it' ? 'mezzi alle' : 'vessels at'}{' '}
            <span className="text-[var(--ink)] font-bold">{peakTime}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
