import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'REDACTED_FIREBASE_API_KEY',
  authDomain: 'bdg-editor.firebaseapp.com',
  projectId: 'bdg-editor',
  storageBucket: 'bdg-editor.appspot.com',
  messagingSenderId: 'REDACTED_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'REDACTED_FIREBASE_APP_ID',
  measurementId: 'REDACTED_FIREBASE_MEASUREMENT_ID',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = analytics(app);

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, AppRoutingModule, BrowserAnimationsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
function initializeApp(firebaseConfig: {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}) {
  throw new Error('Function not implemented.');
}
