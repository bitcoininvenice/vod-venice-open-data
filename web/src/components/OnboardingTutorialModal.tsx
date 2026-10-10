'use client';

import React, { useState } from 'react';
import {
  X,
  Compass,
  Layers,
  Clock,
  CheckCircle2,
  Ship,
  Navigation,
  Wind,
  HeartPulse,
  Waves,
  Landmark,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  EyeOff,
  BookOpen,
  ExternalLink,
  Lightbulb,
  Calendar,
  FastForward,
  type LucideIcon
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { ALL_LAYER_KEYS } from '@/lib/urlLayers';
import { DEFAULT_PRESET, SCENARIO_PRESETS, type MapPreset } from '@/lib/layerState';
import { RichText } from './ui/RichText';
import { RegimeBadge } from './layerVisuals';
import { Modal } from '@/components/ui/Modal';


const PRESET_CARD: Record<MapPreset, { icon: LucideIcon; text: string; on: string }> = {
  muoversi: { icon: Navigation, text: 'text-sky-400', on: 'bg-sky-500/15 border-sky-500 text-[var(--ink)] shadow-md shadow-sky-500/10' },
  'acqua-alta': { icon: Waves, text: 'text-blue-400', on: 'bg-blue-500/15 border-blue-500 text-[var(--ink)] shadow-md shadow-blue-500/10' },
  ambiente: { icon: Wind, text: 'text-emerald-400', on: 'bg-emerald-500/15 border-emerald-500 text-[var(--ink)] shadow-md shadow-emerald-500/10' },
  servizi: { icon: HeartPulse, text: 'text-rose-400', on: 'bg-rose-500/15 border-rose-500 text-[var(--ink)] shadow-md shadow-rose-500/10' },
  citta: { icon: Landmark, text: 'text-amber-400', on: 'bg-amber-500/15 border-amber-500 text-[var(--ink)] shadow-md shadow-amber-500/10' },
  clean: { icon: EyeOff, text: 'text-cyan-400', on: 'bg-cyan-500/15 border-cyan-500 text-[var(--ink)] shadow-md shadow-cyan-500/10' },
};

interface OnboardingTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: MapPreset) => void;
}

export const OnboardingTutorialModal: React.FC<OnboardingTutorialModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedPreset, setSelectedPreset] = useState<MapPreset>(DEFAULT_PRESET);

  if (!isOpen) return null;

  const handleFinish = (preset: MapPreset = selectedPreset) => {
    onSelectPreset(preset);
    onClose();
  };

  const steps = [
    // Step 0: Welcome & Concept
    {
      badge: t('tutorial.step1Badge'),
      title: t('tutorial.step1Title'),
      subtitle: t('tutorial.step1Subtitle'),
      icon: <Compass className="w-6 h-6 text-cyan-400" />,
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-[var(--ink-2)]">
          <p>
            <RichText text={t('ui.onboarding.introBody', { n: ALL_LAYER_KEYS.length })} strongClassName="text-[var(--ink)]" />
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
            <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-1">
              <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5" />
                <span>{t('ui.onboarding.lagunaMareeSubsidenza')}</span>
              </span>
              <span>{t('ui.onboarding.cpsmBarriereMoseRadarInsar')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-1">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Ship className="w-3.5 h-3.5" />
                <span>{t('ui.onboarding.mobilitaCanaliTreni')}</span>
              </span>
              <span>{t('ui.onboarding.actvAlilagunaBarcaveloxFranchiPonti')}</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong>{t('ui.onboarding.mappaPulitaDefault')}</strong>{' '}
              {t('ui.onboarding.allInizioTroveraiMappaVettoriale')}
            </div>
          </div>
        </div>
      )
    },
    // Passo 2: pannello dei livelli, scheda informativa e legenda
    {
      badge: t('tutorial.step2Badge'),
      title: t('tutorial.step2Title'),
      subtitle: t('tutorial.step2Subtitle'),
      icon: <Layers className="w-6 h-6 text-amber-400" />,
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-[var(--ink-2)]">
          <p>
            {t('ui.onboarding.usaPannelloLateraleAttivareInformazioni')}
          </p>
          <div className="space-y-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex items-start gap-2.5">
              <span className="p-1 rounded-lg bg-sky-500/20 text-sky-400 font-bold">1</span>
              <div>
                {t('tutorial.itemMobility')}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex items-start gap-2.5">
              <span className="p-1 rounded-lg bg-blue-500/20 text-blue-400 font-bold">2</span>
              <div>
                {t('tutorial.itemLagoon')}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex items-start gap-2.5">
              <span className="p-1 rounded-lg bg-purple-500/20 text-purple-400 font-bold">3</span>
              <div>
                {t('tutorial.itemCity')}
              </div>
            </div>
          </div>

          {/* Come si usa il pannello, la scheda informativa e la legenda */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--ink-3)]">{t('ui.onboarding.howToTitle')}</span>
            <ul className="flex flex-col gap-1.5 text-[11px]">
              {(['howSearch', 'howGroups', 'howNature', 'howCard', 'howLegend'] as const).map((k) => (
                <li key={k} className="flex flex-col gap-1 pl-2.5 border-l-2 border-cyan-500/40">
                  <RichText text={t(`ui.onboarding.${k}`)} strongClassName="text-[var(--ink)]" />
                  {k === 'howNature' && (
                    <span className="flex flex-wrap gap-1">
                      {(['realtime', 'simulated', 'static', 'curated'] as const).map((r) => (
                        <RegimeBadge key={r} regime={r} />
                      ))}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Sezione Documentazione Trasparenza Dati /layers */}
          <div className="mt-1 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-400">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{t('ui.onboarding.documentazioneCompletaDeiLivelli')}</span>
              </div>
              <a
                href="/layers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-mono text-[11px] font-semibold transition-colors"
                title={t('ui.onboarding.apriCatalogoLivelli')}
              >
                <span>/layers</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
              {t('ui.onboarding.vuoiConoscereLOriginePrecisione', { n: ALL_LAYER_KEYS.length })}
            </p>
          </div>
        </div>
      )
    },
    // Passo 3: scelta dello scenario di partenza
    {
      badge: t('tutorial.step3Badge'),
      title: t('tutorial.step3Title'),
      subtitle: t('tutorial.step3Subtitle'),
      icon: <Sparkles className="w-6 h-6 text-emerald-400" />,
      content: (
        <div className="flex flex-col gap-2.5 text-xs">
          <p className="text-[var(--ink-2)]">
            {t('ui.onboarding.selezionaConfigurazioneInizialeConCui')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {[...SCENARIO_PRESETS, 'clean' as const].map((p) => {
              const style = PRESET_CARD[p];
              const Icon = style.icon;
              const selected = selectedPreset === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPreset(p)}
                  aria-pressed={selected}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    selected ? style.on : 'bg-[var(--rule)]/20 border-[var(--rule)] text-[var(--ink-2)] hover:border-[var(--ink-3)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-xs flex items-center gap-1.5 ${style.text}`}>
                      <Icon className="w-3.5 h-3.5" /> {t(`ui.presets.${p}`)}
                      {p === DEFAULT_PRESET && (
                        <span className="font-mono font-normal text-[9px] uppercase text-[var(--ink-3)]">· {t('ui.presets.recommended')}</span>
                      )}
                    </span>
                    {selected && <CheckCircle2 className={`w-4 h-4 ${style.text}`} />}
                  </div>
                  <span className="text-[11px] leading-tight text-[var(--ink-2)]">{t(`ui.presets.${p}Desc`)}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-[var(--ink-3)]">{t('ui.presets.verifiedOnly')}</p>
        </div>
      )
    },
    // Step 3: Timeline & Controls
    {
      badge: t('ui.onboarding.controlliTempoReale'),
      title: t('ui.onboarding.timeline24hModalitaLive'),
      subtitle: t('ui.onboarding.viaggiaNelTempoOResta'),
      icon: <Clock className="w-6 h-6 text-blue-400" />,
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-[var(--ink-2)]">
          <p>
            {t('ui.onboarding.bassoAlCentroTroviBarra')}
          </p>
          <div className="space-y-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex items-center justify-between">
              <span className="text-[var(--ink)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 motion-safe:animate-pulse" />
                <strong>{t('ui.onboarding.modalitaOraLive')}</strong>
              </span>
              <span className="text-cyan-400 font-mono">{t('ui.onboarding.n11OrarioRealeVenezia')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex items-center justify-between">
              <span className="text-[var(--ink)] flex items-center gap-2">
                <FastForward className="w-3.5 h-3.5 text-amber-400" />
                <strong>{t('ui.onboarding.scrubberVelocita')}</strong>
              </span>
              <span className="text-amber-400 font-mono">{t('ui.onboarding.fino720xOrarioProgrammato')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex items-center justify-between">
              <span className="text-[var(--ink)] flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <strong>{t('ui.onboarding.calendarioFerialeFestivo')}</strong>
              </span>
              <span className="text-emerald-400 font-mono">{t('ui.onboarding.orariGtfsUfficialiActv')}</span>
            </div>
          </div>
          <p className="text-[11px] text-[var(--ink-3)] pt-1">
            {t('ui.onboarding.puoiRiaprireQuestaGuidaQualsiasi')}
          </p>
        </div>
      )
    }
  ];

  const step = steps[currentStep];

  return (
    <Modal onClose={onClose} labelledBy="onboarding-modal-title" closeOnBackdrop={false} panelClassName="bg-[var(--surface)] text-[var(--ink)] border border-[var(--rule)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--rule)] flex items-center justify-between bg-black/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              {step.icon}
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider font-bold text-cyan-400 uppercase">
                {step.badge} ({currentStep + 1}/{steps.length})
              </span>
              <h3 id="onboarding-modal-title" className="text-base sm:text-lg font-bold text-[var(--ink)] leading-tight">
                {step.title}
              </h3>
              <p className="text-xs text-[var(--ink-3)] mt-0.5">
                {step.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--rule)] transition-all cursor-pointer"
            title={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {step.content}
        </div>

        {/* Progress Dots & Navigation Footer */}
        <div className="p-4 border-t border-[var(--rule)] flex items-center justify-between bg-black/10">
          {/* Step Indicators */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentStep === idx ? 'w-6 bg-cyan-400' : 'w-2 bg-[var(--rule)] hover:bg-[var(--ink-3)]'
                }`}
                title={`${t('ui.onboarding.vaiAlPasso')} ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => s - 1)}
                className="px-3 py-1.5 rounded-xl border border-[var(--rule)] text-xs font-medium text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--rule)] transition-all cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>{t('tutorial.back')}</span>
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => s + 1)}
                className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer flex items-center gap-1"
              >
                <span>{t('tutorial.next')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleFinish(selectedPreset)}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('tutorial.startExploring')}</span>
              </button>
            )}
          </div>
        </div>
    </Modal>
  );
};
