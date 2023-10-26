import { Component } from '@angular/core';
import { Menu } from './models/menu';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'bdg-editor23';
  componentList: Menu[] = [
    { name: 'Home', route: 'home' },
    { name: 'Editor', route: 'editor' },
    { name: 'Dashboard', route: 'dashboard', locked: true },
    { name: 'User', route: 'user', locked: true },
    { name: 'Settings', route: 'settings', locked: true },
  ];
}
