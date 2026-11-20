'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Share2, SlidersHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';
import { useCatalog } from '@/context/CatalogContext';
import { ProductCard } from '@/components/catalog/ProductCard';

type CategorySortOption =
  | 'featured'
  | 'recent'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc';

interface CategoryDetailViewProps {
  slug: string;
}

export function CategoryDetailView({ slug }: CategoryDetailViewProps) {
  const { activeProducts, activeCategories, loading } = useCatalog();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<CategorySortOption>('featured');

  const category = useMemo(
    () => activeCategories.find((c) => c.slug === slug) || null,
    [activeCategories, slug]
  );

  const productsInCategory = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = activeProducts.filter((p) => {
      if (!p.isActive) return false;
      if (p.categorySlug !== slug && p.categoryId !== category?.id) {
        return false;
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.shortDescription && p.shortDescription.toLowerCase().includes(q)) ||
        (p.material && p.material.toLowerCase().includes(q))
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'es');
      if (sortBy === 'recent') return (b.createdAt || 0) - (a.createdAt || 0);
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [activeProducts, slug, category?.id, search, sortBy]);

  const handleShareCategory = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.share && category) {
      try {
        await navigator.share({
          title: `${category.name} | SKULL – Un Nuevo Despertar`,
          text: category.description,
          url,
        });
        return;
      } catch {
        // Fallback a portapapeles
      }
    }
    if (url && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace de colección copiado');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <div className="h-44 rounded-sm bg-[#0E0A14] border border-[#261C31] animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="aspect-[4/6] rounded-sm bg-[#0E0A14] border border-[#261C31] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-display text-3xl text-white">
          Colección no encontrada
        </h1>
        <p className="text-xs text-zinc-300">
          La colección solicitada no existe o no se encuentra publicada.
        </p>
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-sm btn-skull-primary text-xs uppercase tracking-[0.18em] font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-white" />
          <span className="text-white">Volver al Catálogo</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Cabecera Editorial de la Colección */}
      <div className="relative rounded-sm overflow-hidden border border-[#3A2B4C] bg-[#150E1D] p-6 sm:p-10">
        {category.imageUrl && (
          <img
            src={category.imageUrl}
            alt={category.name}
            className="absolute inset-0 w-full h-full object-cover opacity-50 brightness-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070709]/95 via-[#070709]/80 to-[#070709]/35" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-[#C8A97E] hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Catálogo Completo</span>
            </Link>
            <h1 className="font-display text-3xl sm:text-5xl font-medium text-white">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                {category.description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleShareCategory}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-sm btn-skull-primary text-xs uppercase tracking-[0.18em]"
          >
            <Share2 className="w-3.5 h-3.5 text-[#C8A97E]" />
            <span className="text-white">Compartir Colección</span>
          </button>
        </div>
      </div>

      {/* Selector de Colecciones + Buscador + Ordenamiento */}
      <div className="p-4 rounded-sm bg-[#0E0A14] border border-[#261C31] space-y-3.5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Buscar por nombre en ${category.name}...`}
              className="w-full pl-9 pr-9 py-2.5 rounded-sm bg-[#070709] border border-[#3A2B4C] text-xs sm:text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative sm:w-64">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#C8A97E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as CategorySortOption)
              }
              aria-label="Ordenar piezas de la categoría"
              className="w-full pl-9 pr-8 py-2.5 rounded-sm bg-[#070709] border border-[#3A2B4C] text-xs uppercase tracking-wider text-white focus:outline-none focus:border-white"
            >
              <option value="featured">Ordenar: Destacados</option>
              <option value="recent">Ordenar: Más recientes</option>
              <option value="price-asc">Precio: Menor a mayor</option>
              <option value="price-desc">Precio: Mayor a menor</option>
              <option value="name-asc">Nombre: A–Z</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {activeCategories.map((cat, idx) => (
            <Link
              key={cat.id}
              href={`/categoria/${cat.slug}`}
              className={`px-3.5 py-2 rounded-sm text-xs uppercase tracking-[0.16em] font-medium whitespace-nowrap editorial-transition flex items-center gap-2 ${
                cat.slug === slug
                  ? 'btn-skull-primary font-semibold'
                  : 'btn-skull-secondary'
              }`}
            >
              <span className="font-mono text-[10px] text-[#C8A97E]">
                0{idx + 1}
              </span>
              <span className="text-white">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Listado 4:5 */}
      {productsInCategory.length === 0 ? (
        <div className="p-12 rounded-sm bg-[#0E0A14] border border-[#261C31] text-center space-y-4">
          <p className="font-display text-xl text-white">
            No hay piezas publicadas en esta colección con ese criterio
          </p>
          <Link
            href="/catalogo"
            className="inline-block px-6 py-3 rounded-sm btn-skull-primary text-xs uppercase tracking-[0.18em] font-semibold"
          >
            <span className="text-white">Explorar Catálogo General</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {productsInCategory.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

