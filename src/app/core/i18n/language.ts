/** Languages the UI can be rendered in. */
export type Language = 'en' | 'de' | 'hu';

export const LANGUAGES: readonly Language[] = ['en', 'de', 'hu'];

/** Native names, intentionally not translated. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  de: 'Deutsch',
  hu: 'Magyar',
};

/** Locale identifiers used for dates and number formatting. */
export const LANGUAGE_LOCALES: Record<Language, string> = {
  en: 'en',
  de: 'de',
  hu: 'hu',
};

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && LANGUAGES.includes(value as Language);
}
