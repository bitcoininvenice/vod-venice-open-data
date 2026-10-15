import { licenseLabel, licenseUrl } from './provenance/licenses';
import { PROVIDERS } from './provenance/providers';

/**
 * Licenza dei dati del Centro Maree (CPSM) del Comune di Venezia.
 * La scheda del dataset su dati.venezia.it indica CC-BY; la pagina "Open Data" del Comune indica
 * CC BY-SA 3.0 per i dati pubblicati. Scelta prudente: si citano entrambe e ai dati che VOD
 * redistribuisce (API, MCP, esportazioni) si applica la più restrittiva, CC BY-SA 3.0.
 */
const COMUNE_OPEN_DATA_POLICY_URL = 'https://www.comune.venezia.it/it/content/open-data-0';

/** Campi da aggiungere al meta delle risposte che contengono dati CPSM */
export const CPSM_LICENSE_META = {
  license: licenseLabel(PROVIDERS.cpsm.license),
  licenseUrl: licenseUrl(PROVIDERS.cpsm.license) as string,
  attribution: PROVIDERS.cpsm.attribution,
  licenseNote:
    'La scheda del dataset su dati.venezia.it indica CC BY; la pagina Open Data del Comune indica CC BY-SA 3.0. VOD applica la più restrittiva (CC BY-SA 3.0) ai dati che redistribuisce: chi li riusa deve citare la fonte, indicare le modifiche e condividerli con la stessa licenza.',
  licenseSources: [PROVIDERS.cpsm.datasetUrl, COMUNE_OPEN_DATA_POLICY_URL],
} as const;
