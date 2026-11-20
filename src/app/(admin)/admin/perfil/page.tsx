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
  Save,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useCatalog } from '@/context/CatalogContext';
import { getAuthorizedAdminEmails } from '@/lib/firebase/config';

export default function AdminProfilePage() {
  const {
    user,
    isFirebaseReady,
    isPasswordAccount,
    changeEmail,
    changePassword,
    sendPasswordRecovery,
    logout,
  } = useAuth();
  const { settings, products, categories } = useCatalog();
  const router = useRouter();

  const authorizedEmails = getAuthorizedAdminEmails();

  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

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

  const handleChangeEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setChangingEmail(true);
    try {
      await changeEmail(newEmail, emailPassword);
      setNewEmail('');
      setEmailPassword('');
      toast.success('Correo actualizado. Usa tu nuevo correo para iniciar sesión.');
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'No se pudo actualizar el correo.'
      );
    } finally {
      setChangingEmail(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Contraseña actualizada correctamente');
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'No se pudo actualizar la contraseña.'
      );
    } finally {
      setChangingPassword(false);
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
      <div className="border-b border-[#E7DFD3] pb-4">
        <span className="text-[11px] uppercase tracking-[0.22em] text-[#9A7B4F]">
          Cuenta & Seguridad
        </span>
        <h1 className="font-display text-2xl font-medium text-[#21162C]">
          Perfil de Propietaria y Cierre de Sesión
        </h1>
      </div>

      {/* Tarjeta de Identidad de la Administradora */}
      <div className="p-5 sm:p-6 rounded-sm bg-[#F1ECE5] border border-[#DCCFC0] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border border-[#5B2B84]/35 bg-[#EDE7DE] flex-shrink-0">
            <img
              src={settings.brand.logoUrl || '/images/logo-skull.png'}
              alt={settings.brand.siteName}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white border border-[#DCCFC0]">
              <UserCheck className="w-3 h-3 text-[#9A7B4F]" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#9A7B4F] font-medium">
                Propietaria Autorizada
              </span>
            </div>
            <h2 className="font-display text-xl font-medium text-[#21162C] truncate">
              {user?.displayName || 'Administradora SKULL'}
            </h2>
            <p className="font-mono text-xs text-[#4A3B58] truncate flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#9A7B4F]" />
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
            <Loader2 className="w-4 h-4 animate-spin text-[#21162C]" />
          ) : (
            <LogOut className="w-4 h-4 text-rose-300" />
          )}
          <span className="text-white">
            {loggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
          </span>
        </button>
      </div>

      {/* Cambio de credenciales de acceso */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form
          onSubmit={handleChangeEmail}
          className="p-5 rounded-sm bg-white border border-[#E7DFD3] space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-[#E7DFD3] pb-3">
            <Mail className="w-4 h-4 text-[#9A7B4F]" />
            <h3 className="font-display text-base font-medium text-[#21162C]">
              Cambiar correo electrónico
            </h3>
          </div>

          <p className="text-xs text-[#5A4F66]">
            Correo actual:{' '}
            <span className="font-mono text-[#21162C]">{user?.email}</span>
          </p>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-new-email"
              className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#21162C]"
            >
              Nuevo correo autorizado
            </label>
            <input
              id="admin-new-email"
              type="email"
              required
              autoComplete="email"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              placeholder="nuevo-correo@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCCFC0] bg-[#FAF8F5] text-sm text-[#21162C] placeholder:text-[#9A8FA8] focus:border-[#5B2B84] focus:outline-none"
            />
            <p className="text-[11px] leading-relaxed text-[#8A7E96]">
              Correos permitidos: {authorizedEmails.join(' · ') || 'Ninguno'}
            </p>
          </div>

          {isPasswordAccount ? (
            <div className="space-y-1.5">
              <label
                htmlFor="admin-email-current-password"
                className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#21162C]"
              >
                Contraseña actual
              </label>
              <input
                id="admin-email-current-password"
                type="password"
                required
                autoComplete="current-password"
                value={emailPassword}
                onChange={(event) => setEmailPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCCFC0] bg-[#FAF8F5] text-sm text-[#21162C] placeholder:text-[#9A8FA8] focus:border-[#5B2B84] focus:outline-none"
              />
            </div>
          ) : (
            <p className="text-[11px] leading-relaxed text-[#5A4F66]">
              Tu cuenta usa Google. El correo se administra desde tu cuenta de
              Google y no se puede cambiar aquí.
            </p>
          )}

          <button
            type="submit"
            disabled={changingEmail || !isPasswordAccount}
            className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-full btn-skull-primary text-xs font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-50"
          >
            {changingEmail ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{changingEmail ? 'Actualizando...' : 'Actualizar correo'}</span>
          </button>
        </form>

        <form
          onSubmit={handleChangePassword}
          className="p-5 rounded-sm bg-white border border-[#E7DFD3] space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-[#E7DFD3] pb-3">
            <KeyRound className="w-4 h-4 text-[#9A7B4F]" />
            <h3 className="font-display text-base font-medium text-[#21162C]">
              Cambiar contraseña
            </h3>
          </div>

          {isPasswordAccount ? (
            <div className="space-y-1.5">
              <label
                htmlFor="admin-current-password"
                className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#21162C]"
              >
                Contraseña actual
              </label>
              <input
                id="admin-current-password"
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCCFC0] bg-[#FAF8F5] text-sm text-[#21162C] placeholder:text-[#9A8FA8] focus:border-[#5B2B84] focus:outline-none"
              />
            </div>
          ) : (
            <p className="text-[11px] leading-relaxed text-[#5A4F66]">
              Si inicias sesión con Google, veraremos tu identidad con una
              ventana de Google antes de guardar la nueva contraseña.
            </p>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="admin-new-password"
              className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#21162C]"
            >
              Nueva contraseña
            </label>
            <input
              id="admin-new-password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCCFC0] bg-[#FAF8F5] text-sm text-[#21162C] placeholder:text-[#9A8FA8] focus:border-[#5B2B84] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-confirm-password"
              className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#21162C]"
            >
              Confirmar nueva contraseña
            </label>
            <input
              id="admin-confirm-password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repite la contraseña"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCCFC0] bg-[#FAF8F5] text-sm text-[#21162C] placeholder:text-[#9A8FA8] focus:border-[#5B2B84] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-full btn-skull-primary text-xs font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-50"
          >
            {changingPassword ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <KeyRound className="w-4 h-4" />
            )}
            <span>
              {changingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
            </span>
          </button>
        </form>
      </div>

      {/* Detalles Técnicos de Sesión y Permisos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-sm bg-white border border-[#E7DFD3] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E7DFD3] pb-3">
            <ShieldCheck className="w-4 h-4 text-[#9A7B4F]" />
            <h3 className="font-display text-base font-medium text-[#21162C]">
              Estado de Seguridad y Permisos
            </h3>
          </div>

          <div className="divide-y divide-[#E7DFD3] text-xs">
            <div className="py-2.5 flex items-center justify-between gap-2">
              <span className="text-[#5A4F66]">Proyecto Firebase</span>
              <span className="font-mono text-[#21162C]">
                skull-un-nuevo-despertar
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-2">
              <span className="text-[#5A4F66]">Estado Cloud Firestore</span>
              <span className="inline-flex items-center gap-1.5 font-mono text-emerald-400">
                <Cloud className="w-3.5 h-3.5" />
                <span>{isFirebaseReady ? 'Conectado' : 'Modo Local'}</span>
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-2">
              <span className="text-[#5A4F66]">UID de Cuenta</span>
              <span className="font-mono text-[#4A3B58] truncate max-w-[180px]">
                {user?.uid}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-2">
              <span className="text-[#5A4F66]">Vigencia de Sesión</span>
              <span className="font-mono text-[#9A7B4F]">
                {sessionExpiryText}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-2">
              <span className="text-[#5A4F66]">Permisos Habilitados</span>
              <span className="text-[#21162C] font-medium">
                Productos ({products.length}) • Categorías ({categories.length})
              </span>
            </div>
          </div>
        </div>

        {/* Seguridad de Contraseña y Medios */}
        <div className="p-5 rounded-sm bg-white border border-[#E7DFD3] flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-[#E7DFD3] pb-3">
              <KeyRound className="w-4 h-4 text-[#9A7B4F]" />
              <h3 className="font-display text-base font-medium text-[#21162C]">
                Seguridad de Acceso
              </h3>
            </div>

            <p className="text-xs text-[#5A4F66] leading-relaxed">
              Si deseas actualizar tu contraseña de acceso administrativo, te enviaremos un enlace oficial de Firebase Authentication a{' '}
              <span className="font-mono text-[#21162C]">{user?.email}</span>.
            </p>

            {resetSent ? (
              <div className="p-3 rounded-sm bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2 text-xs text-[#21162C]">
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
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#21162C]" />
                ) : (
                  <KeyRound className="w-3.5 h-3.5 text-[#9A7B4F]" />
                )}
                <span className="text-[#21162C]">
                  {sendingReset
                    ? 'Enviando enlace...'
                    : 'Enviar Enlace para Cambiar Contraseña'}
                </span>
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-[#E7DFD3] space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-[#5A4F66]">
              Herramientas Adicionales
            </p>
            <Link
              href="/admin/imagenes"
              className="w-full py-2.5 px-4 rounded-sm btn-skull-primary text-xs uppercase tracking-[0.16em] font-semibold flex items-center justify-center gap-2"
            >
              <ImageIcon className="w-4 h-4 text-[#21162C]" />
              <span className="text-[#21162C]">Abrir Biblioteca de Imágenes</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

