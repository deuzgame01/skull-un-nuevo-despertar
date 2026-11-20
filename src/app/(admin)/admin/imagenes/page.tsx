'use client';

import React, { useEffect, useState } from 'react';
import {
  Camera,
  Check,
  Copy,
  Image as ImageIcon,
  Loader2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { MediaAsset } from '@/types/database.types';
import { getLocalMediaAssets } from '@/lib/firebase/local-store';
import {
  deleteImageFromStorage,
  uploadOptimizedImage,
  validateImageFile,
} from '@/lib/firebase/storage.service';

export default function AdminImagesPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteAsset, setConfirmDeleteAsset] =
    useState<MediaAsset | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAssets = () => {
    setAssets(getLocalMediaAssets());
  };

  useEffect(() => {
    loadAssets();
    window.addEventListener('skull-store-updated', loadAssets);
    return () => window.removeEventListener('skull-store-updated', loadAssets);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        validateImageFile(files[i]);
        validFiles.push(files[i]);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Archivo no válido';
        toast.error(msg);
      }
    }

    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    setUploading(true);
    setUploadProgress(5);
    try {
      for (let i = 0; i < validFiles.length; i++) {
        await uploadOptimizedImage(
          validFiles[i],
          'products',
          'Biblioteca SKULL',
          (pct) => {
            const overall = Math.round(
              ((i + pct / 100) / validFiles.length) * 100
            );
            setUploadProgress(Math.max(5, Math.min(100, overall)));
          }
        );
      }
      loadAssets();
      toast.success('Fotografías optimizadas en WebP');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error al subir imágenes';
      toast.error(msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleCopyUrl = async (asset: MediaAsset) => {
    await navigator.clipboard.writeText(asset.url);
    setCopiedId(asset.id);
    toast.success('URL de imagen copiada');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const executeDelete = async () => {
    if (!confirmDeleteAsset || deleting) return;
    setDeleting(true);
    try {
      await deleteImageFromStorage(confirmDeleteAsset.storagePath, {
        imageUrl: confirmDeleteAsset.url,
      });
      loadAssets();
      toast.success('Imagen eliminada de Firebase Storage');
      setConfirmDeleteAsset(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'No se pudo eliminar la imagen';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7DFD3] pb-4">
        <div>
          <span className="text-[11px] uppercase tracking-[0.22em] text-[#9A7B4F]">
            Activos Optimizados • WebP
          </span>
          <h1 className="font-display text-2xl font-medium text-[#21162C]">
            Biblioteca de Imágenes
          </h1>
        </div>

        <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm btn-skull-primary text-xs uppercase tracking-[0.18em] font-semibold">
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#21162C]" />
          ) : (
            <Camera className="w-3.5 h-3.5 text-[#21162C]" />
          )}
          <span className="text-[#21162C]">
            {uploading
              ? `Optimizando (${uploadProgress}%)...`
              : 'Subir Fotografías'}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {uploading && (
        <div className="p-3.5 rounded-sm bg-white border border-[#3B1D5A] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#21162C]">
            <span>Comprimiendo y subiendo a Firebase Storage...</span>
            <span className="font-mono text-[#9A7B4F]">{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#F1ECE5] overflow-hidden border border-[#E7DFD3]">
            <div
              className="h-full bg-[#C8A97E] transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {confirmDeleteAsset && (
        <div className="p-4 rounded-sm bg-rose-950/60 border border-rose-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-[#21162C]">
            ¿Deseas eliminar permanentemente{' '}
            <span className="font-semibold">
              &ldquo;{confirmDeleteAsset.name}&rdquo;
            </span>
            ? Si está siendo utilizada por un producto o categoría, se protegerá
            automáticamente.
          </p>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setConfirmDeleteAsset(null)}
              disabled={deleting}
              className="px-3.5 py-2 rounded-sm btn-skull-secondary text-xs uppercase tracking-wider"
            >
              <span className="text-[#21162C]">Cancelar</span>
            </button>
            <button
              type="button"
              onClick={executeDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-sm bg-rose-700 hover:bg-rose-600 border border-rose-400 text-xs uppercase tracking-wider font-semibold text-[#21162C] inline-flex items-center gap-1.5"
            >
              {deleting && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#21162C]" />
              )}
              <span className="text-[#21162C]">Eliminar</span>
            </button>
          </div>
        </div>
      )}

      {assets.length === 0 ? (
        <div className="p-12 rounded-sm bg-white border border-[#E7DFD3] text-center space-y-3">
          <ImageIcon className="w-8 h-8 text-[#9A7B4F] mx-auto" />
          <p className="text-sm font-medium text-[#21162C]">
            No hay activos registrados en la biblioteca
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="rounded-sm overflow-hidden bg-white border border-[#E7DFD3] flex flex-col"
            >
              <div className="relative aspect-square bg-[#F1ECE5] overflow-hidden border-b border-[#E7DFD3]">
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#F6F3EE]/90 border border-[#5B2B84]/35 font-mono text-[10px] uppercase text-[#9A7B4F]">
                  {asset.folder}
                </span>
              </div>

              <div className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#21162C] truncate">
                    {asset.linkedTo || asset.name}
                  </p>
                  <p className="font-mono text-[10px] text-[#5A4F66] truncate">
                    {asset.name}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(asset)}
                    className="p-2 rounded-sm bg-[#F1ECE5] border border-[#DCCFC0] text-[#21162C] hover:border-[#5B2B84]"
                    title="Copiar URL"
                  >
                    {copiedId === asset.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-[#21162C]" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAsset(asset)}
                    className="p-2 rounded-sm bg-[#F1ECE5] border border-[#DCCFC0] text-[#21162C] hover:bg-rose-900"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
