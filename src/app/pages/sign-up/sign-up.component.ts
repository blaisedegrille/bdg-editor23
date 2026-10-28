import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroupDirective,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';

import { AuthService } from 'src/app/core/auth.service';
import { I18nService } from 'src/app/core/i18n/i18n.service';
import { AuthCardComponent } from 'src/app/shared/auth-card/auth-card.component';
import { TranslatePipe } from 'src/app/shared/translate.pipe';

/** Requires the two password fields of the group to hold the same value. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordsMismatch: true };
}

/**
 * The mismatch lives on the form group, while the message is rendered by the
 * confirmation field, so the default `ErrorStateMatcher` would never show it.
 */
class ConfirmPasswordErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | null
  ): boolean {
    if (!control) {
      return false;
    }
    const touched = control.touched || !!form?.submitted;
    return touched && !!control.parent?.hasError('passwordsMismatch');
  }
}

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthCardComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TranslatePipe,
  ],
})
export class SignUpComponent {
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly formBuilder = inject(FormBuilder);

  readonly i18n = inject(I18nService);

  readonly signUpForm = this.formBuilder.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch }
  );

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly hidePassword = signal(true);
  readonly hideConfirmPassword = signal(true);
  readonly confirmPasswordErrorStateMatcher =
    new ConfirmPasswordErrorStateMatcher();

  get email() {
    return this.signUpForm.controls.email;
  }

  get password() {
    return this.signUpForm.controls.password;
  }

  get confirmPassword() {
    return this.signUpForm.controls.confirmPassword;
  }

  togglePasswordVisibility(): void {
    this.hidePassword.update((hidden) => !hidden);
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.update((hidden) => !hidden);
  }

  async onSubmit(): Promise<void> {
    this.errorMessage.set(null);

    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    try {
      const { email, password } = this.signUpForm.getRawValue();
      await this.authService.SignUp(email, password);
      this.snackBar.open(
        this.i18n.t('auth.signUp.success'),
        this.i18n.t('common.dismiss'),
        { duration: 6000 }
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : this.i18n.t('auth.error.signUp');
      this.errorMessage.set(message);
      this.snackBar.open(message, this.i18n.t('common.dismiss'), {
        duration: 6000,
      });
    } finally {
      this.submitting.set(false);
    }
  }
}
