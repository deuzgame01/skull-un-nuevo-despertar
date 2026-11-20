'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProductForm } from '@/components/admin/ProductForm';

export default function NewProductPage() {
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
          Publicar Nueva Pieza
        </h1>
      </div>

      <ProductForm />
    </div>
  );
}
