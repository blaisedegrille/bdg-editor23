import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from 'src/app/core/auth.service';
import { ArticleService } from 'src/app/service/article.service';
import { articleStub } from 'src/app/testing/article.stub';
import { authServiceStub } from 'src/app/testing/auth-service.stub';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, NoopAnimationsModule, ProfileComponent],
      providers: [{ provide: AuthService, useValue: { ...authServiceStub } }],
    });
  });

  afterEach(() => localStorage.clear());

  function create(): ComponentFixture<ProfileComponent> {
    const created = TestBed.createComponent(ProfileComponent);
    created.detectChanges();
    return created;
  }

  it('should create', () => {
    fixture = create();
    component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('shows the signed in user profile', () => {
    fixture = create();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.profile__title')?.textContent).toContain(
      'Test User'
    );
    expect(compiled.querySelector('.profile__email')?.textContent).toContain(
      'test@example.com'
    );
    expect(compiled.querySelector('.profile__status')?.textContent).toContain(
      'Email verified'
    );
  });

  it('shows account details from the Firebase user', () => {
    fixture = create();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Email and password');
    expect(compiled.textContent).toContain('Jan 15, 2024');
    expect(compiled.textContent).toContain('test-uid');
  });

  it('counts drafts and published articles', () => {
    const articles = TestBed.inject(ArticleService);
    articles.restore(articleStub({ id: 'draft', publishedAt: null }));
    articles.restore(
      articleStub({
        id: 'published',
        publishedAt: '2026-10-28T18:00:00.000Z',
      })
    );

    fixture = create();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('.profile__stat').length).toBe(3);
    expect(compiled.querySelector('.profile__stats')?.textContent).toContain(
      '2'
    );
    expect(compiled.querySelector('.profile__stats')?.textContent).toContain(
      'Published'
    );
  });

  it('shows the signed out state without a user', () => {
    TestBed.overrideProvider(AuthService, {
      useValue: { ...authServiceStub, userData: null, userId: null, userLabel: '' },
    });

    fixture = create();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('You are not signed in');
    expect(compiled.querySelector('.profile__hero')).toBeNull();
  });
});
