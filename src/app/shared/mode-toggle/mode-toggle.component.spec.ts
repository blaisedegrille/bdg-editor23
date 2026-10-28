import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ModeToggleComponent } from './mode-toggle.component';
import {
  MODE_STORAGE_SERVICE,
  ModeLocalStorageService,
} from './mode-storage.service';
import { ModeToggleService } from './mode-toggle.service';

describe('ModeToggleComponent', () => {
  let component: ModeToggleComponent;
  let fixture: ComponentFixture<ModeToggleComponent>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [MatIconModule, NoopAnimationsModule],
      declarations: [ModeToggleComponent],
      providers: [
        ModeToggleService,
        { provide: MODE_STORAGE_SERVICE, useClass: ModeLocalStorageService },
      ],
    });
    fixture = TestBed.createComponent(ModeToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
