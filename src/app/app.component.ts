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
    { name: 'Dashboard', route: 'dashboard' },
    { name: 'Editor', route: 'editor' },
    { name: 'User', route: 'user' },
    { name: 'Settings', route: 'settings' },
  ];
}
