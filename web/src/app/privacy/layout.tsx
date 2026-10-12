import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  path: '/privacy',
  title: 'Privacy',
  description: 'Come VOD tratta i dati: nessun cookie e nessun account, statistiche d\'uso aggregate senza cookie (Vercel Web Analytics), preferenze salvate solo nel browser.',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
