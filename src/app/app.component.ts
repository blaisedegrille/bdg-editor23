import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Menu } from './models/menu';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ModeToggleComponent } from './shared/mode-toggle/mode-toggle.component';
import { MatDrawerContainer, MatDrawer } from '@angular/material/sidenav';
import { MatNavList, MatListItem } from '@angular/material/list';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatToolbar, MatIconButton, MatIcon, ModeToggleComponent, MatDrawerContainer, MatDrawer, MatNavList, MatListItem, RouterLink, RouterOutlet]
})
export class AppComponent {
  title = 'bdg-editor23';
  componentList: Menu[] = [
    { name: 'Home', route: 'home' },
    { name: 'Editor', route: 'editor' },
    { name: 'Articles', route: 'articles' },
    /*     { name: 'Dashboard', route: 'dashboard', locked: true },
    { name: 'User', route: 'user', locked: true },
    { name: 'Settings', route: 'settings', locked: true }, */
  ];
}
