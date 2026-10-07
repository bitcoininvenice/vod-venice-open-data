'use client';

import React from 'react';
import { X, Construction, Calendar, Euro, Building2, AlertTriangle, MapPin } from 'lucide-react';
import { CantiereItem } from '@/lib/types';

interface CantiereDetailModalProps {
  cantiere: CantiereItem | null;
  onClose: () => void;
}

export const CantiereDetailModal: React.FC<CantiereDetailModalProps> = ({
  cantiere,
  onClose
}) => {
  if (!cantiere) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-3.5 sm:gap-4 border border-amber-500/40 animate-in fade-in zoom-in-95 duration-200 max-h-[88vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--rule)] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
              <Construction className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400">
                  Comune di Venezia · {cantiere.codice}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  cantiere.impattoMobilita === 'Critico'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}>
                  Impatto {cantiere.impattoMobilita}
                </span>
              </div>
              <h3 className="text-base font-bold text-[var(--ink)] leading-snug">
                {cantiere.titolo}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Location & Dates */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-[var(--rule)]/40 p-2.5 rounded-xl border border-[var(--rule)] flex items-start gap-2">
            <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-[var(--ink-3)] block">Localizzazione</span>
              <span className="text-[var(--ink)] font-medium">{cantiere.localizzazione}</span>
              <span className="text-[10px] text-[var(--ink-2)] block mt-0.5">({cantiere.quartiere})</span>
            </div>
          </div>

          <div className="bg-[var(--rule)]/40 p-2.5 rounded-xl border border-[var(--rule)] flex items-start gap-2">
            <Calendar className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-[var(--ink-3)] block">Periodo Lavori</span>
              <span className="text-[var(--ink)] font-mono text-[11px] block">
                Dal: {cantiere.dataInizio}
              </span>
              <span className="text-[var(--ink)] font-mono text-[11px] block">
                Al: {cantiere.dataFinePrevista}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Budget & Contractor */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-[var(--rule)]/40 p-2.5 rounded-xl border border-[var(--rule)] flex items-center gap-2">
            <Euro className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] text-[var(--ink-3)] block">Importo Finanziato</span>
              <span className="font-mono font-bold text-[var(--ink)] text-sm">
                € {cantiere.importoLavori.toLocaleString('it-IT')}
              </span>
            </div>
          </div>

          <div className="bg-[var(--rule)]/40 p-2.5 rounded-xl border border-[var(--rule)] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            <div>
              <span className="text-[10px] text-[var(--ink-3)] block">Ente Appaltante</span>
              <span className="text-[var(--ink)] text-[11px] leading-tight block">
                {cantiere.enteResponsabile}
              </span>
            </div>
          </div>
        </div>

        {/* Worksite description / Mobility impact */}
        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex flex-col gap-1 text-xs">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>Dettagli Tecnici & Impatto sui Trasporti</span>
          </div>
          <p className="text-[var(--ink-2)] leading-relaxed">
            {cantiere.dettagli}
          </p>
        </div>
      </div>
    </div>
  );
};
