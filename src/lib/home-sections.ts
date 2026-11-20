import type {
  HomeSectionConfig,
  HomeSectionId,
  TrustLayout,
} from '@/types/database.types';

export interface HomeSectionMeta {
  id: HomeSectionId;
  label: string;
  description: string;
}

/** Catálogo de secciones que se pueden ordenar y ocultar desde el admin. */
export const HOME_SECTIONS: readonly HomeSectionMeta[] = [
  {
    id: 'hero',
    label: 'Portada principal',
    description: 'Carrusel de bienvenida con tus imágenes y textos.',
  },
  {
    id: 'trust',
    label: 'Franja de confianza',
    description: 'Certificación, envíos y asesoría en una sola línea.',
  },
  {
    id: 'categories',
    label: 'Carrusel de categorías',
    description: 'Accesos rápidos a cada colección de la tienda.',
  },
  {
    id: 'featured',
    label: 'Piezas destacadas',
    description: 'Carrusel de los productos favoritos.',
  },
  {
    id: 'catalog',
    label: 'Catálogo completo',
    description: 'Cuadrícula con búsqueda, filtros y orden.',
  },
  {
    id: 'contact',
    label: 'Cierre de contacto',
    description: 'Llamada final a WhatsApp y agendamiento de cita.',
  },
];

export const DEFAULT_HOME_SECTIONS: HomeSectionConfig[] = HOME_SECTIONS.map(
  ({ id }) => ({ id, visible: true })
);

/** Normaliza la disposición de la franja de confianza. */
export function normalizeTrustLayout(value: unknown): TrustLayout {
  return value === 'stacked' ? 'stacked' : 'row';
}

const VALID_IDS = new Set<HomeSectionId>(HOME_SECTIONS.map((s) => s.id));

/**
 * Garantiza que siempre existan todas las secciones, sin duplicados y en un
 * orden válido, aunque vengan de una configuración antigua o incompleta.
 */
export function normalizeHomeSections(
  sections: HomeSectionConfig[] | undefined
): HomeSectionConfig[] {
  if (!Array.isArray(sections)) {
    return DEFAULT_HOME_SECTIONS.map((section) => ({ ...section }));
  }

  const seen = new Set<HomeSectionId>();
  const result: HomeSectionConfig[] = [];

  for (const section of sections) {
    if (!section || !VALID_IDS.has(section.id) || seen.has(section.id)) continue;
    seen.add(section.id);
    result.push({ id: section.id, visible: section.visible !== false });
  }

  for (const fallback of DEFAULT_HOME_SECTIONS) {
    if (!seen.has(fallback.id)) result.push({ ...fallback });
  }

  return result;
}
