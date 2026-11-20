'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Category, Product } from '@/types/database.types';

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

export function CategoryRail({
  categories,
  products,
  loading = false,
}: CategoryRailProps) {
  const railRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 1 | -1) => {
    railRef.current?.scrollBy({
      left: direction * 320,
      behavior: 'smooth',
    });
  };

  return (
    <section className="pt-10 sm:pt-14">
      <div className="mx-auto mb-5 flex max-w-7xl items-end justify-between gap-4 px-4 sm:px-6">
        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#9A7B4F]">
            Explora por zona
          </span>
          <h2 className="font-display text-2xl text-[#21162C] sm:text-4xl">
            Encuentra tu pieza ideal
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/catalogo"
            className="hidden items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#5B2B84] transition-colors hover:text-[#2C1440] sm:inline-flex"
          >
            Ver todo <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <div className="hidden gap-1.5 sm:flex">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Categorías anteriores"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E0D7CB] bg-white text-[#21162C] shadow-sm transition-colors hover:border-[#5B2B84] hover:text-[#5B2B84]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Categorías siguientes"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E0D7CB] bg-white text-[#21162C] shadow-sm transition-colors hover:border-[#5B2B84] hover:text-[#5B2B84]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={railRef}
        className="rail-bleed no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:gap-4"
      >
        {loading
          ? [1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="aspect-[4/5] w-[62vw] max-w-[230px] flex-shrink-0 animate-pulse rounded-2xl bg-white/70 ring-1 ring-[#E7DFD3] sm:w-[220px] lg:w-[240px]"
              />
            ))
          : categories.map((cat) => {
              const count = products.filter(
                (p) => p.categoryId === cat.id || p.categorySlug === cat.slug
              ).length;

              return (
                <Link
                  key={cat.id}
                  href={`/categoria/${cat.slug}`}
                  className="group w-[62vw] max-w-[230px] flex-shrink-0 snap-start sm:w-[220px] lg:w-[240px]"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#EDE7DE] shadow-sm ring-1 ring-black/5">
                    {cat.imageUrl ? (
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-4 text-center font-display text-lg text-[#6B5A7A]">
                        {cat.name}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-[#140C1D]/85 via-[#140C1D]/10 to-transparent" />

                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5B2B84] backdrop-blur-sm">
                      {ZONE_LABELS[cat.slug] || 'Colección'}
                    </span>

                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <h3 className="font-display text-lg leading-tight text-white sm:text-xl">
                        {cat.name}
                      </h3>
                      <p className="mt-1 text-[11px] text-white/75">
                        {count} {count === 1 ? 'pieza' : 'piezas'}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
