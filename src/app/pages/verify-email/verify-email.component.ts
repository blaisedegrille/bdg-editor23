import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';

import { AuthService } from 'src/app/core/auth.service';
import { AuthCardComponent } from 'src/app/shared/auth-card/auth-card.component';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    RouterLink,
    AuthCardComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
})
export class VerifyEmailComponent {
  readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  readonly resending = signal(false);
  readonly errorMessage = signal<string | null>(null);

  async resendVerificationEmail(): Promise<void> {
    this.errorMessage.set(null);
    this.resending.set(true);
    try {
      await this.authService.SendVerificationMail();
      this.snackBar.open('Verification email sent. Check your inbox.', 'Dismiss', {
        duration: 6000,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to resend the verification email. Please try again.';
      this.errorMessage.set(message);
      this.snackBar.open(message, 'Dismiss', { duration: 6000 });
    } finally {
      this.resending.set(false);
    }
  }
}
