import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAdminEmails } from '@/lib/admin-emails';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'TU_API_KEY' &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'tu-proyecto'
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error('[SKULL Firebase] Error inicializando Firebase:', error);
  }
}

/** Correos con permisos de propietaria, definidos en NEXT_PUBLIC_ADMIN_EMAILS. */
export function getAuthorizedAdminEmails(): string[] {
  return getAdminEmails();
}

export function isEmailAuthorizedAdmin(email?: string | null): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail.includes('@')) return false;

  const allowedEmails = getAuthorizedAdminEmails();
  if (allowedEmails.length === 0) return false;
  return allowedEmails.includes(cleanEmail);
}

export { app, auth, db, storage };

