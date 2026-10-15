import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

type Entry = Pick<MetadataRoute.Sitemap[number], 'changeFrequency' | 'priority'>;

const PAGES: Record<string, Entry> = {
  '': { changeFrequency: 'hourly', priority: 1.0 },
  '/features': { changeFrequency: 'weekly', priority: 0.9 },
  '/layers': { changeFrequency: 'weekly', priority: 0.9 },
  '/metrics': { changeFrequency: 'daily', priority: 0.9 },
  '/sources': { changeFrequency: 'daily', priority: 0.5 },
  '/mcp': { changeFrequency: 'monthly', priority: 0.6 },
  '/privacy': { changeFrequency: 'yearly', priority: 0.2 },
};

// lastModified omesso: i contenuti cambiano con i dati live, una data "adesso" a ogni build non dà informazione.
export default function sitemap(): MetadataRoute.Sitemap {
  return Object.entries(PAGES).map(([path, entry]) => ({ url: `${SITE_URL}${path}`, ...entry }));
}
