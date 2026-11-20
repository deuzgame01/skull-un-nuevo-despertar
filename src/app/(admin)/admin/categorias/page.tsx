'use client';

import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Camera,
  Edit3,
  Eye,
  EyeOff,
  FolderKanban,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCatalog } from '@/context/CatalogContext';
import type { Category } from '@/types/database.types';
import {
  createCategory,
  deleteCategory,
  reorderCategory,
  updateCategory,
} from '@/lib/firebase/categories.service';
import { uploadOptimizedImage } from '@/lib/firebase/storage.service';

export default function AdminCategoriesPage() {
  const { categories, products, loading, error, refreshCatalog } = useCatalog();
  const submitLockRef = useRef(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [order, setOrder] = useState<number>(categories.length + 1);
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<Category | null>(
    null
  );
  const [reassignTargetId, setReassignTargetId] = useState<string>('');
  const [deleting, setDeleting] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setImageUrl('');
    setImagePath('');
    setOrder(categories.length + 1);
    setIsActive(true);
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setImageUrl(cat.imageUrl || '');
    setImagePath(cat.imagePath || '');
    setOrder(cat.order);
    setIsActive(cat.isActive);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadOptimizedImage(
        file,
        'categories',
        name || 'Colección SKULL'
      );
      setImageUrl(res.url);
      setImagePath(res.storagePath);
      toast.success('Portada optimizada en WebP');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al subir imagen';
      toast.error(msg);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current || saving) return;
    if (!name.trim()) {
      toast.error('El nombre de la categoría es obligatorio');
      return;
    }
    submitLockRef.current = true;
    setSaving(true);
    try {
      if (editingId) {
        await updateCategory(editingId, {
          name,
          description,
          imageUrl,
          imagePath,
          order,
          isActive,
        });
        toast.success('Categoría actualizada');
      } else {
        await createCategory({
          name,
          description,
          imageUrl,
          imagePath,
          order,
          isActive,
        });
        toast.success('Nueva categoría creada');
      }
      await refreshCatalog();
      resetForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo guardar';
      toast.error(msg);
    } finally {
      setSaving(false);
      submitLockRef.current = false;
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      await updateCategory(cat.id, { isActive: !cat.isActive });
      await refreshCatalog();
      toast.success(
        !cat.isActive ? 'Categoría publicada' : 'Categoría ocultada'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar';
      toast.error(msg);
    }
  };

  const handleMoveCategory = async (
    id: string,
    direction: 'up' | 'down'
  ) => {
    if (reorderingId) return;
    setReorderingId(id);
    try {
      await reorderCategory(id, direction);
      await refreshCatalog();
      toast.success('Orden de categorías actualizado');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'No se pudo reordenar';
      toast.error(msg);
    } finally {
      setReorderingId(null);
    }
  };

  const openDeleteCategoryModal = (cat: Category) => {
    const fallbackCat = categories.find((c) => c.id !== cat.id);
    setReassignTargetId(fallbackCat ? fallbackCat.id : '');
    setConfirmDeleteCat(cat);
  };

  const executeDeleteCategory = async () => {
    if (!confirmDeleteCat || deleting) return;
    const assocCount = products.filter(
      (p) => p.categoryId === confirmDeleteCat.id
    ).length;

    if (assocCount > 0 && !reassignTargetId) {
      toast.error(
        'Debes seleccionar una categoría destino para reasignar los productos antes de eliminar.'
      );
      return;
    }

    setDeleting(true);
    try {
      const res = await deleteCategory(
        confirmDeleteCat.id,
        assocCount > 0 ? reassignTargetId : undefined
      );
      await refreshCatalog();
      if (res.reassignedCount > 0) {
        toast.success(
          `Categoría "${confirmDeleteCat.name}" eliminada y ${res.reassignedCount} producto(s) reasignados.`
        );
      } else {
        toast.success(`Categoría "${confirmDeleteCat.name}" eliminada`);
      }
      setConfirmDeleteCat(null);
      setReassignTargetId('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo eliminar';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 rounded-sm bg-white border border-[#E7DFD3] flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-[#9A7B4F]" />
        <p className="text-xs uppercase tracking-widest text-[#21162C]">
          Cargando categorías desde Cloud Firestore...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-sm bg-rose-950/40 border border-rose-500/40 text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-rose-300 mx-auto" />
        <p className="text-sm text-[#21162C]">{error}</p>
        <button
          type="button"
          onClick={() => refreshCatalog()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sm btn-skull-primary text-xs uppercase tracking-wider"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#21162C]" />
          <span className="text-[#21162C]">Reintentar</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="border-b border-[#E7DFD3] pb-4">
        <span className="text-[11px] uppercase tracking-[0.22em] text-[#9A7B4F]">
          Arquitectura del Catálogo ({categories.length})
        </span>
        <h1 className="font-display text-2xl font-medium text-[#21162C]">
          Gestión de Categorías
        </h1>
      </div>

      {/* Formulario Crear / Editar */}
      <form
        onSubmit={handleSubmit}
        className="p-5 sm:p-6 rounded-sm bg-white border border-[#E7DFD3] space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[#E7DFD3] pb-3">
          <h2 className="font-display text-lg font-medium text-[#21162C]">
            {editingId ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs uppercase tracking-wider text-[#5A4F66] hover:text-[#21162C] inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancelar</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs uppercase tracking-wider text-[#21162C]">
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Septum & Daith"
              className="w-full px-3.5 py-2.5 rounded-sm bg-[#F6F3EE] border border-[#DCCFC0] text-sm text-[#21162C] focus:outline-none focus:border-[#5B2B84]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-wider text-[#21162C]">
              Orden de Aparición
            </label>
            <input
              type="number"
              min={1}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-sm bg-[#F6F3EE] border border-[#DCCFC0] font-mono text-sm text-[#21162C] focus:outline-none focus:border-[#5B2B84]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs uppercase tracking-wider text-[#21162C]">
            Descripción de la Zona Corporal
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Para el centro de la nariz (tabique) y el oído interno..."
            className="w-full px-3.5 py-2.5 rounded-sm bg-[#F6F3EE] border border-[#DCCFC0] text-sm text-[#21162C] focus:outline-none focus:border-[#5B2B84]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
          <div className="flex items-center gap-3">
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Preview"
                className="w-11 h-11 rounded-sm object-cover border border-[#DCCFC0]"
              />
            )}
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-sm btn-skull-secondary text-xs uppercase tracking-wider">
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9A7B4F]" />
              ) : (
                <Camera className="w-3.5 h-3.5 text-[#9A7B4F]" />
              )}
              <span className="text-[#21162C]">Subir Portada</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-3">
            <label className="inline-flex items-center gap-2 text-xs text-[#21162C] cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="accent-purple-500"
              />
              <span>Visible</span>
            </label>

            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm btn-skull-primary text-xs uppercase tracking-[0.18em] font-semibold"
            >
              {editingId ? (
                <Save className="w-3.5 h-3.5 text-[#21162C]" />
              ) : (
                <Plus className="w-3.5 h-3.5 text-[#21162C]" />
              )}
              <span className="text-[#21162C]">
                {editingId ? 'Guardar Cambios' : 'Crear Categoría'}
              </span>
            </button>
          </div>
        </div>
      </form>

      {/* Confirmación de Eliminación con Protección de Productos Asociados */}
      {confirmDeleteCat && (() => {
        const assocProducts = products.filter(
          (p) => p.categoryId === confirmDeleteCat.id
        );
        const otherCategories = categories.filter(
          (c) => c.id !== confirmDeleteCat.id
        );
        return (
          <div className="p-4 sm:p-5 rounded-sm bg-rose-950/60 border border-rose-500/50 space-y-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-rose-300 font-semibold">
                Confirmar eliminación de categoría
              </p>
              <p className="text-sm text-[#21162C]">
                ¿Eliminar la categoría{' '}
                <span className="font-semibold">
                  &ldquo;{confirmDeleteCat.name}&rdquo;
                </span>
                ?
              </p>
            </div>

            {assocProducts.length > 0 && (
              <div className="p-3.5 rounded-sm bg-[#F6F3EE] border border-amber-500/50 space-y-2.5">
                <p className="text-xs text-amber-200 leading-relaxed">
                  Esta categoría tiene{' '}
                  <span className="font-semibold text-[#21162C]">
                    {assocProducts.length}{' '}
                    {assocProducts.length === 1
                      ? 'producto asociado'
                      : 'productos asociados'}
                  </span>
                  . Para proteger la integridad del catálogo, selecciona a qué
                  categoría deseas reasignarlos automáticamente antes de
                  eliminar:
                </p>

                {otherCategories.length > 0 ? (
                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase tracking-wider text-[#9A7B4F]">
                      Reasignar productos a:
                    </label>
                    <select
                      value={reassignTargetId}
                      onChange={(e) => setReassignTargetId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-sm bg-white border border-[#DCCFC0] text-xs uppercase tracking-wider text-[#21162C] focus:outline-none focus:border-[#5B2B84]"
                    >
                      {otherCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-xs text-rose-300 font-medium">
                    No existen otras categorías disponibles. Crea otra categoría
                    primero para poder reasignar los productos.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteCat(null);
                  setReassignTargetId('');
                }}
                disabled={deleting}
                className="px-3.5 py-2 rounded-sm btn-skull-secondary text-xs uppercase tracking-wider"
              >
                <span className="text-[#21162C]">Cancelar</span>
              </button>
              <button
                type="button"
                onClick={executeDeleteCategory}
                disabled={
                  deleting ||
                  (assocProducts.length > 0 && !reassignTargetId)
                }
                className="px-4 py-2 rounded-sm bg-rose-700 hover:bg-rose-600 border border-rose-400 text-xs uppercase tracking-wider font-semibold text-[#21162C] inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleting && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#21162C]" />
                )}
                <span className="text-[#21162C]">
                  {assocProducts.length > 0
                    ? 'Reasignar y Eliminar'
                    : 'Confirmar Eliminación'}
                </span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* Lista de Categorías o Estado Vacío */}
      {categories.length === 0 ? (
        <div className="p-10 rounded-sm bg-white border border-[#E7DFD3] text-center space-y-3">
          <FolderKanban className="w-8 h-8 text-[#9A7B4F] mx-auto" />
          <p className="font-display text-lg text-[#21162C]">
            Aún no hay categorías registradas
          </p>
          <p className="text-xs text-[#5A4F66]">
            Usa el formulario superior para crear tu primera categoría del catálogo.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {categories.map((cat, idx) => {
            const prodCount = products.filter(
              (p) => p.categoryId === cat.id
            ).length;
            return (
              <div
                key={cat.id}
                className="p-3.5 rounded-sm bg-white border border-[#E7DFD3] flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-sm overflow-hidden bg-[#F1ECE5] border border-[#DCCFC0] flex-shrink-0 flex items-center justify-center font-mono text-xs text-[#9A7B4F]">
                    {cat.imageUrl ? (
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      `#${cat.order}`
                    )}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-[#9A7B4F]">
                        #{cat.order}
                      </span>
                      <h3 className="text-sm font-medium text-[#21162C] truncate">
                        {cat.name}
                      </h3>
                      <span className="font-mono text-[11px] px-2 py-0.5 bg-[#F6F3EE] border border-[#DCCFC0] text-[#4A3B58]">
                        {prodCount} {prodCount === 1 ? 'producto' : 'productos'}
                      </span>
                    </div>
                    <p className="text-xs text-[#5A4F66] truncate">
                      {cat.description || `/categoria/${cat.slug}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E7DFD3]">
                  {/* Subir / Bajar orden */}
                  <button
                    type="button"
                    onClick={() => handleMoveCategory(cat.id, 'up')}
                    disabled={idx === 0 || Boolean(reorderingId)}
                    title="Subir categoría"
                    aria-label={`Subir ${cat.name}`}
                    className="p-2 rounded-sm bg-[#F6F3EE] border border-[#DCCFC0] text-[#21162C] hover:border-[#5B2B84] disabled:opacity-35"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-[#21162C]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMoveCategory(cat.id, 'down')}
                    disabled={
                      idx === categories.length - 1 || Boolean(reorderingId)
                    }
                    title="Bajar categoría"
                    aria-label={`Bajar ${cat.name}`}
                    className="p-2 rounded-sm bg-[#F6F3EE] border border-[#DCCFC0] text-[#21162C] hover:border-[#5B2B84] disabled:opacity-35"
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-[#21162C]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(cat)}
                    title={cat.isActive ? 'Publicada' : 'Oculta'}
                    className={`p-2 rounded-sm editorial-transition ${
                      cat.isActive
                        ? 'btn-skull-primary'
                        : 'bg-[#F6F3EE] border border-[#DCCFC0] text-[#5A4F66]'
                    }`}
                  >
                    {cat.isActive ? (
                      <Eye className="w-3.5 h-3.5 text-[#21162C]" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-[#5A4F66]" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => startEdit(cat)}
                    aria-label={`Editar ${cat.name}`}
                    className="p-2 rounded-sm bg-[#F1ECE5] border border-[#DCCFC0] text-[#21162C] hover:border-[#5B2B84]"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#21162C]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => openDeleteCategoryModal(cat)}
                    aria-label={`Eliminar ${cat.name}`}
                    className="p-2 rounded-sm bg-[#F1ECE5] border border-[#DCCFC0] text-[#21162C] hover:bg-rose-950/60 hover:border-rose-500 hover:text-white"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
