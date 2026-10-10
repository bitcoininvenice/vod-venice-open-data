import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  path: '/metrics',
  title: 'Metriche e residenti per sestiere',
  description: 'Indicatori su Venezia calcolati da dati aperti: residenti per sestiere e isola (censimento ISTAT 2021), abitazioni vuote, previsione della marea, accessibilità ai defibrillatori, opere pubbliche.',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
