import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from 'src/app/core/auth.service';
import { authServiceStub } from 'src/app/testing/auth-service.stub';
import { VerifyEmailComponent } from './verify-email.component';

describe('VerifyEmailComponent', () => {
  let component: VerifyEmailComponent;
  let fixture: ComponentFixture<VerifyEmailComponent>;
  let sendVerificationSpy: jasmine.Spy<
    AuthService['SendVerificationMail']
  >;

  beforeEach(() => {
    sendVerificationSpy = jasmine
      .createSpy('SendVerificationMail')
      .and.resolveTo();

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, VerifyEmailComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: AuthService,
          useValue: {
            ...authServiceStub,
            SendVerificationMail: sendVerificationSpy,
          },
        },
      ],
    });
    fixture = TestBed.createComponent(VerifyEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the address the verification email was sent to', () => {
    const address = fixture.nativeElement.querySelector(
      '.verify-email__address'
    );
    expect(address?.textContent).toContain('test@example.com');
  });

  it('resends the verification email', async () => {
    await component.resendVerificationEmail();

    expect(sendVerificationSpy).toHaveBeenCalledTimes(1);
    expect(component.errorMessage()).toBeNull();
  });

  it('shows the message returned by the auth service', async () => {
    sendVerificationSpy.and.rejectWith(
      new Error('Too many attempts. Please wait a few minutes and try again.')
    );

    await component.resendVerificationEmail();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe(
      'Too many attempts. Please wait a few minutes and try again.'
    );
    expect(
      fixture.nativeElement.querySelector('.auth-alert')?.textContent
    ).toContain('Too many attempts.');
  });
});
