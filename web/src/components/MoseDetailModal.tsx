'use client';

import React from 'react';
import { X, Waves, ShieldCheck, AlertCircle, Clock, Droplets, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { MoseGateItem } from '@/lib/types';
import { CpsmStationItem } from '@/app/api/tide/route';

interface MoseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  moseGates: MoseGateItem[];
  stations: CpsmStationItem[];
  tideLevel: number;
}

export const MoseDetailModal: React.FC<MoseDetailModalProps> = ({
  isOpen,
  onClose,
  moseGates,
  stations,
  tideLevel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 border border-blue-500/40 animate-in fade-in zoom-in-95 duration-200 max-h-[88vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--rule)] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/40 shadow-lg shadow-blue-500/10">
              <Waves className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  CPSM Centro Maree · MOSE
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE TELEMETRIA
                </span>
              </div>
              <h3 className="text-lg font-bold text-[var(--ink)] leading-snug">
                Sistema di Difesa MOSE & Rete Mareografica Lagunare
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

        {/* Current Tide Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/30 flex flex-col justify-between">
            <span className="text-[10px] text-[var(--ink-3)] font-mono">Punta della Salute (ZMPS)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-[var(--ink)]">+{tideLevel} cm</span>
              <span className="text-xs text-blue-400 font-semibold">(Normale)</span>
            </div>
            <span className="text-[10px] text-emerald-400">Laguna in sicurezza</span>
          </div>

          <div className="bg-[var(--rule)]/40 p-3 rounded-xl border border-[var(--rule)] flex flex-col justify-between">
            <span className="text-[10px] text-[var(--ink-3)] font-mono">Stato Barriere MOSE</span>
            <span className="text-base font-bold font-mono text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> 78/78 ABBASSATE
            </span>
            <span className="text-[10px] text-[var(--ink-3)]">Attivazione sopra +110 cm</span>
          </div>

          <div className="bg-[var(--rule)]/40 p-3 rounded-xl border border-[var(--rule)] flex flex-col justify-between">
            <span className="text-[10px] text-[var(--ink-3)] font-mono">Allagamento Pedonale</span>
            <span className="text-base font-bold font-mono text-cyan-400">~1.2% (Solo San Marco)</span>
            <span className="text-[10px] text-[var(--ink-3)]">Passerelle non necessarie</span>
          </div>
        </div>

        {/* 4 MOSE Gate Inlets */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Le 3 Bocche di Porto e i 4 Sbarramenti MOSE
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {moseGates.map((gate) => (
              <div key={gate.id} className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <strong className="text-[var(--ink)] text-xs">{gate.inletName}</strong>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400">
                    {gate.status}
                  </span>
                </div>
                <span className="text-[11px] text-[var(--ink-2)]">{gate.channel}</span>
                <div className="flex justify-between items-center text-[10px] font-mono pt-1 border-t border-[var(--rule)]">
                  <span className="text-[var(--ink-3)]">{gate.barriersCount} paratoie a scomparsa</span>
                  <span className="text-cyan-400">Mare: +{gate.tideSeaCm}cm</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CPSM Tide Monitoring Stations */}
        <div className="flex flex-col gap-2 pt-1 border-t border-[var(--rule)]">
          <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-blue-400" /> Stazioni Rete Mareografica CPSM
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {stations.map((s) => (
              <div key={s.id} className="p-2.5 rounded-xl bg-[var(--rule)]/40 border border-[var(--rule)] flex flex-col gap-0.5">
                <span className="text-[10px] text-[var(--ink-3)] truncate">{s.name}</span>
                <span className="text-base font-bold font-mono text-[var(--ink)]">+{s.levelCm} cm</span>
                <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-0.5">
                  {s.trend === 'IN_AUMENTO' ? <ArrowUpRight className="w-3 h-3 text-amber-400" /> : <ArrowDownRight className="w-3 h-3 text-blue-400" />}
                  {s.trend}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Flooding Scale Reference */}
        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs flex flex-col gap-1">
          <span className="font-semibold text-blue-400 text-[11px]">Scala Impatto Marea su Viabilità Pedonale (Centro Storico):</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] text-[var(--ink-2)] pt-1">
            <div>• <strong>+80 cm</strong>: San Marco comincia a bagnarsi (~2%)</div>
            <div>• <strong>+100 cm</strong>: Piazza allagata, passerelle montate (~5%)</div>
            <div>• <strong>+110 cm</strong>: 12% allagata (attivazione MOSE)</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--rule)] text-xs text-[var(--ink-3)]">
          <span>Fonte: Centro Previsioni e Segnalazioni Maree Comune di Venezia</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-400 transition-all cursor-pointer shadow-lg shadow-blue-500/20"
          >
            Chiudi Scheda
          </button>
        </div>
      </div>
    </div>
  );
};
