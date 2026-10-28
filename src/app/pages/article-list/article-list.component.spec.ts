import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { ArticleCloudService } from 'src/app/core/article-cloud.service';
import { AuthService } from 'src/app/core/auth.service';
import { ArticleService } from 'src/app/service/article.service';
import { articleStub } from 'src/app/testing/article.stub';
import { authServiceStub } from 'src/app/testing/auth-service.stub';
import { ArticleListComponent } from './article-list.component';

describe('ArticleListComponent', () => {
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
      imports: [NoopAnimationsModule, ArticleListComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { ...authServiceStub } },
        { provide: ArticleCloudService, useValue: cloud },
      ],
    });
  });

  afterEach(() => localStorage.clear());

  async function createComponent(): Promise<ComponentFixture<ArticleListComponent>> {
    const fixture = TestBed.createComponent(ArticleListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    return fixture;
  }

  it('renders the local drafts', async () => {
    TestBed.inject(ArticleService).create({
      title: 'First article',
      content: articleStub().content,
    });

    const fixture = await createComponent();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('app-article').length).toBe(1);
    expect(compiled.textContent).toContain('First article');
    expect(compiled.textContent).toContain('Draft');
  });

  it('shows an empty state when there are no articles', async () => {
    const fixture = await createComponent();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('app-article').length).toBe(0);
    expect(compiled.textContent).toContain('No articles yet');
  });

  it('merges articles published on another device', async () => {
    cloud.fetchAll.and.resolveTo([
      articleStub({
        id: 'cloud-article',
        title: 'From the cloud',
        publishedAt: '2026-10-28T18:00:00.000Z',
      }),
    ]);

    const fixture = await createComponent();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('From the cloud');
    expect(compiled.textContent).toContain('Published');
  });

  it('deletes an article locally', async () => {
    const articleService = TestBed.inject(ArticleService);
    const article = articleService.create({
      title: 'Delete me',
      content: articleStub().content,
    });

    const fixture = await createComponent();
    fixture.componentInstance.remove(article);
    fixture.detectChanges();

    expect(articleService.list().length).toBe(0);
    expect(
      (fixture.nativeElement as HTMLElement).textContent
    ).toContain('No articles yet');
  });
});
