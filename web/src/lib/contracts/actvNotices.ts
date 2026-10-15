import { PROVIDERS } from '@/lib/provenance/providers';

/** Avvisi di servizio ACTV/AVM (feed RSS ufficiale) arricchiti con fermate e linee citate (/api/avvisi-actv). */
export const ACTV_RSS_URL = 'https://actv.avmspa.it/rss.xml';
export const ACTV_INFOMOBILITY_PAGE = PROVIDERS.actvNotices.url;

export interface ActvNoticeStop {
  /** codice della fermata GTFS */
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** come è stata trovata: codice "ID 1234" nel testo oppure nome della fermata */
  match: 'id' | 'name';
}

export interface ActvNotice {
  id: string;
  title: string;
  url: string;
  /** pubblicazione (ISO) */
  publishedAt: string;
  /** testo dell'avviso, senza markup (troncato) */
  text: string;
  /** linee ACTV citate e riconosciute */
  lines: string[];
  stops: ActvNoticeStop[];
  /** ultima data citata nel testo (YYYY-MM-DD), null se nessuna */
  lastDate: string | null;
  /** "fino al termine dei lavori" o simili: senza data di fine */
  openEnded: boolean;
}

export interface ActvNoticesResponse {
  success: boolean;
  data: ActvNotice[];
  meta: { source: string; sourceUrl: string; fetchedAt: string; note: string };
}
