'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

function AdminLoginContent() {
  const {
    user,
    loading,
    authError,
    sessionExpired,
    clearAuthError,
    loginWithEmail,
    loginWithGoogle,
    sendPasswordRecovery,
  } = useAuth();

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/admin';
  const expiredParam = searchParams.get('expired') === '1';

  const [mode, setMode] = useState<'login' | 'recovery'>('login');
  const [email, setEmail] = useState('deuzgame01@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Si ya hay sesión activa y válida, redirigir automáticamente
  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTarget);
    }
  }, [loading, user, router, redirectTarget]);

  const switchMode = (nextMode: 'login' | 'recovery') => {
    setMode(nextMode);
    setLocalError(null);
    setRecoverySent(false);
    clearAuthError();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();
    setSubmitting(true);

    try {
      await loginWithEmail(email, password);
      toast.success('Bienvenida al panel administrativo de SKULL');
      router.replace(redirectTarget);
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : 'No se pudo iniciar sesión. Verifica tus credenciales.';
      setLocalError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    clearAuthError();
    setSubmitting(true);

    try {
      await loginWithGoogle();
      toast.success('Sesión iniciada correctamente');
      router.replace(redirectTarget);
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : 'No se pudo autenticar con Google.';
      setLocalError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();
    setSubmitting(true);

    try {
      await sendPasswordRecovery(email);
      setRecoverySent(true);
      toast.success('Correo de recuperación enviado');
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : 'No se pudo enviar el correo de recuperación.';
      setLocalError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-dvh bg-[#F6F3EE] flex flex-col justify-center items-center px-4 py-10">
      <div className="w-full max-w-sm space-y-5">
        {/* Enlace de retorno al catálogo público */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#5A4F66] hover:text-[#21162C] editorial-transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#9A7B4F]" />
          <span>Volver al Catálogo</span>
        </Link>

        {/* Tarjeta Principal de Autenticación (Dark Luxury) */}
        <div className="bg-white border border-[#E7DFD3] rounded-sm p-6 sm:p-8 space-y-6">
          {/* Cabecera con Emblema Oficial */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-1 rounded-full border border-[#DCCFC0] bg-[#F1ECE5]">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-[#5B2B84]/35 bg-[#EDE7DE]">
                <img
                  src="/images/logo-skull.png"
                  alt="SKULL"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#F1ECE5] border border-[#DCCFC0]">
                <ShieldCheck className="w-3 h-3 text-[#9A7B4F]" />
                <span className="text-[10px] uppercase tracking-[0.22em] text-[#9A7B4F] font-medium">
                  Entorno Privado
                </span>
              </div>
              <h1 className="font-display text-2xl font-medium text-[#21162C] pt-1">
                {mode === 'login'
                  ? 'Acceso de Propietaria'
                  : 'Recuperar Contraseña'}
              </h1>
              <p className="text-xs text-[#5A4F66]">
                {mode === 'login'
                  ? 'Administración exclusiva del catálogo SKULL'
                  : 'Te enviaremos un enlace seguro a tu correo autorizado'}
              </p>
            </div>
          </div>

          {/* Alerta de Sesión Expirada */}
          {(expiredParam || sessionExpired) && !displayError && (
            <div
              role="alert"
              className="p-3.5 rounded-sm bg-amber-950/50 border border-amber-500/40 flex items-start gap-2.5 text-xs text-[#21162C]"
            >
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#21162C]">Sesión expirada</p>
                <p className="text-[#4A3B58] mt-0.5">
                  Por seguridad tu sesión se cerró automáticamente. Inicia sesión nuevamente.
                </p>
              </div>
            </div>
          )}

          {/* Aviso de Ruta Protegida */}
          {searchParams.get('redirect') &&
            !expiredParam &&
            !sessionExpired &&
            !displayError && (
              <div className="p-3 rounded-sm bg-[#F1ECE5] border border-[#DCCFC0] text-xs text-[#4A3B58] text-center">
                Inicia sesión como administradora para continuar a{' '}
                <span className="font-mono text-[#9A7B4F]">
                  {searchParams.get('redirect')}
                </span>
              </div>
            )}

          {/* Alerta de Error de Autenticación / Autorización */}
          {displayError && (
            <div
              role="alert"
              className="p-3.5 rounded-sm bg-rose-950/60 border border-rose-500/50 flex items-start gap-2.5 text-xs text-[#21162C]"
            >
              <AlertCircle className="w-4 h-4 text-rose-300 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed text-[#21162C]">{displayError}</span>
            </div>
          )}

          {/* MODO 1: INICIO DE SESIÓN */}
          {mode === 'login' ? (
            <div className="space-y-4">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-email"
                    className="block text-xs uppercase tracking-wider text-[#21162C]"
                  >
                    Correo de Propietaria
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#6B6272] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="admin-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="deuzgame01@gmail.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-sm bg-[#F6F3EE] border border-[#DCCFC0] text-sm text-[#21162C] placeholder:text-[#9A8FA8] focus:outline-none focus:border-[#5B2B84]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="admin-password"
                      className="block text-xs uppercase tracking-wider text-[#21162C]"
                    >
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode('recovery')}
                      className="text-[11px] text-[#9A7B4F] hover:text-[#21162C] underline underline-offset-4"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#6B6272] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-sm bg-[#F6F3EE] border border-[#DCCFC0] text-sm text-[#21162C] placeholder:text-[#9A8FA8] focus:outline-none focus:border-[#5B2B84]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6272] hover:text-[#21162C]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-sm btn-skull-primary disabled:opacity-50 text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#21162C]" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-[#21162C]" />
                  )}
                  <span className="text-[#21162C]">
                    {submitting ? 'Verificando...' : 'Entrar al Panel'}
                  </span>
                </button>
              </form>

              <div className="border-t border-[#E7DFD3] pt-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={submitting}
                  className="w-full py-2.5 px-4 rounded-sm btn-skull-secondary disabled:opacity-50 text-xs uppercase tracking-[0.16em] font-medium flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <span className="text-[#21162C]">
                    Continuar con Google Auth
                  </span>
                </button>
              </div>
            </div>
          ) : (
            /* MODO 2: RECUPERACIÓN DE CONTRASEÑA */
            <div className="space-y-4">
              {recoverySent ? (
                <div className="p-4 rounded-sm bg-emerald-950/40 border border-emerald-500/40 space-y-3 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="font-display text-lg text-[#21162C]">
                    Enlace de recuperación enviado
                  </p>
                  <p className="text-xs text-[#4A3B58] leading-relaxed">
                    Hemos enviado las instrucciones de restablecimiento a{' '}
                    <span className="font-mono text-[#9A7B4F]">{email}</span>.
                    Revisa tu bandeja de entrada o carpeta de spam.
                  </p>
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="w-full py-2.5 rounded-sm btn-skull-primary text-xs uppercase tracking-[0.18em] font-semibold"
                  >
                    <span className="text-[#21162C]">Volver a Iniciar Sesión</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRecoverySubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="recovery-email"
                      className="block text-xs uppercase tracking-wider text-[#21162C]"
                    >
                      Correo Autorizado
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#6B6272] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="recovery-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="deuzgame01@gmail.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-sm bg-[#F6F3EE] border border-[#DCCFC0] text-sm text-[#21162C] placeholder:text-[#9A8FA8] focus:outline-none focus:border-[#5B2B84]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-sm btn-skull-primary disabled:opacity-50 text-xs uppercase tracking-[0.18em] font-semibold flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#21162C]" />
                    ) : (
                      <KeyRound className="w-3.5 h-3.5 text-[#21162C]" />
                    )}
                    <span className="text-[#21162C]">
                      {submitting
                        ? 'Enviando enlace...'
                        : 'Enviar Enlace de Recuperación'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="w-full py-2.5 rounded-sm btn-skull-secondary text-xs uppercase tracking-[0.16em]"
                  >
                    <span className="text-[#21162C]">Cancelar y Volver</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[#F6F3EE] flex items-center justify-center text-xs uppercase tracking-widest text-[#21162C]">
          Cargando entorno seguro...
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
