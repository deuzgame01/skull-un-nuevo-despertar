'use client';

import React from 'react';
import Link from 'next/link';
import { Instagram, MapPin } from 'lucide-react';
import { useCatalog } from '@/context/CatalogContext';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { buildGeneralWhatsAppUrl } from '@/lib/utils/whatsapp';

export function PublicFooter() {
  const { settings, activeCategories } = useCatalog();
  const whatsappUrl = buildGeneralWhatsAppUrl(settings.whatsapp);

  return (
    <footer className="bg-[#0E0A14] border-t border-[#261C31] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Columna 1: Casa Editorial SKULL (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3.5">
              <img
                src={settings.brand.logoUrl || '/images/logo-skull.png'}
                alt={settings.brand.siteName}
                className="w-12 h-12 rounded-full border border-white/40 object-cover bg-black"
              />
              <div>
                <h3 className="font-display text-xl font-semibold text-white tracking-[0.18em]">
                  SKULL
                </h3>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#C8A97E]">
                  {settings.brand.tagline}
                </p>
              </div>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed max-w-md">
              {settings.brand.description}
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-200 pt-1">
              <MapPin className="w-3.5 h-3.5 text-[#C8A97E] flex-shrink-0" />
              <span>{settings.brand.locationText}</span>
            </div>
          </div>

          {/* Columna 2: Índice de Colecciones (4 cols) */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs uppercase tracking-[0.22em] text-[#C8A97E] font-medium">
              Índice de Colecciones
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/catalogo"
                  className="text-zinc-200 hover:text-white flex items-center gap-2.5 editorial-transition"
                >
                  <span className="font-mono text-xs text-zinc-400">00</span>
                  <span>Archivo General</span>
                </Link>
              </li>
              {activeCategories.map((cat, idx) => (
                <li key={cat.id}>
                  <Link
                    href={`/categoria/${cat.slug}`}
                    className="text-zinc-200 hover:text-white flex items-center gap-2.5 editorial-transition"
                  >
                    <span className="font-mono text-xs text-[#C8A97E]">
                      0{idx + 1}
                    </span>
                    <span>{cat.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3: Concierge & Contacto Directo (3 cols) */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs uppercase tracking-[0.22em] text-[#C8A97E] font-medium">
              Concierge & Pedidos
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {settings.whatsapp.businessHoursNote}
            </p>
            <div className="flex flex-col gap-2.5 pt-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-sm btn-skull-primary inline-flex items-center justify-center gap-2 text-xs uppercase tracking-[0.18em] font-semibold"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span className="text-white">Atención en WhatsApp</span>
              </a>

              {settings.brand.instagramUrl && (
                <a
                  href={settings.brand.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-sm btn-skull-secondary text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2"
                >
                  <Instagram className="w-3.5 h-3.5 text-[#C8A97E]" />
                  <span className="text-white">{settings.brand.instagramHandle || 'Instagram'}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#261C31] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-300">
          <p className="tracking-wide">
            © {new Date().getFullYear()} {settings.brand.siteName}. Joyería Corporal Certificada.
          </p>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#C8A97E]">
            Titanio Grado Implante ASTM F-136
          </span>
        </div>
      </div>
    </footer>
  );
}
