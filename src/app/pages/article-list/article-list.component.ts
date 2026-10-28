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
import { AuthService } from 'src/app/core/auth.service';
import { Article } from 'src/app/models/article';
import { ArticleService } from 'src/app/service/article.service';
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
  ],
})
export class ArticleListComponent implements OnInit {
  private readonly cloud = inject(ArticleCloudService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  readonly articleService = inject(ArticleService);
  readonly syncing = signal(false);

  async ngOnInit(): Promise<void> {
    this.articleService.reload();

    const uid = this.authService.userId;
    if (!uid) {
      return;
    }

    this.syncing.set(true);
    try {
      const remote = await this.cloud.fetchAll(uid);
      this.articleService.mergeCloud(remote);
    } catch (error) {
      // Offline or missing Firestore rules: local drafts still work.
      console.warn('Could not load published articles.', error);
    } finally {
      this.syncing.set(false);
    }
  }

  remove(article: Article): void {
    this.articleService.remove(article.id);

    const ref = this.snackBar.open('Article deleted.', 'Undo', {
      duration: 6000,
    });
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
