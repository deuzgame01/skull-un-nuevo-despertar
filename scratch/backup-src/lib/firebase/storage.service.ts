import imageCompression from 'browser-image-compression';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { collection, getDocs } from 'firebase/firestore';
import type {
  Category,
  MediaAsset,
  Product,
  ProductImage,
} from '@/types/database.types';
import { db, isFirebaseConfigured, storage } from './config';
import { getLocalMediaAssets, saveLocalMediaAssets } from './local-store';
import { assertAdminAuthorized } from './auth-guard';

export interface UploadResult {
  id: string;
  url: string;
  storagePath: string;
  sizeBytes: number;
  originalSizeBytes: number;
  name: string;
}

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
];

// Tamaño máximo permitido antes de comprimir (10 MB) y después de comprimir (5 MB)
export const MAX_RAW_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_OPTIMIZED_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Valida formato MIME y tamaño máximo del archivo seleccionado antes de procesarlo.
 */
export function validateImageFile(file: File): void {
  if (!file) {
    throw new Error('No se seleccionó ningún archivo de imagen.');
  }

  const mime = (file.type || '').toLowerCase();
  const validExtension = /\.(jpe?g|png|webp|avif|gif)$/i.test(file.name);

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mime) && !validExtension) {
    throw new Error(
      `Formato no permitido (${
        file.name
      }). Usa únicamente imágenes JPG, PNG, WebP o AVIF.`
    );
  }

  if (file.size <= 0) {
    throw new Error(`El archivo "${file.name}" está vacío o dañado.`);
  }

  if (file.size > MAX_RAW_IMAGE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `La imagen "${file.name}" (${sizeMB} MB) supera el límite máximo de 10 MB.`
    );
  }
}

/**
 * Comprime la foto tomada desde el celular a formato WebP ligero (<300 KB)
 * antes de subirla a Firebase Storage.
 */
export async function compressMobileImage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<File> {
  validateImageFile(file);

  const options = {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.82,
    onProgress: (p: number) => {
      if (onProgress) {
        // La compresión representa del 5% al 40% del progreso total
        onProgress(Math.round(5 + (p / 100) * 35));
      }
    },
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    const cleanName =
      file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .toLowerCase() + '.webp';
    const resultFile = new File([compressedBlob], cleanName, {
      type: 'image/webp',
    });

    if (resultFile.size > MAX_OPTIMIZED_IMAGE_BYTES) {
      throw new Error(
        `La imagen optimizada supera los 5 MB permitidos por Firebase Storage.`
      );
    }

    return resultFile;
  } catch (error) {
    if (error instanceof Error && error.message.includes('supera')) {
      throw error;
    }
    console.warn('[SKULL Image Compression] Usando archivo validado:', error);
    return file;
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () =>
      reject(new Error('No se pudo leer el archivo de imagen local.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadOptimizedImage(
  file: File,
  folder: 'products' | 'categories' | 'brand',
  entityName?: string,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  await assertAdminAuthorized('subir imagen');
  validateImageFile(file);

  if (onProgress) onProgress(5);
  const originalSizeBytes = file.size;
  const optimizedFile = await compressMobileImage(file, onProgress);

  const id = `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const safeName = optimizedFile.name.replace(/\s+/g, '-');
  const storagePath = `${folder}/${id}-${safeName}`;

  let url = '';

  if (isFirebaseConfigured && storage) {
    try {
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, optimizedFile, {
        contentType: optimizedFile.type || 'image/webp',
      });

      url = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            if (onProgress && snapshot.totalBytes > 0) {
              const transferRatio =
                snapshot.bytesTransferred / snapshot.totalBytes;
              // La subida a Firebase Storage representa del 40% al 98%
              onProgress(Math.round(40 + transferRatio * 58));
            }
          },
          (err) => {
            reject(err);
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadUrl);
            } catch (urlErr) {
              reject(urlErr);
            }
          }
        );
      });
    } catch (storageError) {
      console.warn(
        '[SKULL Storage] Fallback a DataURL optimizado:',
        storageError
      );
      url = await fileToDataUrl(optimizedFile);
    }
  } else {
    url = await fileToDataUrl(optimizedFile);
  }

  if (onProgress) onProgress(100);

  // Registrar en la biblioteca de medios para trazabilidad
  const currentAssets = getLocalMediaAssets();
  const newAsset: MediaAsset = {
    id,
    url,
    storagePath,
    folder,
    name: optimizedFile.name,
    linkedTo: entityName || 'Catálogo SKULL',
    createdAt: Date.now(),
  };
  saveLocalMediaAssets([newAsset, ...currentAssets]);

  return {
    id,
    url,
    storagePath,
    sizeBytes: optimizedFile.size,
    originalSizeBytes,
    name: optimizedFile.name,
  };
}

/**
 * Verifica si una imagen (por storagePath o URL) todavía está siendo utilizada
 * por algún producto o categoría en Cloud Firestore.
 */
export async function findEntitiesUsingImage(
  storagePath?: string,
  imageUrl?: string,
  options?: { ignoreProductId?: string; ignoreCategoryId?: string }
): Promise<string[]> {
  const usedBy: string[] = [];
  if (!storagePath && !imageUrl) return usedBy;

  if (isFirebaseConfigured && db) {
    try {
      const [prodSnap, catSnap] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'categories')),
      ]);

      prodSnap.docs.forEach((docSnap) => {
        if (options?.ignoreProductId && docSnap.id === options.ignoreProductId) {
          return;
        }
        const data = docSnap.data() as Product;
        const matchesThumb = imageUrl && data.thumbnailUrl === imageUrl;
        const matchesGallery = (data.images || []).some(
          (img) =>
            (storagePath && img.storagePath === storagePath) ||
            (imageUrl && img.url === imageUrl)
        );
        if (matchesThumb || matchesGallery) {
          usedBy.push(`Producto: "${data.name}"`);
        }
      });

      catSnap.docs.forEach((docSnap) => {
        if (
          options?.ignoreCategoryId &&
          docSnap.id === options.ignoreCategoryId
        ) {
          return;
        }
        const data = docSnap.data() as Category;
        if (
          (storagePath && data.imagePath === storagePath) ||
          (imageUrl && data.imageUrl === imageUrl)
        ) {
          usedBy.push(`Categoría: "${data.name}"`);
        }
      });
    } catch (error) {
      console.warn('[SKULL Storage] Error verificando uso de imagen:', error);
    }
  }

  return usedBy;
}

/**
 * Elimina una imagen de Firebase Storage y del registro de medios únicamente
 * si no está siendo utilizada por otros productos o categorías activas.
 */
export async function deleteImageFromStorage(
  storagePath: string,
  options?: {
    ignoreProductId?: string;
    ignoreCategoryId?: string;
    imageUrl?: string;
    force?: boolean;
  }
): Promise<void> {
  await assertAdminAuthorized('eliminar imagen');

  if (!options?.force) {
    const usedBy = await findEntitiesUsingImage(
      storagePath,
      options?.imageUrl,
      {
        ignoreProductId: options?.ignoreProductId,
        ignoreCategoryId: options?.ignoreCategoryId,
      }
    );

    if (usedBy.length > 0) {
      throw new Error(
        `No se puede eliminar esta imagen porque todavía está siendo utilizada en: ${usedBy.join(
          ', '
        )}.`
      );
    }
  }

  if (
    isFirebaseConfigured &&
    storage &&
    storagePath &&
    !storagePath.startsWith('data:')
  ) {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (error) {
      console.warn('[SKULL Storage] Objeto remoto ya no existe o local:', error);
    }
  }

  const currentAssets = getLocalMediaAssets();
  saveLocalMediaAssets(
    currentAssets.filter(
      (a) =>
        a.storagePath !== storagePath &&
        (!options?.imageUrl || a.url !== options.imageUrl)
    )
  );
}

export function createProductImageObject(
  upload: UploadResult,
  isPrimary = false
): ProductImage {
  return {
    id: upload.id,
    url: upload.url,
    storagePath: upload.storagePath,
    isPrimary,
    name: upload.name,
    sizeBytes: upload.sizeBytes,
    createdAt: Date.now(),
  };
}
