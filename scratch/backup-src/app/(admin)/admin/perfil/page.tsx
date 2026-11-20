'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Cloud,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useCatalog } from '@/context/CatalogContext';

export default function AdminProfilePage() {
  const { user, isFirebaseReady, sendPasswordRecovery, logout } = useAuth();
  const { settings, products, categories } = useCatalog();
  const router = useRouter();

  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      await sendPasswordRecovery(user.email);
      setResetSent(true);
      toast.success('Enlace para cambiar contraseña enviado a tu correo');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'No se pudo enviar el enlace de seguridad';
      toast.error(msg);
    } finally {
      setSendingReset(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout('manual');
      toast.success('Has cerrado sesión correctamente');
      router.replace('/admin/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const sessionExpiryText = user?.expiresAt
    ? new Date(user.expiresAt).toLocaleString('es-CO', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'Sesión activa';

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="border-b border-[#261C31] pb-4">
        <span className="text-[11px] uppercase tracking-[0.22em] text-[#C8A97E]">
          Cuenta & Seguridad
        </span>
        <h1 className="font-display text-2xl font-medium text-white">
          Perfil de Propietaria y Cierre de Sesión
        </h1>
      </div>

      {/* Tarjeta de Identidad de la Administradora */}
      <div className="p-5 sm:p-6 rounded-sm bg-[#150E1D] border border-[#3A2B4C] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border border-white/40 bg-black flex-shrink-0">
            <img
              src={settings.brand.logoUrl || '/images/logo-skull.png'}
              alt={settings.brand.siteName}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#0E0A14] border border-[#3A2B4C]">
              <UserCheck className="w-3 h-3 text-[#C8A97E]" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A97E] font-medium">
                Propietaria Autorizada
              </span>
            </div>
            <h2 className="font-display text-xl font-medium text-white truncate">
              {user?.displayName || 'Administradora SKULL'}
            </h2>
            <p className="font-mono text-xs text-zinc-200 truncate flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#C8A97E]" />
              <span>{user?.email}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-sm bg-rose-950/70 hover:bg-rose-900 border border-rose-500/60 text-xs uppercase tracking-[0.18em] font-semibold text-white active:scale-[0.98] editorial-transition"
        >
          {loggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <LogOut className="w-4 h-4 text-rose-300" />
          )}
          <span className="text-white">
            {loggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
          </span>
        </button>
      </div>

      {/* Detalles Técnicos de Sesión y Permisos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-sm bg-[#0E0A14] border border-[#261C31] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#261C31] pb-3">
            <ShieldCheck className="w-4 h-4 text-[#C8A97E]" />
            <h3 className="font-display text-base font-medium text-white">
              Estado de Seguridad y Permisos
            </h3>
          </div>

          <div className="divide-y divide-[#261C31] text-xs">
            <div className="py-2.5 flex items-center justify-between gap-2">
              <span className="text-zinc-300">Proyecto Firebase</span>
              <span className="font-mono text-white">
                skull-un-nuevo-despertar
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-2">
              <span className="text-zinc-300">Estado Cloud Firestore</span>
              <span className="inline-flex items-center gap-1.5 font-mono text-emerald-400">
                <Cloud className="w-3.5 h-3.5" />
                <span>{isFirebaseReady ? 'Conectado' : 'Modo Local'}</span>
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-2">
              <span className="text-zinc-300">UID de Cuenta</span>
              <span className="font-mono text-zinc-200 truncate max-w-[180px]">
                {user?.uid}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-2">
              <span className="text-zinc-300">Vigencia de Sesión</span>
              <span className="font-mono text-[#C8A97E]">
                {sessionExpiryText}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-2">
              <span className="text-zinc-300">Permisos Habilitados</span>
              <span className="text-white font-medium">
                Productos ({products.length}) • Categorías ({categories.length})
              </span>
            </div>
          </div>
        </div>

        {/* Seguridad de Contraseña y Medios */}
        <div className="p-5 rounded-sm bg-[#0E0A14] border border-[#261C31] flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-[#261C31] pb-3">
              <KeyRound className="w-4 h-4 text-[#C8A97E]" />
              <h3 className="font-display text-base font-medium text-white">
                Seguridad de Acceso
              </h3>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Si deseas actualizar tu contraseña de acceso administrativo, te enviaremos un enlace oficial de Firebase Authentication a{' '}
              <span className="font-mono text-white">{user?.email}</span>.
            </p>

            {resetSent ? (
              <div className="p-3 rounded-sm bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2 text-xs text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  Enlace enviado. Revisa la bandeja de entrada de tu correo.
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={sendingReset}
                className="w-full py-2.5 px-4 rounded-sm btn-skull-secondary text-xs uppercase tracking-[0.16em] font-medium flex items-center justify-center gap-2"
              >
                {sendingReset ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <KeyRound className="w-3.5 h-3.5 text-[#C8A97E]" />
                )}
                <span className="text-white">
                  {sendingReset
                    ? 'Enviando enlace...'
                    : 'Enviar Enlace para Cambiar Contraseña'}
                </span>
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-[#261C31] space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-zinc-300">
              Herramientas Adicionales
            </p>
            <Link
              href="/admin/imagenes"
              className="w-full py-2.5 px-4 rounded-sm btn-skull-primary text-xs uppercase tracking-[0.16em] font-semibold flex items-center justify-center gap-2"
            >
              <ImageIcon className="w-4 h-4 text-white" />
              <span className="text-white">Abrir Biblioteca de Imágenes</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

