import type { MetadataRoute } from 'next';
import { getActiveProducts } from '@/lib/firebase/products.service';
import { getActiveCategories } from '@/lib/firebase/categories.service';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'
  ).replace(/\/+$/, '');

  // Rutas estáticas públicas
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/catalogo`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  try {
    const [categories, products] = await Promise.all([
      getActiveCategories().catch(() => []),
      getActiveProducts().catch(() => []),
    ]);

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
      url: `${baseUrl}/categoria/${encodeURIComponent(cat.slug)}`,
      lastModified: new Date(cat.updatedAt || Date.now()),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const productRoutes: MetadataRoute.Sitemap = products.map((prod) => ({
      url: `${baseUrl}/skull/producto/${encodeURIComponent(prod.slug)}`,
      lastModified: new Date(prod.updatedAt || Date.now()),
      changeFrequency: 'weekly',
      priority: 0.85,
    }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];
  } catch (error) {
    console.warn('[SKULL Sitemap] Fallback a rutas estáticas:', error);
    return staticRoutes;
  }
}

