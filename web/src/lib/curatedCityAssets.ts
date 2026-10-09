import type { CityAssetItem, ParkingItem } from './types';

/**
 * Elenchi compilati a mano nel progetto, senza una fonte aperta che li confermi.
 * Le voci sono mostrate come "da verificare". Ponti: rampe e servoscala possono essere temporanei;
 * il Ponte della Costituzione è stato tolto perché l'ovovia è stata rimossa nel 2020.
 * Parcheggi: capienze e tariffe riportate a mano; lib/osmPoi.ts li unisce ai parcheggi OpenStreetMap.
 */
export const CURATED_CITY_ASSETS: CityAssetItem[] = [
  // 2. Ponti con Rampe e Percorsi Accessibili (Comune di Venezia)
  {
    id: 'p-1',
    name: 'Ponte della Paglia (Rampe Agevolate)',
    type: 'ACCESSIBLE_BRIDGE',
    lat: 45.4338,
    lon: 12.3405,
    sestiere: 'San Marco / Castello',
    details: 'Ponte dotato di rampe a pendenza ridotta (6%) per disabili e passeggini',
    accessibilityNote: 'Percorso accessibile Marciana - Arsenale',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'p-3',
    name: 'Ponte dei Tre Archi (Rampe Laterali)',
    type: 'ACCESSIBLE_BRIDGE',
    lat: 45.4462,
    lon: 12.3204,
    sestiere: 'Cannaregio',
    details: 'Ponte storico sul Canale di Cannaregio dotato di raccordo accessibile',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'p-4',
    name: 'Ponte della Veneta Marina (Rampe Temporanee Maratona)',
    type: 'ACCESSIBLE_BRIDGE',
    lat: 45.4320,
    lon: 12.3530,
    sestiere: 'Castello',
    details: 'Rampa fissa per accesso Giardini della Biennale',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'p-5',
    name: 'Ponte de la Zecca / Molo Marciano',
    type: 'ACCESSIBLE_BRIDGE',
    lat: 45.4332,
    lon: 12.3385,
    sestiere: 'San Marco',
    details: 'Rampa a pendenza dolce (5%) di collegamento Giardinetti Reali - Piazzetta San Marco',
    accessibilityNote: 'Percorso monumentale accessibile PRM',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'p-6',
    name: 'Ponte del Cristo a San Marcuola',
    type: 'ACCESSIBLE_BRIDGE',
    lat: 45.4428,
    lon: 12.3275,
    sestiere: 'Cannaregio',
    details: 'Ponte ad arco ribassato con servoscala elettrico e piattaforma mobile AVM',
    accessibilityNote: 'Servizio di accompagnamento disabili su prenotazione',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'p-7',
    name: 'Ponte delle Guglie (Percorso Raccordato)',
    type: 'ACCESSIBLE_BRIDGE',
    lat: 45.4432,
    lon: 12.3248,
    sestiere: 'Cannaregio',
    details: 'Scalini con pedata maggiorata e corsia centrale raccordata per carrelli e sedie a rotelle',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'p-8',
    name: 'Ponte San Barnaba (Rampa Antisdrucciolo)',
    type: 'ACCESSIBLE_BRIDGE',
    lat: 45.4335,
    lon: 12.3250,
    sestiere: 'Dorsoduro',
    details: 'Ponte dotato di raccordo in legno multistrato marino resinato antisdrucciolo',
    accessibilityNote: 'Percorso senza barriere Zattere - Ca\' Foscari',
    source: 'ELENCO_CURATO'
  },

  // 3. Veritas - Punti Raccolta Rifiuti e Battelli
  {
    id: 'v-1',
    name: 'Battello Veritas Raccolta Rifiuti (Rialto Mercato)',
    type: 'VERITAS_BOAT',
    lat: 45.4392,
    lon: 12.3355,
    sestiere: 'San Polo',
    details: 'Battello ecologico ormeggiato 06:30 - 08:30 per conferimento residenti',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'v-2',
    name: 'Battello Veritas Raccolta (Zattere)',
    type: 'VERITAS_BOAT',
    lat: 45.4295,
    lon: 12.3275,
    sestiere: 'Dorsoduro',
    details: 'Battello ormeggiato Canale Giudecca per raccolta differenziata',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'v-3',
    name: 'Isola Ecologica Interrata Tronchetto',
    type: 'VERITAS_WASTE',
    lat: 45.4410,
    lon: 12.3025,
    sestiere: 'Tronchetto',
    details: 'Piattaforma compattatrice Veritas per carta, vetro, plastica e RSU',
    source: 'ELENCO_CURATO'
  }
];

export const CURATED_PARKINGS: ParkingItem[] = [
  // 1. Centro Storico Insulare (Piazzale Roma & Tronchetto)
  {
    id: 'park-1',
    name: 'Autorimessa Comunale ASM',
    location: 'Piazzale Roma',
    totalSpots: 2182,
    lat: 45.4378,
    lon: 12.3182,
    rateHourly: '€ 35,00 / 24h',
    operator: 'AVM S.p.A. / Comune di Venezia',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'park-2',
    name: 'Garage San Marco',
    location: 'Piazzale Roma',
    totalSpots: 900,
    lat: 45.4368,
    lon: 12.3178,
    rateHourly: '€ 45,00 / 24h',
    operator: 'Garage San Marco S.p.A.',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'park-3',
    name: 'Parcheggio Sant\'Andrea',
    location: 'Piazzale Roma',
    totalSpots: 100,
    lat: 45.4365,
    lon: 12.3160,
    rateHourly: '€ 7,00 / 2h (sosta breve)',
    operator: 'AVM S.p.A.',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'park-4',
    name: 'Interparking Tronchetto',
    location: 'Tronchetto',
    totalSpots: 3950,
    lat: 45.4415,
    lon: 12.3040,
    rateHourly: '€ 26,00 / 24h (People Mover)',
    operator: 'Interparking Italia S.r.l.',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'park-5',
    name: 'Scalo Fluviale Tronchetto',
    location: 'Tronchetto',
    totalSpots: 220,
    lat: 45.4430,
    lon: 12.3075,
    rateHourly: '€ 20,00 / 24h',
    operator: 'AVM S.p.A.',
    source: 'ELENCO_CURATO'
  },

  // 2. Terraferma: Nodi d'Interscambio Parco San Giuliano (AVM)
  {
    id: 'park-6',
    name: 'Park San Giuliano - Porta Gialla',
    location: 'Mestre',
    totalSpots: 270,
    lat: 45.4665,
    lon: 12.2785,
    rateHourly: '3h gratis, poi € 2,00/h (Tram T1)',
    operator: 'AVM S.p.A.',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'park-7',
    name: 'Park San Giuliano - Porta Rossa',
    location: 'Mestre',
    totalSpots: 250,
    lat: 45.4642,
    lon: 12.2740,
    rateHourly: '3h gratis, poi € 2,00/h (Bus 5, 19, 24)',
    operator: 'AVM S.p.A.',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'park-8',
    name: 'Park San Giuliano - Porta Blu',
    location: 'Mestre',
    totalSpots: 190,
    lat: 45.4678,
    lon: 12.2708,
    rateHourly: '3h gratis, poi € 2,00/h',
    operator: 'AVM S.p.A.',
    source: 'ELENCO_CURATO'
  },

  // 3. Terraferma: Polo Ferroviario Stazione Mestre
  {
    id: 'park-9',
    name: 'Park Stazione Mestre - Ca\' Marcello',
    location: 'Mestre',
    totalSpots: 650,
    lat: 45.4808,
    lon: 12.2345,
    rateHourly: '€ 14,00 / 24h (Treni S.Lucia 10 min)',
    operator: 'Metropark (Gruppo FS) / AVM',
    source: 'ELENCO_CURATO'
  },

  // 4. Terraferma: Centro Urbano Mestre
  {
    id: 'park-10',
    name: 'Park Candiani (Mestre Centro)',
    location: 'Mestre',
    totalSpots: 105,
    lat: 45.4912,
    lon: 12.2388,
    rateHourly: '€ 2,00 / ora (Centro Candiani)',
    operator: 'AVM S.p.A.',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'park-11',
    name: 'Park Costa (Mestre Centro)',
    location: 'Mestre',
    totalSpots: 302,
    lat: 45.4940,
    lon: 12.2325,
    rateHourly: '€ 2,00 / ora (Piazza Ferretto)',
    operator: 'AVM S.p.A.',
    source: 'ELENCO_CURATO'
  },

  // 5. Terraferma: Hub Scambiatori Tangenziale, VEGA & Marghera
  {
    id: 'park-12',
    name: 'Park Marghera - P1 Panorama',
    location: 'Mestre',
    totalSpots: 450,
    lat: 45.4715,
    lon: 12.2155,
    rateHourly: 'Gratuito scambiatore (Bus 6/6L)',
    operator: 'Comune di Venezia / AVM',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'park-13',
    name: 'Park VEGA Porto Marghera',
    location: 'Mestre',
    totalSpots: 380,
    lat: 45.4745,
    lon: 12.2530,
    rateHourly: '€ 1,50 / ora (Staz. P. Marghera)',
    operator: 'VEGA Parco Scientifico / AVM',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'park-14',
    name: 'Park Castellana A4',
    location: 'Mestre',
    totalSpots: 220,
    lat: 45.5085,
    lon: 12.2210,
    rateHourly: 'Gratuito scambiatore (Bus 53E / SFMR)',
    operator: 'Comune di Venezia / AVM',
    source: 'ELENCO_CURATO'
  },
  {
    id: 'park-15',
    name: 'Park Taliercio (Favaro)',
    location: 'Mestre',
    totalSpots: 180,
    lat: 45.5060,
    lon: 12.2720,
    rateHourly: 'Gratuito scambiatore (Tram T2)',
    operator: 'AVM S.p.A.',
    source: 'ELENCO_CURATO'
  }
];
