import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { BrandSettings, GlobalSettings, WhatsAppSettings } from '@/types/database.types';
import { db, isFirebaseConfigured } from './config';
import { getLocalSettings, saveLocalSettings } from './local-store';
import { DEFAULT_GLOBAL_SETTINGS, INITIAL_CATEGORIES, INITIAL_PRODUCTS } from './seed-data';
import { assertAdminAuthorized } from './auth-guard';
import {
  normalizeHomeSections,
  normalizeTrustLayout,
} from '@/lib/home-sections';
import { normalizeWhatsAppPhone } from '@/lib/utils/whatsapp';

const SETTINGS_DOC_PATH = ['settings', 'global'] as const;

export async function getGlobalSettings(): Promise<GlobalSettings> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, ...SETTINGS_DOC_PATH));
      if (snap.exists()) {
        const data = snap.data() as Partial<GlobalSettings>;
        const mergedBrand = {
          ...DEFAULT_GLOBAL_SETTINGS.brand,
          ...(data.brand || {}),
        };
        if (!mergedBrand.heroSlides || mergedBrand.heroSlides.length === 0) {
          mergedBrand.heroSlides = DEFAULT_GLOBAL_SETTINGS.brand.heroSlides;
        }
        mergedBrand.homeSections = normalizeHomeSections(mergedBrand.homeSections);
        mergedBrand.trustLayout = normalizeTrustLayout(mergedBrand.trustLayout);
        return {
          brand: mergedBrand,
          whatsapp: { ...DEFAULT_GLOBAL_SETTINGS.whatsapp, ...(data.whatsapp || {}) },
          updatedAt: data.updatedAt || Date.now(),
        };
      }
    } catch (error) {
      console.error('[SKULL Settings] Error leyendo Firestore:', error);
    }
  }
  return getLocalSettings();
}

export async function updateBrandSettings(brand: BrandSettings): Promise<GlobalSettings> {
  await assertAdminAuthorized('modificar configuración de marca');
  const current = await getGlobalSettings();
  const updated: GlobalSettings = {
    ...current,
    brand: {
      ...brand,
      homeSections: normalizeHomeSections(brand.homeSections),
      trustLayout: normalizeTrustLayout(brand.trustLayout),
    },
    updatedAt: Date.now(),
  };

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, ...SETTINGS_DOC_PATH), updated, { merge: true });
  }
  saveLocalSettings(updated);
  return updated;
}

export async function updateWhatsAppSettings(
  whatsapp: WhatsAppSettings
): Promise<GlobalSettings> {
  await assertAdminAuthorized('modificar configuración de WhatsApp');

  const normalizedPhone = normalizeWhatsAppPhone(whatsapp.phoneNumber);
  if (!normalizedPhone) {
    throw new Error(
      'Ingresa un número de WhatsApp válido con código de país (ej: 573001234567).'
    );
  }

  const current = await getGlobalSettings();
  const updated: GlobalSettings = {
    ...current,
    whatsapp: {
      ...whatsapp,
      phoneNumber: normalizedPhone,
    },
    updatedAt: Date.now(),
  };

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, ...SETTINGS_DOC_PATH), updated, { merge: true });
  }
  saveLocalSettings(updated);
  return updated;
}

/**
 * Siembra el catálogo inicial de SKULL en Firestore con un clic desde el panel Admin.
 */
export async function seedInitialCatalogToFirestore(): Promise<void> {
  await assertAdminAuthorized('sincronizar catálogo inicial');
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, ...SETTINGS_DOC_PATH), DEFAULT_GLOBAL_SETTINGS, { merge: true });
    for (const category of INITIAL_CATEGORIES) {
      await setDoc(doc(db, 'categories', category.id), category);
    }
    for (const product of INITIAL_PRODUCTS) {
      await setDoc(doc(db, 'products', product.id), product);
    }
  }
  saveLocalSettings(DEFAULT_GLOBAL_SETTINGS);
}

