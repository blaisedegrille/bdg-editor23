import { Injectable, computed, signal } from '@angular/core';

import {
  LANGUAGE_LOCALES,
  LANGUAGES,
  Language,
  isLanguage,
} from './language';
import { TranslationKey, en } from './translations/en';
import { de } from './translations/de';
import { hu } from './translations/hu';

const STORAGE_KEY = 'bdg-editor23.language.v1';

const DICTIONARIES: Record<Language, Record<TranslationKey, string>> = {
  en,
  de,
  hu,
};

export type TranslationParams = Record<
  string,
  string | number | null | undefined
>;

/** Picks a supported language from the browser when nothing is stored yet. */
function detectBrowserLanguage(): Language | null {
  if (typeof navigator === 'undefined') {
    return null;
  }
  const code = navigator.language?.split('-')[0];
  return isLanguage(code) ? code : null;
}

function readStoredLanguage(): Language | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isLanguage(stored) ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Small runtime translation layer. Angular's built-in i18n is build-time only,
 * while the language preference needs to change instantly and follow the user.
 */
@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly currentLanguage = signal<Language>(
    readStoredLanguage() ?? detectBrowserLanguage() ?? 'en'
  );

  readonly languages = LANGUAGES;
  readonly language = this.currentLanguage.asReadonly();
  readonly locale = computed(() => LANGUAGE_LOCALES[this.currentLanguage()]);
  readonly dictionary = computed(() => DICTIONARIES[this.currentLanguage()]);

  constructor() {
    this.applyDocumentLanguage(this.currentLanguage());
  }

  /** Translates a key, interpolating `{name}` placeholders. */
  t(key: TranslationKey, params?: TranslationParams): string {
    const template = this.dictionary()[key] ?? en[key] ?? key;
    if (!params) {
      return template;
    }
    return template.replace(/\{(\w+)\}/g, (match, name: string) => {
      const value = params[name];
      return value === undefined || value === null ? match : String(value);
    });
  }

  /**
   * Applies a language immediately. Persisting is on by default; the
   * preferences service can turn it off while an account value is loading.
   */
  setLanguage(language: Language, persist = true): void {
    if (!isLanguage(language)) {
      return;
    }
    this.currentLanguage.set(language);
    this.applyDocumentLanguage(language);
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, language);
      } catch {
        // Private browsing or a full quota: the in-memory choice still applies.
      }
    }
  }

  private applyDocumentLanguage(language: Language): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }
}
