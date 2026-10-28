import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from 'src/app/core/auth.service';
import { authServiceStub } from 'src/app/testing/auth-service.stub';
import { SignInComponent } from './sign-in.component';

describe('SignInComponent', () => {
  let component: SignInComponent;
  let fixture: ComponentFixture<SignInComponent>;
  let signInSpy: jasmine.Spy<AuthService['SignIn']>;

  beforeEach(() => {
    signInSpy = jasmine.createSpy('SignIn').and.resolveTo();

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, SignInComponent],
      providers: [
        provideNoopAnimations(),
        { provide: AuthService, useValue: { ...authServiceStub, SignIn: signInSpy } },
      ],
    });
    fixture = TestBed.createComponent(SignInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the email and password fields', () => {
    const fields = fixture.nativeElement.querySelectorAll('mat-form-field');
    expect(fields.length).toBe(2);
    expect(fixture.nativeElement.querySelector('button[type="submit"]')).toBeTruthy();
  });

  it('does not call SignIn while the form is invalid', async () => {
    await component.onSubmit();

    expect(signInSpy).not.toHaveBeenCalled();
    expect(component.email.touched).toBeTrue();
    expect(component.password.touched).toBeTrue();
  });

  it('signs in with the entered credentials', async () => {
    component.signInForm.setValue({
      email: 'user@example.com',
      password: 'secret123',
    });

    await component.onSubmit();

    expect(signInSpy).toHaveBeenCalledTimes(1);
    expect(signInSpy).toHaveBeenCalledWith('user@example.com', 'secret123');
    expect(component.errorMessage()).toBeNull();
  });

  it('shows the message returned by the auth service', async () => {
    signInSpy.and.rejectWith(new Error('Incorrect email or password.'));
    component.signInForm.setValue({
      email: 'user@example.com',
      password: 'wrong-password',
    });

    await component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Incorrect email or password.');
    const alert = fixture.nativeElement.querySelector('.auth-alert');
    expect(alert?.textContent).toContain('Incorrect email or password.');
  });

  it('toggles the password visibility', () => {
    expect(component.hidePassword()).toBeTrue();

    component.togglePasswordVisibility();
    fixture.detectChanges();

    expect(component.hidePassword()).toBeFalse();
    const passwordInput: HTMLInputElement =
      fixture.nativeElement.querySelector('input[formControlName="password"]');
    expect(passwordInput.type).toBe('text');
  });
});
