'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarCheck,
  Check,
  Clock3,
  Gem,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Appointment, AppointmentStatus } from '@/types/database.types';
import { formatAppointmentDate } from '@/lib/appointments';
import {
  deleteAppointment,
  getAppointments,
  updateAppointmentStatus,
} from '@/lib/firebase/appointments.service';

type StatusFilter = 'all' | AppointmentStatus;

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-100 text-amber-900 border-amber-300',
  confirmed: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  cancelled: 'bg-rose-100 text-rose-900 border-rose-300',
  completed: 'bg-[#EDE7DE] text-[#5A4F66] border-[#DCCFC0]',
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
};

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'confirmed', label: 'Confirmadas' },
  { id: 'completed', label: 'Completadas' },
  { id: 'cancelled', label: 'Canceladas' },
];

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    try {
      setAppointments(await getAppointments());
    } catch (error) {
      console.error('[SKULL Citas] Error cargando citas en admin:', error);
      toast.error('No se pudieron cargar las citas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAppointments();
    window.addEventListener('skull-store-updated', loadAppointments);
    return () =>
      window.removeEventListener('skull-store-updated', loadAppointments);
  }, [loadAppointments]);

  const counts = useMemo(
    () => ({
      all: appointments.length,
      pending: appointments.filter((item) => item.status === 'pending').length,
      confirmed: appointments.filter((item) => item.status === 'confirmed').length,
      completed: appointments.filter((item) => item.status === 'completed').length,
      cancelled: appointments.filter((item) => item.status === 'cancelled').length,
    }),
    [appointments]
  );

  const grouped = useMemo(() => {
    const filtered =
      filter === 'all'
        ? appointments
        : appointments.filter((item) => item.status === filter);

    return filtered.reduce<Record<string, Appointment[]>>((acc, item) => {
      (acc[item.date] ||= []).push(item);
      return acc;
    }, {});
  }, [appointments, filter]);

  const handleStatus = async (appointment: Appointment, status: AppointmentStatus) => {
    setBusyId(appointment.id);
    try {
      await updateAppointmentStatus(appointment, status);
      await loadAppointments();
      toast.success(
        status === 'cancelled'
          ? 'Cita cancelada y horario liberado.'
          : `Cita marcada como ${STATUS_LABELS[status].toLowerCase()}.`
      );
    } catch (error) {
      console.error('[SKULL Citas] Error actualizando cita:', error);
      toast.error('No se pudo actualizar la cita.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (appointment: Appointment) => {
    if (
      !window.confirm(
        `¿Eliminar definitivamente la cita de ${appointment.customerName}? El horario quedará libre.`
      )
    ) {
      return;
    }
    setBusyId(appointment.id);
    try {
      await deleteAppointment(appointment);
      await loadAppointments();
      toast.success('Cita eliminada.');
    } catch (error) {
      console.error('[SKULL Citas] Error eliminando cita:', error);
      toast.error('No se pudo eliminar la cita.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#9A7B4F]">
            Gestión de agenda
          </p>
          <h1 className="mt-1 font-display text-3xl text-[#21162C]">
            Citas agendadas
          </h1>
          <p className="mt-1.5 text-[13px] text-[#5A4F66]">
            Cada reserva bloquea su día y hora. Aquí puedes confirmarla,
            cancelarla para liberar el cupo o ver los datos del cliente.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadAppointments()}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-[#DCCFC0] bg-white px-4 py-2.5 text-xs uppercase tracking-[0.14em] text-[#21162C] hover:border-[#9A7B4F]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </header>

      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: 'Total', value: counts.all, icon: CalendarCheck },
          { label: 'Pendientes', value: counts.pending, icon: Clock3 },
          { label: 'Confirmadas', value: counts.confirmed, icon: Check },
          { label: 'Canceladas', value: counts.cancelled, icon: X },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-[#E7DFD3] bg-white p-3.5"
          >
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#5A4F66]">
              <Icon className="h-3.5 w-3.5 text-[#9A7B4F]" />
              {label}
            </div>
            <p className="mt-1.5 font-display text-2xl text-[#21162C]">{value}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] ${
              filter === item.id
                ? 'btn-skull-primary text-white'
                : 'border-[#DCCFC0] bg-white text-[#5A4F66] hover:text-[#21162C]'
            }`}
          >
            {item.label} ({counts[item.id]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[#E7DFD3] bg-white py-16 text-sm text-[#5A4F66]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando citas...
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#DCCFC0] bg-white px-6 py-16 text-center">
          <CalendarCheck className="mx-auto h-8 w-8 text-[#C1B4CC]" />
          <p className="mt-3 font-display text-lg text-[#21162C]">
            Aún no hay citas agendadas
          </p>
          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-[#5A4F66]">
            Cuando un cliente complete el formulario de «Agendar cita», su
            reserva aparecerá aquí con todos sus datos.
          </p>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="rounded-xl border border-[#E7DFD3] bg-white px-6 py-12 text-center text-sm text-[#5A4F66]">
          No hay citas con este estado.
        </div>
      ) : (
        <div className="space-y-7">
          {Object.entries(grouped).map(([date, dayAppointments]) => (
            <section key={date} className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-px flex-1 bg-[#E7DFD3]" />
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9A7B4F]">
                  {formatAppointmentDate(date)} · {dayAppointments.length}{' '}
                  {dayAppointments.length === 1 ? 'cita' : 'citas'}
                </h2>
                <div className="h-px flex-1 bg-[#E7DFD3]" />
              </div>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {dayAppointments.map((appointment) => {
                  const busy = busyId === appointment.id;
                  return (
                    <article
                      key={appointment.id}
                      className="rounded-xl border border-[#E7DFD3] bg-white p-4 sm:p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F1ECE5]">
                            <UserRound className="h-4 w-4 text-[#9A7B4F]" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-[#21162C]">
                              {appointment.customerName}
                            </p>
                            <p className="text-[11px] text-[#5A4F66]">
                              {appointment.time} · {appointment.slotId}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                            STATUS_STYLES[appointment.status]
                          }`}
                        >
                          {STATUS_LABELS[appointment.status]}
                        </span>
                      </div>

                      <dl className="mt-4 grid grid-cols-1 gap-2.5 border-t border-[#E7DFD3] pt-4 text-xs sm:grid-cols-2">
                        <div className="flex items-start gap-2">
                          <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9A7B4F]" />
                          <div>
                            <dt className="text-[10px] uppercase tracking-wider text-[#9A8FA8]">
                              Teléfono
                            </dt>
                            <dd>
                              <a
                                href={`tel:${appointment.phone.replace(/[^\d+]/g, '')}`}
                                className="text-[#21162C] hover:text-[#9A7B4F]"
                              >
                                {appointment.phone}
                              </a>
                            </dd>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9A7B4F]" />
                          <div>
                            <dt className="text-[10px] uppercase tracking-wider text-[#9A8FA8]">
                              Zona a perforar
                            </dt>
                            <dd className="text-[#21162C]">
                              {appointment.bodyZone}
                            </dd>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 sm:col-span-2">
                          <Gem className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9A7B4F]" />
                          <div>
                            <dt className="text-[10px] uppercase tracking-wider text-[#9A8FA8]">
                              Joya para perforar
                            </dt>
                            <dd className="text-[#21162C]">
                              {appointment.jewelry || 'No especificada'}
                            </dd>
                          </div>
                        </div>
                      </dl>

                      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#E7DFD3] pt-4">
                        {appointment.status !== 'confirmed' &&
                          appointment.status !== 'completed' && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleStatus(appointment, 'confirmed')}
                              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/40 bg-emerald-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Confirmar
                            </button>
                          )}
                        {appointment.status !== 'completed' &&
                          appointment.status !== 'cancelled' && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleStatus(appointment, 'cancelled')}
                              className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-rose-900 hover:bg-rose-100 disabled:opacity-50"
                            >
                              <X className="h-3.5 w-3.5" />
                              Cancelar
                            </button>
                          )}
                        {appointment.status !== 'completed' &&
                          appointment.status !== 'cancelled' && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleStatus(appointment, 'completed')}
                              className="inline-flex items-center gap-1.5 rounded-full border border-[#DCCFC0] bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5A4F66] hover:text-[#21162C] disabled:opacity-50"
                            >
                              <CalendarCheck className="h-3.5 w-3.5" />
                              Completada
                            </button>
                          )}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleDelete(appointment)}
                          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-950/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white hover:bg-rose-900 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
