import type { AppointmentSlot } from '@/types/database.types';

/** Horarios atendidos por el estudio. Se muestran después de elegir el día. */
export const APPOINTMENT_TIME_SLOTS = [
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
] as const;

/** Construye la clave estable del horario: YYYY-MM-DD_HH-mm. */
export function toSlotId(date: string, time: string): string {
  return `${date}_${time.replace(':', '-')}`;
}

/** Fecha local en formato YYYY-MM-DD (evita el desfase de toISOString). */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Solo se pueden agendar fechas futuras y de lunes a sábado. */
export function isBookableDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  if (date < getTodayDateString()) return false;
  const [year, month, day] = date.split('-').map(Number);
  const weekday = new Date(year, month - 1, day).getDay();
  return weekday !== 0;
}

/** Convierte los horarios ocupados en un Set de claves para consultas O(1). */
export function buildBookedSlotIdSet(slots: AppointmentSlot[]): Set<string> {
  return new Set(slots.map((slot) => slot.id));
}

/** Etiqueta legible de la fecha para la confirmación y el panel admin. */
export function formatAppointmentDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
