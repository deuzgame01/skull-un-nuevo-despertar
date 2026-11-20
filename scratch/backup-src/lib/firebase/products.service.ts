import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { Product, ProductImage } from '@/types/database.types';
import type { ProductFormValues } from '@/schemas/product.schema';
import { db, isFirebaseConfigured } from './config';
import { getLocalProducts, saveLocalProducts } from './local-store';
import { getCategories } from './categories.service';
import { buildSearchKeywords, slugify } from '@/lib/utils/slugify';
import { deleteImageFromStorage } from './storage.service';
import { assertAdminAuthorized } from './auth-guard';

const COLLECTION = 'products';

export async function getProducts(): Promise<Product[]> {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Product, 'id'>),
    }));
  }
  return [...getLocalProducts()].sort((a, b) => b.createdAt - a.createdAt);
}

export async function getActiveProducts(): Promise<Product[]> {
  const all = await getProducts();
  return all.filter((p) => p.isActive);
}

export async function getFeaturedProducts(limitCount = 6): Promise<Product[]> {
  const active = await getActiveProducts();
  return active.filter((p) => p.isFeatured).slice(0, limitCount);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const all = await getProducts();
  return all.find((p) => p.slug === slug) || null;
}

export async function getProductById(id: string): Promise<Product | null> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, COLLECTION, id));
      if (snap.exists()) {
        return { id: snap.id, ...(snap.data() as Omit<Product, 'id'>) };
      }
    } catch (error) {
      console.error(
        '[SKULL Products] Error obteniendo producto por ID:',
        error
      );
    }
  }
  const all = getLocalProducts();
  return all.find((p) => p.id === id) || null;
}

export async function getRecommendedProducts(
  currentProduct: Product,
  limitCount = 4
): Promise<Product[]> {
  const active = await getActiveProducts();
  const candidates = active.filter((p) => p.id !== currentProduct.id);

  const scored = candidates.map((item) => {
    let score = 0;
    if (item.categoryId === currentProduct.categoryId) score += 3;
    const sharedZones = item.bodyZone.filter((z) =>
      currentProduct.bodyZone.includes(z)
    );
    score += sharedZones.length * 2;
    if (item.isFeatured) score += 1;
    return { item, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limitCount)
    .map((entry) => entry.item);
}

function validateProductIntegrity(
  values: ProductFormValues,
  existingProducts: Product[],
  currentProductId?: string
): void {
  const cleanName = (values.name || '').trim();
  if (cleanName.length < 3) {
    throw new Error('El nombre del producto debe tener al menos 3 caracteres.');
  }

  const numericPrice = Number(values.price);
  if (!Number.isFinite(numericPrice) || numericPrice < 100) {
    throw new Error(
      'Precio inválido: Ingresa un valor numérico válido mayor o igual a $100 COP.'
    );
  }

  if (
    values.compareAtPrice !== null &&
    values.compareAtPrice !== undefined &&
    Number(values.compareAtPrice) > 0 &&
    Number(values.compareAtPrice) <= numericPrice
  ) {
    throw new Error(
      'El precio anterior de comparación debe ser mayor que el precio actual.'
    );
  }

  if (!values.categoryId || !values.categoryId.trim()) {
    throw new Error('Debes seleccionar una categoría válida para el producto.');
  }

  // Evitar productos duplicados por errores de doble envío o nombres repetidos
  const duplicateByName = existingProducts.find(
    (p) =>
      p.id !== currentProductId &&
      p.name.trim().toLowerCase() === cleanName.toLowerCase()
  );
  if (duplicateByName) {
    throw new Error(
      `Ya existe un producto llamado "${duplicateByName.name}". Evita duplicados o edita el producto existente.`
    );
  }

  const cleanSku = (values.sku || '').trim();
  if (cleanSku) {
    const duplicateBySku = existingProducts.find(
      (p) =>
        p.id !== currentProductId &&
        p.sku &&
        p.sku.trim().toLowerCase() === cleanSku.toLowerCase()
    );
    if (duplicateBySku) {
      throw new Error(
        `El código SKU "${cleanSku}" ya está asignado al producto "${duplicateBySku.name}".`
      );
    }
  }
}

function normalizeGalleryImages(images: ProductImage[]): {
  normalizedImages: ProductImage[];
  thumbnailUrl: string;
} {
  if (!images || images.length === 0) {
    return {
      normalizedImages: [],
      thumbnailUrl: '/images/logo-skull.png',
    };
  }

  const hasPrimary = images.some((img) => img.isPrimary);
  const normalizedImages = images.map((img, idx) => ({
    ...img,
    isPrimary: hasPrimary ? Boolean(img.isPrimary) : idx === 0,
  }));

  const primaryImage =
    normalizedImages.find((img) => img.isPrimary) || normalizedImages[0];

  return {
    normalizedImages,
    thumbnailUrl: primaryImage?.url || '/images/logo-skull.png',
  };
}

export async function createProduct(
  values: ProductFormValues,
  images: ProductImage[]
): Promise<Product> {
  await assertAdminAuthorized('crear producto');

  const [existingProducts, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  validateProductIntegrity(values, existingProducts);

  const category =
    categories.find((c) => c.id === values.categoryId) || categories[0];

  const baseSlug = slugify(values.slug?.trim() || values.name);
  const slugCollision = existingProducts.some((p) => p.slug === baseSlug);
  const finalSlug = slugCollision
    ? `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
    : baseSlug;

  const now = Date.now();
  const id = `prod-${finalSlug}-${now.toString(36).slice(-4)}`;

  const { normalizedImages, thumbnailUrl } = normalizeGalleryImages(images);

  const newProduct: Product = {
    id,
    name: values.name.trim(),
    slug: finalSlug,
    sku: values.sku?.trim() || '',
    shortDescription: values.shortDescription.trim(),
    description: values.description.trim(),
    price: Number(values.price),
    compareAtPrice: values.compareAtPrice
      ? Number(values.compareAtPrice)
      : null,
    currency: 'COP',
    categoryId: category?.id || values.categoryId,
    categoryName: category?.name || 'General',
    categorySlug: category?.slug || 'general',
    material: values.material.trim(),
    bodyZone: values.bodyZone || [],
    gauge: values.gauge?.trim() || '',
    sizes: values.sizes || [],
    color: values.color?.trim() || '',
    images: normalizedImages,
    thumbnailUrl,
    isActive: Boolean(values.isActive),
    isFeatured: Boolean(values.isFeatured),
    stockStatus: values.stockStatus,
    searchKeywords: buildSearchKeywords([
      values.name,
      values.sku,
      category?.name,
      values.material,
      values.bodyZone,
      values.color,
      values.gauge,
    ]),
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, COLLECTION, id), newProduct);
  }

  saveLocalProducts([newProduct, ...existingProducts]);
  return newProduct;
}

export async function updateProduct(
  id: string,
  values: ProductFormValues,
  images: ProductImage[]
): Promise<Product> {
  await assertAdminAuthorized('editar producto');

  const [existingProducts, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  const current = existingProducts.find((p) => p.id === id);
  if (!current) {
    throw new Error('Producto no encontrado en el catálogo.');
  }

  validateProductIntegrity(values, existingProducts, id);

  const category = categories.find((c) => c.id === values.categoryId);
  const { normalizedImages, thumbnailUrl } = normalizeGalleryImages(images);

  // Limpiar imágenes huérfanas que fueron removidas de este producto
  const removedImages = (current.images || []).filter(
    (oldImg) =>
      oldImg.storagePath &&
      !normalizedImages.some((newImg) => newImg.storagePath === oldImg.storagePath)
  );
  for (const orphan of removedImages) {
    if (orphan.storagePath) {
      await deleteImageFromStorage(orphan.storagePath, {
        ignoreProductId: id,
        imageUrl: orphan.url,
      }).catch(() => null);
    }
  }

  const requestedSlug = values.slug?.trim()
    ? slugify(values.slug.trim())
    : current.name !== values.name.trim()
    ? slugify(values.name.trim())
    : current.slug;

  const slugCollision = existingProducts.some(
    (p) => p.id !== id && p.slug === requestedSlug
  );
  const finalSlug = slugCollision
    ? `${requestedSlug}-${id.slice(-4)}`
    : requestedSlug;

  const updated: Product = {
    ...current,
    name: values.name.trim(),
    slug: finalSlug,
    sku: values.sku?.trim() || '',
    shortDescription: values.shortDescription.trim(),
    description: values.description.trim(),
    price: Number(values.price),
    compareAtPrice: values.compareAtPrice
      ? Number(values.compareAtPrice)
      : null,
    currency: 'COP',
    categoryId: category?.id || values.categoryId,
    categoryName: category?.name || current.categoryName,
    categorySlug: category?.slug || current.categorySlug,
    material: values.material.trim(),
    bodyZone: values.bodyZone || [],
    gauge: values.gauge?.trim() || '',
    sizes: values.sizes || [],
    color: values.color?.trim() || '',
    images: normalizedImages,
    thumbnailUrl,
    isActive: Boolean(values.isActive),
    isFeatured: Boolean(values.isFeatured),
    stockStatus: values.stockStatus,
    searchKeywords: buildSearchKeywords([
      values.name,
      values.sku,
      category?.name || current.categoryName,
      values.material,
      values.bodyZone,
      values.color,
      values.gauge,
    ]),
    updatedAt: Date.now(),
  };

  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COLLECTION, id), { ...updated });
  }

  const nextList = existingProducts.map((p) => (p.id === id ? updated : p));
  saveLocalProducts(nextList);
  return updated;
}

export async function toggleProductField(
  id: string,
  field: 'isActive' | 'isFeatured',
  value: boolean
): Promise<void> {
  await assertAdminAuthorized('modificar estado de producto');

  const existing = await getProducts();
  const target = existing.find((p) => p.id === id);
  if (!target) {
    throw new Error('Producto no encontrado');
  }

  const updatedAt = Date.now();
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COLLECTION, id), { [field]: value, updatedAt });
  }

  saveLocalProducts(
    existing.map((p) => (p.id === id ? { ...p, [field]: value, updatedAt } : p))
  );
}

export async function deleteProduct(id: string): Promise<void> {
  await assertAdminAuthorized('eliminar producto');

  const existing = await getProducts();
  const target = existing.find((p) => p.id === id);

  // Eliminar de Firebase Storage las imágenes asociadas que no estén siendo utilizadas por otro producto/categoría
  if (target?.images?.length) {
    for (const img of target.images) {
      if (img.storagePath) {
        await deleteImageFromStorage(img.storagePath, {
          ignoreProductId: id,
          imageUrl: img.url,
        }).catch(() => null);
      }
    }
  }

  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, COLLECTION, id));
  }

  saveLocalProducts(existing.filter((p) => p.id !== id));
}
