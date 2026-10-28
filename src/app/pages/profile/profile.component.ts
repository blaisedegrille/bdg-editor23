import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { AuthService } from 'src/app/core/auth.service';
import { I18nService } from 'src/app/core/i18n/i18n.service';
import { userInitials as toInitials } from 'src/app/core/user-display';
import { ArticleService } from 'src/app/service/article.service';
import { TranslatePipe } from 'src/app/shared/translate.pipe';
import { LanguageCardComponent } from './language-card/language-card.component';
import { PasswordCardComponent } from './password-card/password-card.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    TranslatePipe,
    LanguageCardComponent,
    PasswordCardComponent,
  ],
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly articleService = inject(ArticleService);

  readonly i18n = inject(I18nService);

  get user() {
    return this.authService.userData;
  }

  /** True when either the live user or the cached sign-in is available. */
  get signedIn(): boolean {
    return this.authService.userId !== null;
  }

  get userName(): string {
    return this.authService.userLabel;
  }

  get userInitials(): string {
    return toInitials(this.userName);
  }

  get userEmail(): string {
    return this.authService.userEmail;
  }

  get userId(): string | null {
    return this.authService.userId;
  }

  get providerLabel(): string {
    const providerId = this.user?.providerData?.[0]?.providerId;
    if (!providerId) {
      return '—';
    }
    return providerId === 'password'
      ? this.i18n.t('profile.provider.password')
      : providerId;
  }

  get articleCount(): number {
    return this.articleService.articles().length;
  }

  get draftCount(): number {
    return this.articleService
      .articles()
      .filter((article) => !article.publishedAt).length;
  }

  get publishedCount(): number {
    return this.articleService
      .articles()
      .filter((article) => !!article.publishedAt).length;
  }

  ngOnInit(): void {
    this.articleService.reload();
  }
}
