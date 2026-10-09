'use client';

/** Icone, colori e bollino della natura del dato condivisi da pannello dei livelli, legenda e scheda informativa. */
import React from 'react';
import {
  Anchor, Bell, Bike, Building2, Cable, Camera, Car, CircleDot, Compass, Construction, Droplets, Flower2,
  Footprints, Gauge, GitBranch, HeartPulse, Landmark, Layers, Library, LifeBuoy, Navigation, Pill, Plane,
  Radio, Recycle, Satellite, ShieldAlert, Ship, SlidersHorizontal, ThermometerSun, Train, Trash2, Trees,
  Waves, Wifi, Wind, Zap, type LucideIcon,
} from 'lucide-react';
import type { LayerIconName, LayerRegime, LayerTone } from '@/lib/layerGroups';
import { useTranslation } from '@/lib/i18n';

export const LAYER_ICONS: Record<LayerIconName, LucideIcon> = {
  navigation: Navigation, radio: Radio, circleDot: CircleDot, anchor: Anchor, waves: Waves, gauge: Gauge,
  ship: Ship, compass: Compass, plane: Plane, train: Train, trash: Trash2, car: Car, bike: Bike,
  shieldAlert: ShieldAlert, wind: Wind, lifeBuoy: LifeBuoy, trees: Trees, layers: Layers, droplets: Droplets,
  gitBranch: GitBranch, flower: Flower2, thermometer: ThermometerSun, pill: Pill, heartPulse: HeartPulse,
  wifi: Wifi, cable: Cable, recycle: Recycle, library: Library, zap: Zap, construction: Construction,
  sliders: SlidersHorizontal, camera: Camera, footprints: Footprints, landmark: Landmark, bell: Bell,
  satellite: Satellite, building: Building2,
};

/** Classi complete per ogni colore (Tailwind genera solo classi scritte per intero). */
export const TONE_CLASSES: Record<LayerTone, { text: string; active: string; badge: string }> = {
  cyan: { text: 'text-cyan-400', active: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30', badge: 'bg-cyan-500/20 text-cyan-300' },
  emerald: { text: 'text-emerald-400', active: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-300' },
  sky: { text: 'text-sky-400', active: 'bg-sky-500/10 text-sky-300 border-sky-500/30', badge: 'bg-sky-500/20 text-sky-300' },
  blue: { text: 'text-blue-400', active: 'bg-blue-500/10 text-blue-300 border-blue-500/30', badge: 'bg-blue-500/20 text-blue-300' },
  amber: { text: 'text-amber-400', active: 'bg-amber-500/10 text-amber-300 border-amber-500/30', badge: 'bg-amber-500/20 text-amber-300' },
  purple: { text: 'text-purple-400', active: 'bg-purple-500/10 text-purple-300 border-purple-500/30', badge: 'bg-purple-500/20 text-purple-300' },
  indigo: { text: 'text-indigo-400', active: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30', badge: 'bg-indigo-500/20 text-indigo-300' },
  red: { text: 'text-red-400', active: 'bg-red-500/10 text-red-300 border-red-500/30', badge: 'bg-red-500/20 text-red-300' },
  lime: { text: 'text-lime-400', active: 'bg-lime-500/10 text-lime-300 border-lime-500/30', badge: 'bg-lime-500/20 text-lime-300' },
  teal: { text: 'text-teal-400', active: 'bg-teal-500/10 text-teal-300 border-teal-500/30', badge: 'bg-teal-500/20 text-teal-300' },
  stone: { text: 'text-stone-400', active: 'bg-stone-500/10 text-stone-300 border-stone-500/30', badge: 'bg-stone-500/20 text-stone-300' },
  rose: { text: 'text-rose-400', active: 'bg-rose-500/10 text-rose-300 border-rose-500/30', badge: 'bg-rose-500/20 text-rose-300' },
  orange: { text: 'text-orange-400', active: 'bg-orange-500/10 text-orange-300 border-orange-500/30', badge: 'bg-orange-500/20 text-orange-300' },
  green: { text: 'text-green-400', active: 'bg-green-500/10 text-green-300 border-green-500/30', badge: 'bg-green-500/20 text-green-300' },
  violet: { text: 'text-violet-400', active: 'bg-violet-500/10 text-violet-300 border-violet-500/30', badge: 'bg-violet-500/20 text-violet-300' },
  neutral: { text: 'text-neutral-300', active: 'bg-neutral-500/10 text-neutral-200 border-neutral-500/30', badge: 'bg-neutral-500/20 text-neutral-200' },
  fuchsia: { text: 'text-fuchsia-400', active: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30', badge: 'bg-fuchsia-500/20 text-fuchsia-300' },
};

const REGIME_STYLE: Record<LayerRegime, { cls: string; label: string; title: string; dot?: boolean }> = {
  realtime: { cls: 'border-emerald-500/40 text-emerald-400', label: 'regimeRealtime', title: 'regimeRealtimeTitle', dot: true },
  simulated: { cls: 'border-sky-500/40 text-sky-400', label: 'regimeSimulated', title: 'regimeSimulatedTitle' },
  static: { cls: 'border-[var(--rule)] text-[var(--ink-3)]', label: 'regimeStatic', title: 'regimeStaticTitle' },
  curated: { cls: 'border-amber-500/40 text-amber-400', label: 'regimeCurated', title: 'regimeCuratedTitle' },
};

/** Bollino con la natura del dato: Live, Simulato, Dataset, Da verificare. */
export const RegimeBadge: React.FC<{ regime: LayerRegime; className?: string }> = ({ regime, className = '' }) => {
  const { t } = useTranslation();
  const s = REGIME_STYLE[regime];
  return (
    <span
      title={t(`ui.layerPanel.${s.title}`)}
      className={`inline-flex items-center gap-1 px-1 rounded border text-[9px] font-mono uppercase tracking-wide leading-[1.4] whitespace-nowrap ${s.cls} ${className}`}
    >
      {s.dot && <span className="w-1 h-1 rounded-full bg-emerald-400 motion-safe:animate-pulse" aria-hidden />}
      {t(`ui.layerPanel.${s.label}`)}
    </span>
  );
};

export const LayerIcon: React.FC<{ name: LayerIconName; tone?: LayerTone; className?: string }> = ({ name, tone, className = 'w-3.5 h-3.5' }) => {
  const Icon = LAYER_ICONS[name];
  return <Icon className={`${className} ${tone ? TONE_CLASSES[tone].text : ''}`} aria-hidden />;
};
