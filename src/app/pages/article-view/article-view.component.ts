import { formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ArticleCloudService } from 'src/app/core/article-cloud.service';
import { AuthService } from 'src/app/core/auth.service';
import { I18nService } from 'src/app/core/i18n/i18n.service';
import { Article } from 'src/app/models/article';
import { ArticleService } from 'src/app/service/article.service';
import { ArticleContentComponent } from 'src/app/shared/article-content/article-content.component';
import { TranslatePipe } from 'src/app/shared/translate.pipe';

@Component({
  selector: 'app-article-view',
  templateUrl: './article-view.component.html',
  styleUrls: ['./article-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    RouterLink,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ArticleContentComponent,
    TranslatePipe,
  ],
})
export class ArticleViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly articleService = inject(ArticleService);
  private readonly cloud = inject(ArticleCloudService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly article = signal<Article | null>(null);
  readonly loading = signal(true);

  get updatedLabel(): string {
    const updatedAt = this.article()?.updatedAt;
    if (!updatedAt) {
      return '';
    }
    return this.i18n.t('reader.updated', {
      date: formatDate(updatedAt, 'mediumDate', this.i18n.locale()),
    });
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => void this.load(params.get('id')));
  }

  private async load(id: string | null): Promise<void> {
    if (!id) {
      this.article.set(null);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    let article = this.articleService.get(id);
    const uid = this.authService.userId;
    if (!article && uid) {
      try {
        const remote = await this.cloud.fetchOne(uid, id);
        if (remote) {
          this.articleService.mergeCloud([remote]);
          article = this.articleService.get(id);
        }
      } catch (error) {
        console.error('Could not load the published article.', error);
      }
    }

    this.article.set(article ?? null);
    this.loading.set(false);
  }
}
