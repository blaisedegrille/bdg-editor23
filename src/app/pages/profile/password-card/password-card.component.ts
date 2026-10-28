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
import { MatCardModule } from '@angular/material/card';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from 'src/app/core/auth.service';
import { I18nService } from 'src/app/core/i18n/i18n.service';
import { TranslatePipe } from 'src/app/shared/translate.pipe';

/** Rejects reusing the current password and mismatched confirmation fields. */
function validatePasswordChange(
  group: AbstractControl
): ValidationErrors | null {
  const current = group.get('currentPassword')?.value;
  const next = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  const errors: ValidationErrors = {};

  if (next && current && next === current) {
    errors['sameAsCurrent'] = true;
  }
  if (next !== confirm) {
    errors['passwordsMismatch'] = true;
  }

  return Object.keys(errors).length ? errors : null;
}

/** Shows group-level errors on the new password field. */
class NewPasswordErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | null
  ): boolean {
    if (!control) {
      return false;
    }
    const touched = control.touched || !!form?.submitted;
    return touched && (control.invalid || !!control.parent?.hasError('sameAsCurrent'));
  }
}

/** Shows the confirmation mismatch, which lives on the form group. */
class ConfirmPasswordErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | null
  ): boolean {
    if (!control) {
      return false;
    }
    const touched = control.touched || !!form?.submitted;
    return (
      touched && (control.invalid || !!control.parent?.hasError('passwordsMismatch'))
    );
  }
}

@Component({
  selector: 'app-password-card',
  templateUrl: './password-card.component.html',
  styleUrls: ['./password-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TranslatePipe,
  ],
})
export class PasswordCardComponent {
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly formBuilder = inject(FormBuilder);

  readonly i18n = inject(I18nService);
  readonly changeForm = this.formBuilder.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: validatePasswordChange }
  );

  readonly newPasswordErrorStateMatcher =
    new NewPasswordErrorStateMatcher();
  readonly confirmPasswordErrorStateMatcher =
    new ConfirmPasswordErrorStateMatcher();
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly hideCurrent = signal(true);
  readonly hideNew = signal(true);
  readonly hideConfirm = signal(true);

  get currentPassword() {
    return this.changeForm.controls.currentPassword;
  }

  get newPassword() {
    return this.changeForm.controls.newPassword;
  }

  get confirmPassword() {
    return this.changeForm.controls.confirmPassword;
  }

  /** Accounts signed in through Firebase email/password can change a password. */
  get passwordAccount(): boolean {
    const providers =
      this.authService.userData?.providerData?.map(
        (provider) => provider.providerId
      ) ?? [];
    return providers.length === 0 || providers.includes('password');
  }

  get providerLabel(): string {
    return (
      this.authService.userData?.providerData?.[0]?.providerId ?? 'Firebase'
    );
  }

  toggleCurrentVisibility(): void {
    this.hideCurrent.update((hidden) => !hidden);
  }

  toggleNewVisibility(): void {
    this.hideNew.update((hidden) => !hidden);
  }

  toggleConfirmVisibility(): void {
    this.hideConfirm.update((hidden) => !hidden);
  }

  async onSubmit(): Promise<void> {
    this.errorMessage.set(null);

    if (this.changeForm.invalid) {
      this.changeForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    try {
      const { currentPassword, newPassword } = this.changeForm.getRawValue();
      await this.authService.ChangePassword(currentPassword, newPassword);
      this.changeForm.reset();
      this.snackBar.open(
        this.i18n.t('profile.security.success'),
        this.i18n.t('common.dismiss'),
        { duration: 4000 }
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : this.i18n.t('auth.error.generic');
      this.errorMessage.set(message);
    } finally {
      this.submitting.set(false);
    }
  }
}
