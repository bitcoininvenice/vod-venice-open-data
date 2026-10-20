import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  path: '/features',
  title: 'Funzionalità',
  description: 'Tutto quello che puoi fare con VOD: come arrivare a piedi e in vaporetto, vaporetti in tempo reale, simulatore di acqua alta, ricerca dei numeri civici, metriche e dati aperti di Venezia.',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
