import { Injectable, inject, signal } from '@angular/core';

import { AuthService } from '../core/auth.service';
import { Article, ArticleInput, isArticle } from '../models/article';

const STORAGE_PREFIX = 'bdg-editor23.articles.v1';

function createId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function newestFirst(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * Local-first article store. Every mutation is written to `localStorage`
 * immediately; Firestore publishing is handled separately by
 * `ArticleCloudService` so drafts keep working offline.
 */
@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  private readonly authService = inject(AuthService);
  private readonly articlesState = signal<Article[]>([]);
  private loadedFor: string | null = null;

  /** All of the signed in user's articles, newest first. */
  readonly articles = this.articlesState.asReadonly();

  private get storageKey(): string {
    return `${STORAGE_PREFIX}.${this.authService.userId ?? 'guest'}`;
  }

  private get currentScope(): string {
    return this.authService.userId ?? 'guest';
  }

  /** Reads the current user's articles from localStorage. */
  reload(): Article[] {
    let stored: unknown = [];
    try {
      stored = JSON.parse(localStorage.getItem(this.storageKey) ?? '[]');
    } catch {
      stored = [];
    }

    const articles = Array.isArray(stored) ? stored.filter(isArticle) : [];
    this.articlesState.set(newestFirst(articles));
    this.loadedFor = this.currentScope;
    return this.articlesState();
  }

  /** Reloads when the signed in user changed since the last read. */
  ensureLoaded(): void {
    if (this.loadedFor !== this.currentScope) {
      this.reload();
    }
  }

  list(): Article[] {
    this.ensureLoaded();
    return this.articlesState();
  }

  get(id: string): Article | undefined {
    this.ensureLoaded();
    return this.articlesState().find((article) => article.id === id);
  }

  create(input: ArticleInput): Article {
    this.ensureLoaded();
    const now = new Date().toISOString();
    const article: Article = {
      id: createId(),
      title: input.title.trim(),
      content: input.content,
      authorId: this.currentScope,
      authorName: this.authService.userLabel,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
    };
    this.commit([...this.articlesState(), article]);
    return article;
  }

  update(id: string, input: ArticleInput): Article | undefined {
    this.ensureLoaded();
    const existing = this.articlesState().find((article) => article.id === id);
    if (!existing) {
      return undefined;
    }
    const updated: Article = {
      ...existing,
      title: input.title.trim(),
      content: input.content,
      updatedAt: new Date().toISOString(),
    };
    this.commit(
      this.articlesState().map((article) =>
        article.id === id ? updated : article
      )
    );
    return updated;
  }

  remove(id: string): void {
    this.ensureLoaded();
    this.commit(
      this.articlesState().filter((article) => article.id !== id)
    );
  }

  /** Puts a deleted article back (used by the undo snackbar). */
  restore(article: Article): void {
    this.ensureLoaded();
    if (this.articlesState().some((item) => item.id === article.id)) {
      return;
    }
    this.commit([...this.articlesState(), article]);
  }

  markPublished(id: string, publishedAt = new Date().toISOString()): Article | undefined {
    this.ensureLoaded();
    const existing = this.get(id);
    if (!existing) {
      return undefined;
    }
    const updated: Article = { ...existing, publishedAt };
    this.commit(
      this.articlesState().map((article) =>
        article.id === id ? updated : article
      )
    );
    return updated;
  }

  /** Merges articles loaded from Firestore, keeping the newest version. */
  mergeCloud(remote: Article[]): void {
    this.ensureLoaded();
    const byId = new Map(
      this.articlesState().map((article) => [article.id, article])
    );
    for (const article of remote.filter(isArticle)) {
      const local = byId.get(article.id);
      if (!local || local.updatedAt < article.updatedAt) {
        byId.set(article.id, article);
      }
    }
    this.commit([...byId.values()]);
  }

  private commit(articles: Article[]): void {
    const sorted = newestFirst(articles);
    this.articlesState.set(sorted);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(sorted));
    } catch (error) {
      // Storage can be full or disabled; the in-memory list still works.
      console.error('Could not save articles locally.', error);
    }
  }
}
