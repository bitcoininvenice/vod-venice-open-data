/**
 * Orologio della simulazione (secondi dalla mezzanotte, ora di Venezia).
 *
 * Vive fuori dallo stato React: il ticker della pagina lo avanza a ogni frame e il motore
 * della mappa lo legge a ogni frame, mentre lo stato React viene aggiornato solo poche volte
 * al secondo per orologio, timeline e conteggi. Così la pagina non si ri-renderizza a 60 fps.
 */
let seconds = 0;

export const simClock = {
  get: (): number => seconds,
  set: (value: number): void => {
    seconds = ((value % 86400) + 86400) % 86400;
  },
};
