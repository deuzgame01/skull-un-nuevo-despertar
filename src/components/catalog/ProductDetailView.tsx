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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
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
        <div className="h-5 w-48 bg-[#F1ECE5] rounded-sm animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
          <div className="lg:col-span-7 space-y-3">
            <div className="aspect-[4/5] sm:aspect-square rounded-sm bg-white border border-[#E7DFD3] animate-pulse" />
            <div className="grid grid-cols-4 gap-2.5">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="aspect-square rounded-sm bg-white border border-[#E7DFD3] animate-pulse"
                />
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 space-y-5">
            <div className="h-4 w-36 bg-[#F1ECE5] rounded-sm animate-pulse" />
            <div className="h-10 w-4/5 bg-[#F1ECE5] rounded-sm animate-pulse" />
            <div className="h-8 w-32 bg-[#F1ECE5] rounded-sm animate-pulse" />
            <div className="h-24 w-full bg-white border border-[#E7DFD3] rounded-sm animate-pulse" />
            <div className="h-12 w-full bg-[#F1ECE5] rounded-sm animate-pulse" />
            <div className="h-12 w-full bg-white rounded-sm animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 2. MANEJO DE PRODUCTO INEXISTENTE O NO PUBLICADO
  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#F1ECE5] border border-[#DCCFC0] text-[11px] uppercase tracking-[0.22em] text-[#9A7B4F]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Archivo SKULL</span>
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <h1 className="font-display text-3xl sm:text-4xl font-medium text-[#21162C]">
            Pieza no disponible en el catálogo
          </h1>
          <p className="text-xs sm:text-sm text-[#5A4F66] leading-relaxed">
            La joya que buscas ya no se encuentra publicada o su enlace ha cambiado. Explora nuestras colecciones activas o regresa al catálogo general.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-sm btn-skull-primary text-xs uppercase tracking-[0.18em] font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#21162C]" />
            <span className="text-[#21162C]">Explorar Catálogo</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-sm btn-skull-secondary text-xs uppercase tracking-[0.18em]"
          >
            <span className="text-[#21162C]">Ir al Inicio</span>
          </Link>
        </div>

        {activeCategories.length > 0 && (
          <div className="pt-8 border-t border-[#E7DFD3] space-y-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#9A7B4F]">
              Colecciones Disponibles
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {activeCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categoria/${cat.slug}`}
                  className="px-3.5 py-2 rounded-sm bg-white border border-[#DCCFC0] hover:border-[#5B2B84] text-xs text-[#21162C] editorial-transition"
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-8 sm:pt-6 sm:pb-12 space-y-6">
      {/* Barra Superior de Navegación (Miga de Pan) */}
      <div className="flex items-center gap-2 border-b border-[#E7DFD3] pb-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#5A4F66] min-w-0">
          <Link
            href="/catalogo"
            className="hover:text-[#21162C] inline-flex items-center gap-1.5 flex-shrink-0 editorial-transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#21162C]" />
            <span className="text-[#21162C]">Catálogo</span>
          </Link>
          {product.categoryName && (
            <>
              <span className="text-[#8A8290]">/</span>
              <Link
                href={`/categoria/${product.categorySlug}`}
                className="text-[#9A7B4F] hover:text-[#21162C] truncate editorial-transition"
              >
                {product.categoryName}
              </Link>
            </>
          )}
        </div>

      </div>

      {/* DETALLE DE PRODUCTO + GALERÍA FOTOGRÁFICA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Columna Izquierda: Galería Fotográfica (Imagen Principal + Miniaturas + Ampliación) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative aspect-[4/5] sm:aspect-square rounded-sm overflow-hidden bg-[#F1ECE5] border border-[#E7DFD3] group">
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
              <span className="px-2.5 py-1 rounded-sm bg-[#F6F3EE]/90 border border-[#5B2B84]/35 font-mono text-xs text-[#21162C]">
                0{safeIdx + 1} / 0{gallery.length}
              </span>

              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#F6F3EE]/90 border border-[#5B2B84]/35 hover:border-[#5B2B84] text-[11px] uppercase tracking-[0.16em] text-[#21162C] editorial-transition"
              >
                <ZoomIn className="w-3.5 h-3.5 text-[#9A7B4F]" />
                <span className="text-[#21162C]">Ampliar Foto</span>
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-sm bg-[#F6F3EE]/85 border border-[#5B2B84]/35 hover:border-[#5B2B84] text-[#21162C] flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4 text-[#21162C]" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImageIdx((prev) => (prev + 1) % gallery.length)
                  }
                  aria-label="Fotografía siguiente"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-sm bg-[#F6F3EE]/85 border border-[#5B2B84]/35 hover:border-[#5B2B84] text-[#21162C] flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4 text-[#21162C]" />
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
                      ? 'border-[#9A7B4F] ring-1 ring-[#C8A97E] opacity-100'
                      : 'border-[#E7DFD3] opacity-65 hover:opacity-100'
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
            <div className="flex items-center justify-between gap-2 border-b border-[#E7DFD3] pb-3 flex-wrap">
              <Link
                href={`/categoria/${product.categorySlug}`}
                className="px-2.5 py-1 rounded-sm bg-[#F1ECE5] border border-[#DCCFC0] hover:border-[#9A7B4F] text-[11px] uppercase tracking-[0.2em] text-[#9A7B4F] font-medium editorial-transition"
              >
                {product.categoryName}
              </Link>

              <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#21162C]">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`}
                />
                <span>{statusInfo.label}</span>
              </span>
            </div>

            {/* Nombre de la Pieza y Precio en COP */}
            <div className="space-y-3">
              <h1 className="font-display text-2xl sm:text-4xl font-medium text-[#21162C] leading-tight break-words">
                {product.name}
              </h1>

              <div className="flex items-baseline gap-3 font-mono tabular-nums pt-1">
                <span className="text-2xl sm:text-3xl font-semibold text-[#21162C]">
                  {formatPrice(product.price, product.currency || 'COP')}
                </span>
                {product.compareAtPrice &&
                  product.compareAtPrice > product.price && (
                    <span className="text-sm text-[#6B6272] line-through">
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
              <p className="text-sm text-[#4A3B58] leading-relaxed">
                {product.shortDescription}
              </p>
            )}

            {/* Ficha Técnica (Solo muestra filas con datos reales completos) */}
            {(hasValidMaterial ||
              hasValidGauge ||
              hasValidColor ||
              cleanZones.length > 0) && (
              <div className="border border-[#E7DFD3] bg-white divide-y divide-[#E7DFD3] text-xs rounded-sm">
                {hasValidMaterial && (
                  <div className="p-3.5 flex items-center justify-between gap-4">
                    <span className="uppercase tracking-[0.18em] text-[#5A4F66]">
                      Material
                    </span>
                    <span className="text-[#21162C] text-right font-medium">
                      {product.material}
                    </span>
                  </div>
                )}
                {hasValidGauge && (
                  <div className="p-3.5 flex items-center justify-between gap-4">
                    <span className="uppercase tracking-[0.18em] text-[#5A4F66]">
                      Calibre (Grosor)
                    </span>
                    <span className="font-mono text-[#21162C]">
                      {product.gauge}
                    </span>
                  </div>
                )}
                {hasValidColor && (
                  <div className="p-3.5 flex items-center justify-between gap-4">
                    <span className="uppercase tracking-[0.18em] text-[#5A4F66]">
                      Acabado / Tono
                    </span>
                    <span className="text-[#21162C]">{product.color}</span>
                  </div>
                )}
                {cleanZones.length > 0 && (
                  <div className="p-3.5 flex items-center justify-between gap-4">
                    <span className="uppercase tracking-[0.18em] text-[#5A4F66] flex-shrink-0">
                      Zonas Recomendadas
                    </span>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {cleanZones.map((zone) => (
                        <span
                          key={zone}
                          className="px-2 py-0.5 bg-[#F1ECE5] border border-[#DCCFC0] text-[11px] text-[#21162C]"
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
                  <span className="uppercase tracking-[0.18em] text-[#4A3B58]">
                    Medida / Diámetro
                  </span>
                  <span className="font-mono text-[#9A7B4F]">{activeSize}</span>
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
                        <span className="text-[#21162C]">{size}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* BOTONES COMERCIALES: 1. Agendar cita | 2. Consultar Disponibilidad */}
            <div className="pt-2 space-y-2.5">
              <Link
                href="/agendar"
                className="w-full py-3.5 px-6 rounded-sm btn-skull-primary font-semibold text-xs uppercase tracking-[0.18em] flex items-center justify-center gap-2.5 active:scale-[0.99]"
              >
                <Calendar className="w-4 h-4" />
                <span className="text-white">Agendar Cita de Perforación</span>
              </Link>

              <a
                href={availabilityWhatsAppUrl || '#'}
                target={waReady ? '_blank' : undefined}
                rel={waReady ? 'noopener noreferrer' : undefined}
                onClick={(e) =>
                  handleWhatsAppAction(e, availabilityWhatsAppUrl)
                }
                className="w-full py-3.5 px-6 rounded-sm btn-skull-secondary font-semibold text-xs uppercase tracking-[0.18em] flex items-center justify-center gap-2.5 active:scale-[0.99]"
              >
                <WhatsAppIcon className="w-5 h-5 text-[#9A7B4F]" />
                <span className="text-[#21162C]">Consultar Disponibilidad</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyProductUrl}
                  className="w-full py-2.5 px-3 rounded-sm bg-[#F6F3EE] border border-[#E7DFD3] hover:border-[#5B2B84]/40 text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-1.5 text-[#21162C] editorial-transition"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#9A7B4F]" />
                  )}
                  <span className="text-[#21162C]">
                    {copied ? 'Enlace Copiado' : 'Copiar Enlace'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleShareProduct}
                  className="w-full py-2.5 px-3 rounded-sm bg-[#F6F3EE] border border-[#E7DFD3] hover:border-[#5B2B84]/40 text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-1.5 text-[#21162C] editorial-transition"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#9A7B4F]" />
                  <span className="text-[#21162C]">Compartir Pieza</span>
                </button>
              </div>
            </div>

            {/* Descripción Detallada */}
            {product.description && (
              <div className="pt-6 border-t border-[#E7DFD3] space-y-2.5">
                <h2 className="text-xs uppercase tracking-[0.22em] text-[#9A7B4F] font-medium">
                  Descripción & Notas de Cuidado
                </h2>
                <div className="text-sm text-[#4A3B58] whitespace-pre-line leading-relaxed">
                  {product.description}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRODUCTOS RECOMENDADOS */}
      {recommendedProducts.length > 0 && (
        <section className="pt-12 border-t border-[#E7DFD3] space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-[0.24em] text-[#9A7B4F]">
                Curaduría Relacionada
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-medium text-[#21162C] mt-1">
                Productos Recomendados
              </h2>
            </div>
            <Link
              href={`/categoria/${product.categorySlug}`}
              className="text-xs uppercase tracking-[0.18em] text-[#9A7B4F] hover:text-[#21162C]"
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
          className="fixed inset-0 z-[130] overscroll-contain bg-[#F6F3EE] flex flex-col justify-between p-4 sm:p-8"
        >
          {/* Barra Superior del Lightbox */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-6xl w-full mx-auto flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="font-mono text-xs text-[#9A7B4F]">
                Fotografía 0{safeIdx + 1} de 0{gallery.length}
              </p>
              <h3 className="font-display text-base sm:text-lg text-[#21162C] truncate">
                {product.name}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Cerrar ampliación"
              className="px-3.5 py-2 rounded-sm bg-[#F1ECE5] border border-[#5B2B84]/35 hover:border-[#5B2B84] text-xs uppercase tracking-wider text-[#21162C] inline-flex items-center gap-1.5"
            >
              <X className="w-4 h-4 text-[#21162C]" />
              <span className="text-[#21162C]">Cerrar</span>
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
                className="absolute left-1 sm:left-6 z-10 w-10 h-10 rounded-sm bg-[#F1ECE5]/90 border border-[#5B2B84]/35 hover:border-[#5B2B84] text-[#21162C] flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5 text-[#21162C]" />
              </button>
            )}

            <img
              src={currentImage.url}
              alt={`${product.name} ampliada ${safeIdx + 1}`}
              className="max-h-full max-w-full object-contain rounded-sm border border-[#E7DFD3] bg-white"
            />

            {gallery.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setSelectedImageIdx((prev) => (prev + 1) % gallery.length)
                }
                aria-label="Siguiente"
                className="absolute right-1 sm:right-6 z-10 w-10 h-10 rounded-sm bg-[#F1ECE5]/90 border border-[#5B2B84]/35 hover:border-[#5B2B84] text-[#21162C] flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5 text-[#21162C]" />
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
                      ? 'border-[#9A7B4F] opacity-100'
                      : 'border-[#E7DFD3] opacity-50 hover:opacity-90'
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
