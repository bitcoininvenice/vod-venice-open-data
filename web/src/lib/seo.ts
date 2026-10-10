/**
 * Metadati per i motori di ricerca e le anteprime social: titolo, descrizione e indirizzo canonico
 * di ogni pagina. Le pagine sono componenti client, quindi i metadati stanno nei layout delle rotte.
 */
import type { Metadata } from 'next';
import { SITE_URL } from './site';

export const SITE_NAME = 'VOD – Venice Open Data';

export const SITE_DESCRIPTION =
  'Mappa interattiva gratuita di Venezia: vaporetti ACTV in tempo reale con i ritardi, marea e acqua alta, come arrivare a piedi e in vaporetto, numeri civici e decine di livelli di open data, con fonte e licenza di ogni dato.';

/** Metadati di una pagina secondaria: titolo (con il nome del sito dal modello), descrizione, canonico. */
export function pageMetadata({ path, title, description }: { path: string; title: string; description: string }): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} | ${SITE_NAME}`, description, url, siteName: SITE_NAME, locale: 'it_IT', type: 'website' },
    twitter: { card: 'summary_large_image', title: `${title} | ${SITE_NAME}`, description },
  };
}

/** Script JSON-LD (schema.org) da inserire nella pagina. */
export function jsonLd(data: object): { __html: string } {
  // "<" escapato: il contenuto non può chiudere il tag script
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') };
}
