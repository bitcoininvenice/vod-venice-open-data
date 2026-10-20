/**
 * «Come arrivare a <luogo>» (/come-arrivare/<slug>, /en/getting-to/<slug>): percorsi calcolati dal planner di VOD
 * sull'orario ufficiale e linee che fermano ai pontili vicini, dal GTFS ACTV. Nessun percorso scritto a mano.
 */
import Link from 'next/link';
import { Footprints } from 'lucide-react';
import { GuideShell, MapCta, Section, SourceList, relativeVodUrl } from './GuideShell';
import { GUIDE_TIME, guideRoutes, linesAtStops, nextWeekday, type GuideItinerary } from '@/server/guides';
import { lineTextColor, needsDarkOutline } from '@/lib/actvLines';
import { providerCitation } from '@/lib/provenance/providers';
import { GUIDE_PATHS, placePath } from '@/lib/guides/paths';
import { GUIDE_PLACES, type GuideLang, type GuidePlace } from '@/lib/guides/places';
import { SITE_URL } from '@/lib/site';

const OPTION_EN: Record<string, string> = {
  'Alilaguna via acqua': 'Alilaguna by water',
  'ACTV con il bus da Piazzale Roma': 'ACTV bus via Piazzale Roma',
  'ATVO Express': 'ATVO Express',
  'Bus ACTV Linea 2 da Piazzale Roma': 'ACTV bus line 2 from Piazzale Roma',
  'Regionale Trenitalia da Santa Lucia': 'Trenitalia regional train from Santa Lucia',
  'Frecciarossa / Italo Alta Velocità': 'Frecciarossa / Italo high-speed train',
  'Busitalia Veneto da Piazzale Roma': 'Busitalia Veneto from Piazzale Roma',
  'altri mezzi': 'other services',
};

const T = {
  it: {
    hub: 'Come arrivare',
    title: (p: GuidePlace) => `Come arrivare ${p.toIt}`,
    h1: (p: GuidePlace) => `Come arrivare ${p.toIt} in vaporetto, autobus e a piedi`,
    routes: 'Percorsi consigliati',
    routesLead: (d: string) => `Soluzioni calcolate dal planner di VOD sull'orario ufficiale per ${d} alle ${GUIDE_TIME}, senza ritardi né variazioni del servizio. Per un altro orario o un'altra partenza usa la mappa.`,
    from: 'Da',
    walk: 'a piedi',
    walkOnly: (m: number, km: string) => `Tutto a piedi: ${m} min (${km} km)`,
    walked: (m: number) => `${m} m a piedi`,
    lineWord: (n: number) => (n === 1 ? 'linea' : 'linee'),
    depart: 'partenza',
    arrive: 'arrivo',
    notFound: 'Il planner non ha trovato un percorso per questa partenza.',
    openRoute: 'Apri questo percorso sulla mappa',
    lines: 'Linee che fermano qui',
    linesLead: (stops: string) => `Linee di navigazione che l'orario ACTV fa fermare a: ${stops}.`,
    terminals: 'capolinea',
    cta: (p: GuidePlace) => `Calcola il percorso fino ${p.toIt}`,
    ctaNote: 'Scegli la tua partenza e l\'ora: il planner usa tutti i mezzi ACTV e Alilaguna e tiene conto della marea.',
    tideNote: 'Con l\'acqua alta alcune linee possono essere deviate e alcune calli allagate: controlla la marea prima di partire.',
    tideLink: 'Marea a Venezia oggi',
    others: 'Altri luoghi',
    estimate: 'costo stimato',
  },
  en: {
    hub: 'Getting there',
    title: (p: GuidePlace) => `How to get to ${p.name.en}`,
    h1: (p: GuidePlace) => `How to get to ${p.name.en} by waterbus, bus and on foot`,
    routes: 'Suggested routes',
    routesLead: (d: string) => `Options computed by the VOD planner on the official timetable for ${d} at ${GUIDE_TIME}, without delays or service changes. For another time or starting point use the map.`,
    from: 'From',
    walk: 'on foot',
    walkOnly: (m: number, km: string) => `All on foot: ${m} min (${km} km)`,
    walked: (m: number) => `${m} m on foot`,
    lineWord: (n: number) => (n === 1 ? 'line' : 'lines'),
    depart: 'departs',
    arrive: 'arrives',
    notFound: 'The planner found no route from this starting point.',
    openRoute: 'Open this route on the map',
    lines: 'Lines stopping here',
    linesLead: (stops: string) => `Waterbus lines that ACTV's timetable stops at: ${stops}.`,
    terminals: 'terminals',
    cta: (p: GuidePlace) => `Plan your route to ${p.name.en}`,
    ctaNote: 'Choose your starting point and time: the planner uses every ACTV and Alilaguna service and accounts for the tide.',
    tideNote: 'At high water some lines may be diverted and some streets flooded: check the tide before you leave.',
    tideLink: 'Venice tide today',
    others: 'Other places',
    estimate: 'estimated cost',
  },
} as const;

function ItineraryRow({ it, lang }: { it: GuideItinerary; lang: GuideLang }) {
  const t = T[lang];
  const locale = lang === 'it' ? 'it-IT' : 'en-GB';
  const option = it.option ? (lang === 'en' ? (OPTION_EN[it.option] ?? it.option) : it.option) : null;
  const rides = it.lines.filter(Boolean).map((l) => l.replace(/^alilaguna\b/i, 'Alilaguna'));
  return (
    <li className="flex flex-col gap-1 border-t border-[var(--rule)] py-2">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-lg font-bold tabular-nums">{it.minutes} min</span>
        {option && <span className="text-sm font-semibold">{option}</span>}
        <span className="text-sm text-[var(--ink-2)]">
          {rides.length > 0 ? `${t.lineWord(rides.length)} ${rides.join(' → ')}` : t.walk}
        </span>
      </div>
      <p className="text-xs text-[var(--ink-3)] tabular-nums">
        {t.depart} {it.depart} · {t.arrive} {it.arrive} · {t.walked(it.walkMeters)}
        {it.estimatedEur != null && it.estimatedEur > 0
          ? ` · ${t.estimate} ${new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(it.estimatedEur)}`
          : ''}
      </p>
    </li>
  );
}

export async function PlacePage({ lang, place }: { lang: GuideLang; place: GuidePlace }) {
  const t = T[lang];
  const other = lang === 'it' ? 'en' : 'it';
  const date = nextWeekday();
  const locale = lang === 'it' ? 'it-IT' : 'en-GB';
  const dateLabel = new Date(`${date}T12:00:00Z`).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Rome' });
  const routes = await guideRoutes(place, date);
  const { stops, lines } = linesAtStops(place.stopIds);
  const name = place.name[lang];
  const plannerHref = relativeVodUrl(routes.find((r) => r.vodUrl)?.vodUrl ?? null, '/?open=planner');

  const schema = [
    {
      '@type': place.id === 'aeroporto' ? 'Airport' : 'TouristAttraction',
      name,
      ...(place.id === 'aeroporto' ? { iataCode: 'VCE' } : {}),
      description: place.intro[lang],
      address: { '@type': 'PostalAddress', addressLocality: 'Venezia', addressCountry: 'IT' },
      url: `${SITE_URL}${placePath(lang, place.slug[lang])}`,
    },
  ];

  return (
    <GuideShell
      lang={lang}
      alternatePath={placePath(other, place.slug[other])}
      crumbs={[{ name: t.hub, path: GUIDE_PATHS.gettingTo[lang] }, { name: t.title(place), path: placePath(lang, place.slug[lang]) }]}
      schema={schema}
    >
      <section className="flex flex-col gap-3 max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.h1(place)}</h1>
        <p className="text-sm text-[var(--ink-2)] leading-relaxed">{place.intro[lang]}</p>
      </section>

      <MapCta href={plannerHref} label={t.cta(place)} note={t.ctaNote} />

      <Section id="percorsi" title={t.routes}>
        <p className="text-sm text-[var(--ink-2)] leading-relaxed">{t.routesLead(dateLabel)}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="guide-routes">
          {routes.map((r) => (
            <article key={r.origin.id} className="p-4 rounded-2xl border border-[var(--rule)] bg-[var(--rule)]/20 flex flex-col gap-2">
              <h3 className="text-sm font-bold">{t.from} {r.origin.name[lang]}</h3>
              {r.found && r.itineraries.length > 0 ? (
                <ul className="flex flex-col">
                  {r.itineraries.map((it, i) => <ItineraryRow key={i} it={it} lang={lang} />)}
                </ul>
              ) : (
                <p className="text-sm text-[var(--ink-3)]">{t.notFound}</p>
              )}
              {r.walkOnly && (
                <p className="flex items-center gap-1.5 text-xs text-[var(--ink-2)]">
                  <Footprints className="w-3.5 h-3.5" aria-hidden /> {t.walkOnly(r.walkOnly.minutes, (r.walkOnly.meters / 1000).toLocaleString(locale, { maximumFractionDigits: 1 }))}
                </p>
              )}
              {r.vodUrl && (
                <Link href={relativeVodUrl(r.vodUrl)} className="text-xs font-semibold text-cyan-400 hover:underline mt-auto">{t.openRoute}</Link>
              )}
            </article>
          ))}
        </div>
        <p className="text-xs text-[var(--ink-3)]">
          {t.tideNote} <Link href={GUIDE_PATHS.tide[lang]} className="text-cyan-400 hover:underline">{t.tideLink}</Link>
        </p>
      </Section>

      {lines.length > 0 && (
        <Section id="linee" title={t.lines}>
          <p className="text-sm text-[var(--ink-2)]">{t.linesLead(stops.map((s) => s.name).join(', '))}</p>
          <ul className="flex flex-col gap-1.5 text-sm">
            {lines.map((l) => (
              <li key={l.line} className="flex items-center gap-3">
                <span
                  className="inline-flex items-center justify-center min-w-10 px-1.5 h-6 rounded-md text-xs font-bold font-mono border border-[var(--rule)]"
                  style={l.color ? { background: l.color, color: lineTextColor(l.line, l.color), boxShadow: needsDarkOutline(l.color) ? 'inset 0 0 0 1px #334155' : undefined } : undefined}
                >
                  {l.line}
                </span>
                {l.terminals && <span className="text-[var(--ink-2)]">{t.terminals}: {l.terminals}</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section id="altri-luoghi" title={t.others}>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
          {GUIDE_PLACES.filter((p) => p.id !== place.id).map((p) => (
            <li key={p.id}>
              <Link href={placePath(lang, p.slug[lang])} className="block px-3 py-2 rounded-xl border border-[var(--rule)] hover:border-cyan-500/50 hover:text-cyan-400">
                {p.name[lang]}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <SourceList
        lang={lang}
        sources={[
          providerCitation('actvGtfs'),
          providerCitation('alilaguna'),
          ...(place.id === 'aeroporto' ? [providerCitation('atvo')] : []),
          providerCitation('actvFares'),
          providerCitation('osm'),
        ]}
      />
    </GuideShell>
  );
}
