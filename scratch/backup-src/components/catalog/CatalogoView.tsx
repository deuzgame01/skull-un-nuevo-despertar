'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useCatalog } from '@/context/CatalogContext';
import { ProductCard } from '@/components/catalog/ProductCard';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { buildGeneralWhatsAppUrl } from '@/lib/utils/whatsapp';

const BODY_ZONES = [
  'Septum',
  'Daith',
  'Helix',
  'Conch',
  'Tragus',
  'Nostril',
  'Medusa / Philtrum',
  'Labret',
  'Microdermal',
];

type CatalogSortOption =
  | 'featured'
  | 'recent'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc';

function CatalogoContent() {
  const { activeProducts, activeCategories, settings, loading } = useCatalog();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('categoria') || 'all';

  const [queryText, setQueryText] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] =
    useState<string>(initialCategory);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<CatalogSortOption>('featured');

  const filteredProducts = useMemo(() => {
    const q = queryText.trim().toLowerCase();

    const list = activeProducts.filter((product) => {
      if (!product.isActive) return false;
      if (
        selectedCategory !== 'all' &&
        product.categorySlug !== selectedCategory
      ) {
        return false;
      }
      if (
        selectedZone !== 'all' &&
        !(product.bodyZone || []).some(
          (z) => z.toLowerCase() === selectedZone.toLowerCase()
        )
      ) {
        return false;
      }
      if (onlyAvailable && product.stockStatus === 'out_of_stock') {
        return false;
      }
      if (!q) return true;

      return (
        product.name.toLowerCase().includes(q) ||
        (product.shortDescription &&
          product.shortDescription.toLowerCase().includes(q)) ||
        product.categoryName.toLowerCase().includes(q) ||
        (product.material && product.material.toLowerCase().includes(q)) ||
        (product.bodyZone || []).some((z) => z.toLowerCase().includes(q)) ||
        product.searchKeywords?.some((k) => k.includes(q))
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
  }, [
    activeProducts,
    queryText,
    selectedCategory,
    selectedZone,
    onlyAvailable,
    sortBy,
  ]);

  const clearFilters = () => {
    setQueryText('');
    setSelectedCategory('all');
    setSelectedZone('all');
    setOnlyAvailable(false);
    setSortBy('featured');
  };

  const whatsappUrl = buildGeneralWhatsAppUrl(settings.whatsapp);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      {/* Cabecera Editorial */}
      <div className="border-b border-[#261C31] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#C8A97E]">
            Colección Oficial • SKULL
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-medium text-white">
            Catálogo de Joyería Corporal
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300">
            Busca por nombre, filtra por categoría o zona anatómica y ordena por precio.
          </p>
        </div>

        {!loading && (
          <span className="font-mono text-xs text-white">
            [{filteredProducts.length} piezas publicadas]
          </span>
        )}
      </div>

      {/* Panel de Búsqueda, Filtros por Categoría y Ordenamiento */}
      <div className="p-4 sm:p-5 rounded-sm bg-[#0E0A14] border border-[#261C31] space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Buscar por nombre de la pieza, titanio, ópalo, septum..."
              aria-label="Buscar por nombre"
              className="w-full pl-10 pr-9 py-2.5 rounded-sm bg-[#070709] border border-[#3A2B4C] text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-white"
            />
            {queryText && (
              <button
                type="button"
                onClick={() => setQueryText('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:flex-initial">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#C8A97E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as CatalogSortOption)
                }
                aria-label="Ordenar productos"
                className="w-full pl-9 pr-8 py-2.5 rounded-sm bg-[#070709] border border-[#3A2B4C] text-xs uppercase tracking-wider text-white focus:outline-none focus:border-white"
              >
                <option value="featured">Ordenar: Destacados</option>
                <option value="recent">Ordenar: Más recientes</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
                <option value="name-asc">Nombre: A–Z</option>
              </select>
            </div>

            <label className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-sm bg-[#070709] border border-[#3A2B4C] text-xs uppercase tracking-wider text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="accent-purple-500"
              />
              <span>En Stock</span>
            </label>
          </div>
        </div>

        {/* Píldoras Táctiles de Categorías */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-sm text-xs uppercase tracking-[0.16em] font-medium whitespace-nowrap editorial-transition ${
              selectedCategory === 'all'
                ? 'btn-skull-primary font-semibold'
                : 'btn-skull-secondary'
            }`}
          >
            <span className="text-white">Todas las Categorías</span>
          </button>
          {activeCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-3.5 py-1.5 rounded-sm text-xs uppercase tracking-[0.16em] font-medium whitespace-nowrap editorial-transition ${
                selectedCategory === cat.slug
                  ? 'btn-skull-primary font-semibold'
                  : 'btn-skull-secondary'
              }`}
            >
              <span className="text-white">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Filtro por Zona Corporal */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-[#261C31] pt-3">
          <span className="text-[11px] uppercase tracking-[0.18em] text-[#C8A97E] mr-2">
            Anatomía:
          </span>
          <button
            type="button"
            onClick={() => setSelectedZone('all')}
            className={`px-2.5 py-1 rounded-sm text-[11px] uppercase tracking-wider whitespace-nowrap editorial-transition ${
              selectedZone === 'all'
                ? 'btn-skull-primary font-semibold'
                : 'bg-[#070709] border border-[#261C31] text-zinc-200 hover:text-white'
            }`}
          >
            <span className="text-white">Todas</span>
          </button>
          {BODY_ZONES.map((zone) => (
            <button
              key={zone}
              type="button"
              onClick={() => setSelectedZone(zone)}
              className={`px-2.5 py-1 rounded-sm text-[11px] uppercase tracking-wider whitespace-nowrap editorial-transition ${
                selectedZone === zone
                  ? 'btn-skull-primary font-semibold'
                  : 'bg-[#070709] border border-[#261C31] text-zinc-200 hover:text-white'
              }`}
            >
              <span className="text-white">{zone}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Limpiar Filtros */}
      {(queryText ||
        selectedCategory !== 'all' ||
        selectedZone !== 'all' ||
        onlyAvailable) && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs uppercase tracking-[0.18em] text-[#C8A97E] hover:text-white"
          >
            Restablecer filtros ×
          </button>
        </div>
      )}

      {/* Estado de Carga, Vacío o Grilla 4:5 */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="aspect-[4/6] rounded-sm bg-[#0E0A14] border border-[#261C31] animate-pulse"
            />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 rounded-sm bg-[#0E0A14] border border-[#261C31] text-center space-y-4">
          <p className="font-display text-2xl text-white">
            Ninguna pieza coincide con tu búsqueda actual
          </p>
          <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
            Puedes restablecer los filtros activos o consultar directamente por WhatsApp para asesoría personalizada.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={clearFilters}
              className="px-6 py-3 rounded-sm btn-skull-primary text-xs uppercase tracking-[0.18em] font-semibold"
            >
              <span className="text-white">Restablecer Filtros</span>
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-sm btn-skull-secondary inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em]"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span className="text-white">Consultar en WhatsApp</span>
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CatalogoView() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center font-mono text-xs uppercase tracking-widest text-white">
          Cargando Catálogo SKULL...
        </div>
      }
    >
      <CatalogoContent />
    </Suspense>
  );
}

