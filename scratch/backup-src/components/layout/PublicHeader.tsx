'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Instagram, Menu, Search, X } from 'lucide-react';
import { useCatalog } from '@/context/CatalogContext';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { buildGeneralWhatsAppUrl } from '@/lib/utils/whatsapp';

export function PublicHeader() {
  const { settings, activeCategories } = useCatalog();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSearch.trim()) return;
    router.push(`/catalogo?q=${encodeURIComponent(quickSearch.trim())}`);
    setSearchOpen(false);
    setMobileMenuOpen(false);
  };

  const whatsappUrl = buildGeneralWhatsAppUrl(settings.whatsapp);

  return (
    <>
      {/* Cintillo rotativo: hasta 5 mensajes, uno a uno */}
      <AnnouncementBar />

      <header className="sticky top-0 z-40 bg-[#070709]/95 border-b border-[#261C31]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Emblema y Marca Editorial */}
          <Link
            href="/"
            className="flex items-center gap-3.5 group focus:outline-none"
          >
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-white/40 bg-black flex-shrink-0 group-hover:border-white editorial-transition">
              <img
                src={settings.brand.logoUrl || '/images/logo-skull.png'}
                alt={settings.brand.siteName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg sm:text-xl font-semibold tracking-[0.24em] text-white leading-none">
                SKULL
              </span>
              <span className="text-[10px] tracking-[0.22em] uppercase text-[#C8A97E] mt-1">
                Un Nuevo Despertar
              </span>
            </div>
          </Link>

          {/* Navegación Editorial Desktop */}
          <nav className="hidden lg:flex items-center gap-7 text-xs uppercase tracking-[0.18em]">
            <Link
              href="/"
              className={`editorial-transition ${
                pathname === '/'
                  ? 'text-white font-semibold underline underline-offset-8 decoration-[#C8A97E]'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              Inicio
            </Link>
            <Link
              href="/catalogo"
              className={`editorial-transition ${
                pathname.startsWith('/catalogo')
                  ? 'text-white font-semibold underline underline-offset-8 decoration-[#C8A97E]'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              Archivo Completo
            </Link>
            {activeCategories.slice(0, 4).map((cat) => (
              <Link
                key={cat.id}
                href={`/categoria/${cat.slug}`}
                className={`editorial-transition ${
                  pathname === `/categoria/${cat.slug}`
                    ? 'text-white font-semibold underline underline-offset-8 decoration-[#C8A97E]'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/#contacto"
              className="text-zinc-300 hover:text-white editorial-transition"
            >
              Contacto
            </Link>
          </nav>

          {/* Controles Derecha */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSearchOpen((prev) => !prev)}
              aria-label="Buscar pieza"
              className="w-10 h-10 rounded-sm bg-[#150E1D] border border-[#3A2B4C] text-white hover:border-white flex items-center justify-center editorial-transition"
            >
              <Search className="w-4 h-4 text-white" />
            </button>

            {settings.brand.instagramUrl && (
              <a
                href={settings.brand.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de SKULL"
                className="hidden sm:flex w-10 h-10 rounded-sm bg-[#150E1D] border border-[#3A2B4C] text-white hover:border-white items-center justify-center editorial-transition"
              >
                <Instagram className="w-4 h-4 text-white" />
              </a>
            )}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-sm btn-skull-primary text-xs uppercase tracking-[0.18em] font-medium"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span className="text-white">WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Abrir índice"
              className="lg:hidden w-10 h-10 rounded-sm bg-[#150E1D] border border-[#3A2B4C] text-white flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>

        {/* Cajón de Búsqueda Editorial */}
        {searchOpen && (
          <div className="border-t border-[#261C31] bg-[#150E1D] px-4 py-4">
            <form
              onSubmit={handleSearchSubmit}
              className="max-w-2xl mx-auto flex items-center gap-2.5"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  placeholder="Buscar por pieza, zona (septum, helix, nostril) o titanio..."
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 rounded-sm bg-[#070709] border border-[#3A2B4C] text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-white"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-sm btn-skull-primary text-xs uppercase tracking-[0.18em] font-semibold"
              >
                Buscar
              </button>
            </form>
          </div>
        )}

        {/* Índice Móvil Editorial */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#261C31] bg-[#0E0A14] px-4 pt-5 pb-6 space-y-5">
            <div className="flex flex-col divide-y divide-[#261C31] border-y border-[#261C31]">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 text-xs uppercase tracking-[0.2em] text-white flex items-center justify-between"
              >
                <span>Inicio</span>
                <span className="font-mono text-[#C8A97E]">00</span>
              </Link>
              <Link
                href="/catalogo"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 text-xs uppercase tracking-[0.2em] text-white font-semibold flex items-center justify-between"
              >
                <span>Archivo Completo de Joyería</span>
                <span className="font-mono text-[#C8A97E]">→</span>
              </Link>
            </div>

            <div className="space-y-2.5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-300">
                Colecciones por Zona Anatómica
              </p>
              <div className="grid grid-cols-1 gap-2">
                {activeCategories.map((cat, idx) => (
                  <Link
                    key={cat.id}
                    href={`/categoria/${cat.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3.5 py-2.5 rounded-sm bg-[#150E1D] border border-[#3A2B4C] flex items-center justify-between text-xs text-white"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[#C8A97E]">
                        0{idx + 1}
                      </span>
                      <span className="font-display text-base tracking-wide text-white">
                        {cat.name}
                      </span>
                    </div>
                    <span className="font-mono text-white">→</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2.5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-sm btn-skull-primary inline-flex items-center justify-center gap-2 text-xs uppercase tracking-[0.18em] font-semibold"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span className="text-white">Concierge WhatsApp</span>
              </a>
              <Link
                href="/#contacto"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-sm bg-[#150E1D] border border-[#3A2B4C] text-white text-xs uppercase tracking-wider flex items-center gap-1.5"
              >
                <span className="text-white">Contacto</span>
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
