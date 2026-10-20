/** Pagina «Marea a Venezia oggi» (/marea-venezia, /en/venice-tide): misura, previsione e soglie, già nell'HTML. */
import Link from 'next/link';
import { GuideShell, MapCta, Section, SourceList } from './GuideShell';
import { tideSnapshot } from '@/server/guides';
import { getFloodedGroundPercentage, getSirenTones, romeLocalNow } from '@/lib/flood';
import { PASSERELLE_MIN_THRESHOLD_CM } from '@/lib/passerelle';
import { PROVIDERS, providerCitation } from '@/lib/provenance/providers';
import { formatSignedCm } from '@/lib/time';
import { GUIDE_PATHS } from '@/lib/guides/paths';
import { MOSE_REFERENCE_CM } from '@/lib/guides/content';
import type { GuideLang } from '@/lib/guides/places';
import type { TideCategory } from '@/lib/contracts/tide';
import { SITE_URL } from '@/lib/site';

const T = {
  it: {
    title: 'Marea a Venezia oggi',
    h1: 'Marea a Venezia oggi: livello in tempo reale e previsioni',
    lead: "Livello dell'acqua misurato a Punta della Salute, la stazione di riferimento del Comune di Venezia, e previsione ufficiale dei prossimi massimi e minimi. Pagina e mappa si aggiornano ogni minuto.",
    now: 'Adesso a Punta della Salute',
    measuredAt: 'misura delle',
    unavailable: "Il Centro Maree non sta rispondendo: nessun valore viene mostrato al posto della misura. Riprova tra qualche minuto o consulta il sito del Comune.",
    trend: { IN_AUMENTO: 'in crescita', IN_CALO: 'in calo' },
    category: { NORMALE: 'marea normale', SOSTENUTA: 'marea sostenuta', MOLTO_SOSTENUTA: 'marea molto sostenuta', ECCEZIONALE: 'marea eccezionale' } as Record<TideCategory, string>,
    forecast: 'Previsione dei prossimi massimi e minimi',
    forecastIssued: 'Previsione del Centro Maree emessa il',
    forecastStale: "Attenzione: l'ultima previsione pubblicata è vecchia, potrebbe non essere aggiornata.",
    noForecast: 'Previsione non disponibile in questo momento.',
    when: 'Quando',
    type: 'Tipo',
    level: 'Livello',
    max: 'massimo',
    min: 'minimo',
    sirens: 'sirene',
    tones: (n: number) => (n === 1 ? '1 tono' : `${n} toni`),
    stations: 'Le altre stazioni della laguna',
    stationsLead: 'Livelli misurati nello stesso momento dalle stazioni del Comune, dalle bocche di porto al centro storico.',
    station: 'Stazione',
    thresholds: "Soglie dell'acqua alta: cosa succede a ogni livello",
    thresholdsLead: "I livelli si riferiscono allo zero mareografico di Punta della Salute: +110 cm non significa 110 cm d'acqua in strada. La percentuale è la quota indicativa di suolo pedonale del centro storico sott'acqua, dalla tabella del Centro Maree.",
    flooded: 'Suolo allagato',
    what: 'Categoria e segnali',
    rows: {
      80: `Marea sostenuta: si allagano le zone più basse, come Piazza San Marco; da +${PASSERELLE_MIN_THRESHOLD_CM} cm il piano prevede le prime passerelle`,
      90: 'Marea sostenuta',
      100: 'Marea sostenuta',
      110: `Molto sostenuta: suonano le sirene; di norma si valuta il sollevamento del MOSE (da circa +${MOSE_REFERENCE_CM} cm)`,
      120: 'Molto sostenuta',
      130: 'Molto sostenuta',
      140: 'Eccezionale',
      150: 'Eccezionale',
    } as Record<number, string>,
    how: 'Come leggere la marea',
    howBody: [
      "La marea a Venezia sale e scende due volte al giorno; vento di scirocco, bassa pressione e sesse dell'Adriatico possono alzarla oltre il previsto astronomico.",
      "Le sirene suonano quando è prevista una marea da +110 cm: un tono per +110 cm e un tono in più ogni 10 cm, fino a quattro toni da +140 cm.",
      "Con il MOSE alzato la marea in laguna resta più bassa di quella in mare: la mappa mostra entrambe le misure alle bocche di porto.",
    ],
    ctaMap: 'Apri la mappa dell\'acqua alta',
    ctaNote: 'Marea in tempo reale, passerelle previste, stazioni e MOSE già accesi sulla mappa.',
    ctaSim: 'Simula un livello di acqua alta',
    ctaSimNote: 'Scegli un livello e guarda quali calli e campi andrebbero sott\'acqua, con il percorso più asciutto.',
    embed: 'Incorpora il livello della marea nel tuo sito',
    embedBody: 'Un riquadro gratuito con il livello attuale, aggiornato ogni minuto, con fonte e link alla pagina. Copia il codice:',
    related: 'Vedi anche',
    relatedLinks: [
      { href: GUIDE_PATHS.faq.it, label: "Domande frequenti sull'acqua alta" },
      { href: GUIDE_PATHS.glossary.it, label: 'Glossario: ZMPS, MOSE, passerelle, sirene' },
      { href: GUIDE_PATHS.gettingTo.it, label: 'Come arrivare a piedi e in vaporetto' },
    ],
  },
  en: {
    title: 'Venice tide today',
    h1: 'Venice tide today: live level and forecast',
    lead: 'Water level measured at Punta della Salute, the City of Venice reference station, with the official forecast of the next high and low tides. The page and the map refresh every minute.',
    now: 'Now at Punta della Salute',
    measuredAt: 'measured at',
    unavailable: 'The Tide Centre is not responding: no value is shown in place of the measurement. Try again in a few minutes or check the City website.',
    trend: { IN_AUMENTO: 'rising', IN_CALO: 'falling' },
    category: { NORMALE: 'normal tide', SOSTENUTA: 'sustained tide', MOLTO_SOSTENUTA: 'very sustained tide', ECCEZIONALE: 'exceptional tide' } as Record<TideCategory, string>,
    forecast: 'Forecast of the next high and low tides',
    forecastIssued: 'Tide Centre forecast issued on',
    forecastStale: 'Warning: the latest published forecast is old and may be out of date.',
    noForecast: 'Forecast not available right now.',
    when: 'When',
    type: 'Type',
    level: 'Level',
    max: 'high',
    min: 'low',
    sirens: 'sirens',
    tones: (n: number) => (n === 1 ? '1 tone' : `${n} tones`),
    stations: 'Other lagoon stations',
    stationsLead: 'Levels measured at the same time by the City stations, from the lagoon inlets to the historic centre.',
    station: 'Station',
    thresholds: 'High-water thresholds: what happens at each level',
    thresholdsLead: 'Levels refer to the Punta della Salute tide datum: +110 cm does not mean 110 cm of water in the street. The percentage is the indicative share of pedestrian ground in the historic centre under water, from the Tide Centre table.',
    flooded: 'Flooded ground',
    what: 'Category and signals',
    rows: {
      80: `Sustained: the lowest areas (St Mark's Square) start to flood; from +${PASSERELLE_MIN_THRESHOLD_CM} cm the plan sets up the first raised walkways`,
      90: 'Sustained',
      100: 'Sustained',
      110: `Very sustained: sirens sound; raising MOSE is normally considered (from about +${MOSE_REFERENCE_CM} cm)`,
      120: 'Very sustained',
      130: 'Very sustained',
      140: 'Exceptional',
      150: 'Exceptional',
    } as Record<number, string>,
    how: 'How to read the tide',
    howBody: [
      'The tide in Venice rises and falls twice a day; sirocco wind, low pressure and Adriatic seiches can push it above the astronomical forecast.',
      'Sirens sound when a tide of +110 cm is forecast: one tone for +110 cm and one more tone every 10 cm, up to four tones from +140 cm.',
      'With MOSE raised the tide in the lagoon stays lower than at sea: the map shows both readings at the lagoon inlets.',
    ],
    ctaMap: 'Open the high-water map',
    ctaNote: 'Live tide, planned raised walkways, stations and MOSE already switched on.',
    ctaSim: 'Simulate a high-water level',
    ctaSimNote: 'Pick a level and see which streets and squares would flood, with the driest route.',
    embed: 'Embed the tide level on your website',
    embedBody: 'A free box with the current level, refreshed every minute, with source and link to this page. Copy the code:',
    related: 'See also',
    relatedLinks: [
      { href: GUIDE_PATHS.faq.en, label: 'High-water FAQ' },
      { href: GUIDE_PATHS.glossary.en, label: 'Glossary: tide datum, MOSE, walkways, sirens' },
      { href: GUIDE_PATHS.gettingTo.en, label: 'Getting around on foot and by waterbus' },
    ],
  },
} as const;

/** «2026-10-20 14:35:00» (ora di Venezia) -> «20/10/2026 14:35» */
export function formatRomeLocal(s: string): string {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : s;
}

const THRESHOLDS = [80, 90, 100, 110, 120, 130, 140, 150];

export async function TidePage({ lang }: { lang: GuideLang }) {
  const t = T[lang];
  const tide = await tideSnapshot();
  const ref = tide?.ok ? tide.data.reference : null;
  const forecast = tide?.data.forecast ?? null;
  const nowLocal = romeLocalNow();
  const upcoming = (forecast?.extremes ?? []).filter((e) => e.at >= nowLocal).slice(0, 6);
  const stations = (tide?.ok ? tide.data.stations : []).filter((s) => s.id !== ref?.id).sort((a, b) => a.name.localeCompare(b.name));
  const nf = (n: number) => n.toLocaleString(lang === 'it' ? 'it-IT' : 'en-GB');
  const embedPath = lang === 'it' ? '/embed/marea' : '/embed/tide';
  const embedCode = `<iframe src="${SITE_URL}${embedPath}" title="${t.title} – VOD" width="320" height="180" style="border:0" loading="lazy"></iframe>`;

  const schema = [
    {
      '@type': 'Dataset',
      name: lang === 'it' ? 'Livello di marea a Venezia (Punta della Salute) in tempo reale' : 'Venice tide level (Punta della Salute), live',
      description: t.lead,
      url: `${SITE_URL}${GUIDE_PATHS.tide[lang]}`,
      isAccessibleForFree: true,
      creator: { '@type': 'Organization', name: PROVIDERS.cpsm.name, url: PROVIDERS.cpsm.url },
      spatialCoverage: {
        '@type': 'Place',
        name: 'Venezia, Punta della Salute',
        ...(ref ? { geo: { '@type': 'GeoCoordinates', latitude: ref.lat, longitude: ref.lon } } : {}),
      },
      distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${SITE_URL}/api/tide` }],
      ...(ref ? { dateModified: ref.observedAt.replace(' ', 'T') } : {}),
    },
  ];

  return (
    <GuideShell lang={lang} alternatePath={GUIDE_PATHS.tide[lang === 'it' ? 'en' : 'it']} crumbs={[{ name: t.title, path: GUIDE_PATHS.tide[lang] }]} schema={schema}>
      <section className="flex flex-col gap-3 max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.h1}</h1>
        <p className="text-sm text-[var(--ink-2)] leading-relaxed">{t.lead}</p>
      </section>

      <section aria-labelledby="now-title" className="p-5 rounded-2xl border border-[var(--rule)] bg-[var(--rule)]/20 flex flex-col gap-2" data-testid="tide-now">
        <h2 id="now-title" className="text-sm font-mono text-[var(--ink-3)] uppercase tracking-wide">{t.now}</h2>
        {ref ? (
          <>
            <p className="text-4xl sm:text-5xl font-bold tabular-nums">{formatSignedCm(ref.levelCm)}</p>
            <p className="text-sm text-[var(--ink-2)]">
              {tide?.data.category ? t.category[tide.data.category] : ''}
              {tide?.data.trend ? ` · ${t.trend[tide.data.trend]}` : ''} · {t.measuredAt} {formatRomeLocal(ref.observedAt)}
            </p>
          </>
        ) : (
          <p className="text-sm text-[var(--ink-2)]">
            {t.unavailable}{' '}
            <a href={PROVIDERS.cpsm.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">comune.venezia.it</a>
          </p>
        )}
      </section>

      <MapCta href="/?preset=acqua-alta" label={t.ctaMap} note={t.ctaNote} />

      <Section id="previsione" title={t.forecast}>
        {forecast && upcoming.length > 0 ? (
          <>
            <p className="text-xs text-[var(--ink-3)]">{t.forecastIssued} {formatRomeLocal(forecast.issuedAt)}</p>
            {forecast.stale && <p className="text-xs text-amber-400">{t.forecastStale}</p>}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[var(--ink-3)] text-xs font-mono">
                  <tr><th className="py-1.5 pr-4">{t.when}</th><th className="py-1.5 pr-4">{t.type}</th><th className="py-1.5 pr-4">{t.level}</th><th className="py-1.5">{t.sirens}</th></tr>
                </thead>
                <tbody>
                  {upcoming.map((e) => {
                    const tones = e.type === 'max' ? getSirenTones(e.levelCm) : 0;
                    return (
                      <tr key={e.at} className="border-t border-[var(--rule)]">
                        <td className="py-1.5 pr-4 tabular-nums">{formatRomeLocal(e.at)}</td>
                        <td className="py-1.5 pr-4">{e.type === 'max' ? t.max : t.min}</td>
                        <td className="py-1.5 pr-4 tabular-nums font-semibold">{formatSignedCm(e.levelCm)}</td>
                        <td className="py-1.5">{tones > 0 ? t.tones(tones) : '–'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--ink-2)]">{t.noForecast}</p>
        )}
      </Section>

      <Section id="soglie" title={t.thresholds}>
        <p className="text-sm text-[var(--ink-2)] leading-relaxed">{t.thresholdsLead}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[var(--ink-3)] text-xs font-mono">
              <tr><th className="py-1.5 pr-4">{t.level}</th><th className="py-1.5 pr-4">{t.flooded}</th><th className="py-1.5 pr-4">{t.sirens}</th><th className="py-1.5">{t.what}</th></tr>
            </thead>
            <tbody>
              {THRESHOLDS.map((cm) => {
                const tones = getSirenTones(cm);
                return (
                  <tr key={cm} className="border-t border-[var(--rule)] align-top">
                    <td className="py-1.5 pr-4 tabular-nums font-semibold">+{cm} cm</td>
                    <td className="py-1.5 pr-4 tabular-nums">{nf(getFloodedGroundPercentage(cm))}%</td>
                    <td className="py-1.5 pr-4">{tones > 0 ? t.tones(tones) : '–'}</td>
                    <td className="py-1.5 text-[var(--ink-2)]">{t.rows[cm]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <MapCta href="/?open=tide" label={t.ctaSim} note={t.ctaSimNote} />
      </Section>

      <Section id="come-leggere" title={t.how}>
        {t.howBody.map((p) => (
          <p key={p} className="text-sm text-[var(--ink-2)] leading-relaxed">{p}</p>
        ))}
      </Section>

      {stations.length > 0 && (
        <Section id="stazioni" title={t.stations}>
          <p className="text-sm text-[var(--ink-2)]">{t.stationsLead}</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            {stations.map((s) => (
              <li key={s.id} className="flex justify-between gap-3 border-b border-[var(--rule)] py-1">
                <span>{s.name}</span>
                <span className="tabular-nums font-semibold">{formatSignedCm(s.levelCm)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section id="incorpora" title={t.embed}>
        <p className="text-sm text-[var(--ink-2)]">{t.embedBody}</p>
        <pre className="text-xs font-mono p-3 rounded-xl bg-[var(--rule)]/40 border border-[var(--rule)] whitespace-pre-wrap break-all">{embedCode}</pre>
      </Section>

      <Section id="vedi-anche" title={t.related}>
        <ul className="flex flex-col gap-1.5 text-sm">
          {t.relatedLinks.map((l) => (
            <li key={l.href}><Link href={l.href} className="text-cyan-400 hover:underline">{l.label}</Link></li>
          ))}
        </ul>
      </Section>

      <SourceList lang={lang} sources={[providerCitation('cpsm'), providerCitation('passerelle'), providerCitation('comuneOpenData')]} />
    </GuideShell>
  );
}
