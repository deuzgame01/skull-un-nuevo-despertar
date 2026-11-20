'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Star,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { productSchema, type ProductFormValues } from '@/schemas/product.schema';
import type { Product, ProductImage } from '@/types/database.types';
import { useCatalog } from '@/context/CatalogContext';
import {
  createProductImageObject,
  deleteImageFromStorage,
  uploadOptimizedImage,
  validateImageFile,
} from '@/lib/firebase/storage.service';
import { createProduct, updateProduct } from '@/lib/firebase/products.service';
import { slugify } from '@/lib/utils/slugify';

const PRESET_ZONES = [
  'Septum',
  'Daith',
  'Helix',
  'Conch',
  'Tragus',
  'Flat',
  'Nostril',
  'Medusa / Philtrum',
  'Labret',
  'Microdermal',
  'Industrial',
  'Lóbulo',
];

const PRESET_SIZES = [
  '4mm',
  '5mm',
  '6mm',
  '7mm',
  '8mm',
  '10mm',
  '12mm',
  '14mm',
];

const PRESET_MATERIALS = [
  'Titanio Grado Implante (ASTM F-136)',
  'Acero Quirúrgico 316LVM',
  'Oro Sólido 14K Biocompatible',
  'Niobio Anodizado',
  'Cristal / Cuarzo Natural',
  'Solución Isotónica Estéril 0.9% NaCl',
];

const PRESET_GAUGES = [
  '16G (1.2mm)',
  '18G (1.0mm)',
  '14G (1.6mm)',
  '20G (0.8mm)',
  '12G (2.0mm)',
  'N/A',
];

interface ProductFormProps {
  initialProduct?: Product;
}

export function ProductForm({ initialProduct }: ProductFormProps) {
  const router = useRouter();
  const { categories, refreshCatalog } = useCatalog();
  const submitLockRef = useRef(false);

  const [images, setImages] = useState<ProductImage[]>(
    initialProduct?.images && initialProduct.images.length > 0
      ? initialProduct.images
      : initialProduct?.thumbnailUrl
      ? [
          {
            id: 'img-primary-init',
            url: initialProduct.thumbnailUrl,
            storagePath: '',
            isPrimary: true,
            name: 'Imagen principal',
          },
        ]
      : []
  );

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [confirmRemoveImgId, setConfirmRemoveImgId] = useState<string | null>(
    null
  );
  const [externalImageUrl, setExternalImageUrl] = useState('');
  const [customSizeInput, setCustomSizeInput] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialProduct?.name || '',
      slug: initialProduct?.slug || '',
      sku: initialProduct?.sku || '',
      shortDescription: initialProduct?.shortDescription || '',
      description: initialProduct?.description || '',
      price: initialProduct?.price ?? 75000,
      compareAtPrice: initialProduct?.compareAtPrice ?? null,
      currency: 'COP',
      categoryId: initialProduct?.categoryId || categories[0]?.id || '',
      material:
        initialProduct?.material || 'Titanio Grado Implante (ASTM F-136)',
      bodyZone: initialProduct?.bodyZone || ['Septum'],
      gauge: initialProduct?.gauge || '16G (1.2mm)',
      sizes: initialProduct?.sizes || ['8mm'],
      color: initialProduct?.color || 'Plata / Natural',
      isActive: initialProduct?.isActive ?? true,
      isFeatured: initialProduct?.isFeatured ?? false,
      stockStatus: initialProduct?.stockStatus || 'in_stock',
    },
  });

  const selectedZones = watch('bodyZone') || [];
  const selectedSizes = watch('sizes') || [];
  const productName = watch('name');
  const customSlug = watch('slug');

  const computedSlug = slugify(customSlug?.trim() || productName || 'pieza-skull');

  const toggleZone = (zone: string) => {
    const exists = selectedZones.includes(zone);
    const next = exists
      ? selectedZones.filter((z) => z !== zone)
      : [...selectedZones, zone];
    setValue('bodyZone', next, { shouldDirty: true });
  };

  const toggleSize = (size: string) => {
    const exists = selectedSizes.includes(size);
    const next = exists
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    setValue('sizes', next, { shouldDirty: true });
  };

  const addCustomSize = () => {
    const clean = customSizeInput.trim();
    if (!clean) return;
    if (!selectedSizes.includes(clean)) {
      setValue('sizes', [...selectedSizes, clean], { shouldDirty: true });
    }
    setCustomSizeInput('');
  };

  // Subida múltiple con validación de formato/tamaño, compresión WebP y barra de progreso
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setUploadError(null);

    // 1. Validar todos los archivos antes de subir
    for (const file of files) {
      try {
        validateImageFile(file);
      } catch (valErr: unknown) {
        const msg =
          valErr instanceof Error ? valErr.message : 'Archivo inválido';
        setUploadError(msg);
        toast.error(msg);
        e.target.value = '';
        return;
      }
    }

    setUploadingImage(true);
    setUploadProgress(5);

    try {
      const uploadedItems: ProductImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadStatusText(
          `Optimizando y subiendo (${i + 1}/${files.length}): ${file.name}`
        );

        const res = await uploadOptimizedImage(
          file,
          'products',
          productName || 'Producto SKULL',
          (filePercent) => {
            const overall = Math.round(
              ((i + filePercent / 100) / files.length) * 100
            );
            setUploadProgress(Math.max(5, Math.min(100, overall)));
          }
        );

        const isFirst = images.length === 0 && i === 0;
        uploadedItems.push(createProductImageObject(res, isFirst));
      }

      setImages((prev) => [...prev, ...uploadedItems]);
      toast.success(
        files.length === 1
          ? 'Imagen optimizada en WebP y cargada'
          : `${files.length} imágenes optimizadas y cargadas`
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Error al procesar y subir las imágenes';
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
      setUploadStatusText('');
      e.target.value = '';
    }
  };

  const handleAddExternalUrl = () => {
    const url = externalImageUrl.trim();
    if (!url) return;
    if (!/^https?:\/\/.+/i.test(url)) {
      toast.error('Ingresa una URL válida que comience con http:// o https://');
      return;
    }

    const newImg: ProductImage = {
      id: `img-ext-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      url,
      storagePath: '',
      isPrimary: images.length === 0,
      name: 'Imagen externa',
      createdAt: Date.now(),
    };
    setImages((prev) => [...prev, newImg]);
    setExternalImageUrl('');
    toast.success('Imagen agregada a la galería');
  };

  const handleSetPrimary = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      }))
    );
    toast.success('Establecida como imagen principal');
  };

  // Reordenamiento táctil de la galería
  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const executeRemoveImage = async (img: ProductImage) => {
    // Si es una imagen nueva aún no guardada en el producto inicial, eliminar de Storage si no está en uso
    const wasInInitialProduct = initialProduct?.images?.some(
      (old) => old.id === img.id
    );
    if (!wasInInitialProduct && img.storagePath) {
      await deleteImageFromStorage(img.storagePath, {
        ignoreProductId: initialProduct?.id,
        imageUrl: img.url,
      }).catch(() => null);
    }

    setImages((prev) => {
      const filtered = prev.filter((item) => item.id !== img.id);
      if (filtered.length > 0 && !filtered.some((i) => i.isPrimary)) {
        filtered[0] = { ...filtered[0], isPrimary: true };
      }
      return filtered;
    });
    setConfirmRemoveImgId(null);
    toast.success('Imagen removida de la galería');
  };

  const onSubmit = async (values: ProductFormValues) => {
    if (submitLockRef.current) return;

    if (images.length === 0) {
      toast.error('Debes agregar al menos 1 fotografía para el producto.');
      return;
    }

    submitLockRef.current = true;
    try {
      if (initialProduct) {
        await updateProduct(initialProduct.id, values, images);
        toast.success('Producto actualizado correctamente en Firestore');
      } else {
        await createProduct(values, images);
        toast.success('Producto creado y guardado en Firestore');
      }
      await refreshCatalog();
      router.push('/admin/productos');
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Error al guardar el producto';
      toast.error(msg);
    } finally {
      submitLockRef.current = false;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-12">
      {/* SECCIÓN 01: GALERÍA DE IMÁGENES E IMAGEN PRINCIPAL */}
      <section className="bg-[#0E0A14] border border-[#261C31] rounded-sm p-4 sm:p-6 space-y-4">
        <div className="border-b border-[#261C31] pb-3 flex items-center justify-between">
          <div>
            <span className="font-mono text-xs text-[#C8A97E]">
              SECCIÓN 01
            </span>
            <h2 className="font-display text-lg font-medium text-white">
              Imagen Principal y Galería ({images.length})
            </h2>
            <p className="text-xs text-zinc-300">
              Selecciona una o varias fotos desde tu celular. Se comprimen automáticamente a WebP (&lt; 300 KB).
            </p>
          </div>
        </div>

        {/* Alerta de error de subida */}
        {uploadError && (
          <div className="p-3 rounded-sm bg-rose-950/60 border border-rose-500/50 flex items-center gap-2 text-xs text-white">
            <AlertCircle className="w-4 h-4 text-rose-300 flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Barra de Progreso en Tiempo Real */}
        {uploadingImage && (
          <div className="p-3.5 rounded-sm bg-[#150E1D] border border-[#3A2B4C] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white flex items-center gap-2 truncate">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C8A97E] flex-shrink-0" />
                <span className="truncate">{uploadStatusText}</span>
              </span>
              <span className="font-mono text-[#C8A97E] font-semibold">
                {uploadProgress}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#070709] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C8A97E] transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Controles para Subir desde Celular o URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="cursor-pointer flex items-center justify-center gap-3 p-4 rounded-sm border border-dashed border-white/40 bg-[#150E1D] hover:border-white text-white active:scale-[0.99] editorial-transition">
            <Camera className="w-5 h-5 text-[#C8A97E]" />
            <div className="text-left">
              <span className="block text-xs uppercase tracking-wider font-semibold text-white">
                Elegir de Galería / Cámara
              </span>
              <span className="block text-[11px] text-zinc-300">
                JPG, PNG o WebP (Máx. 10 MB • Selección múltiple)
              </span>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              onChange={handleFileUpload}
              disabled={uploadingImage}
              className="hidden"
            />
          </label>

          <div className="flex items-center gap-2">
            <input
              type="url"
              value={externalImageUrl}
              onChange={(e) => setExternalImageUrl(e.target.value)}
              placeholder="O pegar URL de imagen (https://...)"
              className="flex-1 px-3.5 py-3 rounded-sm bg-[#070709] border border-[#3A2B4C] text-xs text-white placeholder:text-zinc-400 focus:outline-none focus:border-white"
            />
            <button
              type="button"
              onClick={handleAddExternalUrl}
              title="Agregar imagen por URL"
              className="px-4 py-3 rounded-sm btn-skull-primary text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5"
            >
              <ImagePlus className="w-4 h-4 text-white" />
              <span className="text-white">Añadir</span>
            </button>
          </div>
        </div>

        {/* Vista Previa de Galería con Selección de Principal, Orden y Eliminación */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className={`relative rounded-sm overflow-hidden border bg-[#070709] flex flex-col justify-between ${
                  img.isPrimary
                    ? 'border-[#C8A97E] ring-1 ring-[#C8A97E]/50'
                    : 'border-[#261C31]'
                }`}
              >
                <div className="relative aspect-square bg-[#150E1D]">
                  <img
                    src={img.url}
                    alt={img.name || `Imagen ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
                    <span className="px-2 py-0.5 bg-[#070709]/90 border border-white/25 font-mono text-[10px] text-white">
                      0{idx + 1}
                    </span>
                    {img.sizeBytes && (
                      <span className="px-1.5 py-0.5 bg-[#070709]/90 font-mono text-[10px] text-[#C8A97E]">
                        {Math.round(img.sizeBytes / 1024)} KB
                      </span>
                    )}
                  </div>
                </div>

                {/* Controles de cada imagen */}
                <div className="p-2 bg-[#0E0A14] border-t border-[#261C31] space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(img.id)}
                      className={`flex-1 py-1.5 px-2 rounded-sm text-[10px] uppercase tracking-wider font-medium flex items-center justify-center gap-1 ${
                        img.isPrimary
                          ? 'btn-skull-primary font-semibold'
                          : 'bg-[#070709] border border-[#3A2B4C] text-zinc-200 hover:text-white'
                      }`}
                    >
                      <Star className="w-3 h-3 text-[#C8A97E]" />
                      <span className="text-white">
                        {img.isPrimary ? 'Principal' : 'Hacer Principal'}
                      </span>
                    </button>
                  </div>

                  {/* Confirmación de eliminación individual o botones de orden */}
                  {confirmRemoveImgId === img.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => executeRemoveImage(img)}
                        className="flex-1 py-1 rounded-sm bg-rose-700 text-[10px] uppercase font-semibold text-white"
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmRemoveImgId(null)}
                        className="px-2 py-1 rounded-sm bg-[#150E1D] text-[10px] uppercase text-white"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveImage(idx, 'left')}
                          disabled={idx === 0}
                          aria-label="Mover imagen a la izquierda"
                          className="p-1.5 rounded-sm bg-[#150E1D] border border-[#3A2B4C] disabled:opacity-30 text-white"
                        >
                          <ArrowLeft className="w-3 h-3 text-white" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveImage(idx, 'right')}
                          disabled={idx === images.length - 1}
                          aria-label="Mover imagen a la derecha"
                          className="p-1.5 rounded-sm bg-[#150E1D] border border-[#3A2B4C] disabled:opacity-30 text-white"
                        >
                          <ArrowRight className="w-3 h-3 text-white" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setConfirmRemoveImgId(img.id)}
                        aria-label="Eliminar imagen"
                        className="p-1.5 rounded-sm bg-[#150E1D] border border-[#3A2B4C] hover:bg-rose-950/70 hover:border-rose-500 text-white"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECCIÓN 02: INFORMACIÓN PRINCIPAL, CATEGORÍA, PRECIO EN COP Y SLUG */}
      <section className="bg-[#0E0A14] border border-[#261C31] rounded-sm p-4 sm:p-6 space-y-4">
        <div className="border-b border-[#261C31] pb-3">
          <span className="font-mono text-xs text-[#C8A97E]">SECCIÓN 02</span>
          <h2 className="font-display text-lg font-medium text-white">
            Datos del Producto y Precio en COP
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs uppercase tracking-wider text-white">
              Nombre del Producto *
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="Ej: Clicker Imperial Amatista & Púas"
              className="w-full px-3.5 py-2.5 rounded-sm bg-[#070709] border border-[#3A2B4C] text-sm text-white focus:outline-none focus:border-white"
            />
            {errors.name && (
              <p className="text-xs text-rose-300">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-wider text-white">
              Referencia SKU (Opcional)
            </label>
            <input
              type="text"
              {...register('sku')}
              placeholder="SKL-008"
              className="w-full px-3.5 py-2.5 rounded-sm bg-[#070709] border border-[#3A2B4C] font-mono text-sm text-white focus:outline-none focus:border-white"
            />
            {errors.sku && (
              <p className="text-xs text-rose-300">{errors.sku.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-wider text-white">
              Categoría *
            </label>
            <select
              {...register('categoryId')}
              className="w-full px-3.5 py-2.5 rounded-sm bg-[#070709] border border-[#3A2B4C] text-sm text-white focus:outline-none focus:border-white"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="text-xs text-rose-300">
                {errors.categoryId.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-wider text-white">
              Precio en COP ($) *
            </label>
            <input
              type="number"
              min={100}
              step="100"
              {...register('price')}
              className="w-full px-3.5 py-2.5 rounded-sm bg-[#070709] border border-[#3A2B4C] font-mono text-sm text-white focus:outline-none focus:border-white"
            />
            {errors.price && (
              <p className="text-xs text-rose-300">{errors.price.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-wider text-white">
              Precio Anterior COP (Opcional)
            </label>
            <input
              type="number"
              min={0}
              step="100"
              {...register('compareAtPrice')}
              placeholder="Vacío si no tiene descuento"
              className="w-full px-3.5 py-2.5 rounded-sm bg-[#070709] border border-[#3A2B4C] font-mono text-sm text-white focus:outline-none focus:border-white"
            />
            {errors.compareAtPrice && (
              <p className="text-xs text-rose-300">
                {errors.compareAtPrice.message}
              </p>
            )}
          </div>
        </div>

        {/* Slug para URL Pública */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs uppercase tracking-wider text-white">
              Slug para URL Pública (Autogenerado o Personalizado)
            </label>
            <span className="font-mono text-[11px] text-[#C8A97E]">
              /producto/{computedSlug}
            </span>
          </div>
          <input
            type="text"
            {...register('slug')}
            placeholder={computedSlug}
            className="w-full px-3.5 py-2 rounded-sm bg-[#070709] border border-[#3A2B4C] font-mono text-xs text-white focus:outline-none focus:border-white"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs uppercase tracking-wider text-white">
            Resumen Corto *
          </label>
          <input
            type="text"
            {...register('shortDescription')}
            placeholder="Resumen breve para vista rápida y mensaje de WhatsApp"
            className="w-full px-3.5 py-2.5 rounded-sm bg-[#070709] border border-[#3A2B4C] text-sm text-white focus:outline-none focus:border-white"
          />
          {errors.shortDescription && (
            <p className="text-xs text-rose-300">
              {errors.shortDescription.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs uppercase tracking-wider text-white">
            Descripción Completa del Producto *
          </label>
          <textarea
            rows={4}
            {...register('description')}
            placeholder="Describe materiales, beneficios para la cicatrización y detalles del diseño..."
            className="w-full px-3.5 py-2.5 rounded-sm bg-[#070709] border border-[#3A2B4C] text-sm text-white focus:outline-none focus:border-white"
          />
          {errors.description && (
            <p className="text-xs text-rose-300">
              {errors.description.message}
            </p>
          )}
        </div>
      </section>

      {/* SECCIÓN 03: ESPECIFICACIONES DE JOYERÍA */}
      <section className="bg-[#0E0A14] border border-[#261C31] rounded-sm p-4 sm:p-6 space-y-5">
        <div className="border-b border-[#261C31] pb-3">
          <span className="font-mono text-xs text-[#C8A97E]">SECCIÓN 03</span>
          <h2 className="font-display text-lg font-medium text-white">
            Especificaciones Anatómicas y Técnicas
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-wider text-white">
              Material *
            </label>
            <input
              type="text"
              list="skull-materials"
              {...register('material')}
              className="w-full px-3.5 py-2.5 rounded-sm bg-[#070709] border border-[#3A2B4C] text-sm text-white focus:outline-none focus:border-white"
            />
            <datalist id="skull-materials">
              {PRESET_MATERIALS.map((mat) => (
                <option key={mat} value={mat} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-wider text-white">
              Calibre (Grosor)
            </label>
            <input
              type="text"
              list="skull-gauges"
              {...register('gauge')}
              className="w-full px-3.5 py-2.5 rounded-sm bg-[#070709] border border-[#3A2B4C] font-mono text-sm text-white focus:outline-none focus:border-white"
            />
            <datalist id="skull-gauges">
              {PRESET_GAUGES.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Zonas compatibles */}
        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-wider text-white">
            Zonas Anatómicas Compatibles (Toca para activar)
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_ZONES.map((zone) => {
              const active = selectedZones.includes(zone);
              return (
                <button
                  key={zone}
                  type="button"
                  onClick={() => toggleZone(zone)}
                  className={`px-3 py-1.5 rounded-sm text-xs font-medium flex items-center gap-1.5 editorial-transition ${
                    active
                      ? 'btn-skull-primary font-semibold'
                      : 'bg-[#070709] border border-[#3A2B4C] text-zinc-200 hover:text-white'
                  }`}
                >
                  {active && <Check className="w-3 h-3 text-white" />}
                  <span className="text-white">{zone}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Medidas */}
        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-wider text-white">
            Medidas / Diámetros Disponibles
          </label>
          <div className="flex flex-wrap gap-2 font-mono">
            {PRESET_SIZES.map((size) => {
              const active = selectedSizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`px-3 py-1.5 rounded-sm text-xs editorial-transition ${
                    active
                      ? 'btn-skull-primary font-semibold'
                      : 'bg-[#070709] border border-[#3A2B4C] text-zinc-200 hover:text-white'
                  }`}
                >
                  <span className="text-white">{size}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-1 max-w-xs">
            <input
              type="text"
              value={customSizeInput}
              onChange={(e) => setCustomSizeInput(e.target.value)}
              placeholder="Otra medida (ej. 120ml)"
              className="flex-1 px-3 py-1.5 rounded-sm bg-[#070709] border border-[#3A2B4C] font-mono text-xs text-white"
            />
            <button
              type="button"
              onClick={addCustomSize}
              className="px-3 py-1.5 rounded-sm btn-skull-secondary text-xs text-white flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span className="text-white">Añadir</span>
            </button>
          </div>
        </div>
      </section>

      {/* SECCIÓN 04: ESTADO DE PUBLICACIÓN Y AUDITORÍA */}
      <section className="bg-[#0E0A14] border border-[#261C31] rounded-sm p-4 sm:p-6 space-y-4">
        <div className="border-b border-[#261C31] pb-3">
          <span className="font-mono text-xs text-[#C8A97E]">SECCIÓN 04</span>
          <h2 className="font-display text-lg font-medium text-white">
            Estado de Publicación y Destacado
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-wider text-white">
              Disponibilidad de Inventario
            </label>
            <select
              {...register('stockStatus')}
              className="w-full px-3.5 py-2.5 rounded-sm bg-[#070709] border border-[#3A2B4C] text-sm text-white focus:outline-none focus:border-white"
            >
              <option value="in_stock">Disponible</option>
              <option value="low_stock">Últimas piezas (Pocas uds)</option>
              <option value="on_request">Bajo Pedido</option>
              <option value="out_of_stock">Agotado</option>
            </select>
          </div>

          <label className="flex items-center gap-3 p-3.5 rounded-sm bg-[#070709] border border-[#3A2B4C] cursor-pointer">
            <input
              type="checkbox"
              {...register('isActive')}
              className="w-4 h-4 accent-purple-500"
            />
            <div>
              <span className="block text-xs font-semibold text-white">
                Producto Activo (Publicado)
              </span>
              <span className="text-[11px] text-zinc-300">
                Visible en el catálogo público
              </span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3.5 rounded-sm bg-[#070709] border border-[#3A2B4C] cursor-pointer">
            <input
              type="checkbox"
              {...register('isFeatured')}
              className="w-4 h-4 accent-purple-500"
            />
            <div>
              <span className="block text-xs font-semibold text-white">
                Producto Destacado
              </span>
              <span className="text-[11px] text-zinc-300">
                Mostrar en sección destacada
              </span>
            </div>
          </label>
        </div>

        {/* Metadatos de Auditoría en Edición */}
        {initialProduct && (
          <div className="pt-3 border-t border-[#261C31] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-300">
            <span>ID: {initialProduct.id}</span>
            <span>
              Creado:{' '}
              {new Date(initialProduct.createdAt).toLocaleString('es-CO')}
            </span>
            <span>
              Actualizado:{' '}
              {new Date(initialProduct.updatedAt).toLocaleString('es-CO')}
            </span>
          </div>
        )}
      </section>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push('/admin/productos')}
          className="px-5 py-3 rounded-sm btn-skull-secondary text-xs uppercase tracking-wider"
        >
          <span className="text-white">Cancelar</span>
        </button>

        <button
          type="submit"
          disabled={isSubmitting || uploadingImage}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-sm btn-skull-primary disabled:opacity-50 text-xs uppercase tracking-[0.18em] font-semibold"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Save className="w-4 h-4 text-white" />
          )}
          <span className="text-white">
            {isSubmitting
              ? 'Guardando en Firestore...'
              : initialProduct
              ? 'Guardar Cambios'
              : 'Crear Producto'}
          </span>
        </button>
      </div>
    </form>
  );
}
