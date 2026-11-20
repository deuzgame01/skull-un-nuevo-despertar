'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  Instagram,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import { useCatalog } from '@/context/CatalogContext';
import { ProductCard } from '@/components/catalog/ProductCard';
import { CategoryRail } from '@/components/catalog/CategoryRail';
import { ProductCarousel } from '@/components/catalog/ProductCarousel';
import { HeroCarousel } from '@/components/catalog/HeroCarousel';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { SortSheet } from '@/components/ui/SortSheet';
import { PRODUCT_SORT_OPTIONS } from '@/lib/sort-options';
import {
  normalizeHomeSections,
  normalizeTrustLayout,
} from '@/lib/home-sections';
import type { HomeSectionId } from '@/types/database.types';
import { buildGeneralWhatsAppUrl } from '@/lib/utils/whatsapp';

type HomeSortOption =
  | 'featured'
  | 'recent'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc';

export default function HomePage() {
  const { activeProducts, activeCategories, settings, loading } = useCatalog();

  // Solo productos publicados y marcados como destacados.
  const featuredProducts = useMemo(
    () => activeProducts.filter((p) => p.isActive && p.isFeatured),
    [activeProducts]
  );

  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<HomeSortOption>('featured');

  const whatsappUrl = buildGeneralWhatsAppUrl(settings.whatsapp);

  const visibleSections = useMemo(
    () =>
      normalizeHomeSections(settings.brand.homeSections).filter(
        (section) => section.visible
      ),
    [settings.brand.homeSections]
  );

  const filteredCatalogProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = activeProducts.filter((p) => {
      if (!p.isActive) return false;
      if (selectedCat !== 'all' && p.categorySlug !== selectedCat) {
        return false;
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        (p.material && p.material.toLowerCase().includes(q)) ||
        (p.shortDescription && p.shortDescription.toLowerCase().includes(q)) ||
        (p.bodyZone || []).some((z) => z.toLowerCase().includes(q))
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
  }, [activeProducts, selectedCat, searchQuery, sortBy]);

  const trustLayout = normalizeTrustLayout(settings.brand.trustLayout);

  const trustItems = [
    {
      icon: ShieldCheck,
      title: 'Titanio certificado',
      description: 'ASTM F-136 · hipoalergénico',
    },
    {
      icon: Truck,
      title: 'Envíos a todo el país',
      description: 'Pedidos protegidos y rastreables',
    },
    {
      icon: Sparkles,
      title: 'Asesoría personalizada',
      description: 'Te ayudamos a elegir calibre y medida',
    },
  ];

  const renderTrustSection = () => (
    <section className="bg-[#F6F3EE] px-4 py-5 sm:px-6 sm:py-6">
      <div
        className={`mx-auto grid max-w-7xl gap-3 sm:gap-4 ${
          trustLayout === 'stacked'
            ? 'grid-cols-1'
            : 'grid-cols-1 sm:grid-cols-3'
        }`}
      >
        {trustItems.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#150E1D] p-4 shadow-sm"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/5 text-[#D9BC8E] ring-1 ring-white/10">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                  {item.title}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-zinc-400">
                  {item.description}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );

  const renderCategoriesSection = () => (
    <div className="bg-[#F6F3EE] text-[#21162C]">
      <CategoryRail
        categories={activeCategories}
        products={activeProducts}
        loading={loading}
      />
    </div>
  );

  const renderFeaturedSection = () =>
    loading || featuredProducts.length > 0 ? (
      <div className="bg-[#F6F3EE] text-[#21162C]">
        <ProductCarousel
          products={featuredProducts}
          eyebrow="Favoritos SKULL"
          title="Piezas que enamoran a primera vista"
          href="/catalogo"
          loading={loading}
        />
      </div>
    ) : null;

  const renderCatalogSection = () => (
    <div className="bg-[#F6F3EE] text-[#21162C]">
      <section
        id="catalogo-general"
        className="mx-auto max-w-7xl scroll-mt-24 space-y-5 px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#9A7B4F]">
              Colección completa
            </span>
            <h2 className="font-display text-2xl text-[#21162C] sm:text-4xl">
              Explora todas las piezas
            </h2>
          </div>
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-1.5 self-start text-xs font-semibold uppercase tracking-[0.14em] text-[#5B2B84] transition-colors hover:text-[#2C1440]"
          >
            Abrir catálogo <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Controles compactos */}
        <div className="space-y-3 rounded-2xl border border-[#E7DFD3] bg-white p-3.5 shadow-[0_6px_20px_rgba(40,25,60,0.05)] sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A8FA8]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busca una pieza, material o zona..."
                aria-label="Buscar producto por nombre"
                className="w-full rounded-xl border border-[#E7DFD3] bg-[#FAF8F5] py-2.5 pl-10 pr-9 text-sm text-[#21162C] placeholder:text-[#9A8FA8] focus:border-[#7C3AED] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8FA8] transition-colors hover:text-[#21162C]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <SortSheet
              value={sortBy}
              options={PRODUCT_SORT_OPTIONS}
              onChange={setSortBy}
              label="Ordenar catálogo"
              className="sm:w-60"
            />
          </div>

          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pt-0.5">
            <button
              type="button"
              onClick={() => setSelectedCat('all')}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                selectedCat === 'all'
                  ? 'bg-[#2C1440] text-white'
                  : 'bg-[#F6F3EE] text-[#4A3B58] hover:bg-[#EDE5DA]'
              }`}
            >
              Todas ({activeProducts.length})
            </button>
            {activeCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(cat.slug)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                  selectedCat === cat.slug
                    ? 'bg-[#2C1440] text-white'
                    : 'bg-[#F6F3EE] text-[#4A3B58] hover:bg-[#EDE5DA]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="aspect-[4/6] animate-pulse rounded-2xl bg-white/70 ring-1 ring-[#E7DFD3]"
              />
            ))}
          </div>
        ) : filteredCatalogProducts.length === 0 ? (
          <div className="space-y-4 rounded-2xl border border-[#E7DFD3] bg-white p-10 text-center shadow-sm">
            <p className="font-display text-xl text-[#21162C]">
              No encontramos piezas con esos filtros
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCat('all');
                setSearchQuery('');
                setSortBy('featured');
              }}
              className="rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] btn-skull-ink"
            >
              Ver todo el catálogo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
            {filteredCatalogProducts.map((product) => (
              <ProductCard key={product.id} product={product} variant="light" />
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const renderContactSection = () => (
    <section id="contacto" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-14 sm:px-6 sm:pt-20">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#150E1D] px-6 py-9 sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#7C3AED]/25 blur-3xl" />

        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#D9BC8E]">
              Atención directa
            </span>
            <h2 className="font-display text-2xl text-white sm:text-4xl">
              ¿Ya encontraste tu pieza?
            </h2>
            <p className="text-sm text-zinc-300">
              Confirma disponibilidad, medidas y envío por WhatsApp.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-zinc-400">
              {settings.brand.locationText && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#D9BC8E]" />
                  {settings.brand.locationText}
                </span>
              )}
              {settings.brand.instagramUrl && (
                <a
                  href={settings.brand.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
                >
                  <Instagram className="h-3.5 w-3.5 text-[#D9BC8E]" />
                  {settings.brand.instagramHandle || 'Instagram'}
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col">
            <Link
              href="/agendar"
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] btn-skull-primary active:scale-[0.98]"
            >
              <Calendar className="h-4 w-4" />
              <span className="text-white">Agendar cita</span>
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:border-white/60"
            >
              <WhatsAppIcon className="h-4 w-4 text-[#D9BC8E]" />
              <span className="text-white">Consultar disponibilidad</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );

  const sectionRenderers: Record<HomeSectionId, () => React.ReactNode> = {
    hero: () => <HeroCarousel />,
    trust: renderTrustSection,
    categories: renderCategoriesSection,
    featured: renderFeaturedSection,
    catalog: renderCatalogSection,
    contact: renderContactSection,
  };

  return (
    <div className="pb-14 sm:pb-20">
      {visibleSections.map((section) => (
        <React.Fragment key={section.id}>
          {sectionRenderers[section.id]()}
        </React.Fragment>
      ))}
    </div>
  );
}
