import { MetadataRoute } from 'next';

// lastModified omesso: i contenuti cambiano con i dati live, una data "adesso" a ogni build non dà informazione.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://venice-open-data.vercel.app',
      changeFrequency: 'hourly',
      priority: 1.0
    },
    {
      url: 'https://venice-open-data.vercel.app/layers',
      changeFrequency: 'weekly',
      priority: 0.9
    },
    {
      url: 'https://venice-open-data.vercel.app/metrics',
      changeFrequency: 'daily',
      priority: 0.9
    },
    {
      url: 'https://venice-open-data.vercel.app/sources',
      changeFrequency: 'daily',
      priority: 0.5
    }
  ];
}
