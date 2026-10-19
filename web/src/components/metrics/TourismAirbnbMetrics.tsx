'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, Layers, Users, BarChart3, ShieldCheck, Calendar, Compass } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import {
  AIRBNB_DATA,
  AIRBNB_ZONES,
  AIRBNB_ROOM_COLORS,
  getAirbnbDetailedStats,
  type AirbnbSummaryStats,
  type AirbnbZoneDetailedPrice,
} from '@/lib/airbnb';
import type { TouristAccommodationItem } from '@/lib/types';
import tourismData from '@/data/turismo-comuni.json';

type SortKey = 'meanPrice' | 'medianPrice' | 'listings' | 'availability';

/**
 * Dashboard di analisi su locazioni brevi (Inside Airbnb Venezia), prezzi medi e mediani
 * per sestiere/isola/terraferma, concentrazione gestionale multi-host e apertura annua del calendario.
 */
export const TourismAirbnbMetrics: React.FC<{ badge?: React.ReactNode }> = ({ badge }) => {
  const { t, language } = useTranslation();
  const a = (key: string, params?: Record<string, string | number>) => t(`ui.airbnbMetrics.${key}`, params);
  const locale = language === 'it' ? 'it-IT' : 'en-GB';

  const [sortBy, setSortBy] = useState<SortKey>('meanPrice');

  const details = useMemo(() => getAirbnbDetailedStats(), []);
  const city = AIRBNB_DATA.city;
  const centre = AIRBNB_DATA.historicCentre;

  const int = (n: number | null | undefined) =>
    n === null || n === undefined ? '–' : n.toLocaleString(locale);
  const eur = (n: number | null | undefined) =>
    n === null || n === undefined ? '–' : `${n.toLocaleString(locale)} €`;
  const pct = (n: number | null | undefined, digits = 1) =>
    n === null || n === undefined
      ? '–'
      : `${n.toLocaleString(locale, { maximumFractionDigits: digits })}%`;
  const dec = (n: number | null | undefined, digits = 2) =>
    n === null || n === undefined
      ? '–'
      : n.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });

  const sortZones = (list: TouristAccommodationItem[]) => {
    return [...list].sort((x, y) => {
      if (sortBy === 'meanPrice') return (y.meanPriceEur ?? 0) - (x.meanPriceEur ?? 0);
      if (sortBy === 'medianPrice') return (y.medianPriceEur ?? 0) - (x.medianPriceEur ?? 0);
      if (sortBy === 'listings') return y.totalStructures - x.totalStructures;
      return (y.avgAvailabilityDays ?? 0) - (x.avgAvailabilityDays ?? 0);
    });
  };

  const sestieriZones = useMemo(
    () => sortZones(AIRBNB_ZONES.filter((z) => z.macroArea === 'historic_centre')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortBy]
  );
  const islandZones = useMemo(
    () => sortZones(AIRBNB_ZONES.filter((z) => z.macroArea === 'islands')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortBy]
  );
  const mainlandZones = useMemo(
    () => sortZones(AIRBNB_ZONES.filter((z) => z.macroArea === 'terraferma')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortBy]
  );

  const maxMeanPrice = useMemo(
    () => Math.max(...AIRBNB_ZONES.map((z) => z.meanPriceEur ?? 0), 1),
    []
  );

  const centreSharePct = Math.round((centre.totalStructures / (city.totalStructures || 1)) * 1000) / 10;
  const centreEntirePct = Math.round(((centre.entireHomeApt ?? 0) / (centre.totalStructures || 1)) * 1000) / 10;
  const cityEntirePct = Math.round(((city.entireHomeApt ?? 0) / (city.totalStructures || 1)) * 1000) / 10;
  const mestreMean = AIRBNB_ZONES.find((z) => z.id === 'ACC_MESTRE_CENTRO')?.meanPriceEur ?? 143;

  return (
    <div
      className="p-5 rounded-2xl bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-5"
      data-testid="tourism-airbnb-metrics"
    >
      {/* Intestazione e scorciatoie alla mappa */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[var(--ink)] flex items-center gap-2 flex-wrap">
            <Building2 className="w-4 h-4 text-rose-400" />
            {a('title')}
            {badge}
          </h3>
          <p className="text-xs text-[var(--ink-3)] mt-0.5 leading-relaxed">
            {a('subtitle', { n: int(AIRBNB_DATA.totalListings), date: AIRBNB_DATA.snapshotDate })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Link
            href="/?layers=strutture_ricettive"
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-colors flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5 text-rose-400" />
            <span>{a('openMapPoints', { n: int(AIRBNB_DATA.totalListings) })}</span>
          </Link>
          <Link
            href="/?layers=pressione_turistica"
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold bg-fuchsia-500/15 hover:bg-fuchsia-500/25 text-fuchsia-300 border border-fuchsia-500/30 transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>{a('openMapPressure')}</span>
          </Link>
        </div>
      </div>

      {/* 6 KPI Principali */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiBox
          label={a('kpiMeanCentre')}
          value={`${int(centre.meanPriceEur)} ${a('perNight')}`}
          note={a('kpiMeanCentreNote', {
            median: int(centre.medianPriceEur),
            cityMean: int(city.meanPriceEur),
            cityMedian: int(city.medianPriceEur),
          })}
          tone="amber"
        />
        <KpiBox
          label={a('kpiSpread')}
          value={
            details.historicvsMainlandPriceRatio
              ? `${dec(details.historicvsMainlandPriceRatio, 2)}×`
              : '–'
          }
          note={a('kpiSpreadNote', {
            centre: int(centre.meanPriceEur),
            mainland: int(mestreMean),
            p25: int(details.p25PriceEur),
            p75: int(details.p75PriceEur),
          })}
          tone="cyan"
        />
        <KpiBox
          label={a('kpiListings')}
          value={int(city.totalStructures)}
          note={a('kpiListingsNote', {
            beds: int(city.totalBeds),
            centre: int(centre.totalStructures),
            pct: dec(centreSharePct, 1),
          })}
          tone="rose"
        />
        <KpiBox
          label={a('kpiAvailability')}
          value={a('daysPerYear', { d: centre.avgAvailabilityDays })}
          note={a('kpiAvailabilityNote', {
            days: int(centre.avgAvailabilityDays),
            yearRoundPct: dec(
              details.availabilityBrackets.find((b) => b.id === 'yearRound_181_365')?.sharePct ?? 58.7,
              1
            ),
            totalReviews: int(details.totalReviewsLtm),
          })}
          tone="cyan"
        />
        <KpiBox
          label={a('kpiEntireHomes')}
          value={pct(centreEntirePct)}
          note={a('kpiEntireHomesNote', {
            centreCount: int(centre.entireHomeApt),
            cityPct: dec(cityEntirePct, 1),
            cityCount: int(city.entireHomeApt),
          })}
          tone="purple"
        />
        <KpiBox
          label={a('kpiMultiHost')}
          value={pct(city.pctMultiHost)}
          note={a('kpiMultiHostNote', {
            commPct: dec(city.pctCommercial5Plus, 1),
            commCount: int(city.commercial5PlusListings),
            licPct: dec(city.pctWithLicense, 1),
          })}
          tone="emerald"
        />
      </div>

      {/* Barra di ordinamento tabelle per zona */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <span className="text-[11px] font-mono text-[var(--ink-3)] uppercase font-semibold">
          {a('sortLabel')}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label={a('sortLabel')}>
          {(['meanPrice', 'medianPrice', 'listings', 'availability'] as const).map((k) => {
            const active = sortBy === k;
            return (
              <button
                key={k}
                type="button"
                aria-pressed={active}
                onClick={() => setSortBy(k)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer ${
                  active
                    ? 'bg-rose-500 text-white font-bold'
                    : 'bg-[var(--ground)] text-[var(--ink-2)] hover:text-[var(--ink)] border border-[var(--rule)]'
                }`}
              >
                {a(`sort_${k}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabella 1: Sestieri del Centro Storico */}
      <ZoneTable
        title={a('sestieriTableTitle')}
        rows={sestieriZones}
        totalLabel={a('centreTotalRow')}
        totalStats={centre}
        zoneDetails={details.zoneDetails}
        avgReviewsLtm={details.avgReviewsPerListingLtm}
        maxMeanPrice={maxMeanPrice}
        a={a}
        int={int}
        eur={eur}
        pct={pct}
        dec={dec}
      />

      {/* Tabella 2: Isole della Laguna */}
      <ZoneTable
        title={a('islandsTableTitle')}
        rows={islandZones}
        zoneDetails={details.zoneDetails}
        avgReviewsLtm={details.avgReviewsPerListingLtm}
        maxMeanPrice={maxMeanPrice}
        a={a}
        int={int}
        eur={eur}
        pct={pct}
        dec={dec}
      />

      {/* Tabella 3: Terraferma Veneziana + Totale Comune */}
      <ZoneTable
        title={a('mainlandTableTitle')}
        rows={mainlandZones}
        totalLabel={a('cityTotalRow')}
        totalStats={city}
        zoneDetails={details.zoneDetails}
        avgReviewsLtm={details.avgReviewsPerListingLtm}
        maxMeanPrice={maxMeanPrice}
        a={a}
        int={int}
        eur={eur}
        pct={pct}
        dec={dec}
      />

      {/* 4 Pannelli di Approfondimento Statistico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
        {/* Pannello A: Prezzi e offerta per tipologia di alloggio */}
        <div className="p-4 rounded-xl bg-[var(--ground)]/80 border border-[var(--rule)] flex flex-col gap-3">
          <div>
            <h4 className="text-xs font-mono uppercase font-bold text-rose-400 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              {a('roomTypesTitle')}
            </h4>
            <p className="text-[11px] text-[var(--ink-3)] mt-0.5">{a('roomTypesNote')}</p>
          </div>
          <div className="overflow-x-auto rounded-lg border border-[var(--rule)]">
            <table className="w-full text-xs font-mono">
              <thead className="bg-[var(--rule)]/40 text-[var(--ink-3)] text-[10px] uppercase">
                <tr>
                  <th className="text-left p-2">{a('colRoomType')}</th>
                  <th className="text-right p-2">{a('colListings')}</th>
                  <th className="text-right p-2">{a('colShare')}</th>
                  <th className="text-right p-2">{a('colMeanPrice')}</th>
                  <th className="text-right p-2">{a('sort_medianPrice')}</th>
                  <th className="text-right p-2">{a('colAvailability')}</th>
                  <th className="text-right p-2">{a('colReviewsLtm')}</th>
                </tr>
              </thead>
              <tbody>
                {details.byRoomType.map((rt) => (
                  <tr key={rt.roomType} className="border-t border-[var(--rule)]">
                    <td className="p-2 font-sans text-[var(--ink)] flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: AIRBNB_ROOM_COLORS[rt.roomType] }}
                      />
                      <span>{a(`room_${rt.roomType}`)}</span>
                    </td>
                    <td className="p-2 text-right font-bold text-[var(--ink)]">{int(rt.count)}</td>
                    <td className="p-2 text-right text-[var(--ink-2)]">{pct(rt.sharePct)}</td>
                    <td className="p-2 text-right font-bold text-amber-400">{eur(rt.meanPriceEur)}</td>
                    <td className="p-2 text-right text-cyan-400">{eur(rt.medianPriceEur)}</td>
                    <td className="p-2 text-right text-[var(--ink-2)]">
                      {a('daysPerYear', { d: rt.avgAvailabilityDays })}
                    </td>
                    <td className="p-2 text-right text-[var(--ink-2)]">{dec(rt.avgReviewsLtm, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pannello B: Distribuzione per fascia di prezzo notturno */}
        <div className="p-4 rounded-xl bg-[var(--ground)]/80 border border-[var(--rule)] flex flex-col gap-3">
          <div>
            <h4 className="text-xs font-mono uppercase font-bold text-amber-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              {a('priceBracketsTitle')}
            </h4>
            <p className="text-[11px] text-[var(--ink-3)] mt-0.5">
              {a('priceBracketsNote', {
                n: int(details.pricedListingsCount),
                p10: int(details.p10PriceEur),
                p25: int(details.p25PriceEur),
                p50: int(city.medianPriceEur),
                p75: int(details.p75PriceEur),
                p90: int(details.p90PriceEur),
              })}
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            {details.priceBrackets.map((b) => (
              <div key={b.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--ink)]">{a(`bracket_${b.id}`)}</span>
                  <span className="font-mono text-[var(--ink)]">
                    <strong>{int(b.count)}</strong>{' '}
                    <span className="text-[var(--ink-3)]">({pct(b.sharePct)})</span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--rule)]/60 overflow-hidden flex">
                  <span
                    className="h-full bg-rose-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (b.historicCentreCount / (details.pricedListingsCount || 1)) * 100
                      )}%`,
                    }}
                    title="Centro storico"
                  />
                  <span
                    className="h-full bg-cyan-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (b.otherAreasCount / (details.pricedListingsCount || 1)) * 100
                      )}%`,
                    }}
                    title="Isole e Terraferma"
                  />
                </div>
                <span className="text-[10px] font-mono text-[var(--ink-3)]">
                  {a('splitHistoricOther', {
                    hist: int(b.historicCentreCount),
                    other: int(b.otherAreasCount),
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pannello C: Concentrazione gestionale (Portafoglio Host) */}
        <div className="p-4 rounded-xl bg-[var(--ground)]/80 border border-[var(--rule)] flex flex-col gap-3">
          <div>
            <h4 className="text-xs font-mono uppercase font-bold text-purple-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              {a('hostConcentrationTitle')}
            </h4>
            <p className="text-[11px] text-[var(--ink-3)] mt-0.5">
              {a('hostConcentrationNote', { max: int(details.maxHostPortfolioSize) })}
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            {details.hostBrackets.map((hb) => (
              <div
                key={hb.id}
                className="p-2.5 rounded-lg bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <strong className="text-[var(--ink)]">{a(`host_${hb.id}`)}</strong>
                  <span className="font-mono font-bold text-purple-400">
                    {int(hb.count)} ({pct(hb.sharePct)})
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--rule)]/60 overflow-hidden">
                  <span
                    className="block h-full bg-purple-500"
                    style={{ width: `${Math.min(100, hb.sharePct)}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-[var(--ink-3)]">
                  {a('hostStatsLine', {
                    mean: int(hb.meanPriceEur),
                    median: int(hb.medianPriceEur),
                    entire: dec(hb.entireHomePct, 1),
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pannello D: Stagionalità (Disponibilità 365 gg) e Hotspot Griglia 100 m */}
        <div className="p-4 rounded-xl bg-[var(--ground)]/80 border border-[var(--rule)] flex flex-col justify-between gap-3">
          <div className="flex flex-col gap-2.5">
            <div>
              <h4 className="text-xs font-mono uppercase font-bold text-cyan-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {a('availabilityAndGridTitle')}
              </h4>
              <p className="text-[11px] text-[var(--ink-3)] mt-0.5">
                {a('availabilityAndGridNote', { cells: int(details.gridStats.totalCells) })}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {details.availabilityBrackets.map((ab) => (
                <div
                  key={ab.id}
                  className="p-2.5 rounded-lg bg-[var(--rule)]/20 border border-[var(--rule)] flex flex-col gap-0.5"
                >
                  <span className="text-[10px] font-mono text-[var(--ink-3)]">
                    {a(`avail_${ab.id}`)}
                  </span>
                  <div className="flex items-baseline justify-between gap-1 font-mono">
                    <strong className="text-base text-[var(--ink)]">{int(ab.count)}</strong>
                    <span className="text-xs text-cyan-400 font-bold">{pct(ab.sharePct)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/30 flex flex-col gap-2">
            <span className="text-[10px] font-mono uppercase font-bold text-fuchsia-300">
              {a('gridHotspotTitle')}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div>
                <span className="text-[10px] text-[var(--ink-3)] block">{a('gridCellsTotal')}</span>
                <strong className="text-sm text-[var(--ink)]">{int(details.gridStats.totalCells)}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[var(--ink-3)] block">{a('gridCells10Plus')}</span>
                <strong className="text-sm text-amber-400">
                  {int(details.gridStats.highDensityCells10Plus)}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-[var(--ink-3)] block">{a('gridCells20Plus')}</span>
                <strong className="text-sm text-rose-400">
                  {int(details.gridStats.extremeDensityCells20Plus)}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-[var(--ink-3)] block">{a('gridMaxCell')}</span>
                <strong className="text-sm text-fuchsia-300">
                  {a('gridMaxCellUnit', { n: int(details.gridStats.maxListingsInSingleCell) })}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Movimento Turistico Ufficiale nei Comuni Lagunari (CCIAA / Regione / ISTAT) */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <span className="text-[11px] font-mono text-[var(--ink-3)] uppercase font-semibold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            {a('officialFlowsTitle', { year: tourismData.tourismYear })}
          </span>
        </div>
        <p className="text-[11px] text-[var(--ink-3)]">{a('officialFlowsNote')}</p>
        <div className="overflow-x-auto rounded-xl border border-[var(--rule)]">
          <table className="w-full text-xs font-mono min-w-[540px]">
            <thead className="bg-[var(--rule)]/40 text-[var(--ink-3)] text-[10px] uppercase">
              <tr>
                <th className="text-left p-2">{a('colMunicipality')}</th>
                <th className="text-right p-2">{a('colArrivals')}</th>
                <th className="text-right p-2">{a('colPresences')}</th>
                <th className="text-right p-2">{a('colAvgStay')}</th>
                <th className="text-right p-2">{a('colPresPerRes')}</th>
              </tr>
            </thead>
            <tbody>
              {tourismData.comuni.map((c) => (
                <tr key={c.code} className="border-t border-[var(--rule)]">
                  <td className="p-2 font-sans font-semibold text-[var(--ink)]">{c.name}</td>
                  <td className="p-2 text-right">{int(c.arrivals)}</td>
                  <td className="p-2 text-right font-bold text-cyan-400">{int(c.presences)}</td>
                  <td className="p-2 text-right">
                    {a('nightsUnit', { n: dec(c.avgStayNights, 2) })}
                  </td>
                  <td className="p-2 text-right font-bold text-rose-400">
                    {dec(c.presencesPerResident, 1)}×
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nota metodologica e attribuzione */}
      <div className="text-[11px] text-[var(--ink-3)] leading-relaxed flex flex-col gap-1 border-t border-[var(--rule)] pt-3">
        <p>{a('methodNote')}</p>
        <a
          href={AIRBNB_DATA.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-cyan-400 hover:underline"
        >
          {AIRBNB_DATA.attribution}
        </a>
      </div>
    </div>
  );
};

const TONE_CLS = {
  amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  rose: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
  fuchsia: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400',
  purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
} as const;

function KpiBox({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: keyof typeof TONE_CLS;
}) {
  const cls = TONE_CLS[tone];
  return (
    <div className={`p-3.5 rounded-xl border flex flex-col justify-between gap-1 ${cls}`}>
      <span className="text-[10px] font-mono uppercase text-[var(--ink-2)] font-semibold">
        {label}
      </span>
      <strong className="text-2xl font-mono font-extrabold tabular">{value}</strong>
      <span className="text-[11px] text-[var(--ink-3)] leading-snug">{note}</span>
    </div>
  );
}

function ZoneTable({
  title,
  rows,
  totalLabel,
  totalStats,
  zoneDetails,
  avgReviewsLtm,
  maxMeanPrice,
  a,
  int,
  eur,
  pct,
  dec,
}: {
  title: string;
  rows: TouristAccommodationItem[];
  totalLabel?: string;
  totalStats?: AirbnbSummaryStats;
  zoneDetails: Record<string, AirbnbZoneDetailedPrice>;
  avgReviewsLtm?: number;
  maxMeanPrice: number;
  a: (key: string, params?: Record<string, string | number>) => string;
  int: (n: number | null | undefined) => string;
  eur: (n: number | null | undefined) => string;
  pct: (n: number | null | undefined, digits?: number) => string;
  dec: (n: number | null | undefined, digits?: number) => string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-mono text-[var(--ink-3)] uppercase font-semibold">
        {title}
      </span>
      <div className="overflow-x-auto rounded-xl border border-[var(--rule)]">
        <table className="w-full text-xs font-mono min-w-[920px]">
          <thead className="bg-[var(--rule)]/40 text-[var(--ink-3)] text-[10px] uppercase">
            <tr>
              <th className="text-left p-2">{a('colZone')}</th>
              <th className="text-right p-2">{a('colListings')}</th>
              <th className="text-right p-2">{a('colBeds')}</th>
              <th className="text-right p-2">{a('colMeanPrice')}</th>
              <th className="text-right p-2">{a('colMedianPrice')}</th>
              <th className="text-right p-2">{a('colByTypePrice')}</th>
              <th className="text-right p-2">{a('colEntireShare')}</th>
              <th className="text-right p-2">{a('colMultiHost')}</th>
              <th className="text-right p-2">{a('colAvailability')}</th>
              <th className="text-right p-2">{a('colReviewsLtm')}</th>
              <th className="text-right p-2">{a('colLicense')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const zd = zoneDetails[r.id];
              const entirePct =
                r.totalStructures > 0
                  ? ((r.entireHomeApt ?? 0) / r.totalStructures) * 100
                  : 0;
              const priceBarPct = Math.min(100, ((r.meanPriceEur ?? 0) / maxMeanPrice) * 100);
              return (
                <tr key={r.id} className="border-t border-[var(--rule)] hover:bg-[var(--rule)]/15">
                  <td className="p-2 text-[var(--ink)] font-sans font-medium">
                    {r.zoneName}
                  </td>
                  <td className="p-2 text-right font-bold text-[var(--ink)]">
                    {int(r.totalStructures)}
                  </td>
                  <td className="p-2 text-right text-[var(--ink-2)]">{int(r.totalBeds)}</td>
                  <td className="p-2">
                    <div className="flex items-center justify-end gap-2">
                      <strong className="text-amber-400 tabular">{eur(r.meanPriceEur)}</strong>
                      <span
                        className="w-14 h-1.5 rounded-full bg-[var(--rule)]/60 overflow-hidden hidden sm:inline-block"
                        aria-hidden
                      >
                        <span
                          className="block h-full bg-amber-400"
                          style={{ width: `${priceBarPct}%` }}
                        />
                      </span>
                    </div>
                  </td>
                  <td className="p-2 text-right">
                    <span className="font-bold text-cyan-400">{eur(r.medianPriceEur)}</span>
                    {zd && zd.p25Eur && zd.p75Eur && (
                      <span className="text-[10px] text-[var(--ink-3)] block">
                        {int(zd.p25Eur)}–{int(zd.p75Eur)} €
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-right text-[var(--ink-2)]">
                    {zd ? `${eur(zd.entireMeanEur)} / ${eur(zd.privateMeanEur)}` : '–'}
                  </td>
                  <td className="p-2 text-right text-rose-400 font-semibold">
                    {pct(entirePct, 1)}
                  </td>
                  <td className="p-2 text-right">
                    <span>{pct(r.pctMultiHost, 1)}</span>
                    {r.pctCommercial5Plus !== undefined && (
                      <span className="text-[10px] text-[var(--ink-3)] block">
                        ≥5: {pct(r.pctCommercial5Plus, 0)}
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-right text-[var(--ink-2)]">
                    {a('daysPerYear', { d: r.avgAvailabilityDays ?? 0 })}
                  </td>
                  <td className="p-2 text-right text-[var(--ink-2)]">
                    {zd ? dec(zd.avgReviewsLtm, 1) : '–'}
                  </td>
                  <td className="p-2 text-right text-emerald-400">
                    {pct(r.pctWithLicense, 1)}
                  </td>
                </tr>
              );
            })}
            {totalStats && totalLabel && (
              <tr className="border-t-2 border-[var(--rule)] bg-[var(--rule)]/30 font-bold">
                <td className="p-2 text-[var(--ink)] font-sans">{totalLabel}</td>
                <td className="p-2 text-right text-[var(--ink)]">
                  {int(totalStats.totalStructures)}
                </td>
                <td className="p-2 text-right text-[var(--ink)]">{int(totalStats.totalBeds)}</td>
                <td className="p-2 text-right text-amber-400">{eur(totalStats.meanPriceEur)}</td>
                <td className="p-2 text-right text-cyan-400">{eur(totalStats.medianPriceEur)}</td>
                <td className="p-2 text-right text-[var(--ink-3)]">–</td>
                <td className="p-2 text-right text-rose-400">
                  {pct(
                    totalStats.totalStructures > 0
                      ? (totalStats.entireHomeApt / totalStats.totalStructures) * 100
                      : 0,
                    1
                  )}
                </td>
                <td className="p-2 text-right text-[var(--ink)]">
                  {pct(totalStats.pctMultiHost, 1)} (≥5: {pct(totalStats.pctCommercial5Plus, 0)})
                </td>
                <td className="p-2 text-right text-[var(--ink-2)]">
                  {a('daysPerYear', { d: totalStats.avgAvailabilityDays })}
                </td>
                <td className="p-2 text-right text-[var(--ink-2)]">
                  {avgReviewsLtm !== undefined ? dec(avgReviewsLtm, 1) : '–'}
                </td>
                <td className="p-2 text-right text-emerald-400">
                  {pct(totalStats.pctWithLicense, 1)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
