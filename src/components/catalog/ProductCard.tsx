'use client';

import React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Product } from '@/types/database.types';
import { formatPrice } from '@/lib/utils/formatters';
import {
  buildProductWhatsAppUrl,
  isWhatsAppConfigured,
} from '@/lib/utils/whatsapp';
import { useCatalog } from '@/context/CatalogContext';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

interface ProductCardProps {
  product: Product;
  /**
   * `light` se usa en la galería clara de la portada.
   * `dark` conserva el estilo original del resto del sitio.
   */
  variant?: 'dark' | 'light';
}

export function ProductCard({ product, variant = 'dark' }: ProductCardProps) {
  const isLight = variant === 'light';
  const { settings } = useCatalog();
  const detailHref = `/skull/producto/${product.slug}`;
  const whatsappLink = buildProductWhatsAppUrl(product, settings.whatsapp);
  const waReady = isWhatsAppConfigured(settings.whatsapp);

  const hasDiscount =
    Boolean(product.compareAtPrice) &&
    Number(product.compareAtPrice) > product.price;

  const primaryImageUrl =
    product.thumbnailUrl ||
    product.images?.find((img) => img && img.isPrimary && img.url)?.url ||
    product.images?.find((img) => img && img.url)?.url ||
    '/images/logo-skull.png';

  const handleOrderClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    if (!waReady || !whatsappLink) {
      e.preventDefault();
      toast.error(
        'La línea de WhatsApp aún no está configurada por la administración.'
      );
    }
  };

  const badgeClass = (tone: 'stock' | 'low' | 'featured') => {
    const base =
      'absolute left-2.5 top-2.5 px-2 py-0.5 text-[9px] uppercase tracking-[0.16em]';

    if (!isLight) {
      const darkTone = {
        stock: 'bg-[#F6F3EE]/90 border border-rose-500/40 text-[#21162C]',
        low: 'bg-[#F6F3EE]/90 border border-amber-400/40 text-[#21162C]',
        featured: 'bg-[#F6F3EE]/85 border border-[#9A7B4F]/45 text-[#9A7B4F]',
      }[tone];
      return `${base} ${darkTone}`;
    }

    const lightTone = {
      stock: 'rounded-full bg-rose-50 font-semibold text-rose-700 ring-1 ring-rose-200',
      low: 'rounded-full bg-amber-50 font-semibold text-amber-800 ring-1 ring-amber-200',
      featured: 'rounded-full bg-[#2C1440] font-semibold text-white',
    }[tone];
    return `${base} ${lightTone}`;
  };

  return (
    <article
      className={
        isLight
          ? 'group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E7DFD3] bg-white shadow-[0_8px_24px_rgba(40,25,60,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#9A7B4F] hover:shadow-[0_18px_34px_rgba(40,25,60,0.13)]'
          : 'group bg-white border border-[#E7DFD3] hover:border-[#5B2B84]/40 rounded-sm overflow-hidden flex flex-col justify-between editorial-transition'
      }
    >
      {/* Fotografía protagonista */}
      <Link
        href={detailHref}
        aria-label={`Ver detalle de ${product.name}`}
        className={
          isLight
            ? 'relative block aspect-[4/5] w-full overflow-hidden bg-[#F1ECE5]'
            : 'relative aspect-[4/5] w-full overflow-hidden bg-[#F1ECE5] block'
        }
      >
        <img
          src={primaryImageUrl}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className={
            isLight
              ? 'h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105'
              : 'w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-500'
          }
        />

        {product.stockStatus === 'out_of_stock' ? (
          <span className={badgeClass('stock')}>Bajo Encargo</span>
        ) : product.stockStatus === 'low_stock' ? (
          <span className={badgeClass('low')}>Últimas piezas</span>
        ) : product.isFeatured ? (
          <span className={badgeClass('featured')}>Destacado</span>
        ) : null}
      </Link>

      {/* Información de la pieza */}
      <div
        className={
          isLight
            ? 'flex flex-1 flex-col justify-between gap-3 p-3.5'
            : 'p-3 sm:p-4 flex-1 flex flex-col justify-between gap-2.5'
        }
      >
        <div className="space-y-1 min-w-0">
          {product.categoryName && (
            <p
              className={
                isLight
                  ? 'truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9A7B4F]'
                  : 'text-[10px] uppercase tracking-[0.18em] text-[#9A7B4F] truncate'
              }
            >
              {product.categoryName}
            </p>
          )}

          <Link href={detailHref} className="block">
            <h3
              className={
                isLight
                  ? 'font-display text-base font-semibold leading-snug text-[#21162C] line-clamp-2 transition-colors group-hover:text-[#6D28D9]'
                  : 'font-display text-sm sm:text-base font-medium text-[#21162C] group-hover:text-[#9A7B4F] leading-snug line-clamp-1 sm:line-clamp-2 break-words editorial-transition'
              }
            >
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Precio + pedido directo */}
        <div className={isLight ? 'space-y-2.5 pt-0.5' : 'space-y-2 pt-1'}>
          <div className="font-mono tabular-nums flex items-baseline gap-2 flex-wrap">
            <span
              className={
                isLight
                  ? 'text-base font-semibold text-[#21162C]'
                  : 'text-sm sm:text-base font-semibold text-[#21162C]'
              }
            >
              {formatPrice(product.price, product.currency || 'COP')}
            </span>
            {hasDiscount && (
              <span
                className={
                  isLight
                    ? 'text-[11px] text-[#9A8FA8] line-through'
                    : 'text-[11px] text-[#6B6272] line-through'
                }
              >
                {formatPrice(
                  product.compareAtPrice!,
                  product.currency || 'COP'
                )}
              </span>
            )}
          </div>

          <a
            href={whatsappLink || '#'}
            target={waReady ? '_blank' : undefined}
            rel={waReady ? 'noopener noreferrer' : undefined}
            onClick={handleOrderClick}
            aria-label={`Pedir ${product.name} por WhatsApp`}
            className={`flex w-full items-center justify-center gap-2 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] active:scale-[0.98] sm:text-xs ${
              isLight ? 'btn-skull-ink rounded-full' : 'btn-skull-primary rounded-sm'
            }`}
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span className="text-[#21162C]">Pedir</span>
          </a>
        </div>
      </div>
    </article>
  );
}
