import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { I18nService } from './i18n/i18n.service';
import { UserPreferencesService } from './user-preferences.service';
import { UserProfileCloudService } from './user-profile-cloud.service';

describe('UserPreferencesService', () => {
  const userState = signal<{ uid: string } | null>(null);
  const authStub = {
    authState: userState.asReadonly(),
    get userId(): string | null {
      return userState()?.uid ?? null;
    },
  };

  let service: UserPreferencesService;
  let i18n: I18nService;
  let loadLanguage: jasmine.Spy<
    UserProfileCloudService['loadLanguage']
  >;
  let saveLanguage: jasmine.Spy<
    UserProfileCloudService['saveLanguage']
  >;

  beforeEach(() => {
    localStorage.clear();
    userState.set(null);
    loadLanguage = jasmine
      .createSpy('loadLanguage')
      .and.resolveTo(null);
    saveLanguage = jasmine.createSpy('saveLanguage').and.resolveTo();

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authStub },
        {
          provide: UserProfileCloudService,
          useValue: { loadLanguage, saveLanguage },
        },
      ],
    });
    i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en');
    service = TestBed.inject(UserPreferencesService);
  });

  afterEach(() => localStorage.clear());

  it('applies the language locally even when signed out', async () => {
    const synced = await service.setLanguage('de');

    expect(synced).toBeTrue();
    expect(i18n.language()).toBe('de');
    expect(saveLanguage).not.toHaveBeenCalled();
  });

  it('mirrors the choice to the signed in account', async () => {
    userState.set({ uid: 'test-uid' });

    const synced = await service.setLanguage('hu');

    expect(synced).toBeTrue();
    expect(saveLanguage).toHaveBeenCalledWith('test-uid', 'hu');
  });

  it('keeps the local choice when the remote write fails', async () => {
    userState.set({ uid: 'test-uid' });
    saveLanguage.and.rejectWith(new Error('offline'));

    const synced = await service.setLanguage('de');

    expect(synced).toBeFalse();
    expect(i18n.language()).toBe('de');
    expect(localStorage.getItem('bdg-editor23.language.v1')).toBe('de');
  });

  it('loads the account language when the user signs in', async () => {
    userState.set({ uid: 'test-uid' });
    loadLanguage.and.resolveTo('hu');

    // Effects run during change detection, not on service creation.
    TestBed.tick();
    await Promise.resolve();
    await Promise.resolve();

    expect(loadLanguage).toHaveBeenCalledWith('test-uid');
    expect(i18n.language()).toBe('hu');
  });

  it('stores the current choice when the account has no language yet', async () => {
    userState.set({ uid: 'test-uid' });
    loadLanguage.and.resolveTo(null);

    TestBed.tick();
    await Promise.resolve();
    await Promise.resolve();

    expect(saveLanguage).toHaveBeenCalledWith('test-uid', 'en');
  });
});
