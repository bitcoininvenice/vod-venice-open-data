import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { allGuidePairs, GUIDE_PATHS } from '@/lib/guides/paths';

type Entry = Pick<MetadataRoute.Sitemap[number], 'changeFrequency' | 'priority'>;

const PAGES: Record<string, Entry> = {
  '': { changeFrequency: 'hourly', priority: 1.0 },
  '/features': { changeFrequency: 'weekly', priority: 0.8 },
  '/layers': { changeFrequency: 'weekly', priority: 0.8 },
  '/metrics': { changeFrequency: 'daily', priority: 0.6 },
  '/sources': { changeFrequency: 'daily', priority: 0.5 },
  '/mcp': { changeFrequency: 'monthly', priority: 0.5 },
  '/privacy': { changeFrequency: 'yearly', priority: 0.2 },
};

/** Guide che cambiano con i dati: marea (misura), percorsi (orario del prossimo giorno feriale) */
const GUIDE_ENTRY: Record<string, Entry> = {
  [GUIDE_PATHS.tide.it]: { changeFrequency: 'hourly', priority: 0.9 },
  [GUIDE_PATHS.vaporetti.it]: { changeFrequency: 'weekly', priority: 0.9 },
  [GUIDE_PATHS.hub.it]: { changeFrequency: 'weekly', priority: 0.8 },
  [GUIDE_PATHS.gettingTo.it]: { changeFrequency: 'weekly', priority: 0.8 },
};
const GUIDE_DEFAULT: Entry = { changeFrequency: 'weekly', priority: 0.7 };

const abs = (path: string) => `${SITE_URL}${path}`;

// lastModified omesso: i contenuti cambiano con i dati live, una data "adesso" a ogni build non dà informazione.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = Object.entries(PAGES).map(([path, entry]) => ({ url: abs(path), ...entry }));
  // Ogni guida compare in entrambe le lingue, con le gemelle indicate come alternative (hreflang)
  const guides = allGuidePairs().flatMap((pair) => {
    const languages = { it: abs(pair.it), en: abs(pair.en), 'x-default': abs(pair.it) };
    const entry = GUIDE_ENTRY[pair.it] ?? GUIDE_DEFAULT;
    return [
      { url: abs(pair.it), ...entry, alternates: { languages } },
      { url: abs(pair.en), ...entry, priority: (entry.priority ?? 0.7) - 0.1, alternates: { languages } },
    ];
  });
  return [...pages, ...guides];
}
