import { TestBed } from '@angular/core/testing';

import {
  MODE_STORAGE_SERVICE,
  ModeLocalStorageService,
} from './mode-storage.service';
import { ModeToggleService } from './mode-toggle.service';

describe('ModeToggleService', () => {
  let service: ModeToggleService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        ModeToggleService,
        { provide: MODE_STORAGE_SERVICE, useClass: ModeLocalStorageService },
      ],
    });
    service = TestBed.inject(ModeToggleService);
  });

  afterEach(() => localStorage.clear());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should switch between light and dark mode', () => {
    const initial = service.getCurrentMode();
    service.toggleMode();
    expect(service.getCurrentMode()).not.toBe(initial);
  });
});
