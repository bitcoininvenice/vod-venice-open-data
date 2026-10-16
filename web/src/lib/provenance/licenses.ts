/**
 * Licenze delle fonti di VOD: un solo testo e un solo link per licenza. Chi cita una licenza usa la
 * sua chiave (`LicenseId`), così un errore di battitura non compila e un cambio di testo vale ovunque.
 */
export const LICENSES = {
  'cc-by-4.0': { label: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
  /** La fonte dichiara CC BY senza indicare la versione */
  'cc-by': { label: 'CC BY', url: null },
  'cc-by-sa-3.0-it': { label: 'CC BY-SA 3.0', url: 'https://creativecommons.org/licenses/by-sa/3.0/it/' },
  'iodl-2.0': { label: 'IODL 2.0', url: 'https://www.dati.gov.it/iodl/2.0/' },
  'odbl-1.0': { label: 'ODbL 1.0', url: 'https://opendatacommons.org/licenses/odbl/1-0/' },
  'public-domain-us': { label: 'Pubblico dominio (US Government)', url: null },
  'actv-realtime': { label: 'Open Data Real Time ACTV (catalogo dei dati ACTV)', url: null },
  'actv-content': { label: 'Contenuti ACTV, citati con link alla fonte', url: null },
  'public-acts': { label: 'Atti pubblici', url: null },
  'attribution-required': { label: 'Uso con citazione della fonte', url: null },
  'opensky-terms': { label: 'Termini d’uso OpenSky Network (uso non commerciale e di ricerca)', url: null },
  'ais-public': { label: 'Messaggi AIS trasmessi pubblicamente dalle navi', url: null },
  'owner-published': { label: 'Dati pubblicati dai proprietari', url: null },
  'vod-computed': { label: 'Calcolo di VOD su dati aperti', url: null },
  /** Nessuna licenza dichiarata dalla fonte: si cita il titolare e non si ridistribuisce oltre il necessario */
  undeclared: { label: 'Non dichiarata: citare la fonte', url: null },
} as const satisfies Record<string, { label: string; url: string | null }>;

export type LicenseId = keyof typeof LICENSES;

export function licenseLabel(id: LicenseId): string {
  return LICENSES[id].label;
}

export function licenseUrl(id: LicenseId): string | null {
  return LICENSES[id].url;
}
