import type {
  Appointment,
  AppointmentSlot,
  Category,
  GlobalSettings,
  MediaAsset,
  Product,
} from '@/types/database.types';
import {
  DEFAULT_GLOBAL_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
} from './seed-data';
import {
  normalizeHomeSections,
  normalizeTrustLayout,
} from '@/lib/home-sections';

const KEYS = {
  CATEGORIES: 'skull_db_categories_v1',
  PRODUCTS: 'skull_db_products_v1',
  SETTINGS: 'skull_db_settings_v1',
  MEDIA: 'skull_db_media_v1',
  APPOINTMENTS: 'skull_db_appointments_v1',
  APPOINTMENT_SLOTS: 'skull_db_appointment_slots_v1',
};

function notifyStoreUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('skull-store-updated'));
  }
}

export function getLocalCategories(): Category[] {
  if (typeof window === 'undefined') return INITIAL_CATEGORIES;
  try {
    const raw = localStorage.getItem(KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    return JSON.parse(raw) as Category[];
  } catch {
    return INITIAL_CATEGORIES;
  }
}

export function saveLocalCategories(categories: Category[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
  notifyStoreUpdate();
}

export function getLocalProducts(): Product[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  try {
    const raw = localStorage.getItem(KEYS.PRODUCTS);
    if (!raw) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(raw) as Product[];
  } catch {
    return INITIAL_PRODUCTS;
  }
}

export function saveLocalProducts(products: Product[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  notifyStoreUpdate();
}

export function getLocalSettings(): GlobalSettings {
  if (typeof window === 'undefined') return DEFAULT_GLOBAL_SETTINGS;
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_GLOBAL_SETTINGS));
      return DEFAULT_GLOBAL_SETTINGS;
    }
    const parsed = JSON.parse(raw) as Partial<GlobalSettings>;
    const mergedBrand = {
      ...DEFAULT_GLOBAL_SETTINGS.brand,
      ...(parsed.brand || {}),
    };
    if (!mergedBrand.heroSlides || mergedBrand.heroSlides.length === 0) {
      mergedBrand.heroSlides = DEFAULT_GLOBAL_SETTINGS.brand.heroSlides;
    }
    mergedBrand.homeSections = normalizeHomeSections(mergedBrand.homeSections);
    mergedBrand.trustLayout = normalizeTrustLayout(mergedBrand.trustLayout);
    return {
      brand: mergedBrand,
      whatsapp: { ...DEFAULT_GLOBAL_SETTINGS.whatsapp, ...(parsed.whatsapp || {}) },
      updatedAt: parsed.updatedAt || Date.now(),
    };
  } catch {
    return DEFAULT_GLOBAL_SETTINGS;
  }
}

export function saveLocalSettings(settings: GlobalSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  notifyStoreUpdate();
}

export function getLocalMediaAssets(): MediaAsset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEYS.MEDIA);
    if (!raw) {
      const derived: MediaAsset[] = INITIAL_PRODUCTS.flatMap((p) =>
        p.images.map((img) => ({
          id: img.id,
          url: img.url,
          storagePath: img.storagePath || `products/${p.id}/${img.id}.webp`,
          folder: 'products' as const,
          name: `${p.slug}.webp`,
          linkedTo: p.name,
          createdAt: p.createdAt,
        }))
      );
      localStorage.setItem(KEYS.MEDIA, JSON.stringify(derived));
      return derived;
    }
    return JSON.parse(raw) as MediaAsset[];
  } catch {
    return [];
  }
}

export function saveLocalMediaAssets(assets: MediaAsset[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.MEDIA, JSON.stringify(assets));
  notifyStoreUpdate();
}

export function getLocalAppointments(): Appointment[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEYS.APPOINTMENTS);
    return raw ? (JSON.parse(raw) as Appointment[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalAppointments(appointments: Appointment[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(appointments));
  notifyStoreUpdate();
}

export function getLocalAppointmentSlots(): AppointmentSlot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEYS.APPOINTMENT_SLOTS);
    return raw ? (JSON.parse(raw) as AppointmentSlot[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalAppointmentSlots(slots: AppointmentSlot[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.APPOINTMENT_SLOTS, JSON.stringify(slots));
  notifyStoreUpdate();
}

export function resetLocalDemoData(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_GLOBAL_SETTINGS));
  localStorage.removeItem(KEYS.MEDIA);
  localStorage.removeItem(KEYS.APPOINTMENTS);
  localStorage.removeItem(KEYS.APPOINTMENT_SLOTS);
  notifyStoreUpdate();
}

