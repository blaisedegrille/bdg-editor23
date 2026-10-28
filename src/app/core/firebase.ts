import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Your web app's Firebase configuration.
 * For Firebase JS SDK v7.20.0 and later, measurementId is optional.
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyALyyypNrGwGCH3R_c3GUBzIWnEwR1mXXE',
  authDomain: 'bdg-editor.firebaseapp.com',
  projectId: 'bdg-editor',
  storageBucket: 'bdg-editor.appspot.com',
  messagingSenderId: '456818769012',
  appId: '1:456818769012:web:7247b16a63f7677f506521',
  measurementId: 'G-RVBHV19XKQ',
};

/**
 * Reuses an already initialized app (relevant when the module is imported more
 * than once, e.g. in tests) instead of throwing a duplicate-app error.
 */
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
