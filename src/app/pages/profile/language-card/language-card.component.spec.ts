import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { I18nService } from 'src/app/core/i18n/i18n.service';
import { UserPreferencesService } from 'src/app/core/user-preferences.service';
import { LanguageCardComponent } from './language-card.component';

describe('LanguageCardComponent', () => {
  let component: LanguageCardComponent;
  let fixture: ComponentFixture<LanguageCardComponent>;
  let setLanguage: jasmine.Spy<UserPreferencesService['setLanguage']>;

  beforeEach(() => {
    localStorage.clear();
    setLanguage = jasmine
      .createSpy('setLanguage')
      .and.resolveTo(true);

    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, LanguageCardComponent],
      providers: [
        { provide: UserPreferencesService, useValue: { setLanguage } },
      ],
    });
    TestBed.inject(I18nService).setLanguage('en');

    fixture = TestBed.createComponent(LanguageCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('offers English, German and Hungarian', () => {
    expect(component.languages).toEqual([
      { code: 'en', name: 'English' },
      { code: 'de', name: 'Deutsch' },
      { code: 'hu', name: 'Magyar' },
    ]);
  });

  it('delegates the selection to the preferences service', async () => {
    await component.selectLanguage('de');

    expect(setLanguage).toHaveBeenCalledWith('de');
  });

  it('mentions offline syncing when the account update fails', async () => {
    const open = spyOn(component['snackBar'], 'open');
    setLanguage.and.resolveTo(false);

    await component.selectLanguage('de');

    expect(open).toHaveBeenCalledWith(
      'Language saved on this device. It will sync when you\'re online.',
      'Dismiss',
      jasmine.anything()
    );
  });
});
