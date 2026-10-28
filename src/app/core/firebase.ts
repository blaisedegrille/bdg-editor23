import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Your web app's Firebase configuration.
 * For Firebase JS SDK v7.20.0 and later, measurementId is optional.
 */
export const firebaseConfig = {
  apiKey: 'REDACTED_FIREBASE_API_KEY',
  authDomain: 'bdg-editor.firebaseapp.com',
  projectId: 'bdg-editor',
  storageBucket: 'bdg-editor.appspot.com',
  messagingSenderId: 'REDACTED_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'REDACTED_FIREBASE_APP_ID',
  measurementId: 'REDACTED_FIREBASE_MEASUREMENT_ID',
};

/**
 * Reuses an already initialized app (relevant when the module is imported more
 * than once, e.g. in tests) instead of throwing a duplicate-app error.
 */
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
