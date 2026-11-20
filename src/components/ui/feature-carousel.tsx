'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// --- TYPES ---
export interface FeatureCarouselImage {
  src: string;
  alt: string;
  /** Enlace opcional al detalle de la pieza/categoría. */
  href?: string;
  /** Texto de respaldo sobre la imagen cuando no se envía `card`. */
  caption?: string;
  /**
   * Contenido personalizado de la tarjeta (imagen + precio + descuento, etc.).
   * Cuando se envía, reemplaza el render de imagen por defecto.
   */
  card?: React.ReactNode;
}

interface HeroProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  subtitle?: string;
  images: FeatureCarouselImage[];
  eyebrow?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}

// --- HERO SECTION COMPONENT ---
export const HeroSection = React.forwardRef<HTMLDivElement, HeroProps>(
  (
    {
      title,
      subtitle,
      images,
      eyebrow,
      viewAllHref,
      viewAllLabel = 'Ver todo',
      className,
      ...props
    },
    ref
  ) => {
    const total = images.length;
    const [currentIndex, setCurrentIndex] = React.useState(
      Math.floor(total / 2)
    );
    const [paused, setPaused] = React.useState(false);

    const handleNext = React.useCallback(() => {
      setCurrentIndex((prevIndex) =>
        total > 0 ? (prevIndex + 1) % total : 0
      );
    }, [total]);

    const handlePrev = React.useCallback(() => {
      setCurrentIndex((prevIndex) =>
        total > 0 ? (prevIndex - 1 + total) % total : 0
      );
    }, [total]);

    React.useEffect(() => {
      setCurrentIndex(Math.floor(total / 2));
    }, [total]);

    React.useEffect(() => {
      if (total <= 1 || paused) return;
      const timer = window.setInterval(() => {
        handleNext();
      }, 4000);
      return () => window.clearInterval(timer);
    }, [handleNext, total, paused]);

    if (total === 0) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex w-full flex-col items-center px-4 py-12 text-[#21162C] sm:px-6 sm:py-14',
          className
        )}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setPaused(false);
          }
        }}
        {...props}
      >
        {/* Gradiente de fondo en la paleta SKULL: champán + ciruela */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-25"
          aria-hidden="true"
        >
          <div className="absolute left-[-12%] top-[-12%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(154,123,79,0.35),rgba(255,255,255,0))]" />
          <div className="absolute bottom-[-18%] right-[-12%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(91,43,132,0.28),rgba(255,255,255,0))]" />
        </div>

        {/* Contenido */}
        <div className="relative z-10 flex w-full max-w-7xl flex-col items-center space-y-8 text-center md:space-y-10">
          <div className="w-full space-y-3 text-left">
            {eyebrow && (
              <span className="block text-[10px] font-semibold uppercase tracking-[0.26em] text-[#9A7B4F]">
                {eyebrow}
              </span>
            )}
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="max-w-3xl font-display text-2xl leading-tight text-[#21162C] sm:text-4xl">
                {title}
              </h2>
              {viewAllHref && (
                <Link
                  href={viewAllHref}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#5B2B84] transition-colors hover:text-[#2C1440]"
                >
                  {viewAllLabel} <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
            {subtitle && (
              <p className="max-w-2xl text-sm text-[#5A4F66] sm:text-base">
                {subtitle}
              </p>
            )}
          </div>

          {/* Escenario: sin altura fija ni scroll propio.
              Un elemento "sizer" invisible define la altura según el ancho
              de la tarjeta (aspect-ratio) y las tarjetas se superponen centradas. */}
          <div className="relative w-full [perspective:1000px]">
            <div
              className="pointer-events-none mx-auto aspect-[4/5] w-[210px] opacity-0 sm:w-[240px] md:w-[280px] lg:w-[300px]"
              aria-hidden="true"
            />

            {images.map((image, index) => {
              const offset = index - currentIndex;
              let pos = (offset + total) % total;
              if (pos > Math.floor(total / 2)) {
                pos = pos - total;
              }

              const isCenter = pos === 0;
              const isAdjacent = Math.abs(pos) === 1;
              const visible = Math.abs(pos) <= 1;

              const fallbackContent = (
                <>
                  <img
                    src={image.src}
                    alt={image.alt}
                    loading={isCenter ? 'eager' : 'lazy'}
                    decoding="async"
                    className="h-full w-full rounded-3xl border-2 border-[#DCCFC0] object-cover shadow-[0_25px_50px_rgba(44,20,64,0.18)]"
                  />
                  {image.caption && isCenter && (
                    <span className="absolute inset-x-0 bottom-0 rounded-b-3xl bg-gradient-to-t from-black/75 via-black/35 to-transparent px-4 pb-5 pt-12 text-center font-display text-sm text-white sm:text-base">
                      {image.caption}
                    </span>
                  )}
                </>
              );

              return (
                <div
                  key={`${image.src}-${index}`}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    zIndex: isCenter ? 10 : isAdjacent ? 5 : 1,
                    pointerEvents: visible ? 'auto' : 'none',
                  }}
                >
                  <div
                    className="w-[210px] transition-all duration-500 ease-in-out sm:w-[240px] md:w-[280px] lg:w-[300px]"
                    style={{
                      transform: `
                        translateX(${pos * 45}%)
                        scale(${isCenter ? 1 : isAdjacent ? 0.85 : 0.7})
                        rotateY(${pos * -10}deg)
                      `,
                      opacity: isCenter ? 1 : isAdjacent ? 0.4 : 0,
                      filter: isCenter ? 'blur(0px)' : 'blur(4px)',
                      visibility: visible ? 'visible' : 'hidden',
                    }}
                  >
                    <div className="relative aspect-[4/5] w-full">
                      {image.href ? (
                        <Link
                          href={image.href}
                          aria-label={`Ver detalle de ${image.alt}`}
                          className="relative block h-full w-full rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A7B4F]"
                        >
                          {image.card ?? fallbackContent}
                        </Link>
                      ) : (
                        <div className="relative h-full w-full">
                          {image.card ?? fallbackContent}
                        </div>
                      )}

                      {/* Las tarjetas laterales traen al centro en lugar de navegar. */}
                      {!isCenter && visible && (
                        <button
                          type="button"
                          aria-label={`Ver ${image.alt}`}
                          onClick={() => setCurrentIndex(index)}
                          className="absolute inset-0 z-10 rounded-3xl"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {total > 1 && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                aria-label="Elemento anterior"
                className="h-10 w-10 bg-white/80 backdrop-blur-sm"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="min-w-[3.5rem] text-center font-mono text-[11px] tracking-[0.18em] text-[#5A4F66]">
                {String(currentIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label="Elemento siguiente"
                className="h-10 w-10 bg-white/80 backdrop-blur-sm"
                onClick={handleNext}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

HeroSection.displayName = 'HeroSection';

export { HeroSection as FeatureCarousel };
