import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

/**
 * Shared, centered card shell used by the authentication pages (sign in, sign up,
 * password reset). It renders the page background, a Material card with an icon,
 * title and subtitle, the projected form and an optional footer.
 */
@Component({
  selector: 'app-auth-card',
  templateUrl: './auth-card.component.html',
  styleUrls: ['./auth-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatCardModule, MatIconModule],
})
export class AuthCardComponent {
  /** Card heading, e.g. "Welcome back". */
  readonly title = input.required<string>();

  /** Optional supporting line under the heading. */
  readonly subtitle = input<string>();

  /** Material icon name displayed in the card avatar. */
  readonly icon = input('menu_book');
}
