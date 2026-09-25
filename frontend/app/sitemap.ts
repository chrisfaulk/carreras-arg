import type { MetadataRoute } from "next";

export const revalidate = 86400;

const LIMIT = 1000;

interface Page<T> {
  data: T[];
}

interface CatalogItem {
  id: string;
  updatedAt?: string;
}

async function get<T>(path: string): Promise<T[]> {
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const res = await fetch(`${api}/api${path}`, { next: { revalidate } });

  if (!res.ok) return [];

  const body = (await res.json()) as Page<T>;

  return body.data ?? [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://carreras-arg.ar";
  const now = new Date();

  const statics: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/universities`, lastModified: now },
    { url: `${base}/legal/privacy`, lastModified: now },
    { url: `${base}/legal/terms`, lastModified: now },
    { url: `${base}/legal/cookies`, lastModified: now },
  ];

  try {
    const universities = await get<CatalogItem>(`/universities?page=1&limit=50`);

    const careers = (
      await Promise.all(universities.map((u) => get<CatalogItem>(`/careers?universityId=${u.id}&page=1&limit=50`)))
    ).flat();

    const plans = (
      await Promise.all(careers.map((c) => get<CatalogItem>(`/study-plans?careerId=${c.id}&page=1&limit=50`)))
    ).flat();

    // ponytail: first page per parent, cap 1000. Full crawl if catalog grows.
    const dynamics: MetadataRoute.Sitemap = [
      ...universities.map((u) => ({
        url: `${base}/universities/${u.id}`,
        lastModified: u.updatedAt ? new Date(u.updatedAt) : now,
      })),
      ...careers.map((c) => ({
        url: `${base}/careers/${c.id}`,
        lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
      })),
      ...plans.map((p) => ({
        url: `${base}/plans/${p.id}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      })),
    ].slice(0, LIMIT);

    return [...statics, ...dynamics];
  } catch {
    return statics;
  }
}
