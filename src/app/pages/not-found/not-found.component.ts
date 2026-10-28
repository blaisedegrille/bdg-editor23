import { Component, ChangeDetectionStrategy } from '@angular/core';

import { TranslatePipe } from 'src/app/shared/translate.pipe';

@Component({
  selector: 'ang23-not-found',
  templateUrl: './not-found.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./not-found.component.scss'],
  imports: [TranslatePipe],
})
export class NotFoundComponent {}
