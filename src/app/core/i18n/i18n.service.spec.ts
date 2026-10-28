import { TestBed } from '@angular/core/testing';

import { I18nService } from './i18n.service';
import { TranslationKey } from './translations/en';

const STORAGE_KEY = 'bdg-editor23.language.v1';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(I18nService);
  });

  afterEach(() => localStorage.clear());

  it('translates the active language', () => {
    service.setLanguage('de');

    expect(service.t('editor.save')).toBe('Entwurf speichern');
    expect(service.locale()).toBe('de');
  });

  it('switches between all supported languages', () => {
    service.setLanguage('hu');
    expect(service.t('app.nav.home')).toBe('Kezdőlap');

    service.setLanguage('en');
    expect(service.t('app.nav.home')).toBe('Home');
  });

  it('interpolates named parameters', () => {
    service.setLanguage('en');

    expect(service.t('app.profile.aria', { name: 'Jane' })).toBe(
      'Open profile for Jane'
    );
  });

  it('persists the language and updates the document language', () => {
    service.setLanguage('de');

    expect(localStorage.getItem(STORAGE_KEY)).toBe('de');
    expect(document.documentElement.lang).toBe('de');
  });

  it('falls back to the English source when a key is missing', () => {
    service.setLanguage('en');

    expect(service.t('missing.key' as TranslationKey)).toBe('missing.key');
  });
});
