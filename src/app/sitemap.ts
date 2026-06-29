import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://radiuyes.com';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const static_routes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/search`, lastModified: new Date(), changeFrequency: 'always', priority: 0.9 },
    { url: `${BASE}/login`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/vendor/register`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
  ];

  try {
    const res = await fetch(
      `${API}/api/search?q=shop&lat=16.5062&lng=80.648&radius=50`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return static_routes;
    const data = await res.json();
    const shopUrls: MetadataRoute.Sitemap = (data.results || []).map((shop: any) => ({
      url: `${BASE}/shop/${shop.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));
    return [...static_routes, ...shopUrls];
  } catch {
    return static_routes;
  }
}
