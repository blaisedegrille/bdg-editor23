import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  Renderer2,
  inject,
  signal,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatProgressBar } from '@angular/material/progress-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  AnnotationEditorEvent,
  AnnotationEditorLayerRenderedEvent,
  EditorAnnotation,
  NgxExtendedPdfViewerModule,
  NgxExtendedPdfViewerService,
  PdfLoadedEvent,
} from 'ngx-extended-pdf-viewer';

import { AuthService } from '../../core/auth.service';
import { ReadingCloudService } from '../../core/reading-cloud.service';
import { ReadingLibraryService } from '../../core/reading-library.service';
import { I18nService } from '../../core/i18n/i18n.service';
import {
  ReadingDocument,
  ReadingNote,
  SelectedPassage,
  TextSelectionRect,
} from '../../models/reading-document';
import { TranslatePipe } from '../../shared/translate.pipe';

const MAX_PDF_BYTES = 50 * 1024 * 1024;
const ANNOTATION_SAVE_DELAY_MS = 300;

@Component({
  selector: 'app-read-and-highlight',
  templateUrl: './read-and-highlight.component.html',
  styleUrl: './read-and-highlight.component.scss',
  imports: [
    MatButton,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatInput,
    MatLabel,
    MatProgressBar,
    NgxExtendedPdfViewerModule,
    RouterLink,
    TranslatePipe,
  ],
})
export class ReadAndHighlightComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly route = inject(ActivatedRoute);
  private readonly renderer = inject(Renderer2);
  private readonly zone = inject(NgZone);
  private readonly auth = inject(AuthService);
  private readonly library = inject(ReadingLibraryService);
  private readonly cloud = inject(ReadingCloudService);
  private readonly pdfViewer = inject(NgxExtendedPdfViewerService);
  private readonly annotationIds = new Map<string, string>();
  private readonly restoredPages = new Set<number>();
  private stopListening?: () => void;
  private annotationSaveTimer?: number;
  private pendingAnnotations: EditorAnnotation[] = [];
  private restoringAnnotations = false;
  private stopListeningClick?: () => void;

  readonly i18n = inject(I18nService);
  readonly documents = signal<ReadingDocument[]>([]);
  readonly activeDocument = signal<ReadingDocument | null>(null);
  readonly activeFile = signal<Blob | null>(null);
  readonly pendingFile = signal<File | null>(null);
  readonly notes = signal<ReadingNote[]>([]);
  readonly selectedPassage = signal<SelectedPassage | null>(null);
  readonly noteEditorOpen = signal(false);
  readonly noteBody = signal('');
  readonly searchTerm = signal('');
  readonly uploadProgress = signal<number | null>(null);
  readonly errorKey = signal<string | null>(null);
  readonly statusKey = signal<string | null>(null);
  readonly loadingDocument = signal(false);

  constructor() {
    void this.refreshDocuments().then(() => {
      const documentId = this.route.snapshot.queryParamMap.get('documentId');
      const document = this.documents().find((item) => item.id === documentId);
      if (document) void this.openDocument(document);
    });
  }

  ngAfterViewInit(): void {
    this.stopListening = this.renderer.listen(
      'document',
      'selectionchange',
      () => this.captureSelection(),
    );
    this.stopListeningClick = this.renderer.listen(
      'document',
      'click',
      (event: MouseEvent) => {
        const target = event.target instanceof Element ? event.target : null;
        if (
          target?.closest('.reader-selection-actions, .reader-note-editor')
        ) {
          return;
        }
        if (!target?.closest('ngx-extended-pdf-viewer .textLayer')) {
          this.selectedPassage.set(null);
        }
      },
    );
  }

  ngOnDestroy(): void {
    this.stopListening?.();
    this.stopListeningClick?.();
    if (this.annotationSaveTimer !== undefined) {
      window.clearTimeout(this.annotationSaveTimer);
    }
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
    if (!file) return;
    void this.createLocalDocument(file);
  }

  async uploadPendingToCloud(): Promise<void> {
    const file = this.pendingFile();
    if (!file) return;
    this.errorKey.set(null);
    this.statusKey.set(null);
    this.uploadProgress.set(0);
    try {
      const id = crypto.randomUUID();
      const document = await this.cloud.uploadDocument(
        this.ownerId(),
        id,
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
    this.errorKey.set(null);
    this.statusKey.set(null);
    this.loadingDocument.set(true);
    this.clearViewerState();
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
      this.addOrReplaceDocument(opened);
      this.activeDocument.set(opened);
      this.activeFile.set(file);

      if (opened.storageMode === 'cloud') {
        void this.cloud.updateLastOpened(opened).catch(() => undefined);
      }
      await this.loadDocumentData(opened);
    } catch {
      this.errorKey.set('reader.loadFailed');
    } finally {
      this.loadingDocument.set(false);
    }
  }

  closeDocument(): void {
    this.clearViewerState();
    this.activeDocument.set(null);
    this.activeFile.set(null);
  }

  async deleteDocument(document: ReadingDocument): Promise<void> {
    if (!globalThis.confirm(this.i18n.t('reader.deleteConfirm'))) return;
    this.errorKey.set(null);
    try {
      if (document.storageMode === 'cloud') {
        await this.cloud.deleteDocument(document);
      }
      await this.library.deleteDocument(document.id);
      this.documents.update((items) => items.filter((item) => item.id !== document.id));
      if (this.activeDocument()?.id === document.id) this.closeDocument();
    } catch {
      this.errorKey.set('reader.deleteFailed');
    }
  }

  searchDocument(): void {
    const query = this.searchTerm().trim();
    if (query) this.pdfViewer.find(query, { highlightAll: true });
  }

  previousMatch(): void {
    this.pdfViewer.findPrevious();
  }

  openNotePage(note: ReadingNote): void {
    this.pdfViewer.scrollPageIntoView(note.pageIndex + 1);
  }

  nextMatch(): void {
    this.pdfViewer.findNext();
  }

  searchSelection(): void {
    const passage = this.selectedPassage();
    if (!passage) return;
    this.searchTerm.set(passage.quote);
    this.pdfViewer.find(passage.quote, { highlightAll: true });
    this.selectedPassage.set(null);
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
    if (!passage) return;
    this.errorKey.set(null);
    try {
      for (const rect of passage.rects) {
        await this.pdfViewer.addHighlightToAnnotationLayer(
          [255, 224, 90],
          rect.pageIndex,
          `${rect.left}px`,
          `${rect.bottom}px`,
          `${rect.right}px`,
          `${rect.top}px`,
          8,
          0,
          0.55,
        );
      }
      this.selectedPassage.set(null);
      this.scheduleAnnotationSave();
    } catch {
      this.errorKey.set('reader.highlightFailed');
    }
  }

  openNoteEditor(): void {
    this.noteBody.set('');
    this.noteEditorOpen.set(true);
  }

  cancelNote(): void {
    this.noteEditorOpen.set(false);
    this.noteBody.set('');
    this.selectedPassage.set(null);
  }

  async saveNote(): Promise<void> {
    const passage = this.selectedPassage();
    const document = this.activeDocument();
    if (!passage || !document) return;
    const now = new Date().toISOString();
    const note: ReadingNote = {
      id: crypto.randomUUID(),
      documentId: document.id,
      pageIndex: passage.pageIndex,
      quote: passage.quote,
      body: this.noteBody().trim(),
      createdAt: now,
      updatedAt: now,
      syncPending: document.storageMode === 'cloud',
    };
    try {
      await this.library.saveNote(note);
      this.notes.update((items) => [note, ...items]);
      this.noteEditorOpen.set(false);
      this.selectedPassage.set(null);
      this.statusKey.set('reader.noteSaved');
      if (document.storageMode === 'cloud') {
        try {
          await this.cloud.saveNote(document.ownerId, note);
          const syncedNote = { ...note, syncPending: false };
          await this.library.saveNote(syncedNote);
          this.notes.update((items) =>
            items.map((item) => item.id === note.id ? syncedNote : item),
          );
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

  onPdfLoaded(event: PdfLoadedEvent): void {
    const document = this.activeDocument();
    if (document) {
      const updated = { ...document, pageCount: event.pagesCount };
      this.activeDocument.set(updated);
      this.addOrReplaceDocument(updated);
      void this.library.saveDocument(updated);
    }
  }

  onPdfFailed(): void {
    this.errorKey.set('reader.loadFailed');
  }

  onAnnotationEditorLayerRendered(event: AnnotationEditorLayerRenderedEvent): void {
    const pageIndex = event.pageNumber - 1;
    this.editorLayersReady.add(pageIndex);
    void this.restoreAnnotationsForPage(pageIndex);
  }

  onAnnotationEditorEvent(event: AnnotationEditorEvent): void {
    if (this.restoringAnnotations) return;
    if (event.type === 'added' && event.id && !event.customId) {
      const id = crypto.randomUUID();
      this.annotationIds.set(event.id, id);
      event.source.customId = id;
    }
    this.scheduleAnnotationSave();
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

  private async refreshDocuments(): Promise<void> {
    const ownerId = this.auth.userId;
    if (!ownerId) return;
    try {
      const localDocuments = await this.library.listDocuments(ownerId);
      this.documents.set(localDocuments);
      try {
        const cloudDocuments = await this.cloud.listDocuments(ownerId);
        const byId = new Map(localDocuments.map((document) => [document.id, document]));
        for (const document of cloudDocuments) byId.set(document.id, document);
        this.documents.set(
          [...byId.values()].sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt)),
        );
      } catch {
        this.statusKey.set('reader.cloudUnavailable');
      }
    } catch {
      this.errorKey.set('reader.storageFailed');
    }
  }

  private async loadDocumentData(document: ReadingDocument): Promise<void> {
    const storedAnnotations = await this.library.getStoredAnnotations(document.id);
    let annotations = storedAnnotations?.annotations ?? [];
    let notes = await this.library.listNotes(document.id);
    if (document.storageMode === 'cloud') {
      try {
        const [cloudAnnotations, cloudNotes] = await Promise.all([
          this.cloud.loadAnnotations(document.ownerId, document.id),
          this.cloud.loadNotes(document.ownerId, document.id),
        ]);
        if (storedAnnotations?.syncPending) {
          try {
            await this.cloud.saveAnnotations(
              document.ownerId,
              document.id,
              storedAnnotations.annotations,
            );
            await this.library.setAnnotationsSyncPending(document.id, false);
          } catch {
            this.statusKey.set('reader.syncFailed');
          }
        } else {
          annotations = cloudAnnotations;
          await this.library.saveAnnotations(document.id, annotations);
        }

        const mergedNotes = new Map(cloudNotes.map((note) => [note.id, note]));
        for (const note of notes.filter((item) => item.syncPending)) {
          mergedNotes.set(note.id, note);
        }
        notes = [...mergedNotes.values()].sort(
          (a, b) => b.updatedAt.localeCompare(a.updatedAt),
        );
        await Promise.all(cloudNotes.map((note) => this.library.saveNote(note)));
        for (const note of notes.filter((item) => item.syncPending)) {
          try {
            await this.cloud.saveNote(document.ownerId, note);
            const syncedNote = { ...note, syncPending: false };
            await this.library.saveNote(syncedNote);
            mergedNotes.set(note.id, syncedNote);
          } catch {
            this.statusKey.set('reader.syncFailed');
          }
        }
        notes = [...mergedNotes.values()].sort(
          (a, b) => b.updatedAt.localeCompare(a.updatedAt),
        );
      } catch {
        this.statusKey.set('reader.syncFailed');
      }
    }
    this.pendingAnnotations = annotations;
    this.notes.set(notes);
    this.restoredPages.clear();
    this.annotationIds.clear();
    for (const pageIndex of this.editorLayersReady) {
      void this.restoreAnnotationsForPage(pageIndex);
    }
  }

  private captureSelection(): void {
    if (!this.activeDocument() || this.noteEditorOpen()) return;
    const selection = globalThis.getSelection();
    const quote = selection?.toString().trim() ?? '';
    const anchor = selection?.anchorNode;
    const anchorElement = anchor instanceof Element
      ? anchor
      : anchor?.parentElement;
    if (!quote || !selection || !anchorElement?.closest('ngx-extended-pdf-viewer .textLayer')) {
      return;
    }

    const range = selection.getRangeAt(0);
    const selectionBounds = range.getBoundingClientRect();
    const pageElements = Array.from(
      (this.host.nativeElement as HTMLElement).querySelectorAll(
        'ngx-extended-pdf-viewer .page[data-page-number]',
      ),
    ) as HTMLElement[];
    const rects: TextSelectionRect[] = [];
    for (const clientRect of Array.from(range.getClientRects())) {
      const page = pageElements.find((element) => {
        const bounds = element.getBoundingClientRect();
        const centerX = clientRect.left + clientRect.width / 2;
        const centerY = clientRect.top + clientRect.height / 2;
        return centerX >= bounds.left && centerX <= bounds.right
          && centerY >= bounds.top && centerY <= bounds.bottom;
      });
      if (!page) continue;
      const bounds = page.getBoundingClientRect();
      const pageIndex = Number(page.dataset['pageNumber']) - 1;
      const left = Math.max(0, clientRect.left - bounds.left);
      const right = Math.min(bounds.width, clientRect.right - bounds.left);
      const topFromTop = Math.max(0, clientRect.top - bounds.top);
      const bottomFromTop = Math.min(bounds.height, clientRect.bottom - bounds.top);
      if (pageIndex < 0 || right <= left || bottomFromTop <= topFromTop) continue;
      rects.push({
        pageIndex,
        pageHeight: bounds.height,
        left,
        right,
        bottom: bounds.height - bottomFromTop,
        top: bounds.height - topFromTop,
      });
    }
    if (!rects.length) {
      return;
    }
    this.selectedPassage.set({
      quote,
      pageIndex: Math.min(...rects.map((rect) => rect.pageIndex)),
      rects,
      menuX: Math.max(120, Math.min(window.innerWidth - 120, selectionBounds.left + selectionBounds.width / 2)),
      menuY: Math.max(72, selectionBounds.top - 8),
    });
  }

  private scheduleAnnotationSave(): void {
    if (this.restoringAnnotations) return;
    if (this.annotationSaveTimer !== undefined) {
      window.clearTimeout(this.annotationSaveTimer);
    }
    this.annotationSaveTimer = window.setTimeout(
      () => void this.persistAnnotations(),
      ANNOTATION_SAVE_DELAY_MS,
    );
  }

  private async persistAnnotations(): Promise<void> {
    const document = this.activeDocument();
    if (!document) return;
    const annotations = (this.pdfViewer.getSerializedAnnotations() ?? []).map(
      (annotation) => {
        const customId = annotation.customId
          ?? this.annotationIds.get(annotation.id ?? '')
          ?? crypto.randomUUID();
        if (annotation.id) this.annotationIds.set(annotation.id, customId);
        return { ...annotation, customId };
      },
    );
    try {
      await this.library.saveAnnotations(
        document.id,
        annotations,
        document.storageMode === 'cloud',
      );
      if (document.storageMode === 'cloud') {
        try {
          await this.cloud.saveAnnotations(document.ownerId, document.id, annotations);
          await this.library.setAnnotationsSyncPending(document.id, false);
        } catch {
          this.statusKey.set('reader.syncFailed');
        }
      }
    } catch {
      this.errorKey.set('reader.storageFailed');
    }
  }

  private readonly editorLayersReady = new Set<number>();

  private async restoreAnnotationsForPage(pageIndex: number): Promise<void> {
    if (this.restoredPages.has(pageIndex)) return;
    const annotations = this.pendingAnnotations.filter(
      (annotation) => annotation.pageIndex === pageIndex,
    );
    if (!annotations.length) return;
    this.restoredPages.add(pageIndex);
    this.restoringAnnotations = true;
    try {
      await this.pdfViewer.addEditorAnnotation(annotations);
      for (const annotation of annotations) {
        if (annotation.id && annotation.customId) {
          this.annotationIds.set(annotation.id, annotation.customId);
        }
      }
    } catch {
      this.errorKey.set('reader.loadFailed');
    } finally {
      this.restoringAnnotations = false;
    }
  }

  private addOrReplaceDocument(document: ReadingDocument): void {
    this.documents.update((documents) => {
      const next = documents.filter((item) => item.id !== document.id);
      return [document, ...next].sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt));
    });
  }

  private ownerId(): string {
    const ownerId = this.auth.userId;
    if (!ownerId) throw new Error('Sign in before using the reader.');
    return ownerId;
  }

  private clearViewerState(): void {
    this.selectedPassage.set(null);
    this.noteEditorOpen.set(false);
    this.noteBody.set('');
    this.notes.set([]);
    this.pendingAnnotations = [];
    this.restoredPages.clear();
    this.editorLayersReady.clear();
    this.annotationIds.clear();
    this.searchTerm.set('');
  }
}
