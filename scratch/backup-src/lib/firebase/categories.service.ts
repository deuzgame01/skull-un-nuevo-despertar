import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { Category, Product } from '@/types/database.types';
import type { CategoryFormValues } from '@/schemas/category.schema';
import { db, isFirebaseConfigured } from './config';
import {
  getLocalCategories,
  getLocalProducts,
  saveLocalCategories,
  saveLocalProducts,
} from './local-store';
import { slugify } from '@/lib/utils/slugify';
import { assertAdminAuthorized } from './auth-guard';
import { deleteImageFromStorage } from './storage.service';

const COLLECTION = 'categories';

export async function getCategories(): Promise<Category[]> {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, COLLECTION), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Category, 'id'>),
    }));
  }
  return [...getLocalCategories()].sort((a, b) => a.order - b.order);
}

export async function getActiveCategories(): Promise<Category[]> {
  const all = await getCategories();
  return all.filter((cat) => cat.isActive).sort((a, b) => a.order - b.order);
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  const all = await getCategories();
  return all.find((c) => c.slug === slug) || null;
}

export async function createCategory(
  values: CategoryFormValues
): Promise<Category> {
  await assertAdminAuthorized('crear categoría');

  const cleanName = (values.name || '').trim();
  if (cleanName.length < 2) {
    throw new Error('El nombre de la categoría debe tener al menos 2 caracteres.');
  }

  const existing = await getCategories();
  const duplicate = existing.find(
    (c) => c.name.trim().toLowerCase() === cleanName.toLowerCase()
  );
  if (duplicate) {
    throw new Error(`Ya existe una categoría llamada "${duplicate.name}".`);
  }

  const baseSlug = slugify(values.slug || cleanName);
  const slugExists = existing.some((c) => c.slug === baseSlug);
  const finalSlug = slugExists
    ? `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
    : baseSlug;

  const now = Date.now();
  const id = `cat-${finalSlug}-${now.toString(36).slice(-4)}`;

  const newCategory: Category = {
    id,
    name: cleanName,
    slug: finalSlug,
    description: values.description?.trim() || '',
    imageUrl: values.imageUrl || '',
    imagePath: values.imagePath || '',
    order: Number(values.order) || existing.length + 1,
    isActive: values.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, COLLECTION, id), newCategory);
  }
  saveLocalCategories([...existing, newCategory]);
  return newCategory;
}

export async function updateCategory(
  id: string,
  values: Partial<CategoryFormValues>
): Promise<Category> {
  await assertAdminAuthorized('editar categoría');

  const existing = await getCategories();
  const current = existing.find((c) => c.id === id);
  if (!current) {
    throw new Error('Categoría no encontrada');
  }

  const nextName =
    values.name !== undefined ? values.name.trim() : current.name;
  const nextSlug =
    values.slug && values.slug.trim() !== ''
      ? slugify(values.slug)
      : values.name
      ? slugify(values.name)
      : current.slug;

  const updated: Category = {
    ...current,
    ...values,
    name: nextName,
    slug: nextSlug,
    order: values.order !== undefined ? Number(values.order) : current.order,
    updatedAt: Date.now(),
  };

  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COLLECTION, id), { ...updated });

    // Si cambió el nombre o el slug, sincronizar los productos asociados en Firestore
    if (current.name !== updated.name || current.slug !== updated.slug) {
      const prodSnap = await getDocs(collection(db, 'products'));
      for (const pDoc of prodSnap.docs) {
        const pData = pDoc.data() as Product;
        if (pData.categoryId === id) {
          await updateDoc(doc(db, 'products', pDoc.id), {
            categoryName: updated.name,
            categorySlug: updated.slug,
            updatedAt: Date.now(),
          });
        }
      }
    }
  }

  const nextList = existing.map((c) => (c.id === id ? updated : c));
  saveLocalCategories(nextList);

  const products = getLocalProducts();
  const updatedProducts = products.map((p) =>
    p.categoryId === id
      ? { ...p, categoryName: updated.name, categorySlug: updated.slug }
      : p
  );
  saveLocalProducts(updatedProducts);

  return updated;
}

/**
 * Cambia el orden de una categoría (subir o bajar posición) y actualiza Firestore.
 */
export async function reorderCategory(
  id: string,
  direction: 'up' | 'down'
): Promise<void> {
  await assertAdminAuthorized('ordenar categorías');

  const sorted = [...(await getCategories())].sort((a, b) => a.order - b.order);
  const index = sorted.findIndex((c) => c.id === id);
  if (index === -1) return;

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= sorted.length) return;

  // Intercambiar posiciones en el arreglo y normalizar orden 1..N
  const temp = sorted[index];
  sorted[index] = sorted[targetIndex];
  sorted[targetIndex] = temp;

  const now = Date.now();
  const normalized = sorted.map((cat, idx) => ({
    ...cat,
    order: idx + 1,
    updatedAt: now,
  }));

  if (isFirebaseConfigured && db) {
    const firestore = db;
    await Promise.all(
      normalized.map((cat) =>
        updateDoc(doc(firestore, COLLECTION, cat.id), {
          order: cat.order,
          updatedAt: now,
        })
      )
    );
  }

  saveLocalCategories(normalized);
}

/**
 * Elimina una categoría. Si la categoría tiene productos asociados, exige
 * una categoría destino (`reassignToCategoryId`) para reasignarlos antes de borrar.
 */
export async function deleteCategory(
  id: string,
  reassignToCategoryId?: string
): Promise<{ reassignedCount: number }> {
  await assertAdminAuthorized('eliminar categoría');

  const categories = await getCategories();
  const categoryToDelete = categories.find((c) => c.id === id);
  if (!categoryToDelete) {
    throw new Error('La categoría que intentas eliminar no existe.');
  }

  // Consultar productos en Firestore para verificar si existen productos asociados
  let allProducts: Product[] = [];
  if (isFirebaseConfigured && db) {
    const prodSnap = await getDocs(collection(db, 'products'));
    allProducts = prodSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Product, 'id'>),
    }));
  } else {
    allProducts = getLocalProducts();
  }

  const associatedProducts = allProducts.filter((p) => p.categoryId === id);

  if (associatedProducts.length > 0) {
    if (!reassignToCategoryId || reassignToCategoryId === id) {
      throw new Error(
        `No se puede eliminar "${categoryToDelete.name}" porque tiene ${associatedProducts.length} producto(s) asociado(s). Selecciona primero una categoría destino para reasignarlos.`
      );
    }

    const targetCategory = categories.find(
      (c) => c.id === reassignToCategoryId
    );
    if (!targetCategory) {
      throw new Error('La categoría destino seleccionada no es válida.');
    }

    const now = Date.now();
    if (isFirebaseConfigured && db) {
      const firestore = db;
      await Promise.all(
        associatedProducts.map((prod) =>
          updateDoc(doc(firestore, 'products', prod.id), {
            categoryId: targetCategory.id,
            categoryName: targetCategory.name,
            categorySlug: targetCategory.slug,
            updatedAt: now,
          })
        )
      );
    }

    const localProds = getLocalProducts();
    saveLocalProducts(
      localProds.map((p) =>
        p.categoryId === id
          ? {
              ...p,
              categoryId: targetCategory.id,
              categoryName: targetCategory.name,
              categorySlug: targetCategory.slug,
              updatedAt: now,
            }
          : p
      )
    );
  }

  // Limpiar imagen de portada si no está en uso por otra entidad
  if (categoryToDelete.imagePath) {
    await deleteImageFromStorage(categoryToDelete.imagePath, {
      ignoreCategoryId: id,
      imageUrl: categoryToDelete.imageUrl,
    }).catch(() => null);
  }

  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, COLLECTION, id));
  }

  saveLocalCategories(categories.filter((c) => c.id !== id));
  return { reassignedCount: associatedProducts.length };
}
