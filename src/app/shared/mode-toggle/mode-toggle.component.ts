import { Component, OnInit } from '@angular/core';
import { ModeToggleService } from './mode-toggle.service';
import { ModeLocalStorageService } from './mode-storage.service';
import { Mode } from './mode-toggle.model';

@Component({
  selector: 'ang23-mode-toggle',
  templateUrl: './mode-toggle.component.html',
  styleUrls: ['./mode-toggle.component.scss'],
})
export class ModeToggleComponent implements OnInit {
  icon_name = 'dark_mode';

  constructor(private modeToggleService: ModeToggleService) {
    this.modeToggleService.modeChanged$.subscribe((mode: Mode) => {
      this.icon_name = mode === Mode.DARK ? 'light_mode' : 'dark_mode';
    });
  }

  ngOnInit(): void {
    console.log('body: ', document.getElementsByTagName('body'));
  }

  toggle() {
    this.modeToggleService.toggleMode();
  }
}
