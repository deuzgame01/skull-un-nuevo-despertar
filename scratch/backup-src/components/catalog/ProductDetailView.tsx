'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Share2,
  Sparkles,
  X,
  ZoomIn,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/types/database.types';
import { useCatalog } from '@/context/CatalogContext';
import { formatPrice, STOCK_STATUS_MAP } from '@/lib/utils/formatters';
import {
  buildProductAppointmentWhatsAppUrl,
  buildProductWhatsAppUrl,
  isWhatsAppConfigured,
} from '@/lib/utils/whatsapp';
import {
  copyProductLink,
  shareProductOrFallbackCopy,
} from '@/lib/utils/share';
import { ProductCard } from '@/components/catalog/ProductCard';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

interface ProductDetailViewProps {
  slug: string;
  initialProducts?: Product[];
}

export function ProductDetailView({
  slug,
  initialProducts,
}: ProductDetailViewProps) {
  const { activeProducts, activeCategories, settings, loading } = useCatalog();

  const effectiveActiveProducts = useMemo(() => {
    if (activeProducts.length > 0) return activeProducts;
    if (initialProducts && initialProducts.length > 0) {
      return initialProducts.filter((p) => p.isActive);
    }
    return [];
  }, [activeProducts, initialProducts]);

  const isLoadingView = loading && effectiveActiveProducts.length === 0;

  // REGLA: Mostrar exclusivamente productos publicados (isActive === true)
  const product = useMemo(
    () => effectiveActiveProducts.find((p) => p.slug === slug) || null,
    [effectiveActiveProducts, slug]
  );

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reiniciar selección de imagen y medida cuando cambia de producto
  useEffect(() => {
    setSelectedImageIdx(0);
    setSelectedSize('');
    setLightboxOpen(false);
  }, [slug]);

  // Cerrar lightbox con tecla Escape y navegar con flechas
  useEffect(() => {
    if (!lightboxOpen || !product) return;
    const total = Math.max(1, product.images?.length || 1);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') {
        setSelectedImageIdx((prev) => (prev + 1) % total);
      }
      if (e.key === 'ArrowLeft') {
        setSelectedImageIdx((prev) => (prev - 1 + total) % total);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, product]);

  /**
   * PRODUCTOS RECOMENDADOS:
   * Priorizar:
   * 1. Productos de la misma categoría.
   * 2. Productos destacados.
   * 3. Otros productos activos.
   * Nunca mostrar el producto actual como recomendación.
   */
  const recommendedProducts = useMemo(() => {
    if (!product) return [];

    const candidates = effectiveActiveProducts.filter(
      (p) => p.id !== product.id && p.slug !== product.slug && p.isActive
    );

    const sameCategory = candidates.filter(
      (p) =>
        p.categoryId === product.categoryId ||
        p.categorySlug === product.categorySlug
    );
    const featuredOthers = candidates.filter(
      (p) =>
        p.categoryId !== product.categoryId &&
        p.categorySlug !== product.categorySlug &&
        p.isFeatured
    );
    const remainingActive = candidates.filter(
      (p) =>
        p.categoryId !== product.categoryId &&
        p.categorySlug !== product.categorySlug &&
        !p.isFeatured
    );

    return [...sameCategory, ...featuredOthers, ...remainingActive].slice(0, 4);
  }, [product, effectiveActiveProducts]);

  // 1. ESTADO DE CARGA PROPIO
  if (isLoadingView) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        <div className="h-5 w-48 bg-[#150E1D] rounded-sm animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
          <div className="lg:col-span-7 space-y-3">
            <div className="aspect-[4/5] sm:aspect-square rounded-sm bg-[#0E0A14] border border-[#261C31] animate-pulse" />
            <div className="grid grid-cols-4 gap-2.5">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="aspect-square rounded-sm bg-[#0E0A14] border border-[#261C31] animate-pulse"
                />
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 space-y-5">
            <div className="h-4 w-36 bg-[#150E1D] rounded-sm animate-pulse" />
            <div className="h-10 w-4/5 bg-[#150E1D] rounded-sm animate-pulse" />
            <div className="h-8 w-32 bg-[#150E1D] rounded-sm animate-pulse" />
            <div className="h-24 w-full bg-[#0E0A14] border border-[#261C31] rounded-sm animate-pulse" />
            <div className="h-12 w-full bg-[#150E1D] rounded-sm animate-pulse" />
            <div className="h-12 w-full bg-[#0E0A14] rounded-sm animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 2. MANEJO DE PRODUCTO INEXISTENTE O NO PUBLICADO
  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#150E1D] border border-[#3A2B4C] text-[11px] uppercase tracking-[0.22em] text-[#C8A97E]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Archivo SKULL</span>
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <h1 className="font-display text-3xl sm:text-4xl font-medium text-white">
            Pieza no disponible en el catálogo
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            La joya que buscas ya no se encuentra publicada o su enlace ha cambiado. Explora nuestras colecciones activas o regresa al catálogo general.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-sm btn-skull-primary text-xs uppercase tracking-[0.18em] font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white" />
            <span className="text-white">Explorar Catálogo</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-sm btn-skull-secondary text-xs uppercase tracking-[0.18em]"
          >
            <span className="text-white">Ir al Inicio</span>
          </Link>
        </div>

        {activeCategories.length > 0 && (
          <div className="pt-8 border-t border-[#261C31] space-y-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#C8A97E]">
              Colecciones Disponibles
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {activeCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categoria/${cat.slug}`}
                  className="px-3.5 py-2 rounded-sm bg-[#0E0A14] border border-[#3A2B4C] hover:border-white text-xs text-white editorial-transition"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Galería normalizada evitando enlaces vacíos
  const validGallery = (product.images || []).filter(
    (img) => img && typeof img.url === 'string' && img.url.trim().length > 0
  );
  const gallery =
    validGallery.length > 0
      ? validGallery
      : [
          {
            id: 'primary-fallback',
            url: product.thumbnailUrl || '/images/logo-skull.png',
            storagePath: '',
            isPrimary: true,
          },
        ];

  const safeIdx = selectedImageIdx >= gallery.length ? 0 : selectedImageIdx;
  const currentImage = gallery[safeIdx] || gallery[0];
  const statusInfo =
    STOCK_STATUS_MAP[product.stockStatus] || STOCK_STATUS_MAP.in_stock;

  // Filtrar valores incompletos o "N/A"
  const cleanSizes = (product.sizes || []).filter(
    (s) => s && s.trim() !== '' && s.trim().toUpperCase() !== 'N/A'
  );
  const cleanZones = (product.bodyZone || []).filter(
    (z) => z && z.trim() !== '' && z.trim().toUpperCase() !== 'N/A'
  );
  const hasValidGauge =
    Boolean(product.gauge) &&
    product.gauge!.trim() !== '' &&
    product.gauge!.trim().toUpperCase() !== 'N/A';
  const hasValidColor =
    Boolean(product.color) &&
    product.color!.trim() !== '' &&
    product.color!.trim().toUpperCase() !== 'N/A';
  const hasValidMaterial =
    Boolean(product.material) &&
    product.material.trim() !== '' &&
    product.material.trim().toUpperCase() !== 'N/A';

  const activeSize = selectedSize || cleanSizes[0] || '';

  const availabilityWhatsAppUrl = buildProductWhatsAppUrl(
    product,
    settings.whatsapp,
    {
      size: activeSize,
      gauge: hasValidGauge ? product.gauge : undefined,
    }
  );

  const appointmentWhatsAppUrl = buildProductAppointmentWhatsAppUrl(
    product,
    settings.whatsapp,
    {
      size: activeSize,
      gauge: hasValidGauge ? product.gauge : undefined,
    }
  );

  const waReady = isWhatsAppConfigured(settings.whatsapp);

  const handleWhatsAppAction = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetUrl: string
  ) => {
    if (!waReady || !targetUrl) {
      e.preventDefault();
      toast.error(
        'La línea de WhatsApp aún no está configurada. Intenta nuevamente en unos minutos.'
      );
    }
  };

  const handleShareProduct = async () => {
    const res = await shareProductOrFallbackCopy(product);
    if (res.outcome === 'shared') {
      toast.success('Pieza compartida');
    } else if (res.outcome === 'copied') {
      setCopied(true);
      toast.success('Enlace copiado al portapapeles');
      setTimeout(() => setCopied(false), 2500);
    } else if (res.outcome === 'failed') {
      toast.error('No se pudo compartir el enlace');
    }
  };

  const handleCopyProductUrl = async () => {
    const res = await copyProductLink(product);
    if (res.ok) {
      setCopied(true);
      toast.success('Enlace de la pieza copiado al portapapeles');
      setTimeout(() => setCopied(false), 2500);
    } else {
      toast.error('No se pudo copiar el enlace');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-14">
      {/* Barra Superior de Navegación (Miga de Pan) y Compartir */}
      <div className="flex items-center justify-between gap-2 border-b border-[#261C31] pb-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-300 min-w-0">
          <Link
            href="/catalogo"
            className="hover:text-white inline-flex items-center gap-1.5 flex-shrink-0 editorial-transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white" />
            <span className="text-white">Catálogo</span>
          </Link>
          {product.categoryName && (
            <>
              <span className="text-zinc-500">/</span>
              <Link
                href={`/categoria/${product.categorySlug}`}
                className="text-[#C8A97E] hover:text-white truncate editorial-transition"
              >
                {product.categoryName}
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleShareProduct}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm btn-skull-secondary text-xs uppercase tracking-[0.16em] flex-shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-white">Copiado</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-[#C8A97E]" />
              <span className="text-white">Compartir</span>
            </>
          )}
        </button>
      </div>

      {/* DETALLE DE PRODUCTO + GALERÍA FOTOGRÁFICA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Columna Izquierda: Galería Fotográfica (Imagen Principal + Miniaturas + Ampliación) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative aspect-[4/5] sm:aspect-square rounded-sm overflow-hidden bg-[#150E1D] border border-[#261C31] group">
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label={`Ampliar fotografía de ${product.name}`}
              className="w-full h-full block cursor-zoom-in focus:outline-none"
            >
              <img
                src={currentImage.url}
                alt={product.name}
                className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
              />
            </button>

            {/* Contador de Galería + Botón de Ampliación */}
            <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
              <span className="px-2.5 py-1 rounded-sm bg-[#070709]/90 border border-white/25 font-mono text-xs text-white">
                0{safeIdx + 1} / 0{gallery.length}
              </span>

              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#070709]/90 border border-white/30 hover:border-white text-[11px] uppercase tracking-[0.16em] text-white editorial-transition"
              >
                <ZoomIn className="w-3.5 h-3.5 text-[#C8A97E]" />
                <span className="text-white">Ampliar Foto</span>
              </button>
            </div>

            {/* Controles Laterales si hay múltiples fotos */}
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImageIdx(
                      (prev) => (prev - 1 + gallery.length) % gallery.length
                    )
                  }
                  aria-label="Fotografía anterior"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-sm bg-[#070709]/85 border border-white/25 hover:border-white text-white flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImageIdx((prev) => (prev + 1) % gallery.length)
                  }
                  aria-label="Fotografía siguiente"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-sm bg-[#070709]/85 border border-white/25 hover:border-white text-white flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </>
            )}
          </div>

          {/* Tira de Miniaturas Táctiles */}
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
              {gallery.map((img, index) => (
                <button
                  key={img.id || index}
                  type="button"
                  onClick={() => setSelectedImageIdx(index)}
                  aria-label={`Ver miniatura ${index + 1}`}
                  className={`relative aspect-square rounded-sm overflow-hidden border editorial-transition ${
                    safeIdx === index
                      ? 'border-[#C8A97E] ring-1 ring-[#C8A97E] opacity-100'
                      : 'border-[#261C31] opacity-65 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`${product.name} miniatura ${index + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Columna Derecha: Información Comercial y Botones de Acción (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-7">
          <div className="space-y-6">
            {/* Categoría + Estado de Disponibilidad */}
            <div className="flex items-center justify-between gap-2 border-b border-[#261C31] pb-3 flex-wrap">
              <Link
                href={`/categoria/${product.categorySlug}`}
                className="px-2.5 py-1 rounded-sm bg-[#150E1D] border border-[#3A2B4C] hover:border-[#C8A97E] text-[11px] uppercase tracking-[0.2em] text-[#C8A97E] font-medium editorial-transition"
              >
                {product.categoryName}
              </Link>

              <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-white">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`}
                />
                <span>{statusInfo.label}</span>
              </span>
            </div>

            {/* Nombre de la Pieza y Precio en COP */}
            <div className="space-y-3">
              <h1 className="font-display text-2xl sm:text-4xl font-medium text-white leading-tight break-words">
                {product.name}
              </h1>

              <div className="flex items-baseline gap-3 font-mono tabular-nums pt-1">
                <span className="text-2xl sm:text-3xl font-semibold text-white">
                  {formatPrice(product.price, product.currency || 'COP')}
                </span>
                {product.compareAtPrice &&
                  product.compareAtPrice > product.price && (
                    <span className="text-sm text-zinc-400 line-through">
                      {formatPrice(
                        product.compareAtPrice,
                        product.currency || 'COP'
                      )}
                    </span>
                  )}
              </div>
            </div>

            {/* Resumen Ejecutivo */}
            {product.shortDescription && (
              <p className="text-sm text-zinc-200 leading-relaxed">
                {product.shortDescription}
              </p>
            )}

            {/* Ficha Técnica (Solo muestra filas con datos reales completos) */}
            {(hasValidMaterial ||
              hasValidGauge ||
              hasValidColor ||
              cleanZones.length > 0) && (
              <div className="border border-[#261C31] bg-[#0E0A14] divide-y divide-[#261C31] text-xs rounded-sm">
                {hasValidMaterial && (
                  <div className="p-3.5 flex items-center justify-between gap-4">
                    <span className="uppercase tracking-[0.18em] text-zinc-300">
                      Material
                    </span>
                    <span className="text-white text-right font-medium">
                      {product.material}
                    </span>
                  </div>
                )}
                {hasValidGauge && (
                  <div className="p-3.5 flex items-center justify-between gap-4">
                    <span className="uppercase tracking-[0.18em] text-zinc-300">
                      Calibre (Grosor)
                    </span>
                    <span className="font-mono text-white">
                      {product.gauge}
                    </span>
                  </div>
                )}
                {hasValidColor && (
                  <div className="p-3.5 flex items-center justify-between gap-4">
                    <span className="uppercase tracking-[0.18em] text-zinc-300">
                      Acabado / Tono
                    </span>
                    <span className="text-white">{product.color}</span>
                  </div>
                )}
                {cleanZones.length > 0 && (
                  <div className="p-3.5 flex items-center justify-between gap-4">
                    <span className="uppercase tracking-[0.18em] text-zinc-300 flex-shrink-0">
                      Zonas Recomendadas
                    </span>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {cleanZones.map((zone) => (
                        <span
                          key={zone}
                          className="px-2 py-0.5 bg-[#150E1D] border border-[#3A2B4C] text-[11px] text-white"
                        >
                          {zone}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Selector Táctil de Medida / Diámetro (Solo si tiene medidas válidas) */}
            {cleanSizes.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="uppercase tracking-[0.18em] text-zinc-200">
                    Medida / Diámetro
                  </span>
                  <span className="font-mono text-[#C8A97E]">{activeSize}</span>
                </div>
                <div className="flex flex-wrap gap-2 font-mono">
                  {cleanSizes.map((size) => {
                    const isSelected = activeSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded-sm text-xs active:scale-[0.98] editorial-transition ${
                          isSelected
                            ? 'btn-skull-primary font-semibold'
                            : 'btn-skull-secondary'
                        }`}
                      >
                        <span className="text-white">{size}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* BOTONES COMERCIALES: 1. Consultar Disponibilidad | 2. Solicitar Cita */}
            <div className="pt-2 space-y-2.5">
              <a
                href={availabilityWhatsAppUrl || '#'}
                target={waReady ? '_blank' : undefined}
                rel={waReady ? 'noopener noreferrer' : undefined}
                onClick={(e) =>
                  handleWhatsAppAction(e, availabilityWhatsAppUrl)
                }
                className="w-full py-3.5 px-6 rounded-sm btn-skull-primary font-semibold text-xs uppercase tracking-[0.18em] flex items-center justify-center gap-2.5 active:scale-[0.99]"
              >
                <WhatsAppIcon className="w-5 h-5" />
                <span className="text-white">Consultar Disponibilidad</span>
              </a>

              <a
                href={appointmentWhatsAppUrl || '#'}
                target={waReady ? '_blank' : undefined}
                rel={waReady ? 'noopener noreferrer' : undefined}
                onClick={(e) =>
                  handleWhatsAppAction(e, appointmentWhatsAppUrl)
                }
                className="w-full py-3.5 px-6 rounded-sm btn-skull-secondary font-semibold text-xs uppercase tracking-[0.18em] flex items-center justify-center gap-2.5 active:scale-[0.99]"
              >
                <Calendar className="w-4 h-4 text-[#C8A97E]" />
                <span className="text-white">Solicitar Cita de Perforación</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyProductUrl}
                  className="w-full py-2.5 px-3 rounded-sm bg-[#070709] border border-[#261C31] hover:border-white/40 text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-1.5 text-white editorial-transition"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#C8A97E]" />
                  )}
                  <span className="text-white">
                    {copied ? 'Enlace Copiado' : 'Copiar Enlace'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleShareProduct}
                  className="w-full py-2.5 px-3 rounded-sm bg-[#070709] border border-[#261C31] hover:border-white/40 text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-1.5 text-white editorial-transition"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#C8A97E]" />
                  <span className="text-white">Compartir Pieza</span>
                </button>
              </div>
            </div>

            {/* Descripción Detallada */}
            {product.description && (
              <div className="pt-6 border-t border-[#261C31] space-y-2.5">
                <h2 className="text-xs uppercase tracking-[0.22em] text-[#C8A97E] font-medium">
                  Descripción & Notas de Cuidado
                </h2>
                <div className="text-sm text-zinc-200 whitespace-pre-line leading-relaxed">
                  {product.description}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRODUCTOS RECOMENDADOS */}
      {recommendedProducts.length > 0 && (
        <section className="pt-12 border-t border-[#261C31] space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-[0.24em] text-[#C8A97E]">
                Curaduría Relacionada
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-medium text-white mt-1">
                Productos Recomendados
              </h2>
            </div>
            <Link
              href={`/categoria/${product.categorySlug}`}
              className="text-xs uppercase tracking-[0.18em] text-[#C8A97E] hover:text-white"
            >
              Ver colección →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-6">
            {recommendedProducts.map((rec) => (
              <ProductCard key={rec.id} product={rec} />
            ))}
          </div>
        </section>
      )}

      {/* MODAL DE AMPLIACIÓN DE FOTOGRAFÍAS (LIGHTBOX) */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Galería ampliada de ${product.name}`}
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-[#070709]/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8"
        >
          {/* Barra Superior del Lightbox */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-6xl w-full mx-auto flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="font-mono text-xs text-[#C8A97E]">
                Fotografía 0{safeIdx + 1} de 0{gallery.length}
              </p>
              <h3 className="font-display text-base sm:text-lg text-white truncate">
                {product.name}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Cerrar ampliación"
              className="px-3.5 py-2 rounded-sm bg-[#150E1D] border border-white/30 hover:border-white text-xs uppercase tracking-wider text-white inline-flex items-center gap-1.5"
            >
              <X className="w-4 h-4 text-white" />
              <span className="text-white">Cerrar</span>
            </button>
          </div>

          {/* Imagen Ampliada Central */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex-1 flex items-center justify-center my-4 min-h-0"
          >
            {gallery.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setSelectedImageIdx(
                    (prev) => (prev - 1 + gallery.length) % gallery.length
                  )
                }
                aria-label="Anterior"
                className="absolute left-1 sm:left-6 z-10 w-10 h-10 rounded-sm bg-[#150E1D]/90 border border-white/30 hover:border-white text-white flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
            )}

            <img
              src={currentImage.url}
              alt={`${product.name} ampliada ${safeIdx + 1}`}
              className="max-h-[72vh] max-w-full object-contain rounded-sm border border-[#261C31] bg-[#0E0A14]"
            />

            {gallery.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setSelectedImageIdx((prev) => (prev + 1) % gallery.length)
                }
                aria-label="Siguiente"
                className="absolute right-1 sm:right-6 z-10 w-10 h-10 rounded-sm bg-[#150E1D]/90 border border-white/30 hover:border-white text-white flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            )}
          </div>

          {/* Miniaturas Inferiores dentro del Lightbox */}
          {gallery.length > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="max-w-md mx-auto flex items-center justify-center gap-2 overflow-x-auto py-1"
            >
              {gallery.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-14 h-14 rounded-sm overflow-hidden border flex-shrink-0 ${
                    safeIdx === idx
                      ? 'border-[#C8A97E] opacity-100'
                      : 'border-[#261C31] opacity-50 hover:opacity-90'
                  }`}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
