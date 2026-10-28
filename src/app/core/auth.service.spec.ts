import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => localStorage.clear());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should report being logged out when no user is stored', () => {
    expect(service.isLoggedIn).toBeFalse();
  });
});
