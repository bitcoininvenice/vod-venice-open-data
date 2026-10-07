'use client';

import React from 'react';
import { X, Satellite, Orbit, Radio, ExternalLink, Zap, Eye, Compass, ShieldCheck } from 'lucide-react';
import { SatelliteItem } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

interface SatelliteDetailModalProps {
  satellite: SatelliteItem | null;
  onClose: () => void;
}

export const SatelliteDetailModal: React.FC<SatelliteDetailModalProps> = ({
  satellite,
  onClose
}) => {
  const { language, t } = useTranslation();
  if (!satellite) return null;

  const isSar = satellite.type === 'SAR_RADAR';
  const isOptical = satellite.type === 'OPTICAL';
  const isISS = satellite.type === 'SPACE_STATION';
  const isNav = satellite.type === 'NAVIGATION';

  const typeColor = isSar
    ? 'text-fuchsia-400 bg-fuchsia-500/15 border-fuchsia-500/30'
    : isOptical
    ? 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30'
    : isISS
    ? 'text-amber-400 bg-amber-500/15 border-amber-500/30'
    : isNav
    ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
    : 'text-violet-400 bg-violet-500/15 border-violet-500/30';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-3.5 sm:gap-4 border border-fuchsia-500/40 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--rule)] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center border border-fuchsia-500/40 shadow-lg shadow-fuchsia-500/10">
              <Satellite className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase font-mono tracking-wider font-bold px-2 py-0.5 rounded-full border ${typeColor}`}>
                  {satellite.type.replace('_', ' ')} · {satellite.operator.split('/')[0].trim()}
                </span>
                <span className="text-[10px] font-mono text-fuchsia-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-ping" />
                  {language === 'it' ? 'ORBITA ATTIVA' : 'ACTIVE ORBIT'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[var(--ink)] leading-snug">
                {satellite.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
            title={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Venice Mission Target Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-fuchsia-950/30 to-purple-950/20 border border-fuchsia-500/20 flex flex-col gap-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-fuchsia-300 font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> {language === 'it' ? 'Missione & Ruolo Scientifico su Venezia' : 'Scientific Mission over Venice'}
            </span>
            <span className="font-mono text-[10px] text-[var(--ink-3)]">NORAD ID: #{satellite.noradId}</span>
          </div>
          <p className="text-sm font-medium text-[var(--ink)] leading-relaxed">
            {satellite.missionTarget}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-mono text-[var(--ink-2)] bg-[var(--rule)]/60 px-2 py-0.5 rounded-md">
              {language === 'it' ? 'Sensore:' : 'Sensor:'} <strong className="text-[var(--ink)]">{satellite.sensor}</strong>
            </span>
            <span className="text-[11px] font-mono text-[var(--ink-2)] bg-[var(--rule)]/60 px-2 py-0.5 rounded-md">
              {language === 'it' ? 'Risoluzione:' : 'Resolution:'} <strong className="text-fuchsia-400">{satellite.resolution}</strong>
            </span>
          </div>
        </div>

        {/* Orbital Mechanics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-0.5">
            <span className="text-[10px] font-mono text-[var(--ink-3)] flex items-center gap-1">
              <Orbit className="w-3 h-3 text-cyan-400" /> {language === 'it' ? 'Quota Orbitale' : 'Orbital Altitude'}
            </span>
            <span className="text-sm font-mono font-bold text-[var(--ink)]">
              {satellite.altitudeKm.toLocaleString()} km
            </span>
            <span className="text-[10px] text-[var(--ink-2)]">{satellite.altitudeKm > 2000 ? 'MEO Orbit' : 'LEO Low Orbit'}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-0.5">
            <span className="text-[10px] font-mono text-[var(--ink-3)] flex items-center gap-1">
              <Radio className="w-3 h-3 text-fuchsia-400" /> {language === 'it' ? 'Velocità Orbitale' : 'Orbital Speed'}
            </span>
            <span className="text-sm font-mono font-bold text-[var(--ink)]">
              {satellite.speedKmh.toLocaleString()} km/h
            </span>
            <span className="text-[10px] text-[var(--ink-2)]">{(satellite.speedKmh / 3600).toFixed(2)} km/s</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-0.5">
            <span className="text-[10px] font-mono text-[var(--ink-3)] flex items-center gap-1">
              <Eye className="w-3 h-3 text-emerald-400" /> {language === 'it' ? 'Ampiezza Scansione' : 'Swath Width'}
            </span>
            <span className="text-sm font-mono font-bold text-emerald-400">
              {satellite.swathWidthKm} km
            </span>
            <span className="text-[10px] text-[var(--ink-2)]">{language === 'it' ? 'Impronta a terra' : 'Ground footprint'}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-0.5">
            <span className="text-[10px] font-mono text-[var(--ink-3)] flex items-center gap-1">
              <Compass className="w-3 h-3 text-amber-400" /> {language === 'it' ? 'Inclinazione / Azimut' : 'Inclination / Azimuth'}
            </span>
            <span className="text-sm font-mono font-bold text-[var(--ink)]">
              {satellite.inclinationDeg}° · {satellite.heading}°
            </span>
            <span className="text-[10px] text-[var(--ink-2)]">{language === 'it' ? 'Traccia discendente' : 'Descending track'}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-0.5 col-span-2">
            <span className="text-[10px] font-mono text-[var(--ink-3)]">
              {language === 'it' ? 'Passaggio sopra Venezia (Lat 45.438°, Lon 12.335°)' : 'Pass over Venice (Lat 45.438°, Lon 12.335°)'}
            </span>
            <span className="text-xs font-semibold text-fuchsia-300">
              {satellite.nextPassVenice}
            </span>
            <span className="text-[10px] text-[var(--ink-2)]">
              {language === 'it' ? "Elevazione max sull'orizzonte:" : 'Max elevation over horizon:'} <strong>{satellite.maxElevationDeg}°</strong> · {language === 'it' ? 'Durata:' : 'Duration:'} ~{Math.round(satellite.passDurationSeconds / 60)} min
            </span>
          </div>
        </div>

        {/* Open Data Sources & Verification Link */}
        <div className="p-3 rounded-xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--ink-3)] font-mono">{t('common.officialSource')}</span>
            <span className="font-mono font-bold text-fuchsia-400">{satellite.openDataSource}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-[var(--rule)]/60">
            <span className="text-[11px] text-[var(--ink-2)]">{language === 'it' ? 'Catalogo API aperta: TLE / STAC / OData' : 'Open API Catalog: TLE / STAC / OData'}</span>
            <a
              href={satellite.apiLink}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <span>{language === 'it' ? 'Accedi ai Dati Satellitari' : 'Access Satellite Data'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--rule)] text-xs text-[var(--ink-3)]">
          <span className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Copernicus EGMS & Sentinel Online
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-fuchsia-600 text-white font-medium hover:bg-fuchsia-500 transition-all cursor-pointer shadow-lg shadow-fuchsia-600/20"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
