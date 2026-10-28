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
  },
  SignIn: () => Promise.resolve(),
  SignUp: () => Promise.resolve(),
  SendVerificationMail: () => Promise.resolve(),
  ForgotPassword: () => Promise.resolve(),
  SetUserData: () => Promise.resolve(),
  SignOut: () => Promise.resolve(),
  isLoggedIn: true,
};
