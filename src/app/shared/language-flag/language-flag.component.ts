import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Language } from 'src/app/core/i18n/language';

/**
 * Decorative flag shown next to a language name. It is purely visual: the
 * language name is always rendered as text next to it, so the SVG is hidden
 * from assistive technology.
 */
@Component({
  selector: 'app-language-flag',
  templateUrl: './language-flag.component.html',
  styleUrls: ['./language-flag.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { 'aria-hidden': 'true' },
})
export class LanguageFlagComponent {
  readonly code = input.required<Language>();
}
