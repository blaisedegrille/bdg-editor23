import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  Renderer2,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatProgressBar } from '@angular/material/progress-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { PdfTextExtractionService } from '../../core/pdf-text-extraction.service';
import { ReadingCloudService } from '../../core/reading-cloud.service';
import { ReadingLibraryService } from '../../core/reading-library.service';
import {
  ExtractedTextBlock,
  ExtractedTextDocument,
  ReadingDocument,
  ReadingNote,
  TextHighlight,
} from '../../models/reading-document';
import { TranslatePipe } from '../../shared/translate.pipe';

const MAX_PDF_BYTES = 50 * 1024 * 1024;
const DEFAULT_HIGHLIGHT_COLOR = '#ffe05a';

interface SearchHit {
  pageIndex: number;
  startOffset: number;
  endOffset: number;
}

interface SelectedPassage {
  quote: string;
  pageIndex: number;
  startOffset: number;
  endOffset: number;
  menuX: number;
  menuY: number;
}

interface RenderedSegment {
  text: string;
  startOffset: number;
  endOffset: number;
  highlightColor: string | null;
  searchMatch: boolean;
}

interface RenderedBlock extends ExtractedTextBlock {
  segments: RenderedSegment[];
}

@Component({
  selector: 'app-read-text',
  templateUrl: './read-text.component.html',
  styleUrl: './read-text.component.scss',
  imports: [
    MatButton,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatInput,
    MatLabel,
    MatProgressBar,
    RouterLink,
    TranslatePipe,
  ],
})
export class ReadTextComponent implements AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly library = inject(ReadingLibraryService);
  private readonly cloud = inject(ReadingCloudService);
  private readonly extractor = inject(PdfTextExtractionService);
  private readonly renderer = inject(Renderer2);
  private readonly zone = inject(NgZone);
  private readonly host = inject(ElementRef<HTMLElement>);
  private stopSelectionListener?: () => void;
  private stopClickListener?: () => void;
  private searchGeneration = 0;

  readonly i18n = inject(I18nService);
  readonly documents = signal<ReadingDocument[]>([]);
  readonly activeDocument = signal<ReadingDocument | null>(null);
  readonly pendingFile = signal<File | null>(null);
  readonly extractedDocument = signal<ExtractedTextDocument | null>(null);
  readonly currentPage = signal(1);
  readonly textScale = signal(1);
  readonly notes = signal<ReadingNote[]>([]);
  readonly highlights = signal<TextHighlight[]>([]);
  readonly selectedPassage = signal<SelectedPassage | null>(null);
  readonly noteEditorOpen = signal(false);
  readonly noteKind = signal<'note' | 'comment'>('note');
  readonly noteBody = signal('');
  readonly editingNote = signal<ReadingNote | null>(null);
  readonly searchTerm = signal('');
  readonly searchHits = signal<SearchHit[]>([]);
  readonly searchHitIndex = signal(0);
  readonly searchProgress = signal<number | null>(null);
  readonly uploadProgress = signal<number | null>(null);
  readonly extractionProgress = signal<number | null>(null);
  readonly loadingDocument = signal(false);
  readonly errorKey = signal<string | null>(null);
  readonly statusKey = signal<string | null>(null);
  readonly searching = signal(false);

  readonly currentPageData = computed(
    () => this.extractedDocument()?.pages[this.currentPage() - 1] ?? null,
  );
  readonly renderedBlocks = computed(() => this.createRenderedBlocks());

  constructor() {
    void this.refreshDocuments().then(() => {
      const documentId = this.route.snapshot.queryParamMap.get('documentId');
      const document = this.documents().find((item) => item.id === documentId);
      if (document) void this.openDocument(document);
    });
  }

  ngAfterViewInit(): void {
    this.stopSelectionListener = this.renderer.listen(
      'document',
      'selectionchange',
      () => this.captureSelection(),
    );
    this.stopClickListener = this.renderer.listen(
      'document',
      'click',
      (event: MouseEvent) => {
        const target = event.target instanceof Element ? event.target : null;
        if (target?.closest('.text-reader-selection-actions, .text-reader-note-editor')) return;
        if (!target?.closest('.text-reader-content')) this.selectedPassage.set(null);
      },
    );
  }

  ngOnDestroy(): void {
    this.stopSelectionListener?.();
    this.stopClickListener?.();
    this.searchGeneration++;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    this.setPendingFile(file);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.setPendingFile(event.dataTransfer?.files[0] ?? null);
  }

  openPendingLocally(): void {
    const file = this.pendingFile();
    if (file) void this.createLocalDocument(file);
  }

  async uploadPendingToCloud(): Promise<void> {
    const file = this.pendingFile();
    if (!file) return;
    this.errorKey.set(null);
    this.statusKey.set(null);
    this.uploadProgress.set(0);
    try {
      const document = await this.cloud.uploadDocument(
        this.ownerId(),
        crypto.randomUUID(),
        file,
        (progress) => this.zone.run(() => this.uploadProgress.set(progress)),
      );
      await this.library.saveDocument(document, file);
      this.addOrReplaceDocument(document);
      this.pendingFile.set(null);
      await this.openDocument(document);
    } catch {
      this.errorKey.set('reader.uploadFailed');
    } finally {
      this.uploadProgress.set(null);
    }
  }

  async openDocument(document: ReadingDocument): Promise<void> {
    this.loadingDocument.set(true);
    this.errorKey.set(null);
    this.statusKey.set(null);
    this.clearActiveContent();
    try {
      let file = await this.library.getFile(document.id);
      if (!file && document.storageMode === 'cloud') {
        file = await this.cloud.downloadDocument(document);
        await this.library.saveDocument(document, file);
      }
      if (!file) {
        this.errorKey.set('reader.storageFailed');
        return;
      }

      const opened = { ...document, lastOpenedAt: new Date().toISOString() };
      await this.library.saveDocument(opened, file);
      this.activeDocument.set(opened);
      this.addOrReplaceDocument(opened);
      await this.loadSharedData(opened);

      let extracted = await this.library.getExtractedText(opened.id);
      if (!extracted) {
        this.extractionProgress.set(0);
        extracted = await this.extractor.extract(file, opened.id, (percent) => {
          this.zone.run(() => this.extractionProgress.set(percent));
        });
        await this.library.saveExtractedText(extracted);
      }
      this.extractedDocument.set(extracted);
      this.currentPage.set(1);
      if (!extracted.pages.some((page) => page.text.trim())) {
        this.errorKey.set('textReader.noText');
      }
      if (opened.storageMode === 'cloud') {
        void this.cloud.updateLastOpened(opened).catch(() => undefined);
      }
    } catch {
      this.errorKey.set('textReader.extractionFailed');
    } finally {
      this.loadingDocument.set(false);
      this.extractionProgress.set(null);
    }
  }

  closeDocument(): void {
    this.clearActiveContent();
  }

  async deleteDocument(document: ReadingDocument): Promise<void> {
    if (!globalThis.confirm(this.i18n.t('reader.deleteConfirm'))) return;
    try {
      if (document.storageMode === 'cloud') await this.cloud.deleteDocument(document);
      await this.library.deleteDocument(document.id);
      this.documents.update((items) => items.filter((item) => item.id !== document.id));
      if (this.activeDocument()?.id === document.id) this.closeDocument();
    } catch {
      this.errorKey.set('reader.deleteFailed');
    }
  }

  changePage(delta: number): void {
    const total = this.extractedDocument()?.pages.length ?? 0;
    this.currentPage.update((page) => Math.max(1, Math.min(total, page + delta)));
    this.selectedPassage.set(null);
  }

  changeTextSize(delta: number): void {
    this.textScale.update((scale) => Math.max(0.85, Math.min(1.6, scale + delta)));
  }

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  async searchDocument(): Promise<void> {
    const document = this.extractedDocument();
    const query = this.searchTerm().trim().toLocaleLowerCase();
    if (!document || !query) {
      this.searchHits.set([]);
      this.searchProgress.set(null);
      return;
    }
    const generation = ++this.searchGeneration;
    this.searching.set(true);
    this.searchProgress.set(0);
    const hits: SearchHit[] = [];
    try {
      for (let pageIndex = 0; pageIndex < document.pages.length; pageIndex++) {
        if (generation !== this.searchGeneration) return;
        const text = document.pages[pageIndex].text.toLocaleLowerCase();
        let offset = 0;
        while ((offset = text.indexOf(query, offset)) !== -1) {
          hits.push({ pageIndex, startOffset: offset, endOffset: offset + query.length });
          offset += Math.max(1, query.length);
        }
        this.searchProgress.set(Math.round(((pageIndex + 1) / document.pages.length) * 100));
        if (pageIndex % 20 === 19) {
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        }
      }
      if (generation !== this.searchGeneration) return;
      this.searchHits.set(hits);
      this.searchHitIndex.set(0);
      if (hits.length) this.currentPage.set(hits[0].pageIndex + 1);
    } finally {
      if (generation === this.searchGeneration) {
        this.searching.set(false);
        this.searchProgress.set(null);
      }
    }
  }

  changeSearchHit(delta: number): void {
    const hits = this.searchHits();
    if (!hits.length) return;
    const index = (this.searchHitIndex() + delta + hits.length) % hits.length;
    this.searchHitIndex.set(index);
    this.currentPage.set(hits[index].pageIndex + 1);
  }

  searchSelection(): void {
    const passage = this.selectedPassage();
    if (!passage) return;
    this.searchTerm.set(passage.quote);
    this.selectedPassage.set(null);
    void this.searchDocument();
  }

  async copySelection(): Promise<void> {
    const passage = this.selectedPassage();
    if (!passage) return;
    try {
      await navigator.clipboard.writeText(passage.quote);
      this.statusKey.set('reader.copied');
      this.selectedPassage.set(null);
    } catch {
      this.errorKey.set('reader.copyFailed');
    }
  }

  async highlightSelection(): Promise<void> {
    const passage = this.selectedPassage();
    const document = this.activeDocument();
    if (!passage || !document) return;
    const now = new Date().toISOString();
    const highlight: TextHighlight = {
      id: crypto.randomUUID(),
      documentId: document.id,
      pageIndex: passage.pageIndex,
      startOffset: passage.startOffset,
      endOffset: passage.endOffset,
      quote: passage.quote,
      color: '#ffe05a',
      createdAt: now,
      updatedAt: now,
      syncPending: document.storageMode === 'cloud',
    };
    try {
      await this.library.saveTextHighlight(highlight);
      this.highlights.update((items) => [highlight, ...items]);
      this.selectedPassage.set(null);
      if (document.storageMode === 'cloud') {
        try {
          await this.cloud.saveTextHighlight(document.ownerId, highlight);
          const synced = { ...highlight, syncPending: false };
          await this.library.saveTextHighlight(synced);
          this.highlights.update((items) => items.map((item) => item.id === synced.id ? synced : item));
        } catch {
          this.statusKey.set('reader.syncFailed');
        }
      }
    } catch {
      this.errorKey.set('reader.storageFailed');
    }
  }

  openNoteEditor(kind: 'note' | 'comment'): void {
    this.editingNote.set(null);
    this.noteBody.set('');
    this.noteKind.set(kind);
    this.noteEditorOpen.set(true);
  }

  editNote(note: ReadingNote): void {
    this.editingNote.set(note);
    this.noteKind.set(note.kind ?? 'note');
    this.noteBody.set(note.body);
    this.noteEditorOpen.set(true);
  }

  onNoteInput(event: Event): void {
    this.noteBody.set((event.target as HTMLTextAreaElement).value);
  }

  cancelNote(): void {
    this.noteEditorOpen.set(false);
    this.editingNote.set(null);
    this.noteBody.set('');
    this.selectedPassage.set(null);
  }

  async saveNote(): Promise<void> {
    const document = this.activeDocument();
    const passage = this.selectedPassage();
    const previous = this.editingNote();
    if (!document || (!passage && !previous)) return;
    const now = new Date().toISOString();
    const note: ReadingNote = {
      id: previous?.id ?? crypto.randomUUID(),
      documentId: document.id,
      pageIndex: previous?.pageIndex ?? passage!.pageIndex,
      quote: previous?.quote ?? passage!.quote,
      startOffset: previous?.startOffset ?? passage!.startOffset,
      endOffset: previous?.endOffset ?? passage!.endOffset,
      body: this.noteBody().trim(),
      kind: this.noteKind(),
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
      syncPending: document.storageMode === 'cloud',
    };
    try {
      await this.library.saveNote(note);
      this.notes.update((items) => [note, ...items.filter((item) => item.id !== note.id)]);
      this.noteEditorOpen.set(false);
      this.editingNote.set(null);
      this.selectedPassage.set(null);
      this.statusKey.set('reader.noteSaved');
      if (document.storageMode === 'cloud') {
        try {
          await this.cloud.saveNote(document.ownerId, note);
          const synced = { ...note, syncPending: false };
          await this.library.saveNote(synced);
          this.notes.update((items) => items.map((item) => item.id === synced.id ? synced : item));
        } catch {
          this.statusKey.set('reader.syncFailed');
        }
      }
    } catch {
      this.errorKey.set('reader.storageFailed');
    }
  }

  async removeNote(note: ReadingNote): Promise<void> {
    const document = this.activeDocument();
    try {
      if (document?.storageMode === 'cloud') {
        try {
          await this.cloud.deleteNote(document.ownerId, document.id, note.id);
        } catch {
          this.statusKey.set('reader.syncFailed');
          return;
        }
      }
      await this.library.deleteNote(note.id);
      this.notes.update((items) => items.filter((item) => item.id !== note.id));
    } catch {
      this.errorKey.set('reader.storageFailed');
    }
  }

  async removeHighlight(highlight: TextHighlight): Promise<void> {
    const document = this.activeDocument();
    try {
      if (document?.storageMode === 'cloud') {
        try {
          await this.cloud.deleteTextHighlight(document.ownerId, document.id, highlight.id);
        } catch {
          this.statusKey.set('reader.syncFailed');
          return;
        }
      }
      await this.library.deleteTextHighlight(highlight.id);
      this.highlights.update((items) => items.filter((item) => item.id !== highlight.id));
    } catch {
      this.errorKey.set('reader.storageFailed');
    }
  }

  goToNote(note: ReadingNote): void {
    this.currentPage.set(note.pageIndex + 1);
  }

  goToHighlight(highlight: TextHighlight): void {
    this.currentPage.set(highlight.pageIndex + 1);
  }

  private createRenderedBlocks(): RenderedBlock[] {
    const page = this.currentPageData();
    if (!page) return [];
    const highlights = this.highlights().filter((item) => item.pageIndex === page.pageIndex);
    const hits = this.searchHits().filter((item) => item.pageIndex === page.pageIndex);
    return page.blocks.map((block) => {
      const boundaries = new Set<number>([0, block.text.length]);
      const highlightRanges = highlights
        .map((item) => ({
          start: Math.max(0, item.startOffset - block.startOffset),
          end: Math.min(block.text.length, item.endOffset - block.startOffset),
          color: item.color,
        }))
        .filter((item) => item.end > item.start);
      const searchRanges = hits
        .map((item) => ({
          start: Math.max(0, item.startOffset - block.startOffset),
          end: Math.min(block.text.length, item.endOffset - block.startOffset),
        }))
        .filter((item) => item.end > item.start);
      for (const range of [...highlightRanges, ...searchRanges]) {
        boundaries.add(range.start);
        boundaries.add(range.end);
      }
      const points = [...boundaries].sort((a, b) => a - b);
      const segments: RenderedSegment[] = [];
      for (let index = 0; index < points.length - 1; index++) {
        const start = points[index];
        const end = points[index + 1];
        if (end <= start) continue;
        const highlight = highlightRanges.find((range) => start >= range.start && end <= range.end);
        const searchMatch = searchRanges.some((range) => start >= range.start && end <= range.end);
        segments.push({
          text: block.text.slice(start, end),
          startOffset: block.startOffset + start,
          endOffset: block.startOffset + end,
          highlightColor: highlight?.color ?? null,
          searchMatch,
        });
      }
      return { ...block, segments };
    });
  }

  captureSelection(): void {
    if (!this.activeDocument() || this.noteEditorOpen()) return;
    const selection = globalThis.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const quoteRaw = range.toString();
    const quote = quoteRaw.trim();
    if (!quote) return;
    const startOffsetRaw = this.offsetForPoint(range.startContainer, range.startOffset);
    const endOffsetRaw = this.offsetForPoint(range.endContainer, range.endOffset);
    if (startOffsetRaw === null || endOffsetRaw === null) return;
    const leadingTrim = quoteRaw.length - quoteRaw.trimStart().length;
    const startOffset = startOffsetRaw + leadingTrim;
    const endOffset = startOffset + quote.length;
    const selectionBounds = range.getBoundingClientRect();
    this.selectedPassage.set({
      quote,
      pageIndex: this.currentPage() - 1,
      startOffset,
      endOffset,
      menuX: Math.max(150, Math.min(window.innerWidth - 150, selectionBounds.left + selectionBounds.width / 2)),
      menuY: Math.max(72, selectionBounds.top - 8),
    });
  }

  private offsetForPoint(container: Node, offset: number): number | null {
    const element = container instanceof Element ? container : container.parentElement;
    const run = element?.closest<HTMLElement>('[data-offset-start]');
    if (!run) return null;
    const start = Number(run.dataset['offsetStart']);
    if (!Number.isFinite(start)) return null;
    const prefix = document.createRange();
    prefix.selectNodeContents(run);
    try {
      prefix.setEnd(container, offset);
    } catch {
      return null;
    }
    return start + prefix.toString().length;
  }

  private async loadSharedData(document: ReadingDocument): Promise<void> {
    let notes = await this.library.listNotes(document.id);
    let highlights = await this.library.listTextHighlights(document.id);
    if (document.storageMode === 'cloud') {
      try {
        const [remoteNotes, remoteHighlights] = await Promise.all([
          this.cloud.loadNotes(document.ownerId, document.id),
          this.cloud.loadTextHighlights(document.ownerId, document.id),
        ]);
        const noteMap = new Map(remoteNotes.map((note) => [note.id, note]));
        for (const note of notes.filter((item) => item.syncPending)) noteMap.set(note.id, note);
        const highlightMap = new Map(remoteHighlights.map((item) => [item.id, item]));
        for (const highlight of highlights.filter((item) => item.syncPending)) {
          highlightMap.set(highlight.id, highlight);
        }
        notes = [...noteMap.values()];
        highlights = [...highlightMap.values()];
        await Promise.all([
          ...remoteNotes.map((note) => this.library.saveNote(note)),
          ...remoteHighlights.map((item) => this.library.saveTextHighlight(item)),
        ]);
        for (const note of notes.filter((item) => item.syncPending)) {
          try {
            await this.cloud.saveNote(document.ownerId, note);
            const synced = { ...note, syncPending: false };
            await this.library.saveNote(synced);
            noteMap.set(note.id, synced);
          } catch {
            this.statusKey.set('reader.syncFailed');
          }
        }
        for (const highlight of highlights.filter((item) => item.syncPending)) {
          try {
            await this.cloud.saveTextHighlight(document.ownerId, highlight);
            const synced = { ...highlight, syncPending: false };
            await this.library.saveTextHighlight(synced);
            highlightMap.set(highlight.id, synced);
          } catch {
            this.statusKey.set('reader.syncFailed');
          }
        }
        notes = [...noteMap.values()];
        highlights = [...highlightMap.values()];
      } catch {
        this.statusKey.set('reader.syncFailed');
      }
    }
    this.notes.set(notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    this.highlights.set(highlights.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }

  private async refreshDocuments(): Promise<void> {
    const ownerId = this.auth.userId;
    if (!ownerId) return;
    try {
      const local = await this.library.listDocuments(ownerId);
      this.documents.set(local);
      try {
        const remote = await this.cloud.listDocuments(ownerId);
        const byId = new Map(local.map((item) => [item.id, item]));
        for (const document of remote) byId.set(document.id, document);
        this.documents.set([...byId.values()].sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt)));
      } catch {
        this.statusKey.set('reader.cloudUnavailable');
      }
    } catch {
      this.errorKey.set('reader.storageFailed');
    }
  }

  private async createLocalDocument(file: File): Promise<void> {
    try {
      const now = new Date().toISOString();
      const document: ReadingDocument = {
        id: crypto.randomUUID(),
        ownerId: this.ownerId(),
        name: file.name,
        mimeType: 'application/pdf',
        sizeBytes: file.size,
        storageMode: 'local',
        addedAt: now,
        lastOpenedAt: now,
      };
      await this.library.saveDocument(document, file);
      this.addOrReplaceDocument(document);
      this.pendingFile.set(null);
      await this.openDocument(document);
    } catch {
      this.errorKey.set('reader.storageFailed');
    }
  }

  private setPendingFile(file: File | null): void {
    this.errorKey.set(null);
    this.pendingFile.set(null);
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      this.errorKey.set('reader.invalidPdf');
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      this.errorKey.set('reader.pdfTooLarge');
      return;
    }
    this.pendingFile.set(file);
  }

  private clearActiveContent(): void {
    this.activeDocument.set(null);
    this.extractedDocument.set(null);
    this.currentPage.set(1);
    this.selectedPassage.set(null);
    this.noteEditorOpen.set(false);
    this.editingNote.set(null);
    this.notes.set([]);
    this.highlights.set([]);
    this.searchTerm.set('');
    this.searchHits.set([]);
    this.searchHitIndex.set(0);
    this.searchProgress.set(null);
    this.searching.set(false);
  }

  private addOrReplaceDocument(document: ReadingDocument): void {
    this.documents.update((documents) => {
      const next = documents.filter((item) => item.id !== document.id);
      return [document, ...next].sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt));
    });
  }

  private ownerId(): string {
    const id = this.auth.userId;
    if (!id) throw new Error('Sign in before using the text reader.');
    return id;
  }
}
