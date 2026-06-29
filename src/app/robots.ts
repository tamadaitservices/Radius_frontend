import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://radiuyes.com';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/vendor/', '/api/', '/profile', '/reservations'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
