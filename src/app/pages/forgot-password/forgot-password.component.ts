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
import { AuthCardComponent } from 'src/app/shared/auth-card/auth-card.component';

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
  ],
})
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly formBuilder = inject(FormBuilder);

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
        'Password reset email sent. Check your inbox.',
        'Dismiss',
        { duration: 6000 }
      );
      this.resetForm.reset();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to send the reset email. Please try again.';
      this.errorMessage.set(message);
      this.snackBar.open(message, 'Dismiss', { duration: 6000 });
    } finally {
      this.submitting.set(false);
    }
  }
}
