'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  browserLocalPersistence,
  onIdTokenChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateEmail,
  updatePassword,
  type User,
} from 'firebase/auth';
import {
  auth,
  isEmailAuthorizedAdmin,
  isFirebaseConfigured,
} from '@/lib/firebase/config';
import {
  DEMO_SESSION_KEY,
  SESSION_MAX_AGE_SECONDS,
  ensureAdminDocumentInFirestore,
  syncAdminSessionCookie,
  translateFirebaseAuthError,
  updateAdminEmailInFirestore,
} from '@/lib/firebase/auth-guard';

export interface AdminSessionUser {
  uid: string;
  email: string;
  displayName: string;
  isDemoMode: boolean;
  expiresAt: number;
}

interface AuthContextValue {
  user: AdminSessionUser | null;
  loading: boolean;
  authError: string | null;
  sessionExpired: boolean;
  isFirebaseReady: boolean;
  /** true cuando la cuenta permite verificar cambios con contraseña. */
  isPasswordAccount: boolean;
  clearAuthError: () => void;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendPasswordRecovery: (email: string) => Promise<void>;
  changeEmail: (newEmail: string, currentPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: (reason?: 'manual' | 'expired') => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminSessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
    setSessionExpired(false);
  }, []);

  const clearClientSession = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DEMO_SESSION_KEY);
    }
    syncAdminSessionCookie(null);
    setUser(null);
  }, []);

  const logout = useCallback(
    async (reason: 'manual' | 'expired' = 'manual') => {
      if (isFirebaseConfigured && auth) {
        await firebaseSignOut(auth).catch(() => null);
      }
      clearClientSession();
      if (reason === 'expired') {
        setSessionExpired(true);
        setAuthError(
          'Tu sesión ha expirado por seguridad. Inicia sesión nuevamente.'
        );
      }
    },
    [clearClientSession]
  );

  // 1. Suscripción a Firebase Auth (onIdTokenChanged) + Restauración de Persistencia
  useEffect(() => {
    const restoreLocalFallback = (): boolean => {
      if (typeof window === 'undefined') return false;
      try {
        const raw = localStorage.getItem(DEMO_SESSION_KEY);
        if (!raw) return false;
        const saved = JSON.parse(raw) as AdminSessionUser;

        if (!saved.email || !isEmailAuthorizedAdmin(saved.email)) {
          clearClientSession();
          return false;
        }

        if (saved.expiresAt && Date.now() >= saved.expiresAt) {
          clearClientSession();
          setSessionExpired(true);
          setAuthError(
            'Tu sesión administrativa ha expirado. Inicia sesión nuevamente.'
          );
          return false;
        }

        const exp =
          saved.expiresAt || Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
        const hydrated: AdminSessionUser = { ...saved, expiresAt: exp };
        syncAdminSessionCookie({
          uid: hydrated.uid,
          email: hydrated.email,
          exp,
        });
        setUser(hydrated);
        return true;
      } catch {
        clearClientSession();
        return false;
      }
    };

    if (isFirebaseConfigured && auth) {
      const fbAuth = auth;
      setPersistence(fbAuth, browserLocalPersistence).catch(() => null);

      const unsubscribe = onIdTokenChanged(
        fbAuth,
        async (fbUser: User | null) => {
          if (fbUser) {
            if (!isEmailAuthorizedAdmin(fbUser.email)) {
              await firebaseSignOut(fbAuth).catch(() => null);
              clearClientSession();
              setAuthError(
                'Acceso denegado: Esta cuenta no está autorizada para administrar SKULL.'
              );
              setLoading(false);
              return;
            }

            try {
              const tokenResult = await fbUser.getIdTokenResult();
              const tokenExp = new Date(tokenResult.expirationTime).getTime();
              const sessionExp = Math.max(
                tokenExp,
                Date.now() + SESSION_MAX_AGE_SECONDS * 1000
              );

              await ensureAdminDocumentInFirestore(fbUser);

              const sessionUser: AdminSessionUser = {
                uid: fbUser.uid,
                email: (fbUser.email || '').toLowerCase(),
                displayName: fbUser.displayName || 'Propietaria SKULL',
                isDemoMode: false,
                expiresAt: sessionExp,
              };

              localStorage.setItem(
                DEMO_SESSION_KEY,
                JSON.stringify(sessionUser)
              );
              syncAdminSessionCookie({
                uid: sessionUser.uid,
                email: sessionUser.email,
                exp: sessionExp,
              });
              setUser(sessionUser);
              setSessionExpired(false);
            } catch {
              clearClientSession();
              setSessionExpired(true);
            }
          } else {
            // Si no hay sesión de Firebase SDK en memoria, verificar si existe sesión persistida válida
            restoreLocalFallback();
          }
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      restoreLocalFallback();
      setLoading(false);
    }
  }, [clearClientSession]);

  // 2. Verificador periódico de expiración de sesión en segundo plano
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (user.expiresAt && Date.now() >= user.expiresAt) {
        logout('expired');
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [user, logout]);

  // 3. Inicio de sesión con Correo y Contraseña
  const loginWithEmail = async (email: string, password: string) => {
    clearAuthError();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      const msg = 'Ingresa tu correo electrónico administrativo.';
      setAuthError(msg);
      throw new Error(msg);
    }

    if (!isEmailAuthorizedAdmin(cleanEmail)) {
      const msg =
        'Acceso no autorizado: Este correo no tiene permisos de propietaria en SKULL.';
      setAuthError(msg);
      throw new Error(msg);
    }

    if (!password || password.length < 6) {
      const msg = 'La contraseña debe tener al menos 6 caracteres.';
      setAuthError(msg);
      throw new Error(msg);
    }

    if (isFirebaseConfigured && auth) {
      try {
        await setPersistence(auth, browserLocalPersistence);
        const cred = await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

        await ensureAdminDocumentInFirestore(cred.user);

        const exp = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
        const sessionUser: AdminSessionUser = {
          uid: cred.user.uid,
          email: cred.user.email || cleanEmail,
          displayName: cred.user.displayName || 'Propietaria SKULL',
          isDemoMode: false,
          expiresAt: exp,
        };

        localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(sessionUser));
        syncAdminSessionCookie({
          uid: sessionUser.uid,
          email: sessionUser.email,
          exp,
        });
        setUser(sessionUser);
        return;
      } catch (fbError: unknown) {
        const code =
          typeof fbError === 'object' && fbError !== null && 'code' in fbError
            ? String((fbError as { code?: string }).code)
            : '';

        // Si el error es de credenciales inválidas o demasiados intentos, traducir y lanzar
        const translated = translateFirebaseAuthError(fbError);
        setAuthError(translated);
        throw new Error(translated);
      }
    }

    const exp = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
    const localOwner: AdminSessionUser = {
      uid: '8zneI7UA9uXD3JY2jDq2nqq0lsS2',
      email: cleanEmail,
      displayName: 'Propietaria SKULL',
      isDemoMode: true,
      expiresAt: exp,
    };
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(localOwner));
    syncAdminSessionCookie({
      uid: localOwner.uid,
      email: localOwner.email,
      exp,
    });
    setUser(localOwner);
  };

  // 4. Inicio de sesión con Google Auth (Cuenta de Propietaria)
  const loginWithGoogle = async () => {
    clearAuthError();

    if (isFirebaseConfigured && auth) {
      try {
        await setPersistence(auth, browserLocalPersistence);
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(auth, provider);

        if (!isEmailAuthorizedAdmin(cred.user.email)) {
          await firebaseSignOut(auth);
          const msg =
            'Acceso no autorizado: Tu cuenta de Google no está autorizada como propietaria de SKULL.';
          setAuthError(msg);
          throw new Error(msg);
        }

        await ensureAdminDocumentInFirestore(cred.user);

        const exp = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
        const sessionUser: AdminSessionUser = {
          uid: cred.user.uid,
          email: cred.user.email || '',
          displayName: cred.user.displayName || 'Propietaria SKULL',
          isDemoMode: false,
          expiresAt: exp,
        };

        localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(sessionUser));
        syncAdminSessionCookie({
          uid: sessionUser.uid,
          email: sessionUser.email,
          exp,
        });
        setUser(sessionUser);
        return;
      } catch (error: unknown) {
        const translated = translateFirebaseAuthError(error);
        setAuthError(translated);
        throw new Error(translated);
      }
    }
  };

  // 5. Recuperación de Contraseña mediante Firebase Authentication
  const sendPasswordRecovery = async (email: string) => {
    clearAuthError();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      const msg = 'Ingresa un correo electrónico válido.';
      setAuthError(msg);
      throw new Error(msg);
    }

    if (!isEmailAuthorizedAdmin(cleanEmail)) {
      const msg =
        'Este correo no corresponde a una cuenta administrativa autorizada de SKULL.';
      setAuthError(msg);
      throw new Error(msg);
    }

    if (isFirebaseConfigured && auth) {
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
        return;
      } catch (error: unknown) {
        const translated = translateFirebaseAuthError(error);
        setAuthError(translated);
        throw new Error(translated);
      }
    }
  };

  // 6. Verificación reciente antes de cambiar credenciales sensibles.
  const reauthenticateCurrentUser = async (currentPassword: string) => {
    if (!isFirebaseConfigured || !auth || !auth.currentUser) {
      throw new Error(
        'El cambio de credenciales requiere Firebase configurado.'
      );
    }

    const currentUser = auth.currentUser;
    const usesPassword = currentUser.providerData.some(
      (provider) => provider.providerId === 'password'
    );

    if (!usesPassword) {
      await reauthenticateWithPopup(currentUser, new GoogleAuthProvider());
      return currentUser;
    }

    if (!currentPassword) {
      throw new Error('Ingresa tu contraseña actual para verificar el cambio.');
    }

    await reauthenticateWithCredential(
      currentUser,
      EmailAuthProvider.credential(currentUser.email || '', currentPassword)
    );
    return currentUser;
  };

  const persistUpdatedSession = (
    uid: string,
    email: string,
    displayName?: string | null
  ) => {
    const exp = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
    const updatedSession: AdminSessionUser = {
      uid,
      email,
      displayName: displayName || user?.displayName || 'Propietaria SKULL',
      isDemoMode: false,
      expiresAt: exp,
    };

    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(updatedSession));
    syncAdminSessionCookie({ uid, email, exp });
    setUser(updatedSession);
  };

  // 7. Cambio de correo administrativo (debe estar en la lista autorizada).
  const changeEmail = async (newEmail: string, currentPassword: string) => {
    clearAuthError();
    const cleanEmail = newEmail.trim().toLowerCase();

    try {
      if (!cleanEmail || !cleanEmail.includes('@')) {
        throw new Error('Ingresa un correo electrónico válido.');
      }
      if (!isEmailAuthorizedAdmin(cleanEmail)) {
        throw new Error(
          'Ese correo no está autorizado. Debes agregarlo a NEXT_PUBLIC_ADMIN_EMAILS antes de usarlo.'
        );
      }
      if (user?.email?.toLowerCase() === cleanEmail) {
        throw new Error('Ya estás usando ese correo electrónico.');
      }

      const currentUser = await reauthenticateCurrentUser(currentPassword);
      const usesPassword = currentUser.providerData.some(
        (provider) => provider.providerId === 'password'
      );

      if (!usesPassword) {
        throw new Error(
          'El correo de una cuenta de Google se administra desde Google. No se puede cambiar aquí.'
        );
      }

      await updateEmail(currentUser, cleanEmail);
      await updateAdminEmailInFirestore(currentUser.uid, cleanEmail);
      persistUpdatedSession(currentUser.uid, cleanEmail, currentUser.displayName);
    } catch (error: unknown) {
      const translated = translateFirebaseAuthError(error);
      setAuthError(translated);
      throw new Error(translated);
    }
  };

  // 8. Cambio de contraseña administrativa con verificación reciente.
  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    clearAuthError();

    try {
      if (!newPassword || newPassword.length < 6) {
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
      }
      if (currentPassword && currentPassword === newPassword) {
        throw new Error('La nueva contraseña debe ser diferente de la actual.');
      }

      const currentUser = await reauthenticateCurrentUser(currentPassword);
      await updatePassword(currentUser, newPassword);
      persistUpdatedSession(
        currentUser.uid,
        currentUser.email || user?.email || '',
        currentUser.displayName
      );
    } catch (error: unknown) {
      const translated = translateFirebaseAuthError(error);
      setAuthError(translated);
      throw new Error(translated);
    }
  };

  const isPasswordAccount =
    !isFirebaseConfigured ||
    !auth?.currentUser ||
    auth.currentUser.providerData.some(
      (provider) => provider.providerId === 'password'
    );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        sessionExpired,
        isFirebaseReady: isFirebaseConfigured,
        isPasswordAccount,
        clearAuthError,
        loginWithEmail,
        loginWithGoogle,
        sendPasswordRecovery,
        changeEmail,
        changePassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return ctx;
}
