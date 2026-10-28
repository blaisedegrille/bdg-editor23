import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { Article, articleExcerpt } from 'src/app/models/article';

/** Presentational card for one article in the article list. */
@Component({
  selector: 'app-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [DatePipe, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
})
export class ArticleComponent {
  readonly article = input.required<Article>();
  readonly remove = output<Article>();

  readonly excerpt = computed(() => articleExcerpt(this.article()));
  readonly published = computed(() => !!this.article().publishedAt);
}
