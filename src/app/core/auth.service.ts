import { Injectable, NgZone, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { User } from '../models/user';
import { userDisplayName } from './user-display';
import { auth, db } from './firebase';

/** Human friendly messages for the Firebase auth error codes we expect to hit. */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use':
    'An account already exists for this email address. Try signing in instead.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/missing-email': 'Enter your email address.',
  'auth/missing-password': 'Enter your password.',
  'auth/network-request-failed':
    'Network error. Check your connection and try again.',
  'auth/too-many-requests':
    'Too many attempts. Please wait a few minutes and try again.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/weak-password': 'Choose a stronger password (at least 6 characters).',
  'auth/wrong-password': 'Incorrect email or password.',
};

/** Converts any thrown value into an `Error` with a user presentable message. */
function toAuthError(error: unknown): Error {
  if (error instanceof FirebaseError) {
    return new Error(AUTH_ERROR_MESSAGES[error.code] ?? error.message);
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error('Something went wrong. Please try again.');
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  /** Currently signed in user, mirrored into `localStorage`. */
  userData: FirebaseUser | null = null;

  constructor() {
    /* Saving user data in localstorage when
    logged in and setting up null when logged out */
    onAuthStateChanged(auth, (user) => {
      // Firebase callbacks run outside of Angular's zone.
      this.ngZone.run(() => {
        this.userData = user;
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
      await this.router.navigate(['dashboard']);
    } catch (error) {
      throw toAuthError(error);
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
      throw toAuthError(error);
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
      throw toAuthError(error);
    }
  }

  // Reset forgotten password
  async ForgotPassword(passwordResetEmail: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, passwordResetEmail);
    } catch (error) {
      throw toAuthError(error);
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
