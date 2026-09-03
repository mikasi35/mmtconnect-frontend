import type { MetadataRoute } from 'next';
import { API_BASE } from '@/lib/api';

const SITE_URL = 'https://app.mmtcare.com.au';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const static_pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/find`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${SITE_URL}/find/search`,  lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${SITE_URL}/find/submit`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/find/track`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  try {
    const res = await fetch(`${API_BASE}/public/facilities?limit=100`, { next: { revalidate: 3600 } });
    if (!res.ok) return static_pages;
    const { data: facilities } = await res.json();

    const facility_pages: MetadataRoute.Sitemap = (facilities ?? []).map((f: any) => ({
      url:              `${SITE_URL}/find/facilities/${f.id}`,
      lastModified:     new Date(f.updated_at ?? new Date()),
      changeFrequency:  'daily' as const,
      priority:         f.available_beds > 0 ? 0.85 : 0.6,
    }));

    return [...static_pages, ...facility_pages];
  } catch {
    return static_pages;
  }
}
