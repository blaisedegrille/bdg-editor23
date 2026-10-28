/**
 * Minimal stand-in for `AuthService` used by component specs so that they never
 * touch a real Firebase project. Only the members the components actually read
 * are populated.
 */
export const authServiceStub = {
  userData: {
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
  },
  get userId(): string {
    return 'test-uid';
  },
  get userLabel(): string {
    return 'Test User';
  },
  SignIn: () => Promise.resolve(),
  SignUp: () => Promise.resolve(),
  SendVerificationMail: () => Promise.resolve(),
  ForgotPassword: () => Promise.resolve(),
  SetUserData: () => Promise.resolve(),
  SignOut: () => Promise.resolve(),
  isLoggedIn: true,
};
