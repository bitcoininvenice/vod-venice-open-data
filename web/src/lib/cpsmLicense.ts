/**
 * Licenza dei dati del Centro Maree (CPSM) del Comune di Venezia.
 * La scheda del dataset su dati.venezia.it indica CC-BY; la pagina "Open Data" del Comune indica
 * CC BY-SA 3.0 per i dati pubblicati. Scelta prudente: si citano entrambe e ai dati che VOD
 * redistribuisce (API, MCP, esportazioni) si applica la più restrittiva, CC BY-SA 3.0.
 */
export const CPSM_LICENSE = 'CC BY-SA 3.0 (dati redistribuiti da VOD) · la scheda del dataset indica CC BY';
const CPSM_LICENSE_SHORT = 'CC BY-SA 3.0';
const CPSM_LICENSE_URL = 'https://creativecommons.org/licenses/by-sa/3.0/it/';
const CPSM_DATASET_URL = 'https://dati.venezia.it/?q=content/cpsm-dati-meteomarini-laguna-e-litorale-veneziano';
const COMUNE_OPEN_DATA_POLICY_URL = 'https://www.comune.venezia.it/it/content/open-data-0';
const CPSM_ATTRIBUTION = 'Dati: Comune di Venezia – Centro Previsioni e Segnalazioni Maree (dati.venezia.it), elaborati da VOD';

/** Campi da aggiungere al meta delle risposte che contengono dati CPSM */
export const CPSM_LICENSE_META = {
  license: CPSM_LICENSE_SHORT,
  licenseUrl: CPSM_LICENSE_URL,
  attribution: CPSM_ATTRIBUTION,
  licenseNote:
    'La scheda del dataset su dati.venezia.it indica CC BY; la pagina Open Data del Comune indica CC BY-SA 3.0. VOD applica la più restrittiva (CC BY-SA 3.0) ai dati che redistribuisce: chi li riusa deve citare la fonte, indicare le modifiche e condividerli con la stessa licenza.',
  licenseSources: [CPSM_DATASET_URL, COMUNE_OPEN_DATA_POLICY_URL],
} as const;
