'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProductForm } from '@/components/admin/ProductForm';

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#261C31] pb-4">
        <Link
          href="/admin/productos"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#C8A97E] hover:text-white mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Inventario</span>
        </Link>
        <h1 className="font-display text-2xl font-medium text-white">
          Publicar Nueva Pieza
        </h1>
      </div>

      <ProductForm />
    </div>
  );
}
