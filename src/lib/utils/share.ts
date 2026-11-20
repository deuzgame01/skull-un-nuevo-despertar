import type { Metadata } from 'next';
import type { Product } from '@/types/database.types';
import {
  formatPriceWithCurrency,
  getCanonicalProductUrl,
} from './whatsapp';

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

/**
 * Copia texto al portapapeles con soporte moderno (Clipboard API) y
 * fallback compatible con navegadores móviles Android / iOS / WebViews.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Continuar al fallback clásico
    }
  }

  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Copia directamente el enlace canónico del producto al portapapeles.
 */
export async function copyProductLink(
  product: Pick<Product, 'slug'>,
  customOrigin?: string
): Promise<{ ok: boolean; url: string }> {
  const url = getCanonicalProductUrl(product.slug, customOrigin);
  const ok = await copyTextToClipboard(url);
  return { ok, url };
}

/**
 * Comparte un producto usando la Web Share API nativa en móviles (Android / iPhone)
 * y utiliza automáticamente la alternativa de copiar enlace en navegadores de escritorio.
 */
export async function shareProductOrFallbackCopy(
  product: Pick<
    Product,
    'name' | 'shortDescription' | 'description' | 'price' | 'currency' | 'slug'
  >,
  customOrigin?: string
): Promise<{ outcome: ShareOutcome; url: string }> {
  const url = getCanonicalProductUrl(product.slug, customOrigin);
  const priceLabel = formatPriceWithCurrency(
    product.price,
    product.currency || 'COP'
  );
  const shareTitle = `${product.name} | SKULL – Un Nuevo Despertar`;
  const summary = (
    product.shortDescription ||
    product.description ||
    'Joyería corporal certificada en Titanio Grado Implante.'
  )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);
  const shareText = `${product.name} (${priceLabel}) — ${summary}`;

  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function'
  ) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url,
      });
      return { outcome: 'shared', url };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { outcome: 'cancelled', url };
      }
      // Si falla por cualquier otro motivo, caer al copiado en portapapeles
    }
  }

  const copied = await copyTextToClipboard(url);
  return {
    outcome: copied ? 'copied' : 'failed',
    url,
  };
}

/**
 * Resuelve una URL de imagen válida (HTTP/HTTPS) para previsualizaciones Open Graph
 * en WhatsApp, Instagram, Facebook y X. Si el producto no tiene imágenes o usa
 * un Data URI local, utiliza el emblema oficial de SKULL como respaldo.
 */
export function resolveOpenGraphImageUrl(
  product?: Partial<Product> | null,
  siteOrigin?: string
): string {
  const baseOrigin = (
    siteOrigin ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3001'
  ).replace(/\/+$/, '');

  const fallbackLogo = `${baseOrigin}/images/logo-skull.png`;
  if (!product) return fallbackLogo;

  const primaryFromGallery = (product.images || []).find(
    (img) => img && img.isPrimary && img.url && !img.url.startsWith('data:')
  )?.url;
  const firstFromGallery = (product.images || []).find(
    (img) => img && img.url && !img.url.startsWith('data:')
  )?.url;
  const thumb =
    product.thumbnailUrl && !product.thumbnailUrl.startsWith('data:')
      ? product.thumbnailUrl
      : '';

  const candidate = (
    primaryFromGallery ||
    thumb ||
    firstFromGallery ||
    ''
  ).trim();

  if (!candidate) return fallbackLogo;
  if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
    return candidate;
  }
  if (candidate.startsWith('/')) {
    return `${baseOrigin}${candidate}`;
  }
  return `${baseOrigin}/${candidate}`;
}

/**
 * Genera metadatos Open Graph y Twitter Card dinámicos para un producto.
 */
export function buildProductOpenGraphMetadata(
  product: Product | null,
  slug: string,
  siteOrigin?: string
): Metadata {
  const baseOrigin = (
    siteOrigin ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3001'
  ).replace(/\/+$/, '');

  const canonicalUrl = getCanonicalProductUrl(
    product?.slug || slug,
    baseOrigin
  );

  if (!product || !product.isActive) {
    return {
      title: 'Pieza no disponible | SKULL – Un Nuevo Despertar',
      description:
        'Explora el catálogo oficial de joyería corporal certificada en SKULL – Un Nuevo Despertar.',
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: 'SKULL – Un Nuevo Despertar | Catálogo Oficial',
        description:
          'Joyería corporal certificada en Titanio Grado Implante ASTM F-136.',
        url: canonicalUrl,
        siteName: 'SKULL – Un Nuevo Despertar',
        type: 'website',
        locale: 'es_CO',
        images: [
          {
            url: `${baseOrigin}/images/logo-skull.png`,
            width: 800,
            height: 800,
            alt: 'SKULL – Un Nuevo Despertar',
          },
        ],
      },
    };
  }

  const priceLabel = formatPriceWithCurrency(
    product.price,
    product.currency || 'COP'
  );
  const ogTitle = `${product.name} — ${priceLabel} | SKULL – Un Nuevo Despertar`;
  const rawDescription =
    product.shortDescription?.trim() ||
    product.description?.trim() ||
    `Pieza de joyería corporal ${product.name} disponible en SKULL – Un Nuevo Despertar.`;
  const cleanDescription = rawDescription.replace(/\s+/g, ' ').slice(0, 200);
  const ogDescription = `${cleanDescription} • Precio: ${priceLabel}.`;
  const ogImageUrl = resolveOpenGraphImageUrl(product, baseOrigin);

  return {
    title: `${product.name} (${priceLabel})`,
    description: ogDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonicalUrl,
      siteName: 'SKULL – Un Nuevo Despertar',
      type: 'website',
      locale: 'es_CO',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 1200,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImageUrl],
    },
  };
}

