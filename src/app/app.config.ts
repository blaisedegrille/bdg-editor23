import {
  ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {
  MODE_STORAGE_SERVICE,
  ModeLocalStorageService,
} from './shared/mode-toggle/mode-storage.service';
import { ModeToggleService } from './shared/mode-toggle/mode-toggle.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // Keeps the change detection behaviour the app had with NgModule bootstrap.
    provideZoneChangeDetection(),
    provideRouter(routes),
    provideAnimationsAsync(),
    ModeToggleService,
    {
      provide: MODE_STORAGE_SERVICE,
      useClass: ModeLocalStorageService,
    },
  ],
};
