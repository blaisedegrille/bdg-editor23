import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ModeToggleService } from './mode-toggle.service';
import { ModeLocalStorageService } from './mode-storage.service';
import { Mode } from './mode-toggle.model';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from 'src/app/shared/translate.pipe';

@Component({
  selector: 'ang23-mode-toggle',
  templateUrl: './mode-toggle.component.html',
  styleUrls: ['./mode-toggle.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatIconButton, MatIcon, TranslatePipe]
})
export class ModeToggleComponent {
  icon_name = 'dark_mode';

  constructor(private modeToggleService: ModeToggleService) {
    this.modeToggleService.modeChanged$.subscribe((mode: Mode) => {
      this.icon_name = mode === Mode.DARK ? 'light_mode' : 'dark_mode';
    });
  }

  toggle() {
    this.modeToggleService.toggleMode();
  }
}
