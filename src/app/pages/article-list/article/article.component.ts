import { formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { I18nService } from 'src/app/core/i18n/i18n.service';
import { Article, articleExcerpt } from 'src/app/models/article';
import { TranslatePipe } from 'src/app/shared/translate.pipe';

/** Presentational card for one article in the article list. */
@Component({
  selector: 'app-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    TranslatePipe,
  ],
})
export class ArticleComponent {
  readonly i18n = inject(I18nService);
  readonly article = input.required<Article>();
  /** Hides the delete button on read-only feeds such as the home page. */
  readonly showDelete = input(true);
  readonly remove = output<Article>();

  readonly excerpt = computed(() => articleExcerpt(this.article()));
  readonly published = computed(() => !!this.article().publishedAt);

  get updatedLabel(): string {
    return this.i18n.t('article.updated', {
      date: formatDate(
        this.article().updatedAt,
        'mediumDate',
        this.i18n.locale()
      ),
    });
  }
}
