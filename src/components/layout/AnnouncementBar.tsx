'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useCatalog } from '@/context/CatalogContext';
import {
  ANNOUNCEMENT_MAX_MESSAGES,
  normalizeAnnouncementMessages,
} from '@/lib/announcements';

const ROTATION_MS = 4000;

export function AnnouncementBar() {
  const { settings } = useCatalog();

  const messages = useMemo(() => {
    const configured = normalizeAnnouncementMessages(
      settings.brand.announcementMessages
    );
    if (configured.length > 0) return configured;

    // Compatibilidad con configuraciones que solo tenían un cintillo de texto.
    const legacy = (settings.brand.announcementBar || '').trim();
    if (!legacy) return [];

    return normalizeAnnouncementMessages(
      legacy.split(/[•|✦]/).slice(0, ANNOUNCEMENT_MAX_MESSAGES)
    );
  }, [settings.brand.announcementMessages, settings.brand.announcementBar]);

  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = activeIndex >= messages.length ? 0 : activeIndex;

  useEffect(() => {
    setActiveIndex(0);
  }, [messages.join('|')]);

  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % messages.length);
    }, ROTATION_MS);
    return () => clearInterval(timer);
  }, [messages.length]);

  if (messages.length === 0) return null;

  return (
    <div className="border-b border-[#2E213D] bg-[#150E1D] px-4 py-2">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-1.5">
        {/* Sin truncate: el mensaje puede saltar de línea (máx. 2 renglones) */}
        <div className="flex min-h-[2rem] w-full items-center justify-center text-center sm:min-h-[2.25rem]">
          <p
            key={`${safeIndex}-${messages[safeIndex]}`}
            className="announcement-in max-w-full text-[10px] uppercase leading-relaxed tracking-[0.16em] text-zinc-200 sm:text-[11px]"
          >
            {messages[safeIndex]}
          </p>
        </div>

        {messages.length > 1 && (
          <div
            className="flex items-center justify-center gap-2"
            aria-label="Mensajes del cintillo"
          >
            {messages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`Ver mensaje ${idx + 1}`}
                aria-current={idx === safeIndex}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === safeIndex
                    ? 'w-5 bg-[#C8A97E]'
                    : 'w-1.5 bg-white/25 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
