import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/']
    },
    sitemap: 'https://venice-open-data.vercel.app/sitemap.xml'
  };
}
