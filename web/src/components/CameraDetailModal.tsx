'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Video,
  Eye,
  Shield,
  ShieldAlert,
  ExternalLink,
  Play,
  RotateCcw,
  Compass,
  Building2,
  Info,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { VeniceCameraItem } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

interface CameraDetailModalProps {
  camera: VeniceCameraItem | null;
  onClose: () => void;
}

export const CameraDetailModal: React.FC<CameraDetailModalProps> = ({ camera, onClose }) => {
  const { language, t } = useTranslation();
  const [isStreamActive, setIsStreamActive] = useState<boolean>(false);

  useEffect(() => {
    setIsStreamActive(false);
  }, [camera?.id]);

  if (!camera) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 border border-cyan-500/40 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--rule)] pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 ${
                camera.hasLiveFeed
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/25'
                  : 'bg-gradient-to-br from-slate-600 to-zinc-700 shadow-zinc-500/20'
              }`}
            >
              {camera.hasLiveFeed ? <Video className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {camera.hasLiveFeed ? (
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    {camera.feedType === 'IMAGE_SNAPSHOT_15M'
                      ? language === 'it'
                        ? 'Scatto Maree 15m'
                        : 'Tide Snapshot 15m'
                      : 'Live Stream 24/7'}
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> CCTV Sorveglianza Urbana
                  </span>
                )}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--rule)]/60 text-[var(--ink-2)] border border-[var(--rule)]">
                  {camera.typeLabel}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[var(--ink)] leading-snug mt-1">
                {camera.name}
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

        {/* Location & Target Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-1">
            <span className="text-[10px] font-mono text-[var(--ink-3)] uppercase flex items-center gap-1">
              <Building2 className="w-3 h-3 text-cyan-400" />{' '}
              {language === 'it' ? 'Ubicazione & Sestiere' : 'Location & District'}
            </span>
            <span className="font-semibold text-[var(--ink)]">{camera.location}</span>
            <span className="text-[11px] font-mono text-cyan-400">{camera.sestiere}</span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-1">
            <span className="text-[10px] font-mono text-[var(--ink-3)] uppercase flex items-center gap-1">
              <Compass className="w-3 h-3 text-amber-400" />{' '}
              {language === 'it' ? 'Inquadratura & Obiettivo' : 'Field of View & Target'}
            </span>
            <span className="font-medium text-[var(--ink)] leading-tight">{camera.targetDescription}</span>
            {camera.bearingDeg !== undefined && (
              <span className="text-[10px] font-mono text-[var(--ink-3)]">
                Orientamento: {camera.bearingDeg}° {camera.fovDeg ? `(ampiezza ${camera.fovDeg}°)` : ''}
              </span>
            )}
          </div>
        </div>

        {/* ON-DEMAND STREAM BOX (CLICK-TO-LOAD) */}
        {camera.hasLiveFeed ? (
          <div className="rounded-xl border border-cyan-500/40 bg-gradient-to-b from-cyan-950/20 to-[var(--ground)]/70 p-3 sm:p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                {language === 'it' ? 'Flusso Video & Immagine in Tempo Reale' : 'Real-time Video & Imagery Stream'}
              </span>
              <span className="text-[10px] font-mono text-[var(--ink-3)]">
                {language === 'it' ? 'Caricamento On-Demand' : 'On-Demand Loading'}
              </span>
            </div>

            {!isStreamActive ? (
              <div className="p-4 rounded-xl border border-[var(--rule)] bg-[var(--rule)]/20 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
                  <Play className="w-6 h-6 ml-0.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--ink)]">
                    {language === 'it'
                      ? 'Streaming disponibile per questa postazione'
                      : 'Live streaming available for this camera'}
                  </p>
                  <p className="text-[11px] text-[var(--ink-2)] max-w-md mt-0.5">
                    {language === 'it'
                      ? 'Per preservare le prestazioni della mappa e rispettare i termini d’uso del provider, il player viene caricato solo su tua richiesta.'
                      : 'To preserve map performance and honor provider terms, the video player is only loaded upon explicit request.'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={() => setIsStreamActive(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-600/20"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {language === 'it' ? 'Apri Webcam Live' : 'Open Live Webcam'}
                  </button>

                  {camera.streamPageUrl && (
                    <a
                      href={camera.streamPageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-[var(--rule)] hover:bg-[var(--rule)]/80 text-[var(--ink)] text-xs font-mono flex items-center gap-1.5 transition-all"
                    >
                      {language === 'it' ? 'Sito Ufficiale' : 'Official Page'}{' '}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {camera.feedType === 'YOUTUBE_LIVE' && camera.streamEmbedUrl ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-cyan-500/40 bg-black">
                    <iframe
                      src={`${camera.streamEmbedUrl}?autoplay=1&mute=1`}
                      title={camera.name}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>
                ) : camera.feedType === 'IMAGE_SNAPSHOT_15M' && camera.snapshotUrl ? (
                  <div className="relative w-full rounded-xl overflow-hidden border border-cyan-500/40 bg-black flex flex-col items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${camera.snapshotUrl}?t=${Date.now()}`}
                      alt={camera.name}
                      className="w-full max-h-72 object-cover rounded-xl"
                    />
                    <span className="text-[10px] font-mono text-cyan-300 py-1">
                      {language === 'it' ? 'Fotogramma Centro Maree CPSM' : 'CPSM Tide Center Snapshot'}
                    </span>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/30 text-center flex flex-col gap-2">
                    <p className="text-xs text-[var(--ink)]">
                      {language === 'it'
                        ? 'Flusso live erogato sul portale dedicato:'
                        : 'Live stream available on provider portal:'}
                    </p>
                    {camera.streamPageUrl && (
                      <a
                        href={camera.streamPageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-medium mx-auto"
                      >
                        {camera.operator} <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-[var(--ink-3)] font-mono">
                    Provider: {camera.operator}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsStreamActive(false)}
                    className="text-amber-400 hover:underline flex items-center gap-1 font-mono cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {language === 'it' ? 'Chiudi player (risparmia banda)' : 'Close player (save data)'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* CCTV PRIVACY TRANSPARENCY NOTICE */
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 sm:p-4 flex items-start gap-3 text-xs">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <strong className="text-amber-300 text-xs">
                {language === 'it'
                  ? 'Videosorveglianza Urbana a Circuito Chiuso (CCTV)'
                  : 'Closed-Circuit Urban Surveillance (CCTV)'}
              </strong>
              <p className="text-[11px] leading-relaxed text-[var(--ink-2)]">
                {language === 'it'
                  ? 'Il flusso video di questa telecamera è per legge riservato alla centrale operativa delle Forze dell’Ordine e della Polizia Locale (ex Provv. Garante Privacy e Regolamento UE 2016/679 - GDPR). Le immagini non sono accessibili al pubblico per proteggere la riservatezza e i dati personali dei passanti.'
                  : 'Under EU GDPR and Italian Privacy Authority regulations, raw CCTV footage is restricted to law enforcement and municipal control rooms. Live video is not publicly accessible to protect citizen and pedestrian privacy.'}
              </p>
            </div>
          </div>
        )}

        {/* Technical Metadata Grid */}
        <div className="p-3 rounded-xl bg-[var(--rule)]/25 border border-[var(--rule)] text-xs flex flex-col gap-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div>
              <span className="text-[10px] text-[var(--ink-3)] font-mono block">
                {language === 'it' ? 'Titolare / Gestore' : 'Operator / Owner'}
              </span>
              <strong className="text-[var(--ink)] text-xs truncate block">{camera.operator}</strong>
            </div>

            <div>
              <span className="text-[10px] text-[var(--ink-3)] font-mono block">
                {language === 'it' ? 'Cartello Informativa' : 'Privacy Sign'}
              </span>
              {camera.privacyNoticeStatus === 'PRESENTE' ? (
                <span className="text-emerald-400 font-mono text-[11px] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Presente
                </span>
              ) : camera.privacyNoticeStatus === 'ASSENTE' ? (
                <span className="text-red-400 font-mono text-[11px] font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Assente
                </span>
              ) : camera.privacyNoticeStatus === 'INCOMPLETA' ? (
                <span className="text-amber-400 font-mono text-[11px] font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Incompleta
                </span>
              ) : (
                <span className="text-cyan-400 font-mono text-[11px]">Non richiesta</span>
              )}
            </div>

            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] text-[var(--ink-3)] font-mono block">
                {language === 'it' ? 'Fonte Mappatura' : 'Mapping Source'}
              </span>
              <a
                href={camera.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline font-mono text-[11px] flex items-center gap-1 truncate"
              >
                {camera.sourceLabel} <ExternalLink className="w-2.5 h-2.5 shrink-0" />
              </a>
            </div>
          </div>

          {camera.notes && (
            <p className="text-[11px] text-[var(--ink-2)] border-t border-[var(--rule)] pt-2 italic">
              {camera.notes}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--rule)] text-xs text-[var(--ink-3)]">
          <span className="truncate max-w-[65%]">
            ID: <code className="text-cyan-400 font-mono">{camera.id}</code> ({camera.lat.toFixed(5)}, {camera.lon.toFixed(5)})
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[var(--rule)] hover:bg-[var(--rule)]/80 text-[var(--ink)] font-medium transition-all cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
