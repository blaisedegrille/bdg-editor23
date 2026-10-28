import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {
  MatListItem,
  MatListItemIcon,
  MatListItemTitle,
  MatNavList,
} from '@angular/material/list';
import { MatDrawer, MatDrawerContainer } from '@angular/material/sidenav';
import { MatToolbar } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth.service';
import { UserPreferencesService } from './core/user-preferences.service';
import { userInitials as toInitials } from './core/user-display';
import { Menu } from './models/menu';
import { ModeToggleComponent } from './shared/mode-toggle/mode-toggle.component';
import { TranslatePipe } from './shared/translate.pipe';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatToolbar,
    MatIconButton,
    MatIcon,
    MatTooltip,
    ModeToggleComponent,
    MatDrawerContainer,
    MatDrawer,
    MatNavList,
    MatListItem,
    MatListItemIcon,
    MatListItemTitle,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TranslatePipe,
  ],
})
export class AppComponent {
  readonly authService = inject(AuthService);

  title = 'bdg-editor23';
  componentList: Menu[] = [
    { labelKey: 'app.nav.home', route: 'home', icon: 'home' },
    { labelKey: 'app.nav.editor', route: 'editor', icon: 'edit_note' },
    { labelKey: 'app.nav.articles', route: 'articles', icon: 'article' },
    /*     { name: 'User', route: 'user', locked: true },
    { name: 'Settings', route: 'settings', locked: true }, */
  ];

  constructor() {
    // Starts the account language sync even when the profile is never opened.
    inject(UserPreferencesService);
  }

  /** Best available label for the signed in user. */
  get userName(): string {
    return this.authService.userLabel;
  }

  /** One or two uppercase letters for the avatar placeholder. */
  get userInitials(): string {
    return toInitials(this.userName);
  }

  async signOut(): Promise<void> {
    await this.authService.SignOut();
  }
}
