import type { FirebaseOptions } from 'firebase/app';

// Compilation/test defaults only. Supply real web config to use Firebase.
export const environment = {
  firebase: {
    apiKey: 'EXAMPLE_API_KEY',
    authDomain: 'example.firebaseapp.com',
    projectId: 'example',
    storageBucket: 'example.appspot.com',
    messagingSenderId: 'EXAMPLE_SENDER_ID',
    appId: 'EXAMPLE_APP_ID',
    measurementId: 'EXAMPLE_MEASUREMENT_ID',
  } satisfies FirebaseOptions,
};
