import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { AuthService } from 'src/app/core/auth.service';
import { userDisplayName, userInitials } from 'src/app/core/user-display';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
  ],
})
export class DashboardComponent {
  readonly authService = inject(AuthService);

  get user() {
    return this.authService.userData;
  }

  get userName(): string {
    return userDisplayName(this.user);
  }

  get userInitials(): string {
    return userInitials(this.userName);
  }

  get providerLabel(): string {
    const providerId = this.user?.providerData?.[0]?.providerId;
    if (!providerId) {
      return '—';
    }
    return providerId === 'password' ? 'Email and password' : providerId;
  }

  async signOut(): Promise<void> {
    await this.authService.SignOut();
  }
}
