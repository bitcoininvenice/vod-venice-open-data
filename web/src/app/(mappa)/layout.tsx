import { LanguageProvider } from '@/lib/i18n';

/**
 * Pagine della mappa e del catalogo: interfaccia client con la lingua scelta nel browser. Il dizionario delle
 * traduzioni (it + en) si scarica solo qui; le guide (/guide, /marea-venezia, /en/…) sono già tradotte lato server.
 */
export default function MapLayout({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
