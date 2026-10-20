import type { Metadata } from 'next';
import { TideEmbed } from '@/components/guides/TideEmbed';

// Riquadro da incorporare: non va nei risultati di ricerca (la pagina completa sì)
export const metadata: Metadata = { title: 'Marea a Venezia – riquadro', robots: { index: false, follow: true }, alternates: { canonical: '/marea-venezia' } };
export const revalidate = 60;

export default function Page() {
  return <TideEmbed lang="it" />;
}
