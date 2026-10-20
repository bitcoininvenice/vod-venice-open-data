/**
 * Riquadro della marea da incorporare in altri siti (/embed/marea, /embed/tide): livello attuale con fonte e link
 * alla pagina completa. È l'unica rotta che può stare in un iframe di un altro dominio (next.config.ts).
 */
import { tideSnapshot } from '@/server/guides';
import { formatSignedCm } from '@/lib/time';
import { GUIDE_PATHS } from '@/lib/guides/paths';
import type { GuideLang } from '@/lib/guides/places';
import { SITE_URL } from '@/lib/site';
import { formatRomeLocal } from './TidePage';

const T = {
  it: { title: 'Marea a Venezia', at: 'Punta della Salute', na: 'Dato non disponibile', source: 'Fonte: Comune di Venezia – Centro Maree', more: 'Previsione e soglie su VOD', trend: { IN_AUMENTO: '↑ in crescita', IN_CALO: '↓ in calo' } },
  en: { title: 'Venice tide', at: 'Punta della Salute', na: 'Data not available', source: 'Source: City of Venice – Tide Centre', more: 'Forecast and thresholds on VOD', trend: { IN_AUMENTO: '↑ rising', IN_CALO: '↓ falling' } },
} as const;

export async function TideEmbed({ lang }: { lang: GuideLang }) {
  const t = T[lang];
  const tide = await tideSnapshot();
  const ref = tide?.ok ? tide.data.reference : null;
  const level = ref?.levelCm ?? null;
  const tone = level === null ? 'text-[var(--ink)]' : level >= 110 ? 'text-rose-400' : level >= 80 ? 'text-amber-400' : 'text-cyan-400';
  return (
    <div lang={lang} className="min-h-screen p-3 bg-[var(--ground)] text-[var(--ink)] font-sans flex flex-col justify-between gap-2 select-text">
      <div>
        <p className="text-xs font-mono text-[var(--ink-3)] uppercase tracking-wide">{t.title} · {t.at}</p>
        {ref ? (
          <>
            <p className={`text-4xl font-bold tabular-nums ${tone}`}>{formatSignedCm(ref.levelCm)}</p>
            <p className="text-xs text-[var(--ink-2)]">{tide?.data.trend ? `${t.trend[tide.data.trend]} · ` : ''}{formatRomeLocal(ref.observedAt)}</p>
          </>
        ) : (
          <p className="text-sm text-[var(--ink-2)] mt-2">{t.na}</p>
        )}
      </div>
      <div className="text-[10px] text-[var(--ink-3)] leading-snug">
        <p>{t.source}</p>
        <a href={`${SITE_URL}${GUIDE_PATHS.tide[lang]}`} target="_blank" rel="noopener" className="text-cyan-400 hover:underline">{t.more}</a>
      </div>
    </div>
  );
}
