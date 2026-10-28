import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDrawer } from '@angular/material/sidenav';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { AppComponent } from './app.component';
import { AuthService } from './core/auth.service';
import { UserPreferencesService } from './core/user-preferences.service';
import {
  MODE_STORAGE_SERVICE,
  ModeLocalStorageService,
} from './shared/mode-toggle/mode-storage.service';
import { ModeToggleService } from './shared/mode-toggle/mode-toggle.service';
import { authServiceStub } from './testing/auth-service.stub';

describe('AppComponent', () => {
  let signOutSpy: jasmine.Spy<AuthService['SignOut']>;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('bdg-editor23.language.v1', 'en');
    signOutSpy = jasmine.createSpy('SignOut').and.resolveTo();
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, NoopAnimationsModule, AppComponent],
      providers: [
        ModeToggleService,
        { provide: MODE_STORAGE_SERVICE, useClass: ModeLocalStorageService },
        {
          provide: AuthService,
          useValue: { ...authServiceStub, SignOut: signOutSpy },
        },
        // The real service talks to Firestore; the shell only needs it alive.
        { provide: UserPreferencesService, useValue: {} },
      ],
    });
  });

  afterEach(() => localStorage.clear());

  function createApp(): ComponentFixture<AppComponent> {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'bdg-editor23'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('bdg-editor23');
  });

  it('should render the app title', () => {
    const compiled = createApp().nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-brand__title')?.textContent).toContain(
      'bdg-editor23'
    );
  });

  it('should render one navigation entry per component', () => {
    const compiled = createApp().nativeElement as HTMLElement;
    const labels = Array.from(
      compiled.querySelectorAll('mat-list-item .mat-mdc-list-item-title')
    ).map((element) => element.textContent?.trim());

    expect(labels).toEqual(['Home', 'Editor', 'Articles']);
  });

  it('should show the signed in user in the header', () => {
    const compiled = createApp().nativeElement as HTMLElement;

    expect(compiled.querySelector('.app-user__name')?.textContent).toContain(
      'Test User'
    );
    expect(compiled.querySelector('.app-user__avatar')?.textContent).toContain(
      'TU'
    );
  });

  it('should link the header identity to the profile page', () => {
    const compiled = createApp().nativeElement as HTMLElement;
    const profileLink = compiled.querySelector('a.app-user');

    expect(profileLink?.getAttribute('href')).toBe('/profile');
    expect(profileLink?.getAttribute('aria-label')).toContain('Test User');
  });

  it('should hide the user block when signed out', () => {
    TestBed.overrideProvider(AuthService, {
      useValue: {
        ...authServiceStub,
        userData: null,
        userId: null,
        userLabel: '',
      },
    });
    const compiled = createApp().nativeElement as HTMLElement;

    expect(compiled.querySelector('.app-user')).toBeNull();
    expect(compiled.querySelector('.app-toolbar__logout')).toBeNull();
  });

  it('should sign out from the header button', () => {
    const compiled = createApp().nativeElement as HTMLElement;
    const logout = compiled.querySelector(
      '.app-toolbar__logout'
    ) as HTMLButtonElement;

    logout.click();

    expect(signOutSpy).toHaveBeenCalledTimes(1);
  });

  it('closes the navigation drawer after selecting an entry', () => {
    const fixture = createApp();
    const drawer = fixture.debugElement.query(By.directive(MatDrawer))
      .componentInstance as MatDrawer;
    const compiled = fixture.nativeElement as HTMLElement;

    drawer.open();
    fixture.detectChanges();
    expect(drawer.opened).toBeTrue();

    (compiled.querySelector('mat-list-item') as HTMLElement).click();
    fixture.detectChanges();

    expect(drawer.opened).toBeFalse();
  });
});
