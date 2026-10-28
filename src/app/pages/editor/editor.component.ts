import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  InjectionToken,
  OnDestroy,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import EditorJS, { EditorConfig, I18nDictionary } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';

import { ArticleCloudService } from 'src/app/core/article-cloud.service';
import { AuthService } from 'src/app/core/auth.service';
import { I18nService } from 'src/app/core/i18n/i18n.service';
import { Article } from 'src/app/models/article';
import { ArticleService } from 'src/app/service/article.service';
import { TranslatePipe } from 'src/app/shared/translate.pipe';

export type EditorFactory = (config: EditorConfig) => EditorJS;

/** Lets tests provide a lightweight stand-in for the real Editor.js instance. */
export const EDITOR_FACTORY = new InjectionToken<EditorFactory>(
  'EDITOR_FACTORY',
  {
    providedIn: 'root',
    factory: () => (config) => new EditorJS(config),
  }
);

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  private readonly articleService = inject(ArticleService);
  private readonly cloud = inject(ArticleCloudService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly editorFactory = inject(EDITOR_FACTORY);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  private readonly holderRef =
    viewChild.required<ElementRef<HTMLDivElement>>('editorHolder');

  private editor?: EditorJS;
  private applyingContent = false;

  readonly title = signal('');
  readonly dirty = signal(false);
  readonly saving = signal(false);
  readonly publishing = signal(false);
  readonly notFound = signal(false);
  readonly currentArticle = signal<Article | null>(null);

  async ngAfterViewInit(): Promise<void> {
    this.editor = this.editorFactory({
      holder: this.holderRef().nativeElement,
      autofocus: true,
      placeholder: this.i18n.t('editor.placeholder'),
      inlineToolbar: true,
      i18n: {
        messages: this.editorMessages,
      },
      tools: {
        header: Header,
        list: List,
      },
      onChange: () => {
        if (!this.applyingContent) {
          this.dirty.set(true);
        }
      },
    });

    await this.editor.isReady;

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => void this.loadArticle(params.get('id')));
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  onTitleInput(event: Event): void {
    this.title.set((event.target as HTMLInputElement).value);
    this.dirty.set(true);
  }

  /**
   * Editor.js resolves its own UI strings from a nested dictionary. Every key
   * below is the original English string, so translations must leave the keys
   * untouched and only change the values.
   */
  private get editorMessages(): I18nDictionary {
    return {
      toolNames: {
        Text: this.i18n.t('editorjs.tool.paragraph'),
        Heading: this.i18n.t('editorjs.tool.header'),
        List: this.i18n.t('editorjs.tool.list'),
      },
      tools: {
        list: {
          Unordered: this.i18n.t('editorjs.tool.unorderedList'),
          Ordered: this.i18n.t('editorjs.tool.orderedList'),
        },
      },
      blockTunes: {
        delete: { Delete: this.i18n.t('editorjs.tune.delete') },
        moveUp: { 'Move up': this.i18n.t('editorjs.tune.moveUp') },
        moveDown: { 'Move down': this.i18n.t('editorjs.tune.moveDown') },
      },
      ui: {
        toolbar: {
          toolbox: { Add: this.i18n.t('editorjs.ui.toolboxAdd') },
        },
        inlineToolbar: {
          converter: { 'Convert to': this.i18n.t('editorjs.ui.convertTo') },
        },
        popover: {
          Filter: this.i18n.t('editorjs.ui.filter'),
          'Nothing found': this.i18n.t('editorjs.ui.nothingFound'),
        },
      },
    };
  }

  /** Saves the current content as a local draft and returns it. */
  async saveDraft(): Promise<Article | null> {
    const title = this.title().trim();
    if (!title) {
      this.snackBar.open(
        this.i18n.t('editor.snack.titleRequired'),
        this.i18n.t('common.dismiss'),
        {
          duration: 4000,
        }
      );
      return null;
    }
    if (!this.editor) {
      return null;
    }

    this.saving.set(true);
    try {
      const content = await this.editor.save();
      const current = this.currentArticle();
      let article: Article;

      if (current) {
        const updated = this.articleService.update(current.id, {
          title,
          content,
        });
        if (!updated) {
          throw new Error('Article no longer exists.');
        }
        article = updated;
      } else {
        article = this.articleService.create({ title, content });
        this.currentArticle.set(article);
        await this.router.navigate(['/editor', article.id], {
          replaceUrl: true,
        });
      }

      this.currentArticle.set(article);
      this.dirty.set(false);
      this.snackBar.open(
        this.i18n.t('editor.snack.saved'),
        this.i18n.t('common.dismiss'),
        { duration: 2500 }
      );
      return article;
    } catch (error) {
      console.error('Saving the article failed.', error);
      this.snackBar.open(
        this.i18n.t('editor.snack.saveFailed'),
        this.i18n.t('common.dismiss'),
        { duration: 5000 }
      );
      return null;
    } finally {
      this.saving.set(false);
    }
  }

  /** Saves locally first, then mirrors the article to Firestore. */
  async publish(): Promise<void> {
    const article = await this.saveDraft();
    if (!article) {
      return;
    }

    this.publishing.set(true);
    try {
      const publishedAt = new Date().toISOString();
      await this.cloud.publish({ ...article, publishedAt });
      const updated = this.articleService.markPublished(article.id, publishedAt);
      if (updated) {
        this.currentArticle.set(updated);
      }
      this.snackBar.open(
        this.i18n.t('editor.snack.published'),
        this.i18n.t('common.dismiss'),
        {
          duration: 4000,
        }
      );
    } catch (error) {
      console.error('Publishing the article failed.', error);
      this.snackBar.open(
        this.i18n.t('editor.snack.publishFailed'),
        this.i18n.t('common.dismiss'),
        { duration: 6000 }
      );
    } finally {
      this.publishing.set(false);
    }
  }

  async deleteArticle(): Promise<void> {
    const article = this.currentArticle();
    if (!article) {
      return;
    }

    this.articleService.remove(article.id);
    await this.router.navigate(['/articles']);

    const ref = this.snackBar.open(
      this.i18n.t('editor.snack.deleted'),
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

  private async loadArticle(id: string | null): Promise<void> {
    if (!this.editor) {
      return;
    }
    if (!id) {
      this.currentArticle.set(null);
      this.notFound.set(false);
      this.title.set('');
      return;
    }
    if (id === this.currentArticle()?.id) {
      // Our own `replaceUrl` navigation after the first save.
      return;
    }

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

    if (!article) {
      this.currentArticle.set(null);
      this.notFound.set(true);
      this.title.set('');
      return;
    }

    this.currentArticle.set(article);
    this.notFound.set(false);
    this.title.set(article.title);

    this.applyingContent = true;
    try {
      this.editor.clear();
      await this.editor.render(article.content);
    } finally {
      this.applyingContent = false;
      this.dirty.set(false);
    }
  }
}
