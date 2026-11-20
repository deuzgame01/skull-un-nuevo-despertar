'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Gem,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { useCatalog } from '@/context/CatalogContext';
import {
  APPOINTMENT_TIME_SLOTS,
  buildBookedSlotIdSet,
  formatAppointmentDate,
  getTodayDateString,
  isBookableDate,
  toSlotId,
} from '@/lib/appointments';
import {
  createAppointment,
  getBookedSlots,
  SlotAlreadyBookedError,
} from '@/lib/firebase/appointments.service';
import {
  buildAppointmentConfirmationWhatsAppUrl,
  normalizeWhatsAppPhone,
} from '@/lib/utils/whatsapp';
import type { Appointment, AppointmentSlot } from '@/types/database.types';

const BODY_ZONE_SUGGESTIONS = [
  'Lóbulo',
  'Hélix',
  'Tragus',
  'Daith',
  'Rook',
  'Concha',
  'Septum',
  'Nariz',
  'Labio',
  'Ombligo',
  'Pezón',
];

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** Bottom sheet real: se ancla al borde inferior y se desliza hacia arriba. */
function MobileSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[130] sm:hidden" role="presentation">
      {/* Scrim plano: sin blur, para no deformar las tarjetas de fondo. */}
      <div
        className="sheet-fade absolute inset-0 bg-[#140C1D]/45"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="sheet-slide-up absolute inset-x-0 bottom-0 max-h-[86dvh] overflow-y-auto rounded-t-[28px] bg-white px-5 pt-3 shadow-[0_-14px_45px_rgba(20,12,29,0.22)]"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <div
          className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#DCCFC0]"
          aria-hidden="true"
        />
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-xl text-[#21162C]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[#E7DFD3] bg-white text-[#21162C]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function AgendarPage() {
  const { settings } = useCatalog();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [bodyZone, setBodyZone] = useState('');
  const [jewelry, setJewelry] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [bookedSlots, setBookedSlots] = useState<AppointmentSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmation, setConfirmation] = useState<Appointment | null>(null);

  // Hojas móviles (en escritorio se conservan los campos nativos).
  const [zoneSheetOpen, setZoneSheetOpen] = useState(false);
  const [zoneDraft, setZoneDraft] = useState('');
  const [daySheetOpen, setDaySheetOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const today = useMemo(() => getTodayDateString(), []);
  const bookedIds = useMemo(
    () => buildBookedSlotIdSet(bookedSlots),
    [bookedSlots]
  );
  const dateIsValid = date !== '' && isBookableDate(date);

  const calendarCells = useMemo(() => {
    const { year, month } = calendarMonth;
    const leading = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: leading }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  }, [calendarMonth]);

  const canGoPrevMonth = useMemo(() => {
    const now = new Date();
    return (
      calendarMonth.year > now.getFullYear() ||
      (calendarMonth.year === now.getFullYear() &&
        calendarMonth.month > now.getMonth())
    );
  }, [calendarMonth]);

  // Bloquea el scroll de fondo mientras alguna hoja esté abierta.
  useEffect(() => {
    if (!zoneSheetOpen && !daySheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setZoneSheetOpen(false);
        setDaySheetOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [zoneSheetOpen, daySheetOpen]);

  const refreshSlots = useCallback(async () => {
    try {
      setBookedSlots(await getBookedSlots());
    } catch (error) {
      console.error('[SKULL Citas] No se pudieron cargar los horarios:', error);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    void refreshSlots();
    window.addEventListener('focus', refreshSlots);
    return () => window.removeEventListener('focus', refreshSlots);
  }, [refreshSlots]);

  const openDaySheet = () => {
    if (date) {
      const [year, month] = date.split('-').map(Number);
      setCalendarMonth({ year, month: month - 1 });
    } else {
      const now = new Date();
      setCalendarMonth({ year: now.getFullYear(), month: now.getMonth() });
    }
    setDaySheetOpen(true);
  };

  const selectDay = (dayString: string) => {
    setDate(dayString);
    setTime('');
    setFormError('');
    setDaySheetOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (customerName.trim().length < 2) {
      setFormError('Escribe el nombre del cliente.');
      return;
    }
    if (normalizeWhatsAppPhone(phone).length < 10) {
      setFormError('Ingresa un número de teléfono válido.');
      return;
    }
    if (!bodyZone.trim()) {
      setFormError('Indica la zona que deseas perforar.');
      return;
    }
    if (!dateIsValid) {
      setFormError('Elige una fecha disponible (de lunes a sábado).');
      return;
    }
    if (!time) {
      setFormError('Selecciona una hora para tu cita.');
      return;
    }

    // Se abre dentro del clic para que el navegador no bloquee el popup.
    const popup = window.open('about:blank', '_blank');
    if (popup) popup.opener = null;

    setSaving(true);
    try {
      const appointment = await createAppointment({
        customerName,
        phone,
        bodyZone,
        jewelry,
        date,
        time,
      });
      setConfirmation(appointment);
      await refreshSlots();

      const whatsappUrl = buildAppointmentConfirmationWhatsAppUrl(
        appointment,
        settings.whatsapp
      );
      if (whatsappUrl) {
        if (popup && !popup.closed) {
          popup.location.href = whatsappUrl;
        } else {
          window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        }
      } else {
        popup?.close();
        toast.success('Cita agendada. La propietaria la verá en su panel.');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      popup?.close();
      if (error instanceof SlotAlreadyBookedError) {
        setFormError(error.message);
        setTime('');
        await refreshSlots();
      } else {
        console.error('[SKULL Citas] Error guardando la cita:', error);
        setFormError(
          'No pudimos guardar la cita. Inténtalo de nuevo en unos segundos.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (confirmation) {
    const whatsappUrl = buildAppointmentConfirmationWhatsAppUrl(
      confirmation,
      settings.whatsapp
    );

    return (
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="rounded-3xl border border-[#DCCFC0] bg-white p-7 text-center shadow-sm sm:p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#2C1440]">
            <CheckCircle2 className="h-7 w-7 text-white" />
          </span>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.22em] text-[#9A7B4F]">
            Cita agendada
          </p>
          <h1 className="mt-2 font-display text-3xl text-[#21162C] sm:text-4xl">
            Tu horario quedó reservado
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#5A4F66]">
            Guardamos tus datos y bloqueamos el horario para que nadie más pueda
            agendarlo. La propietaria verá la cita en su panel y la confirmará.
          </p>

          <div className="mt-6 rounded-2xl border border-[#E7DFD3] bg-[#F6F3EE] p-5 text-left">
            <div className="flex items-center gap-2.5 border-b border-[#E7DFD3] pb-3">
              <CalendarDays className="h-4 w-4 text-[#9A7B4F]" />
              <p className="text-sm font-semibold capitalize text-[#21162C]">
                {formatAppointmentDate(confirmation.date)} · {confirmation.time}
              </p>
            </div>
            <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-[#9A7B4F]">
                  Cliente
                </dt>
                <dd className="text-[#21162C]">{confirmation.customerName}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-[#9A7B4F]">
                  Zona
                </dt>
                <dd className="text-[#21162C]">{confirmation.bodyZone}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[11px] uppercase tracking-wider text-[#9A7B4F]">
                  Referencia
                </dt>
                <dd className="font-mono text-xs text-[#21162C]">
                  {confirmation.slotId}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] btn-skull-primary"
              >
                <Phone className="h-4 w-4" />
                <span className="text-white">Abrir confirmación en WhatsApp</span>
              </a>
            )}
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#DCCFC0] bg-white px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#21162C] hover:border-[#9A7B4F]"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-[#5A4F66] hover:text-[#21162C]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver al inicio
      </Link>

      <header className="mt-5 max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#9A7B4F]">
          Agenda tu sesión · Estudio privado
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-[#21162C] sm:text-5xl">
          Reserva tu día y hora
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#5A4F66]">
          Elige el día, luego la hora. Tu horario queda bloqueado al guardar y
          recibirás la confirmación directo en WhatsApp.
        </p>
      </header>

      <div className="mt-9 grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-[#E7DFD3] bg-white p-5 shadow-sm sm:p-7"
        >
          <fieldset className="space-y-5">
            <legend className="flex items-center gap-2 font-display text-lg text-[#21162C]">
              <UserRound className="h-4 w-4 text-[#9A7B4F]" />
              Datos del cliente
            </legend>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="block text-xs uppercase tracking-wider text-[#21162C]">
                  Nombre del cliente
                </span>
                <input
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Nombre y apellido"
                  autoComplete="name"
                  className="w-full rounded-xl border border-[#DCCFC0] bg-[#F6F3EE] px-3.5 py-3 text-sm text-[#21162C] outline-none transition-colors placeholder:text-[#9A8FA8] focus:border-[#9A7B4F]"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="block text-xs uppercase tracking-wider text-[#21162C]">
                  Número de teléfono
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="300 000 0000"
                  autoComplete="tel"
                  className="w-full rounded-xl border border-[#DCCFC0] bg-[#F6F3EE] px-3.5 py-3 text-sm text-[#21162C] outline-none transition-colors placeholder:text-[#9A8FA8] focus:border-[#9A7B4F]"
                />
              </label>
            </div>
          </fieldset>

          <div className="my-7 border-t border-[#E7DFD3]" />

          <fieldset className="space-y-5">
            <legend className="flex items-center gap-2 font-display text-lg text-[#21162C]">
              <Gem className="h-4 w-4 text-[#9A7B4F]" />
              Perforación
            </legend>

            <div className="space-y-1.5">
              <span className="block text-xs uppercase tracking-wider text-[#21162C]">
                Zona a perforar
              </span>

              {/* Escritorio: campo con sugerencias */}
              <div className="hidden sm:block">
                <input
                  type="text"
                  list="skull-body-zones"
                  value={bodyZone}
                  onChange={(event) => setBodyZone(event.target.value)}
                  placeholder="Ej. Hélix izquierdo"
                  aria-label="Zona a perforar"
                  className="w-full rounded-xl border border-[#DCCFC0] bg-[#F6F3EE] px-3.5 py-3 text-sm text-[#21162C] outline-none transition-colors placeholder:text-[#9A8FA8] focus:border-[#9A7B4F]"
                />
                <datalist id="skull-body-zones">
                  {BODY_ZONE_SUGGESTIONS.map((zone) => (
                    <option key={zone} value={zone} />
                  ))}
                </datalist>
              </div>

              {/* Móvil: abre un bottom sheet en lugar del desplegable */}
              <button
                type="button"
                onClick={() => {
                  setZoneDraft(bodyZone);
                  setZoneSheetOpen(true);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#DCCFC0] bg-[#F6F3EE] px-3.5 py-3 text-left text-sm sm:hidden"
              >
                <span className={bodyZone ? 'text-[#21162C]' : 'text-[#9A8FA8]'}>
                  {bodyZone || 'Toca para elegir la zona'}
                </span>
                <MapPin className="h-4 w-4 flex-shrink-0 text-[#9A7B4F]" />
              </button>
            </div>

            <label className="block space-y-1.5">
              <span className="block text-xs uppercase tracking-wider text-[#21162C]">
                Joya para perforar{' '}
                <span className="normal-case text-[#9A8FA8]">(opcional)</span>
              </span>
              <input
                type="text"
                value={jewelry}
                onChange={(event) => setJewelry(event.target.value)}
                placeholder="Ej. Argolla de titanio 16G"
                className="w-full rounded-xl border border-[#DCCFC0] bg-[#F6F3EE] px-3.5 py-3 text-sm text-[#21162C] outline-none transition-colors placeholder:text-[#9A8FA8] focus:border-[#9A7B4F]"
              />
            </label>
          </fieldset>

          <div className="my-7 border-t border-[#E7DFD3]" />

          <fieldset className="space-y-5">
            <legend className="flex items-center gap-2 font-display text-lg text-[#21162C]">
              <CalendarDays className="h-4 w-4 text-[#9A7B4F]" />
              Fecha y hora
            </legend>

            <div className="space-y-1.5">
              <span className="block text-xs uppercase tracking-wider text-[#21162C]">
                1. Selecciona el día
              </span>

              {/* Escritorio: calendario nativo */}
              <input
                type="date"
                value={date}
                min={today}
                onChange={(event) => {
                  setDate(event.target.value);
                  setTime('');
                  setFormError('');
                }}
                aria-label="Selecciona el día"
                className="hidden w-full rounded-xl border border-[#DCCFC0] bg-[#F6F3EE] px-3.5 py-3 text-sm text-[#21162C] outline-none transition-colors focus:border-[#9A7B4F] [color-scheme:light] sm:block"
              />

              {/* Móvil: calendario dentro de un sheet */}
              <button
                type="button"
                onClick={openDaySheet}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#DCCFC0] bg-[#F6F3EE] px-3.5 py-3 text-left text-sm sm:hidden"
              >
                <span className={date ? 'capitalize text-[#21162C]' : 'text-[#9A8FA8]'}>
                  {date ? formatAppointmentDate(date) : 'Toca para elegir el día'}
                </span>
                <CalendarDays className="h-4 w-4 flex-shrink-0 text-[#9A7B4F]" />
              </button>
            </div>

            {date !== '' && !dateIsValid && (
              <p className="rounded-xl border border-amber-300/70 bg-amber-50 px-3.5 py-3 text-xs text-[#7A5A20]">
                No atendemos domingos ni fechas pasadas. Elige otro día.
              </p>
            )}

            {dateIsValid && (
              <div className="space-y-2.5">
                <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#21162C]">
                  <Clock3 className="h-3.5 w-3.5 text-[#9A7B4F]" />
                  2. Selecciona la hora
                </p>
                {loadingSlots ? (
                  <p className="flex items-center gap-2 text-xs text-[#5A4F66]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Consultando disponibilidad...
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {APPOINTMENT_TIME_SLOTS.map((slotTime) => {
                      const isBooked = bookedIds.has(toSlotId(date, slotTime));
                      const isSelected = time === slotTime;
                      return (
                        <button
                          key={slotTime}
                          type="button"
                          disabled={isBooked}
                          onClick={() => {
                            setTime(slotTime);
                            setFormError('');
                          }}
                          className={`rounded-xl border px-2 py-2.5 text-xs font-semibold tracking-wide transition-colors ${
                            isBooked
                              ? 'cursor-not-allowed border-[#E7DFD3] bg-[#F1ECE5] text-[#A99BB4] line-through'
                              : isSelected
                                ? 'border-[#2C1440] bg-[#2C1440] text-white'
                                : 'border-[#DCCFC0] bg-[#F6F3EE] text-[#21162C] hover:border-[#9A7B4F]'
                          }`}
                        >
                          {slotTime}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-[11px] text-[#5A4F66]">
                  Los horarios tachados ya fueron agendados por otra persona.
                </p>
              </div>
            )}
          </fieldset>

          {formError && (
            <p className="mt-6 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-3 text-xs text-rose-800">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] btn-skull-primary disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span className="text-white">
              {saving ? 'Guardando cita...' : 'Guardar cita y confirmar por WhatsApp'}
            </span>
          </button>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-3xl bg-[#2C1440] p-6 text-white">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#D9BC8E]">
              Resumen de tu cita
            </p>
            <dl className="mt-5 space-y-3.5 text-sm">
              <div className="flex items-start gap-2.5">
                <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-[#D9BC8E]" />
                <div className="min-w-0">
                  <dt className="text-[10px] uppercase tracking-wider text-zinc-400">
                    Cliente
                  </dt>
                  <dd className="break-words text-white">
                    {customerName || 'Por completar'}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D9BC8E]" />
                <div className="min-w-0">
                  <dt className="text-[10px] uppercase tracking-wider text-zinc-400">
                    Zona a perforar
                  </dt>
                  <dd className="break-words text-white">
                    {bodyZone || 'Por completar'}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Gem className="mt-0.5 h-4 w-4 shrink-0 text-[#D9BC8E]" />
                <div className="min-w-0">
                  <dt className="text-[10px] uppercase tracking-wider text-zinc-400">
                    Joya (opcional)
                  </dt>
                  <dd className="break-words text-white">
                    {jewelry || 'Sin especificar'}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#D9BC8E]" />
                <div className="min-w-0">
                  <dt className="text-[10px] uppercase tracking-wider text-zinc-400">
                    Día y hora
                  </dt>
                  <dd className="break-words text-white">
                    {date && dateIsValid
                      ? `${formatAppointmentDate(date)} · ${time || 'Elige una hora'}`
                      : 'Elige un día disponible'}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-[#E7DFD3] bg-white p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#9A7B4F]" />
              <p className="text-xs font-semibold uppercase tracking-wider text-[#21162C]">
                Cupo único
              </p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#5A4F66]">
              Al guardar, el horario se bloquea para todos. Si otra persona lo
              intenta, verá la hora tachada y deberá elegir otra.
            </p>
          </div>
        </aside>
      </div>

      {/* Hoja: zona a perforar (solo móvil) */}
      <MobileSheet
        open={zoneSheetOpen}
        title="Zona a perforar"
        onClose={() => setZoneSheetOpen(false)}
      >
        <input
          type="text"
          value={zoneDraft}
          onChange={(event) => setZoneDraft(event.target.value)}
          placeholder="Escribe o elige una zona"
          aria-label="Zona a perforar"
          className="w-full rounded-xl border border-[#DCCFC0] bg-[#F6F3EE] px-3.5 py-3 text-sm text-[#21162C] outline-none placeholder:text-[#9A8FA8] focus:border-[#9A7B4F]"
        />
        <div className="mt-4 grid grid-cols-3 gap-2">
          {BODY_ZONE_SUGGESTIONS.map((zone) => (
            <button
              key={zone}
              type="button"
              onClick={() => setZoneDraft(zone)}
              className={`rounded-xl border px-2 py-2.5 text-xs font-semibold ${
                zoneDraft === zone
                  ? 'border-[#2C1440] bg-[#2C1440] text-white'
                  : 'border-[#E7DFD3] bg-white text-[#21162C]'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setBodyZone(zoneDraft.trim());
            setZoneSheetOpen(false);
            setFormError('');
          }}
          disabled={!zoneDraft.trim()}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] btn-skull-primary disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-white">Confirmar zona</span>
        </button>
      </MobileSheet>

      {/* Hoja: calendario (solo móvil) */}
      <MobileSheet
        open={daySheetOpen}
        title="Elige el día"
        onClose={() => setDaySheetOpen(false)}
      >
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              setCalendarMonth((prev) => {
                const next = new Date(prev.year, prev.month - 1, 1);
                return { year: next.getFullYear(), month: next.getMonth() };
              })
            }
            disabled={!canGoPrevMonth}
            aria-label="Mes anterior"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E7DFD3] text-[#21162C] disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="font-display text-base capitalize text-[#21162C]">
            {new Date(calendarMonth.year, calendarMonth.month, 1).toLocaleDateString(
              'es-CO',
              { month: 'long', year: 'numeric' }
            )}
          </p>
          <button
            type="button"
            onClick={() =>
              setCalendarMonth((prev) => {
                const next = new Date(prev.year, prev.month + 1, 1);
                return { year: next.getFullYear(), month: next.getMonth() };
              })
            }
            aria-label="Mes siguiente"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E7DFD3] text-[#21162C]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1 text-center">
          {WEEKDAY_LABELS.map((label, index) => (
            <span
              key={`${label}-${index}`}
              className="pb-2 text-[11px] font-semibold uppercase text-[#9A7B4F]"
            >
              {label}
            </span>
          ))}

          {calendarCells.map((day, index) => {
            if (day === null) return <span key={`empty-${index}`} />;
            const dayString = toDateString(
              calendarMonth.year,
              calendarMonth.month,
              day
            );
            const disabled =
              dayString < today ||
              new Date(calendarMonth.year, calendarMonth.month, day).getDay() === 0;
            const selected = date === dayString;

            return (
              <button
                key={dayString}
                type="button"
                disabled={disabled}
                onClick={() => selectDay(dayString)}
                className={`flex h-10 items-center justify-center rounded-xl text-sm font-semibold ${
                  disabled
                    ? 'cursor-not-allowed text-[#C7BCCF] line-through'
                    : selected
                      ? 'bg-[#2C1440] text-white'
                      : 'text-[#21162C] hover:bg-[#F1ECE5]'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <p className="mt-5 text-center text-[11px] text-[#5A4F66]">
          No atendemos domingos. Los días tachados no están disponibles.
        </p>
      </MobileSheet>
    </div>
  );
}
