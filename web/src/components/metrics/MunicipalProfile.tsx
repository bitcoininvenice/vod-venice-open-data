'use client';

import React, { useState } from 'react';
import { Landmark } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import cruscotto from '@/data/cruscotto-comuni.json';

type Section = Record<string, unknown>;
type Kpi = Record<string, Section>;

/** Indicatore: sezione e campo di Cruscotto Italia, formato e campo con l'anno di riferimento. */
interface Indicator {
  key: string;
  section: string;
  field: string;
  format: 'int' | 'dec1' | 'pct' | 'eur' | 'eurM' | 'eurM2';
  yearField?: string;
}

const GROUPS: Array<{ id: string; items: Indicator[] }> = [
  {
    id: 'people',
    items: [
      { key: 'population', section: 'demografia', field: 'popolazione', format: 'int', yearField: 'riferimento' },
      { key: 'meanAge', section: 'demografia', field: 'eta_media', format: 'dec1' },
      { key: 'oldAgeIndex', section: 'demografia', field: 'indice_vecchiaia', format: 'int' },
      { key: 'naturalBalance', section: 'demografia', field: 'saldo_naturale', format: 'int', yearField: 'anno_dinamica' },
    ],
  },
  {
    id: 'economy',
    items: [
      { key: 'meanIncome', section: 'redditi_mef', field: 'reddito_medio_eur', format: 'eur', yearField: 'anno_fiscale' },
      { key: 'employmentRate', section: 'lavoro_profilo', field: 'tasso_occupazione', format: 'pct', yearField: 'anno' },
      { key: 'unemploymentRate', section: 'lavoro_profilo', field: 'tasso_disoccupazione', format: 'pct', yearField: 'anno' },
      { key: 'localUnits', section: 'imprese_asia', field: 'ul_totali', format: 'int', yearField: 'anno' },
      { key: 'housePrice', section: 'quotazioni_omi', field: 'residenziale_medio', format: 'eurM2' },
    ],
  },
  {
    id: 'publicFinance',
    items: [
      { key: 'spendingPerCapita', section: 'siope', field: 'uscite_per_abitante_eur', format: 'eur', yearField: 'anno' },
      { key: 'revenuePerCapita', section: 'siope', field: 'incassi_per_abitante_eur', format: 'eur', yearField: 'anno' },
      { key: 'pnrrProjects', section: 'pnrr', field: 'n_progetti', format: 'int' },
      { key: 'pnrrAmount', section: 'pnrr', field: 'importo_assegnato_eur', format: 'eurM' },
      { key: 'publicWorks', section: 'opere_bdap', field: 'importo_totale_eur', format: 'eurM' },
      { key: 'contracts', section: 'contratti_anac', field: 'importo_totale_eur', format: 'eurM' },
    ],
  },
  {
    id: 'environment',
    items: [
      { key: 'area', section: 'ambiente', field: 'superficie_kmq', format: 'dec1' },
      { key: 'landConsumption', section: 'ambiente', field: 'consumo_suolo_pct', format: 'pct' },
      { key: 'separateCollection', section: 'ambiente', field: 'raccolta_differenziata_pct', format: 'pct' },
      { key: 'wastePerCapita', section: 'ambiente', field: 'rifiuti_kg_per_abitante', format: 'int' },
      { key: 'pm10', section: 'aria_ispra', field: 'pm10_media', format: 'dec1', yearField: 'anno' },
    ],
  },
  {
    id: 'services',
    items: [
      { key: 'pharmacies', section: 'sanita_mds', field: 'n_farmacie', format: 'int' },
      { key: 'hospitalBeds', section: 'sanita_mds', field: 'posti_letto_ospedalieri', format: 'int' },
      { key: 'schools', section: 'scuole_miur', field: 'n_scuole', format: 'int', yearField: 'anno_scolastico' },
      { key: 'ftth', section: 'banda_larga_agcom', field: 'copertura_ftth_pct', format: 'pct' },
      { key: 'evPoints', section: 'ricarica_ev_pun', field: 'n_attivi', format: 'int' },
      { key: 'heritage', section: 'beni_culturali_mic', field: 'n_beni_immobili', format: 'int' },
    ],
  },
  {
    id: 'tourism',
    items: [
      { key: 'accommodations', section: 'turismo', field: 'totale_strutture', format: 'int', yearField: 'anno' },
      { key: 'beds', section: 'turismo', field: 'totale_letti', format: 'int', yearField: 'anno' },
      { key: 'tourismIndex', section: 'turismo', field: 'indice_turisticita_per_100ab', format: 'dec1', yearField: 'anno' },
    ],
  },
];

function formatValue(v: unknown, format: Indicator['format'], locale: string): string {
  if (typeof v !== 'number') return 'n.d.';
  const n = (opts: Intl.NumberFormatOptions) => v.toLocaleString(locale, opts);
  switch (format) {
    case 'int': return n({ maximumFractionDigits: 0 });
    case 'dec1': return n({ maximumFractionDigits: 1 });
    case 'pct': return `${n({ maximumFractionDigits: 1 })}%`;
    case 'eur': return `${n({ maximumFractionDigits: 0 })} €`;
    case 'eurM': return `${(v / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 1 })} M€`;
    case 'eurM2': return `${n({ maximumFractionDigits: 0 })} €/m²`;
  }
}

/** Profilo socio-economico dei comuni della laguna (Cruscotto Italia – AgID, CC BY 4.0). */
export function MunicipalProfile() {
  const { t, language } = useTranslation();
  const p = (key: string, params?: Record<string, string | number>) => t(`ui.municipalProfile.${key}`, params);
  const locale = language === 'it' ? 'it-IT' : 'en-GB';
  const [code, setCode] = useState(cruscotto.comuni[0]?.code);
  const comune = cruscotto.comuni.find((c) => c.code === code) ?? cruscotto.comuni[0];
  if (!comune) return null;
  const kpi = comune.kpi as unknown as Kpi;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap" role="tablist" aria-label={p('selectorLabel')}>
        {cruscotto.comuni.map((c) => (
          <button
            key={c.code}
            type="button"
            role="tab"
            aria-selected={c.code === code}
            onClick={() => setCode(c.code)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
              c.code === code ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold' : 'bg-[var(--rule)]/40 text-[var(--ink-2)] border-[var(--rule)] hover:text-[var(--ink)]'
            }`}
          >
            <Landmark className="w-3.5 h-3.5 inline mr-1" />
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {GROUPS.map((g) => (
          <div key={g.id} className="p-4 rounded-2xl border border-[var(--rule)] bg-[var(--rule)]/15 flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase font-mono text-[var(--ink-3)]">{p(`group_${g.id}`)}</h3>
            <dl className="flex flex-col gap-1.5">
              {g.items.map((it) => {
                const sec = kpi[it.section] ?? {};
                const year = it.yearField ? sec[it.yearField] : undefined;
                return (
                  <div key={it.key} className="flex items-baseline justify-between gap-3 text-xs">
                    <dt className="text-[var(--ink-2)]">
                      {p(`ind_${it.key}`)}
                      {year !== undefined && year !== null && <span className="text-[var(--ink-3)] font-mono"> ({String(year)})</span>}
                    </dt>
                    <dd className="font-mono font-bold text-[var(--ink)] text-right">{formatValue(sec[it.field], it.format, locale)}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
        {p('note', { date: new Date(cruscotto.generatedAt).toLocaleDateString(locale) })}{' '}
        <a href={`https://cruscotto-italia.dati.gov.it/`} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
          cruscotto-italia.dati.gov.it
        </a>
      </p>
    </div>
  );
}
