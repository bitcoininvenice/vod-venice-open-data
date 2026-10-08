'use client';

import React from 'react';
import {
  X,
  Video,
  Eye,
  ShieldAlert,
  ExternalLink,
  Play,
  Compass,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { VeniceCameraItem } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge';
import { useDialogA11y } from '@/components/ui/useDialogA11y';

interface CameraDetailModalProps {
  camera: VeniceCameraItem | null;
  onClose: () => void;
}

export const CameraDetailModal: React.FC<CameraDetailModalProps> = ({ camera, onClose }) => {
  const { language, t } = useTranslation();
  const panelRef = useDialogA11y(camera !== null, onClose);

  if (!camera) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="camera-modal-title"
        tabIndex={-1}
        className="glass-panel w-full max-w-2xl rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 border border-cyan-500/40 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto outline-none"
      >
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
                    Webcam
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> CCTV Video Monitoraggio Urbano
                  </span>
                )}
                {camera.source === 'ANOPTICON_CIVIC' && <ProvenanceBadge kind="community" />}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--rule)]/60 text-[var(--ink-2)] border border-[var(--rule)]">
                  {camera.typeLabel}
                </span>
              </div>
              <h3 id="camera-modal-title" className="text-lg font-bold text-[var(--ink)] leading-snug mt-1">
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

        {/* LIVE WEBCAM: solo collegamento alla pagina ufficiale del fornitore (nessun proxy o hotlink delle immagini) */}
        {camera.hasLiveFeed ? (
          <div className="rounded-xl border border-cyan-500/40 bg-gradient-to-b from-cyan-950/20 to-[var(--ground)]/70 p-4 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">
                {language === 'it' ? 'Diretta disponibile sul sito del fornitore' : 'Live stream available on the provider website'}
              </p>
              <p className="text-xs text-[var(--ink-2)] max-w-md mt-1 leading-relaxed">
                {language === 'it'
                  ? `Le immagini sono di proprietà di ${camera.operator} e vengono visualizzate esclusivamente sulla pagina ufficiale, nel rispetto dei termini d'uso del fornitore.`
                  : `Images are owned by ${camera.operator} and are shown only on the official page, in compliance with the provider's terms of use.`}
              </p>
            </div>
            {camera.streamPageUrl && (
              <a
                href={camera.streamPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                {language === 'it' ? 'Apri la diretta ufficiale' : 'Open the official stream'}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        ) : (
          /* CCTV PRIVACY TRANSPARENCY NOTICE */
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 sm:p-4 flex items-start gap-3 text-xs">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <strong className="text-amber-300 text-xs">
                {language === 'it'
                  ? 'Video Monitoraggio Urbano a Circuito Chiuso (CCTV)'
                  : 'Closed-Circuit Urban Monitoring (CCTV)'}
              </strong>
              <p className="text-[11px] leading-relaxed text-[var(--ink-2)]">
                {language === 'it'
                  ? 'Le telecamere di videosorveglianza non hanno un flusso video pubblico (Regolamento UE 2016/679 - GDPR). Posizione, tipologia e cartello informativo provengono dalla mappatura collaborativa Anopticon e non sono verificati da un ente: il titolare effettivo dell’impianto non è noto.'
                  : 'Surveillance cameras have no public video feed (EU GDPR). Position, type and privacy sign come from the Anopticon community mapping and are not verified by any authority: the actual owner of the system is unknown.'}
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
