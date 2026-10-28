import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AuthService } from 'src/app/core/auth.service';
import { I18nService } from 'src/app/core/i18n/i18n.service';
import { authServiceStub } from 'src/app/testing/auth-service.stub';
import { PasswordCardComponent } from './password-card.component';

describe('PasswordCardComponent', () => {
  let fixture: ComponentFixture<PasswordCardComponent>;
  let component: PasswordCardComponent;
  let changePassword: jasmine.Spy<AuthService['ChangePassword']>;
  let authState: WritableSignal<Record<string, unknown>>;
  let authValue: Record<string, unknown>;

  beforeEach(() => {
    localStorage.clear();
    changePassword = jasmine
      .createSpy('ChangePassword')
      .and.resolveTo();
    authState = signal({
      ...(authServiceStub.authState() as Record<string, unknown>),
    });
    authValue = {
      ...authServiceStub,
      authState,
      get userData() {
        return authState();
      },
      ChangePassword: changePassword,
    };

    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, PasswordCardComponent],
      providers: [{ provide: AuthService, useValue: authValue }],
    });
    TestBed.inject(I18nService).setLanguage('en');

    fixture = TestBed.createComponent(PasswordCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  function fill(
    currentPassword = 'current-pass',
    newPassword = 'new-password',
    confirmPassword = 'new-password'
  ): void {
    component.changeForm.setValue({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    component.changeForm.markAllAsTouched();
    fixture.detectChanges();
  }

  it('renders the password form for email/password accounts', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('form')).not.toBeNull();
    expect(compiled.textContent).toContain('Current password');
    expect(compiled.textContent).toContain('Update password');
  });

  it('rejects a mismatched confirmation without calling Firebase', async () => {
    fill('current-pass', 'new-password', 'different-pass');

    await component.onSubmit();

    expect(changePassword).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Passwords do not match.'
    );
  });

  it('rejects reusing the current password', async () => {
    fill('same-password', 'same-password', 'same-password');

    await component.onSubmit();

    expect(changePassword).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Choose a password different from your current one.'
    );
  });

  it('changes the password and clears the form', async () => {
    fill();

    await component.onSubmit();

    expect(changePassword).toHaveBeenCalledWith(
      'current-pass',
      'new-password'
    );
    expect(component.changeForm.getRawValue().currentPassword).toBe('');
  });

  it('shows an error when Firebase rejects the current password', async () => {
    changePassword.and.rejectWith(
      new Error('Your current password is incorrect.')
    );
    fill();

    await component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe(
      'Your current password is incorrect.'
    );
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '.password-card__alert'
      )?.textContent
    ).toContain('Your current password is incorrect.');
  });

  it('explains that social accounts have no password', () => {
    authState.set({
      ...(authState() as Record<string, unknown>),
      providerData: [{ providerId: 'google.com' }],
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('form')).toBeNull();
    expect(
      compiled.querySelector('.password-card__note')?.textContent
    ).toContain('google.com');
  });
});
