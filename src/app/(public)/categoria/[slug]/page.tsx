import React from 'react';
import type { Metadata } from 'next';
import { getActiveCategories } from '@/lib/firebase/categories.service';
import { CategoryDetailView } from '@/components/catalog/CategoryDetailView';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'
  ).replace(/\/+$/, '');

  const categories = await getActiveCategories().catch(() => []);
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    return {
      title: 'Colección no encontrada | SKULL – Un Nuevo Despertar',
      description: 'Explora el catálogo de joyería corporal de SKULL.',
    };
  }

  const title = `Colección ${category.name} | SKULL – Un Nuevo Despertar`;
  const description =
    category.description ||
    `Joyería corporal anatómica certificada para ${category.name} en SKULL.`;
  const canonicalUrl = `${baseUrl}/categoria/${encodeURIComponent(slug)}`;
  const imageUrl =
    category.imageUrl && !category.imageUrl.startsWith('data:')
      ? category.imageUrl
      : `${baseUrl}/images/logo-skull.png`;

  return {
    title: `Colección ${category.name}`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'SKULL – Un Nuevo Despertar',
      type: 'website',
      locale: 'es_CO',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: category.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CategoryDetailView slug={slug} />;
}
