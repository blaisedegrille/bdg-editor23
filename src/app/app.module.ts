import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { EditorComponent } from './pages/editor/editor.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { HomeComponent } from './pages/home/home.component';
import { ModeToggleModule } from './shared/mode-toggle/mode-toggle.module';
import { ArticleListComponent } from './pages/article-list/article-list.component';
import { ArticleComponent } from './pages/article-list/article/article.component';
import { MaterialModule } from './shared/material.module';

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { SignInComponent } from './pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/sign-up/sign-up.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { VerifyEmailComponent } from './pages/verify-email/verify-email.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyALyyypNrGwGCH3R_c3GUBzIWnEwR1mXXE',
  authDomain: 'bdg-editor.firebaseapp.com',
  projectId: 'bdg-editor',
  storageBucket: 'bdg-editor.appspot.com',
  messagingSenderId: '456818769012',
  appId: '1:456818769012:web:7247b16a63f7677f506521',
  measurementId: 'G-RVBHV19XKQ',
};

@NgModule({
  declarations: [
    AppComponent,
    EditorComponent,
    NotFoundComponent,
    HomeComponent,
    ArticleListComponent,
    ArticleComponent,
    SignInComponent,
    SignUpComponent,
    ForgotPasswordComponent,
    VerifyEmailComponent,
    DashboardComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    ModeToggleModule,
    // provideFirebaseApp(() => initializeApp(firebaseConfig)),
    // provideFirestore(() => getFirestore()),
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
    AngularFireDatabaseModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
