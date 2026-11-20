'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Edit3,
  Eye,
  EyeOff,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCatalog } from '@/context/CatalogContext';
import { SortSheet } from '@/components/ui/SortSheet';
import { ADMIN_SORT_OPTIONS } from '@/lib/sort-options';
import { formatPrice } from '@/lib/utils/formatters';
import {
  deleteProduct,
  toggleProductField,
} from '@/lib/firebase/products.service';

type StatusFilter = 'all' | 'published' | 'featured' | 'inactive';
type SortOption = 'recent' | 'oldest' | 'price-asc' | 'price-desc' | 'name-asc';

export default function AdminProductsPage() {
  const {
    products,
    activeProducts,
    featuredProducts,
    inactiveProducts,
    categories,
    loading,
    error,
    refreshCatalog,
  } = useCatalog();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => {
      if (categoryFilter !== 'all' && p.categoryId !== categoryFilter) {
        return false;
      }
      if (statusFilter === 'published' && !p.isActive) return false;
      if (statusFilter === 'featured' && !p.isFeatured) return false;
      if (statusFilter === 'inactive' && p.isActive) return false;

      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.material.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'es');
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      if (sortBy === 'oldest') return timeA - timeB;
      return timeB - timeA;
    });
  }, [products, search, categoryFilter, statusFilter, sortBy]);

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setSortBy('recent');
  };

  const handleToggle = async (
    id: string,
    field: 'isActive' | 'isFeatured',
    currentValue: boolean
  ) => {
    try {
      await toggleProductField(id, field, !currentValue);
      await refreshCatalog();
      toast.success(
        field === 'isActive'
          ? !currentValue
            ? 'Producto publicado en el catálogo'
            : 'Producto marcado como inactivo'
          : !currentValue
          ? 'Producto marcado como destacado'
          : 'Producto removido de destacados'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar';
      toast.error(msg);
    }
  };

  const executeDelete = async () => {
    if (!confirmDeleteProduct) return;
    setDeletingId(confirmDeleteProduct.id);
    try {
      await deleteProduct(confirmDeleteProduct.id);
      await refreshCatalog();
      toast.success(`"${confirmDeleteProduct.name}" eliminado del catálogo`);
      setConfirmDeleteProduct(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'No se pudo eliminar el producto';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  // 1. ESTADO DE CARGA PROPIO
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="p-5 rounded-sm bg-white border border-[#E7DFD3] flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-[#9A7B4F]" />
          <p className="text-xs uppercase tracking-[0.18em] text-[#21162C]">
            Cargando inventario desde Cloud Firestore...
          </p>
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-sm bg-white border border-[#E7DFD3] animate-pulse"
          />
        ))}
      </div>
    );
  }

  // 2. ESTADO DE ERROR PROPIO
  if (error) {
    return (
      <div className="p-6 sm:p-8 rounded-sm bg-rose-950/40 border border-rose-500/40 text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-rose-300 mx-auto" />
        <div className="space-y-1">
          <h2 className="font-display text-xl text-[#21162C]">
            No se pudo cargar la lista de productos
          </h2>
          <p className="text-xs text-[#4A3B58] max-w-md mx-auto">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => refreshCatalog()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm btn-skull-primary text-xs uppercase tracking-[0.18em] font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#21162C]" />
          <span className="text-[#21162C]">Reintentar</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CABECERA COMPACTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7DFD3] pb-4">
        <div>
          <span className="text-[11px] uppercase tracking-[0.22em] text-[#9A7B4F]">
            Inventario en Firestore ({products.length} total)
          </span>
          <h1 className="font-display text-2xl font-medium text-[#21162C]">
            Gestión de Productos
          </h1>
        </div>

        <Link
          href="/admin/productos/nuevo"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm btn-skull-primary text-xs uppercase tracking-[0.18em] font-semibold active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-[#21162C]" />
          <span className="text-[#21162C]">Agregar Producto</span>
        </Link>
      </div>

      {/* PANEL DE BÚSQUEDA Y FILTROS (Móvil + Escritorio) */}
      <div className="p-4 rounded-sm bg-white border border-[#E7DFD3] space-y-3.5">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#5A4F66] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto por nombre, SKU o material..."
              className="w-full pl-10 pr-9 py-2.5 rounded-sm bg-[#F6F3EE] border border-[#DCCFC0] text-xs sm:text-sm text-[#21162C] placeholder:text-[#9A8FA8] focus:outline-none focus:border-[#5B2B84]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A4F66] hover:text-[#21162C]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtro por Categoría */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filtrar por categoría"
            className="px-3.5 py-2.5 rounded-sm bg-[#F6F3EE] border border-[#DCCFC0] text-xs uppercase tracking-wider text-[#21162C] focus:outline-none focus:border-[#5B2B84]"
          >
            <option value="all">
              Todas las categorías ({products.length})
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Ordenar por */}
          <SortSheet
            value={sortBy}
            options={ADMIN_SORT_OPTIONS}
            onChange={setSortBy}
            label="Ordenar productos"
          />
        </div>

        {/* Píldoras Táctiles de Estado de Publicación */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-sm text-[11px] uppercase tracking-wider whitespace-nowrap ${
              statusFilter === 'all'
                ? 'btn-skull-primary font-semibold'
                : 'btn-skull-secondary'
            }`}
          >
            Todos ({products.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 rounded-sm text-[11px] uppercase tracking-wider whitespace-nowrap ${
              statusFilter === 'published'
                ? 'btn-skull-primary font-semibold'
                : 'btn-skull-secondary'
            }`}
          >
            Publicados ({activeProducts.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('featured')}
            className={`px-3 py-1.5 rounded-sm text-[11px] uppercase tracking-wider whitespace-nowrap ${
              statusFilter === 'featured'
                ? 'btn-skull-primary font-semibold'
                : 'btn-skull-secondary'
            }`}
          >
            Destacados ({featuredProducts.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-sm text-[11px] uppercase tracking-wider whitespace-nowrap ${
              statusFilter === 'inactive'
                ? 'btn-skull-primary font-semibold'
                : 'btn-skull-secondary'
            }`}
          >
            Inactivos ({inactiveProducts.length})
          </button>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {confirmDeleteProduct && (
        <div className="p-4 sm:p-5 rounded-sm bg-rose-950/60 border border-rose-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-rose-300 font-semibold">
              Confirmar eliminación permanente
            </p>
            <p className="text-sm text-[#21162C]">
              ¿Deseas eliminar{' '}
              <span className="font-semibold">
                &ldquo;{confirmDeleteProduct.name}&rdquo;
              </span>{' '}
              de Cloud Firestore?
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setConfirmDeleteProduct(null)}
              disabled={Boolean(deletingId)}
              className="px-3.5 py-2 rounded-sm btn-skull-secondary text-xs uppercase tracking-wider"
            >
              <span className="text-[#21162C]">Cancelar</span>
            </button>
            <button
              type="button"
              onClick={executeDelete}
              disabled={Boolean(deletingId)}
              className="px-4 py-2 rounded-sm bg-rose-700 hover:bg-rose-600 border border-rose-400 text-xs uppercase tracking-wider font-semibold text-[#21162C] flex items-center gap-1.5"
            >
              {deletingId ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#21162C]" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 text-[#21162C]" />
              )}
              <span className="text-[#21162C]">Sí, Eliminar</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. ESTADO DE LISTA VACÍA PROPIO O LISTADO DE PRODUCTOS */}
      {filteredProducts.length === 0 ? (
        <div className="p-10 rounded-sm bg-white border border-[#E7DFD3] text-center space-y-4">
          <Package className="w-9 h-9 text-[#9A7B4F] mx-auto" />
          <div className="space-y-1">
            <h2 className="font-display text-xl text-[#21162C]">
              {products.length === 0
                ? 'Aún no hay productos registrados en el catálogo'
                : 'Ningún producto coincide con los filtros aplicados'}
            </h2>
            <p className="text-xs text-[#5A4F66] max-w-md mx-auto">
              {products.length === 0
                ? 'Comienza agregando tu primera pieza con fotografía, precio y categoría desde tu celular.'
                : 'Prueba cambiando la búsqueda, categoría o filtro de estado de publicación.'}
            </p>
          </div>

          {products.length === 0 ? (
            <Link
              href="/admin/productos/nuevo"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm btn-skull-primary text-xs uppercase tracking-[0.18em] font-semibold"
            >
              <Plus className="w-4 h-4 text-[#21162C]" />
              <span className="text-[#21162C]">Crear Primer Producto</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm btn-skull-primary text-xs uppercase tracking-[0.18em] font-semibold"
            >
              <span className="text-[#21162C]">Restablecer Filtros</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="p-3.5 sm:p-4 rounded-sm bg-white border border-[#E7DFD3] hover:border-[#DCCFC0] flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 editorial-transition"
            >
              {/* Fotografía + Nombre + Precio + Categoría + Estado */}
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <img
                  src={product.thumbnailUrl || '/images/logo-skull.png'}
                  alt={product.name}
                  className="w-16 h-16 sm:w-14 sm:h-14 rounded-sm object-cover bg-[#F1ECE5] border border-[#DCCFC0] flex-shrink-0"
                />

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-[#9A7B4F]">
                      {product.categoryName}
                    </span>

                    {/* Estado de Publicación */}
                    {product.isActive ? (
                      <span className="px-2 py-0.5 rounded-sm bg-emerald-950/60 border border-emerald-500/40 text-[10px] uppercase tracking-wider text-[#21162C]">
                        Publicado
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-sm bg-zinc-900 border border-zinc-600/50 text-[10px] uppercase tracking-wider text-[#5A4F66]">
                        Inactivo
                      </span>
                    )}

                    {product.isFeatured && (
                      <span className="px-2 py-0.5 rounded-sm bg-[#F1ECE5] border border-[#9A7B4F]/50 text-[10px] uppercase tracking-wider text-[#9A7B4F]">
                        Destacado
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-base font-medium text-[#21162C] truncate">
                    {product.name}
                  </h3>

                  <p className="font-mono text-sm font-semibold text-[#21162C] tabular-nums">
                    {formatPrice(product.price, product.currency)}
                  </p>
                </div>
              </div>

              {/* Acciones Táctiles Accesibles con Una Mano */}
              <div className="flex items-center justify-end gap-2 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-[#E7DFD3]">
                <button
                  type="button"
                  onClick={() =>
                    handleToggle(product.id, 'isFeatured', product.isFeatured)
                  }
                  title={
                    product.isFeatured
                      ? 'Quitar de destacados'
                      : 'Marcar como destacado'
                  }
                  className={`px-2.5 py-2 rounded-sm border text-xs flex items-center gap-1.5 editorial-transition ${
                    product.isFeatured
                      ? 'bg-[#2C1440] border-[#9A7B4F] text-white'
                      : 'bg-[#F6F3EE] border-[#DCCFC0] text-[#5A4F66] hover:text-[#21162C]'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Destacar</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleToggle(product.id, 'isActive', product.isActive)
                  }
                  className={`px-3 py-2 rounded-sm text-xs font-medium flex items-center gap-1.5 editorial-transition ${
                    product.isActive
                      ? 'btn-skull-primary font-semibold'
                      : 'bg-[#F6F3EE] border border-[#DCCFC0] text-[#5A4F66] hover:text-[#21162C]'
                  }`}
                >
                  {product.isActive ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-[#21162C]" />
                      <span className="text-[#21162C]">Publicado</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-[#5A4F66]" />
                      <span className="text-[#5A4F66]">Inactivo</span>
                    </>
                  )}
                </button>

                <Link
                  href={`/admin/productos/${product.id}`}
                  className="px-3.5 py-2 rounded-sm btn-skull-secondary text-xs flex items-center gap-1.5 font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#9A7B4F]" />
                  <span className="text-[#21162C]">Editar</span>
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    setConfirmDeleteProduct({
                      id: product.id,
                      name: product.name,
                    })
                  }
                  aria-label={`Eliminar ${product.name}`}
                  className="p-2 rounded-sm bg-[#F1ECE5] border border-[#DCCFC0] hover:border-rose-500 hover:bg-rose-950/60 text-[#21162C] hover:text-white editorial-transition"
                  title="Eliminar producto"
                >
                  <Trash2 className="w-4 h-4 text-rose-300" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
