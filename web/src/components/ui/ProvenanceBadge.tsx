'use client';

import React from 'react';
import { PROVENANCE_LABEL, type ProvenanceKind } from '@/lib/provenance';
import { useTranslation } from '@/lib/i18n';

const STYLE: Record<ProvenanceKind, string> = {
  live: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
  'schedule-simulation': 'bg-sky-500/15 text-sky-400 border-sky-500/40',
  'static-reference': 'bg-slate-500/15 text-slate-300 border-slate-500/40',
  community: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
};

interface ProvenanceBadgeProps {
  kind: ProvenanceKind;
  /** Testo aggiuntivo, es. orario dell'ultima misura */
  detail?: string;
  className?: string;
}

/** Etichetta uniforme che dichiara la natura del dato (live, simulato da orario, statico, collaborativo). */
export function ProvenanceBadge({ kind, detail, className = '' }: ProvenanceBadgeProps) {
  const { language } = useTranslation();
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${STYLE[kind]} ${className}`}
    >
      {kind === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden />}
      {PROVENANCE_LABEL[kind][language === 'it' ? 'it' : 'en']}
      {detail && <span className="font-normal normal-case opacity-80">· {detail}</span>}
    </span>
  );
}
