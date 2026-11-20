'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Category, GlobalSettings, Product } from '@/types/database.types';
import { DEFAULT_GLOBAL_SETTINGS } from '@/lib/firebase/seed-data';
import { getCategories } from '@/lib/firebase/categories.service';
import { getProducts } from '@/lib/firebase/products.service';
import { getGlobalSettings } from '@/lib/firebase/settings.service';

interface CatalogContextValue {
  products: Product[];
  activeProducts: Product[];
  featuredProducts: Product[];
  inactiveProducts: Product[];
  categories: Category[];
  activeCategories: Category[];
  settings: GlobalSettings;
  loading: boolean;
  error: string | null;
  refreshCatalog: () => Promise<void>;
}

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>(
    DEFAULT_GLOBAL_SETTINGS
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCatalog = useCallback(async () => {
    setError(null);
    try {
      const [fetchedProducts, fetchedCategories, fetchedSettings] =
        await Promise.all([
          getProducts(),
          getCategories(),
          getGlobalSettings(),
        ]);
      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
      setSettings(fetchedSettings);
    } catch (err: unknown) {
      console.error('[SKULL Catalog] Error cargando datos de Firestore:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'No se pudo sincronizar con Cloud Firestore.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCatalog();

    const handleStoreUpdate = () => {
      refreshCatalog();
    };
    window.addEventListener('skull-store-updated', handleStoreUpdate);
    return () =>
      window.removeEventListener('skull-store-updated', handleStoreUpdate);
  }, [refreshCatalog]);

  const activeProducts = products.filter((p) => p.isActive);
  const inactiveProducts = products.filter((p) => !p.isActive);
  const featuredProducts = products.filter((p) => p.isFeatured);
  const activeCategories = categories
    .filter((c) => c.isActive)
    .sort((a, b) => a.order - b.order);

  return (
    <CatalogContext.Provider
      value={{
        products,
        activeProducts,
        featuredProducts,
        inactiveProducts,
        categories,
        activeCategories,
        settings,
        loading,
        error,
        refreshCatalog,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error('useCatalog debe utilizarse dentro de un CatalogProvider');
  }
  return ctx;
}
