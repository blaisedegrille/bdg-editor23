import { Injectable, effect, inject } from '@angular/core';

import { AuthService } from './auth.service';
import { Language } from './i18n/language';
import { I18nService } from './i18n/i18n.service';
import { UserProfileCloudService } from './user-profile-cloud.service';

/**
 * Keeps the interface language in sync with the signed in account while the
 * local copy remains the offline fallback.
 */
@Injectable({
  providedIn: 'root',
})
export class UserPreferencesService {
  private readonly authService = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly cloud = inject(UserProfileCloudService);
  private loadedFor: string | null = null;

  constructor() {
    effect(() => {
      const user = this.authService.authState();
      if (!user) {
        this.loadedFor = null;
        return;
      }
      if (this.loadedFor === user.uid) {
        return;
      }
      this.loadedFor = user.uid;
      void this.load(user.uid);
    });
  }

  /**
   * Applies the language locally right away, then mirrors it to the account.
   * Returns false when the remote write failed so the UI can mention that the
   * choice will sync later.
   */
  async setLanguage(language: Language): Promise<boolean> {
    this.i18n.setLanguage(language);

    const uid = this.authService.userId;
    if (!uid) {
      return true;
    }

    try {
      await this.cloud.saveLanguage(uid, language);
      return true;
    } catch (error) {
      console.warn('Could not sync the language preference.', error);
      return false;
    }
  }

  private async load(uid: string): Promise<void> {
    try {
      const language = await this.cloud.loadLanguage(uid);
      if (language) {
        this.i18n.setLanguage(language);
        return;
      }
      // First visit with preferences: store the current choice on the account.
      await this.cloud.saveLanguage(uid, this.i18n.language());
    } catch (error) {
      // Offline or missing Firestore rules: the cached language still applies.
      console.warn('Could not load the language preference.', error);
    }
  }
}
