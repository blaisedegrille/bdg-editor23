import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Language } from 'src/app/core/i18n/language';
import { LanguageFlagComponent } from './language-flag.component';

describe('LanguageFlagComponent', () => {
  let fixture: ComponentFixture<LanguageFlagComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LanguageFlagComponent);
  });

  function render(code: Language): HTMLElement {
    fixture.componentRef.setInput('code', code);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders a flag for every supported language', () => {
    for (const code of ['en', 'de', 'hu'] as Language[]) {
      const compiled = render(code);
      expect(compiled.querySelector('svg')).not.toBeNull();
      expect(
        compiled.querySelectorAll('svg rect, svg path').length
      ).toBeGreaterThan(0);
    }
  });

  it('is hidden from assistive technology', () => {
    const compiled = render('de');

    expect(compiled.getAttribute('aria-hidden')).toBe('true');
    expect(compiled.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
      'true'
    );
  });
});
