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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';

import { ArticleCloudService } from 'src/app/core/article-cloud.service';
import { ArticleSyncService } from 'src/app/core/article-sync.service';
import { AuthService } from 'src/app/core/auth.service';
import { I18nService } from 'src/app/core/i18n/i18n.service';
import { Article } from 'src/app/models/article';
import { ArticleService } from 'src/app/service/article.service';
import { TranslatePipe } from 'src/app/shared/translate.pipe';
import { ArticleComponent } from './article/article.component';

@Component({
  selector: 'app-article-list',
  templateUrl: './article-list.component.html',
  styleUrls: ['./article-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    ArticleComponent,
    TranslatePipe,
  ],
})
export class ArticleListComponent implements OnInit {
  private readonly cloud = inject(ArticleCloudService);
  private readonly authService = inject(AuthService);
  private readonly syncService = inject(ArticleSyncService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly i18n = inject(I18nService);

  readonly articleService = inject(ArticleService);
  readonly syncing = signal(false);

  async ngOnInit(): Promise<void> {
    this.syncing.set(true);
    try {
      await this.syncService.sync();
    } finally {
      this.syncing.set(false);
    }
  }

  remove(article: Article): void {
    this.articleService.remove(article.id);

    const ref = this.snackBar.open(
      this.i18n.t('articles.deleted'),
      this.i18n.t('common.undo'),
      {
        duration: 6000,
      }
    );
    ref.onAction().subscribe(() => this.articleService.restore(article));

    const uid = this.authService.userId;
    if (article.publishedAt && uid) {
      ref.afterDismissed().subscribe((info) => {
        if (!info.dismissedByAction) {
          void this.cloud.remove(uid, article.id).catch((error) => {
            console.error('Could not delete the published copy.', error);
          });
        }
      });
    }
  }
}
