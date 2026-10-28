import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatButton, MatAnchor } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatButton, MatAnchor, MatDivider]
})
export class HomeComponent {}
