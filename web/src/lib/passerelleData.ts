import { PasserellaItem } from './types';

// Rete ufficiale passerelle pedonali per alta marea (CPSM Centro Previsioni Maree / Comune di Venezia)
// Tracciati rialzati montati a quote altimetriche critiche della città storica

export const PASSERELLE_DATA: PasserellaItem[] = [
  {
    id: 'PASS-SM-01',
    name: 'Percorso Piazza San Marco - Bacino Orseolo - Calle Fabbri',
    district: 'San Marco',
    lengthMeters: 420,
    groundElevationCm: 80, // Quota più bassa di Venezia
    activationThresholdCm: 95,
    isMounted: true,
    priority: 'PRIMARIA',
    description: 'Collega la Piazzetta San Marco, la Basilica, il portico di Palazzo Ducale e Bacino Orseolo garantendo il transito verso Campo San Luca.',
    officialSource: 'Comune di Venezia - CPSM & Protezione Civile',
    path: [
      [12.3385, 45.4335], // Molo San Marco
      [12.3388, 45.4340], // Piazzetta
      [12.3384, 45.4344], // Fronte Basilica San Marco
      [12.3365, 45.4345], // Piazza San Marco centro
      [12.3360, 45.4350], // Bacino Orseolo
      [12.3355, 45.4355]  // Calle dei Fabbri verso Goldoni
    ]
  },
  {
    id: 'PASS-SM-02',
    name: 'Percorso Piazzetta dei Leoncini - San Basso - Calle Specchieri',
    district: 'San Marco',
    lengthMeters: 280,
    groundElevationCm: 84,
    activationThresholdCm: 95,
    isMounted: true,
    priority: 'PRIMARIA',
    description: 'Camminamento rialzato a nord della Basilica di San Marco per il deflusso pedonale verso le Mercerie e Castello.',
    officialSource: 'Comune di Venezia - CPSM',
    path: [
      [12.3396, 45.4348], // Piazzetta Leoncini
      [12.3392, 45.4352], // San Basso
      [12.3388, 45.4357], // Calle Spadaria
      [12.3380, 45.4362]  // Raccordo Mercerie
    ]
  },
  {
    id: 'PASS-RI-01',
    name: 'Percorso Rialto - Campo San Bartolomeo - Campo San Salvador',
    district: 'San Marco',
    lengthMeters: 350,
    groundElevationCm: 92,
    activationThresholdCm: 110,
    isMounted: true,
    priority: 'PRIMARIA',
    description: 'Snodo vitale tra il Ponte di Rialto e le direttrici pedonali verso San Marco e Strada Nova.',
    officialSource: 'Comune di Venezia - CPSM',
    path: [
      [12.3360, 45.4380], // Piede Ponte Rialto est
      [12.3368, 45.4377], // Campo San Bartolomeo
      [12.3362, 45.4368], // Campo San Salvador
      [12.3358, 45.4362]  // Marzarieta 2 Aprile
    ]
  },
  {
    id: 'PASS-ST-01',
    name: 'Percorso Stazione Santa Lucia - Fondamenta Scalzi - Lista di Spagna',
    district: 'Cannaregio',
    lengthMeters: 510,
    groundElevationCm: 95,
    activationThresholdCm: 110,
    isMounted: false,
    priority: 'PRIMARIA',
    description: 'Asse di collegamento principale tra il piazzale dei treni, il Ponte degli Scalzi e la via commerciale Lista di Spagna.',
    officialSource: 'Comune di Venezia - Protezione Civile',
    path: [
      [12.3210, 45.4412], // Uscita Stazione FF.SS.
      [12.3220, 45.4415], // Fondamenta Scalzi
      [12.3235, 45.4420], // Piede Ponte Scalzi
      [12.3250, 45.4426], // Lista di Spagna
      [12.3275, 45.4430]  // Campo San Geremia
    ]
  },
  {
    id: 'PASS-PR-01',
    name: 'Percorso Piazzale Roma - Fondamenta Santa Chiara - Ponte Costituzione',
    district: 'Santa Croce',
    lengthMeters: 380,
    groundElevationCm: 102,
    activationThresholdCm: 110,
    isMounted: false,
    priority: 'PRIMARIA',
    description: 'Garantisce il flusso continuo di residenti e pendolari tra gli autobus del Tronchetto/Piazzale Roma e la ferrovia.',
    officialSource: 'Comune di Venezia - LL.PP.',
    path: [
      [12.3185, 45.4380], // Corsia Bus Piazzale Roma
      [12.3195, 45.4390], // Giardino Papadopoli fronte
      [12.3202, 45.4402], // Piede Ponte di Calatrava
      [12.3210, 45.4410]  // Imbarcadero Ferrovia ACTV
    ]
  },
  {
    id: 'PASS-CA-01',
    name: 'Percorso Santi Apostoli - Campo Santa Sofia - Strada Nova',
    district: 'Cannaregio',
    lengthMeters: 460,
    groundElevationCm: 108,
    activationThresholdCm: 115,
    isMounted: false,
    priority: 'SECONDARIA',
    description: 'Tratto allagabile in prossimità del traghetto gondole di Santa Sofia e delle sacche basse di Rio dei Santi Apostoli.',
    officialSource: 'Comune di Venezia - Protezione Civile',
    path: [
      [12.3362, 45.4402], // Campo Santi Apostoli
      [12.3350, 45.4410], // Strada Nova
      [12.3338, 45.4418], // Santa Sofia
      [12.3325, 45.4425]  // Ca d'Oro fronte
    ]
  },
  {
    id: 'PASS-CS-01',
    name: 'Percorso Campo Santa Maria Formosa - Ruga Giuffa - San Zaccaria',
    district: 'Castello',
    lengthMeters: 390,
    groundElevationCm: 90,
    activationThresholdCm: 100,
    isMounted: true,
    priority: 'PRIMARIA',
    description: 'Asse di collegamento est tra l\'area marciana, la parrocchia di Santa Maria Formosa e i pontili di San Zaccaria.',
    officialSource: 'Comune di Venezia - CPSM',
    path: [
      [12.3415, 45.4372], // Campo Santa Maria Formosa
      [12.3420, 45.4362], // Ruga Giuffa
      [12.3430, 45.4350], // Campo San Provolo
      [12.3435, 45.4342]  // Riva degli Schiavoni / San Zaccaria
    ]
  },
  {
    id: 'PASS-DO-01',
    name: 'Percorso Campo Santa Margherita - San Pantalon - Rio Terà Canal',
    district: 'Dorsoduro',
    lengthMeters: 310,
    groundElevationCm: 105,
    activationThresholdCm: 115,
    isMounted: false,
    priority: 'SECONDARIA',
    description: 'Presidio pedonale studentesco e residenziale per il polo universitario di Ca\' Foscari e Iuav.',
    officialSource: 'Comune di Venezia - LL.PP.',
    path: [
      [12.3240, 45.4338], // Campo Santa Margherita nord
      [12.3248, 45.4345], // Ponte San Pantalon
      [12.3255, 45.4350], // Campo San Pantalon
      [12.3262, 45.4358]  // Verso Campo San Tomà
    ]
  }
];
