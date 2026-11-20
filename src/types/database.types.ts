export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'on_request';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  imagePath?: string;
  order: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ProductImage {
  id: string;
  url: string;
  storagePath: string;
  isPrimary: boolean;
  name?: string;
  sizeBytes?: number;
  createdAt?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  currency: string;

  // Relación desnormalizada con Categoría
  categoryId: string;
  categoryName: string;
  categorySlug: string;

  // Especificaciones de joyería / piercing
  material: string;
  bodyZone: string[];
  gauge?: string;
  sizes: string[];
  color?: string;

  // Galería
  images: ProductImage[];
  thumbnailUrl: string;

  // Estados comerciales
  isActive: boolean;
  isFeatured: boolean;
  stockStatus: StockStatus;

  // Búsqueda optimizada
  searchKeywords: string[];

  createdAt: number;
  updatedAt: number;
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed';

export interface Appointment {
  /** ID único de la cita en Firestore (o UUID en modo local). */
  id: string;
  /** Clave del horario reservado (YYYY-MM-DD_HH-mm). */
  slotId: string;
  customerName: string;
  phone: string;
  bodyZone: string;
  jewelry?: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  createdAt: number;
  updatedAt: number;
}

/** Copia pública y mínima de un horario ocupado (sin datos del cliente). */
export interface AppointmentSlot {
  id: string;
  date: string;
  time: string;
  /** Cita que ocupa el horario. Permite liberarlo al cancelar. */
  appointmentId?: string;
}

export interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export type HomeSectionId =
  | 'hero'
  | 'trust'
  | 'categories'
  | 'featured'
  | 'catalog'
  | 'contact';

export interface HomeSectionConfig {
  id: HomeSectionId;
  visible: boolean;
}

/** Disposición de la franja de confianza en la portada. */
export type TrustLayout = 'stacked' | 'row';

export interface BrandSettings {
  siteName: string;
  tagline: string;
  description: string;
  logoUrl: string;
  heroBannerUrl?: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroSlides?: HeroSlide[];
  announcementBar: string;
  /** Hasta 5 mensajes que rotan automáticamente en el cintillo superior. */
  announcementMessages?: string[];
  /** Visibilidad y orden de las secciones de la portada pública. */
  homeSections?: HomeSectionConfig[];
  /** Cómo se acomodan las cards de la franja de confianza. */
  trustLayout?: TrustLayout;
  instagramHandle: string;
  instagramUrl: string;
  tiktokUrl?: string;
  locationText: string;
  /** Datos de contacto del negocio, independientes de WhatsApp. */
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  contactCity?: string;
  contactCountry?: string;
  currency: string;
  // Presentación de la propietaria o del establecimiento
  showStudioSection?: boolean;
  studioBadge?: string;
  studioTitle?: string;
  studioDescription?: string;
  studioOwnerName?: string;
  studioOwnerRole?: string;
  studioImageUrl?: string;
  studioHighlights?: string[];
}

export interface WhatsAppSettings {
  phoneNumber: string;
  ownerName: string;
  generalGreeting: string;
  productMessageTemplate: string;
  showFloatingButton: boolean;
  floatingButtonLabel: string;
  businessHoursNote: string;
}

export interface GlobalSettings {
  brand: BrandSettings;
  whatsapp: WhatsAppSettings;
  updatedAt: number;
}

export interface MediaAsset {
  id: string;
  url: string;
  storagePath: string;
  folder: 'products' | 'categories' | 'brand';
  name: string;
  linkedTo?: string;
  createdAt: number;
}

