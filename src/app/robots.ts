import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/find', '/find/'],
        disallow: ['/dashboard/', '/login', '/api/'],
      },
    ],
    sitemap: 'https://app.mmtcare.com.au/sitemap.xml',
    host: 'https://app.mmtcare.com.au',
  };
}
