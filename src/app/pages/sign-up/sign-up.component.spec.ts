import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from 'src/app/core/auth.service';
import { authServiceStub } from 'src/app/testing/auth-service.stub';
import { SignUpComponent } from './sign-up.component';

describe('SignUpComponent', () => {
  let component: SignUpComponent;
  let fixture: ComponentFixture<SignUpComponent>;
  let signUpSpy: jasmine.Spy<AuthService['SignUp']>;

  beforeEach(() => {
    signUpSpy = jasmine.createSpy('SignUp').and.resolveTo();

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, SignUpComponent],
      providers: [
        provideNoopAnimations(),
        { provide: AuthService, useValue: { ...authServiceStub, SignUp: signUpSpy } },
      ],
    });
    fixture = TestBed.createComponent(SignUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the email, password and confirmation fields', () => {
    const fields = fixture.nativeElement.querySelectorAll('mat-form-field');
    expect(fields.length).toBe(3);
  });

  it('rejects passwords shorter than eight characters', () => {
    component.signUpForm.setValue({
      email: 'user@example.com',
      password: 'short',
      confirmPassword: 'short',
    });

    expect(component.signUpForm.hasError('passwordsMismatch')).toBeFalse();
    expect(component.password.hasError('minlength')).toBeTrue();
    expect(component.signUpForm.valid).toBeFalse();
  });

  it('rejects a confirmation that does not match the password', () => {
    component.signUpForm.setValue({
      email: 'user@example.com',
      password: 'secret123',
      confirmPassword: 'secret124',
    });

    expect(component.signUpForm.hasError('passwordsMismatch')).toBeTrue();
  });

  it('renders the mismatch message on the confirmation field', () => {
    component.signUpForm.setValue({
      email: 'user@example.com',
      password: 'secret123',
      confirmPassword: 'secret124',
    });
    component.confirmPassword.markAsTouched();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('mat-error')?.textContent
    ).toContain('Passwords do not match.');
  });

  it('does not call SignUp while the form is invalid', async () => {
    await component.onSubmit();

    expect(signUpSpy).not.toHaveBeenCalled();
    expect(component.email.touched).toBeTrue();
  });

  it('creates the account with the entered credentials', async () => {
    component.signUpForm.setValue({
      email: 'user@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    });

    await component.onSubmit();

    expect(signUpSpy).toHaveBeenCalledTimes(1);
    expect(signUpSpy).toHaveBeenCalledWith('user@example.com', 'secret123');
    expect(component.errorMessage()).toBeNull();
  });

  it('shows the message returned by the auth service', async () => {
    signUpSpy.and.rejectWith(
      new Error('An account already exists for this email address.')
    );
    component.signUpForm.setValue({
      email: 'user@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    });

    await component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe(
      'An account already exists for this email address.'
    );
    const alert = fixture.nativeElement.querySelector('.auth-alert');
    expect(alert?.textContent).toContain(
      'An account already exists for this email address.'
    );
  });
});
