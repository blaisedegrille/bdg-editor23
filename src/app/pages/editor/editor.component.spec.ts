import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { OutputData } from '@editorjs/editorjs';
import { of } from 'rxjs';

import { ArticleCloudService } from 'src/app/core/article-cloud.service';
import { AuthService } from 'src/app/core/auth.service';
import { ArticleService } from 'src/app/service/article.service';
import { articleStub } from 'src/app/testing/article.stub';
import { authServiceStub } from 'src/app/testing/auth-service.stub';
import { EDITOR_FACTORY, EditorComponent } from './editor.component';

@Component({ selector: 'app-test-host', template: '' })
class TestHostComponent {}

class FakeEditor {
  isReady = Promise.resolve();
  saved: OutputData = {
    blocks: [{ type: 'paragraph', data: { text: 'Saved content' } }],
  };
  rendered: OutputData | null = null;
  cleared = false;
  destroyed = false;

  async save(): Promise<OutputData> {
    return this.saved;
  }

  async render(data: OutputData): Promise<void> {
    this.rendered = data;
  }

  clear(): void {
    this.cleared = true;
  }

  destroy(): void {
    this.destroyed = true;
  }
}

describe('EditorComponent', () => {
  let editor: FakeEditor;
  let cloud: jasmine.SpyObj<ArticleCloudService>;

  function configureModule(): void {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        RouterTestingModule.withRoutes([
          { path: '**', component: TestHostComponent },
        ]),
        EditorComponent,
      ],
      providers: [
        { provide: AuthService, useValue: { ...authServiceStub } },
        { provide: ArticleCloudService, useValue: cloud },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({})) },
        },
        { provide: EDITOR_FACTORY, useValue: () => editor },
      ],
    });
  }

  async function createComponent(): Promise<ComponentFixture<EditorComponent>> {
    const fixture = TestBed.createComponent(EditorComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    localStorage.clear();
    editor = new FakeEditor();
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
    configureModule();
  });

  afterEach(() => localStorage.clear());

  it('should create', async () => {
    const fixture = await createComponent();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('places the save and publish actions below the editor canvas', async () => {
    const fixture = await createComponent();
    const page = fixture.nativeElement.querySelector('.editor-page') as HTMLElement;
    const title = page.querySelector('.editor-page__title');
    const canvas = page.querySelector('.editor-page__canvas');
    const actions = page.querySelector('.editor-page__actions');

    expect(title).not.toBeNull();
    expect(canvas).not.toBeNull();
    expect(actions).not.toBeNull();
    expect(
      canvas!.compareDocumentPosition(actions!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(actions!.querySelectorAll('button').length).toBe(2);
  });

  it('saves the editor content as a local draft', async () => {
    const fixture = await createComponent();
    const component = fixture.componentInstance;

    component.onTitleInput({
      target: { value: 'My first article' },
    } as unknown as Event);
    const article = await component.saveDraft();

    expect(article?.title).toBe('My first article');
    expect(article?.authorId).toBe('test-uid');
    expect(TestBed.inject(ArticleService).list().length).toBe(1);
  });

  it('requires a title before saving', async () => {
    const fixture = await createComponent();
    const component = fixture.componentInstance;

    const article = await component.saveDraft();

    expect(article).toBeNull();
    expect(TestBed.inject(ArticleService).list().length).toBe(0);
  });

  it('loads an existing article into the editor', async () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { paramMap: of(convertToParamMap({ id: 'article-1' })) },
    });
    const article = articleStub({
      id: 'article-1',
      title: 'Existing article',
      content: { blocks: [{ type: 'paragraph', data: { text: 'Existing' } }] },
    });
    TestBed.inject(ArticleService).restore(article);

    const fixture = await createComponent();
    const component = fixture.componentInstance;

    expect(component.title()).toBe('Existing article');
    expect(editor.rendered).toEqual(article.content);
    expect(component.dirty()).toBeFalse();
  });

  it('publishes a saved draft to Firebase', async () => {
    const fixture = await createComponent();
    const component = fixture.componentInstance;
    component.onTitleInput({
      target: { value: 'Publish me' },
    } as unknown as Event);

    await component.publish();

    const article = TestBed.inject(ArticleService).list()[0];
    expect(cloud.publish).toHaveBeenCalledTimes(1);
    expect(cloud.publish.calls.mostRecent().args[0].id).toBe(article.id);
    expect(article.publishedAt).not.toBeNull();
  });

  it('keeps the local draft when publishing fails', async () => {
    spyOn(console, 'error');
    cloud.publish.and.rejectWith(new Error('permission-denied'));
    const fixture = await createComponent();
    const component = fixture.componentInstance;
    component.onTitleInput({
      target: { value: 'Offline draft' },
    } as unknown as Event);

    await component.publish();

    const article = TestBed.inject(ArticleService).list()[0];
    expect(article.title).toBe('Offline draft');
    expect(article.publishedAt).toBeNull();
  });
});
