import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  LANGUAGE_NAMES,
  LANGUAGES,
  Language,
} from 'src/app/core/i18n/language';
import { I18nService } from 'src/app/core/i18n/i18n.service';
import { UserPreferencesService } from 'src/app/core/user-preferences.service';
import { TranslatePipe } from 'src/app/shared/translate.pipe';

@Component({
  selector: 'app-language-card',
  templateUrl: './language-card.component.html',
  styleUrls: ['./language-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
    TranslatePipe,
  ],
})
export class LanguageCardComponent {
  private readonly preferences = inject(UserPreferencesService);
  private readonly snackBar = inject(MatSnackBar);

  readonly i18n = inject(I18nService);
  readonly languages = LANGUAGES.map((code) => ({
    code,
    name: LANGUAGE_NAMES[code],
  }));

  async selectLanguage(language: Language): Promise<void> {
    const synced = await this.preferences.setLanguage(language);
    if (!synced) {
      this.snackBar.open(
        this.i18n.t('profile.language.syncFailed'),
        this.i18n.t('common.dismiss'),
        { duration: 6000 }
      );
    }
  }
}
