/** Titoli e descrizioni (meta) delle guide: brevi, con la parola chiave all'inizio. */
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { GUIDE_PATHS, languageAlternates, placePath, type GuidePageId } from './paths';
import type { GuideLang, GuidePlace } from './places';

const META: Record<GuidePageId, Record<GuideLang, { title: string; description: string }>> = {
  hub: {
    it: { title: 'Come muoversi a Venezia: guide con dati aperti', description: 'Guide pratiche per muoversi a Venezia: marea e acqua alta in tempo reale, vaporetti ACTV con i ritardi, come arrivare a San Marco, Rialto, aeroporto e isole, FAQ e glossario.' },
    en: { title: 'Getting around Venice: open-data guides', description: 'Practical guides to getting around Venice: live tide and high water, ACTV waterbuses with delays, how to reach St Mark\'s, Rialto, the airport and the islands, FAQ and glossary.' },
  },
  tide: {
    it: { title: 'Marea Venezia oggi: acqua alta in tempo reale e previsioni', description: 'Livello della marea a Venezia adesso (Punta della Salute), previsione dei prossimi massimi e minimi del Centro Maree, soglie dell\'acqua alta, sirene e MOSE.' },
    en: { title: 'Venice tide today: live high water (acqua alta) and forecast', description: 'Current Venice tide level at Punta della Salute, the City Tide Centre forecast of the next highs and lows, high-water thresholds, sirens and MOSE.' },
  },
  vaporetti: {
    it: { title: 'Vaporetti ACTV in tempo reale: mappa, ritardi e linee', description: 'Mappa dei vaporetti di Venezia in tempo reale con i ritardi verificati, tutte le linee di navigazione ACTV con i capolinea, biglietti e percorsi verso i luoghi principali.' },
    en: { title: 'Live Venice vaporetto map: ACTV waterbus tracker and lines', description: 'Live map of Venice waterbuses with checked delays, every ACTV waterbus line with its terminals, tickets and routes to the main places.' },
  },
  gettingTo: {
    it: { title: 'Come arrivare a Venezia: San Marco, Rialto, aeroporto e isole', description: 'Come arrivare ai luoghi di Venezia in vaporetto, autobus e a piedi dalla stazione, da Piazzale Roma e dall\'aeroporto, con percorsi calcolati dall\'orario ufficiale.' },
    en: { title: 'How to get around Venice: St Mark\'s, Rialto, airport, islands', description: 'How to reach places in Venice by waterbus, bus and on foot from the station, Piazzale Roma and the airport, with routes computed from the official timetable.' },
  },
  faq: {
    it: { title: 'Domande frequenti su acqua alta, vaporetti e open data', description: 'A quanti cm c\'è acqua alta, cosa significano le sirene, quando si alza il MOSE, quanto costa il vaporetto, come arrivare dall\'aeroporto e come riusare i dati.' },
    en: { title: 'Venice FAQ: high water, waterbuses and open data', description: 'At what level Venice floods, what the sirens mean, when MOSE is raised, how much the waterbus costs, how to get from the airport and how to reuse the data.' },
  },
  glossary: {
    it: { title: 'Glossario di Venezia: marea, laguna, trasporti, open data', description: 'Cosa sono lo zero mareografico, il MOSE, le passerelle, i sestieri, i pontili, il GTFS e le licenze open data: i termini della mappa spiegati in breve.' },
    en: { title: 'Venice glossary: tide, lagoon, transport, open data', description: 'What the tide datum, MOSE, raised walkways, sestieri, waterbus stops, GTFS and open-data licences are: the map\'s terms briefly explained.' },
  },
};

/** Titoli lunghi: suffisso breve «| VOD» al posto del nome completo del sito, per non farli troncare nei risultati */
function shortSuffix(meta: Metadata, title: string): Metadata {
  return { ...meta, title: { absolute: `${title} | VOD` } };
}

export function guideMetadata(id: GuidePageId, lang: GuideLang): Metadata {
  const m = META[id][lang];
  return shortSuffix(pageMetadata({ path: GUIDE_PATHS[id][lang], title: m.title, description: m.description, lang, languages: languageAlternates(GUIDE_PATHS[id]) }), m.title);
}

export function placeMetadata(place: GuidePlace, lang: GuideLang): Metadata {
  const name = place.name[lang];
  const title = lang === 'it' ? `Come arrivare ${place.toIt}: vaporetto, bus e a piedi` : `How to get to ${name}: waterbus, bus and walking`;
  const description =
    lang === 'it'
      ? `Come arrivare ${place.toIt} dalla stazione, da Piazzale Roma e dall'aeroporto: tempi, linee ACTV e Alilaguna e percorsi a piedi calcolati dall'orario ufficiale.`
      : `How to get to ${name} from the station, Piazzale Roma and the airport: journey times, ACTV and Alilaguna lines and walking routes computed from the official timetable.`;
  return shortSuffix(
    pageMetadata({
      path: placePath(lang, place.slug[lang]),
      title,
      description,
      lang,
      languages: languageAlternates({ it: placePath('it', place.slug.it), en: placePath('en', place.slug.en) }),
    }),
    title,
  );
}
