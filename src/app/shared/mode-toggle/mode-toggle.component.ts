import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ModeToggleService } from './mode-toggle.service';
import { ModeLocalStorageService } from './mode-storage.service';
import { Mode } from './mode-toggle.model';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'ang23-mode-toggle',
  templateUrl: './mode-toggle.component.html',
  styleUrls: ['./mode-toggle.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatIconButton, MatIcon]
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
