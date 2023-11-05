import { TestBed } from '@angular/core/testing';

import { ModeStorageService } from './mode-storage.service';

describe('ModeStorageService', () => {
  let service: ModeStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModeStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
