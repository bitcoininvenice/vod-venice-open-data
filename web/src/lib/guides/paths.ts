/**
 * Indirizzi delle guide in italiano e in inglese: ogni pagina ha la sua gemella nell'altra lingua (hreflang).
 * Le pagine della mappa e del catalogo hanno un solo indirizzo, con la lingua scelta nel browser.
 */
import { GUIDE_PLACES, type GuideLang } from './places';

export type GuidePageId = 'hub' | 'tide' | 'vaporetti' | 'gettingTo' | 'faq' | 'glossary';

export const GUIDE_PATHS: Record<GuidePageId, Record<GuideLang, string>> = {
  hub: { it: '/guide', en: '/en/guides' },
  tide: { it: '/marea-venezia', en: '/en/venice-tide' },
  vaporetti: { it: '/vaporetti-tempo-reale', en: '/en/vaporetto-live' },
  gettingTo: { it: '/come-arrivare', en: '/en/getting-to' },
  faq: { it: '/faq', en: '/en/faq' },
  glossary: { it: '/glossario', en: '/en/glossary' },
};

export function placePath(lang: GuideLang, slug: string): string {
  return `${GUIDE_PATHS.gettingTo[lang]}/${slug}`;
}

/** Coppie di indirizzi gemelli { it, en }: pagine fisse e una per luogo */
export function allGuidePairs(): Record<GuideLang, string>[] {
  return [
    ...Object.values(GUIDE_PATHS),
    ...GUIDE_PLACES.map((p) => ({ it: placePath('it', p.slug.it), en: placePath('en', p.slug.en) })),
  ];
}

/** Indirizzi alternativi per i metadati (hreflang): italiano predefinito per chi non è né it né en */
export function languageAlternates(pair: Record<GuideLang, string>): Record<string, string> {
  return { it: pair.it, en: pair.en, 'x-default': pair.it };
}
