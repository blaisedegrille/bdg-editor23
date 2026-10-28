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
import { I18nService } from 'src/app/core/i18n/i18n.service';
import { AuthCardComponent } from 'src/app/shared/auth-card/auth-card.component';
import { TranslatePipe } from 'src/app/shared/translate.pipe';

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
    TranslatePipe,
  ],
})
export class VerifyEmailComponent {
  readonly authService = inject(AuthService);
  readonly i18n = inject(I18nService);
  private readonly snackBar = inject(MatSnackBar);

  readonly resending = signal(false);
  readonly errorMessage = signal<string | null>(null);

  async resendVerificationEmail(): Promise<void> {
    this.errorMessage.set(null);
    this.resending.set(true);
    try {
      await this.authService.SendVerificationMail();
      this.snackBar.open(
        this.i18n.t('auth.verify.success'),
        this.i18n.t('common.dismiss'),
        {
          duration: 6000,
        }
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : this.i18n.t('auth.error.verify');
      this.errorMessage.set(message);
      this.snackBar.open(message, this.i18n.t('common.dismiss'), {
        duration: 6000,
      });
    } finally {
      this.resending.set(false);
    }
  }
}
