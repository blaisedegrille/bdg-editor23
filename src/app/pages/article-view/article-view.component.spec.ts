import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, ParamMap, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';

import { ArticleCloudService } from 'src/app/core/article-cloud.service';
import { AuthService } from 'src/app/core/auth.service';
import { ArticleService } from 'src/app/service/article.service';
import { articleStub } from 'src/app/testing/article.stub';
import { authServiceStub } from 'src/app/testing/auth-service.stub';
import { ArticleViewComponent } from './article-view.component';

describe('ArticleViewComponent', () => {
  let cloud: jasmine.SpyObj<ArticleCloudService>;
  let params: BehaviorSubject<ParamMap>;

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
    params = new BehaviorSubject<ParamMap>(
      convertToParamMap({ id: 'article-1' })
    );

    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        RouterTestingModule,
        ArticleViewComponent,
      ],
      providers: [
        { provide: AuthService, useValue: { ...authServiceStub } },
        { provide: ArticleCloudService, useValue: cloud },
        { provide: ActivatedRoute, useValue: { paramMap: params } },
      ],
    });
  });

  afterEach(() => localStorage.clear());

  async function createComponent(): Promise<ComponentFixture<ArticleViewComponent>> {
    const fixture = TestBed.createComponent(ArticleViewComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    return fixture;
  }

  it('renders the article and its Editor.js blocks', async () => {
    TestBed.inject(ArticleService).restore(
      articleStub({ id: 'article-1', title: 'Readable article' })
    );

    const fixture = await createComponent();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Readable article'
    );
    expect(compiled.querySelector('.article-content h2')?.textContent).toContain(
      'Heading'
    );
    expect(compiled.querySelector('.article-content p')?.textContent).toContain(
      'Hello world'
    );
    expect(compiled.querySelectorAll('.article-content li').length).toBe(2);
    expect(compiled.textContent).toContain('Local draft');
  });

  it('shows an empty state for a missing article', async () => {
    params.next(convertToParamMap({ id: 'missing' }));

    const fixture = await createComponent();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Article not found');
    expect(compiled.querySelector('.article-content')).toBeNull();
  });
});
