import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModeToggleComponent } from './mode-toggle.component';
import {
  MODE_STORAGE_SERVICE,
  ModeLocalStorageService,
} from './mode-storage.service';
import { ModeToggleService } from './mode-toggle.service';
import { MaterialModule } from '../material.module';

@NgModule({
  declarations: [ModeToggleComponent],
  imports: [CommonModule, MaterialModule],
  providers: [
    ModeToggleService,
    {
      provide: MODE_STORAGE_SERVICE,
      useClass: ModeLocalStorageService,
    },
  ],
  exports: [ModeToggleComponent],
})
export class ModeToggleModule {}
