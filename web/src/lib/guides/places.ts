/**
 * Luoghi delle pagine «Come arrivare» (/come-arrivare/<slug>, /en/getting-to/<slug>). I percorsi non sono scritti a
 * mano: li calcola il planner di VOD sull'orario ACTV/Alilaguna e sulla rete pedonale OpenStreetMap; le linee sono
 * quelle che il GTFS ACTV fa fermare ai pontili elencati in `stopIds` (src/data/actv-stops.json).
 */
export type GuideLang = 'it' | 'en';

export interface GuidePlace {
  id: string;
  slug: Record<GuideLang, string>;
  name: Record<GuideLang, string>;
  /** «a Piazza San Marco», «al Ponte di Rialto»: preposizione articolata per i titoli italiani */
  toIt: string;
  /** Testo per il planner (fermata, «aeroporto») o coordinate «lat,lon» del luogo */
  target: string;
  /** Pontili e fermate vicini (id di actv-stops.json) di cui elencare le linee */
  stopIds: string[];
  intro: Record<GuideLang, string>;
}

export const GUIDE_PLACES: GuidePlace[] = [
  {
    id: 'sanMarco',
    slug: { it: 'piazza-san-marco', en: 'st-marks-square' },
    name: { it: 'Piazza San Marco', en: "St Mark's Square" },
    toIt: 'a Piazza San Marco',
    target: '45.43420,12.33850',
    stopIds: ['navigazione:5053', 'navigazione:5056', 'navigazione:5009'],
    intro: {
      it: "Piazza San Marco è la piazza principale di Venezia, con la Basilica di San Marco, il Campanile e Palazzo Ducale. È tra le zone più basse della città: con l'acqua alta è una delle prime ad allagarsi.",
      en: "St Mark's Square is Venice's main square, with St Mark's Basilica, the Campanile and the Doge's Palace. It is one of the lowest parts of the city and among the first to flood at high water.",
    },
  },
  {
    id: 'rialto',
    slug: { it: 'ponte-di-rialto', en: 'rialto-bridge' },
    name: { it: 'Ponte di Rialto', en: 'Rialto Bridge' },
    toIt: 'al Ponte di Rialto',
    target: '45.43800,12.33590',
    stopIds: ['navigazione:5038', 'navigazione:5138'],
    intro: {
      it: 'Il Ponte di Rialto è il più antico dei quattro ponti sul Canal Grande, tra i sestieri di San Marco e San Polo, accanto al Mercato di Rialto.',
      en: 'The Rialto Bridge is the oldest of the four bridges over the Grand Canal, between the San Marco and San Polo districts, next to the Rialto Market.',
    },
  },
  {
    id: 'ferrovia',
    slug: { it: 'stazione-santa-lucia', en: 'santa-lucia-station' },
    name: { it: 'Stazione di Venezia Santa Lucia', en: 'Venezia Santa Lucia station' },
    toIt: 'alla Stazione di Venezia Santa Lucia',
    target: 'Ferrovia',
    stopIds: ['navigazione:5032'],
    intro: {
      it: 'La stazione di Venezia Santa Lucia è il capolinea ferroviario del centro storico, nel sestiere di Cannaregio, sul Canal Grande. Il pontile dei vaporetti davanti alla stazione si chiama «Ferrovia».',
      en: 'Venezia Santa Lucia is the railway terminus in the historic centre, in the Cannaregio district, on the Grand Canal. The waterbus stop in front of the station is called “Ferrovia”.',
    },
  },
  {
    id: 'piazzaleRoma',
    slug: { it: 'piazzale-roma', en: 'piazzale-roma' },
    name: { it: 'Piazzale Roma', en: 'Piazzale Roma' },
    toIt: 'a Piazzale Roma',
    target: 'P.le Roma',
    stopIds: ['navigazione:5027', 'peoplemover:6085'],
    intro: {
      it: 'Piazzale Roma è il terminal di autobus e auto del centro storico, collegato alla terraferma dal Ponte della Libertà. Da qui partono i vaporetti, il People Mover per il Tronchetto e gli autobus per Mestre e l\'aeroporto.',
      en: 'Piazzale Roma is the bus and car terminal of the historic centre, linked to the mainland by the Ponte della Libertà. Waterbuses, the People Mover to Tronchetto and buses to Mestre and the airport leave from here.',
    },
  },
  {
    id: 'aeroporto',
    slug: { it: 'aeroporto-marco-polo', en: 'marco-polo-airport' },
    name: { it: 'Aeroporto Marco Polo', en: 'Marco Polo Airport' },
    toIt: 'all\'Aeroporto Marco Polo',
    target: 'aeroporto',
    stopIds: [],
    intro: {
      it: "L'aeroporto Marco Polo (VCE) è a Tessera, in terraferma. Il centro storico si raggiunge via acqua con Alilaguna, in autobus fino a Piazzale Roma o in taxi acqueo.",
      en: 'Marco Polo Airport (VCE) is at Tessera, on the mainland. The historic centre can be reached by water with Alilaguna, by bus to Piazzale Roma or by water taxi.',
    },
  },
  {
    id: 'tronchetto',
    slug: { it: 'tronchetto', en: 'tronchetto' },
    name: { it: 'Tronchetto', en: 'Tronchetto' },
    toIt: 'al Tronchetto',
    target: 'Tronchetto',
    stopIds: ['navigazione:5024', 'navigazione:5075', 'peoplemover:6088', 'ferry:5026'],
    intro: {
      it: "Il Tronchetto è l'isola artificiale dei parcheggi all'ingresso di Venezia, collegata a Piazzale Roma dal People Mover e al Lido dal ferry boat della linea 17.",
      en: 'Tronchetto is the artificial car-park island at the entrance to Venice, linked to Piazzale Roma by the People Mover and to the Lido by the line 17 car ferry.',
    },
  },
  {
    id: 'lido',
    slug: { it: 'lido', en: 'lido' },
    name: { it: 'Lido di Venezia', en: 'Venice Lido' },
    toIt: 'al Lido di Venezia',
    target: 'Lido S.M.E.',
    stopIds: ['navigazione:5001'],
    intro: {
      it: "Il Lido è l'isola lunga e sottile che separa la laguna dal mare Adriatico, sede della Mostra del Cinema. Il pontile principale è Lido S.M.E. (Santa Maria Elisabetta).",
      en: 'The Lido is the long, narrow island between the lagoon and the Adriatic Sea, home of the Venice Film Festival. Its main stop is Lido S.M.E. (Santa Maria Elisabetta).',
    },
  },
  {
    id: 'murano',
    slug: { it: 'murano', en: 'murano' },
    name: { it: 'Murano', en: 'Murano' },
    toIt: 'a Murano',
    target: 'Murano Colonna',
    stopIds: ['navigazione:5063', 'navigazione:5095', 'navigazione:5064', 'navigazione:5065'],
    intro: {
      it: "Murano è l'isola del vetro, a nord del centro storico, oltre il cimitero di San Michele.",
      en: 'Murano is the glass-making island north of the historic centre, beyond San Michele cemetery island.',
    },
  },
  {
    id: 'burano',
    slug: { it: 'burano', en: 'burano' },
    name: { it: 'Burano', en: 'Burano' },
    toIt: 'a Burano',
    target: 'Burano',
    stopIds: ['navigazione:5068'],
    intro: {
      it: "Burano è l'isola delle case colorate e del merletto, nella laguna nord, unita a Mazzorbo da un ponte.",
      en: 'Burano is the island of colourful houses and lace in the northern lagoon, joined to Mazzorbo by a bridge.',
    },
  },
  {
    id: 'torcello',
    slug: { it: 'torcello', en: 'torcello' },
    name: { it: 'Torcello', en: 'Torcello' },
    toIt: 'a Torcello',
    target: 'Torcello',
    stopIds: ['navigazione:5097'],
    intro: {
      it: "Torcello è l'isola della laguna nord con la cattedrale di Santa Maria Assunta, a pochi minuti di vaporetto da Burano.",
      en: 'Torcello is the northern lagoon island with the cathedral of Santa Maria Assunta, a few minutes by waterbus from Burano.',
    },
  },
  {
    id: 'accademia',
    slug: { it: 'gallerie-accademia', en: 'accademia-gallery' },
    name: { it: "Gallerie dell'Accademia", en: 'Accademia Gallery' },
    toIt: 'alle Gallerie dell\'Accademia',
    target: 'Accademia',
    stopIds: ['navigazione:5047'],
    intro: {
      it: "Le Gallerie dell'Accademia, nel sestiere di Dorsoduro accanto al Ponte dell'Accademia, custodiscono la principale raccolta di pittura veneziana.",
      en: 'The Gallerie dell\'Accademia, in the Dorsoduro district next to the Accademia Bridge, hold the main collection of Venetian painting.',
    },
  },
  {
    id: 'biennale',
    slug: { it: 'giardini-biennale', en: 'biennale-giardini' },
    name: { it: 'Giardini della Biennale', en: 'Biennale Gardens (Giardini)' },
    toIt: 'ai Giardini della Biennale',
    target: 'Giardini Biennale',
    stopIds: ['navigazione:5006', 'navigazione:5007'],
    intro: {
      it: 'I Giardini della Biennale, nel sestiere di Castello, ospitano i padiglioni nazionali della Biennale d\'Arte e di Architettura.',
      en: 'The Giardini, in the Castello district, host the national pavilions of the Venice Art and Architecture Biennale.',
    },
  },
];

/** Partenze proposte per ogni luogo (le prime tre diverse dal luogo stesso) */
export const GUIDE_ORIGIN_IDS = ['ferrovia', 'piazzaleRoma', 'aeroporto', 'sanMarco'] as const;

export function placeBySlug(lang: GuideLang, slug: string): GuidePlace | undefined {
  return GUIDE_PLACES.find((p) => p.slug[lang] === slug);
}

export function placeById(id: string): GuidePlace | undefined {
  return GUIDE_PLACES.find((p) => p.id === id);
}

export function originsFor(place: GuidePlace): GuidePlace[] {
  return GUIDE_ORIGIN_IDS.filter((id) => id !== place.id)
    .slice(0, 3)
    .map((id) => placeById(id)!)
    .filter(Boolean);
}
