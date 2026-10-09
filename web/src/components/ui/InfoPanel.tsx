'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, Info, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { LAYER_CATALOG } from '@/lib/layerCatalog';
import { LAYER_ENTRY_BY_KEY, layerRegime } from '@/lib/layerGroups';
import { LAYER_SLUG_BY_KEY, type LayerKey } from '@/lib/urlLayers';
import { LayerIcon, RegimeBadge } from '@/components/layerVisuals';
import { useDialogA11y } from './useDialogA11y';

const CATALOG_BY_SLUG = new Map(LAYER_CATALOG.map((l) => [l.id, l]));

interface InfoPanelProps {
  open: boolean;
  onClose: () => void;
  /** id del titolo della scheda (aria-labelledby) */
  labelledBy: string;
  /** Layer di provenienza: natura del dato, nome del livello, fonte e link alla scheda in /layers */
  layer?: LayerKey;
  /** Ora o data del dato, già formattata */
  dataTime?: string | null;
  /** Bordo colorato della scheda (classe Tailwind) */
  accent?: string;
  children: React.ReactNode;
}

/**
 * Scheda informativa unica per tutto ciò che si seleziona sulla mappa.
 * Desktop: agganciata a destra, accanto ai controlli di zoom e lontana dal pannello dei livelli.
 * Mobile: cassetto dal basso. Non blocca la mappa (niente sfondo scuro): cliccando un altro punto
 * la scheda si aggiorna, Escape la chiude.
 */
export const InfoPanel: React.FC<InfoPanelProps> = ({ open, onClose, labelledBy, layer, dataTime, accent = 'border-[var(--rule)]', children }) => {
  const { t } = useTranslation();
  const panelRef = useDialogA11y<HTMLElement>(open, onClose);
  if (!open) return null;

  const slug = layer ? LAYER_SLUG_BY_KEY[layer] : null;
  const doc = slug ? CATALOG_BY_SLUG.get(slug) : undefined;
  const entry = layer ? LAYER_ENTRY_BY_KEY.get(layer) : undefined;

  return (
    <section
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby={labelledBy}
      tabIndex={-1}
      data-info-panel
      className={`glass-panel absolute z-40 flex flex-col overflow-hidden rounded-2xl border shadow-2xl outline-none animate-in fade-in duration-200
        inset-x-2 bottom-2 max-h-[62vh] slide-in-from-bottom-4
        md:inset-x-auto md:bottom-auto md:top-4 md:right-[4.25rem] md:w-[24rem] md:max-h-[calc(100%-11rem)] md:slide-in-from-right-4
        ${accent}`}
    >
      {/* Maniglia del cassetto su mobile */}
      <div className="md:hidden w-10 h-1 bg-[var(--rule)] rounded-full mx-auto mt-2 shrink-0" aria-hidden />

      <div className="flex-1 overflow-y-auto overscroll-contain p-4 flex flex-col gap-4">{children}</div>

      {(layer || dataTime) && (
        <footer className="shrink-0 border-t border-[var(--rule)] bg-black/10 px-4 py-2.5 flex flex-col gap-1.5 text-[11px]">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {layer && <RegimeBadge regime={layerRegime(layer)} />}
            {entry && (
              <span className="flex items-center gap-1 text-[var(--ink-2)]">
                <LayerIcon name={entry.icon} tone={entry.tone} className="w-3 h-3" />
                {t(entry.label)}
              </span>
            )}
            {dataTime && <span className="font-mono text-[var(--ink-3)]">· {dataTime}</span>}
          </div>
          {doc && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[var(--ink-3)]">
              <a href={doc.portalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-cyan-400 min-w-0">
                <span className="truncate max-w-[14rem]">{doc.institution}</span>
                <ExternalLink className="w-3 h-3 shrink-0" aria-hidden />
              </a>
              <Link href={`/layers#${doc.id}`} className="flex items-center gap-1 hover:text-cyan-400">
                <Info className="w-3 h-3" aria-hidden />
                {t('ui.infoPanel.aboutLayer')}
              </Link>
            </div>
          )}
        </footer>
      )}
    </section>
  );
};

/** Griglia dei valori principali (3-6) in cima alla scheda. */
export const KeyValues: React.FC<{ items: Array<[label: string, value: React.ReactNode, cls?: string]> }> = ({ items }) => {
  const shown = items.filter(([, v]) => v !== null && v !== undefined && v !== '');
  if (shown.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-2 text-xs">
      {shown.map(([label, value, cls]) => (
        <div key={label} className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] min-w-0">
          <dt className="text-[10px] uppercase font-mono text-[var(--ink-3)]">{label}</dt>
          <dd className={`font-mono font-bold break-words ${cls ?? 'text-[var(--ink)]'}`}>{value}</dd>
        </div>
      ))}
    </dl>
  );
};

/** Sezione espandibile "Altri dettagli". */
export const MoreDetails: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  return (
    <details className="group rounded-xl border border-[var(--rule)] text-xs">
      <summary className="cursor-pointer select-none list-none px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center justify-between">
        {t('ui.infoPanel.moreDetails')}
        <span className="transition-transform group-open:rotate-180" aria-hidden>▾</span>
      </summary>
      <div className="px-3 pb-3 pt-1 flex flex-col gap-2">{children}</div>
    </details>
  );
};

/** Intestazione standard: icona, nome, categoria e chiusura. */
export const InfoHeader: React.FC<{
  id: string;
  icon: React.ReactNode;
  title: React.ReactNode;
  category?: React.ReactNode;
  subtitle?: React.ReactNode;
  onClose: () => void;
}> = ({ id, icon, title, category, subtitle, onClose }) => (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[var(--rule)]/40">{icon}</div>
        <div className="min-w-0">
          {category && <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-[var(--ink-3)] block">{category}</span>}
          <h2 id={id} className="text-base font-bold text-[var(--ink)] leading-tight break-words">
            {title}
          </h2>
          {subtitle && <span className="text-[11px] font-mono text-[var(--ink-2)] block mt-0.5">{subtitle}</span>}
        </div>
      </div>
      <InfoClose onClose={onClose} />
    </div>
);

export const InfoClose: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClose}
      className="p-1.5 -m-1 rounded-lg hover:bg-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer shrink-0"
      aria-label={t('common.close')}
      title={t('common.close')}
    >
      <X className="w-5 h-5" aria-hidden />
    </button>
  );
};
