/**
 * Testi di FAQ e glossario. Le cifre non sono riscritte qui: soglie, percentuali di allagamento e tariffe vengono
 * dalle stesse funzioni usate dalla mappa (flood.ts, fares.ts), così pagina e mappa non possono divergere.
 */
import { ACTV_FARES, ALILAGUNA_FARES, ATVO_FARES, FARES_CHECKED_AT } from '@/lib/fares';
import { getFloodedGroundPercentage } from '@/lib/flood';
import type { GuideLang } from './places';
import { GUIDE_PATHS } from './paths';

export interface FaqItem {
  q: string;
  a: string;
  /** Pagina di approfondimento */
  link?: { href: string; label: string };
}

const eur = (v: number, lang: GuideLang) =>
  new Intl.NumberFormat(lang === 'it' ? 'it-IT' : 'en-GB', { style: 'currency', currency: 'EUR' }).format(v);

const pct = (cm: number, lang: GuideLang) =>
  `${getFloodedGroundPercentage(cm).toLocaleString(lang === 'it' ? 'it-IT' : 'en-GB')}%`;

export const MOSE_REFERENCE_CM = 110;

export function faqItems(lang: GuideLang): FaqItem[] {
  const checked = new Date(`${FARES_CHECKED_AT}T12:00:00Z`).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  if (lang === 'en') {
    return [
      {
        q: 'What is VOD – Venice Open Data?',
        a: 'A free interactive map of Venice and its lagoon built only from open data: live waterbuses, tide, trip planning and dozens of data layers. It is an independent, unofficial project: every value states its source, licence and whether it is measured, forecast, simulated from the timetable or still to be checked.',
        link: { href: '/layers', label: 'Data catalogue' },
      },
      {
        q: 'Where can I see the tide in Venice right now?',
        a: 'The tide page shows the level measured at Punta della Salute, the City of Venice reference station, with the official forecast of high and low tides. VOD re-reads the City Tide Centre data every minute.',
        link: { href: GUIDE_PATHS.tide.en, label: 'Venice tide today' },
      },
      {
        q: 'At what level is there high water (acqua alta)?',
        a: `The City Tide Centre calls the tide “sustained” from +80 cm, “very sustained” from +110 cm and “exceptional” from +140 cm above the Punta della Salute tide datum. Indicatively, about ${pct(110, 'en')} of the pedestrian ground in the historic centre is under water at +110 cm, ${pct(120, 'en')} at +120 cm and ${pct(140, 'en')} at +140 cm.`,
        link: { href: GUIDE_PATHS.tide.en, label: 'Thresholds and flooded area' },
      },
      {
        q: 'What do the high-water sirens mean?',
        a: 'When a tide of +110 cm or more is forecast, sirens sound across the city: one tone for +110 cm, then one more tone for every 10 cm, up to four tones for +140 cm and above.',
      },
      {
        q: 'When is MOSE raised?',
        a: `The mobile barriers at the three lagoon inlets are normally raised for forecasts from about +${MOSE_REFERENCE_CM} cm; each decision is taken by the operations room of the Provveditorato, so VOD shows the threshold as an indication, not as a promise.`,
      },
      {
        q: 'Are the waterbuses on the map really live?',
        a: 'When ACTV publishes it, VOD shows the GPS position of each waterbus (GTFS-Realtime feed) with its delay against the timetable, checked against the value ACTV declares. When the feed is missing, boats are positioned from the official timetable and clearly labelled as simulated.',
        link: { href: GUIDE_PATHS.vaporetti.en, label: 'Live ACTV waterbuses' },
      },
      {
        q: 'How much is a waterbus ticket?',
        a: `The ordinary 75-minute ACTV ticket costs ${eur(ACTV_FARES.reteUnica, 'en')} and is valid on waterbuses, buses, trams and the People Mover, but not to or from the airport (the airport ticket costs ${eur(ACTV_FARES.aerobus, 'en')}). Prices published by AVM/ACTV, checked by VOD on ${checked}.`,
      },
      {
        q: 'How do I get from Marco Polo Airport to Venice?',
        a: `By water with Alilaguna (${eur(ALILAGUNA_FARES.ordinary.airportVenice, 'en')} single ticket to Venice), by ACTV bus 5 or ATVO 35 Express (${eur(ATVO_FARES.line35, 'en')}) to Piazzale Roma, or by water taxi. The airport page shows the next options computed from the timetables.`,
        link: { href: `${GUIDE_PATHS.gettingTo.en}/marco-polo-airport`, label: 'Airport to Venice' },
      },
      {
        q: 'Can I reuse the data?',
        a: 'Yes, within each source\'s licence (often CC BY or ODbL), shown on every layer. VOD also offers a REST API, downloads and a read-only MCP server for AI assistants.',
        link: { href: '/mcp', label: 'API and MCP' },
      },
      {
        q: 'Does VOD use cookies or track me?',
        a: 'No cookies and no account. Only anonymous, aggregated usage statistics are collected to understand which features are used.',
        link: { href: '/privacy', label: 'Privacy' },
      },
      {
        q: 'Do I need to install an app?',
        a: 'No: VOD works in the phone browser. It can be added to the home screen like an app.',
      },
    ];
  }
  return [
    {
      q: "Cos'è VOD – Venice Open Data?",
      a: 'Una mappa interattiva gratuita di Venezia e della laguna fatta solo di dati aperti: vaporetti in tempo reale, marea, come arrivare e decine di livelli di dati. È un progetto indipendente e non ufficiale: ogni valore dichiara fonte, licenza e se è misurato, previsto, simulato dall\'orario o da verificare.',
      link: { href: '/layers', label: 'Catalogo dei dati' },
    },
    {
      q: 'Dove vedo la marea a Venezia adesso?',
      a: "Nella pagina della marea c'è il livello misurato a Punta della Salute, la stazione di riferimento del Comune di Venezia, con la previsione ufficiale di massimi e minimi. VOD rilegge i dati del Centro Maree del Comune ogni minuto.",
      link: { href: GUIDE_PATHS.tide.it, label: 'Marea a Venezia oggi' },
    },
    {
      q: "A quanti centimetri c'è acqua alta?",
      a: `Il Centro Maree del Comune definisce la marea «sostenuta» da +80 cm, «molto sostenuta» da +110 cm ed «eccezionale» da +140 cm sullo zero mareografico di Punta della Salute. Indicativamente è sott'acqua circa il ${pct(110, 'it')} del suolo pedonale del centro storico a +110 cm, il ${pct(120, 'it')} a +120 cm e il ${pct(140, 'it')} a +140 cm.`,
      link: { href: GUIDE_PATHS.tide.it, label: 'Soglie e area allagata' },
    },
    {
      q: 'Cosa significano le sirene dell\'acqua alta?',
      a: 'Quando è prevista una marea da +110 cm in su, in città suonano le sirene: un tono per +110 cm, poi un tono in più ogni 10 cm, fino a quattro toni da +140 cm.',
    },
    {
      q: 'Quando si alza il MOSE?',
      a: `Le paratoie mobili alle tre bocche di porto si alzano di norma per previsioni da circa +${MOSE_REFERENCE_CM} cm; ogni decisione spetta alla sala operativa del Provveditorato, perciò VOD mostra la soglia come indicazione e non come certezza.`,
    },
    {
      q: 'I vaporetti sulla mappa sono davvero in tempo reale?',
      a: "Quando ACTV lo pubblica, VOD mostra la posizione GPS di ogni vaporetto (feed GTFS-Realtime) con il ritardo rispetto all'orario, verificato con quello dichiarato da ACTV. Se il feed manca, i mezzi sono posizionati dall'orario ufficiale e segnati chiaramente come simulati.",
      link: { href: GUIDE_PATHS.vaporetti.it, label: 'Vaporetti ACTV in tempo reale' },
    },
    {
      q: 'Quanto costa il biglietto del vaporetto?',
      a: `Il biglietto ordinario ACTV da 75 minuti costa ${eur(ACTV_FARES.reteUnica, 'it')} e vale su vaporetti, bus, tram e People Mover, ma non da e per l'aeroporto (il biglietto aerobus costa ${eur(ACTV_FARES.aerobus, 'it')}). Prezzi pubblicati da AVM/ACTV, verificati da VOD il ${checked}.`,
    },
    {
      q: "Come arrivo dall'aeroporto Marco Polo a Venezia?",
      a: `Via acqua con Alilaguna (${eur(ALILAGUNA_FARES.ordinary.airportVenice, 'it')} la corsa semplice per Venezia), con il bus ACTV 5 o l'ATVO 35 Express (${eur(ATVO_FARES.line35, 'it')}) fino a Piazzale Roma, oppure in taxi acqueo. La pagina dell'aeroporto mostra le prossime soluzioni calcolate dagli orari.`,
      link: { href: `${GUIDE_PATHS.gettingTo.it}/aeroporto-marco-polo`, label: 'Dall\'aeroporto a Venezia' },
    },
    {
      q: 'Posso riutilizzare i dati?',
      a: 'Sì, nei limiti della licenza di ogni fonte (spesso CC BY o ODbL), indicata su ogni livello. VOD offre anche API REST, file da scaricare e un server MCP in sola lettura per gli assistenti AI.',
      link: { href: '/mcp', label: 'API e MCP' },
    },
    {
      q: 'VOD usa cookie o mi traccia?',
      a: 'Nessun cookie e nessun account. Si raccolgono solo statistiche d\'uso anonime e aggregate per capire quali funzioni vengono usate.',
      link: { href: '/privacy', label: 'Privacy' },
    },
    {
      q: "Devo installare un'app?",
      a: 'No: VOD funziona dal browser del telefono. Si può aggiungere alla schermata Home come un\'app.',
    },
  ];
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
}

const GLOSSARY: Record<GuideLang, GlossaryTerm[]> = {
  it: [
    { id: 'acqua-alta', term: 'Acqua alta', definition: 'Marea che supera i livelli ordinari e allaga parte della città. A Venezia si parla di acqua alta indicativamente da +80 cm sullo zero mareografico di Punta della Salute.' },
    { id: 'zmps', term: 'Zero mareografico di Punta della Salute (ZMPS)', definition: 'Quota di riferimento delle maree di Venezia: il livello medio del mare misurato a Punta della Salute nel 1897. «+110 cm» significa 110 cm sopra questo zero, non 110 cm d\'acqua in strada.' },
    { id: 'marea-sostenuta', term: 'Marea sostenuta, molto sostenuta, eccezionale', definition: 'Categorie del Centro Maree del Comune di Venezia: sostenuta da +80 cm, molto sostenuta da +110 cm, eccezionale da +140 cm.' },
    { id: 'cpsm', term: 'Centro Maree (CPSM)', definition: 'Centro Previsioni e Segnalazioni Maree del Comune di Venezia: misura la marea, emette le previsioni e attiva le sirene. I suoi dati sono pubblicati come open data su dati.venezia.it.' },
    { id: 'sirene', term: 'Sirene', definition: 'Segnale acustico diffuso in città quando è prevista una marea da +110 cm: un tono per +110 cm e uno in più ogni 10 cm, fino a quattro toni da +140 cm.' },
    { id: 'mose', term: 'MOSE', definition: 'Sistema di paratoie mobili alle tre bocche di porto (Lido, Malamocco, Chioggia) che, sollevate, separano temporaneamente la laguna dal mare durante le maree più alte.' },
    { id: 'bocche-di-porto', term: 'Bocche di porto', definition: 'I tre varchi tra i lidi che collegano la laguna al mare Adriatico: Lido, Malamocco e Chioggia.' },
    { id: 'passerelle', term: 'Passerelle', definition: 'Percorsi pedonali sopraelevati montati dal Comune sulle vie principali durante l\'acqua alta. Il piano prevede a quale livello di marea viene allestito ogni percorso.' },
    { id: 'sestiere', term: 'Sestiere', definition: 'Ciascuna delle sei zone storiche in cui è diviso il centro: Cannaregio, Castello, Dorsoduro, San Marco, San Polo e Santa Croce. La Giudecca fa parte di Dorsoduro.' },
    { id: 'numero-civico', term: 'Numero civico veneziano', definition: 'Nel centro storico la numerazione è unica per sestiere e non per via: un indirizzo come «Cannaregio 3450» indica sestiere e numero, senza il nome della calle.' },
    { id: 'calle', term: 'Calle, fondamenta, campo, rio', definition: 'Calle è la via pedonale; fondamenta la via lungo un canale; campo la piazza (l\'unica «piazza» è San Marco); rio il canale minore.' },
    { id: 'vaporetto', term: 'Vaporetto e motoscafo', definition: 'Le barche di linea ACTV per il trasporto pubblico nella città e nella laguna. Nel GTFS di ACTV sono distinte per tipo di mezzo.' },
    { id: 'traghetto', term: 'Traghetto (gondola)', definition: 'Gondola che attraversa il Canal Grande da una riva all\'altra in alcuni punti fissi, utile dove non ci sono ponti.' },
    { id: 'pontile', term: 'Pontile (imbarcadero)', definition: 'La fermata galleggiante dei vaporetti. Un pontile può avere più approdi indicati da lettere (A, B, C…).' },
    { id: 'alilaguna', term: 'Alilaguna', definition: 'Compagnia privata di trasporto via acqua che collega l\'aeroporto Marco Polo con Venezia, Murano e il Lido.' },
    { id: 'people-mover', term: 'People Mover', definition: 'Navetta automatica su fune che collega Tronchetto, Marittima (terminal crociere) e Piazzale Roma.' },
    { id: 'gtfs', term: 'GTFS e GTFS-Realtime', definition: 'Formati aperti per orari (GTFS) e posizioni e ritardi in tempo reale (GTFS-Realtime) del trasporto pubblico. ACTV li pubblica come open data e VOD li usa per vaporetti e bus.' },
    { id: 'open-data', term: 'Open data', definition: 'Dati pubblicati con una licenza che ne permette il riutilizzo da parte di chiunque, anche per fini commerciali, alle condizioni della licenza.' },
    { id: 'licenze', term: 'CC BY e ODbL', definition: 'Licenze aperte comuni. CC BY chiede di citare la fonte; ODbL (usata da OpenStreetMap) chiede anche di condividere con la stessa licenza le banche dati derivate.' },
  ],
  en: [
    { id: 'acqua-alta', term: 'Acqua alta (high water)', definition: 'A tide above ordinary levels that floods part of the city. In Venice it starts indicatively at +80 cm above the Punta della Salute tide datum.' },
    { id: 'zmps', term: 'Punta della Salute tide datum (ZMPS)', definition: 'Reference level for Venice tides: mean sea level measured at Punta della Salute in 1897. “+110 cm” means 110 cm above this datum, not 110 cm of water in the street.' },
    { id: 'marea-sostenuta', term: 'Sustained, very sustained, exceptional tide', definition: 'Categories used by the City of Venice Tide Centre: sustained from +80 cm, very sustained from +110 cm, exceptional from +140 cm.' },
    { id: 'cpsm', term: 'Tide Centre (CPSM)', definition: 'The City of Venice Tide Forecasting and Warning Centre: it measures the tide, issues forecasts and sounds the sirens. Its data is published as open data on dati.venezia.it.' },
    { id: 'sirene', term: 'Sirens', definition: 'Audible warning across the city when a tide of +110 cm is forecast: one tone for +110 cm and one more every 10 cm, up to four tones from +140 cm.' },
    { id: 'mose', term: 'MOSE', definition: 'System of mobile gates at the three lagoon inlets (Lido, Malamocco, Chioggia) that, when raised, temporarily separate the lagoon from the sea during the highest tides.' },
    { id: 'bocche-di-porto', term: 'Lagoon inlets (bocche di porto)', definition: 'The three openings between the barrier islands that connect the lagoon to the Adriatic Sea: Lido, Malamocco and Chioggia.' },
    { id: 'passerelle', term: 'Passerelle (raised walkways)', definition: 'Elevated pedestrian walkways set up by the City on the main routes during high water. The plan states at which tide level each route is installed.' },
    { id: 'sestiere', term: 'Sestiere', definition: 'Each of the six historic districts of the centre: Cannaregio, Castello, Dorsoduro, San Marco, San Polo and Santa Croce. Giudecca belongs to Dorsoduro.' },
    { id: 'numero-civico', term: 'Venetian house numbers', definition: 'In the historic centre numbers run across the whole district, not by street: an address like “Cannaregio 3450” gives the district and number, without the street name.' },
    { id: 'calle', term: 'Calle, fondamenta, campo, rio', definition: 'A calle is a pedestrian street; a fondamenta a street along a canal; a campo a square (the only “piazza” is San Marco); a rio a minor canal.' },
    { id: 'vaporetto', term: 'Vaporetto and motoscafo', definition: 'ACTV\'s public transport boats in the city and the lagoon. ACTV\'s GTFS tells the vehicle types apart.' },
    { id: 'traghetto', term: 'Traghetto (gondola ferry)', definition: 'A gondola that crosses the Grand Canal from one bank to the other at a few fixed points, handy where there are no bridges.' },
    { id: 'pontile', term: 'Pontile (waterbus stop)', definition: 'The floating waterbus stop. A stop can have several berths marked with letters (A, B, C…).' },
    { id: 'alilaguna', term: 'Alilaguna', definition: 'Private water transport company linking Marco Polo Airport with Venice, Murano and the Lido.' },
    { id: 'people-mover', term: 'People Mover', definition: 'Automated cable shuttle linking Tronchetto, Marittima (cruise terminal) and Piazzale Roma.' },
    { id: 'gtfs', term: 'GTFS and GTFS-Realtime', definition: 'Open formats for public transport timetables (GTFS) and live positions and delays (GTFS-Realtime). ACTV publishes them as open data and VOD uses them for waterbuses and buses.' },
    { id: 'open-data', term: 'Open data', definition: 'Data published under a licence that lets anyone reuse it, commercially too, on the licence\'s terms.' },
    { id: 'licenze', term: 'CC BY and ODbL', definition: 'Common open licences. CC BY asks you to credit the source; ODbL (used by OpenStreetMap) also asks you to share derived databases under the same licence.' },
  ],
};

export function glossaryTerms(lang: GuideLang): GlossaryTerm[] {
  return GLOSSARY[lang];
}
