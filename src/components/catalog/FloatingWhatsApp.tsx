'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { useCatalog } from '@/context/CatalogContext';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import {
  buildGeneralWhatsAppUrl,
  isWhatsAppConfigured,
} from '@/lib/utils/whatsapp';

export function FloatingWhatsApp() {
  const { settings } = useCatalog();

  if (
    !settings.whatsapp.showFloatingButton ||
    !isWhatsAppConfigured(settings.whatsapp)
  ) {
    return null;
  }

  const url = buildGeneralWhatsAppUrl(settings.whatsapp);
  if (!url) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2.5 sm:right-6">
      <Link
        href="/agendar"
        aria-label="Agendar una cita"
        className="flex items-center gap-2.5 px-4 py-2.5 sm:py-3 rounded-sm btn-skull-primary shadow-xl active:scale-[0.98]"
      >
        <CalendarDays className="h-5 w-5" />
        <span className="text-xs uppercase tracking-[0.18em] font-semibold text-white">
          Agendar cita
        </span>
      </Link>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contacto general por WhatsApp"
        className="flex items-center gap-2.5 px-4 py-2.5 sm:py-3 rounded-sm btn-skull-primary shadow-xl active:scale-[0.98]"
      >
        <WhatsAppIcon className="w-5 h-5" />
        <span className="text-xs uppercase tracking-[0.18em] font-semibold text-white">
          {settings.whatsapp.floatingButtonLabel || 'WhatsApp'}
        </span>
      </a>
    </div>
  );
}
