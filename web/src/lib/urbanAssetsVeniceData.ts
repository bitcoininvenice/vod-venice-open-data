import wifiHotspots from '@/data/wifi-hotspots.json';
import { BathingWaterItem, UrbanTreeItem, EvChargingItem, WifiHotspotItem } from './types';

// Acque di balneazione dei litorali veneziani: elenco curato del progetto, da verificare.
// Per classi e campionamenti aggiornati fa fede il Portale Acque del Ministero della Salute / ARPAV.
export const BATHING_WATERS_DATA: BathingWaterItem[] = [
  {
    id: 'BALN-LIDO-01',
    name: 'Lido di Venezia - Spiaggia Blue Moon & Lungomare',
    location: 'Lido di Venezia',
    lat: 45.4180,
    lon: 12.3780,
    qualityClass: 'ECCELLENTE',
    blueFlag: true,
    officialSource: 'ARPAV Veneto - U.O. Qualità Acque Marine'
  },
  {
    id: 'BALN-LIDO-02',
    name: 'Lido di Venezia - San Nicolò (Oasi Dunes)',
    location: 'Lido di Venezia',
    lat: 45.4290,
    lon: 12.3890,
    qualityClass: 'ECCELLENTE',
    blueFlag: true,
    officialSource: 'ARPAV Veneto'
  },
  {
    id: 'BALN-LIDO-03',
    name: 'Lido di Venezia - Murazzi & Grand Hotel Excelsior',
    location: 'Lido di Venezia',
    lat: 45.4050,
    lon: 12.3680,
    qualityClass: 'ECCELLENTE',
    blueFlag: true,
    officialSource: 'ARPAV Veneto'
  },
  {
    id: 'BALN-LIDO-04',
    name: 'Lido di Venezia - Alberoni (Oasi WWF Dune e Pineta)',
    location: 'Lido di Venezia',
    lat: 45.3480,
    lon: 12.3210,
    qualityClass: 'ECCELLENTE',
    blueFlag: true,
    officialSource: 'ARPAV Veneto / Portale Acque Ministero Salute'
  },
  {
    id: 'BALN-PELL-01',
    name: 'Isola di Pellestrina - San Pietro in Volta & Murazzi',
    location: 'Pellestrina',
    lat: 45.2890,
    lon: 12.3080,
    qualityClass: 'ECCELLENTE',
    blueFlag: true,
    officialSource: 'ARPAV Veneto'
  }
];

// Catasto del Verde e Alberature Monumentali Comunali (dati.venezia.it)
export const URBAN_TREES_DATA: UrbanTreeItem[] = [
  {
    id: 'TREE-VE-01',
    species: 'Platanus acerifolia',
    commonName: 'Platano orientale monumentale',
    location: 'Giardini Reali di San Marco',
    lat: 45.4330,
    lon: 12.3380,
    heightMeters: 26.5,
    source: 'ELENCO_CURATO'
  },
  {
    id: 'TREE-VE-02',
    species: 'Pinus pinea',
    commonName: 'Pino domestico marittimo',
    location: 'Parco di Sant\'Elena / Viale Quattro Novembre',
    lat: 45.4280,
    lon: 12.3650,
    heightMeters: 19.0,
    source: 'ELENCO_CURATO'
  },
  {
    id: 'TREE-VE-03',
    species: 'Celtis australis',
    commonName: 'Bagolaro secolare (Spaccasassi)',
    location: 'Campo San Giacomo dell\'Orio',
    lat: 45.4402,
    lon: 12.3265,
    heightMeters: 17.5,
    source: 'ELENCO_CURATO'
  },
  {
    id: 'TREE-VE-04',
    species: 'Fagus sylvatica pendula',
    commonName: 'Faggio pendulo storico',
    location: 'Giardini della Biennale (Castello)',
    lat: 45.4300,
    lon: 12.3580,
    heightMeters: 18.0,
    source: 'ELENCO_CURATO'
  },
  {
    id: 'TREE-VE-05',
    species: 'Sophora japonica',
    commonName: 'Sofora del Giappone',
    location: 'Giardino Papadopoli (Piazzale Roma)',
    lat: 45.4390,
    lon: 12.3195,
    heightMeters: 21.0,
    source: 'ELENCO_CURATO'
  },
  {
    id: 'TREE-VE-06',
    species: 'Tilia cordata',
    commonName: 'Tiglio nostrano',
    location: 'Campo Santa Margherita',
    lat: 45.4335,
    lon: 12.3235,
    heightMeters: 15.5,
    source: 'ELENCO_CURATO'
  }
];

// Colonnine Ricarica Elettrica AVM / Enel X (Piattaforma Unica Nazionale PUN)
export const EV_CHARGING_DATA: EvChargingItem[] = [
  {
    id: 'EV-PR-01',
    name: 'Hub Autorimessa Comunale - Piazzale Roma',
    operator: 'AVM / Comune di Venezia',
    location: 'Piazzale Roma, Isola Santa Chiara',
    lat: 45.4375,
    lon: 12.3180,
    totalSockets: 12,
    availableSockets: null,
    powerKw: 50,
    socketTypes: ['Type 2 (22kW)', 'CCS Combo 2 (50kW Fast)'],
    source: 'ELENCO_CURATO'
  },
  {
    id: 'EV-TRON-01',
    name: 'Super-Hub Tronchetto Terminal Interscambio',
    operator: 'AVM / Enel X Way',
    location: 'Isola Nuova del Tronchetto',
    lat: 45.4425,
    lon: 12.3070,
    totalSockets: 16,
    availableSockets: null,
    powerKw: 150,
    socketTypes: ['CCS Combo 2 (150kW Ultra-Fast)', 'CHAdeMO (50kW)', 'Type 2 (22kW)'],
    source: 'ELENCO_CURATO'
  },
  {
    id: 'EV-SM-01',
    name: 'Stazione San Basilio - Santa Marta Porto',
    operator: 'AVM / Be Charge',
    location: 'Ex Cotonificio, Dorsoduro Santa Marta',
    lat: 45.4330,
    lon: 12.3150,
    totalSockets: 4,
    availableSockets: null,
    powerKw: 22,
    socketTypes: ['Type 2 (22kW)'],
    source: 'ELENCO_CURATO'
  },
  {
    id: 'EV-SG-01',
    name: 'Hub Parco San Giuliano - Ingresso Porta Rossa',
    operator: 'AVM / Comune di Venezia',
    location: 'Via San Giuliano (Fronte Laguna)',
    lat: 45.4660,
    lon: 12.2780,
    totalSockets: 8,
    availableSockets: null,
    powerKw: 50,
    socketTypes: ['Type 2 (22kW)', 'CCS 50kW'],
    source: 'ELENCO_CURATO'
  }
];

// Punti di Accesso Wi-Fi Pubblico Gratuito "VeniceConnected" (Venis S.p.A. / dati.venezia.it)
/** Hotspot WiFi del Comune di Venezia, generati da pipeline/import_wifi_hotspots.py (dati.venezia.it, CC BY). */
export const WIFI_HOTSPOTS_META = {
  generatedAt: wifiHotspots.generatedAt,
  source: wifiHotspots.source,
  sourceUrl: wifiHotspots.sourceUrl,
  license: wifiHotspots.license,
};
export const WIFI_HOTSPOTS_DATA: WifiHotspotItem[] = wifiHotspots.hotspots as WifiHotspotItem[];
