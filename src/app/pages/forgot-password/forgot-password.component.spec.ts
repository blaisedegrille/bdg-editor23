import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from 'src/app/core/auth.service';
import { authServiceStub } from 'src/app/testing/auth-service.stub';
import { ForgotPasswordComponent } from './forgot-password.component';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let forgotPasswordSpy: jasmine.Spy<AuthService['ForgotPassword']>;

  beforeEach(() => {
    forgotPasswordSpy = jasmine.createSpy('ForgotPassword').and.resolveTo();

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, ForgotPasswordComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: AuthService,
          useValue: { ...authServiceStub, ForgotPassword: forgotPasswordSpy },
        },
      ],
    });
    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not send a reset email for an invalid address', async () => {
    component.resetForm.setValue({ email: 'not-an-email' });

    await component.onSubmit();

    expect(forgotPasswordSpy).not.toHaveBeenCalled();
    expect(component.email.touched).toBeTrue();
  });

  it('sends a reset email to the entered address', async () => {
    component.resetForm.setValue({ email: 'user@example.com' });

    await component.onSubmit();

    expect(forgotPasswordSpy).toHaveBeenCalledTimes(1);
    expect(forgotPasswordSpy).toHaveBeenCalledWith('user@example.com');
    expect(component.errorMessage()).toBeNull();
    expect(component.resetForm.controls.email.value).toBe('');
  });

  it('shows the message returned by the auth service', async () => {
    forgotPasswordSpy.and.rejectWith(new Error('Incorrect email or password.'));
    component.resetForm.setValue({ email: 'user@example.com' });

    await component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Incorrect email or password.');
    const alert = fixture.nativeElement.querySelector('.auth-alert');
    expect(alert?.textContent).toContain('Incorrect email or password.');
  });
});
