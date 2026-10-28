import type { TranslationKey } from 'src/app/core/i18n/translations/en';

export interface Menu {
  labelKey: TranslationKey;
  route: string;
  icon?: string;
  locked?: boolean;
}
