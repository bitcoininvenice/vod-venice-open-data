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
  MapPin,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  SlidersHorizontal,
  Eye,
  EyeOff
} from 'lucide-react';

export type MapPresetType = 'mobility' | 'lagoon' | 'city' | 'satellites' | 'clean' | 'all';

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
      badge: 'BENVENUTO',
      title: 'Benvenuto in Venice Open Data',
      subtitle: 'Il Digital Twin geospaziale della Laguna di Venezia',
      icon: <Compass className="w-6 h-6 text-cyan-400" />,
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-[var(--ink-2)]">
          <p>
            VOD è una piattaforma cartografica ad alte prestazioni che incrocia in tempo reale oltre <strong className="text-[var(--ink)]">40 fonti Open Data certificate</strong> su Venezia centro storico, la Laguna e la Terraferma.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
            <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-1">
              <span className="text-cyan-400 font-bold">🌊 Laguna, Maree & Subsidenza</span>
              <span>CPSM, barriere MOSE, radar InSAR Copernicus EGMS e fondali.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col gap-1">
              <span className="text-emerald-400 font-bold">🚤 Mobilità, Canali & Treni</span>
              <span>ACTV, Alilaguna, Barcavelox, franchi ponti, navi AIS e treni RFI.</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200">
            💡 <strong>Mappa pulita di default:</strong> All'inizio troverai la mappa vettoriale pulita: decidi tu quali livelli attivare per un'esplorazione chiara, fluida e senza distrazioni.
          </div>
        </div>
      )
    },
    // Step 1: How to use filters & layers
    {
      badge: 'LIVELLI & FILTRI',
      title: 'Componi la Mappa a Tuo Piacimento',
      subtitle: 'Attiva e spegni i dati dal pannello laterale',
      icon: <Layers className="w-6 h-6 text-amber-400" />,
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-[var(--ink-2)]">
          <p>
            Usa il pannello <strong className="text-[var(--ink)]">"Livelli & Filtri"</strong> a sinistra per attivare le informazioni d'interesse:
          </p>
          <div className="space-y-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex items-start gap-2.5">
              <span className="p-1 rounded-lg bg-sky-500/20 text-sky-400 font-bold">1</span>
              <div>
                <strong className="text-[var(--ink)]">Mobilità Acquea & Terrestre:</strong> Vaporetti ACTV live, navette Alilaguna, treni RFI su Ponte della Libertà, limiti di velocità canali (Barcavelox), altezze libere ponti vs marea e stazi gondole.
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex items-start gap-2.5">
              <span className="p-1 rounded-lg bg-blue-500/20 text-blue-400 font-bold">2</span>
              <div>
                <strong className="text-[var(--ink)]">Laguna, Ambiente & Morfologia:</strong> Barriere MOSE, passerelle acqua alta, briccole di canale, barene Natura 2000, vento Scirocco/Bora e subsidenza radar InSAR Sentinel-1.
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex items-start gap-2.5">
              <span className="p-1 rounded-lg bg-purple-500/20 text-purple-400 font-bold">3</span>
              <div>
                <strong className="text-[var(--ink)]">Città, Patrimonio & Salute:</strong> I Nizioleti tradizionali, vere da pozzo storiche, campanili pendenti, idroambulanze SUEM 118, defibrillatori DAE, farmacie e isole di calore satellitari.
              </div>
            </div>
          </div>
        </div>
      )
    },
    // Step 2: Interactive preset selection
    {
      badge: 'CONFIGURAZIONE RAPIDA',
      title: 'Scegli la Vista di Partenza',
      subtitle: 'Puoi partire con la mappa pulita o con un preset tematico',
      icon: <Sparkles className="w-6 h-6 text-emerald-400" />,
      content: (
        <div className="flex flex-col gap-2.5 text-xs">
          <p className="text-[var(--ink-2)]">
            Seleziona una configurazione iniziale con cui iniziare l'esplorazione:
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
                  <EyeOff className="w-3.5 h-3.5" /> Mappa Pulita (Consigliato)
                </span>
                {selectedPreset === 'clean' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
              </div>
              <span className="text-[11px] leading-tight text-[var(--ink-2)]">
                Zero icone. Esplora la geografia della Laguna e accendi manualmente i livelli che preferisci.
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
                  <Ship className="w-3.5 h-3.5" /> Mobilità & Canali
                </span>
                {selectedPreset === 'mobility' && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
              </div>
              <span className="text-[11px] leading-tight text-[var(--ink-2)]">
                Vaporetti ACTV in movimento, battelli Alilaguna e navi mercantili/crociere AIS.
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
                  <Waves className="w-3.5 h-3.5" /> Laguna & Maree
                </span>
                {selectedPreset === 'lagoon' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
              </div>
              <span className="text-[11px] leading-tight text-[var(--ink-2)]">
                Barriere MOSE, passerelle per l'acqua alta, piattaforma CNR e briccole con fanali.
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
                  <Satellite className="w-3.5 h-3.5" /> Satelliti & Radar SAR
                </span>
                {selectedPreset === 'satellites' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
              </div>
              <span className="text-[11px] leading-tight text-[var(--ink-2)]">
                Tracce orbitali Sentinel-1/2, COSMO-SkyMed, scansioni radar e Stazione Spaziale ISS.
              </span>
            </button>
          </div>
        </div>
      )
    },
    // Step 3: Timeline & Controls
    {
      badge: 'CONTROLLI TEMPO REALE',
      title: 'Timeline 24h & Modalità Live',
      subtitle: 'Viaggia nel tempo o resta sincronizzato al secondo',
      icon: <Clock className="w-6 h-6 text-blue-400" />,
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-[var(--ink-2)]">
          <p>
            In basso al centro trovi la barra di controllo temporale:
          </p>
          <div className="space-y-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex items-center justify-between">
              <span className="text-[var(--ink)]">🔴 <strong>Modalità ORA LIVE:</strong></span>
              <span className="text-cyan-400 font-mono">1:1 Orario Reale di Venezia</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex items-center justify-between">
              <span className="text-[var(--ink)]">⏩ <strong>Scrubber & Velocità:</strong></span>
              <span className="text-amber-400 font-mono">Fino a 30x orario programmato</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--rule)]/30 border border-[var(--rule)] flex items-center justify-between">
              <span className="text-[var(--ink)]">📅 <strong>Calendario Feriale / Festivo:</strong></span>
              <span className="text-emerald-400 font-mono">Orari GTFS ufficiali ACTV</span>
            </div>
          </div>
          <p className="text-[11px] text-[var(--ink-3)] pt-1">
            Puoi riaprire questa guida in qualsiasi momento cliccando sul tasto <strong>❓ Guida</strong> nella barra superiore.
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
            <div className="p-2.5 rounded-xl bg-[var(--rule)]/40 border border-[var(--rule)]">
              {step.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold uppercase">
                  {step.badge}
                </span>
                <span className="text-[10px] font-mono text-[var(--ink-3)]">
                  Passo {currentStep + 1} di {steps.length}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold leading-tight mt-0.5">
                {step.title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleFinish('clean')}
            className="p-1.5 rounded-lg hover:bg-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
            title="Chiudi tutorial"
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
                title={`Vai al passo ${idx + 1}`}
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
                <span>Indietro</span>
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => s + 1)}
                className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer flex items-center gap-1"
              >
                <span>Avanti</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleFinish(selectedPreset)}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Inizia Esplorazione</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
