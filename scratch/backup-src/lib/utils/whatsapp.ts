import type { Product, WhatsAppSettings } from '@/types/database.types';
import { formatPrice } from './formatters';

/**
 * Normaliza un número telefónico al formato internacional requerido por wa.me
 * (solo dígitos con código de país, sin símbolo '+', espacios ni guiones).
 * Si recibe un móvil colombiano de 10 dígitos que inicia en '3', antepone '57'.
 */
export function normalizeWhatsAppPhone(
  phone?: string | null,
  defaultCountryCode = '57'
): string {
  if (!phone || typeof phone !== 'string') return '';

  let digits = phone.replace(/[^\d]/g, '');
  if (!digits) return '';

  // Remover prefijo internacional '00' si fue ingresado (ej: 0057...)
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  // Si es un celular colombiano de 10 dígitos (inicia en 3), agregar código 57
  if (digits.length === 10 && digits.startsWith('3')) {
    digits = `${defaultCountryCode}${digits}`;
  }

  // Validar longitud E.164 (10 a 15 dígitos) y que no sean únicamente ceros
  if (digits.length < 10 || digits.length > 15 || /^0+$/.test(digits)) {
    return '';
  }

  return digits;
}

export function sanitizePhoneNumber(phone: string): string {
  return normalizeWhatsAppPhone(phone);
}

/**
 * Verifica si la configuración de WhatsApp de la marca tiene un número válido.
 */
export function isWhatsAppConfigured(
  whatsapp?: Partial<WhatsAppSettings> | null
): boolean {
  if (!whatsapp) return false;
  return normalizeWhatsAppPhone(whatsapp.phoneNumber).length >= 10;
}

/**
 * Devuelve la URL pública canónica de un producto (/skull/producto/[slug]).
 */
export function getCanonicalProductUrl(
  slug: string,
  customOrigin?: string
): string {
  const baseOrigin = (
    customOrigin ||
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001')
  ).replace(/\/+$/, '');

  const cleanSlug = encodeURIComponent((slug || '').trim());
  return `${baseOrigin}/skull/producto/${cleanSlug}`;
}

/**
 * Formatea el precio asegurando el sufijo explícito COP cuando corresponda.
 */
export function formatPriceWithCurrency(
  amount: number,
  currency = 'COP'
): string {
  const formatted = formatPrice(amount, currency).replace(/\s+/g, ' ').trim();
  if (formatted.toUpperCase().includes(currency.toUpperCase())) {
    return formatted;
  }
  return `${formatted} ${currency.toUpperCase()}`;
}

/**
 * Construye un enlace oficial https://wa.me/<phone>?text=<encodedMessage>
 * compatible con Android, iPhone (iOS), WhatsApp Web y navegadores de escritorio.
 * Devuelve '' si el número de WhatsApp está vacío o es inválido.
 */
export function buildWaMeUrl(
  phone?: string | null,
  message?: string | null
): string {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (!normalizedPhone) return '';

  const normalizedMessage = (message || '')
    .replace(/\r\n/g, '\n')
    .trim();

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(
    normalizedMessage
  )}`;
}

/**
 * BOTÓN 1: CONSULTAR DISPONIBILIDAD (Mensaje dinámico exacto).
 *
 * Hola, SKULL – Un Nuevo Despertar.
 *
 * Estoy interesado/a en el siguiente producto:
 *
 * Producto: [Nombre]
 * Precio: [Precio COP]
 * Enlace: [URL del producto]
 *
 * ¿Me podrían confirmar su disponibilidad y brindarme más información?
 */
export function buildProductAvailabilityMessage(
  product: Pick<Product, 'name' | 'price' | 'currency' | 'slug'>,
  selectedOptions?: { size?: string; gauge?: string; customOrigin?: string }
): string {
  const cleanName = (product.name || 'Pieza del catálogo SKULL').trim();
  const optionSuffix =
    selectedOptions?.size &&
    selectedOptions.size.trim() !== '' &&
    selectedOptions.size.trim().toUpperCase() !== 'N/A'
      ? ` (${selectedOptions.size.trim()})`
      : '';

  const productLabel = `${cleanName}${optionSuffix}`;
  const priceLabel = formatPriceWithCurrency(
    product.price,
    product.currency || 'COP'
  );
  const productUrl = getCanonicalProductUrl(
    product.slug,
    selectedOptions?.customOrigin
  );

  return [
    'Hola, SKULL – Un Nuevo Despertar.',
    '',
    'Estoy interesado/a en el siguiente producto:',
    '',
    `Producto: ${productLabel}`,
    `Precio: ${priceLabel}`,
    `Enlace: ${productUrl}`,
    '',
    '¿Me podrían confirmar su disponibilidad y brindarme más información?',
  ].join('\n');
}

export function buildProductWhatsAppUrl(
  product: Pick<Product, 'name' | 'price' | 'currency' | 'slug'>,
  whatsapp?: Partial<WhatsAppSettings> | null,
  selectedOptions?: { size?: string; gauge?: string; customOrigin?: string }
): string {
  const message = buildProductAvailabilityMessage(product, selectedOptions);
  return buildWaMeUrl(whatsapp?.phoneNumber, message);
}

/**
 * BOTÓN 2: SOLICITAR UNA CITA (Mensaje dinámico exacto).
 *
 * Hola, SKULL – Un Nuevo Despertar.
 *
 * Quisiera solicitar información para agendar una cita.
 *
 * Estoy interesado/a en: [Producto o servicio].
 *
 * ¿Me podrían indicar los horarios disponibles?
 */
export function buildAppointmentMessage(
  productOrService: string,
  productUrl?: string
): string {
  const cleanTarget =
    (productOrService || 'Perforación profesional y curaduría anatómica').trim();

  const lines = [
    'Hola, SKULL – Un Nuevo Despertar.',
    '',
    'Quisiera solicitar información para agendar una cita.',
    '',
    `Estoy interesado/a en: ${cleanTarget}.`,
  ];

  if (productUrl && productUrl.trim() !== '') {
    lines.push(`Enlace: ${productUrl.trim()}`);
  }

  lines.push('', '¿Me podrían indicar los horarios disponibles?');
  return lines.join('\n');
}

export function buildProductAppointmentWhatsAppUrl(
  product: Pick<Product, 'name' | 'price' | 'currency' | 'slug'>,
  whatsapp?: Partial<WhatsAppSettings> | null,
  selectedOptions?: { size?: string; gauge?: string; customOrigin?: string }
): string {
  const cleanName = (product.name || 'Pieza del catálogo SKULL').trim();
  const optionSuffix =
    selectedOptions?.size &&
    selectedOptions.size.trim() !== '' &&
    selectedOptions.size.trim().toUpperCase() !== 'N/A'
      ? ` (${selectedOptions.size.trim()})`
      : '';
  const productUrl = getCanonicalProductUrl(
    product.slug,
    selectedOptions?.customOrigin
  );

  const message = buildAppointmentMessage(
    `${cleanName}${optionSuffix}`,
    productUrl
  );
  return buildWaMeUrl(whatsapp?.phoneNumber, message);
}

export function buildGeneralAppointmentWhatsAppUrl(
  whatsapp?: Partial<WhatsAppSettings> | null,
  serviceName = 'Perforación profesional y asesoría anatómica'
): string {
  const message = buildAppointmentMessage(serviceName);
  return buildWaMeUrl(whatsapp?.phoneNumber, message);
}

/**
 * BOTÓN 3: CONTACTO GENERAL.
 */
export function buildGeneralWhatsAppUrl(
  whatsapp?: Partial<WhatsAppSettings> | null,
  customMessage?: string
): string {
  const text =
    (customMessage && customMessage.trim()) ||
    (whatsapp?.generalGreeting && whatsapp.generalGreeting.trim()) ||
    'Hola, SKULL – Un Nuevo Despertar.\n\nQuisiera recibir información sobre su catálogo de joyería corporal y servicios de perforación.';
  return buildWaMeUrl(whatsapp?.phoneNumber, text);
}
