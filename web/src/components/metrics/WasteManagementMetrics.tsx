'use client';

import React, { useState } from 'react';
import { Trash2, BarChart3, TrendingUp, Compass, ExternalLink, ShieldCheck } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import {
  getVeniceWaste2024,
  getWasteTimeSeries,
  getWasteBenchmarks,
  getWasteMetropolitanTotal,
  WASTE_DATA,
} from '@/lib/waste';

export const WasteManagementMetrics: React.FC<{ badge?: React.ReactNode }> = ({ badge }) => {
  const { t, language } = useTranslation();
  const w = (key: string, params?: Record<string, string | number>) =>
    t(`ui.wasteMetrics.${key}`, params);
  const locale = language === 'it' ? 'it-IT' : 'en-GB';

  const [activeTab, setActiveTab] = useState<'fractions' | 'series' | 'benchmarks'>('fractions');

  const venice2024 = getVeniceWaste2024();
  const timeSeries = getWasteTimeSeries();
  const benchmarks = getWasteBenchmarks();
  const metropolitan = getWasteMetropolitanTotal();

  const int = (n: number | null | undefined) =>
    n === null || n === undefined ? '–' : Math.round(n).toLocaleString(locale);
  const dec = (n: number | null | undefined, digits = 1) =>
    n === null || n === undefined
      ? '–'
      : n.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });

  const fractionsList = [
    {
      key: 'organicForsu',
      kg: venice2024.fractionsKg.organicForsu,
      color: 'bg-emerald-500',
      destKey: 'dest_compost',
    },
    {
      key: 'paperCardboard',
      kg: venice2024.fractionsKg.paperCardboard,
      color: 'bg-blue-500',
      destKey: 'dest_recycling',
    },
    {
      key: 'multimaterial',
      kg: venice2024.fractionsKg.multimaterial,
      color: 'bg-amber-500',
      destKey: 'dest_corepla',
    },
    {
      key: 'greenWaste',
      kg: venice2024.fractionsKg.greenWaste,
      color: 'bg-lime-500',
      destKey: 'dest_green_compost',
    },
    {
      key: 'bulkyWaste',
      kg: venice2024.fractionsKg.bulkyWaste,
      color: 'bg-purple-500',
      destKey: 'dest_bulky_recovery',
    },
    {
      key: 'streetSweeping',
      kg: venice2024.fractionsKg.streetSweeping,
      color: 'bg-stone-400',
      destKey: 'dest_sorting',
    },
    {
      key: 'raee',
      kg: venice2024.fractionsKg.raee,
      color: 'bg-cyan-500',
      destKey: 'dest_raee_chain',
    },
    {
      key: 'textiles',
      kg: venice2024.fractionsKg.textiles,
      color: 'bg-indigo-400',
      destKey: 'dest_textile_chain',
    },
    {
      key: 'glass',
      kg: venice2024.fractionsKg.glass,
      color: 'bg-teal-500',
      destKey: 'dest_glass_furnace',
    },
    {
      key: 'hazardousHousehold',
      kg: venice2024.fractionsKg.hazardousHousehold,
      color: 'bg-rose-500',
      destKey: 'dest_hazardous_handling',
    },
    {
      key: 'otherRecoverable',
      kg: venice2024.fractionsKg.otherRecoverable,
      color: 'bg-sky-400',
      destKey: 'dest_special_recovery',
    },
    {
      key: 'residualDry',
      kg: venice2024.fractionsKg.residualDry,
      color: 'bg-zinc-500',
      destKey: 'dest_waste_to_energy',
    },
  ];

  return (
    <div
      id="waste-management-section"
      className="p-5 rounded-2xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-6"
      data-testid="waste-management-metrics"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[var(--ink)] flex items-center gap-2 flex-wrap">
            <Trash2 className="w-4 h-4 text-emerald-400" />
            <span>{w('title')}</span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {t('ui.curated.toCheck')}
            </span>
            {badge}
          </h3>
          <p className="text-xs text-[var(--ink-3)] mt-0.5 leading-relaxed">
            {w('subtitle')}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-[var(--ground)] p-1 rounded-xl border border-[var(--rule)] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('fractions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
              activeTab === 'fractions'
                ? 'bg-emerald-500 text-white font-semibold shadow-sm'
                : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{w('tabFractions')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('series')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
              activeTab === 'series'
                ? 'bg-blue-500 text-white font-semibold shadow-sm'
                : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{w('tabTimeSeries')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('benchmarks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
              activeTab === 'benchmarks'
                ? 'bg-amber-500 text-white font-semibold shadow-sm'
                : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{w('tabBenchmarks')}</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col justify-between gap-1">
          <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase">
            {w('kpiSeparateRate')}
          </span>
          <span className="text-2xl font-black font-mono text-[var(--ink)]">
            {`${dec(venice2024.separateCollectionRate)}%`}
          </span>
          <span className="text-[10px] text-[var(--ink-3)] leading-tight">
            {w('kpiSeparateRateNote')}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/25 flex flex-col justify-between gap-1">
          <span className="text-[11px] font-mono text-blue-400 font-semibold uppercase">
            {w('kpiTotalWaste')}
          </span>
          <span className="text-2xl font-black font-mono text-[var(--ink)]">
            {`${int(venice2024.totalWasteKg / 1000)} t`}
          </span>
          <span className="text-[10px] text-[var(--ink-3)] leading-tight">
            {w('kpiTotalWasteNote', { tons: int(venice2024.totalWasteKg / 1000) })}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col justify-between gap-1">
          <span className="text-[11px] font-mono text-amber-400 font-semibold uppercase">
            {w('kpiPerCapita')}
          </span>
          <span className="text-2xl font-black font-mono text-[var(--ink)]">
            {`${dec(venice2024.wastePerCapitaKg)} kg`}
          </span>
          <span className="text-[10px] text-[var(--ink-3)] leading-tight">
            {w('kpiPerCapitaNote', { kg: dec(venice2024.wastePerCapitaKg) })}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/25 flex flex-col justify-between gap-1">
          <span className="text-[11px] font-mono text-teal-400 font-semibold uppercase">
            {w('kpiRecovered')}
          </span>
          <span className="text-2xl font-black font-mono text-[var(--ink)]">
            {`${int(venice2024.recoveredWasteKg / 1000)} t`}
          </span>
          <span className="text-[10px] text-[var(--ink-3)] leading-tight">
            {w('kpiRecoveredNote', { tons: int(venice2024.recoveredWasteKg / 1000) })}
          </span>
        </div>
      </div>

      {/* Tab 1: Frazioni Merceologiche */}
      {activeTab === 'fractions' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="text-xs font-mono font-bold text-[var(--ink)] uppercase">
                {w('chartFractionsTitle')}
              </h4>
              <p className="text-[11px] text-[var(--ink-3)]">
                {w('chartFractionsNote')}
              </p>
            </div>
            <a
              href="/api/waste"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>GET /api/waste</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--rule)] bg-[var(--ground)]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--rule)] bg-[var(--rule)]/10 font-mono text-[11px] text-[var(--ink-3)]">
                  <th className="p-2.5">{w('colFraction')}</th>
                  <th className="p-2.5 text-right">{w('colWeightTons')}</th>
                  <th className="p-2.5 text-right">{w('colPercentage')}</th>
                  <th className="p-2.5">{w('colDestination')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule)]/60 font-mono">
                {fractionsList.map((f) => {
                  const tons = f.kg / 1000;
                  const pctShare = (f.kg / venice2024.totalWasteKg) * 100;
                  return (
                    <tr key={f.key} className="hover:bg-[var(--rule)]/10 transition-colors">
                      <td className="p-2.5 font-sans font-medium text-[var(--ink)] flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${f.color}`} />
                        <span>{w(`fraction_${f.key}`)}</span>
                      </td>
                      <td className="p-2.5 text-right font-bold text-[var(--ink)]">
                        {int(tons)} t
                      </td>
                      <td className="p-2.5 text-right text-[var(--ink-2)]">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-[var(--rule)] overflow-hidden hidden sm:block">
                            <div
                              className={`h-full ${f.color}`}
                              style={{ width: `${Math.min(100, pctShare * 2.5)}%` }}
                            />
                          </div>
                          <span>{dec(pctShare, 1)}%</span>
                        </div>
                      </td>
                      <td className="p-2.5 font-sans text-[11px] text-[var(--ink-3)]">
                        {w(f.destKey)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Serie Storica 2015-2024 */}
      {activeTab === 'series' && (
        <div className="flex flex-col gap-3">
          <div>
            <h4 className="text-xs font-mono font-bold text-[var(--ink)] uppercase">
              {w('timeSeriesTitle')}
            </h4>
            <p className="text-[11px] text-[var(--ink-3)]">
              {w('timeSeriesNote')}
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--rule)] bg-[var(--ground)]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--rule)] bg-[var(--rule)]/10 font-mono text-[11px] text-[var(--ink-3)]">
                  <th className="p-2.5">{w('colYear')}</th>
                  <th className="p-2.5 text-right">{w('colPopulation')}</th>
                  <th className="p-2.5 text-right">{w('colTotalWaste')}</th>
                  <th className="p-2.5 text-right">{w('colKgPerCapita')}</th>
                  <th className="p-2.5 text-right">{w('colSeparateRate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule)]/60 font-mono">
                {timeSeries.map((row) => (
                  <tr
                    key={row.year}
                    className={`hover:bg-[var(--rule)]/10 transition-colors ${
                      row.year === 2020 ? 'bg-amber-500/5 font-semibold' : ''
                    }`}
                  >
                    <td className="p-2.5 font-bold text-[var(--ink)] flex items-center gap-2">
                      <span>{row.year}</span>
                      {row.year === 2020 && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Lockdown -16%
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-right text-[var(--ink-2)]">
                      {int(row.population)}
                    </td>
                    <td className="p-2.5 text-right font-bold text-[var(--ink)]">
                      {int(row.totalWasteKg / 1000)}
                    </td>
                    <td className="p-2.5 text-right text-[var(--ink-2)]">
                      {dec(row.wastePerCapitaKg)}
                    </td>
                    <td className="p-2.5 text-right font-bold text-emerald-400">
                      {dec(row.separateRate)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Benchmark Territoriale */}
      {activeTab === 'benchmarks' && (
        <div className="flex flex-col gap-3">
          <div>
            <h4 className="text-xs font-mono font-bold text-[var(--ink)] uppercase">
              {w('benchmarkTitle')}
            </h4>
            <p className="text-[11px] text-[var(--ink-3)]">
              {w('benchmarkNote')}
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--rule)] bg-[var(--ground)]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--rule)] bg-[var(--rule)]/10 font-mono text-[11px] text-[var(--ink-3)]">
                  <th className="p-2.5">{t('ui.bdsrMetrics.colMunicipality')}</th>
                  <th className="p-2.5">{w('colZoneType')}</th>
                  <th className="p-2.5 text-right">{w('colKgPerCapita')}</th>
                  <th className="p-2.5 text-right">{w('colSeparateRate')}</th>
                  <th className="p-2.5 text-right">{w('colTotalWaste')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule)]/60 font-mono">
                {benchmarks.map((b) => {
                  const isTourist = b.wastePerCapitaKg > 1000;
                  const isVenice = b.municipality === 'Venezia';
                  return (
                    <tr
                      key={b.municipality}
                      className={`hover:bg-[var(--rule)]/10 transition-colors ${
                        isVenice ? 'bg-cyan-500/10 font-semibold' : ''
                      }`}
                    >
                      <td className="p-2.5 font-sans font-bold text-[var(--ink)] flex items-center gap-2">
                        <span>{b.municipality}</span>
                        {isTourist && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Turismo estivo
                          </span>
                        )}
                        {isVenice && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Capoluogo
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 font-sans text-[11px] text-[var(--ink-3)]">
                        {b.zoneType}
                      </td>
                      <td
                        className={`p-2.5 text-right font-bold ${
                          isTourist ? 'text-rose-400' : 'text-[var(--ink)]'
                        }`}
                      >
                        {dec(b.wastePerCapitaKg)} kg
                      </td>
                      <td className="p-2.5 text-right font-bold text-emerald-400">
                        {dec(b.separateRate)}%
                      </td>
                      <td className="p-2.5 text-right text-[var(--ink-2)]">
                        {int(b.totalWasteKg / 1000)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-xl bg-[var(--ground)] border border-[var(--rule)] text-[11px] text-[var(--ink-3)] font-mono flex items-center justify-between flex-wrap gap-2">
            <span>
              {metropolitan.territory}: {int(metropolitan.population)} ab.,{' '}
              {dec(metropolitan.wastePerCapitaKg)} kg/ab., {dec(metropolitan.separateRate)}% RD
            </span>
            <span className="text-emerald-400 font-semibold">
              Media Regionale Veneto: {dec(metropolitan.regionalVenetoAverageSeparateRate)}% RD
            </span>
          </div>
        </div>
      )}

      {/* Sezione Logistica Veritas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-[var(--rule)]">
        <div className="p-3 rounded-xl bg-[var(--ground)] border border-[var(--rule)] flex flex-col gap-1.5">
          <span className="text-xs font-bold text-[var(--ink)]">
            {w('logisticsBoatTitle')}
          </span>
          <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
            {w('logisticsBoatDesc')}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-[var(--ground)] border border-[var(--rule)] flex flex-col gap-1.5">
          <span className="text-xs font-bold text-[var(--ink)]">
            {w('logisticsKeyTitle')}
          </span>
          <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
            {w('logisticsKeyDesc')}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-[var(--ground)] border border-[var(--rule)] flex flex-col gap-1.5">
          <span className="text-xs font-bold text-[var(--ink)]">
            {w('logisticsEnergyTitle')}
          </span>
          <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
            {w('logisticsEnergyDesc')}
          </p>
        </div>
      </div>

      {/* Footer / Attribution */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[var(--rule)]/60 text-[11px] text-[var(--ink-3)]">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{w('arpavSourceLabel')}</span>
        </span>
        <a
          href={WASTE_DATA.metadata.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:underline flex items-center gap-1"
        >
          <span>{w('openArpavPortal')}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
