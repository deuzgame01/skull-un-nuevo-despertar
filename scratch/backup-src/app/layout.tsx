import type { Metadata, Viewport } from 'next';
import {
  Cinzel,
  Cormorant_Garamond,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
} from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { CatalogProvider } from '@/context/CatalogContext';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  weight: ['500', '600', '700'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#070709',
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'
  ),
  title: {
    default: 'SKULL – Un Nuevo Despertar | Joyería Corporal & Piercing',
    template: '%s | SKULL – Un Nuevo Despertar',
  },
  description:
    'Boutique digital de joyería corporal certificada en Titanio Grado Implante ASTM F-136, ópalos y curaduría anatómica de perforaciones.',
  icons: {
    icon: '/images/logo-skull.png',
    apple: '/images/logo-skull.png',
  },
  openGraph: {
    title: 'SKULL – Un Nuevo Despertar | Catálogo Oficial',
    description:
      'Explora nuestra colección de joyería corporal en Titanio Grado Implante y solicita tu pieza directo por WhatsApp.',
    type: 'website',
    locale: 'es_LA',
    images: ['/images/logo-skull.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${jakarta.variable} ${cormorant.variable} ${cinzel.variable} ${jetbrainsMono.variable} dark`}
    >
      <body className="font-sans bg-skull-bg text-skull-alabaster antialiased selection:bg-skull-plum selection:text-skull-champagne">
        <AuthProvider>
          <CatalogProvider>
            {children}
            <Toaster
              theme="dark"
              position="top-center"
              toastOptions={{
                style: {
                  background: '#150E1D',
                  border: '1px solid #C8A97E',
                  color: '#F5F2EB',
                  borderRadius: '4px',
                  fontSize: '12px',
                },
              }}
            />
          </CatalogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
