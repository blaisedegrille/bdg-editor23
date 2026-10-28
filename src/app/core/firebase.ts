import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { environment } from '../../environments/environment';

/**
 * The web app configuration is generated locally or in CI; it is never committed.
 * See README.md ("Firebase setup") and `src/environments/environment.example.ts`.
 */
export const firebaseConfig = environment.firebase;

/**
 * Reuses an already initialized app (relevant when the module is imported more
 * than once, e.g. in tests) instead of throwing a duplicate-app error.
 */
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
