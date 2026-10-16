import { licenseLabel } from './licenses';
import { PROVIDERS, type ProviderId } from './providers';

/**
 * Flussi di dati controllati da /api/health e descritti nella pagina /sources: un flusso è un feed o
 * un dataset preciso di un fornitore (es. la previsione di marea del CPSM). Ente, portale e licenza
 * vengono dal fornitore; qui solo ciò che è proprio del flusso. La nota opzionale è la chiave di
 * traduzione ui.sourcesPage.meta_<id>.
 */
type Refresh = 'r6h' | 'r20s' | 'r30s' | 'r60s' | 'r5min' | 'r10min' | 'r15min' | 'r30min' | 'r60min' | 'weekly' | 'census';

interface Feed {
  /** Nome del flusso in /api/health */
  label: string;
  /** Fornitori: il primo dà il link al portale */
  providers: readonly ProviderId[];
  /** Pagina del dataset, se più precisa di quella del fornitore */
  portalUrl?: string;
  format: string;
  /** Chiave di traduzione della frequenza con cui VOD rilegge il dato */
  refresh: Refresh;
  hasNote?: boolean;
}

export const FEEDS = {
  tide: { label: 'Marea CPSM (livello.json)', providers: ['cpsm'], portalUrl: 'https://dati.venezia.it', format: 'JSON', refresh: 'r60s', hasNote: true },
  'tide-forecast': { label: 'Previsione marea CPSM (previsione.json)', providers: ['cpsm'], portalUrl: 'https://dati.venezia.it', format: 'JSON', refresh: 'r10min', hasNote: true },
  metar: { label: 'METAR LIPZ (NOAA AWC)', providers: ['noaa'], format: 'METAR JSON', refresh: 'r5min' },
  'gtfs-rt-nav': { label: 'GTFS-RT ACTV navigazione', providers: ['actvRealtime'], format: 'GTFS-RT (protobuf)', refresh: 'r20s', hasNote: true },
  'gtfs-rt-aut': { label: 'GTFS-RT ACTV automobilistico', providers: ['actvRealtime'], format: 'GTFS-RT (protobuf)', refresh: 'r20s', hasNote: true },
  'cpsm-meteo': { label: 'Rete meteo-marina CPSM', providers: ['cpsm'], portalUrl: 'https://dati.venezia.it', format: 'JSON', refresh: 'r5min', hasNote: true },
  aisstream: { label: 'Navi AIS (aisstream.io)', providers: ['aisstream'], format: 'WebSocket JSON', refresh: 'r60s', hasNote: true },
  campo: { label: 'Spazi sportivi CAMPO', providers: ['campo'], format: 'GeoJSON', refresh: 'r60min', hasNote: true },
  'packet-broker': { label: 'Gateway LoRaWAN (Packet Broker)', providers: ['packetBroker'], format: 'REST JSON', refresh: 'r10min', hasNote: true },
  'actv-avvisi': { label: 'Avvisi di servizio ACTV (RSS)', providers: ['actvNotices'], format: 'RSS', refresh: 'r15min', hasNote: true },
  'comune-ordinanze': { label: 'Ordinanze del Comune di Venezia', providers: ['comuneOrdinanze'], format: 'REST JSON + HTML', refresh: 'r60min', hasNote: true },
  opensky: { label: 'OpenSky Network', providers: ['opensky'], format: 'REST JSON', refresh: 'r30s', hasNote: true },
  'open-meteo': { label: 'Previsione vento Open-Meteo', providers: ['openMeteo'], format: 'REST JSON', refresh: 'r30min', hasNote: true },
  'cams-air': { label: 'Previsione aria, pollini e UV Copernicus CAMS', providers: ['cams'], format: 'REST JSON', refresh: 'r30min', hasNote: true },
  'open-meteo-marine': { label: 'Previsione marina Open-Meteo', providers: ['openMeteoMarine'], format: 'REST JSON', refresh: 'r30min', hasNote: true },
  'gtfs-static': { label: 'Simulazione GTFS ACTV (pipeline)', providers: ['actvGtfs'], portalUrl: 'https://actv.avmspa.it', format: 'GTFS', refresh: 'weekly' },
  'opere-pubbliche': { label: 'Opere pubbliche (pipeline)', providers: ['comuneOpenData'], format: 'CSV', refresh: 'weekly', hasNote: true },
  wifi: { label: 'Hotspot WiFi (pipeline)', providers: ['comuneOpenData'], format: 'GeoJSON', refresh: 'weekly' },
  arpav: { label: 'Qualità aria ARPAV (pipeline)', providers: ['arpav'], portalUrl: 'https://www.arpa.veneto.it', format: 'CSV', refresh: 'weekly', hasNote: true },
  'osm-cameras': { label: 'Telecamere OpenStreetMap (pipeline)', providers: ['osm'], format: 'Overpass JSON', refresh: 'weekly' },
  'osm-dae': { label: 'Defibrillatori OpenStreetMap (pipeline)', providers: ['osm'], format: 'Overpass JSON', refresh: 'weekly', hasNote: true },
  'osm-pharmacies': { label: 'Farmacie OpenStreetMap (pipeline)', providers: ['osm'], format: 'Overpass JSON', refresh: 'weekly', hasNote: true },
  'osm-fountains': { label: 'Fontanelle OpenStreetMap (pipeline)', providers: ['osm'], format: 'Overpass JSON', refresh: 'weekly' },
  flixbus: { label: 'Corse FlixBus per Venezia (pipeline)', providers: ['flixbus'], format: 'GTFS', refresh: 'weekly', hasNote: true },
  'osm-toponyms': { label: 'Toponimi OpenStreetMap per le ordinanze (pipeline)', providers: ['osm'], format: 'Overpass JSON', refresh: 'weekly', hasNote: true },
  'venice-tap-water': { label: 'Fontanelle Venice Tap Water (pipeline)', providers: ['veniceTapWater'], format: 'KML', refresh: 'weekly', hasNote: true },
  'osm-poi': { label: 'POI OpenStreetMap: colonnine, parcheggi, pozzi, alberi (pipeline)', providers: ['osm'], format: 'Overpass JSON', refresh: 'weekly', hasNote: true },
  'osm-waterways': { label: 'Briccole e canali OpenStreetMap (pipeline)', providers: ['osm'], format: 'Overpass JSON', refresh: 'weekly', hasNote: true },
  'osm-walk': { label: 'Rete pedonale OpenStreetMap per il planner (pipeline)', providers: ['osm'], format: 'Overpass JSON', refresh: 'weekly', hasNote: true },
  'osm-boat': {
    label: 'Rete dei canali OpenStreetMap e regole del Testo Unico per il planner in barca (pipeline)',
    providers: ['testoUnico', 'osm'],
    format: 'Overpass JSON + PDF',
    refresh: 'weekly',
    hasNote: true,
  },
  'osm-curiosita': { label: 'Curiosità su calli e ponti da OpenStreetMap (pipeline)', providers: ['osm'], format: 'Overpass JSON', refresh: 'weekly', hasNote: true },
  'osm-civici': { label: 'Numeri civici OpenStreetMap (pipeline)', providers: ['osm'], format: 'Overpass JSON', refresh: 'weekly', hasNote: true },
  'osm-parks': { label: 'Parchi, giardini e aree giochi OpenStreetMap (pipeline)', providers: ['osm'], format: 'Overpass JSON', refresh: 'weekly', hasNote: true },
  'arpav-pollen': { label: 'Pollini misurati ARPAV Venezia (pipeline)', providers: ['arpav'], format: 'CSV', refresh: 'weekly', hasNote: true },
  'cciaa-turismo': { label: 'Turismo e popolazione dei comuni della laguna (pipeline)', providers: ['cciaa'], format: 'CSV', refresh: 'weekly', hasNote: true },
  'arpav-lagoon': {
    label: 'Sonde ARPAV della laguna e balneazione (pipeline)',
    providers: ['arpav'],
    portalUrl: 'https://www.arpa.veneto.it/dati-ambientali/open-data/file-e-allegati/soaml/laguna-di-venezia/dati-sonda',
    format: 'CSV',
    refresh: 'weekly',
    hasNote: true,
  },
  'istat-census': { label: 'Censimento ISTAT 2021 per sestiere e isola (pipeline)', providers: ['istat'], format: 'XLSX + Shapefile', refresh: 'census', hasNote: true },
  'cruscotto-italia': { label: 'Profilo dei comuni da Cruscotto Italia (pipeline)', providers: ['cruscotto'], format: 'MCP (comune_kpi)', refresh: 'weekly', hasNote: true },
  'bdap-mop': { label: 'Opere pubbliche del Comune dal monitoraggio BDAP (pipeline)', providers: ['bdap'], format: 'CSV (CKAN)', refresh: 'weekly', hasNote: true },
  'agcom-fiber': { label: 'Copertura rete fissa AGCOM (pipeline)', providers: ['agcom'], format: 'ArcGIS REST (griglia 20 m)', refresh: 'weekly', hasNote: true },
  'mimit-carburanti': { label: 'Prezzi dei carburanti MIMIT (prezzi alle 8)', providers: ['mimitFuel'], format: 'CSV', refresh: 'r6h', hasNote: true },
  'alilaguna-gtfs': { label: 'Orario Alilaguna GTFS (pipeline)', providers: ['alilaguna'], format: 'GTFS', refresh: 'weekly', hasNote: true },
} as const satisfies Record<string, Feed>;

export type FeedId = keyof typeof FEEDS;

export interface FeedSummary {
  institution: string;
  portalUrl: string;
  license: string;
  /** nessun fornitore del flusso dichiara una licenza */
  licenseUndeclared: boolean;
  format: string;
  refresh: Refresh;
  hasNote: boolean;
}

/** Ente, portale e licenza del flusso, ricavati dai fornitori */
export function feedSummary(id: FeedId): FeedSummary {
  const f: Feed = FEEDS[id];
  const providers = f.providers.map((p) => PROVIDERS[p]);
  return {
    institution: providers.map((p) => p.name).join(' · '),
    portalUrl: f.portalUrl ?? providers[0].url,
    license: providers.map((p) => licenseLabel(p.license)).join(' · '),
    licenseUndeclared: providers.every((p) => p.license === 'undeclared'),
    format: f.format,
    refresh: f.refresh,
    hasNote: f.hasNote ?? false,
  };
}
