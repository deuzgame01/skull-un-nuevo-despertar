import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SKULL – Un Nuevo Despertar',
    short_name: 'SKULL Piercing',
    description:
      'Catálogo Digital y Boutique de Joyería Corporal SKULL – Un Nuevo Despertar',
    start_url: '/',
    display: 'standalone',
    background_color: '#070709',
    theme_color: '#3B1D5A',
    icons: [
      {
        src: '/images/logo-skull.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
