import { Injectable, inject } from '@angular/core';

import { ArticleService } from '../service/article.service';
import { ArticleCloudService } from './article-cloud.service';
import { AuthService } from './auth.service';

/**
 * Refreshes the local article store, then merges copies published to
 * Firestore. Failures (offline, missing rules) leave local drafts untouched.
 */
@Injectable({
  providedIn: 'root',
})
export class ArticleSyncService {
  private readonly articles = inject(ArticleService);
  private readonly cloud = inject(ArticleCloudService);
  private readonly authService = inject(AuthService);

  async sync(): Promise<void> {
    this.articles.reload();

    const uid = this.authService.userId;
    if (!uid) {
      return;
    }

    try {
      const remote = await this.cloud.fetchAll(uid);
      this.articles.mergeCloud(remote);
    } catch (error) {
      // Offline or missing Firestore rules: local drafts still work.
      console.warn('Could not load published articles.', error);
    }
  }
}
