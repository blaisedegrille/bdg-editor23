import { AuthService } from '../core/auth.service';

/**
 * Minimal stand-in for `AuthService` used by component specs so that they never
 * touch a real Firebase project.
 */
export const authServiceStub: Partial<AuthService> & {
  userData: Record<string, unknown>;
  [key: string]: unknown;
} = {
  userData: {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
    emailVerified: true,
  },
  SignIn: () => Promise.resolve(),
  SignUp: () => Promise.resolve(),
  SendVerificationMail: () => Promise.resolve(),
  ForgotPassword: () => Promise.resolve(),
  SetUserData: () => Promise.resolve(),
  SignOut: () => Promise.resolve(),
  isLoggedIn: true,
};
