import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { articleStub } from 'src/app/testing/article.stub';
import { ArticleComponent } from './article.component';

describe('ArticleComponent', () => {
  let component: ArticleComponent;
  let fixture: ComponentFixture<ArticleComponent>;

  function create(
    overrides = {},
    showDelete = true
  ): ComponentFixture<ArticleComponent> {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, ArticleComponent],
      providers: [provideRouter([])],
    });
    const created = TestBed.createComponent(ArticleComponent);
    created.componentRef.setInput('article', articleStub(overrides));
    created.componentRef.setInput('showDelete', showDelete);
    created.detectChanges();
    return created;
  }

  it('renders the article title, excerpt and draft status', () => {
    fixture = create({ title: 'Card article' });
    component = fixture.componentInstance;
    const compiled = fixture.nativeElement as HTMLElement;

    expect(component).toBeTruthy();
    expect(compiled.querySelector('.article-card__title')?.textContent).toContain(
      'Card article'
    );
    expect(compiled.querySelector('.article-card__excerpt')?.textContent).toContain(
      'Heading Hello world One Two'
    );
    expect(compiled.querySelector('.article-card__status')?.textContent).toContain(
      'Draft'
    );
  });

  it('shows a published badge for published articles', () => {
    fixture = create({ publishedAt: '2026-10-28T18:00:00.000Z' });
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.article-card__status')?.textContent).toContain(
      'Published'
    );
  });

  it('hides the delete action when the card is read-only', () => {
    fixture = create({}, false);
    const compiled = fixture.nativeElement as HTMLElement;

    expect(
      compiled.querySelector('button[aria-label="Delete article"]')
    ).toBeNull();
    expect(compiled.textContent).toContain('Read');
  });

  it('emits the article when delete is clicked', () => {
    fixture = create();
    component = fixture.componentInstance;
    const emitted: unknown[] = [];
    component.remove.subscribe((article) => emitted.push(article));

    const deleteButton = fixture.nativeElement.querySelector(
      'button[aria-label="Delete article"]'
    ) as HTMLButtonElement;
    deleteButton.click();

    expect(emitted.length).toBe(1);
    expect((emitted[0] as { id: string }).id).toBe('article-1');
  });
});
