/** Hub delle guide, elenco «Come arrivare», FAQ e glossario: pagine statiche, bilingui. */
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { GuideShell, MapCta, Section } from './GuideShell';
import { faqItems, glossaryTerms } from '@/lib/guides/content';
import { GUIDE_PATHS, placePath } from '@/lib/guides/paths';
import { GUIDE_PLACES, type GuideLang } from '@/lib/guides/places';
import { ACTV_FARES } from '@/lib/fares';
import { SITE_URL } from '@/lib/site';

const other = (lang: GuideLang): GuideLang => (lang === 'it' ? 'en' : 'it');

function Lead({ h1, lead }: { h1: string; lead: string }) {
  return (
    <section className="flex flex-col gap-3 max-w-3xl">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{h1}</h1>
      <p className="text-sm text-[var(--ink-2)] leading-relaxed">{lead}</p>
    </section>
  );
}

function CardLink({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link href={href} className="group p-4 rounded-2xl border border-[var(--rule)] bg-[var(--rule)]/20 hover:border-cyan-500/50 flex flex-col gap-1.5">
      <span className="text-sm font-bold flex items-center gap-1.5 group-hover:text-cyan-400">{title} <ArrowRight className="w-3.5 h-3.5" aria-hidden /></span>
      <span className="text-xs text-[var(--ink-2)] leading-relaxed">{body}</span>
    </Link>
  );
}

const HUB = {
  it: {
    title: 'Guide di Venezia',
    h1: 'Come muoversi a Venezia: guide pratiche con dati aperti',
    lead: 'Marea, vaporetti, percorsi a piedi e in barca: guide brevi che usano gli stessi dati ufficiali della mappa (Comune di Venezia, ACTV, Alilaguna, OpenStreetMap) e rimandano alla mappa già pronta.',
    cards: [
      { id: 'tide', title: 'Marea a Venezia oggi', body: 'Livello in tempo reale a Punta della Salute, previsione, soglie dell\'acqua alta e sirene.' },
      { id: 'vaporetti', title: 'Vaporetti ACTV in tempo reale', body: 'Posizioni GPS, ritardi, linee di navigazione e biglietti.' },
      { id: 'gettingTo', title: 'Come arrivare', body: 'San Marco, Rialto, stazione, aeroporto, Murano, Burano, Lido e altri luoghi, con percorsi calcolati dall\'orario.' },
      { id: 'faq', title: 'Domande frequenti', body: 'Acqua alta, MOSE, biglietti, aeroporto, dati e privacy.' },
      { id: 'glossary', title: 'Glossario', body: 'Zero mareografico, sestieri, pontili, GTFS, licenze open data.' },
    ] as const,
    move: 'Muoversi a Venezia in breve',
    moveBody: [
      'Il centro storico si gira a piedi: non ci sono auto né biciclette, e calli e ponti collegano tutti i sestieri. Molti percorsi a piedi sono più veloci del vaporetto.',
      `Il trasporto pubblico sull'acqua è di ACTV (vaporetti e motoscafi) e, per l'aeroporto, anche di Alilaguna. Il biglietto ordinario ACTV vale 75 minuti e costa ${new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(ACTV_FARES.reteUnica)}.`,
      'Auto e autobus arrivano fino a Piazzale Roma e al Tronchetto, collegati dal People Mover; i treni a Santa Lucia.',
      'Con l\'acqua alta alcune zone si allagano e il Comune monta le passerelle sui percorsi principali: la mappa calcola il percorso più asciutto.',
    ],
    cta: 'Apri la mappa',
    ctaNote: 'Vaporetti in tempo reale, marea, percorsi e decine di livelli di dati aperti.',
  },
  en: {
    title: 'Venice guides',
    h1: 'Getting around Venice: practical guides built on open data',
    lead: 'Tide, waterbuses, walking and boat routes: short guides using the same official data as the map (City of Venice, ACTV, Alilaguna, OpenStreetMap), each linking to the map ready to use.',
    cards: [
      { id: 'tide', title: 'Venice tide today', body: 'Live level at Punta della Salute, forecast, high-water thresholds and sirens.' },
      { id: 'vaporetti', title: 'Live ACTV waterbuses', body: 'GPS positions, delays, waterbus lines and tickets.' },
      { id: 'gettingTo', title: 'Getting there', body: 'St Mark\'s, Rialto, the station, the airport, Murano, Burano, the Lido and more, with routes computed from the timetable.' },
      { id: 'faq', title: 'FAQ', body: 'High water, MOSE, tickets, the airport, data and privacy.' },
      { id: 'glossary', title: 'Glossary', body: 'Tide datum, sestieri, waterbus stops, GTFS, open-data licences.' },
    ] as const,
    move: 'Getting around Venice in short',
    moveBody: [
      'The historic centre is explored on foot: there are no cars or bicycles, and streets and bridges connect every district. Many walks are faster than the waterbus.',
      `Public transport on the water is run by ACTV (vaporetti and motoscafi) and, for the airport, also by Alilaguna. The ordinary ACTV ticket lasts 75 minutes and costs ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(ACTV_FARES.reteUnica)}.`,
      'Cars and buses reach Piazzale Roma and Tronchetto, linked by the People Mover; trains arrive at Santa Lucia.',
      'At high water some areas flood and the City sets up raised walkways on the main routes: the map computes the driest route.',
    ],
    cta: 'Open the map',
    ctaNote: 'Live waterbuses, tide, routes and dozens of open-data layers.',
  },
} as const;

export function GuidesHubPage({ lang }: { lang: GuideLang }) {
  const t = HUB[lang];
  const schema = [
    {
      '@type': 'ItemList',
      itemListElement: [
        ...t.cards.map((c) => ({ title: c.title, path: GUIDE_PATHS[c.id][lang] })),
        ...GUIDE_PLACES.map((p) => ({ title: p.name[lang], path: placePath(lang, p.slug[lang]) })),
      ].map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.title, url: `${SITE_URL}${x.path}` })),
    },
  ];
  return (
    <GuideShell lang={lang} alternatePath={GUIDE_PATHS.hub[other(lang)]} crumbs={[{ name: t.title, path: GUIDE_PATHS.hub[lang] }]} schema={schema}>
      <Lead h1={t.h1} lead={t.lead} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {t.cards.map((c) => <CardLink key={c.id} href={GUIDE_PATHS[c.id][lang]} title={c.title} body={c.body} />)}
      </div>
      <Section id="muoversi" title={t.move}>
        {t.moveBody.map((p) => <p key={p} className="text-sm text-[var(--ink-2)] leading-relaxed">{p}</p>)}
      </Section>
      <PlacesGrid lang={lang} />
      <MapCta href="/" label={t.cta} note={t.ctaNote} />
    </GuideShell>
  );
}

function PlacesGrid({ lang }: { lang: GuideLang }) {
  return (
    <Section id="luoghi" title={lang === 'it' ? 'Come arrivare ai luoghi principali' : 'Getting to the main places'}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {GUIDE_PLACES.map((p) => (
          <CardLink key={p.id} href={placePath(lang, p.slug[lang])} title={p.name[lang]} body={p.intro[lang]} />
        ))}
      </div>
    </Section>
  );
}

const GETTING = {
  it: {
    title: 'Come arrivare',
    h1: 'Come arrivare ai luoghi di Venezia e della laguna',
    lead: "Per ogni luogo: i percorsi più veloci dalla stazione di Santa Lucia, da Piazzale Roma e dall'aeroporto, calcolati dal planner di VOD sull'orario ufficiale ACTV e Alilaguna, e le linee che fermano ai pontili vicini.",
    cta: 'Calcola un percorso da qualsiasi punto',
    ctaNote: 'Da una fermata, un indirizzo o un numero civico (es. «Cannaregio 3450»), con tutti i mezzi e a piedi.',
  },
  en: {
    title: 'Getting there',
    h1: 'How to get to places in Venice and the lagoon',
    lead: 'For each place: the fastest routes from Santa Lucia station, Piazzale Roma and the airport, computed by the VOD planner on the official ACTV and Alilaguna timetables, and the lines stopping nearby.',
    cta: 'Plan a route from anywhere',
    ctaNote: 'From a stop, an address or a house number (e.g. “Cannaregio 3450”), with every mode and on foot.',
  },
} as const;

export function GettingToHubPage({ lang }: { lang: GuideLang }) {
  const t = GETTING[lang];
  return (
    <GuideShell lang={lang} alternatePath={GUIDE_PATHS.gettingTo[other(lang)]} crumbs={[{ name: t.title, path: GUIDE_PATHS.gettingTo[lang] }]}>
      <Lead h1={t.h1} lead={t.lead} />
      <MapCta href="/?open=planner" label={t.cta} note={t.ctaNote} />
      <PlacesGrid lang={lang} />
    </GuideShell>
  );
}

const FAQ_T = {
  it: { title: 'Domande frequenti', h1: 'Domande frequenti su Venezia: acqua alta, vaporetti e dati aperti', lead: 'Risposte brevi alle domande più comuni, con i numeri presi dalle stesse fonti ufficiali della mappa.' },
  en: { title: 'FAQ', h1: 'Venice FAQ: high water, waterbuses and open data', lead: 'Short answers to the most common questions, with figures taken from the same official sources as the map.' },
} as const;

export function FaqPage({ lang }: { lang: GuideLang }) {
  const t = FAQ_T[lang];
  const items = faqItems(lang);
  const schema = [
    {
      '@type': 'FAQPage',
      mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];
  return (
    <GuideShell lang={lang} alternatePath={GUIDE_PATHS.faq[other(lang)]} crumbs={[{ name: t.title, path: GUIDE_PATHS.faq[lang] }]} schema={schema}>
      <Lead h1={t.h1} lead={t.lead} />
      <div className="flex flex-col gap-3">
        {items.map((f, i) => (
          <details key={f.q} open={i < 3} className="group p-4 rounded-2xl border border-[var(--rule)] bg-[var(--rule)]/20">
            <summary className="cursor-pointer list-none flex items-start justify-between gap-3">
              <h2 className="text-sm sm:text-base font-bold">{f.q}</h2>
              <span aria-hidden className="text-[var(--ink-3)] group-open:rotate-45 transition-transform text-lg leading-none">+</span>
            </summary>
            <p className="mt-2 text-sm text-[var(--ink-2)] leading-relaxed">{f.a}</p>
            {f.link && (
              <Link href={f.link.href} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:underline">
                {f.link.label} <ArrowRight className="w-3.5 h-3.5" aria-hidden />
              </Link>
            )}
          </details>
        ))}
      </div>
    </GuideShell>
  );
}

const GLOSSARY_T = {
  it: { title: 'Glossario', h1: 'Glossario di Venezia: laguna, marea, trasporti e open data', lead: 'I termini che si incontrano sulla mappa e nelle fonti ufficiali, spiegati in breve.' },
  en: { title: 'Glossary', h1: 'Venice glossary: lagoon, tide, transport and open data', lead: 'The terms you meet on the map and in official sources, briefly explained.' },
} as const;

export function GlossaryPage({ lang }: { lang: GuideLang }) {
  const t = GLOSSARY_T[lang];
  const terms = glossaryTerms(lang);
  const url = `${SITE_URL}${GUIDE_PATHS.glossary[lang]}`;
  const schema = [
    {
      '@type': 'DefinedTermSet',
      '@id': `${url}#termini`,
      name: t.h1,
      hasDefinedTerm: terms.map((x) => ({ '@type': 'DefinedTerm', '@id': `${url}#${x.id}`, name: x.term, description: x.definition, inDefinedTermSet: `${url}#termini` })),
    },
  ];
  return (
    <GuideShell lang={lang} alternatePath={GUIDE_PATHS.glossary[other(lang)]} crumbs={[{ name: t.title, path: GUIDE_PATHS.glossary[lang] }]} schema={schema}>
      <Lead h1={t.h1} lead={t.lead} />
      <dl className="flex flex-col gap-4">
        {terms.map((x) => (
          <div key={x.id} id={x.id} className="scroll-mt-24 border-b border-[var(--rule)] pb-3">
            <dt className="text-sm sm:text-base font-bold">{x.term}</dt>
            <dd className="mt-1 text-sm text-[var(--ink-2)] leading-relaxed">{x.definition}</dd>
          </div>
        ))}
      </dl>
    </GuideShell>
  );
}
