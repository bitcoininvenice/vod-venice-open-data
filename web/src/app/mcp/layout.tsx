import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  path: '/mcp',
  title: 'Collega la tua AI ai dati di Venezia',
  description: 'Server MCP gratuito e in sola lettura: collega Claude, ChatGPT o un altro assistente ai dataset di VOD su Venezia, con fonte e licenza di ogni dato.',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
