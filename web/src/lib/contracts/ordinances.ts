/** Ordinanze del Comune di Venezia (traffico acqueo, lavori pubblici, viabilità) per città storica, isole e Lido (/api/ordinanze). */
/** Elenco ufficiale delle ordinanze del Comune */
export const ORDINANCES_PAGE = 'https://www.comune.venezia.it/it/ordinanze';

export type OrdinanceKind = 'closure' | 'works' | 'event' | 'other';

/** active: in vigore oggi; upcoming: entra in vigore nei prossimi giorni; unverified: validità non letta (vedi l'atto) */
export type OrdinanceStatus = 'active' | 'upcoming' | 'unverified';

export interface OrdinanceItem {
  /** idPratica del Comune */
  id: string;
  number: string;
  /** data dell'atto, YYYY-MM-DD */
  date: string;
  title: string;
  ambito: string;
  luogo: string;
  /** validità dall'atto (YYYY-MM-DD), null se non letta */
  validFrom: string | null;
  validTo: string | null;
  status: OrdinanceStatus;
  kind: OrdinanceKind;
  /** canale o rio citato nel titolo, se riconosciuto */
  canalName: string | null;
  /** luogo (calle, fondamenta, ponte, campo…) citato nel titolo e trovato su OpenStreetMap */
  placeName: string | null;
  /** posizione: dalla mappa del Comune, altrimenti dal luogo o dal canale citati nel titolo; null se non nota */
  lat: number | null;
  lon: number | null;
  positionSource: 'comune' | 'place' | 'canal' | null;
  /** pagina ufficiale dell'atto */
  url: string;
  /** PDF firmato, se trovato */
  pdfUrl: string | null;
}

export interface OrdinancesResponse {
  success: boolean;
  data: OrdinanceItem[];
  meta: {
    source: string;
    sourceUrl: string;
    fetchedAt: string;
    note: string;
  };
}
