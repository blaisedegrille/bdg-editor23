import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';

import { ArticleSyncService } from 'src/app/core/article-sync.service';
import { AuthService } from 'src/app/core/auth.service';
import { I18nService } from 'src/app/core/i18n/i18n.service';
import { userInitials as toInitials } from 'src/app/core/user-display';
import { ArticleService } from 'src/app/service/article.service';
import { ArticleComponent } from 'src/app/pages/article-list/article/article.component';
import { TranslatePipe } from 'src/app/shared/translate.pipe';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ArticleComponent,
    TranslatePipe,
  ],
})
export class HomeComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly articleService = inject(ArticleService);
  private readonly syncService = inject(ArticleSyncService);

  readonly i18n = inject(I18nService);
  readonly syncing = signal(false);

  get userName(): string {
    return this.authService.userLabel || 'there';
  }

  get userInitials(): string {
    return toInitials(this.userName);
  }

  get photoUrl(): string | null {
    return this.authService.userData?.photoURL ?? null;
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
      return this.i18n.t('home.greeting.morning');
    }
    if (hour < 18) {
      return this.i18n.t('home.greeting.afternoon');
    }
    return this.i18n.t('home.greeting.evening');
  }

  get articles() {
    return this.articleService.articles();
  }

  get articleCount(): number {
    return this.articles.length;
  }

  get draftCount(): number {
    return this.articles.filter((article) => !article.publishedAt).length;
  }

  get publishedCount(): number {
    return this.articles.filter((article) => !!article.publishedAt).length;
  }

  async ngOnInit(): Promise<void> {
    this.syncing.set(true);
    try {
      await this.syncService.sync();
    } finally {
      this.syncing.set(false);
    }
  }
}
