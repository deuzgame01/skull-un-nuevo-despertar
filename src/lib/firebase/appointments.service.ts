import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  updateDoc,
} from 'firebase/firestore';
import type {
  Appointment,
  AppointmentSlot,
  AppointmentStatus,
} from '@/types/database.types';
import { toSlotId } from '@/lib/appointments';
import { db, isFirebaseConfigured } from './config';
import {
  getLocalAppointmentSlots,
  getLocalAppointments,
  saveLocalAppointmentSlots,
  saveLocalAppointments,
} from './local-store';
import { assertAdminAuthorized } from './auth-guard';

const APPOINTMENTS_COLLECTION = 'appointments';
const SLOTS_COLLECTION = 'appointmentSlots';

/** Se lanza cuando otra persona acaba de tomar el mismo día y hora. */
export class SlotAlreadyBookedError extends Error {
  constructor() {
    super('Ese día y hora ya fueron agendados. Elige otro horario.');
    this.name = 'SlotAlreadyBookedError';
  }
}

export interface CreateAppointmentInput {
  customerName: string;
  phone: string;
  bodyZone: string;
  jewelry?: string;
  date: string;
  time: string;
}

/** Horarios ocupados (sin datos personales). Lectura pública. */
export async function getBookedSlots(): Promise<AppointmentSlot[]> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, SLOTS_COLLECTION));
      return snap.docs.map((document) => document.data() as AppointmentSlot);
    } catch (error) {
      console.error('[SKULL Citas] Error leyendo horarios ocupados:', error);
    }
  }
  return getLocalAppointmentSlots();
}

/** Orden en memoria: evita depender de un índice compuesto en Firestore. */
function sortAppointments(appointments: Appointment[]): Appointment[] {
  return [...appointments].sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    return byDate !== 0 ? byDate : a.time.localeCompare(b.time);
  });
}

/** Todas las citas, ordenadas por fecha y hora. Solo para el panel admin. */
export async function getAppointments(): Promise<Appointment[]> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, APPOINTMENTS_COLLECTION));
      const remote = snap.docs.map((document) => ({
        id: document.id,
        ...(document.data() as Omit<Appointment, 'id'>),
      }));
      return sortAppointments(remote);
    } catch (error) {
      console.error('[SKULL Citas] Error leyendo citas:', error);
    }
  }
  return sortAppointments(getLocalAppointments());
}

/**
 * Reserva el horario y guarda la cita en una sola transacción.
 * Si el documento del horario ya existe, la transacción falla y nadie más
 * puede agendar ese mismo día y hora.
 */
export async function createAppointment(
  input: CreateAppointmentInput
): Promise<Appointment> {
  const slotId = toSlotId(input.date, input.time);
  const now = Date.now();
  const appointment: Appointment = {
    id: crypto.randomUUID(),
    slotId,
    customerName: input.customerName.trim(),
    phone: input.phone.trim(),
    bodyZone: input.bodyZone.trim(),
    jewelry: input.jewelry?.trim() || undefined,
    date: input.date,
    time: input.time,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured && db) {
    const firestore = db;
    const appointmentRef = doc(collection(firestore, APPOINTMENTS_COLLECTION));
    const saved: Appointment = { ...appointment, id: appointmentRef.id };
    const slot: AppointmentSlot = {
      id: slotId,
      date: input.date,
      time: input.time,
      appointmentId: appointmentRef.id,
    };

    await runTransaction(firestore, async (transaction) => {
      const slotRef = doc(firestore, SLOTS_COLLECTION, slotId);
      const existingSlot = await transaction.get(slotRef);
      if (existingSlot.exists()) {
        throw new SlotAlreadyBookedError();
      }
      transaction.set(slotRef, slot);
      transaction.set(appointmentRef, saved);
    });

    return saved;
  }

  // Modo demostración sin Firebase: la comprobación y el guardado son
  // secuenciales dentro del cliente para mantener el mismo comportamiento.
  const slots = getLocalAppointmentSlots();
  if (slots.some((slot) => slot.id === slotId)) {
    throw new SlotAlreadyBookedError();
  }
  saveLocalAppointmentSlots([
    ...slots,
    {
      id: slotId,
      date: input.date,
      time: input.time,
      appointmentId: appointment.id,
    },
  ]);
  saveLocalAppointments([...getLocalAppointments(), appointment]);
  return appointment;
}

/** Evita liberar un cupo que ya fue tomado por otra cita. */
function slotBelongsToAppointment(
  slot: AppointmentSlot,
  appointment: Appointment
): boolean {
  return !slot.appointmentId || slot.appointmentId === appointment.id;
}

/** Cambia el estado de una cita. Al cancelar, el horario vuelve a estar libre. */
export async function updateAppointmentStatus(
  appointment: Appointment,
  status: AppointmentStatus
): Promise<void> {
  await assertAdminAuthorized('actualizar citas');

  if (isFirebaseConfigured && db) {
    if (status === 'cancelled') {
      const slotRef = doc(db, SLOTS_COLLECTION, appointment.slotId);
      const slotSnap = await getDoc(slotRef);
      if (
        slotSnap.exists() &&
        slotBelongsToAppointment(slotSnap.data() as AppointmentSlot, appointment)
      ) {
        await deleteDoc(slotRef);
      }
    }
    await updateDoc(doc(db, APPOINTMENTS_COLLECTION, appointment.id), {
      status,
      updatedAt: Date.now(),
    });
    return;
  }

  if (status === 'cancelled') {
    saveLocalAppointmentSlots(
      getLocalAppointmentSlots().filter(
        (slot) => !(slot.id === appointment.slotId && slotBelongsToAppointment(slot, appointment))
      )
    );
  }
  saveLocalAppointments(
    getLocalAppointments().map((item) =>
      item.id === appointment.id
        ? { ...item, status, updatedAt: Date.now() }
        : item
    )
  );
}

/** Elimina definitivamente una cita y libera su horario. */
export async function deleteAppointment(appointment: Appointment): Promise<void> {
  await assertAdminAuthorized('eliminar citas');

  if (isFirebaseConfigured && db) {
    const slotRef = doc(db, SLOTS_COLLECTION, appointment.slotId);
    const slotSnap = await getDoc(slotRef);
    if (
      slotSnap.exists() &&
      slotBelongsToAppointment(slotSnap.data() as AppointmentSlot, appointment)
    ) {
      await deleteDoc(slotRef);
    }
    await deleteDoc(doc(db, APPOINTMENTS_COLLECTION, appointment.id));
    return;
  }

  saveLocalAppointmentSlots(
    getLocalAppointmentSlots().filter(
      (slot) => !(slot.id === appointment.slotId && slotBelongsToAppointment(slot, appointment))
    )
  );
  saveLocalAppointments(
    getLocalAppointments().filter((item) => item.id !== appointment.id)
  );
}
