'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCatalog } from '@/context/CatalogContext';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { buildGeneralWhatsAppUrl } from '@/lib/utils/whatsapp';
import type { HeroSlide } from '@/types/database.types';

export function HeroCarousel() {
  const { settings } = useCatalog();
  const whatsappUrl = buildGeneralWhatsAppUrl(settings.whatsapp);

  const slides: HeroSlide[] =
    settings.brand.heroSlides && settings.brand.heroSlides.length > 0
      ? settings.brand.heroSlides
      : [
          {
            id: 'default-1',
            badge: settings.brand.heroBadge || 'SKULL • UN NUEVO DESPERTAR',
            title: settings.brand.heroTitle,
            subtitle: settings.brand.heroSubtitle,
            imageUrl: settings.brand.heroBannerUrl || '',
            ctaLabel: 'Ver Catálogo',
            ctaHref: '/catalogo',
          },
        ];

  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const safeIndex = activeIndex >= slides.length ? 0 : activeIndex;
  const currentSlide = slides[safeIndex];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  const isWhatsAppCta =
    currentSlide.ctaHref === 'whatsapp' ||
    (currentSlide.ctaLabel || '').toLowerCase().includes('whatsapp');

  return (
    <section
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative overflow-hidden border-b border-white/10 bg-[#0A0710]"
    >
      {/* Fotografía de fondo: protagonista, con velo only donde está el texto */}
      {slides.map((slide, idx) => (
        <div
          key={slide.id || idx}
          className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
            idx === safeIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {slide.imageUrl && (
            <img
              src={slide.imageUrl}
              alt={slide.title}
              loading={idx === 0 ? 'eager' : 'lazy'}
              decoding={idx === 0 ? 'sync' : 'async'}
              fetchPriority={idx === 0 ? 'high' : 'auto'}
              className="h-full w-full scale-105 object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070709]/95 via-[#070709]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070709]/75 via-transparent to-[#070709]/40" />
        </div>
      ))}

      <div className="relative z-10 mx-auto flex min-h-[420px] max-w-7xl items-center px-4 py-12 sm:min-h-[520px] sm:px-6 sm:py-16">
        <div className="flex w-full flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <div className="max-w-2xl flex-1 space-y-5">
            {/* Badge + controles */}
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D9BC8E]" />
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#E4CBA4] sm:text-[11px]">
                  {currentSlide.badge}
                </span>
              </div>

              {slides.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <span className="mr-1 font-mono text-[11px] text-zinc-300">
                    0{safeIndex + 1}/0{slides.length}
                  </span>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Anterior"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-colors hover:border-white/60"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Siguiente"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-colors hover:border-white/60"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Titular breve y directo */}
            <div className="space-y-3">
              <h1 className="font-display text-3xl font-medium leading-[1.1] tracking-wide text-white line-clamp-3 sm:text-5xl lg:text-[54px]">
                {currentSlide.title}
              </h1>
              <p className="max-w-lg text-sm leading-relaxed text-zinc-200 line-clamp-2 sm:text-base">
                {currentSlide.subtitle}
              </p>
            </div>

            {/* Acciones */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              {isWhatsAppCta ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] btn-skull-primary active:scale-[0.98] sm:w-auto"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  <span className="text-white">
                    {currentSlide.ctaLabel || 'Hablar por WhatsApp'}
                  </span>
                </a>
              ) : (
                <>
                  <Link
                    href={currentSlide.ctaHref || '/catalogo'}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3 text-xs font-semibold uppercase tracking-[0.16em] btn-skull-primary active:scale-[0.98] sm:w-auto"
                  >
                    <span className="text-white">
                      {currentSlide.ctaLabel || 'Ver Catálogo'}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-white" />
                  </Link>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-xs font-medium uppercase tracking-[0.16em] text-white backdrop-blur-sm transition-colors hover:border-white/60 sm:w-auto"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    <span className="text-white">WhatsApp</span>
                  </a>
                </>
              )}
            </div>

            {/* Indicadores */}
            {slides.length > 1 && (
              <div className="flex items-center gap-2 pt-1">
                {slides.map((slide, idx) => (
                  <button
                    key={slide.id || idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`Ir a diapositiva ${idx + 1}`}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx === safeIndex
                        ? 'w-10 bg-[#D9BC8E]'
                        : 'w-4 bg-white/30 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Emblema flotante (solo desktop) */}
          <div className="hidden flex-shrink-0 lg:block">
            <div className="rounded-full border border-white/25 bg-white/5 p-2 backdrop-blur-sm">
              <div className="h-36 w-36 overflow-hidden rounded-full border border-white/40 bg-black xl:h-44 xl:w-44">
                <img
                  src={settings.brand.logoUrl || '/images/logo-skull.png'}
                  alt={settings.brand.siteName}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
