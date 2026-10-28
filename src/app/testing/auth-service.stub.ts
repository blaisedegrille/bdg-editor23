import { signal } from '@angular/core';

/**
 * Minimal stand-in for `AuthService` used by component specs so that they never
 * touch a real Firebase project. Only the members the components actually read
 * are populated.
 */
const stubUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
  metadata: {
    creationTime: '2024-01-15T10:30:00.000Z',
    lastSignInTime: '2026-10-28T18:00:00.000Z',
  },
  providerData: [{ providerId: 'password' }],
};

export const authServiceStub = {
  authState: signal(stubUser),
  get userData() {
    return this.authState();
  },
  get userId(): string {
    return 'test-uid';
  },
  get userLabel(): string {
    return 'Test User';
  },
  get userEmail(): string {
    return 'test@example.com';
  },
  SignIn: () => Promise.resolve(),
  SignUp: () => Promise.resolve(),
  SendVerificationMail: () => Promise.resolve(),
  ForgotPassword: () => Promise.resolve(),
  ChangePassword: () => Promise.resolve(),
  SetUserData: () => Promise.resolve(),
  SignOut: () => Promise.resolve(),
  isLoggedIn: true,
};
