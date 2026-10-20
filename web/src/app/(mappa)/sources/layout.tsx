import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  path: '/sources',
  title: 'Stato delle fonti dati',
  description: 'Le fonti di VOD in tempo reale: ente, licenza, frequenza di aggiornamento e stato di ogni dataset su Venezia (Comune, ACTV, ARPAV, ISTAT, OpenStreetMap…).',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
