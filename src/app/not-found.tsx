import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Compass, Sparkles } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { FloatingWhatsApp } from '@/components/catalog/FloatingWhatsApp';

export const metadata = {
  title: 'Página no encontrada (404) | SKULL – Un Nuevo Despertar',
  description:
    'La página o pieza que buscas no existe o ha sido trasladada en el catálogo oficial de SKULL.',
};

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col bg-[#F6F3EE] text-[#21162C]">
      <PublicHeader />
      <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6">
        <div className="max-w-xl w-full text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-[#F1ECE5] border border-[#DCCFC0] text-[11px] uppercase tracking-[0.24em] text-[#9A7B4F]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Código 404 • Archivo SKULL</span>
          </div>

          <div className="space-y-2.5">
            <h1 className="font-display text-4xl sm:text-5xl font-medium text-[#21162C] tracking-wide">
              Destino Inexplorado
            </h1>
            <p className="text-xs sm:text-sm text-[#5A4F66] leading-relaxed max-w-md mx-auto">
              La página o enlace que intentas abrir no existe en nuestro catálogo digital o ha cambiado de dirección.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-sm btn-skull-primary text-xs uppercase tracking-[0.18em] font-semibold active:scale-[0.98]"
            >
              <Compass className="w-4 h-4 text-[#21162C]" />
              <span className="text-[#21162C]">Explorar Catálogo</span>
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-sm btn-skull-secondary text-xs uppercase tracking-[0.18em]"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#21162C]" />
              <span className="text-[#21162C]">Regresar al Inicio</span>
            </Link>
          </div>
        </div>
      </main>
      <PublicFooter />
      <FloatingWhatsApp />
    </div>
  );
}

