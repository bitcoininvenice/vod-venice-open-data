'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ExternalLink,
  ShieldCheck,
  Radio,
  Clock,
  Database,
  Ship,
  Waves,
  Landmark,
  Sparkles,
  Info,
  Gauge
} from 'lucide-react';
import { SiteFooter, SiteHeader } from '@/components/site/SiteChrome';
import { useTranslation } from '@/lib/i18n';
import { LAYER_CATALOG } from '@/lib/layerCatalog';

type LayerGroupKey = 'all' | 'mobility' | 'lagoon' | 'city';
type DataRegimeKey = 'all' | 'realtime' | 'simulated' | 'static' | 'curated';
type AcquisitionKey = 'all' | 'api' | 'local';


export default function LayersDocumentationPage() {
  const { language, t } = useTranslation();
  const [selectedGroup, setSelectedGroup] = useState<LayerGroupKey>('all');
  const [selectedRegime, setSelectedRegime] = useState<DataRegimeKey>('all');
  const [selectedAcquisition, setSelectedAcquisition] = useState<AcquisitionKey>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Statistics
  const totalLayers = LAYER_CATALOG.length;
  const realtimeLayers = LAYER_CATALOG.filter((l) => l.regime === 'realtime').length;
  const simulatedLayers = LAYER_CATALOG.filter((l) => l.regime === 'simulated').length;
  const staticLayers = LAYER_CATALOG.filter((l) => l.regime === 'static').length;
  const curatedLayers = LAYER_CATALOG.filter((l) => l.regime === 'curated').length;

  // Filtered layers
  const filteredLayers = useMemo(() => {
    return LAYER_CATALOG.filter((item) => {
      // Group filter
      if (selectedGroup !== 'all' && item.group !== selectedGroup) return false;

      // Regime filter
      if (selectedRegime !== 'all' && item.regime !== selectedRegime) return false;

      // Acquisition filter
      if (selectedAcquisition !== 'all' && item.acquisition !== selectedAcquisition) return false;

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName =
          item.nameIt.toLowerCase().includes(q) || item.nameEn.toLowerCase().includes(q);
        const matchesInst = item.institution.toLowerCase().includes(q);
        const matchesDesc =
          item.descriptionIt.toLowerCase().includes(q) ||
          item.descriptionEn.toLowerCase().includes(q);
        const matchesTech =
          item.technicalNotesIt.toLowerCase().includes(q) ||
          item.technicalNotesEn.toLowerCase().includes(q);

        if (!matchesName && !matchesInst && !matchesDesc && !matchesTech) return false;
      }

      return true;
    });
  }, [selectedGroup, selectedRegime, selectedAcquisition, searchQuery]);

  return (
    <div className="min-h-screen bg-[var(--ground)] text-[var(--ink)] flex flex-col justify-between selection:bg-cyan-500/30">
      {/* Top Navigation Bar */}
      <SiteHeader page="layers" subtitle={t('ui.layersPage.tracciamentoFontiIstituzionaliApiLive')} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* Hero Explanation Banner */}
        <section className="glass-panel rounded-3xl p-5 sm:p-6 border border-cyan-500/20 shadow-xl flex flex-col md:flex-row gap-6 items-start justify-between">
          <div className="flex flex-col gap-2 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-mono font-bold w-max border border-cyan-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('ui.layersPage.documentazioneDataLineageUfficiale')}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)]">
              {t('ui.layersPage.comeFunzionanoIDatiGeospaziali')}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-2)] leading-relaxed">
              {t('ui.layersPage.heroBody')}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 w-full md:w-auto shrink-0 font-mono text-center">
            <div className="p-3 rounded-2xl bg-[var(--rule)]/30 border border-[var(--rule)] flex flex-col">
              <span className="text-2xl font-bold text-[var(--ink)]">{totalLayers}</span>
              <span className="text-[10px] text-[var(--ink-3)] uppercase">{t('ui.layersPage.livelliTotali')}</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col">
              <span className="text-2xl font-bold text-emerald-400">{realtimeLayers}</span>
              <span className="text-[10px] text-emerald-300 uppercase">{t('ui.layersPage.tempoReale')}</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col">
              <span className="text-2xl font-bold text-amber-400">{simulatedLayers}</span>
              <span className="text-[10px] text-amber-300 uppercase">{t('ui.layersPage.digitalTwin')}</span>
            </div>
            <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex flex-col">
              <span className="text-2xl font-bold text-sky-400">{staticLayers}</span>
              <span className="text-[10px] text-sky-300 uppercase">{t('ui.layersPage.censimento')}</span>
            </div>
            <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex flex-col">
              <span className="text-2xl font-bold text-orange-400">{curatedLayers}</span>
              <span className="text-[10px] text-orange-300 uppercase">{t('ui.layersPage.curato')}</span>
            </div>
          </div>
        </section>

        {/* Legend Guide Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase font-mono">
              <Radio className="w-4 h-4 shrink-0 motion-safe:animate-pulse" />
              <span>{t('ui.layersPage.tempoRealeGenuinoSensori')}</span>
            </div>
            <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
              {t('ui.layersPage.datiIdrometriciAtmosfericiMariniMisurati')}
            </p>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase font-mono">
              <Clock className="w-4 h-4 shrink-0" />
              <span>{t('ui.layersPage.simulatoDigitalTwinOrariUfficiali')}</span>
            </div>
            <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
              {t('ui.layersPage.posizionamentoDeterministicoSincronizzat')}
            </p>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-sky-500/30 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase font-mono">
              <Database className="w-4 h-4 shrink-0" />
              <span>{t('ui.layersPage.censimentoStaticoOpenData')}</span>
            </div>
            <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
              {t('ui.layersPage.registriCartograficiPatrimonialiCertific')}
            </p>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-orange-500/30 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase font-mono">
              <Info className="w-4 h-4 shrink-0" />
              <span>{t('ui.layersPage.curatoLegendTitle')}</span>
            </div>
            <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
              {t('ui.layersPage.curatoLegendBody')}
            </p>
          </div>
        </section>

        {/* Search & Filter Toolbar */}
        <section className="glass-panel p-4 rounded-2xl border border-[var(--rule)] flex flex-col gap-3 shadow-sm">
          {/* Top row: Search input + Results count */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-[var(--ink-3)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  t('ui.layersPage.cercaNomeIstituzioneEsActv')
                }
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--rule)]/40 border border-[var(--rule)] text-xs text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-cyan-400 transition-all font-mono"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[var(--ink-2)] self-end sm:self-auto">
              <span>{t('ui.layersPage.risultatiTrovati')}</span>
              <strong className="text-cyan-400 font-bold text-sm">{filteredLayers.length}</strong>
              <span>/ {totalLayers}</span>
            </div>
          </div>

          {/* Bottom row: Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--rule)]/60 text-xs">
            {/* Filter by Group */}
            <div className="flex items-center gap-1 bg-[var(--rule)]/40 p-1 rounded-xl border border-[var(--rule)] overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono px-2 hidden lg:inline">
                {t('ui.layersPage.gruppo')}
              </span>
              {[
                { key: 'all', label: t('ui.layersPage.tuttiIGruppi') },
                { key: 'mobility', label: t('ui.layersPage.n1Mobilita') },
                { key: 'lagoon', label: t('ui.layersPage.n2Laguna') },
                { key: 'city', label: t('ui.layersPage.n3Citta') }
              ].map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setSelectedGroup(g.key as LayerGroupKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${selectedGroup === g.key
                    ? 'bg-cyan-500 text-white font-bold shadow-sm'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                    }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* Filter by Regime */}
            <div className="flex items-center gap-1 bg-[var(--rule)]/40 p-1 rounded-xl border border-[var(--rule)] overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono px-2 hidden lg:inline">
                {t('ui.layersPage.regime')}
              </span>
              {[
                { key: 'all', label: t('ui.layersPage.tutti') },
                { key: 'realtime', label: t('ui.layersPage.tempoReale2') },
                { key: 'simulated', label: t('ui.layersPage.digitalTwin') },
                { key: 'static', label: t('ui.layersPage.censimento') },
                { key: 'curated', label: t('ui.layersPage.curato') }
              ].map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setSelectedRegime(r.key as DataRegimeKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${selectedRegime === r.key
                    ? 'bg-cyan-500 text-white font-bold shadow-sm'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                    }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Filter by Acquisition */}
            <div className="flex items-center gap-1 bg-[var(--rule)]/40 p-1 rounded-xl border border-[var(--rule)] overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-[var(--ink-3)] uppercase font-mono px-2 hidden lg:inline">
                {t('ui.layersPage.acquisizione')}
              </span>
              {[
                { key: 'all', label: t('ui.layersPage.tutte') },
                { key: 'api', label: t('ui.layersPage.acqApi') },
                { key: 'local', label: t('ui.layersPage.localeCache') }
              ].map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => setSelectedAcquisition(a.key as AcquisitionKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${selectedAcquisition === a.key
                    ? 'bg-cyan-500 text-white font-bold shadow-sm'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                    }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Layer Cards List */}
        <section className="flex flex-col gap-3">
          {filteredLayers.length === 0 ? (
            <div className="glass-panel p-8 rounded-3xl text-center flex flex-col items-center justify-center gap-2 border border-[var(--rule)]">
              <Info className="w-8 h-8 text-cyan-400" />
              <p className="text-sm font-semibold text-[var(--ink)]">
                {t('ui.layersPage.nessunLivelloCorrispondeAiFiltri')}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedGroup('all');
                  setSelectedRegime('all');
                  setSelectedAcquisition('all');
                  setSearchQuery('');
                }}
                className="mt-2 px-3 py-1.5 rounded-xl bg-cyan-500 text-white text-xs font-mono cursor-pointer shadow-md"
              >
                {t('ui.layersPage.reimpostaTuttiIFiltri')}
              </button>
            </div>
          ) : (
            filteredLayers.map((layer) => (
              <div
                key={layer.id}
                className="glass-panel rounded-2xl p-4 sm:p-5 border border-[var(--rule)] hover:border-cyan-500/40 transition-all flex flex-col gap-3 shadow-md group"
              >
                {/* Header row: Name, Group, Regime Pill */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--rule)]/60 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-[var(--rule)]/40 flex items-center justify-center">
                      {layer.group === 'mobility' ? (
                        <Ship className="w-5 h-5 text-sky-400" />
                      ) : layer.group === 'lagoon' ? (
                        <Waves className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Landmark className="w-5 h-5 text-emerald-400" />
                      )}
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-[var(--ink)] group-hover:text-cyan-400 transition-colors">
                        {language === 'it' ? layer.nameIt : layer.nameEn}
                      </h3>
                      <span className="text-[11px] font-mono text-[var(--ink-3)]">
                        {t(`ui.layersPage.group_${layer.group}`)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
                    {/* Regime Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 border shadow-sm ${layer.regime === 'realtime'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : layer.regime === 'simulated'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : layer.regime === 'curated'
                            ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                            : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                        }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${layer.regime === 'realtime'
                          ? 'bg-emerald-400 motion-safe:animate-pulse'
                          : layer.regime === 'simulated'
                            ? 'bg-amber-400'
                            : layer.regime === 'curated'
                              ? 'bg-orange-400'
                              : 'bg-sky-400'
                          }`}
                      />
                      {t(`ui.layersPage.regime_${layer.regime}`)}
                    </span>

                    {/* Acquisition Badge */}
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-[var(--rule)]/60 text-[var(--ink-2)] border border-[var(--rule)] flex items-center gap-1.5">
                      {layer.acquisition === 'api' ? (
                        <>
                          <Radio className="w-3 h-3 text-cyan-400" />
                          <span>{t('ui.layersPage.acqApi')}</span>
                        </>
                      ) : (
                        <>
                          <Database className="w-3 h-3 text-[var(--ink-3)]" />
                          <span>{t('ui.layersPage.localeCache')}</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Body: Functional description */}
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  {language === 'it' ? layer.descriptionIt : layer.descriptionEn}
                </p>

                {/* Technical notes callout */}
                <div className="p-3 rounded-xl bg-[var(--rule)]/25 border border-[var(--rule)]/80 flex flex-col gap-1 text-[11px]">
                  <span className="font-mono text-[10px] text-cyan-400 uppercase font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    {t('ui.layersPage.elaborazioneTecnicaTrasparenza')}
                  </span>
                  <p className="text-[var(--ink-2)] leading-relaxed font-sans">
                    {language === 'it' ? layer.technicalNotesIt : layer.technicalNotesEn}
                  </p>
                </div>

                {/* Provenienza e aggiornamento */}
                <div className="p-3 rounded-xl bg-[var(--ground)]/60 border border-[var(--rule)] flex flex-col gap-1 text-[11px]">
                  <span className="font-mono text-[10px] text-cyan-400 uppercase font-bold flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5" />
                    {t('ui.layersPage.aggiornamento')}
                  </span>
                  <p className="text-[var(--ink-2)] leading-relaxed">{t(`ui.layersPage.prov_${layer.regime}`)}</p>
                </div>

                {/* Footer: Source link & Endpoint */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[var(--rule)]/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--ink-3)] font-mono">{t('ui.layersPage.enteFonte')}</span>
                    <a
                      href={layer.portalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors underline"
                    >
                      <span>{layer.institution}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--ink-3)]">
                    <span>{t('ui.layersPage.target')}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[var(--rule)] text-[var(--ink-2)]">
                      {layer.endpointOrFile}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
