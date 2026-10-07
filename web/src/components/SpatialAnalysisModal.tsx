'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, SlidersHorizontal, MapPin, Anchor, Construction, ArrowRight, Download } from 'lucide-react';
import { StopNearCantiere } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

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
  const { language, t } = useTranslation();
  const [radius, setRadius] = useState<number>(200);
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<StopNearCantiere[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch(`/api/spatial/stops-near-cantieri?radius=${radius}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setResults(data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [isOpen, radius]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div className="glass-panel w-full max-w-3xl rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 sm:gap-5 border border-amber-500/40 max-h-[88vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--rule)] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400">
                  {language === 'it' ? 'Analisi Spaziale PostGIS · ST_DWithin' : 'PostGIS Spatial Analysis · ST_DWithin'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300">
                  {results.length} {language === 'it' ? 'Intersezioni Rilevate' : 'Intersections Detected'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[var(--ink)] leading-snug">
                {language === 'it' ? 'Incrocio Fermate ACTV & Cantieri Attivi Comune di Venezia' : 'ACTV Stops & Active Worksites Intersection (Venice)'}
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
              <span>{language === 'it' ? 'Raggio di prossimità (Buffer geodetico PostGIS):' : 'Proximity radius (PostGIS geodetic buffer):'}</span>
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
            <div className="py-12 text-center text-xs text-[var(--ink-2)] font-mono animate-pulse">
              {language === 'it' ? 'Esecuzione query spaziale ST_DWithin su PostGIS...' : 'Executing ST_DWithin spatial query on PostGIS...'}
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--ink-3)] font-mono">
              {language === 'it' ? `Nessuna fermata rilevata entro ${radius} metri da cantieri attivi.` : `No stops detected within ${radius} meters of active worksites.`}
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
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      r.impattoMobilita === 'Critico' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {r.impattoMobilita === 'Critico' ? (language === 'it' ? 'Critico' : 'Critical') : r.impattoMobilita}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onFocusLocation(r.stopLat, r.stopLon);
                      onClose();
                    }}
                    className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-400 hover:text-white transition-all cursor-pointer"
                    title={language === 'it' ? 'Centra mappa su questa coppia' : 'Focus map on this pair'}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
