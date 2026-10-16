'use client';

import React, { useEffect, useState } from 'react';
import { Fuel, Ticket } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { usePreference, writePreference } from '@/lib/localPreference';
import { FARE_PROFILES, FARES_CHECKED_AT, boatFuelCost, formatEuro, type FareProfile, type TripCost } from '@/lib/fares';
import { formatFuelPrice, type FuelSummary } from '@/lib/fuel';
import { PROVIDERS } from '@/lib/provenance/providers';

const PROFILE_KEY = 'vod_fare_profile';
const BOAT_LPH_KEY = 'vod_boat_litres_per_hour';

/** Tipo di biglietto scelto, ricordato fra una visita e l'altra */
export function useFareProfile(): [FareProfile, (p: FareProfile) => void] {
  const stored = usePreference(PROFILE_KEY);
  const profile = (FARE_PROFILES as readonly string[]).includes(stored ?? '') ? (stored as FareProfile) : 'ordinary';
  return [profile, (p) => writePreference(PROFILE_KEY, p)];
}

export const FareProfilePicker: React.FC<{ profile: FareProfile; onChange: (p: FareProfile) => void }> = ({ profile, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-[var(--ink-2)]">{t('ui.fares.profileTitle')}</span>
      <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={t('ui.fares.profileTitle')} data-testid="planner-fare-profile">
        {FARE_PROFILES.map((p) => (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={profile === p}
            onClick={() => onChange(p)}
            className={`px-2 py-0.5 rounded-full border text-[11px] cursor-pointer ${profile === p ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200' : 'border-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)]'}`}
          >
            {t(`ui.fares.profile_${p}`)}
          </button>
        ))}
      </div>
    </div>
  );
};

/** Prezzo breve per le opzioni: «9,50 €», «gratis», «da verificare» se ci sono tratte extraurbane */
export function useCostLabel(): (c: TripCost) => string {
  const { t, language } = useTranslation();
  const locale = language === 'it' ? 'it-IT' : 'en-GB';
  return (c) => (c.unpriced.length > 0 ? t('ui.fares.partialShort', { eur: formatEuro(c.total, locale) }) : c.total === 0 ? t('ui.fares.free') : `≈ ${formatEuro(c.total, locale)}`);
}

/** Biglietti stimati del percorso scelto, con la fonte delle tariffe */
export const TripCostSummary: React.FC<{ cost: TripCost }> = ({ cost }) => {
  const { t, language } = useTranslation();
  const locale = language === 'it' ? 'it-IT' : 'en-GB';
  const label = useCostLabel();
  const date = new Date(`${FARES_CHECKED_AT}T12:00:00`).toLocaleDateString(locale);
  return (
    <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-[var(--rule)]/20 border border-[var(--rule)] text-[11px] text-[var(--ink-2)]" data-testid="planner-cost">
      <span className="flex items-center gap-1.5 font-semibold text-[var(--ink)]">
        <Ticket className="w-3.5 h-3.5 text-emerald-400" aria-hidden />
        {t('ui.fares.title')}: {label(cost)}
      </span>
      {cost.tickets.length > 0 && (
        <ul className="flex flex-col gap-0.5 pl-5 list-disc">
          {cost.tickets.map((tk, i) => (
            <li key={i}>
              {t(`ui.fares.ticket_${tk.kind}`)} · {tk.price === 0 ? t('ui.fares.included') : formatEuro(tk.price, locale)}
            </li>
          ))}
        </ul>
      )}
      {cost.unpriced.length > 0 && <span className="text-amber-400">{t('ui.fares.unpriced', { lines: cost.unpriced.join(', ') })}</span>}
      <span className="text-[10px] text-[var(--ink-3)]">
        {t('ui.fares.note', { date })}{' '}
        <a href={PROVIDERS.actvFares.url} target="_blank" rel="noopener noreferrer" className="underline">ACTV</a>
        {' · '}
        <a href={PROVIDERS.alilagunaFares.url} target="_blank" rel="noopener noreferrer" className="underline">Alilaguna</a>
      </span>
    </div>
  );
};

/** Prezzo della benzina per la stima in barca: mediana dei distributori in laguna, altrimenti dell'area */
function usePetrolPrice(): { price: number; where: 'lagoon' | 'area' } | null {
  const [value, setValue] = useState<{ price: number; where: 'lagoon' | 'area' } | null>(null);
  useEffect(() => {
    let alive = true;
    fetch('/api/carburanti')
      .then((r) => r.json())
      .then((j) => {
        const s = j?.summary?.benzina as FuelSummary | undefined;
        if (!alive || !s) return;
        const lagoon = s.byZone.centro.median;
        if (lagoon !== null) setValue({ price: lagoon, where: 'lagoon' });
        else if (s.all.median !== null) setValue({ price: s.all.median, where: 'area' });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return value;
}

/** Stima del carburante in barca: consumo orario indicato dall'utente × durata × prezzo mediano della benzina */
export const BoatFuelEstimate: React.FC<{ seconds: number }> = ({ seconds }) => {
  const { t, language } = useTranslation();
  const locale = language === 'it' ? 'it-IT' : 'en-GB';
  const stored = usePreference(BOAT_LPH_KEY);
  const lph = Number(stored);
  const valid = Number.isFinite(lph) && lph > 0 && lph <= 200;
  const petrol = usePetrolPrice();
  const est = valid && petrol ? boatFuelCost(seconds, lph, petrol.price) : null;
  return (
    <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-[var(--rule)]/20 border border-[var(--rule)] text-[11px] text-[var(--ink-2)]" data-testid="planner-boat-fuel">
      <span className="flex items-center gap-1.5 font-semibold text-[var(--ink)]">
        <Fuel className="w-3.5 h-3.5 text-emerald-400" aria-hidden />
        {t('ui.fares.boatTitle')}
      </span>
      <label className="flex items-center gap-2">
        <span>{t('ui.fares.boatConsumption')}</span>
        <input
          type="number"
          inputMode="decimal"
          min={0.5}
          max={200}
          step={0.5}
          value={stored ?? ''}
          onChange={(e) => writePreference(BOAT_LPH_KEY, e.target.value)}
          className="w-16 px-1.5 py-0.5 rounded-md bg-[var(--ground)] border border-[var(--rule)] text-[var(--ink)] font-mono"
          aria-label={t('ui.fares.boatConsumption')}
          data-testid="planner-boat-lph"
        />
        <span>l/h</span>
      </label>
      {!valid && <span className="text-[var(--ink-3)]">{t('ui.fares.boatHint')}</span>}
      {est && petrol && (
        <span className="font-semibold text-[var(--ink)]" data-testid="planner-boat-fuel-cost">
          {t('ui.fares.boatEstimate', {
            litres: est.litres.toLocaleString(locale, { maximumFractionDigits: 1 }),
            eur: formatEuro(est.cost, locale),
          })}
        </span>
      )}
      {petrol && (
        <span className="text-[10px] text-[var(--ink-3)]">
          {t(petrol.where === 'lagoon' ? 'ui.fares.boatPriceLagoon' : 'ui.fares.boatPriceArea', { price: formatFuelPrice(petrol.price, locale) })}
        </span>
      )}
      <span className="text-[10px] text-[var(--ink-3)]">{t('ui.fares.boatNote')}</span>
    </div>
  );
};
