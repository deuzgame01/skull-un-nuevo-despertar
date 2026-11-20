'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CalendarDays,
  Eye,
  EyeOff,
  Globe2,
  Home,
  LayoutGrid,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useCatalog } from '@/context/CatalogContext';
import { GoogleIcon } from '@/components/ui/GoogleIcon';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

interface BrandPanelProps {
  open: boolean;
  onClose: () => void;
  whatsappUrl: string;
}

type PanelView = 'brand' | 'login';

export function BrandPanel({ open, onClose, whatsappUrl }: BrandPanelProps) {
  const { settings } = useCatalog();
  const {
    authError,
    clearAuthError,
    isFirebaseReady,
    loginWithEmail,
    loginWithGoogle,
    sendPasswordRecovery,
    user,
  } = useAuth();
  const router = useRouter();

  const [view, setView] = useState<PanelView>('brand');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  // Al cerrar, el panel vuelve siempre a su presentación original.
  useEffect(() => {
    if (open) return;
    setView('brand');
    setPassword('');
    setShowPassword(false);
    setSubmitting(false);
    setLocalError(null);
  }, [open]);

  if (!open) return null;

  const displayError = localError || authError;

  const switchView = (nextView: PanelView) => {
    setView(nextView);
    setLocalError(null);
    clearAuthError();
  };

  const showFailure = (error: unknown, fallback: string) => {
    const message =
      error instanceof Error ? error.message : fallback;
    setLocalError(message);
    toast.error(message);
  };

  const finishLogin = (message: string) => {
    toast.success(message);
    onClose();
    router.replace('/admin');
  };

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    clearAuthError();
    setSubmitting(true);

    try {
      await loginWithEmail(email.trim(), password);
      finishLogin('Bienvenida al panel administrativo de SKULL');
    } catch (error) {
      showFailure(error, 'No se pudo iniciar sesión. Verifica tus credenciales.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    clearAuthError();

    if (!isFirebaseReady) {
      const message =
        'El acceso con Google no está disponible hasta configurar Firebase.';
      setLocalError(message);
      toast.error(message);
      return;
    }

    setSubmitting(true);
    try {
      await loginWithGoogle();
      finishLogin('Sesión iniciada con Google');
    } catch (error) {
      showFailure(error, 'No se pudo autenticar con Google.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecovery = async () => {
    setLocalError(null);
    clearAuthError();

    if (!email.trim()) {
      const message = 'Escribe tu correo antes de solicitar el enlace.';
      setLocalError(message);
      toast.error(message);
      return;
    }

    setSubmitting(true);
    try {
      await sendPasswordRecovery(email.trim());
      toast.success('Correo de recuperación enviado');
    } catch (error) {
      showFailure(error, 'No se pudo enviar el correo de recuperación.');
    } finally {
      setSubmitting(false);
    }
  };

  const actions = [
    {
      href: '/',
      label: 'Ir al inicio',
      description: 'Volver a la portada y ver lo nuevo',
      icon: Home,
    },
    {
      href: '/catalogo',
      label: 'Ver catálogo',
      description: 'Explorar toda la joyería disponible',
      icon: LayoutGrid,
    },
    {
      href: '/agendar',
      label: 'Agendar una cita',
      description: 'Elige tu día y hora en el estudio',
      icon: CalendarDays,
    },
    {
      href: whatsappUrl,
      label: 'Escribir por WhatsApp',
      description: 'Asesoría, medidas y pedidos directos',
      icon: WhatsAppIcon,
      external: true,
    },
  ];

  const contactItems = [
    {
      icon: Phone,
      value: settings.brand.contactPhone,
      href: settings.brand.contactPhone
        ? `tel:${settings.brand.contactPhone.replace(/[^\d+]/g, '')}`
        : undefined,
    },
    {
      icon: Mail,
      value: settings.brand.contactEmail,
      href: settings.brand.contactEmail
        ? `mailto:${settings.brand.contactEmail}`
        : undefined,
    },
    { icon: MapPin, value: settings.brand.contactAddress },
    { icon: Building2, value: settings.brand.contactCity },
    { icon: Globe2, value: settings.brand.contactCountry },
  ].filter((item) => Boolean(item.value && item.value.trim()));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={view === 'brand' ? 'Presentación de SKULL' : 'Inicio de sesión'}
      className="panel-fade fixed inset-0 z-[120] overflow-y-auto bg-[#070709] text-white"
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(90,43,132,0.22),transparent_62%)]" />

      <div className="relative mx-auto flex min-h-full max-w-3xl flex-col px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => switchView(view === 'brand' ? 'login' : 'brand')}
            aria-label={view === 'brand' ? 'Iniciar sesión' : 'Volver a la presentación'}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-white/25 bg-white/5 px-4 text-white transition-colors hover:border-white/70"
          >
            {view === 'brand' ? (
              <UserRound className="h-5 w-5" />
            ) : (
              <ArrowLeft className="h-5 w-5" />
            )}
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] sm:inline">
              {view === 'brand' ? 'Acceso' : 'Volver'}
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/5 text-white transition-colors hover:border-white/70"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {view === 'brand' ? (
          <>
            <div className="flex flex-1 flex-col items-center justify-center gap-8 py-10 text-center">
              {/* Espacio libre para montar el logo o imagen PNG (cualquier forma). */}
              <div className="flex h-40 w-full max-w-md items-center justify-center rounded-3xl border border-white/15 bg-white/5 p-6 sm:h-56">
                <img
                  src={settings.brand.logoUrl || '/images/logo-skull.png'}
                  alt={settings.brand.siteName}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[#C8A97E]">
                  {settings.brand.tagline}
                </p>
                <h2 className="font-display text-3xl font-semibold leading-tight tracking-wide text-white sm:text-5xl">
                  {settings.brand.siteName}
                </h2>
                <p className="mx-auto max-w-xl text-sm leading-relaxed text-zinc-300">
                  {settings.brand.description}
                </p>

                {contactItems.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 pt-2 text-left sm:grid-cols-2">
                    {contactItems.map((item) => {
                      const Icon = item.icon;
                      const content = (
                        <>
                          <Icon className="h-4 w-4 shrink-0 text-[#C8A97E]" />
                          <span className="break-words text-xs leading-snug text-zinc-200">
                            {item.value}
                          </span>
                        </>
                      );
                      const className =
                        'flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5';

                      return item.href ? (
                        <a
                          key={item.value}
                          href={item.href}
                          className={`${className} transition-colors hover:border-white/40`}
                        >
                          {content}
                        </a>
                      ) : (
                        <div key={item.value} className={className}>
                          {content}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-3 pb-4 sm:grid-cols-3">
              {actions.map((action) => {
                const Icon = action.icon;
                const content = (
                  <>
                    <span className="flex items-center gap-2 text-sm font-semibold text-[#21162C]">
                      <Icon className="h-4 w-4 shrink-0 text-[#9A7B4F]" />
                      {action.label}
                    </span>
                    <span className="mt-1 block text-left text-[11px] leading-snug text-[#5A4F66]">
                      {action.description}
                    </span>
                  </>
                );
                const className =
                  'block rounded-2xl bg-white px-4 py-3.5 transition-transform hover:-translate-y-0.5';

                return action.external ? (
                  <a
                    key={action.label}
                    href={action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                    className={className}
                  >
                    {content}
                  </a>
                ) : (
                  <Link
                    key={action.label}
                    href={action.href}
                    onClick={onClose}
                    className={className}
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center py-8">
            <div className="w-full max-w-md space-y-5 rounded-3xl border border-white/15 bg-white p-6 text-[#21162C] shadow-2xl sm:p-8">
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F1ECE5] ring-1 ring-[#DCCFC0]">
                  <ShieldCheck className="h-5 w-5 text-[#9A7B4F]" />
                </span>
                <h2 className="font-display text-2xl text-[#21162C]">
                  Inicio de sesión
                </h2>
                <p className="text-xs leading-relaxed text-[#5A4F66]">
                  Acceso privado para la propietaria de SKULL
                </p>
                {user && (
                  <p className="text-[11px] text-[#9A7B4F]">
                    Sesión activa: {user.email}
                  </p>
                )}
              </div>

              {displayError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-[#7F1D1D]"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="leading-relaxed">{displayError}</span>
                </div>
              )}

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="panel-email"
                    className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#21162C]"
                  >
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6272]" />
                    <input
                      id="panel-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="tu-correo@gmail.com"
                      className="w-full rounded-xl border border-[#DCCFC0] bg-[#FAF8F5] py-2.5 pl-10 pr-3.5 text-sm text-[#21162C] placeholder:text-[#9A8FA8] focus:border-[#5B2B84] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="panel-password"
                      className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#21162C]"
                    >
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={handleRecovery}
                      disabled={submitting}
                      className="text-[11px] text-[#9A7B4F] underline underline-offset-4 hover:text-[#21162C] disabled:opacity-50"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6272]" />
                    <input
                      id="panel-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-[#DCCFC0] bg-[#FAF8F5] py-2.5 pl-10 pr-10 text-sm text-[#21162C] placeholder:text-[#9A8FA8] focus:border-[#5B2B84] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6272] hover:text-[#21162C]"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#2C1440] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#5B2B84] disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                  {submitting ? 'Verificando...' : 'Entrar al panel'}
                </button>
              </form>

              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-[#E7DFD3]" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#9A8FA8]">
                  o continúa con
                </span>
                <span className="h-px flex-1 bg-[#E7DFD3]" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2.5 rounded-full border border-[#DCCFC0] bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#21162C] transition-colors hover:bg-[#F1ECE5] disabled:opacity-50"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-bold text-[#4285F4] ring-1 ring-[#E7DFD3]">
                  G
                </span>
                Continuar con Google
              </button>

              <p className="text-center text-[10px] leading-relaxed text-[#8A7E96]">
                Solo las cuentas autorizadas pueden administrar el catálogo.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
