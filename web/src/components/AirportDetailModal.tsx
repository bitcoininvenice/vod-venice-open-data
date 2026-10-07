'use client';

import React from 'react';
import { X, Plane, Navigation, Compass, ExternalLink, ShieldCheck, Waves, Bus } from 'lucide-react';
import { FlightItem } from '@/lib/types';

interface AirportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  flights: FlightItem[];
}

export const AirportDetailModal: React.FC<AirportDetailModalProps> = ({
  isOpen,
  onClose,
  flights
}) => {
  if (!isOpen) return null;

  const activeArrivals = flights.filter((f) => f.status === 'APPROACH');
  const activeDepartures = flights.filter((f) => f.status === 'DEPARTURE');
  const activeTaxi = flights.filter((f) => f.status === 'TAXI' || f.onGround);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-3.5 sm:gap-4 border border-sky-500/40 animate-in fade-in zoom-in-95 duration-200 max-h-[88vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--rule)] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/40 shadow-lg shadow-sky-500/10">
              <Plane className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  IATA: VCE · ICAO: LIPZ
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ATTIVO
                </span>
              </div>
              <h3 className="text-lg font-bold text-[var(--ink)] leading-snug">
                Aeroporto di Venezia Marco Polo
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

        {/* Airport Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 text-xs">
          <div className="bg-[var(--rule)]/40 p-2.5 rounded-xl border border-[var(--rule)]">
            <span className="text-[10px] text-[var(--ink-3)] block font-mono">Passeggeri Annui</span>
            <span className="font-mono font-bold text-sky-400 text-sm">~11.5 Milioni</span>
            <span className="text-[9px] text-[var(--ink-3)] block">3° polo in Italia</span>
          </div>
          <div className="bg-[var(--rule)]/40 p-2.5 rounded-xl border border-[var(--rule)]">
            <span className="text-[10px] text-[var(--ink-3)] block font-mono">Elevazione</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">2 m (7 ft)</span>
            <span className="text-[9px] text-[var(--ink-3)] block">Bordo Laguna</span>
          </div>
          <div className="bg-[var(--rule)]/40 p-2.5 rounded-xl border border-[var(--rule)]">
            <span className="text-[10px] text-[var(--ink-3)] block font-mono">Gestore Hub</span>
            <span className="font-mono font-bold text-[var(--ink)] text-sm">SAVE S.p.A.</span>
            <span className="text-[9px] text-[var(--ink-3)] block">Polo Aeroportuale NE</span>
          </div>
        </div>

        {/* Runways specifications */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-sky-400" /> Specifiche Piste (Runways)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-sky-500/20 flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-sky-300">RWY 04R / 22L</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">Principale</span>
              </div>
              <span className="text-[11px] text-[var(--ink-2)]">Dimensioni: <strong className="text-[var(--ink)]">3,300 m × 45 m</strong></span>
              <span className="text-[11px] text-[var(--ink-2)]">Fondo: Asfalto scanalato</span>
              <span className="text-[10px] text-emerald-400 font-mono font-medium">ILS Cat. IIIb (Atterraggio con nebbia fitta)</span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-[var(--ink)]">RWY 04L / 22R</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--rule)] text-[var(--ink-3)] font-mono">Secondaria</span>
              </div>
              <span className="text-[11px] text-[var(--ink-2)]">Dimensioni: <strong className="text-[var(--ink)]">2,780 m × 45 m</strong></span>
              <span className="text-[11px] text-[var(--ink-2)]">Fondo: Asfalto</span>
              <span className="text-[10px] text-[var(--ink-3)] font-mono font-medium">Uso parallelo & rullaggio veloce</span>
            </div>
          </div>
        </div>

        {/* Intermodal Connections */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-emerald-400" /> Connessioni Intermodali ACTV & Laguna
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 font-semibold text-blue-400">
                <Waves className="w-3.5 h-3.5" /> Darsena Aeroporto (Via Acqua)
              </div>
              <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
                <strong>Alilaguna Linea Blu & Linea Rossa:</strong> collegamento diretto via motoscafo per Murano, Fondamente Nove, Lido e Piazza San Marco.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <Bus className="w-3.5 h-3.5" /> Terminal Bus (Terraferma)
              </div>
              <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
                <strong>ACTV Linea 5 (Aerobus):</strong> espresso per Venezia Piazzale Roma (20 min).<br />
                <strong>ACTV Linea 15:</strong> per Stazione Ferroviaria Mestre FS.
              </p>
            </div>
          </div>
        </div>

        {/* Live ADS-B Flights in vicinity */}
        <div className="flex flex-col gap-2 pt-1 border-t border-[var(--rule)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
              <Plane className="w-4 h-4 text-sky-400" /> Voli Tracciati nello Spazio Aereo VCE ({flights.length})
            </span>
            <span className="text-[10px] font-mono text-cyan-400">
              {activeArrivals.length} Arr · {activeDepartures.length} Dep · {activeTaxi.length} Taxi
            </span>
          </div>

          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
            {flights.map((f) => (
              <div
                key={f.icao24}
                className="flex items-center justify-between p-2 rounded-lg bg-[var(--rule)]/40 hover:bg-[var(--rule)]/70 text-xs border border-[var(--rule)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sky-400">{f.callsign}</span>
                  <span className="text-[11px] text-[var(--ink-2)]">({f.country})</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-[var(--ink-3)]">{f.altitudeMeters} m</span>
                  <span className="text-emerald-400">{f.speedKmh} km/h</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      f.status === 'APPROACH'
                        ? 'bg-amber-500/20 text-amber-300'
                        : f.status === 'DEPARTURE'
                        ? 'bg-sky-500/20 text-sky-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {f.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--rule)] text-xs text-[var(--ink-3)]">
          <span>Coordinate: 45°30′19″N 12°21′07″E</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-sky-500 text-white font-medium hover:bg-sky-400 transition-all cursor-pointer shadow-lg shadow-sky-500/20"
          >
            Chiudi Scheda
          </button>
        </div>
      </div>
    </div>
  );
};
