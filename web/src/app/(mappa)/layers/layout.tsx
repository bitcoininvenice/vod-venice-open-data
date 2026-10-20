import type { Metadata } from 'next';
import { pageMetadata, jsonLd, SITE_NAME } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';
import { LAYER_CATALOG } from '@/lib/layerCatalog';

export const metadata: Metadata = pageMetadata({
  path: '/layers',
  title: 'Catalogo dei livelli e dei dati aperti',
  description: 'Tutti i livelli della mappa di Venezia con fonte, licenza e natura del dato: trasporti ACTV, marea e laguna, ambiente, servizi e patrimonio, da Comune, ACTV, ARPAV, ISTAT e OpenStreetMap.',
});

/** Catalogo dei dataset in schema.org (DataCatalog / Dataset): leggibile da Google Dataset Search. */
const catalog = {
  '@context': 'https://schema.org',
  '@type': 'DataCatalog',
  name: `${SITE_NAME} – catalogo dei livelli`,
  url: `${SITE_URL}/layers`,
  inLanguage: 'it',
  dataset: LAYER_CATALOG.filter((l) => l.regime !== 'curated').map((l) => ({
    '@type': 'Dataset',
    name: l.nameIt,
    description: `${l.descriptionIt} ${l.technicalNotesIt}`.slice(0, 4900),
    url: `${SITE_URL}/layers#${l.id}`,
    isAccessibleForFree: true,
    creator: { '@type': 'Organization', name: l.institution, url: l.portalUrl },
    spatialCoverage: { '@type': 'Place', name: 'Venezia e laguna di Venezia' },
  })),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(catalog)} />
      {children}
    </>
  );
}
