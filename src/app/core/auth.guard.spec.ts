import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, UrlTree, provideRouter } from '@angular/router';

import { authGuard } from './auth.guard';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => localStorage.clear());

  it('allows a signed in user through', () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ uid: 'test-uid', emailVerified: true })
    );

    expect(executeGuard({} as never, {} as never)).toBeTrue();
  });

  it('redirects guests to the sign-in page', () => {
    const result = executeGuard({} as never, {} as never);

    expect(result instanceof UrlTree).toBeTrue();
    expect(
      TestBed.inject(Router).serializeUrl(result as UrlTree)
    ).toBe('/sign-in');
  });
});
