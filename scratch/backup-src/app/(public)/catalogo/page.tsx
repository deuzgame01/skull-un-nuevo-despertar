import React from 'react';
import type { Metadata } from 'next';
import { CatalogoView } from '@/components/catalog/CatalogoView';

export const metadata: Metadata = {
  title: 'Catálogo de Joyería Corporal & Piercing',
  description:
    'Explora nuestra colección oficial de joyería corporal en Titanio Grado Implante ASTM F-136, ópalos y curaduría anatómica para Septum, Daith, Helix, Nostril y más.',
  alternates: {
    canonical: '/catalogo',
  },
  openGraph: {
    title: 'Catálogo de Joyería Corporal | SKULL – Un Nuevo Despertar',
    description:
      'Piezas exclusivas en Titanio Grado Implante ASTM F-136. Consulta disponibilidad inmediata y solicita tu pieza por WhatsApp.',
    url: '/catalogo',
    siteName: 'SKULL – Un Nuevo Despertar',
    type: 'website',
    locale: 'es_CO',
    images: [
      {
        url: '/images/logo-skull.png',
        width: 800,
        height: 800,
        alt: 'Catálogo SKULL – Un Nuevo Despertar',
      },
    ],
  },
};

export default function CatalogoPage() {
  return <CatalogoView />;
}
