import { licenseLabel, licenseUrl, type LicenseId } from './licenses';
import { SITE_URL } from '../site';

/**
 * Enti e fornitori da cui VOD prende i dati: nome, sito, licenza e attribuzione scritti una volta sola.
 * Le route API, la pagina /sources, i cataloghi (livelli e MCP), lo stato delle fonti e i servizi di
 * calcolo citano un fornitore con la sua chiave (`ProviderId`). Gli indirizzi tecnici delle API
 * interrogate restano nei moduli di `server/sources/`.
 */
interface Provider {
  /** Nome completo da citare */
  name: string;
  /** Nome breve, per elenchi di più fonti */
  short: string;
  /** Pagina del fornitore o del portale */
  url: string;
  /** Portale come si mostra all'utente */
  portalName: string;
  license: LicenseId;
  /** Scheda del dataset, se diversa dal portale */
  datasetUrl?: string;
  /** Formula breve da scrivere accanto alla licenza («© OpenStreetMap contributors») */
  credit?: string;
  /** Frase di attribuzione completa richiesta dal titolare */
  attribution?: string;
}

const COMUNE = 'Comune di Venezia';
const DATI_VENEZIA = 'https://dati.venezia.it';
const WATER_TRAFFIC_RULES = 'https://www.comune.venezia.it/it/content/normativa-circolazione-acquea';
const ACTV_CATALOG = 'https://actv.avmspa.it/it/content/catalogo-dei-dati-metadati-e-banche-dati-actv';

export const PROVIDERS = {
  cpsm: {
    name: `${COMUNE} – Centro Previsioni e Segnalazioni Maree (CPSM)`,
    short: 'CPSM',
    url: 'https://www.comune.venezia.it/it/content/centro-previsioni-e-segnalazioni-maree',
    portalName: 'dati.venezia.it',
    license: 'cc-by-sa-3.0-it',
    datasetUrl: `${DATI_VENEZIA}/?q=content/cpsm-dati-meteomarini-laguna-e-litorale-veneziano`,
    // La scheda del dataset indica CC BY, la pagina Open Data del Comune CC BY-SA 3.0: si applica la più restrittiva
    credit: 'dati redistribuiti da VOD; la scheda del dataset indica CC BY',
    attribution: `Dati: ${COMUNE} – Centro Previsioni e Segnalazioni Maree (dati.venezia.it), elaborati da VOD`,
  },
  comuneOpenData: { name: `${COMUNE} (dati.venezia.it)`, short: COMUNE, url: DATI_VENEZIA, portalName: 'dati.venezia.it', license: 'cc-by' },
  comune: { name: COMUNE, short: COMUNE, url: 'https://www.comune.venezia.it', portalName: 'comune.venezia.it', license: 'public-acts' },
  comuneOrdinanze: { name: `${COMUNE} – Ordinanze`, short: COMUNE, url: 'https://www.comune.venezia.it/it/ordinanze', portalName: 'comune.venezia.it/it/ordinanze', license: 'public-acts' },
  testoUnico: {
    name: `${COMUNE} – Testo Unico della circolazione acquea (Ord. 274/2015)`,
    short: 'Testo Unico circolazione acquea',
    url: WATER_TRAFFIC_RULES,
    portalName: 'comune.venezia.it',
    license: 'public-acts',
  },
  speedLimits: {
    name: 'Regolamento circolazione acquea del Comune e ordinanza 93/2007',
    short: 'Limiti di velocità',
    url: WATER_TRAFFIC_RULES,
    portalName: 'comune.venezia.it',
    license: 'public-acts',
  },
  passerelle: {
    name: `${COMUNE} – piano delle passerelle per l'acqua alta`,
    short: 'Passerelle',
    url: 'https://www.comune.venezia.it/it/content/percorsi-su-passerelle',
    portalName: 'comune.venezia.it',
    license: 'public-acts',
    credit: 'tracciati indicativi di VOD',
  },
  actvGtfs: { name: 'ACTV / AVM – orario ufficiale GTFS', short: 'ACTV', url: ACTV_CATALOG, portalName: 'actv.avmspa.it', license: 'cc-by' },
  actvRealtime: { name: 'ACTV / AVM – GTFS-Realtime', short: 'ACTV', url: ACTV_CATALOG, portalName: 'tpl.actv.it', license: 'actv-realtime' },
  actvNotices: {
    name: 'ACTV / AVM – avvisi di infomobilità (RSS)',
    short: 'ACTV',
    url: 'https://avm.avmspa.it/it/content/infomobilit%C3%A0-avmactv-venezia',
    portalName: 'actv.avmspa.it/rss.xml',
    license: 'actv-content',
  },
  alilaguna: { name: 'Alilaguna S.p.A. – orario GTFS', short: 'Alilaguna', url: 'https://www.alilaguna.it', portalName: 'alilaguna.it (GTFS)', license: 'undeclared' },
  flixbus: {
    name: 'FlixMobility – GTFS europeo FlixBus',
    short: 'FlixBus',
    url: 'https://transport.data.gouv.fr/datasets/flixbus-horaires-theoriques-du-reseau-europeen-1',
    portalName: 'transport.data.gouv.fr',
    license: 'odbl-1.0',
    credit: '© FlixMobility',
  },
  mimitFuel: {
    name: 'Ministero delle Imprese e del Made in Italy – prezzi dei carburanti (Osservatorio prezzi)',
    short: 'MIMIT',
    url: 'https://www.mimit.gov.it/it/open-data/elenco-dataset/carburanti-prezzi-praticati-e-anagrafica-degli-impianti',
    portalName: 'mimit.gov.it (open data)',
    license: 'iodl-2.0',
    credit: 'Ministero delle Imprese e del Made in Italy',
  },
  noaa: { name: 'NOAA Aviation Weather Center', short: 'NOAA', url: 'https://aviationweather.gov', portalName: 'aviationweather.gov', license: 'public-domain-us' },
  opensky: { name: 'OpenSky Network (ADS-B)', short: 'OpenSky', url: 'https://opensky-network.org', portalName: 'opensky-network.org', license: 'opensky-terms' },
  aisstream: { name: 'aisstream.io (rete AIS di ricevitori a terra)', short: 'aisstream.io', url: 'https://aisstream.io', portalName: 'aisstream.io', license: 'ais-public', credit: 'ricevuti tramite aisstream.io' },
  openMeteo: {
    name: 'Open-Meteo – modelli DWD ICON / ECMWF',
    short: 'Open-Meteo',
    url: 'https://open-meteo.com',
    portalName: 'open-meteo.com',
    license: 'cc-by-4.0',
    credit: 'Weather data by Open-Meteo.com',
  },
  cams: {
    name: 'Copernicus CAMS via Open-Meteo Air Quality',
    short: 'Copernicus CAMS',
    url: 'https://open-meteo.com/en/docs/air-quality-api',
    portalName: 'open-meteo.com',
    license: 'cc-by-4.0',
    credit: 'Copernicus Atmosphere Monitoring Service / Open-Meteo.com',
  },
  openMeteoMarine: {
    name: 'Open-Meteo Marine (modelli ECMWF WAM / MeteoFrance MFWAM, Copernicus Marine)',
    short: 'Open-Meteo Marine',
    url: 'https://open-meteo.com/en/docs/marine-weather-api',
    portalName: 'open-meteo.com',
    license: 'cc-by-4.0',
  },
  celestrak: { name: 'CelesTrak (elementi orbitali GP/TLE)', short: 'CelesTrak', url: 'https://celestrak.org', portalName: 'celestrak.org', license: 'undeclared' },
  arpav: { name: 'ARPAV', short: 'ARPAV', url: 'https://www.arpa.veneto.it/dati-ambientali/open-data', portalName: 'arpa.veneto.it', license: 'cc-by-4.0' },
  osm: {
    name: 'OpenStreetMap contributors',
    short: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org',
    portalName: 'openstreetmap.org',
    license: 'odbl-1.0',
    datasetUrl: 'https://www.openstreetmap.org/copyright',
    credit: '© OpenStreetMap contributors',
  },
  veniceTapWater: { name: 'Venice Tap Water', short: 'Venice Tap Water', url: 'https://www.venicetapwater.org', portalName: 'venicetapwater.org', license: 'attribution-required' },
  campo: {
    name: 'Comunità CAMPO',
    short: 'CAMPO',
    url: 'http://217.160.143.203',
    portalName: 'CAMPO (API GeoJSON)',
    license: 'cc-by-4.0',
    attribution: 'Dati forniti dalla comunità di CAMPO Venezia (CC BY 4.0)',
  },
  packetBroker: {
    name: 'Packet Broker Mapper (The Things Network)',
    short: 'The Things Network',
    url: 'https://packetbroker.net',
    portalName: 'mapper.packetbroker.net',
    license: 'owner-published',
    credit: 'tramite Packet Broker (The Things Network)',
  },
  istat: { name: 'ISTAT', short: 'ISTAT', url: 'https://www.istat.it/notizia/basi-territoriali-e-variabili-censuarie/', portalName: 'istat.it (basi territoriali e variabili censuarie)', license: 'cc-by-4.0' },
  cruscotto: { name: 'Cruscotto Italia – AgID', short: 'Cruscotto Italia', url: 'https://cruscotto-italia.dati.gov.it', portalName: 'cruscotto-italia.dati.gov.it', license: 'cc-by-4.0' },
  cciaa: { name: 'Camera di Commercio Venezia Rovigo', short: 'CCIAA Venezia Rovigo', url: 'https://opengovernment.unioncamere.gov.it', portalName: 'opengovernment.unioncamere.gov.it', license: 'cc-by-4.0' },
  bdap: {
    name: 'MEF – Ragioneria Generale dello Stato (BDAP)',
    short: 'BDAP',
    url: 'https://bdap-opendata.rgs.mef.gov.it/opendata/spd_mop_prg_mon_reg05_01_9999',
    portalName: 'bdap-opendata.rgs.mef.gov.it',
    license: 'cc-by',
  },
  agcom: { name: 'AGCOM – BroadbandMap', short: 'AGCOM', url: 'https://maps.agcom.it', portalName: 'maps.agcom.it', license: 'cc-by-4.0', credit: 'citare «BroadbandMap di Agcom»' },
  vod: { name: 'Venice Open Data (VOD)', short: 'VOD', url: SITE_URL, portalName: new URL(SITE_URL).host, license: 'vod-computed' },
} as const satisfies Record<string, Provider>;

export type ProviderId = keyof typeof PROVIDERS;

/** Licenza del fornitore come si mostra: testo della licenza più la formula breve richiesta, se c'è */
export function providerLicense(id: ProviderId): string {
  const p: Provider = PROVIDERS[id];
  const label = licenseLabel(p.license);
  return p.credit ? `${label} – ${p.credit}` : label;
}

/** Licenze di più fornitori, per i dataset che li combinano: «CPSM: CC BY-SA 3.0; NOAA: …» */
export function providersLicense(ids: readonly ProviderId[]): string {
  return ids.map((id) => `${PROVIDERS[id].short}: ${providerLicense(id)}`).join('; ');
}

/** Campi `source`, `sourceUrl`, `license` (e `licenseUrl`) per il `meta` delle risposte API */
export function providerMeta(id: ProviderId, source?: string) {
  const p: Provider = PROVIDERS[id];
  return {
    source: source ?? p.name,
    sourceUrl: p.datasetUrl ?? p.url,
    license: providerLicense(id),
    ...(licenseUrl(p.license) ? { licenseUrl: licenseUrl(p.license) as string } : {}),
    ...(p.attribution ? { attribution: p.attribution } : {}),
  };
}

/** Voce per l'elenco `sources` dei servizi di calcolo: nome, licenza, link */
export function providerCitation(id: ProviderId, detail?: string): { name: string; license: string; url: string } {
  const p: Provider = PROVIDERS[id];
  return { name: detail ? `${p.name} – ${detail}` : p.name, license: providerLicense(id), url: p.datasetUrl ?? p.url };
}
