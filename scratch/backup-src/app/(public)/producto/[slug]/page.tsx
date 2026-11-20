import React from 'react';
import type { Metadata } from 'next';
import { getActiveProducts } from '@/lib/firebase/products.service';
import { buildProductOpenGraphMetadata } from '@/lib/utils/share';
import { ProductDetailView } from '@/components/catalog/ProductDetailView';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const activeProducts = await getActiveProducts().catch(() => []);
  const product = activeProducts.find((p) => p.slug === slug) || null;

  return buildProductOpenGraphMetadata(product, slug);
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const initialProducts = await getActiveProducts().catch(() => []);

  return <ProductDetailView slug={slug} initialProducts={initialProducts} />;
}
