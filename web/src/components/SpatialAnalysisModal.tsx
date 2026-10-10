'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, SlidersHorizontal, Anchor, Construction, ArrowRight } from 'lucide-react';
import { StopNearCantiere } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';
import { Modal } from '@/components/ui/Modal';

interface SpatialAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFocusLocation: (lat: number, lon: number) => void;
}

export const SpatialAnalysisModal: React.FC<SpatialAnalysisModalProps> = ({
  isOpen,
  onClose,
  onFocusLocation
}) => {
  const { t } = useTranslation();
  const [radius, setRadius] = useState<number>(200);
  const [results, setResults] = useState<StopNearCantiere[]>([]);
  // Raggio dell'ultima risposta ricevuta: il caricamento è in corso finché non coincide con quello scelto
  const [loadedRadius, setLoadedRadius] = useState<number | null>(null);
  const loading = isOpen && loadedRadius !== radius;

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetch(`/api/spatial/stops-near-cantieri?radius=${radius}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setResults(data.success ? data.data : []);
        setLoadedRadius(radius);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setLoadedRadius(radius);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, radius]);

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} labelledBy="spatial-modal-title" align="sheet" closeOnBackdrop={false} panelClassName="glass-panel w-full max-w-3xl rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 sm:gap-5 border border-amber-500/40 max-h-[88vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--rule)] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400">
                  {t('ui.spatial.analisiSpazialePostgisStDwithin')}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300">
                  {results.length} {t('ui.spatial.intersezioniRilevate')}
                </span>
              </div>
              <h3 id="spatial-modal-title" className="text-lg font-bold text-[var(--ink)] leading-snug">
                {t('ui.spatial.incrocioFermateActvCantieriAttivi')}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Buffer Filter Slider */}
        <div className="bg-[var(--rule)]/40 p-4 rounded-xl border border-[var(--rule)] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--ink)]">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span>{t('ui.spatial.raggioProssimitaBufferGeodeticoPostgis')}</span>
            </div>
            <span className="font-mono font-bold text-amber-400 text-sm">{radius} {t('common.meters')}</span>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="range"
              min={50}
              max={500}
              step={25}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="flex-1"
            />
            <div className="flex gap-1">
              {[100, 200, 300, 500].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRadius(val)}
                  className={`px-2 py-1 rounded text-[11px] font-mono cursor-pointer ${
                    radius === val ? 'bg-amber-500 text-white font-bold' : 'bg-[var(--rule)] text-[var(--ink-2)]'
                  }`}
                >
                  {val}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-[var(--ink-2)] font-mono motion-safe:animate-pulse">
              {t('ui.spatial.esecuzioneQuerySpazialeStDwithin')}
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--ink-3)] font-mono">
              {t('ui.spatial.nessunaFermataRaggio', { radius })}
            </div>
          ) : (
            results.map((r, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] hover:border-amber-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                {/* Left: Stop and Worksite info */}
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 font-bold text-[var(--ink)]">
                      <Anchor className="w-3.5 h-3.5 text-cyan-400" /> {r.stopName}
                    </span>
                    <span className="text-[10px] text-[var(--ink-3)] font-mono uppercase">
                      ({r.transportMode})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[var(--ink-2)]">
                    <Construction className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="truncate">{r.cantiereTitolo}</span>
                  </div>
                </div>

                {/* Right: Distance & Focus Button */}
                <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                  <div className="text-right">
                    <span className="font-mono font-bold text-amber-400 text-sm block">
                      {r.distanzaMetri} m
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-amber-500/20 text-amber-400">
                      {r.cantiereCategoria}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onFocusLocation(r.stopLat, r.stopLon);
                      onClose();
                    }}
                    className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-400 hover:text-white transition-all cursor-pointer"
                    title={t('ui.spatial.centraMappaSuQuestaCoppia')}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
    </Modal>
  );
};
