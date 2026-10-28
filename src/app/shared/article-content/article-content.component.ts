import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { OutputBlockData } from '@editorjs/editorjs';

import { Article } from 'src/app/models/article';

function blockData(block: OutputBlockData): Record<string, unknown> {
  return (block.data ?? {}) as Record<string, unknown>;
}

/** Read-only renderer for the block types the editor can produce. */
@Component({
  selector: 'app-article-content',
  templateUrl: './article-content.component.html',
  styleUrls: ['./article-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ArticleContentComponent {
  readonly article = input.required<Article>();

  readonly blocks = computed(() => this.article().content?.blocks ?? []);

  text(block: OutputBlockData): string {
    const value = blockData(block)['text'];
    return typeof value === 'string' ? value : '';
  }

  caption(block: OutputBlockData): string {
    const value = blockData(block)['caption'];
    return typeof value === 'string' ? value : '';
  }

  level(block: OutputBlockData): number {
    const value = Number(blockData(block)['level']);
    return Number.isFinite(value) ? value : 2;
  }

  style(block: OutputBlockData): string {
    const value = blockData(block)['style'];
    return typeof value === 'string' ? value : 'unordered';
  }

  items(block: OutputBlockData): unknown[] {
    const value = blockData(block)['items'];
    return Array.isArray(value) ? value : [];
  }

  /** Lists may contain nested `{ content, items }` entries. */
  itemText(item: unknown): string {
    if (typeof item === 'string') {
      return item;
    }
    if (item && typeof item === 'object') {
      const record = item as { content?: unknown; items?: unknown };
      const own = typeof record.content === 'string' ? record.content : '';
      const nested = Array.isArray(record.items)
        ? record.items.map((entry) => this.itemText(entry)).join(' ')
        : '';
      return [own, nested].filter(Boolean).join(' ');
    }
    return '';
  }
}
