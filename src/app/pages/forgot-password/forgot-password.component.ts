import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
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

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
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
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly formBuilder = inject(FormBuilder);

  readonly i18n = inject(I18nService);

  readonly resetForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  get email() {
    return this.resetForm.controls.email;
  }

  async onSubmit(): Promise<void> {
    this.errorMessage.set(null);

    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    try {
      await this.authService.ForgotPassword(
        this.resetForm.getRawValue().email
      );
      this.snackBar.open(
        this.i18n.t('auth.reset.success'),
        this.i18n.t('common.dismiss'),
        { duration: 6000 }
      );
      this.resetForm.reset();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : this.i18n.t('auth.error.reset');
      this.errorMessage.set(message);
      this.snackBar.open(message, this.i18n.t('common.dismiss'), {
        duration: 6000,
      });
    } finally {
      this.submitting.set(false);
    }
  }
}
