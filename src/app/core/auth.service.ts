import { Injectable, NgZone, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import {
  EmailAuthProvider,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { User } from '../models/user';
import { I18nService } from './i18n/i18n.service';
import { TranslationKey } from './i18n/translations/en';
import { userDisplayName } from './user-display';
import { auth, db } from './firebase';

/** Human friendly translations for the Firebase auth error codes we expect. */
const AUTH_ERROR_KEYS: Record<string, TranslationKey> = {
  'auth/email-already-in-use': 'auth.error.accountExists',
  'auth/invalid-credential': 'auth.error.invalidCredential',
  'auth/invalid-email': 'auth.error.invalidEmail',
  'auth/missing-email': 'auth.error.missingEmail',
  'auth/missing-password': 'auth.error.missingPassword',
  'auth/network-request-failed': 'auth.error.network',
  'auth/too-many-requests': 'auth.error.tooMany',
  'auth/user-disabled': 'auth.error.disabled',
  'auth/user-not-found': 'auth.error.notFound',
  'auth/weak-password': 'auth.error.weakPassword',
  'auth/wrong-password': 'auth.error.wrongPassword',
};

/** Password changes report a wrong current password differently than sign-in. */
const PASSWORD_ERROR_KEYS: Record<string, TranslationKey> = {
  ...AUTH_ERROR_KEYS,
  'auth/invalid-credential': 'auth.error.wrongPassword',
  'auth/wrong-password': 'auth.error.wrongPassword',
  'auth/requires-recent-login': 'auth.error.recentLogin',
};

/** Converts any thrown value into an `Error` with a translated message. */
function toAuthError(
  error: unknown,
  i18n: I18nService,
  overrides: Record<string, TranslationKey> = AUTH_ERROR_KEYS
): Error {
  if (error instanceof FirebaseError) {
    const key = overrides[error.code];
    return new Error(key ? i18n.t(key) : error.message);
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error(i18n.t('auth.error.generic'));
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly i18n = inject(I18nService);

  /** Currently signed in user, mirrored into `localStorage`. */
  readonly authState = signal<FirebaseUser | null>(null);

  /** Compatibility accessor for templates and components. */
  get userData(): FirebaseUser | null {
    return this.authState();
  }

  constructor() {
    /* Saving user data in localstorage when
    logged in and setting up null when logged out */
    onAuthStateChanged(auth, (user) => {
      // Firebase callbacks run outside of Angular's zone.
      this.ngZone.run(() => {
        this.authState.set(user);
        localStorage.setItem('user', JSON.stringify(user));
      });
    });
  }

  /**
   * Sign in with email/password. Rejects with a user presentable `Error` when
   * Firebase refuses the credentials, so the calling page can render it.
   */
  async SignIn(email: string, password: string): Promise<void> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await this.SetUserData(result.user);
      await this.router.navigate(['home']);
    } catch (error) {
      throw toAuthError(error, this.i18n);
    }
  }

  /** Sign up with email/password and send the verification email. */
  async SignUp(email: string, password: string): Promise<void> {
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await this.SetUserData(result.user);
      await this.SendVerificationMail();
    } catch (error) {
      throw toAuthError(error, this.i18n);
    }
  }

  // Send email verification when new user sign up
  async SendVerificationMail(): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      return;
    }
    try {
      await sendEmailVerification(user);
      await this.router.navigate(['verify-email-address']);
    } catch (error) {
      throw toAuthError(error, this.i18n);
    }
  }

  // Reset forgotten password
  async ForgotPassword(passwordResetEmail: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, passwordResetEmail);
    } catch (error) {
      throw toAuthError(error, this.i18n);
    }
  }

  // Returns true when user is logged in and email is verified
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user')!);
    return user !== null && user.emailVerified !== false ? true : false;
  }

  /** The user cached on the last sign-in, available before Firebase rehydrates. */
  private get cachedUser(): {
    uid?: string;
    displayName?: string | null;
    email?: string | null;
  } | null {
    try {
      return JSON.parse(localStorage.getItem('user') ?? 'null');
    } catch {
      return null;
    }
  }

  /** UID used to scope local data; falls back to the cached user on reload. */
  get userId(): string | null {
    return this.userData?.uid ?? this.cachedUser?.uid ?? null;
  }

  /** Human readable author name, also available before Firebase rehydrates. */
  get userLabel(): string {
    return userDisplayName(this.userData ?? this.cachedUser);
  }

  /** Email address, falling back to the cached user on reload. */
  get userEmail(): string {
    return this.userData?.email ?? this.cachedUser?.email ?? '';
  }

  /**
   * Changes the password of an email/password account. Firebase requires a
   * recent sign-in, so the current password is used to reauthenticate first.
   */
  async ChangePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = auth.currentUser;
    if (!user?.email) {
      throw new Error(this.i18n.t('auth.error.notSignedIn'));
    }

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
    } catch (error) {
      throw toAuthError(error, this.i18n, PASSWORD_ERROR_KEYS);
    }
  }

  /* Setting up user data when sign in with username/password,
  sign up with username/password and sign in with social auth
  provider in Firestore database */
  SetUserData(user: FirebaseUser | null): Promise<void> {
    if (!user) {
      return Promise.resolve();
    }
    const userRef = doc(db, `users/${user.uid}`);
    const userData: User = {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName!,
      photoURL: user.photoURL!,
      emailVerified: user.emailVerified,
    };
    return setDoc(userRef, userData, { merge: true });
  }

  // Sign out
  async SignOut(): Promise<void> {
    await signOut(auth);
    localStorage.removeItem('user');
    await this.router.navigate(['sign-in']);
  }
}
