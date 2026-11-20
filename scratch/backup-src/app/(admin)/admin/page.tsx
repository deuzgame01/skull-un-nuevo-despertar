'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Check,
  Copy,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  FolderKanban,
  Loader2,
  Monitor,
  Package,
  Plus,
  RefreshCw,
  Settings,
  Smartphone,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCatalog } from '@/context/CatalogContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils/formatters';
import { buildProductWhatsAppUrl } from '@/lib/utils/whatsapp';
import { seedInitialCatalogToFirestore } from '@/lib/firebase/settings.service';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

export default function AdminDashboardPage() {
  const {
    products,
    activeProducts,
    featuredProducts,
    inactiveProducts,
    activeCategories,
    settings,
    loading,
    error,
    refreshCatalog,
  } = useCatalog();
  const { isFirebaseReady } = useAuth();

  const [copiedBio, setCopiedBio] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>(
    'mobile'
  );
  const [previewCategory, setPreviewCategory] = useState<string>('all');

  const handleCopyInstagramLink = async () => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || '';
    if (!origin) return;
    await navigator.clipboard.writeText(origin);
    setCopiedBio(true);
    toast.success('Enlace para biografía de Instagram copiado');
    setTimeout(() => setCopiedBio(false), 2500);
  };

  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
      await seedInitialCatalogToFirestore();
      await refreshCatalog();
      toast.success('Catálogo base sincronizado en Cloud Firestore');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error al sincronizar datos';
      toast.error(msg);
    } finally {
      setSeeding(false);
    }
  };

  // 1. ESTADO DE CARGA PROPIO
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="p-6 rounded-sm bg-[#0E0A14] border border-[#261C31] flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-[#C8A97E]" />
          <div>
            <p className="font-display text-lg text-white">
              Sincronizando indicadores con Cloud Firestore...
            </p>
            <p className="text-xs text-zinc-300">
              Calculando inventario, estados de publicación y colecciones en tiempo real.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-24 rounded-sm bg-[#0E0A14] border border-[#261C31] p-4 animate-pulse flex flex-col justify-between"
            >
              <div className="h-3 w-24 bg-[#150E1D] rounded" />
              <div className="h-7 w-12 bg-[#150E1D] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. ESTADO DE ERROR PROPIO
  if (error) {
    return (
      <div className="p-6 sm:p-8 rounded-sm bg-rose-950/40 border border-rose-500/40 text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-rose-300 mx-auto" />
        <div className="space-y-1">
          <h2 className="font-display text-xl text-white">
            Error al cargar datos de Cloud Firestore
          </h2>
          <p className="text-xs text-zinc-200 max-w-md mx-auto">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => refreshCatalog()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm btn-skull-primary text-xs uppercase tracking-[0.18em] font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5 text-white" />
          <span className="text-white">Reintentar Conexión</span>
        </button>
      </div>
    );
  }

  const previewProducts = activeProducts.filter((p) =>
    previewCategory === 'all' ? true : p.categorySlug === previewCategory
  );

  return (
    <div className="space-y-7">
      {/* ENCABEZADO COMPACTO DEL CENTRO DE CONTROL */}
      <div className="p-4 sm:p-6 rounded-sm bg-[#150E1D] border border-[#3A2B4C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-[#C8A97E]">
            Centro de Control • {isFirebaseReady ? 'Firestore En Vivo' : 'Local'}
          </span>
          <h1 className="font-display text-xl sm:text-2xl font-medium text-white">
            {settings.brand.siteName}
          </h1>
          <p className="text-xs text-zinc-200">
            Gestiona tu catálogo desde el teléfono y comparte tu enlace comercial.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyInstagramLink}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-sm btn-skull-secondary text-xs uppercase tracking-[0.15em]"
          >
            {copiedBio ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-white">Link Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#C8A97E]" />
                <span className="text-white">Copiar Link IG</span>
              </>
            )}
          </button>

          <Link
            href="/admin/productos/nuevo"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm btn-skull-primary text-xs uppercase tracking-[0.16em] font-semibold"
          >
            <Plus className="w-4 h-4 text-white" />
            <span className="text-white">Agregar Producto</span>
          </Link>
        </div>
      </div>

      {/* 1. INDICADORES COMPACTOS (Calculados 100% desde Firestore) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-[0.2em] text-[#C8A97E] font-medium">
            Indicadores del Catálogo
          </h2>
          <button
            type="button"
            onClick={() => refreshCatalog()}
            className="inline-flex items-center gap-1.5 text-[11px] text-zinc-300 hover:text-white"
          >
            <RefreshCw className="w-3 h-3 text-[#C8A97E]" />
            <span>Actualizar</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total de productos */}
          <div className="p-4 rounded-sm bg-[#0E0A14] border border-[#261C31] flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-zinc-300">
                Total de Productos
              </span>
              <Package className="w-4 h-4 text-[#C8A97E]" />
            </div>
            <p className="font-mono text-2xl sm:text-3xl font-semibold text-white tabular-nums">
              {products.length}
            </p>
          </div>

          {/* Productos publicados */}
          <div className="p-4 rounded-sm bg-[#0E0A14] border border-[#261C31] flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-zinc-300">
                Publicados
              </span>
              <Eye className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="font-mono text-2xl sm:text-3xl font-semibold text-white tabular-nums">
              {activeProducts.length}
            </p>
          </div>

          {/* Productos destacados */}
          <div className="p-4 rounded-sm bg-[#0E0A14] border border-[#261C31] flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-zinc-300">
                Destacados
              </span>
              <Star className="w-4 h-4 text-[#C8A97E]" />
            </div>
            <p className="font-mono text-2xl sm:text-3xl font-semibold text-[#C8A97E] tabular-nums">
              {featuredProducts.length}
            </p>
          </div>

          {/* Productos inactivos */}
          <div className="p-4 rounded-sm bg-[#0E0A14] border border-[#261C31] flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-zinc-300">
                Inactivos
              </span>
              <EyeOff className="w-4 h-4 text-zinc-400" />
            </div>
            <p className="font-mono text-2xl sm:text-3xl font-semibold text-white tabular-nums">
              {inactiveProducts.length}
            </p>
          </div>
        </div>
      </section>

      {/* 2. ACCESOS RÁPIDOS (5 Acciones Táctiles Accesibles con Una Mano) */}
      <section className="space-y-2.5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-[#C8A97E] font-medium">
          Accesos Rápidos
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
          <Link
            href="/admin/productos/nuevo"
            className="p-3.5 sm:p-4 rounded-sm bg-[#150E1D] hover:bg-[#3B1D5A] border border-[#3A2B4C] hover:border-white/50 flex flex-col justify-between gap-2.5 active:scale-[0.98] editorial-transition"
          >
            <Plus className="w-4 h-4 text-[#C8A97E]" />
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-white">
                Agregar Producto
              </p>
              <p className="text-[11px] text-zinc-300">Subir nueva pieza</p>
            </div>
          </Link>

          <Link
            href="/admin/productos"
            className="p-3.5 sm:p-4 rounded-sm bg-[#0E0A14] hover:bg-[#150E1D] border border-[#261C31] hover:border-white/50 flex flex-col justify-between gap-2.5 active:scale-[0.98] editorial-transition"
          >
            <Package className="w-4 h-4 text-[#C8A97E]" />
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-white">
                Administrar Catálogo
              </p>
              <p className="text-[11px] text-zinc-300">
                {products.length} {products.length === 1 ? 'producto' : 'productos'}
              </p>
            </div>
          </Link>

          <Link
            href="/admin/categorias"
            className="p-3.5 sm:p-4 rounded-sm bg-[#0E0A14] hover:bg-[#150E1D] border border-[#261C31] hover:border-white/50 flex flex-col justify-between gap-2.5 active:scale-[0.98] editorial-transition"
          >
            <FolderKanban className="w-4 h-4 text-[#C8A97E]" />
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-white">
                Editar Categorías
              </p>
              <p className="text-[11px] text-zinc-300">
                {activeCategories.length} activas
              </p>
            </div>
          </Link>

          <Link
            href="/admin/configuracion"
            className="p-3.5 sm:p-4 rounded-sm bg-[#0E0A14] hover:bg-[#150E1D] border border-[#261C31] hover:border-white/50 flex flex-col justify-between gap-2.5 active:scale-[0.98] editorial-transition"
          >
            <Settings className="w-4 h-4 text-[#C8A97E]" />
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-white">
                Configurar WhatsApp
              </p>
              <p className="text-[11px] text-zinc-300 truncate">
                +{settings.whatsapp.phoneNumber}
              </p>
            </div>
          </Link>

          <Link
            href="/"
            target="_blank"
            className="col-span-2 sm:col-span-1 p-3.5 sm:p-4 rounded-sm bg-[#0E0A14] hover:bg-[#150E1D] border border-[#261C31] hover:border-white/50 flex flex-col justify-between gap-2.5 active:scale-[0.98] editorial-transition"
          >
            <ExternalLink className="w-4 h-4 text-[#C8A97E]" />
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-white">
                Ver Catálogo Público
              </p>
              <p className="text-[11px] text-zinc-300">Abrir tienda en vivo</p>
            </div>
          </Link>
        </div>
      </section>

      {/* 3. VISTA PREVIA EN VIVO DEL CATÁLOGO PÚBLICO */}
      <section className="bg-[#0E0A14] border border-[#261C31] rounded-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#261C31] pb-3.5">
          <div>
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#C8A97E]">
              Simulador en Tiempo Real
            </span>
            <h2 className="font-display text-lg sm:text-xl font-medium text-white">
              Vista Previa del Catálogo Público
            </h2>
            <p className="text-xs text-zinc-300">
              Así ven tus clientes los {activeProducts.length} productos publicados desde su celular.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="hidden sm:inline-flex p-0.5 rounded-sm bg-[#070709] border border-[#3A2B4C]">
              <button
                type="button"
                onClick={() => setPreviewMode('mobile')}
                className={`px-2.5 py-1 rounded-sm text-[11px] uppercase tracking-wider flex items-center gap-1.5 ${
                  previewMode === 'mobile'
                    ? 'btn-skull-primary font-semibold'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-white" />
                <span className="text-white">Móvil</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('desktop')}
                className={`px-2.5 py-1 rounded-sm text-[11px] uppercase tracking-wider flex items-center gap-1.5 ${
                  previewMode === 'desktop'
                    ? 'btn-skull-primary font-semibold'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 text-white" />
                <span className="text-white">Amplia</span>
              </button>
            </div>

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm btn-skull-secondary text-xs uppercase tracking-wider"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#C8A97E]" />
              <span className="text-white">Abrir Tienda</span>
            </Link>
          </div>
        </div>

        {/* Estado vacío si no hay productos publicados */}
        {activeProducts.length === 0 ? (
          <div className="p-8 rounded-sm bg-[#070709] border border-[#261C31] text-center space-y-4">
            <Package className="w-8 h-8 text-[#C8A97E] mx-auto" />
            <div className="space-y-1">
              <p className="font-display text-lg text-white">
                No hay productos publicados actualmente
              </p>
              <p className="text-xs text-zinc-300 max-w-md mx-auto">
                Agrega tu primer producto o activa la visibilidad de tus piezas para que aparezcan en la vista previa del catálogo público.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href="/admin/productos/nuevo"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm btn-skull-primary text-xs uppercase tracking-[0.16em] font-semibold"
              >
                <Plus className="w-4 h-4 text-white" />
                <span className="text-white">Crear Primer Producto</span>
              </Link>

              {products.length === 0 && (
                <button
                  type="button"
                  onClick={handleSeedDatabase}
                  disabled={seeding}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm btn-skull-secondary text-xs uppercase tracking-[0.16em]"
                >
                  <Database className="w-3.5 h-3.5 text-[#C8A97E]" />
                  <span className="text-white">
                    {seeding ? 'Cargando...' : 'Cargar Catálogo Inicial'}
                  </span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Contenedor de Vista Previa (Marco Móvil o Escritorio) */
          <div
            className={`mx-auto rounded-md bg-[#070709] border border-[#3A2B4C] overflow-hidden transition-all ${
              previewMode === 'mobile' ? 'max-w-[400px]' : 'w-full'
            }`}
          >
            {/* Mini Cabecera Simulada de la Tienda */}
            <div className="bg-[#150E1D] border-b border-[#261C31] px-3.5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={settings.brand.logoUrl || '/images/logo-skull.png'}
                  alt="SKULL"
                  className="w-7 h-7 rounded-full border border-white/40 object-cover bg-black"
                />
                <div>
                  <p className="font-display text-xs font-semibold tracking-[0.2em] text-white leading-none">
                    SKULL
                  </p>
                  <p className="text-[9px] uppercase tracking-[0.16em] text-[#C8A97E] mt-0.5">
                    Vista Previa Cliente
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-zinc-300">
                {previewProducts.length} publicadas
              </span>
            </div>

            {/* Filtro Rápido de Categorías dentro de la Vista Previa */}
            <div className="p-3 border-b border-[#261C31] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setPreviewCategory('all')}
                className={`px-2.5 py-1 rounded-sm text-[10px] uppercase tracking-wider whitespace-nowrap ${
                  previewCategory === 'all'
                    ? 'btn-skull-primary font-semibold'
                    : 'btn-skull-secondary'
                }`}
              >
                Todas ({activeProducts.length})
              </button>
              {activeCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setPreviewCategory(cat.slug)}
                  className={`px-2.5 py-1 rounded-sm text-[10px] uppercase tracking-wider whitespace-nowrap ${
                    previewCategory === cat.slug
                      ? 'btn-skull-primary font-semibold'
                      : 'btn-skull-secondary'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Grilla de Productos de la Vista Previa */}
            <div
              className={`p-3 grid gap-2.5 max-h-[460px] overflow-y-auto ${
                previewMode === 'mobile'
                  ? 'grid-cols-2'
                  : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
              }`}
            >
              {previewProducts.slice(0, 8).map((prod) => {
                const waUrl = buildProductWhatsAppUrl(prod, settings.whatsapp);
                return (
                  <div
                    key={prod.id}
                    className="bg-[#0E0A14] border border-[#261C31] rounded-sm overflow-hidden flex flex-col justify-between"
                  >
                    <div className="relative aspect-[4/5] bg-[#150E1D]">
                      <img
                        src={prod.thumbnailUrl || '/images/logo-skull.png'}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                      {prod.isFeatured && (
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-[#070709]/85 border border-[#C8A97E]/45 text-[8px] uppercase tracking-widest text-[#C8A97E]">
                          Destacado
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[#C8A97E] truncate">
                          {prod.categoryName}
                        </p>
                        <p className="font-display text-xs text-white line-clamp-1 mt-0.5">
                          {prod.name}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <p className="font-mono text-xs font-semibold text-white">
                          {formatPrice(prod.price, prod.currency)}
                        </p>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-1.5 px-2 rounded-sm btn-skull-primary flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5" />
                          <span className="text-white">Pedir</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
