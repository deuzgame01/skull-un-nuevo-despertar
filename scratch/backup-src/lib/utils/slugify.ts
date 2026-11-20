/**
 * Convierte un texto en un slug limpio para URLs compartibles.
 * Ej: "Argolla Titanio Ópalo #16G" -> "argolla-titanio-opalo-16g"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina tildes/diacríticos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Genera palabras clave de búsqueda normalizadas para un producto.
 */
export function buildSearchKeywords(parts: (string | undefined | string[])[]): string[] {
  const rawTokens = parts
    .flatMap((part) => {
      if (!part) return [];
      if (Array.isArray(part)) return part;
      return [part];
    })
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 2);

  return Array.from(new Set(rawTokens));
}

