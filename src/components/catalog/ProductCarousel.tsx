'use client';

import React, { useMemo } from 'react';
import type { Product } from '@/types/database.types';
import { formatPrice } from '@/lib/utils/formatters';
import {
  HeroSection,
  type FeatureCarouselImage,
} from '@/components/ui/feature-carousel';

interface ProductCarouselProps {
  products: Product[];
  eyebrow?: string;
  title: string;
  href?: string;
  loading?: boolean;
}

/**
 * Carrusel de piezas destacadas de la portada.
 * El efecto 3D (centro en foco, laterales en profundidad y loop infinito)
 * vive en `HeroSection`, reutilizable desde /components/ui.
 * Cada tarjeta muestra imagen, nombre, precio y descuento cuando aplica.
 */
export function ProductCarousel({
  products,
  eyebrow = 'Curaduría SKULL',
  title,
  href = '/catalogo',
  loading = false,
}: ProductCarouselProps) {
  const images = useMemo<FeatureCarouselImage[]>(
    () =>
      products.map((product) => {
        const src =
          product.thumbnailUrl ||
          product.images?.find((image) => image?.isPrimary && image?.url)?.url ||
          product.images?.find((image) => image?.url)?.url ||
          '/images/logo-skull.png';
        const currency = product.currency || 'COP';
        const compareAt = product.compareAtPrice
          ? Number(product.compareAtPrice)
          : null;
        const hasDiscount =
          compareAt !== null && compareAt > product.price;
        const discountPct = hasDiscount
          ? Math.round((1 - product.price / compareAt!) * 100)
          : 0;

        return {
          src,
          alt: product.name,
          href: `/skull/producto/${product.slug}`,
          card: (
            <article className="relative h-full w-full overflow-hidden rounded-3xl border-2 border-[#DCCFC0] bg-[#EDE7DE] shadow-[0_25px_50px_rgba(44,20,64,0.18)]">
              <img
                src={src}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#140C1D]/90 via-[#140C1D]/20 to-transparent" />

              {hasDiscount && (
                <span className="absolute right-3 top-3 rounded-full bg-[#D9BC8E] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#2C1440]">
                  -{discountPct}%
                </span>
              )}

              {product.stockStatus === 'out_of_stock' ? (
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5B2B84] backdrop-blur-sm">
                  Bajo encargo
                </span>
              ) : product.stockStatus === 'low_stock' ? (
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-800 backdrop-blur-sm">
                  Últimas piezas
                </span>
              ) : product.isFeatured ? (
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5B2B84] backdrop-blur-sm">
                  Destacado
                </span>
              ) : null}

              <div className="absolute inset-x-0 bottom-0 space-y-2 p-4 sm:p-5">
                {product.categoryName && (
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#D9BC8E]">
                    {product.categoryName}
                  </p>
                )}
                <h3 className="line-clamp-2 font-display text-lg leading-tight text-white sm:text-xl">
                  {product.name}
                </h3>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-mono text-base font-semibold text-white sm:text-lg">
                    {formatPrice(product.price, currency)}
                  </span>
                  {hasDiscount && (
                    <span className="font-mono text-[11px] text-white/60 line-through">
                      {formatPrice(compareAt!, currency)}
                    </span>
                  )}
                </div>
              </div>
            </article>
          ),
        };
      }),
    [products]
  );

  if (loading || images.length === 0) {
    return (
      <section className="w-full px-4 py-12 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-7xl space-y-3">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.26em] text-[#9A7B4F]">
            {eyebrow}
          </span>
          <h2 className="font-display text-2xl text-[#21162C] sm:text-4xl">
            {title}
          </h2>
          <div className="mx-auto aspect-[4/5] w-[210px] animate-pulse rounded-3xl bg-white/70 ring-1 ring-[#E7DFD3] sm:w-[240px] md:w-[280px] lg:w-[300px]" />
        </div>
      </section>
    );
  }

  return (
    <HeroSection
      eyebrow={eyebrow}
      title={title}
      subtitle="Piezas seleccionadas en Titanio Grado Implante, curadas para cada anatomía."
      images={images}
      viewAllHref={href}
      viewAllLabel="Ver todo"
    />
  );
}
