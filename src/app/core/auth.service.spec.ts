import { TestBed } from '@angular/core/testing';

import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let router: { navigate: jasmine.Spy };

  const angularFireAuthMock = {
    authState: of(null),
    currentUser: Promise.resolve(null),
    signInWithEmailAndPassword: () => Promise.resolve({ user: null }),
    createUserWithEmailAndPassword: () => Promise.resolve({ user: null }),
    sendPasswordResetEmail: () => Promise.resolve(),
    signOut: () => Promise.resolve(),
  };

  const angularFirestoreMock = {
    doc: () => ({ set: () => Promise.resolve() }),
  };

  beforeEach(() => {
    router = { navigate: jasmine.createSpy('navigate') };

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AuthService,
        { provide: AngularFireAuth, useValue: angularFireAuthMock },
        { provide: AngularFirestore, useValue: angularFirestoreMock },
        { provide: Router, useValue: router },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should report being logged out when no user is stored', () => {
    expect(service.isLoggedIn).toBeFalse();
  });
});
