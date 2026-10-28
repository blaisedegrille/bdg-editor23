import { TestBed } from '@angular/core/testing';

import { ModeLocalStorageService } from './mode-storage.service';
import { Mode } from './mode-toggle.model';

describe('ModeLocalStorageService', () => {
  let service: ModeLocalStorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [ModeLocalStorageService],
    });
    service = TestBed.inject(ModeLocalStorageService);
  });

  afterEach(() => localStorage.clear());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should persist and read back the mode', () => {
    service.save(Mode.DARK);
    expect(service.get()).toBe(Mode.DARK);
  });
});
