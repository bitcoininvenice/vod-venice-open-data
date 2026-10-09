'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  HeartPulse,
  Landmark,
  Layers,
  Navigation,
  Search,
  ShieldQuestion,
  Waves,
  Wind,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { TransportModeCategory } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';
import type { LayerKey } from '@/lib/urlLayers';
import {
  countActiveLayers,
  CROWDED_LAYER_THRESHOLD,
  matchingPreset,
  PRESET_LAYERS,
  SCENARIO_PRESETS,
  type LayerVisibility,
  type MapPreset,
} from '@/lib/layerState';
import {
  groupLayerKeys,
  isCuratedLayer,
  LAYER_GROUPS,
  layerMatches,
  layerRegime,
  type LayerEntry,
  type LayerGroup,
  type LayerGroupId,
} from '@/lib/layerGroups';
import { LayerIcon, RegimeBadge, TONE_CLASSES } from './layerVisuals';
import { SPORT_FILTERS, type SportFilter } from '@/lib/sports';

interface LayerPanelProps {
  layers: LayerVisibility;
  onToggleLayer: (key: LayerKey) => void;
  onSetLayers: (keys: LayerKey[], active: boolean) => void;
  onApplyPreset: (preset: MapPreset) => void;
  /** Numero di elementi caricati per layer (mostrato quando il layer è acceso) */
  counts: Partial<Record<LayerKey, number>>;
  liveWebcamsCount?: number;
  /** Filtro per sport del livello Sport */
  sportFilter?: SportFilter;
  onSportFilterChange?: (f: SportFilter) => void;
  bufferRadiusMeters: number;
  onBufferRadiusChange: (radius: number) => void;
  selectedCategory: TransportModeCategory | 'all';
  onSelectCategory: (cat: TransportModeCategory | 'all') => void;
  categoryCounts: Record<string, number>;
  categoryColors: Record<string, string>;
  onClose?: () => void;
}

const PRESET_STYLE: Record<(typeof SCENARIO_PRESETS)[number], { icon: LucideIcon; cls: string; on: string }> = {
  muoversi: { icon: Navigation, cls: 'text-sky-400', on: 'bg-sky-500/15 border-sky-500/50 text-[var(--ink)]' },
  'acqua-alta': { icon: Waves, cls: 'text-blue-400', on: 'bg-blue-500/15 border-blue-500/50 text-[var(--ink)]' },
  ambiente: { icon: Wind, cls: 'text-emerald-400', on: 'bg-emerald-500/15 border-emerald-500/50 text-[var(--ink)]' },
  servizi: { icon: HeartPulse, cls: 'text-rose-400', on: 'bg-rose-500/15 border-rose-500/50 text-[var(--ink)]' },
  citta: { icon: Landmark, cls: 'text-amber-400', on: 'bg-amber-500/15 border-amber-500/50 text-[var(--ink)]' },
};

const SubCategoryHeader: React.FC<{ icon: React.ReactNode; label: string; isFirst?: boolean }> = ({ icon, label, isFirst = false }) => (
  <div
    className={`flex items-center gap-1.5 px-1 pb-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--ink-3)] border-b border-[var(--rule)]/40 ${
      isFirst ? 'pt-0.5' : 'pt-2.5'
    }`}
  >
    {icon}
    <span>{label}</span>
  </div>
);

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  onToggleLayer,
  onSetLayers,
  onApplyPreset,
  counts,
  liveWebcamsCount = 0,
  sportFilter = 'all',
  onSportFilterChange,
  bufferRadiusMeters,
  onBufferRadiusChange,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  categoryColors,
  onClose,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<LayerGroupId, boolean>>({ mobility: false, lagoon: false, city: false });
  const [openCurated, setOpenCurated] = useState<Record<LayerGroupId, boolean>>({ mobility: false, lagoon: false, city: false });
  const [actvOpen, setActvOpen] = useState(false);

  const activeCount = countActiveLayers(layers);
  const activePreset = useMemo(() => matchingPreset(layers), [layers]);
  const searching = query.trim().length > 0;

  const applyPreset = (preset: MapPreset) => {
    onApplyPreset(preset);
    const keys = preset === 'clean' ? [] : PRESET_LAYERS[preset];
    setOpenGroups({
      mobility: false,
      lagoon: false,
      city: false,
      ...Object.fromEntries(LAYER_GROUPS.map((g) => [g.id, groupLayerKeys(g).some((k) => keys.includes(k))])),
    });
  };

  const visible = (entry: LayerEntry) => layerMatches(entry.key, t(entry.label), query);

  const CATEGORIES: { key: TransportModeCategory; label: string }[] = [
    { key: 'vaporetto', label: 'Vaporetto' },
    { key: 'motoscafo', label: t('ui.layerPanel.motoscafo') },
    { key: 'motonave', label: t('ui.layerPanel.motonave') },
    { key: 'ferry', label: 'Ferry-boat' },
    { key: 'tram', label: 'Tram T1/T2' },
    { key: 'bus', label: t('ui.layerPanel.busTerraferma') },
    { key: 'island', label: t('ui.layerPanel.busIsole') },
  ];

  const renderEntry = (entry: LayerEntry) => {
    const on = layers[entry.key];
    const label = t(entry.label);
    const count = counts[entry.key] ?? 0;
    return (
      <React.Fragment key={entry.key}>
        <button
          type="button"
          onClick={() => onToggleLayer(entry.key)}
          aria-pressed={on}
          data-layer={entry.key}
          className={`flex items-center justify-between gap-2 p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer text-left ${
            on ? TONE_CLASSES[entry.tone].active : 'bg-transparent text-[var(--ink-2)] border-[var(--rule)] hover:border-[var(--ink-3)]/60 hover:text-[var(--ink)]'
          }`}
        >
          <span className="flex items-center gap-2 min-w-0">
            <LayerIcon name={entry.icon} tone={entry.tone} className={`w-3.5 h-3.5 shrink-0 ${on ? '' : 'opacity-70'}`} />
            <span className="leading-tight truncate">{label}</span>
          </span>
          <span className="flex items-center gap-1.5 shrink-0">
            {entry.key === 'showCameras' && on && liveWebcamsCount > 0 && (
              <span className="text-[9px] font-mono px-1.5 rounded bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40">
                {t('ui.layerPanel.liveWebcams', { n: liveWebcamsCount })}
              </span>
            )}
            {on && count > 0 && (
              <span className={`text-[10px] font-mono px-1.5 rounded font-bold tabular ${TONE_CLASSES[entry.tone].badge}`}>{count}</span>
            )}
            <RegimeBadge regime={layerRegime(entry.key)} />
            {on ? <Eye className="w-3.5 h-3.5" aria-hidden /> : <EyeOff className="w-3.5 h-3.5 opacity-60" aria-hidden />}
          </span>
        </button>
        {entry.key === 'showSports' && on && onSportFilterChange && (
          <div className="flex flex-wrap gap-1 px-2 pb-1" role="group" aria-label={t('ui.layerPanel.sportFilter')}>
            {(['all', ...SPORT_FILTERS, 'other'] as SportFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onSportFilterChange(f)}
                aria-pressed={sportFilter === f}
                className={`px-2 py-0.5 rounded-full border text-[10px] font-mono cursor-pointer ${
                  sportFilter === f ? 'bg-orange-500/20 border-orange-500/50 text-orange-200' : 'border-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)]'
                }`}
              >
                {t(`ui.sport.filter_${f}`)}
              </button>
            ))}
          </div>
        )}
        {entry.key === 'showSpatialBuffer' && on && (
          <div className="flex flex-col gap-1 px-2.5 pb-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-[var(--ink-2)]">{t('ui.layerPanel.raggioImpatto')}</span>
              <span className="font-mono font-bold text-amber-400">
                {bufferRadiusMeters} {t('common.meters')}
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={500}
              step={25}
              value={bufferRadiusMeters}
              onChange={(e) => onBufferRadiusChange(Number(e.target.value))}
              aria-label={t('ui.layerPanel.raggioImpatto')}
              className="w-full h-1.5"
            />
          </div>
        )}
      </React.Fragment>
    );
  };

  const renderGroup = (group: LayerGroup) => {
    const keys = groupLayerKeys(group);
    const groupActive = keys.filter((k) => layers[k]).length;
    const groupLabel = t(group.label);
    const open = searching || openGroups[group.id];
    const subgroups = group.subgroups
      .map((s) => ({ ...s, entries: s.layers.filter((l) => !isCuratedLayer(l.key) && visible(l)) }))
      .filter((s) => s.entries.length > 0);
    const curated = group.subgroups.flatMap((s) => s.layers).filter((l) => isCuratedLayer(l.key) && visible(l));
    if (searching && subgroups.length === 0 && curated.length === 0) return null;
    const verifiedKeys = keys.filter((k) => !isCuratedLayer(k));
    const curatedOpen = searching || openCurated[group.id];

    return (
      <section key={group.id} className="flex flex-col gap-2" aria-label={groupLabel}>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setOpenGroups((p) => ({ ...p, [group.id]: !p[group.id] }))}
            aria-expanded={open}
            className="flex-1 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
          >
            <span className="flex items-center gap-1.5 font-bold">
              <LayerIcon name={group.icon} tone={group.tone} />
              <span>{groupLabel}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono lowercase tabular">
                {groupActive}/{keys.length}
              </span>
              {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                onSetLayers(verifiedKeys, true);
                setOpenGroups((p) => ({ ...p, [group.id]: true }));
              }}
              title={t('ui.layerPanel.groupOnTitle', { group: groupLabel })}
              aria-label={t('ui.layerPanel.groupOnTitle', { group: groupLabel })}
              className="px-1.5 py-0.5 rounded-md border border-[var(--rule)] text-[10px] font-mono text-[var(--ink-2)] hover:text-cyan-300 hover:border-cyan-500/40 cursor-pointer"
            >
              {t('ui.layerPanel.groupOn')}
            </button>
            <button
              type="button"
              onClick={() => onSetLayers(keys, false)}
              disabled={groupActive === 0}
              title={t('ui.layerPanel.groupOffTitle', { group: groupLabel })}
              aria-label={t('ui.layerPanel.groupOffTitle', { group: groupLabel })}
              className="px-1.5 py-0.5 rounded-md border border-[var(--rule)] text-[10px] font-mono text-[var(--ink-2)] hover:text-rose-300 hover:border-rose-500/40 cursor-pointer disabled:opacity-40 disabled:cursor-default"
            >
              {t('ui.layerPanel.groupOff')}
            </button>
          </div>
        </div>

        {open && (
          <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
            {subgroups.map((s, i) => (
              <React.Fragment key={s.id}>
                <SubCategoryHeader icon={<LayerIcon name={s.icon} tone={s.tone} className="w-3 h-3" />} label={t(s.label)} isFirst={i === 0} />
                {s.entries.map(renderEntry)}
              </React.Fragment>
            ))}
            {curated.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-1 rounded-xl border border-dashed border-amber-500/30 p-1.5">
                <button
                  type="button"
                  onClick={() => setOpenCurated((p) => ({ ...p, [group.id]: !p[group.id] }))}
                  aria-expanded={curatedOpen}
                  className="flex items-center justify-between px-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-400/90 hover:text-amber-300 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldQuestion className="w-3 h-3" />
                    {t('ui.layerPanel.curatedSection', { n: curated.length })}
                  </span>
                  {curatedOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {curatedOpen && (
                  <>
                    <p className="px-1 text-[10px] leading-snug text-[var(--ink-3)]">{t('ui.layerPanel.curatedHint')}</p>
                    {curated.map(renderEntry)}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    );
  };

  const groups = LAYER_GROUPS.map(renderGroup);
  const noResults = searching && groups.every((g) => g === null);

  return (
    <aside className="glass-panel rounded-2xl p-3.5 sm:p-4 shadow-xl flex flex-col gap-3 max-h-[calc(100vh-13.5rem)] overflow-y-auto">
      {/* Mobile grab handle */}
      <div className="w-10 h-1 bg-[var(--rule)]/80 rounded-full mx-auto md:hidden" />

      {/* Titolo */}
      <div className="flex items-center justify-between border-b border-[var(--rule)] pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">{t('layers.panelTitle')}</h2>
          <span className="text-[10px] font-mono text-[var(--ink-3)]">{t('ui.layerPanel.activeCount', { n: activeCount })}</span>
        </div>
        <div className="flex items-center gap-1">
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => applyPreset('clean')}
              className="px-1.5 py-0.5 rounded-md text-[10px] font-mono text-[var(--ink-2)] hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer flex items-center gap-1"
              title={t('ui.layerPanel.disattivaTuttiILivelliMappa')}
            >
              <EyeOff className="w-3 h-3" />
              {t('ui.layerPanel.turnAllOff')}
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
              title={t('layers.hidePanel')}
              aria-label={t('layers.hidePanel')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scenari */}
      <div className="flex flex-col gap-1.5" role="group" aria-label={t('ui.presets.label')}>
        <span className="text-[10px] text-[var(--ink-3)] font-mono uppercase font-semibold tracking-wider">{t('ui.presets.label')}</span>
        <div className="grid grid-cols-2 gap-1.5">
          {SCENARIO_PRESETS.map((p) => {
            const style = PRESET_STYLE[p];
            const Icon = style.icon;
            const on = activePreset === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => applyPreset(p)}
                aria-pressed={on}
                title={t(`ui.presets.${p}Desc`)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl border text-[11px] font-medium text-left transition-all cursor-pointer active:scale-[0.98] ${
                  on ? style.on : 'border-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink-3)]/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${style.cls}`} aria-hidden />
                <span className="truncate">{t(`ui.presets.${p}`)}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] leading-snug text-[var(--ink-3)]">{t('ui.presets.verifiedOnly')}</p>
      </div>

      {/* Avviso: troppi livelli */}
      {activeCount > CROWDED_LAYER_THRESHOLD && (
        <div role="status" className="flex items-start gap-2 p-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-[11px] text-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" aria-hidden />
          <span className="flex-1 leading-snug">{t('ui.layerPanel.crowded', { n: activeCount })}</span>
          <button
            type="button"
            onClick={() => applyPreset('clean')}
            className="shrink-0 px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 font-mono text-[10px] cursor-pointer"
          >
            {t('ui.layerPanel.crowdedAction')}
          </button>
        </div>
      )}

      {/* Ricerca */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && query) {
              e.stopPropagation();
              setQuery('');
            }
          }}
          placeholder={t('ui.layerPanel.searchPlaceholder')}
          aria-label={t('ui.layerPanel.searchLabel')}
          className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] text-xs text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:border-cyan-500/60 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label={t('ui.layerPanel.clearSearch')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {noResults && <p className="text-xs text-[var(--ink-3)] px-1">{t('ui.layerPanel.noResults', { q: query.trim() })}</p>}

      {groups}

      {/* Filtri mezzi ACTV (solo con il layer dei vaporetti acceso) */}
      {layers.showVehicles && !searching && (
        <div className="flex flex-col gap-2 pt-2 border-t border-[var(--rule)]">
          <button
            type="button"
            onClick={() => setActvOpen((v) => !v)}
            aria-expanded={actvOpen}
            className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
          >
            <span className="flex items-center gap-1.5 font-bold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('ui.layerPanel.flottaActvTipo')}</span>
            </span>
            {actvOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {actvOpen && (
            <div className="flex flex-col gap-1 animate-in fade-in duration-150">
              {selectedCategory !== 'all' && (
                <div className="flex justify-end pb-1">
                  <button
                    type="button"
                    onClick={() => onSelectCategory('all')}
                    className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
                  >
                    {t('ui.layerPanel.mostraTuttiITipi')}
                  </button>
                </div>
              )}
              {CATEGORIES.map((c) => {
                const count = categoryCounts[c.key] || 0;
                const color = categoryColors[c.key] || '#5cc8ff';
                const isSelected = selectedCategory === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => onSelectCategory(isSelected ? 'all' : c.key)}
                    aria-pressed={isSelected}
                    className={`flex items-center justify-between p-1.5 px-2.5 rounded-lg text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--rule)] text-[var(--ink)] font-bold ring-1 ring-cyan-500'
                        : 'text-[var(--ink-2)] hover:bg-[var(--rule)]/50 hover:text-[var(--ink)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: color }} />
                      <span>{c.label}</span>
                    </div>
                    <span className="font-mono text-[11px] tabular text-[var(--ink-3)]">{count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
