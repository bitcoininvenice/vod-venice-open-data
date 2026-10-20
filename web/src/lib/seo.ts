/**
 * Metadati per i motori di ricerca e le anteprime social: titolo, descrizione e indirizzo canonico
 * di ogni pagina. Le pagine sono componenti client, quindi i metadati stanno nei layout delle rotte.
 */
import type { Metadata } from 'next';
import { SITE_URL } from './site';

export const SITE_NAME = 'VOD – Venice Open Data';

export const SITE_DESCRIPTION =
  'Mappa interattiva gratuita di Venezia: vaporetti ACTV in tempo reale con i ritardi, marea e acqua alta, come arrivare a piedi e in vaporetto, numeri civici e decine di livelli di open data, con fonte e licenza di ogni dato.';

/**
 * Anteprima social generata da app/opengraph-image.tsx. Va dichiarata a mano: l'immagine di file non passa alle
 * pagine dei route group né a quelle che ridefiniscono openGraph.
 */
const OG_IMAGE = { url: '/opengraph-image', width: 1200, height: 630, alt: `${SITE_NAME}: mappa di Venezia con vaporetti in tempo reale, marea e open data` };

/**
 * Metadati di una pagina secondaria: titolo (con il nome del sito dal modello), descrizione, canonico.
 * Per le guide bilingui: `lang` e `languages` (indirizzi gemelli per hreflang).
 */
export function pageMetadata({
  path,
  title,
  description,
  lang = 'it',
  languages,
  type = 'website',
}: {
  path: string;
  title: string;
  description: string;
  lang?: 'it' | 'en';
  languages?: Record<string, string>;
  type?: 'website' | 'article';
}): Metadata {
  const url = `${SITE_URL}${path}`;
  const locale = lang === 'en' ? 'en_GB' : 'it_IT';
  return {
    title,
    description,
    alternates: { canonical: path, ...(languages ? { languages } : {}) },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      locale,
      ...(languages ? { alternateLocale: lang === 'en' ? ['it_IT'] : ['en_GB'] } : {}),
      type,
      images: [OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title: `${title} | ${SITE_NAME}`, description, images: [OG_IMAGE.url] },
  };
}

/** Percorso di navigazione (schema.org BreadcrumbList) da coppie nome/percorso */
export function breadcrumbJsonLd(items: { name: string; path: string }[]): object {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: `${SITE_URL}${it.path}` })),
  };
}

/** Script JSON-LD (schema.org) da inserire nella pagina. */
export function jsonLd(data: object): { __html: string } {
  // "<" escapato: il contenuto non può chiudere il tag script
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') };
}
