import { Pipe, PipeTransform, inject } from '@angular/core';

import { I18nService, TranslationParams } from 'src/app/core/i18n/i18n.service';
import { TranslationKey } from 'src/app/core/i18n/translations/en';

/**
 * Impure on purpose: the active language is a signal, and templates need to
 * re-render as soon as it changes from the profile settings.
 */
@Pipe({
  name: 't',
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: TranslationKey, params?: TranslationParams): string {
    return this.i18n.t(key, params);
  }
}
