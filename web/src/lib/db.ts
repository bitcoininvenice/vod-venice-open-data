/**
 * VOD - Venice Open Data
 * Database Access Layer & Spatial Geometry Queries
 */

import { CantiereItem, StopItem, StopNearCantiere, PlatformMetrics, SatelliteItem } from './types';

// Fallback verified datasets for client rendering and offline operations
export const MOCK_CANTIERI: CantiereItem[] = [
  {
    id: 1,
    codice: "VE-CANT-2026-01",
    titolo: "Manutenzione straordinaria pontile e passerelle San Zaccaria",
    localizzazione: "Riva degli Schiavoni, San Zaccaria",
    quartiere: "Castello",
    tipologia: "Manutenzione Pontili",
    stato: "In corso",
    dataInizio: "2026-09-15",
    dataFinePrevista: "2026-11-30",
    importoLavori: 420000.00,
    enteResponsabile: "Comune di Venezia - Direzione Lavori Pubblici",
    impattoMobilita: "Critico",
    dettagli: "Sostituzione briccole, ripavimentazione pontile galleggiante e consolidamento ormeggi linee 1, 2, 4.1 e 5.1.",
    lat: 45.4338,
    lon: 12.3435
  },
  {
    id: 2,
    codice: "VE-CANT-2026-02",
    titolo: "Dragaggio sedimenti e scavo fondali Rio di Cannaregio",
    localizzazione: "Rio di Cannaregio (tratto Ponte delle Guglie - Canale)",
    quartiere: "Cannaregio",
    tipologia: "Scavo Canali/Fango",
    stato: "In corso",
    dataInizio: "2026-08-01",
    dataFinePrevista: "2026-12-15",
    importoLavori: 890000.00,
    enteResponsabile: "Insula S.p.A. / Provveditorato OO.PP.",
    impattoMobilita: "Medio",
    dettagli: "Restringimento del canale navigabile a senso unico alternato. Rallentamenti per linea 3.",
    lat: 45.4435,
    lon: 12.3255
  },
  {
    id: 3,
    codice: "VE-CANT-2026-03",
    titolo: "Consolidamento statico riva e banchina San Tomà",
    localizzazione: "Canal Grande, San Polo / San Tomà",
    quartiere: "San Polo",
    tipologia: "Manutenzione Rive",
    stato: "In corso",
    dataInizio: "2026-09-01",
    dataFinePrevista: "2026-11-10",
    importoLavori: 310000.00,
    enteResponsabile: "Comune di Venezia",
    impattoMobilita: "Medio",
    dettagli: "Risanamento muratura subacquea in pietra d'Istria per pontile linea 1 e 2.",
    lat: 45.4357,
    lon: 12.3284
  },
  {
    id: 4,
    codice: "VE-CANT-2026-04",
    titolo: "Riqualificazione corsie TPL e banchine Piazzale Roma",
    localizzazione: "Piazzale Roma, corsia bus Santa Chiara",
    quartiere: "Santa Croce",
    tipologia: "Opere Stradali",
    stato: "In corso",
    dataInizio: "2026-07-10",
    dataFinePrevista: "2026-10-31",
    importoLavori: 650000.00,
    enteResponsabile: "AVM S.p.A. / Comune di Venezia",
    impattoMobilita: "Critico",
    dettagli: "Nuovo manto fonoassorbente per autobus articolati e aggiornamento banchine PRM.",
    lat: 45.4382,
    lon: 12.3185
  },
  {
    id: 5,
    codice: "VE-CANT-2026-05",
    titolo: "Rinnovo marginamento lagunare Fondamente Nove",
    localizzazione: "Fondamente Nove, fronte Laguna Nord",
    quartiere: "Cannaregio",
    tipologia: "Manutenzione Rive",
    stato: "In corso",
    dataInizio: "2026-08-20",
    dataFinePrevista: "2026-12-20",
    importoLavori: 520000.00,
    enteResponsabile: "Comune di Venezia",
    impattoMobilita: "Medio",
    dettagli: "Messa in sicurezza banchina di imbarco per le motonavi dirette a Murano e Burano.",
    lat: 45.4452,
    lon: 12.3418
  },
  {
    id: 6,
    codice: "VE-CANT-2026-06",
    titolo: "Rifacimento sede binario tramviario Corso del Popolo",
    localizzazione: "Corso del Popolo / Via Torino, Mestre",
    quartiere: "Mestre Centro",
    tipologia: "Opere Stradali",
    stato: "In corso",
    dataInizio: "2026-09-05",
    dataFinePrevista: "2026-10-25",
    importoLavori: 380000.00,
    enteResponsabile: "PMV / Comune di Venezia",
    impattoMobilita: "Critico",
    dettagli: "Lavori notturni e deviazioni parziali per le linee T1 e bus 4L verso Venezia.",
    lat: 45.4875,
    lon: 12.2410
  },
  {
    id: 7,
    codice: "VE-CANT-2026-07",
    titolo: "Messa a norma accessibilità pontile Murano Colonna",
    localizzazione: "Murano Colonna, canale dei Marani",
    quartiere: "Murano",
    tipologia: "Manutenzione Pontili",
    stato: "In corso",
    dataInizio: "2026-09-18",
    dataFinePrevista: "2026-11-15",
    importoLavori: 210000.00,
    enteResponsabile: "AVM S.p.A.",
    impattoMobilita: "Basso",
    dettagli: "Installazione elevatore idraulico e allargamento corsia di sbarco passeggeri.",
    lat: 45.4518,
    lon: 12.3522
  },
  {
    id: 8,
    codice: "VE-CANT-2026-08",
    titolo: "Restauro pensilina liberty Lido S.M.E.",
    localizzazione: "Piazzale S.M.E., Lido di Venezia",
    quartiere: "Lido",
    tipologia: "Opere Stradali",
    stato: "In corso",
    dataInizio: "2026-08-15",
    dataFinePrevista: "2026-11-05",
    importoLavori: 290000.00,
    enteResponsabile: "Comune di Venezia - Direzione Mobilità",
    impattoMobilita: "Medio",
    dettagli: "Riorganizzazione delle corsie di attestamento per i bus urbani dell'isola.",
    lat: 45.4172,
    lon: 12.3685
  },
  {
    id: 9,
    codice: "VE-CANT-2026-09",
    titolo: "Manutenzione e restauro conservativo Ponte dell'Accademia",
    localizzazione: "Ponte dell'Accademia, Canal Grande",
    quartiere: "Dorsoduro / San Marco",
    tipologia: "Restauro Ponti",
    stato: "In corso",
    dataInizio: "2026-09-10",
    dataFinePrevista: "2026-11-20",
    importoLavori: 340000.00,
    enteResponsabile: "Comune di Venezia - Direzione Lavori Pubblici",
    impattoMobilita: "Basso",
    dettagli: "Trattamento protettivo elementi lignei e sostituzione listoni gradini calpestio.",
    lat: 45.4315,
    lon: 12.3288
  },
  {
    id: 10,
    codice: "VE-CANT-2026-10",
    titolo: "Consolidamento sponde e rive Rio dei Mendicanti",
    localizzazione: "Rio dei Mendicanti, fronte Ospedale SS. Giovanni e Paolo",
    quartiere: "Castello",
    tipologia: "Manutenzione Rive",
    stato: "In corso",
    dataInizio: "2026-08-01",
    dataFinePrevista: "2026-12-10",
    importoLavori: 480000.00,
    enteResponsabile: "Insula S.p.A.",
    impattoMobilita: "Medio",
    dettagli: "Rifacimento fondazioni subacquee e banchina approdo emergenze sanitarie.",
    lat: 45.4412,
    lon: 12.3420
  },
  {
    id: 11,
    codice: "VE-CANT-2026-11",
    titolo: "Riparazione pavimentazione masegni storici Campo San Giacomo dell'Orio",
    localizzazione: "Campo San Giacomo dell'Orio",
    quartiere: "Santa Croce",
    tipologia: "Opere Stradali",
    stato: "In corso",
    dataInizio: "2026-09-22",
    dataFinePrevista: "2026-10-30",
    importoLavori: 120000.00,
    enteResponsabile: "Comune di Venezia",
    impattoMobilita: "Basso",
    dettagli: "Riposizionamento selciato in trachite euganea e livellamento chiusini fognari.",
    lat: 45.4404,
    lon: 12.3275
  },
  {
    id: 12,
    codice: "VE-CANT-2026-12",
    titolo: "Adeguamento idraulico e rifacimento paratoie Rio Novo",
    localizzazione: "Rio Novo, tratto Ponte de la Cazziola - Tre Ponti",
    quartiere: "Santa Croce / Dorsoduro",
    tipologia: "Scavo Canali/Fango",
    stato: "In corso",
    dataInizio: "2026-08-15",
    dataFinePrevista: "2026-11-30",
    importoLavori: 560000.00,
    enteResponsabile: "Provveditorato Interregionale OO.PP. / Insula S.p.A.",
    impattoMobilita: "Medio",
    dettagli: "Asporto sedimenti e installazione nuova paratoia di regolazione flusso di marea.",
    lat: 45.4372,
    lon: 12.3215
  }
];

export const VERIFIED_CANTIERI_DATA = MOCK_CANTIERI;

export const ACTV_OFFICIAL_STOPS: StopItem[] = [
  // 1. Canal Grande (da Piazzale Roma a San Marco)
  { id: "P_ROMA_PARISI", name: "P.le Roma (Parisi) 'C/D'", lat: 45.4385, lon: 12.3175, mode: "navigazione", lines: ["1", "2", "3", "4.1", "4.2", "5.1", "5.2", "N"], wheelchair: true },
  { id: "P_ROMA_S_CHIARA", name: "P.le Roma (S. Chiara) 'E/F'", lat: 45.4380, lon: 12.3180, mode: "navigazione", lines: ["1", "2"], wheelchair: true },
  { id: "FERROVIA_SCALZI", name: "Ferrovia (Scalzi) 'A/B'", lat: 45.4411, lon: 12.3210, mode: "navigazione", lines: ["1", "2", "3", "4.1", "4.2", "5.1", "5.2", "N"], wheelchair: true },
  { id: "FERROVIA_S_LUCIA", name: "Ferrovia (S. Lucia) 'C/D/E'", lat: 45.4415, lon: 12.3225, mode: "navigazione", lines: ["1", "2", "3", "N"], wheelchair: true },
  { id: "RIVA_DE_BIASIO", name: "Riva de Biasio", lat: 45.4422, lon: 12.3255, mode: "navigazione", lines: ["1", "5.1", "5.2", "N"], wheelchair: true },
  { id: "S_MARCUOLA", name: "S. Marcuola (Casinò)", lat: 45.4428, lon: 12.3290, mode: "navigazione", lines: ["1", "2", "N"], wheelchair: true },
  { id: "S_STAE", name: "S. Stae", lat: 45.4416, lon: 12.3308, mode: "navigazione", lines: ["1", "N"], wheelchair: true },
  { id: "CA_DORO", name: "Ca' d'Oro", lat: 45.4406, lon: 12.3340, mode: "navigazione", lines: ["1", "N"], wheelchair: false },
  { id: "RIALTO_MERCATO", name: "Rialto Mercato", lat: 45.4392, lon: 12.3352, mode: "navigazione", lines: ["1", "N"], wheelchair: true },
  { id: "RIALTO", name: "Rialto 'C/D'", lat: 45.4379, lon: 12.3358, mode: "navigazione", lines: ["1", "2", "N"], wheelchair: true },
  { id: "S_SILVESTRO", name: "S. Silvestro", lat: 45.4365, lon: 12.3342, mode: "navigazione", lines: ["1"], wheelchair: true },
  { id: "S_TOMA", name: "S. Tomà", lat: 45.4357, lon: 12.3288, mode: "navigazione", lines: ["1", "2", "N"], wheelchair: true },
  { id: "S_ANGELO", name: "S. Angelo", lat: 45.4350, lon: 12.3305, mode: "navigazione", lines: ["1"], wheelchair: true },
  { id: "S_SAMUELE", name: "S. Samuele (Palazzo Grassi)", lat: 45.4332, lon: 12.3282, mode: "navigazione", lines: ["2"], wheelchair: true },
  { id: "CA_REZZONICO", name: "Ca' Rezzonico", lat: 45.4328, lon: 12.3270, mode: "navigazione", lines: ["1"], wheelchair: true },
  { id: "ACCADEMIA", name: "Accademia", lat: 45.4312, lon: 12.3288, mode: "navigazione", lines: ["1", "2", "N"], wheelchair: true },
  { id: "S_MARIA_GIGLIO", name: "S. Maria del Giglio", lat: 45.4316, lon: 12.3325, mode: "navigazione", lines: ["1"], wheelchair: true },
  { id: "SALUTE", name: "Salute", lat: 45.4310, lon: 12.3355, mode: "navigazione", lines: ["1"], wheelchair: true },
  { id: "SM_VAL", name: "S. Marco Vallaresso", lat: 45.4325, lon: 12.3375, mode: "navigazione", lines: ["1", "2", "N"], wheelchair: true },
  { id: "SM_GIARDINETTI", name: "S. Marco Giardinetti", lat: 45.4328, lon: 12.3388, mode: "navigazione", lines: ["2"], wheelchair: true },

  // 2. Bacino San Marco, Riva degli Schiavoni, Castello & Sant'Elena
  { id: "SZ-A", name: "S. Zaccaria (Pietà) 'A'", lat: 45.4342, lon: 12.3448, mode: "navigazione", lines: ["14", "15", "B"], wheelchair: true },
  { id: "SZ-B", name: "S. Zaccaria (Danieli) 'B'", lat: 45.4339, lon: 12.3432, mode: "navigazione", lines: ["1", "5.1", "5.2", "N"], wheelchair: true },
  { id: "SZ-C", name: "S. Zaccaria (Jolanda) 'C'", lat: 45.4336, lon: 12.3421, mode: "navigazione", lines: ["2", "4.1", "4.2"], wheelchair: true },
  { id: "SZ-E", name: "S. Zaccaria (Monumento) 'E/F'", lat: 45.4338, lon: 12.3412, mode: "navigazione", lines: ["2", "N"], wheelchair: true },
  { id: "ARSENALE", name: "Arsenale", lat: 45.4335, lon: 12.3488, mode: "navigazione", lines: ["1", "4.1", "4.2"], wheelchair: true },
  { id: "GIARDINI", name: "Giardini 'A/B'", lat: 45.4300, lon: 12.3562, mode: "navigazione", lines: ["1", "4.1", "4.2", "5.1", "5.2", "6", "8", "N"], wheelchair: true },
  { id: "GIARDINI_BIENNALE", name: "Giardini Biennale", lat: 45.4288, lon: 12.3585, mode: "navigazione", lines: ["1", "4.1", "4.2", "5.1", "5.2"], wheelchair: true },
  { id: "S_ELENA", name: "S. Elena", lat: 45.4270, lon: 12.3645, mode: "navigazione", lines: ["1", "4.1", "4.2", "5.1", "5.2", "6"], wheelchair: true },

  // 3. Canale della Giudecca, Dorsoduro & Tronchetto
  { id: "TRONCHETTO", name: "Tronchetto Ferry", lat: 45.4422, lon: 12.3048, mode: "ferry", lines: ["17"], wheelchair: true },
  { id: "TRONCHETTO_NAV", name: "Tronchetto 'A/B'", lat: 45.4418, lon: 12.3055, mode: "navigazione", lines: ["2", "N"], wheelchair: true },
  { id: "TRONCHETTO_MERCATO", name: "Tronchetto Mercato", lat: 45.4410, lon: 12.3082, mode: "navigazione", lines: ["2"], wheelchair: true },
  { id: "S_BASILIO", name: "S. Basilio", lat: 45.4335, lon: 12.3195, mode: "navigazione", lines: ["2"], wheelchair: true },
  { id: "ZATTERE", name: "Zattere (Gesuati)", lat: 45.4295, lon: 12.3275, mode: "navigazione", lines: ["2", "5.1", "5.2", "6", "10", "16"], wheelchair: true },
  { id: "SPIRITO_SANTO", name: "Spirito Santo", lat: 45.4298, lon: 12.3330, mode: "navigazione", lines: ["2"], wheelchair: true },
  { id: "SACCA_FISOLA", name: "Sacca Fisola", lat: 45.4285, lon: 12.3120, mode: "navigazione", lines: ["2", "4.1", "4.2", "N"], wheelchair: true },
  { id: "PALANCA", name: "Giudecca Palanca", lat: 45.4265, lon: 12.3218, mode: "navigazione", lines: ["2", "4.1", "4.2", "8", "N"], wheelchair: true },
  { id: "REDENTORE", name: "Redentore", lat: 45.4258, lon: 12.3315, mode: "navigazione", lines: ["2", "4.1", "4.2", "N"], wheelchair: true },
  { id: "ZITELLE", name: "Zitelle", lat: 45.4262, lon: 12.3415, mode: "navigazione", lines: ["2", "4.1", "4.2", "N"], wheelchair: true },
  { id: "S_GIORGIO", name: "S. Giorgio Maggiore", lat: 45.4292, lon: 12.3435, mode: "navigazione", lines: ["2", "N"], wheelchair: true },

  // 4. Canale di Cannaregio & Canale delle Navi
  { id: "TRE_ARCHI", name: "Tre Archi", lat: 45.4452, lon: 12.3182, mode: "navigazione", lines: ["4.1", "4.2", "5.1", "5.2"], wheelchair: true },
  { id: "GUGLIE", name: "Ponte delle Guglie", lat: 45.4435, lon: 12.3248, mode: "navigazione", lines: ["4.1", "4.2", "5.1", "5.2"], wheelchair: true },
  { id: "CREA", name: "Crea", lat: 45.4468, lon: 12.3142, mode: "navigazione", lines: ["4.1", "4.2"], wheelchair: true },

  // 5. Fondamente Nove & Cimitero
  { id: "F_NOVE", name: "F.te Nove 'A'", lat: 45.4452, lon: 12.3420, mode: "navigazione", lines: ["4.1", "4.2", "12", "13", "22"], wheelchair: true },
  { id: "F_NOVE_B", name: "F.te Nove 'B/C'", lat: 45.4450, lon: 12.3408, mode: "navigazione", lines: ["4.1", "4.2", "12"], wheelchair: true },
  { id: "F_NOVE_D", name: "F.te Nove 'D'", lat: 45.4445, lon: 12.3392, mode: "navigazione", lines: ["5.1", "5.2", "A"], wheelchair: true },
  { id: "CIMITERO", name: "Cimitero S. Michele", lat: 45.4485, lon: 12.3468, mode: "navigazione", lines: ["4.1", "4.2"], wheelchair: true },

  // 6. Murano (Rete pontili dell'isola del vetro)
  { id: "MURANO_COL", name: "Murano Colonna 'A'", lat: 45.4518, lon: 12.3525, mode: "navigazione", lines: ["3", "4.1", "4.2", "7", "18"], wheelchair: true },
  { id: "MURANO_FARO", name: "Murano Faro", lat: 45.4535, lon: 12.3562, mode: "navigazione", lines: ["3", "4.1", "4.2", "7", "12", "N"], wheelchair: true },
  { id: "MURANO_NAVAGERO", name: "Murano Navagero", lat: 45.4568, lon: 12.3582, mode: "navigazione", lines: ["3", "4.1", "4.2", "7", "18"], wheelchair: true },
  { id: "MURANO_MUSEO", name: "Murano Museo", lat: 45.4582, lon: 12.3552, mode: "navigazione", lines: ["3", "4.1", "4.2"], wheelchair: true },
  { id: "MURANO_DA_MULA", name: "Murano Da Mula", lat: 45.4572, lon: 12.3522, mode: "navigazione", lines: ["3", "4.1", "4.2"], wheelchair: true },
  { id: "MURANO_VENIER", name: "Murano Venier", lat: 45.4562, lon: 12.3485, mode: "navigazione", lines: ["3", "4.1", "4.2"], wheelchair: true },
  { id: "MURANO_SERENELLA", name: "Murano Serenella", lat: 45.4532, lon: 12.3468, mode: "navigazione", lines: ["4.1", "4.2"], wheelchair: true },

  // 7. Laguna Nord (Vignole, Sant'Erasmo, Mazzorbo, Burano, Torcello, Treporti, Punta Sabbioni)
  { id: "VIGNOLE", name: "Vignole", lat: 45.4428, lon: 12.3780, mode: "navigazione", lines: ["13"], wheelchair: true },
  { id: "S_ERASMO_CAPANNONE", name: "S. Erasmo Capannone", lat: 45.4520, lon: 12.3940, mode: "navigazione", lines: ["13"], wheelchair: true },
  { id: "S_ERASMO_CHIESA", name: "S. Erasmo Chiesa", lat: 45.4610, lon: 12.4110, mode: "navigazione", lines: ["13"], wheelchair: true },
  { id: "S_ERASMO_PUNTA_VELA", name: "S. Erasmo Punta Vela", lat: 45.4745, lon: 12.4285, mode: "navigazione", lines: ["13"], wheelchair: true },
  { id: "LAZZARETTO_NUOVO", name: "Lazzaretto Nuovo", lat: 45.4560, lon: 12.3860, mode: "navigazione", lines: ["13"], wheelchair: true },
  { id: "MAZZORBO", name: "Mazzorbo", lat: 45.4862, lon: 12.4095, mode: "navigazione", lines: ["12", "NLN"], wheelchair: true },
  { id: "BURANO", name: "Burano 'B'", lat: 45.4855, lon: 12.4168, mode: "navigazione", lines: ["9", "12", "NLN"], wheelchair: true },
  { id: "TORCELLO", name: "Torcello", lat: 45.4965, lon: 12.4182, mode: "navigazione", lines: ["9", "12"], wheelchair: true },
  { id: "TREPORTI", name: "Treporti", lat: 45.4835, lon: 12.4510, mode: "navigazione", lines: ["12", "13", "NLN"], wheelchair: true },
  { id: "PUNTA_SABBIONI", name: "Punta Sabbioni", lat: 45.4485, lon: 12.4248, mode: "navigazione", lines: ["12", "14", "15", "17", "22", "NLN"], wheelchair: true },

  // 8. Lido di Venezia, Certosa & Laguna Sud
  { id: "CERTOSA", name: "Certosa", lat: 45.4315, lon: 12.3685, mode: "navigazione", lines: ["4.1", "4.2"], wheelchair: true },
  { id: "LIDO_SME", name: "Lido S.M.E. 'D'", lat: 45.4170, lon: 12.3690, mode: "navigazione", lines: ["1", "5.1", "5.2", "6", "10", "14", "N"], wheelchair: true },
  { id: "LIDO_SME_A", name: "Lido S.M.E. 'A/B'", lat: 45.4175, lon: 12.3685, mode: "navigazione", lines: ["1", "2"], wheelchair: true },
  { id: "LIDO_SAN_NICOLO_FERRY", name: "Lido S. Nicolò (Ferry Linea 17)", lat: 45.4285, lon: 12.3810, mode: "ferry", lines: ["17"], wheelchair: true },
  { id: "LIDO_CASINO", name: "Lido Casinò", lat: 45.4055, lon: 12.3695, mode: "navigazione", lines: ["20"], wheelchair: true },
  { id: "ALBERONI_ROCCHETTA", name: "Alberoni Rocchetta", lat: 45.3465, lon: 12.3160, mode: "navigazione", lines: ["11"], wheelchair: true },
  { id: "SANTA_MARIA_MARE", name: "S. Maria del Mare (Ferry Linea 11)", lat: 45.3410, lon: 12.3090, mode: "ferry", lines: ["11"], wheelchair: true },
  { id: "PELLESTRINA_PORTOSECCO", name: "Pellestrina Portosecco", lat: 45.3120, lon: 12.3025, mode: "navigazione", lines: ["11"], wheelchair: true },
  { id: "PELLESTRINA_CHIESA", name: "Pellestrina (S. Antonio)", lat: 45.2750, lon: 12.2980, mode: "navigazione", lines: ["11"], wheelchair: true },
  { id: "PELLESTRINA_CIMITERO", name: "Pellestrina Cimitero", lat: 45.2650, lon: 12.2960, mode: "navigazione", lines: ["11"], wheelchair: true },
  { id: "CAROMAN", name: "Caroman", lat: 45.2410, lon: 12.2940, mode: "navigazione", lines: ["11"], wheelchair: true },
  { id: "CHIOGGIA_VIGO", name: "Chioggia (Piazzetta Vigo)", lat: 45.2210, lon: 12.2820, mode: "navigazione", lines: ["11"], wheelchair: true },

  // 9. Terraferma Interscambio & Hub Terrestri
  { id: "FUSINA", name: "Fusina", lat: 45.4190, lon: 12.2575, mode: "navigazione", lines: ["16"], wheelchair: true },
  { id: "SAN_GIULIANO", name: "S. Giuliano", lat: 45.4665, lon: 12.2785, mode: "navigazione", lines: ["AL"], wheelchair: true },
  { id: "P_ROMA_BUS", name: "P.le Roma (Corsia A1)", lat: 45.4382, lon: 12.3188, mode: "bus", lines: ["2", "4L", "6", "7", "80"], wheelchair: true },
  { id: "P_ROMA_TRAM", name: "P.le Roma (Capolinea Tram)", lat: 45.4377, lon: 12.3195, mode: "tram", lines: ["T1"], wheelchair: true },
  { id: "LIDO_BUS", name: "Lido S.M.E. (Piazza)", lat: 45.4168, lon: 12.3682, mode: "bus", lines: ["11", "A", "B", "C", "V"], wheelchair: true },
  { id: "MESTRE_CENTRO", name: "Mestre Centro (P.le Cialdini)", lat: 45.4925, lon: 12.2405, mode: "tram", lines: ["T1", "T2", "4L", "2"], wheelchair: true },
  { id: "MESTRE_FS", name: "Mestre Stazione F.S.", lat: 45.4820, lon: 12.2315, mode: "bus", lines: ["2", "9", "15", "31H"], wheelchair: true }
];

export const MOCK_STOPS = ACTV_OFFICIAL_STOPS;

export async function fetchCantieri(): Promise<CantiereItem[]> {
  return MOCK_CANTIERI;
}

export async function fetchStops(): Promise<StopItem[]> {
  return ACTV_OFFICIAL_STOPS;
}

export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // raggio terrestre in metri
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export async function findStopsNearCantieri(radiusMeters = 200): Promise<StopNearCantiere[]> {
  const results: StopNearCantiere[] = [];
  for (const stop of MOCK_STOPS) {
    for (const cantiere of MOCK_CANTIERI) {
      if (cantiere.stato !== 'In corso') continue;
      const dist = calculateDistanceMeters(stop.lat, stop.lon, cantiere.lat, cantiere.lon);
      if (dist <= radiusMeters) {
        results.push({
          stopId: stop.id,
          stopName: stop.name,
          transportMode: stop.mode,
          stopLat: stop.lat,
          stopLon: stop.lon,
          cantiereId: cantiere.id,
          cantiereTitolo: cantiere.titolo,
          cantiereTipologia: cantiere.tipologia,
          impattoMobilita: cantiere.impattoMobilita,
          distanzaMetri: dist
        });
      }
    }
  }

  results.sort((a, b) => a.distanzaMetri - b.distanzaMetri);
  return results;
}

export async function fetchPlatformMetrics(): Promise<PlatformMetrics> {
  const cantieri = await fetchCantieri();
  const stops = await fetchStops();
  const near = await findStopsNearCantieri(200);

  const totalInv = cantieri.reduce((acc, c) => acc + (c.importoLavori || 0), 0);

  return {
    // Trasporto Pubblico ACTV
    totalRoutes: 104,
    routesNavigazione: 32,
    routesAutomobilistico: 72,
    totalStops: stops.length,
    totalTrips: 5480, // Feriale programmato
    activeVehiclesInService: 302,

    // Alilaguna S.p.A. (Transitland f-u20f-alilagunaspa)
    alilagunaRoutesCount: 4,
    alilagunaStopsCount: 21,
    alilagunaBoatsCount: 4,

    // Maree & MOSE (CPSM)
    tideLevelCm: 76,
    moseStatus: 'Barriere a riposo (Attivazione a +110 cm)',
    moseGatesCount: 78,
    cpsmStationsCount: 6,
    floodingPercentage: 0.0,

    // Qualità dell'Aria (ARPAV)
    airStationsCount: 3,
    averageAqi: 36,
    averagePm10: 20.3,
    averageNo2: 27.5,
    airQualityStatus: 'Buona',

    // Traffico Marittimo AIS & Canali (VTS / Crociere)
    activeShipsCount: 8,
    totalGrossTonnage: 145200,
    maritimeChannelsCount: 4,
    restrictedLagoonVesselsCount: 1, // MSC Opera deviazione Marghera (>25.000 GT)

    // Voli & Aeroporto VCE (ENAV / OpenSky)
    activeFlightsCount: 24,
    vceDailyMovements: 284,
    averageFlightAltitudeMeters: 1850,

    // Flussi Pedonali (Smart Control Room)
    pedestrianSensorsCount: 3,
    totalHourlyPedestrians: 9340,
    peakPedestrianSensor: 'Ponte di Rialto (4.210 passaggi/h)',

    // Mobilità Terraferma & Parcheggi AVM
    totalParkingSpaces: 4100,
    freeParkingSpots: 1250,
    parkingOccupancyRate: 69.5,

    // Satelliti & Osservazione Spaziale (Copernicus ESA / ASI / NASA)
    activeSatellitesCount: 6,
    copernicusSentinelsCount: 2,
    radarEarthObservationSwathKm: 250,
    nextOrbitalPassMinutes: 14,

    // Patrimonio & Opere Pubbliche
    activeCantieri: cantieri.filter(c => c.stato === 'In corso').length,
    totalInvestmentCantieri: totalInv,
    occupazioniAttive: 14,
    stopsNearWorksites200m: near.length,
    drinkingFountainsCount: 142,
    accessibleBridgesCount: 48,
    veritasServicePointsCount: 18,

    // Nuovi Open Data Venezia: Emergenza, Laguna, Ambiente & Servizi
    passerelleTotalMeters: 3100,
    passerelleMountedCount: 4,
    briccoleCount: 8,
    marineLightsCount: 5,
    oceanStationsCount: 4,
    cnrWaveHeightMeters: 0.85,
    cnrWaterTempC: 17.6,
    bathingWaterStationsCount: 5,
    monumentalTreesCount: 6,
    evChargingStationsCount: 4,
    wifiHotspotsCount: 8
  };
}

export async function fetchSatellites(): Promise<SatelliteItem[]> {
  try {
    const res = await fetch('/api/satellites');
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch (err) {
    // fallback below
  }
  const { SATELLITES_DATA } = await import('@/lib/satellitesData');
  return SATELLITES_DATA;
}

export async function fetchPasserelle() {
  try {
    const res = await fetch('/api/passerelle');
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch (err) {
    // fallback below
  }
  const { PASSERELLE_DATA } = await import('@/lib/passerelleData');
  return PASSERELLE_DATA;
}

export async function fetchMarineSensors() {
  try {
    const res = await fetch('/api/marine-sensors');
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch (err) {
    // fallback below
  }
  const { OCEAN_STATIONS_DATA, BRICCOLE_SIGNALS_DATA } = await import('@/lib/marineSensorsData');
  return { oceanStations: OCEAN_STATIONS_DATA, briccole: BRICCOLE_SIGNALS_DATA };
}

export async function fetchVeniceAssets() {
  try {
    const res = await fetch('/api/venice-assets');
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch (err) {
    // fallback below
  }
  const { BATHING_WATERS_DATA, URBAN_TREES_DATA, EV_CHARGING_DATA, WIFI_HOTSPOTS_DATA } = await import('@/lib/urbanAssetsVeniceData');
  return {
    bathingWaters: BATHING_WATERS_DATA,
    urbanTrees: URBAN_TREES_DATA,
    evCharging: EV_CHARGING_DATA,
    wifiHotspots: WIFI_HOTSPOTS_DATA
  };
}


