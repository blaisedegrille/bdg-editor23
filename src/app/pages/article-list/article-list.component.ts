import { Component } from '@angular/core';
import { ArticleComponent } from './article/article.component';

@Component({
  selector: 'app-article-list',
  templateUrl: './article-list.component.html',
  styleUrls: ['./article-list.component.scss'],
  imports: [ArticleComponent]
})
export class ArticleListComponent {

}
