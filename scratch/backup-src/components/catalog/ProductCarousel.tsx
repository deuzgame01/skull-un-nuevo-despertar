'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '@/types/database.types';
import { ProductCard } from '@/components/catalog/ProductCard';

interface ProductCarouselProps {
  products: Product[];
  eyebrow?: string;
  title: string;
  href?: string;
  loading?: boolean;
}

export function ProductCarousel({
  products,
  eyebrow = 'Curaduría SKULL',
  title,
  href = '/catalogo',
  loading = false,
}: ProductCarouselProps) {
  const railRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 1 | -1) => {
    railRef.current?.scrollBy({
      left: direction * 300,
      behavior: 'smooth',
    });
  };

  return (
    <section className="pt-10 sm:pt-14">
      <div className="mx-auto mb-5 flex max-w-7xl items-end justify-between gap-4 px-4 sm:px-6">
        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#9A7B4F]">
            {eyebrow}
          </span>
          <h2 className="font-display text-2xl text-[#21162C] sm:text-4xl">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={href}
            className="hidden items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#5B2B84] transition-colors hover:text-[#2C1440] sm:inline-flex"
          >
            Ver todo <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <div className="hidden gap-1.5 sm:flex">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Productos anteriores"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E0D7CB] bg-white text-[#21162C] shadow-sm transition-colors hover:border-[#5B2B84] hover:text-[#5B2B84]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Productos siguientes"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E0D7CB] bg-white text-[#21162C] shadow-sm transition-colors hover:border-[#5B2B84] hover:text-[#5B2B84]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={railRef}
        className="rail-bleed no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:gap-4"
      >
        {loading
          ? [1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="aspect-[4/6] w-[70vw] max-w-[270px] flex-shrink-0 animate-pulse rounded-2xl bg-white/70 ring-1 ring-[#E7DFD3] sm:w-[250px] lg:w-[270px]"
              />
            ))
          : products.map((product) => (
              <div
                key={product.id}
                className="w-[70vw] max-w-[270px] flex-shrink-0 snap-start sm:w-[250px] lg:w-[270px]"
              >
                <ProductCard product={product} variant="light" />
              </div>
            ))}
      </div>
    </section>
  );
}
