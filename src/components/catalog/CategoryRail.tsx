'use client';

import React, { useMemo } from 'react';
import type { Category, Product } from '@/types/database.types';
import { formatPrice } from '@/lib/utils/formatters';
import {
  HeroSection,
  type FeatureCarouselImage,
} from '@/components/ui/feature-carousel';

/** Etiquetas cortas: la tarjeta debe leerse de un vistazo, sin párrafos. */
const ZONE_LABELS: Record<string, string> = {
  'septum-daith': 'Nariz & Daith',
  'helix-conch-tragus': 'Oreja',
  'nostril-labios': 'Nariz & Labios',
  'microdermal-industrial': 'Rostro & Barras',
  'cuidado-cicatrizacion': 'Cuidado',
};

interface CategoryRailProps {
  categories: Category[];
  products: Product[];
  loading?: boolean;
}

/**
 * "Explora por zona" usa el mismo carrusel infinito con el elemento activo
 * centrado y los adyacentes en profundidad suave que las piezas destacadas.
 */
export function CategoryRail({
  categories,
  products,
  loading = false,
}: CategoryRailProps) {
  const images = useMemo<FeatureCarouselImage[]>(
    () =>
      categories.map((cat) => {
        const inCategory = products.filter(
          (p) => p.categoryId === cat.id || p.categorySlug === cat.slug
        );
        const priced = inCategory.filter(
          (p) => Number(p.price) > 0
        );
        const fromProduct = priced.reduce<Product | null>(
          (cheapest, product) =>
            cheapest === null || product.price < cheapest.price
              ? product
              : cheapest,
          null
        );
        const src =
          cat.imageUrl ||
          fromProduct?.thumbnailUrl ||
          fromProduct?.images?.find((image) => image?.url)?.url ||
          '/images/logo-skull.png';

        return {
          src,
          alt: cat.name,
          href: `/categoria/${cat.slug}`,
          card: (
            <article className="relative h-full w-full overflow-hidden rounded-3xl border-2 border-[#DCCFC0] bg-[#EDE7DE] shadow-[0_25px_50px_rgba(44,20,64,0.18)]">
              {cat.imageUrl ? (
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-5 text-center font-display text-xl text-[#6B5A7A]">
                  {cat.name}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#140C1D]/90 via-[#140C1D]/15 to-transparent" />

              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5B2B84] backdrop-blur-sm">
                {ZONE_LABELS[cat.slug] || 'Colección'}
              </span>

              <div className="absolute inset-x-0 bottom-0 space-y-1.5 p-4 sm:p-5">
                <h3 className="font-display text-lg leading-tight text-white sm:text-xl">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-white/75">
                  {inCategory.length}{' '}
                  {inCategory.length === 1 ? 'pieza' : 'piezas'}
                </p>
                {fromProduct && (
                  <p className="font-mono text-xs font-semibold text-[#D9BC8E]">
                    Desde {formatPrice(fromProduct.price, fromProduct.currency || 'COP')}
                  </p>
                )}
              </div>
            </article>
          ),
        };
      }),
    [categories, products]
  );

  if (loading || images.length === 0) {
    return (
      <section className="w-full px-4 py-12 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-7xl space-y-3">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.26em] text-[#9A7B4F]">
            Explora por zona
          </span>
          <h2 className="font-display text-2xl text-[#21162C] sm:text-4xl">
            Encuentra tu pieza ideal
          </h2>
          <div className="mx-auto aspect-[4/5] w-[210px] animate-pulse rounded-3xl bg-white/70 ring-1 ring-[#E7DFD3] sm:w-[240px] md:w-[280px] lg:w-[300px]" />
        </div>
      </section>
    );
  }

  return (
    <HeroSection
      eyebrow="Explora por zona"
      title="Encuentra tu pieza ideal"
      subtitle="Elige la zona que quieres perforar y descubre la joyería compatible con tu anatomía."
      images={images}
      viewAllHref="/catalogo"
      viewAllLabel="Ver todo"
    />
  );
}
