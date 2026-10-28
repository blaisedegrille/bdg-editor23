import { OutputBlockData, OutputData } from '@editorjs/editorjs';

/** A locally stored article; `publishedAt` marks the copy in Firestore. */
export interface Article {
  id: string;
  title: string;
  content: OutputData;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

/** Values the editor writes when creating or updating an article. */
export interface ArticleInput {
  title: string;
  content: OutputData;
}

const HTML_TAG = /<[^>]*>/g;

function stripHtml(value: string): string {
  return value
    .replace(HTML_TAG, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** List items may be plain strings or nested `{ content, items }` objects. */
function itemText(item: unknown): string {
  if (typeof item === 'string') {
    return stripHtml(item);
  }
  if (item && typeof item === 'object') {
    const record = item as { content?: unknown; items?: unknown };
    const own = typeof record.content === 'string' ? stripHtml(record.content) : '';
    const nested = Array.isArray(record.items)
      ? record.items.map(itemText).join(' ')
      : '';
    return [own, nested].filter(Boolean).join(' ');
  }
  return '';
}

function blockText(block: OutputBlockData): string {
  const data = (block.data ?? {}) as Record<string, unknown>;
  if (typeof data['text'] === 'string') {
    return stripHtml(data['text']);
  }
  if (Array.isArray(data['items'])) {
    return data['items'].map(itemText).join(' ');
  }
  return '';
}

/** Plain text preview built from every Editor.js block. */
export function articleExcerpt(article: Article, maxLength = 160): string {
  const text = (article.content?.blocks ?? [])
    .map(blockText)
    .filter(Boolean)
    .join(' ');
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

export function isArticle(value: unknown): value is Article {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const article = value as Partial<Article>;
  return (
    typeof article.id === 'string' &&
    typeof article.title === 'string' &&
    !!article.content &&
    Array.isArray(article.content.blocks)
  );
}
