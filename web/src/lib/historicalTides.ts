/**
 * Acque alte eccezionali (colmo di almeno +140 cm sullo zero mareografico di Punta della Salute) dal 1936, come
 * elencate dal Centro Previsioni e Segnalazioni Maree del Comune di Venezia nella pagina «Le acque alte
 * eccezionali» (PROVIDERS.cpsm). Ora del colmo come nella tabella; null dove la tabella non la indica.
 * Verificato sulla pagina il 19/10/2026: nessun evento aggiunto o corretto a mano.
 */

export interface HistoricalTideEvent {
  id: string;
  dateIso: string;
  dateIt: string;
  dateEn: string;
  peakCm: number;
  /** ora del colmo (HH:MM), null se la tabella del Comune non la indica */
  timeLocal: string | null;
}

export const HISTORICAL_TIDES_SOURCE_URL = 'https://www.comune.venezia.it/it/content/le-acque-alte-eccezionali';

/** Dal colmo più alto */
export const CPSM_HISTORICAL_EXCEPTIONAL_TIDES: HistoricalTideEvent[] = [
  { id: '1966-11-04', dateIso: '1966-11-04', dateIt: '4 novembre 1966', dateEn: '4 November 1966', peakCm: 194, timeLocal: '18:00' },
  { id: '2019-11-12', dateIso: '2019-11-12', dateIt: '12 novembre 2019', dateEn: '12 November 2019', peakCm: 187, timeLocal: null },
  { id: '1979-12-22', dateIso: '1979-12-22', dateIt: '22 dicembre 1979', dateEn: '22 December 1979', peakCm: 166, timeLocal: '09:10' },
  { id: '1986-02-01', dateIso: '1986-02-01', dateIt: '1 febbraio 1986', dateEn: '1 February 1986', peakCm: 158, timeLocal: '03:55' },
  { id: '2008-12-01', dateIso: '2008-12-01', dateIt: '1 dicembre 2008', dateEn: '1 December 2008', peakCm: 156, timeLocal: '10:45' },
  { id: '2018-10-29', dateIso: '2018-10-29', dateIt: '29 ottobre 2018', dateEn: '29 October 2018', peakCm: 156, timeLocal: '14:40' },
  { id: '1951-11-12', dateIso: '1951-11-12', dateIt: '12 novembre 1951', dateEn: '12 November 1951', peakCm: 151, timeLocal: '08:05' },
  { id: '2012-11-11', dateIso: '2012-11-11', dateIt: '11 novembre 2012', dateEn: '11 November 2012', peakCm: 149, timeLocal: null },
  { id: '1936-04-16', dateIso: '1936-04-16', dateIt: '16 aprile 1936', dateEn: '16 April 1936', peakCm: 147, timeLocal: '21:35' },
  { id: '2002-11-16', dateIso: '2002-11-16', dateIt: '16 novembre 2002', dateEn: '16 November 2002', peakCm: 147, timeLocal: '09:45' },
  { id: '1960-10-15', dateIso: '1960-10-15', dateIt: '15 ottobre 1960', dateEn: '15 October 1960', peakCm: 145, timeLocal: '07:55' },
  { id: '2009-12-25', dateIso: '2009-12-25', dateIt: '25 dicembre 2009', dateEn: '25 December 2009', peakCm: 145, timeLocal: '03:55' },
  { id: '1968-11-03', dateIso: '1968-11-03', dateIt: '3 novembre 1968', dateEn: '3 November 1968', peakCm: 144, timeLocal: '07:30' },
  { id: '2000-11-06', dateIso: '2000-11-06', dateIt: '6 novembre 2000', dateEn: '6 November 2000', peakCm: 144, timeLocal: '20:35' },
  { id: '2009-12-23', dateIso: '2009-12-23', dateIt: '23 dicembre 2009', dateEn: '23 December 2009', peakCm: 144, timeLocal: '05:05' },
  { id: '2010-12-24', dateIso: '2010-12-24', dateIt: '24 dicembre 2010', dateEn: '24 December 2010', peakCm: 144, timeLocal: '01:40' },
  { id: '2012-11-01', dateIso: '2012-11-01', dateIt: '1 novembre 2012', dateEn: '1 November 2012', peakCm: 143, timeLocal: null },
  { id: '2013-02-12', dateIso: '2013-02-12', dateIt: '12 febbraio 2013', dateEn: '12 February 2013', peakCm: 143, timeLocal: '00:10' },
  { id: '1992-12-08', dateIso: '1992-12-08', dateIt: '8 dicembre 1992', dateEn: '8 December 1992', peakCm: 142, timeLocal: '10:10' },
  { id: '1979-02-17', dateIso: '1979-02-17', dateIt: '17 febbraio 1979', dateEn: '17 February 1979', peakCm: 140, timeLocal: '01:15' },
];
