'use client';

import React, { useState } from 'react';
import {
  X,
  Compass,
  Layers,
  Clock,
  CheckCircle2,
  Ship,
  Waves,
  Satellite,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  EyeOff,
  BookOpen,
  ExternalLink,
  Lightbulb,
  Calendar,
  FastForward
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useDialogA11y } from '@/components/ui/useDialogA11y';

export type MapPresetType = 'mobility' | 'lagoon' | 'city' | 'satellites' | 'regional' | 'clean' | 'all';

interface OnboardingTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: MapPresetType) => void;
}

export const OnboardingTutorialModal: React.FC<OnboardingTutorialModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset
}) => {
  const { language, t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedPreset, setSelectedPreset] = useState<MapPresetType>('clean');

  const panelRef = useDialogA11y(isOpen, onClose);
  if (!isOpen) return null;

  const handleFinish = (preset: MapPresetType = selectedPreset) => {
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
            {language === 'it' ? (
              <>VOD è una piattaforma cartografica che incrocia oltre <strong className="text-[var(--ink)]">40 livelli di dati</strong> su Venezia centro storico, la Laguna e la Terraferma: misure in tempo reale (maree, METAR, voli), mezzi pubblici simulati dagli orari ufficiali e censimenti statici. Ogni livello indica la propria fonte.</>
            ) : (
              <>VOD is a mapping platform that combines over <strong className="text-[var(--ink)]">40 data layers</strong> across Venice historic center, Lagoon, and Mainland: real-time measurements (tides, METAR, flights), public transport simulated from official timetables, and static reference data. Each layer states its source.</>
            )}
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
    // Step 1: How to use filters & layers
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
              {t('ui.onboarding.vuoiConoscereLOriginePrecisione')}
            </p>
          </div>
        </div>
      )
    },
    // Step 2: Interactive preset selection
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
            {/* Option 1: Clean */}
            <button
              type="button"
              onClick={() => setSelectedPreset('clean')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                selectedPreset === 'clean'
                  ? 'bg-cyan-500/15 border-cyan-500 text-[var(--ink)] shadow-md shadow-cyan-500/10'
                  : 'bg-[var(--rule)]/20 border-[var(--rule)] text-[var(--ink-2)] hover:border-[var(--ink-3)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-cyan-400 flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5" /> {t('ui.onboarding.mappaPulitaConsigliato')}
                </span>
                {selectedPreset === 'clean' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
              </div>
              <span className="text-[11px] leading-tight text-[var(--ink-2)]">
                {t('ui.onboarding.zeroIconeEsploraGeografiaLaguna')}
              </span>
            </button>

            {/* Option 2: Mobility */}
            <button
              type="button"
              onClick={() => setSelectedPreset('mobility')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                selectedPreset === 'mobility'
                  ? 'bg-teal-500/15 border-teal-500 text-[var(--ink)] shadow-md shadow-teal-500/10'
                  : 'bg-[var(--rule)]/20 border-[var(--rule)] text-[var(--ink-2)] hover:border-[var(--ink-3)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-teal-400 flex items-center gap-1.5">
                  <Ship className="w-3.5 h-3.5" /> {t('layers.presetMobility')}
                </span>
                {selectedPreset === 'mobility' && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
              </div>
              <span className="text-[11px] leading-tight text-[var(--ink-2)]">
                {t('ui.onboarding.vaporettiActvMovimentoBattelliAlilaguna')}
              </span>
            </button>

            {/* Option 3: Lagoon & Tide */}
            <button
              type="button"
              onClick={() => setSelectedPreset('lagoon')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                selectedPreset === 'lagoon'
                  ? 'bg-blue-500/15 border-blue-500 text-[var(--ink)] shadow-md shadow-blue-500/10'
                  : 'bg-[var(--rule)]/20 border-[var(--rule)] text-[var(--ink-2)] hover:border-[var(--ink-3)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-blue-400 flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5" /> {t('layers.presetLagoon')}
                </span>
                {selectedPreset === 'lagoon' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
              </div>
              <span className="text-[11px] leading-tight text-[var(--ink-2)]">
                {t('ui.onboarding.barriereMosePasserelleLAcqua')}
              </span>
            </button>

            {/* Option 4: Space & Earth Observation */}
            <button
              type="button"
              onClick={() => setSelectedPreset('satellites')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                selectedPreset === 'satellites'
                  ? 'bg-purple-500/15 border-purple-500 text-[var(--ink)] shadow-md shadow-purple-500/10'
                  : 'bg-[var(--rule)]/20 border-[var(--rule)] text-[var(--ink-2)] hover:border-[var(--ink-3)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-purple-400 flex items-center gap-1.5">
                  <Satellite className="w-3.5 h-3.5" /> {t('layers.presetSatellites')}
                </span>
                {selectedPreset === 'satellites' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
              </div>
              <span className="text-[11px] leading-tight text-[var(--ink-2)]">
                {t('ui.onboarding.tracceOrbitaliSentinel12')}
              </span>
            </button>
          </div>
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
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-modal-title"
        tabIndex={-1}
        className="bg-[var(--surface)] text-[var(--ink)] border border-[var(--rule)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] outline-none">
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
      </div>
    </div>
  );
};
