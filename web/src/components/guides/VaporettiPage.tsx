/** Pagina «Vaporetti ACTV in tempo reale» (/vaporetti-tempo-reale, /en/vaporetto-live). */
import Link from 'next/link';
import { GuideShell, MapCta, Section, SourceList } from './GuideShell';
import { waterLines } from '@/server/guides';
import { LAYER_CATALOG } from '@/lib/layerCatalog';
import { ACTV_FARES, FARES_CHECKED_AT } from '@/lib/fares';
import { lineTextColor, needsDarkOutline } from '@/lib/actvLines';
import { providerCitation } from '@/lib/provenance/providers';
import { GUIDE_PATHS, placePath } from '@/lib/guides/paths';
import { GUIDE_PLACES, type GuideLang } from '@/lib/guides/places';

const T = {
  it: {
    title: 'Vaporetti ACTV in tempo reale',
    h1: 'Vaporetti ACTV in tempo reale: posizioni, ritardi e linee',
    lead: "Dove sono adesso i vaporetti di Venezia, con quanto ritardo viaggiano e quando arrivano alla prossima fermata. Le posizioni vengono dal GPS dei mezzi pubblicato da ACTV; quando il feed manca, la mappa mostra i mezzi simulati dall'orario ufficiale e lo dichiara.",
    cta: 'Apri i vaporetti sulla mappa',
    ctaNote: 'Posizioni in tempo reale, ritardi e percorsi delle linee già accesi; tocca un mezzo per la sua corsa, una fermata per i prossimi arrivi.',
    how: 'Come funziona il tempo reale',
    lines: 'Linee di navigazione ACTV',
    linesLead: 'Linee urbane di navigazione presenti nell\'orario ufficiale ACTV (GTFS), con il colore di linea e i capolinea come scritti nel feed. Alcune sono stagionali o attive solo in certe fasce orarie; N indica le linee notturne.',
    line: 'Linea',
    terminals: 'Capolinea',
    tickets: 'Biglietti',
    ticketRows: [
      { label: 'Biglietto ordinario 75 minuti (vaporetto, bus, tram, People Mover)', price: ACTV_FARES.reteUnica },
      { label: "Biglietto aerobus (da e per l'aeroporto)", price: ACTV_FARES.aerobus },
      { label: '75 minuti con tessera Venezia Unica abilitata (residenti, studenti, pendolari)', price: ACTV_FARES.veneziaUnica },
    ],
    ticketsNote: (d: string) => `Il biglietto vale 75 minuti dalla prima validazione. Prezzi pubblicati da AVM/ACTV, verificati da VOD il ${d}: controlla sempre le tariffe in vigore.`,
    places: 'Come arrivare ai luoghi principali',
    placesLead: 'Percorsi calcolati sull\'orario ufficiale dalla stazione, da Piazzale Roma e dall\'aeroporto.',
    plannerCta: 'Calcola un percorso',
    plannerNote: 'Da una fermata, un indirizzo o un numero civico a un altro, con tutti i mezzi e a piedi.',
  },
  en: {
    title: 'Live ACTV waterbuses',
    h1: 'Live ACTV waterbuses (vaporetto): positions, delays and lines',
    lead: 'Where Venice waterbuses are right now, how late they are and when they reach the next stop. Positions come from the vehicles\' GPS published by ACTV; when the feed is missing, the map shows boats simulated from the official timetable and says so.',
    cta: 'Open waterbuses on the map',
    ctaNote: 'Live positions, delays and line routes already on; tap a boat for its trip, a stop for the next arrivals.',
    how: 'How live tracking works',
    lines: 'ACTV waterbus lines',
    linesLead: 'Urban waterbus lines in ACTV\'s official timetable (GTFS), with the line colour and terminals as written in the feed. Some are seasonal or run only at certain times; N marks night lines.',
    line: 'Line',
    terminals: 'Terminals',
    tickets: 'Tickets',
    ticketRows: [
      { label: 'Ordinary 75-minute ticket (waterbus, bus, tram, People Mover)', price: ACTV_FARES.reteUnica },
      { label: 'Airport ticket (to and from the airport)', price: ACTV_FARES.aerobus },
      { label: '75 minutes with an enabled Venezia Unica card (residents, students, commuters)', price: ACTV_FARES.veneziaUnica },
    ],
    ticketsNote: (d: string) => `The ticket is valid for 75 minutes from first validation. Prices published by AVM/ACTV, checked by VOD on ${d}: always check current fares.`,
    places: 'Getting to the main places',
    placesLead: 'Routes computed on the official timetable from the station, Piazzale Roma and the airport.',
    plannerCta: 'Plan a trip',
    plannerNote: 'From a stop, an address or a house number to another, with every mode and on foot.',
  },
} as const;

export function VaporettiPage({ lang }: { lang: GuideLang }) {
  const t = T[lang];
  const realtime = LAYER_CATALOG.find((l) => l.id === 'vaporetti_realtime');
  const locale = lang === 'it' ? 'it-IT' : 'en-GB';
  const eur = (v: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(v);
  const checked = new Date(`${FARES_CHECKED_AT}T12:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  const lines = waterLines();

  return (
    <GuideShell lang={lang} alternatePath={GUIDE_PATHS.vaporetti[lang === 'it' ? 'en' : 'it']} crumbs={[{ name: t.title, path: GUIDE_PATHS.vaporetti[lang] }]}>
      <section className="flex flex-col gap-3 max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.h1}</h1>
        <p className="text-sm text-[var(--ink-2)] leading-relaxed">{t.lead}</p>
      </section>

      <MapCta href="/?layers=vaporetti_realtime,vaporetti_live,rotte_actv" label={t.cta} note={t.ctaNote} />

      {realtime && (
        <Section id="tempo-reale" title={t.how}>
          <p className="text-sm text-[var(--ink-2)] leading-relaxed">{lang === 'it' ? realtime.descriptionIt : realtime.descriptionEn}</p>
          <p className="text-sm text-[var(--ink-2)] leading-relaxed">{lang === 'it' ? realtime.technicalNotesIt : realtime.technicalNotesEn}</p>
        </Section>
      )}

      <Section id="linee" title={t.lines}>
        <p className="text-sm text-[var(--ink-2)] leading-relaxed">{t.linesLead}</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm" data-testid="water-lines">
          {lines.map((l) => (
            <li key={l.line} className="flex items-center gap-3 border-b border-[var(--rule)] py-1.5">
              <span
                className="inline-flex items-center justify-center min-w-10 px-1.5 h-6 rounded-md text-xs font-bold font-mono"
                style={l.color ? { background: l.color, color: lineTextColor(l.line, l.color), boxShadow: needsDarkOutline(l.color) ? 'inset 0 0 0 1px #334155' : undefined } : undefined}
              >
                {l.line}
              </span>
              <span className="text-[var(--ink-2)]">{l.terminals ?? '–'}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="biglietti" title={t.tickets}>
        <ul className="flex flex-col gap-1 text-sm">
          {t.ticketRows.map((r) => (
            <li key={r.label} className="flex justify-between gap-4 border-b border-[var(--rule)] py-1.5">
              <span className="text-[var(--ink-2)]">{r.label}</span>
              <span className="font-semibold tabular-nums shrink-0">{eur(r.price)}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-[var(--ink-3)]">{t.ticketsNote(checked)}</p>
      </Section>

      <Section id="luoghi" title={t.places}>
        <p className="text-sm text-[var(--ink-2)]">{t.placesLead}</p>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
          {GUIDE_PLACES.map((p) => (
            <li key={p.id}>
              <Link href={placePath(lang, p.slug[lang])} className="block px-3 py-2 rounded-xl border border-[var(--rule)] hover:border-cyan-500/50 hover:text-cyan-400">
                {p.name[lang]}
              </Link>
            </li>
          ))}
        </ul>
        <MapCta href="/?open=planner" label={t.plannerCta} note={t.plannerNote} />
      </Section>

      <SourceList lang={lang} sources={[providerCitation('actvRealtime'), providerCitation('actvGtfs'), providerCitation('actvFares')]} />
    </GuideShell>
  );
}
