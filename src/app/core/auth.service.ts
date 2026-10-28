import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
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
import { auth, db } from './firebase';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  userData: any; // Save logged in user data

  constructor(public router: Router, public ngZone: NgZone) {
    /* Saving user data in localstorage when
    logged in and setting up null when logged out */
    onAuthStateChanged(auth, (user) => {
      // Firebase callbacks run outside of Angular's zone.
      this.ngZone.run(() => {
        if (user) {
          this.userData = user;
          localStorage.setItem('user', JSON.stringify(this.userData));
        } else {
          this.userData = null;
          localStorage.setItem('user', 'null');
        }
      });
    });
  }

  // Sign in with email/password
  async SignIn(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await this.SetUserData(result.user);
      await this.router.navigate(['dashboard']);
    } catch (error: any) {
      window.alert(error.message);
    }
  }

  // Sign up with email/password
  async SignUp(email: string, password: string) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      /* Call the SendVerificaitonMail() function when new user signs
      up and returns promise */
      await this.SendVerificationMail();
      await this.SetUserData(result.user);
    } catch (error: any) {
      window.alert(error.message);
    }
  }

  // Send email verification when new user sign up
  async SendVerificationMail() {
    const user = auth.currentUser;
    if (!user) {
      return;
    }
    await sendEmailVerification(user);
    await this.router.navigate(['verify-email-address']);
  }

  // Reset forgotten password
  async ForgotPassword(passwordResetEmail: string) {
    try {
      await sendPasswordResetEmail(auth, passwordResetEmail);
      window.alert('Password reset email sent, check your inbox.');
    } catch (error: any) {
      window.alert(error);
    }
  }

  // Returns true when user is logged in and email is verified
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user')!);
    return user !== null && user.emailVerified !== false ? true : false;
  }

  /* Setting up user data when sign in with username/password,
  sign up with username/password and sign in with social auth
  provider in Firestore database */
  SetUserData(user: FirebaseUser | null) {
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
  async SignOut() {
    await signOut(auth);
    localStorage.removeItem('user');
    await this.router.navigate(['sign-in']);
  }
}
