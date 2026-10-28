import { Article } from '../models/article';

/** Builds an article with valid Editor.js content for specs. */
export function articleStub(overrides: Partial<Article> = {}): Article {
  return {
    id: 'article-1',
    title: 'Test article',
    content: {
      time: 1700000000000,
      blocks: [
        { id: 'block-1', type: 'header', data: { text: 'Heading', level: 2 } },
        {
          id: 'block-2',
          type: 'paragraph',
          data: { text: 'Hello <b>world</b>' },
        },
        {
          id: 'block-3',
          type: 'list',
          data: { style: 'unordered', items: ['One', 'Two'] },
        },
      ],
    },
    authorId: 'test-uid',
    authorName: 'Test User',
    createdAt: '2024-01-15T10:30:00.000Z',
    updatedAt: '2026-10-28T18:00:00.000Z',
    publishedAt: null,
    ...overrides,
  };
}
