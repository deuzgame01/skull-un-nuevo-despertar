'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Cloud,
  ExternalLink,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/productos', label: 'Productos', icon: Package, exact: false },
  {
    href: '/admin/categorias',
    label: 'Categorías',
    icon: FolderKanban,
    exact: false,
  },
  {
    href: '/admin/configuracion',
    label: 'Configuración',
    icon: Settings,
    exact: false,
  },
  {
    href: '/admin/perfil',
    label: 'Perfil',
    icon: UserCheck,
    exact: false,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, sessionExpired, isFirebaseReady, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginRoute = pathname === '/admin/login';

  useEffect(() => {
    if (!loading && !user && !isLoginRoute) {
      const params = new URLSearchParams();
      if (pathname !== '/admin') {
        params.set('redirect', pathname);
      }
      if (sessionExpired) {
        params.set('expired', '1');
      }
      const query = params.toString();
      router.replace(`/admin/login${query ? `?${query}` : ''}`);
    }
  }, [loading, user, isLoginRoute, pathname, sessionExpired, router]);

  if (isLoginRoute) {
    return <div className="min-h-dvh bg-[#070709] text-white">{children}</div>;
  }

  if (loading || !user) {
    return (
      <div className="min-h-dvh bg-[#070709] flex flex-col items-center justify-center gap-3 p-6 text-center">
        <img
          src="/images/logo-skull.png"
          alt="SKULL"
          className="w-14 h-14 rounded-full border border-white/40 bg-black"
        />
        <p className="text-xs uppercase tracking-[0.22em] text-white">
          Verificando sesión de propietaria...
        </p>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout('manual');
    toast.success('Sesión administrativa cerrada');
    router.replace('/admin/login');
  };

  const isNavItemActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="min-h-dvh bg-[#070709] text-white flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Sidebar Minimalista Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-[#0E0A14] border-r border-[#261C31] z-30">
        <div className="p-5 border-b border-[#261C31] flex items-center gap-3">
          <img
            src="/images/logo-skull.png"
            alt="SKULL"
            className="w-10 h-10 rounded-full border border-white/40 object-cover bg-black"
          />
          <div className="min-w-0">
            <p className="font-display text-base font-semibold text-white tracking-[0.18em] truncate">
              SKULL ADMIN
            </p>
            <p className="text-[11px] font-mono text-zinc-300 truncate">
              {user.email}
            </p>
          </div>
        </div>

        <nav className="flex-1 p-3.5 space-y-1.5">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-xs uppercase tracking-[0.15em] font-medium editorial-transition ${
                  active
                    ? 'btn-skull-primary font-semibold'
                    : 'text-zinc-200 hover:bg-[#150E1D] hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 text-white flex-shrink-0" />
                <span className="text-white">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3.5 border-t border-[#261C31] space-y-2">
          <div className="px-3 py-2 rounded-sm bg-[#150E1D] border border-[#3A2B4C] text-[11px] flex items-center gap-2">
            {isFirebaseReady ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="text-white font-mono">Firestore Conectado</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[#C8A97E] flex-shrink-0" />
                <span className="text-white font-mono">Sesión Activa</span>
              </>
            )}
          </div>

          <Link
            href="/"
            target="_blank"
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-sm btn-skull-secondary text-xs uppercase tracking-[0.14em]"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#C8A97E]" />
            <span className="text-white">Ver Catálogo Público</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-sm bg-[#070709] border border-[#3A2B4C] hover:border-rose-500/60 text-xs uppercase tracking-[0.14em] text-white editorial-transition"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-300" />
            <span className="text-white">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Área Central */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Encabezado Compacto Móvil y Escritorio */}
        <header className="sticky top-0 z-30 bg-[#070709]/95 border-b border-[#261C31] px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/images/logo-skull.png"
              alt="SKULL"
              className="w-8 h-8 rounded-full border border-white/40 object-cover bg-black md:hidden flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-white tracking-[0.14em] truncate">
                SKULL • CENTRO DE CONTROL
              </p>
              <p className="text-[10px] font-mono text-zinc-300 truncate">
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm btn-skull-secondary text-[11px] uppercase tracking-wider"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#C8A97E]" />
              <span className="text-white">Catálogo</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="p-2 rounded-sm bg-[#150E1D] border border-[#3A2B4C] hover:border-rose-500/60 text-white"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 text-rose-300" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Navegación Inferior Táctil (Accesible con una mano en celular) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0E0A14] border-t border-[#261C31] px-1.5 py-1.5 grid grid-cols-5 gap-1">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isNavItemActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 rounded-sm text-[10px] uppercase tracking-wider font-medium editorial-transition ${
                active
                  ? 'btn-skull-primary font-semibold'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5 text-white" />
              <span className="truncate max-w-full px-0.5 text-white">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
