'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { LAYER_ENTRIES, layerRegime } from '@/lib/layerGroups';
import type { LayerVisibility } from '@/lib/layerState';
import type { LayerKey } from '@/lib/urlLayers';
import { LayerIcon, RegimeBadge } from './layerVisuals';

interface ActiveLayersLegendProps {
  layers: LayerVisibility;
  counts: Partial<Record<LayerKey, number>>;
  onHideLayer: (key: LayerKey) => void;
}

/**
 * Legenda unica dei livelli accesi: simbolo, nome, natura del dato e numero di elementi,
 * con la possibilità di spegnere un livello senza aprire il pannello. Chiusa, è una sola riga.
 */
export const ActiveLayersLegend: React.FC<ActiveLayersLegendProps> = ({ layers, counts, onHideLayer }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const active = LAYER_ENTRIES.filter((e) => layers[e.key]);
  if (active.length === 0) return null;

  return (
    <div className="glass-panel rounded-xl border border-[var(--rule)] shadow-lg text-[11px]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? t('ui.legend.hide') : t('ui.legend.show')}
        className="w-full flex items-center justify-between gap-2 px-3 py-1.5 font-mono text-[10px] uppercase text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
      >
        <span className="flex items-center gap-1.5 font-bold">
          <Layers className="w-3 h-3 text-cyan-400" aria-hidden />
          {t('ui.legend.title')}
          <span className="px-1.5 rounded-full bg-cyan-500/20 text-cyan-300 tabular">{active.length}</span>
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && (
        <div className="border-t border-[var(--rule)] px-2 py-1.5 flex flex-col gap-0.5 max-h-[40vh] overflow-y-auto">
          <ul className="flex flex-col gap-0.5">
            {active.map((e) => {
              const label = t(e.label);
              const count = counts[e.key] ?? 0;
              return (
                <li key={e.key} className="flex items-center gap-2 px-1 py-0.5 rounded-md hover:bg-[var(--rule)]/40">
                  <LayerIcon name={e.icon} tone={e.tone} className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 min-w-0 truncate text-[var(--ink)]">{label}</span>
                  {count > 0 && <span className="font-mono text-[10px] text-[var(--ink-3)] tabular">{count}</span>}
                  <RegimeBadge regime={layerRegime(e.key)} />
                  <button
                    type="button"
                    onClick={() => onHideLayer(e.key)}
                    className="p-0.5 rounded text-[var(--ink-3)] hover:text-rose-300 cursor-pointer"
                    aria-label={t('ui.legend.turnOff', { layer: label })}
                    title={t('ui.legend.turnOff', { layer: label })}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="px-1 pt-1 text-[9px] text-[var(--ink-3)]">{t('ui.legend.nature')}</p>
        </div>
      )}
    </div>
  );
};
