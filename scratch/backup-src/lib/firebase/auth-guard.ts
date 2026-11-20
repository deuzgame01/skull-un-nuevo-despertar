import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { auth, db, isEmailAuthorizedAdmin, isFirebaseConfigured } from './config';

export const ADMIN_SESSION_COOKIE = 'skull_admin_session';
export const DEMO_SESSION_KEY = 'skull_admin_session_v1';
// Duración máxima de sesión activa antes de requerir re-verificación (12 horas)
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export class UnauthorizedOperationError extends Error {
  public readonly code: string;
  constructor(message: string, code = 'auth/unauthorized-operation') {
    super(message);
    this.name = 'UnauthorizedOperationError';
    this.code = code;
  }
}

export interface SessionCookiePayload {
  uid: string;
  email: string;
  exp: number; // Timestamp en milisegundos
}

/**
 * Sincroniza una cookie firmada en base64 para que el Middleware de servidor (Next.js Edge)
 * proteja las rutas /admin/* contra accesos directos no autenticados o sesiones expiradas.
 */
export function syncAdminSessionCookie(payload: SessionCookiePayload | null): void {
  if (typeof document === 'undefined') return;

  if (!payload) {
    document.cookie = `${ADMIN_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    return;
  }

  try {
    const encoded = btoa(JSON.stringify(payload));
    const maxAge = Math.max(
      1,
      Math.floor((payload.exp - Date.now()) / 1000)
    );
    document.cookie = `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(
      encoded
    )}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  } catch (error) {
    console.error('[SKULL Security] Error sincronizando cookie de sesión:', error);
  }
}

/**
 * Registra o verifica el documento de la propietaria en la colección `/admins/{uid}` de Firestore
 * para que las reglas de seguridad de Firestore y Storage reconozcan su UID.
 */
export async function ensureAdminDocumentInFirestore(user: User): Promise<boolean> {
  if (!isEmailAuthorizedAdmin(user.email)) {
    return false;
  }

  if (!isFirebaseConfigured || !db) {
    return true;
  }

  try {
    const adminRef = doc(db, 'admins', user.uid);
    const snap = await getDoc(adminRef);

    if (!snap.exists()) {
      await setDoc(adminRef, {
        uid: user.uid,
        email: (user.email || '').toLowerCase(),
        role: 'owner',
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    } else {
      const data = snap.data();
      if (data?.active === false) {
        return false;
      }
      await setDoc(
        adminRef,
        { lastLoginAt: Date.now() },
        { merge: true }
      ).catch(() => null);
    }
    return true;
  } catch (error) {
    // Si las reglas aún no permiten lectura/escritura en /admins pero el email está autorizado
    console.warn('[SKULL Security] Verificación de documento admin:', error);
    return isEmailAuthorizedAdmin(user.email);
  }
}

/**
 * Valida los permisos de administrador antes de ejecutar cualquier operación de escritura
 * (crear/editar/eliminar productos, categorías, imágenes o configuración).
 */
export async function assertAdminAuthorized(
  operationName: string
): Promise<{ uid: string; email: string }> {
  // 1. Entorno Firebase Real
  if (isFirebaseConfigured && auth && auth.currentUser) {
    const currentUser = auth.currentUser;

    if (!isEmailAuthorizedAdmin(currentUser.email)) {
      throw new UnauthorizedOperationError(
        `Acceso denegado: La cuenta ${currentUser.email || 'actual'} no tiene permisos para "${operationName}".`,
        'auth/forbidden-admin'
      );
    }

    try {
      const tokenResult = await currentUser.getIdTokenResult();
      const expTime = new Date(tokenResult.expirationTime).getTime();
      if (Date.now() >= expTime) {
        // Forzar renovación del token si expiró
        await currentUser.getIdToken(true);
      }
    } catch {
      throw new UnauthorizedOperationError(
        'Tu sesión ha expirado por seguridad. Inicia sesión nuevamente.',
        'auth/session-expired'
      );
    }

    return {
      uid: currentUser.uid,
      email: currentUser.email || '',
    };
  }

  // 2. Verificar sesión persistida (respaldo local autorizado cuando aún no hay sesión de Firebase Auth activa)
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(DEMO_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          uid?: string;
          email?: string;
          expiresAt?: number;
        };

        if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
          localStorage.removeItem(DEMO_SESSION_KEY);
          syncAdminSessionCookie(null);
          throw new UnauthorizedOperationError(
            'Tu sesión administrativa ha expirado. Por favor vuelve a iniciar sesión.',
            'auth/session-expired'
          );
        }

        if (parsed.uid && parsed.email && isEmailAuthorizedAdmin(parsed.email)) {
          return { uid: parsed.uid, email: parsed.email };
        }
      }
    } catch (error) {
      if (error instanceof UnauthorizedOperationError) throw error;
    }
  }

  throw new UnauthorizedOperationError(
    `No autorizado: Debes iniciar sesión como propietaria para ejecutar "${operationName}".`,
    'auth/unauthenticated'
  );
}

/**
 * Traduce los códigos de error de Firebase Authentication y Firestore a mensajes claros en español.
 */
export function translateFirebaseAuthError(error: unknown): string {
  if (error instanceof UnauthorizedOperationError) {
    return error.message;
  }

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: string }).code)
      : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.';
    case 'auth/invalid-email':
      return 'El formato del correo electrónico no es válido.';
    case 'auth/user-disabled':
      return 'Esta cuenta administrativa ha sido deshabilitada.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Por seguridad, espera unos minutos o restablece tu contraseña.';
    case 'auth/network-request-failed':
      return 'Error de conexión de red. Verifica tu acceso a internet.';
    case 'auth/id-token-expired':
    case 'auth/user-token-expired':
    case 'auth/session-expired':
      return 'Tu sesión ha expirado. Inicia sesión nuevamente.';
    case 'permission-denied':
      return 'Permiso denegado por las reglas de seguridad de Firebase.';
    default:
      if (error instanceof Error && error.message) {
        return error.message;
      }
      return 'Ocurrió un error de autenticación. Inténtalo nuevamente.';
  }
}

