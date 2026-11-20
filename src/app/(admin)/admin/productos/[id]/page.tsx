'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useCatalog } from '@/context/CatalogContext';
import { ProductForm } from '@/components/admin/ProductForm';

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id || '';
  const { products } = useCatalog();

  const product = useMemo(
    () => products.find((p) => p.id === id) || null,
    [products, id]
  );

  if (!product) {
    return (
      <div className="p-10 rounded-md bg-white border border-[#E7DFD3] text-center space-y-4">
        <p className="font-display text-xl text-[#21162C]">
          Pieza no encontrada
        </p>
        <Link
          href="/admin/productos"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md btn-skull-primary text-xs uppercase tracking-wider font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#21162C]" />
          <span className="text-[#21162C]">Volver al Inventario</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#E7DFD3] pb-4">
        <Link
          href="/admin/productos"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#9A7B4F] hover:text-[#21162C] mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Inventario</span>
        </Link>
        <h1 className="font-display text-2xl font-medium text-[#21162C]">
          Editar Pieza: {product.name}
        </h1>
      </div>

      <ProductForm initialProduct={product} />
    </div>
  );
}
