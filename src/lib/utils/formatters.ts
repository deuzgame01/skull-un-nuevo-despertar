import type { StockStatus } from '@/types/database.types';

export function formatPrice(amount: number, currency = 'COP'): string {
  try {
    const localeMap: Record<string, string> = {
      COP: 'es-CO',
      MXN: 'es-MX',
      USD: 'en-US',
      PEN: 'es-PE',
      ARS: 'es-AR',
      CLP: 'es-CL',
      EUR: 'es-ES',
    };
    const locale = localeMap[currency] || 'es-CO';
    const zeroDecimalCurrencies = ['COP', 'CLP', 'ARS'];

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: zeroDecimalCurrencies.includes(currency) ? 0 : 2,
      maximumFractionDigits: zeroDecimalCurrencies.includes(currency) ? 0 : 2,
    }).format(amount);
  } catch {
    return `$${amount.toLocaleString()}`;
  }
}

export const STOCK_STATUS_MAP: Record<
  StockStatus,
  { label: string; badgeClass: string; dotClass: string; canOrder: boolean }
> = {
  in_stock: {
    label: 'Disponible',
    badgeClass: 'bg-skull-plum/90 text-skull-alabaster border-skull-border',
    dotClass: 'bg-skull-sage',
    canOrder: true,
  },
  low_stock: {
    label: 'Edición Limitada',
    badgeClass: 'bg-skull-plum/90 text-skull-champagne border-skull-champagne/40',
    dotClass: 'bg-skull-champagne',
    canOrder: true,
  },
  on_request: {
    label: 'Bajo Pedido',
    badgeClass: 'bg-skull-plum/90 text-skull-silver border-skull-silver/30',
    dotClass: 'bg-skull-silver',
    canOrder: true,
  },
  out_of_stock: {
    label: 'Agotado',
    badgeClass: 'bg-skull-bg/90 text-skull-muted border-skull-border',
    dotClass: 'bg-skull-muted',
    canOrder: false,
  },
};
