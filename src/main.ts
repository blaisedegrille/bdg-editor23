import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeHu from '@angular/common/locales/hu';
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

registerLocaleData(localeDe, 'de');
registerLocaleData(localeHu, 'hu');

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
