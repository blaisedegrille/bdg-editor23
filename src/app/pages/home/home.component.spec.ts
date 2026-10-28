import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { ArticleCloudService } from 'src/app/core/article-cloud.service';
import { AuthService } from 'src/app/core/auth.service';
import { ArticleService } from 'src/app/service/article.service';
import { articleStub } from 'src/app/testing/article.stub';
import { authServiceStub } from 'src/app/testing/auth-service.stub';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let cloud: jasmine.SpyObj<ArticleCloudService>;

  beforeEach(() => {
    localStorage.clear();
    cloud = jasmine.createSpyObj<ArticleCloudService>('ArticleCloudService', [
      'publish',
      'fetchAll',
      'fetchOne',
      'remove',
    ]);
    cloud.publish.and.resolveTo();
    cloud.fetchAll.and.resolveTo([]);
    cloud.fetchOne.and.resolveTo(null);
    cloud.remove.and.resolveTo();

    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, RouterTestingModule, HomeComponent],
      providers: [
        { provide: AuthService, useValue: { ...authServiceStub } },
        { provide: ArticleCloudService, useValue: cloud },
      ],
    });
  });

  afterEach(() => localStorage.clear());

  async function create(): Promise<ComponentFixture<HomeComponent>> {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    return fixture;
  }

  it('greets the signed in user by name', async () => {
    const fixture = await create();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.home__title')?.textContent).toMatch(
      /Good (morning|afternoon|evening), Test User/
    );
    expect(compiled.querySelector('.home__avatar')?.textContent).toContain('TU');
  });

  it('shows the quick actions', async () => {
    const fixture = await create();
    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll('a')).map((link) =>
      link.textContent?.trim()
    );

    expect(links.some((label) => label?.includes('New article'))).toBeTrue();
    expect(
      links.some((label) => label?.includes('Manage articles'))
    ).toBeTrue();
  });

  it('lists the local drafts without a delete action', async () => {
    TestBed.inject(ArticleService).restore(
      articleStub({ id: 'local-article', title: 'Home article' })
    );

    const fixture = await create();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('app-article').length).toBe(1);
    expect(compiled.textContent).toContain('Home article');
    expect(compiled.querySelector('button[aria-label="Delete article"]')).toBeNull();
  });

  it('merges articles published on another device', async () => {
    cloud.fetchAll.and.resolveTo([
      articleStub({
        id: 'cloud-article',
        title: 'From the cloud',
        publishedAt: '2026-10-28T18:00:00.000Z',
      }),
    ]);

    const fixture = await create();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('From the cloud');
    expect(compiled.querySelector('.home__stats')?.textContent).toContain(
      'Published'
    );
  });

  it('shows article statistics', async () => {
    const articles = TestBed.inject(ArticleService);
    articles.restore(articleStub({ id: 'draft', publishedAt: null }));
    articles.restore(
      articleStub({
        id: 'published',
        publishedAt: '2026-10-28T18:00:00.000Z',
      })
    );

    const fixture = await create();
    const compiled = fixture.nativeElement as HTMLElement;
    const stats = compiled.querySelectorAll('.home__stat-value');

    expect(Array.from(stats).map((stat) => stat.textContent?.trim())).toEqual([
      '2',
      '1',
      '1',
    ]);
  });

  it('shows an empty state when there are no articles', async () => {
    const fixture = await create();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('No articles yet');
    expect(compiled.querySelector('.home__grid')).toBeNull();
  });
});
