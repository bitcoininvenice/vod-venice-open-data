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
  ExternalLink
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

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

  if (!isOpen) return null;

  const handleFinish = (preset: MapPresetType = selectedPreset) => {
    try {
      localStorage.setItem('vod_onboarding_completed', 'true');
    } catch {
      // localStorage may fail in private mode
    }
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
              <>VOD è una piattaforma cartografica ad alte prestazioni che incrocia in tempo reale oltre <strong className="text-[var(--ink)]">40 fonti Open Data certificate</strong> su Venezia centro storico, la Laguna e la Terraferma.</>
            ) : (
              <>VOD is a high-performance mapping platform that intersects over <strong className="text-[var(--ink)]">40 certified Open Data sources</strong> in real time across Venice historic center, Lagoon, and Mainland.</>
            )}
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
            <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-1">
              <span className="text-cyan-400 font-bold">🌊 {language === 'it' ? 'Laguna, Maree & Subsidenza' : 'Lagoon, Tides & Subsidence'}</span>
              <span>{language === 'it' ? 'CPSM, barriere MOSE, radar InSAR Copernicus EGMS e fondali.' : 'CPSM, MOSE storm gates, Copernicus EGMS InSAR radar and bathymetry.'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-1">
              <span className="text-emerald-400 font-bold">🚤 {language === 'it' ? 'Mobilità, Canali & Treni' : 'Mobility, Canals & Rail'}</span>
              <span>{language === 'it' ? 'ACTV, Alilaguna, Barcavelox, franchi ponti, navi AIS e treni RFI.' : 'ACTV, Alilaguna, Barcavelox, bridge clearance, AIS vessels and trains.'}</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200">
            💡 <strong>{language === 'it' ? 'Mappa pulita di default:' : 'Clean map by default:'}</strong>{' '}
            {language === 'it'
              ? "All'inizio troverai la mappa vettoriale pulita: decidi tu quali livelli attivare per un'esplorazione chiara, fluida e senza distrazioni."
              : 'You will find a clean vector map at start: choose which layers to toggle for a crisp, focused exploration.'}
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
            {language === 'it' ? 'Usa il pannello laterale per attivare le informazioni d\'interesse:' : 'Use the side panel to toggle the layers of interest:'}
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
                <span>{language === 'it' ? 'Documentazione Completa dei Livelli' : 'Full Layers Documentation'}</span>
              </div>
              <a
                href="/layers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-mono text-[11px] font-semibold transition-colors"
                title={language === 'it' ? 'Apri catalogo livelli' : 'Open layers catalog'}
              >
                <span>/layers</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
              {language === 'it'
                ? 'Vuoi conoscere l\'origine e la precisione di ogni dato? Nel catalogo sono tracciati tutti i 43 livelli: fonte istituzionale, acquisizione (API vs locale) e natura temporale (sensori fisici in tempo reale, digital twin simulato su orari ufficiali o censimenti statici).'
                : 'Want to know data provenance and fidelity? The catalog tracks all 43 layers: official source, acquisition type (API vs local), and temporal regime (physical real-time sensors, scheduled digital twin, or static open data).'}
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
            {language === 'it' ? 'Seleziona una configurazione iniziale con cui iniziare l\'esplorazione:' : 'Select an initial setup to start exploring:'}
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
                  <EyeOff className="w-3.5 h-3.5" /> {language === 'it' ? 'Mappa Pulita (Consigliato)' : 'Clean Map (Recommended)'}
                </span>
                {selectedPreset === 'clean' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
              </div>
              <span className="text-[11px] leading-tight text-[var(--ink-2)]">
                {language === 'it'
                  ? 'Zero icone. Esplora la geografia della Laguna e accendi manualmente i livelli che preferisci.'
                  : 'Zero icons. Explore the lagoon geography and manually toggle the layers you prefer.'}
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
                {language === 'it'
                  ? 'Vaporetti ACTV in movimento, battelli Alilaguna e navi mercantili/crociere AIS.'
                  : 'Moving ACTV waterbuses, Alilaguna airport shuttles, and AIS commercial/cruise ships.'}
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
                {language === 'it'
                  ? 'Barriere MOSE, passerelle per l\'acqua alta, piattaforma CNR e anemometri.'
                  : 'MOSE flood barriers, high water walkways, CNR research platform, and wind anemometers.'}
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
                {language === 'it'
                  ? 'Tracce orbitali Sentinel-1/2, COSMO-SkyMed, scansioni radar e Stazione Spaziale ISS.'
                  : 'Orbital ground tracks of Sentinel-1/2, COSMO-SkyMed radar, and International Space Station ISS.'}
              </span>
            </button>
          </div>
        </div>
      )
    },
    // Step 3: Timeline & Controls
    {
      badge: language === 'it' ? 'CONTROLLI TEMPO REALE' : 'REAL-TIME CONTROLS',
      title: language === 'it' ? 'Timeline 24h & Modalità Live' : '24h Timeline & Live Mode',
      subtitle: language === 'it' ? 'Viaggia nel tempo o resta sincronizzato al secondo' : 'Travel in time or stay synchronized to the second',
      icon: <Clock className="w-6 h-6 text-blue-400" />,
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-[var(--ink-2)]">
          <p>
            {language === 'it' ? 'In basso al centro trovi la barra di controllo temporale:' : 'At the bottom center you will find the time control bar:'}
          </p>
          <div className="space-y-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex items-center justify-between">
              <span className="text-[var(--ink)]">🔴 <strong>{language === 'it' ? 'Modalità ORA LIVE:' : 'LIVE NOW Mode:'}</strong></span>
              <span className="text-cyan-400 font-mono">{language === 'it' ? '1:1 Orario Reale di Venezia' : '1:1 Real Venice Time'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex items-center justify-between">
              <span className="text-[var(--ink)]">⏩ <strong>{language === 'it' ? 'Scrubber & Velocità:' : 'Scrubber & Speed:'}</strong></span>
              <span className="text-amber-400 font-mono">{language === 'it' ? 'Fino a 720x orario programmato' : 'Up to 720x speed'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex items-center justify-between">
              <span className="text-[var(--ink)]">📅 <strong>{language === 'it' ? 'Calendario Feriale / Festivo:' : 'Weekday / Holiday Calendar:'}</strong></span>
              <span className="text-emerald-400 font-mono">{language === 'it' ? 'Orari GTFS ufficiali ACTV' : 'Official ACTV GTFS schedules'}</span>
            </div>
          </div>
          <p className="text-[11px] text-[var(--ink-3)] pt-1">
            {language === 'it'
              ? 'Puoi riaprire questa guida in qualsiasi momento cliccando sul tasto ❓ Guida nella barra superiore.'
              : 'You can reopen this guide anytime by clicking the ❓ Guide button in the top navigation bar.'}
          </p>
        </div>
      )
    }
  ];

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[var(--surface)] text-[var(--ink)] border border-[var(--rule)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
              <h3 className="text-base sm:text-lg font-bold text-[var(--ink)] leading-tight">
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
                title={`${language === 'it' ? 'Vai al passo' : 'Go to step'} ${idx + 1}`}
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
