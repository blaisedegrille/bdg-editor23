import { TestBed } from '@angular/core/testing';

import { AuthService } from '../core/auth.service';
import { articleStub } from '../testing/article.stub';
import { authServiceStub } from '../testing/auth-service.stub';
import { ArticleService } from './article.service';

const STORAGE_PREFIX = 'bdg-editor23.articles.v1';

describe('ArticleService', () => {
  const content = {
    blocks: [{ type: 'paragraph', data: { text: 'Hello world' } }],
  };

  function injectService(userId = 'test-uid'): ArticleService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { ...authServiceStub, userId, userLabel: 'Test User' },
        },
      ],
    });
    return TestBed.inject(ArticleService);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('creates a draft and persists it', () => {
    const service = injectService();
    const article = service.create({ title: ' My first article ', content });

    expect(article.title).toBe('My first article');
    expect(article.publishedAt).toBeNull();
    expect(article.authorId).toBe('test-uid');
    expect(article.authorName).toBe('Test User');
    expect(service.list().length).toBe(1);

    const stored = JSON.parse(
      localStorage.getItem(`${STORAGE_PREFIX}.test-uid`)!
    );
    expect(stored[0].id).toBe(article.id);
  });

  it('updates an existing article without losing its id', () => {
    const service = injectService();
    const article = service.create({ title: 'Draft', content });

    const updated = service.update(article.id, {
      title: 'Renamed',
      content: { blocks: [] },
    });

    expect(updated?.id).toBe(article.id);
    expect(service.get(article.id)?.title).toBe('Renamed');
    expect(service.list().length).toBe(1);
  });

  it('removes and restores an article', () => {
    const service = injectService();
    const article = service.create({ title: 'Draft', content });

    service.remove(article.id);
    expect(service.get(article.id)).toBeUndefined();

    service.restore(article);
    expect(service.get(article.id)?.title).toBe('Draft');
  });

  it('reloads persisted articles in a new service instance', () => {
    const first = injectService();
    first.create({ title: 'Persisted', content });

    const second = injectService();
    second.reload();

    expect(second.list().length).toBe(1);
    expect(second.list()[0].title).toBe('Persisted');
  });

  it('keeps each user articles in a separate store', () => {
    const first = injectService('user-a');
    first.create({ title: 'User A article', content });

    const second = injectService('user-b');
    second.reload();

    expect(second.list().length).toBe(0);
    expect(
      localStorage.getItem(`${STORAGE_PREFIX}.user-a`)
    ).toBeTruthy();
    expect(
      localStorage.getItem(`${STORAGE_PREFIX}.user-b`)
    ).toBeFalsy();
  });

  it('marks an article as published', () => {
    const service = injectService();
    const article = service.create({ title: 'Draft', content });

    const updated = service.markPublished(article.id, '2026-10-28T18:00:00.000Z');

    expect(updated?.publishedAt).toBe('2026-10-28T18:00:00.000Z');
    expect(service.get(article.id)?.publishedAt).toBe(
      '2026-10-28T18:00:00.000Z'
    );
  });

  it('merges cloud articles, keeping the newest version', () => {
    const service = injectService();
    const article = service.create({ title: 'Local', content });

    const older = articleStub({
      id: article.id,
      title: 'Older cloud copy',
      updatedAt: '2020-01-01T00:00:00.000Z',
    });
    const newer = articleStub({
      id: 'cloud-only',
      title: 'Cloud only',
      updatedAt: '2027-01-01T00:00:00.000Z',
    });
    const newerLocal = articleStub({
      id: article.id,
      title: 'Newest cloud copy',
      updatedAt: '2027-02-01T00:00:00.000Z',
    });

    service.mergeCloud([older, newer]);
    expect(service.get(article.id)?.title).toBe('Local');
    expect(service.get('cloud-only')?.title).toBe('Cloud only');

    service.mergeCloud([newerLocal]);
    expect(service.get(article.id)?.title).toBe('Newest cloud copy');
  });

  it('survives a corrupt local store', () => {
    localStorage.setItem(`${STORAGE_PREFIX}.test-uid`, '{not json');
    const service = injectService();

    expect(service.list()).toEqual([]);
  });
});
