'use client';

import React from 'react';
import { X, Satellite, Orbit, Radio, ExternalLink, Zap, Eye, Compass, ShieldCheck } from 'lucide-react';
import { SatelliteItem } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge';
import { useDialogA11y } from '@/components/ui/useDialogA11y';

interface SatelliteDetailModalProps {
  satellite: SatelliteItem | null;
  onClose: () => void;
}

export const SatelliteDetailModal: React.FC<SatelliteDetailModalProps> = ({
  satellite,
  onClose
}) => {
  const { t } = useTranslation();
  const panelRef = useDialogA11y(satellite !== null, onClose);
  if (!satellite) return null;
  // Traccia a terra verso sud = discendente, verso nord = ascendente
  const descending = satellite.heading > 90 && satellite.heading < 270;

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
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="satellite-modal-title"
        tabIndex={-1}
        className="glass-panel w-full max-w-lg rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-3.5 sm:gap-4 border border-fuchsia-500/40 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto outline-none"
      >
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
                {satellite.tle ? (
                  <ProvenanceBadge kind="live" detail="TLE CelesTrak · SGP4" />
                ) : (
                  <ProvenanceBadge kind="static-reference" detail={t('ui.satellite.orbitaNonDisponibile')} />
                )}
              </div>
              <h3 id="satellite-modal-title" className="text-lg font-bold text-[var(--ink)] leading-snug">
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
              <Zap className="w-3.5 h-3.5" /> {t('ui.satellite.missioneRuoloScientificoSuVenezia')}
            </span>
            <span className="font-mono text-[10px] text-[var(--ink-3)]">NORAD ID: #{satellite.noradId}</span>
          </div>
          <p className="text-sm font-medium text-[var(--ink)] leading-relaxed">
            {satellite.missionTarget}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-mono text-[var(--ink-2)] bg-[var(--rule)]/60 px-2 py-0.5 rounded-md">
              {t('ui.satellite.sensore')} <strong className="text-[var(--ink)]">{satellite.sensor}</strong>
            </span>
            <span className="text-[11px] font-mono text-[var(--ink-2)] bg-[var(--rule)]/60 px-2 py-0.5 rounded-md">
              {t('ui.satellite.risoluzione')} <strong className="text-fuchsia-400">{satellite.resolution}</strong>
            </span>
          </div>
        </div>

        {/* Orbital Mechanics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-0.5">
            <span className="text-[10px] font-mono text-[var(--ink-3)] flex items-center gap-1">
              <Orbit className="w-3 h-3 text-cyan-400" /> {t('ui.satellite.quotaOrbitale')}
            </span>
            <span className="text-sm font-mono font-bold text-[var(--ink)]">
              {satellite.altitudeKm.toLocaleString()} km
            </span>
            <span className="text-[10px] text-[var(--ink-2)]">{satellite.altitudeKm > 2000 ? 'MEO Orbit' : 'LEO Low Orbit'}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-0.5">
            <span className="text-[10px] font-mono text-[var(--ink-3)] flex items-center gap-1">
              <Radio className="w-3 h-3 text-fuchsia-400" /> {t('ui.satellite.velocitaOrbitale')}
            </span>
            <span className="text-sm font-mono font-bold text-[var(--ink)]">
              {satellite.speedKmh.toLocaleString()} km/h
            </span>
            <span className="text-[10px] text-[var(--ink-2)]">{(satellite.speedKmh / 3600).toFixed(2)} km/s</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-0.5">
            <span className="text-[10px] font-mono text-[var(--ink-3)] flex items-center gap-1">
              <Eye className="w-3 h-3 text-emerald-400" /> {t('ui.satellite.ampiezzaScansione')}
            </span>
            <span className="text-sm font-mono font-bold text-emerald-400">
              {satellite.swathWidthKm} km
            </span>
            <span className="text-[10px] text-[var(--ink-2)]">{t('ui.satellite.improntaTerra')}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-0.5">
            <span className="text-[10px] font-mono text-[var(--ink-3)] flex items-center gap-1">
              <Compass className="w-3 h-3 text-amber-400" /> {t('ui.satellite.inclinazioneAzimut')}
            </span>
            <span className="text-sm font-mono font-bold text-[var(--ink)]">
              {satellite.inclinationDeg}° · {satellite.heading}°
            </span>
            <span className="text-[10px] text-[var(--ink-2)]">
              {descending ? (t('ui.satellite.tracciaDiscendenteVersoSud')) : (t('ui.satellite.tracciaAscendenteVersoNord'))}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-0.5 col-span-2">
            <span className="text-[10px] font-mono text-[var(--ink-3)]">
              {t('ui.satellite.passaggioSopraVeneziaLat45')}
            </span>
            <span className="text-xs font-semibold text-fuchsia-300">
              {satellite.isPassingNow ? (t('ui.satellite.transitoOra')) : ''}
              {satellite.nextPassVenice}
            </span>
            <span className="text-[10px] text-[var(--ink-2)]">
              {t('ui.satellite.elevazioneMaxSullOrizzonte')} <strong>{satellite.maxElevationDeg}°</strong> · {t('ui.satellite.durata')} ~{Math.round(satellite.passDurationSeconds / 60)} min
            </span>
          </div>
        </div>

        {satellite.tleEpoch && (
          <p className="text-[10px] font-mono text-[var(--ink-3)] -mt-1">
            {t('ui.satellite.elementiOrbitaliTle')}{' '}
            {new Date(satellite.tleEpoch).toLocaleString('it-IT', { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            {' · '}
            {t('ui.satellite.elevazioneMinima10')}
          </p>
        )}

        {/* Open Data Sources & Verification Link */}
        <div className="p-3 rounded-xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--ink-3)] font-mono">{t('common.officialSource')}</span>
            <span className="font-mono font-bold text-fuchsia-400">{satellite.openDataSource}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-[var(--rule)]/60">
            <span className="text-[11px] text-[var(--ink-2)]">{t('ui.satellite.catalogoApiApertaTleStac')}</span>
            <a
              href={satellite.apiLink}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <span>{t('ui.satellite.accediAiDatiSatellitari')}</span>
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
