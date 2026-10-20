import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /embed/: riquadri da incorporare, già marcati noindex; restano visitabili per seguire i link
      disallow: ['/api/']
    },
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}
