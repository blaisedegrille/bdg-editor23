import { TestBed } from '@angular/core/testing';
import { EditorAnnotation } from 'ngx-extended-pdf-viewer';

import {
  PdfJsHighlight,
  ExtractedTextDocument,
  ReadingDocument,
  ReadingNote,
  TextHighlight,
} from '../models/reading-document';
import { ReadingLibraryService } from './reading-library.service';

describe('ReadingLibraryService', () => {
  let service: ReadingLibraryService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ReadingLibraryService] });
    service = TestBed.inject(ReadingLibraryService);
  });

  it('persists a local PDF, its annotations, and notes in IndexedDB', async () => {
    const id = crypto.randomUUID();
    const ownerId = crypto.randomUUID();
    const now = new Date().toISOString();
    const document: ReadingDocument = {
      id,
      ownerId,
      name: 'sample.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 4,
      storageMode: 'local',
      addedAt: now,
      lastOpenedAt: now,
    };
    const file = new Blob(['%PDF'], { type: 'application/pdf' });
    const annotation: EditorAnnotation = {
      annotationType: 9,
      color: [255, 224, 90],
      opacity: 0.55,
      thickness: 8,
      pageIndex: 0,
      rect: [10, 10, 40, 20],
      rotation: 0,
      customId: 'highlight-1',
    };
    const note: ReadingNote = {
      id: 'note-1',
      documentId: id,
      pageIndex: 0,
      quote: 'Selected text',
      body: 'A note',
      createdAt: now,
      updatedAt: now,
    };

    await service.saveDocument(document, file);
    await service.saveAnnotations(id, [annotation]);
    await service.saveNote(note);

    expect(await service.listDocuments(ownerId)).toEqual([document]);
    expect(await (await service.getFile(id))?.text()).toBe('%PDF');
    expect(await service.getAnnotations(id)).toEqual([annotation]);
    expect(await service.listNotes(id)).toEqual([note]);

    await service.deleteDocument(id);
    expect(await service.getFile(id)).toBeUndefined();
    expect(await service.getAnnotations(id)).toEqual([]);
    expect(await service.listNotes(id)).toEqual([]);
  });

  it('stores custom PDF.js highlights separately from ngx annotations', async () => {
    const documentId = crypto.randomUUID();
    const highlight: PdfJsHighlight = {
      id: crypto.randomUUID(),
      documentId,
      pageIndex: 2,
      quote: 'Custom PDF.js highlight',
      rects: [{ x: 0.1, y: 0.2, width: 0.3, height: 0.04 }],
      color: '#ffe05a',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncPending: true,
    };

    await service.savePdfJsHighlight(highlight);
    expect(await service.listPdfJsHighlights(documentId)).toEqual([highlight]);

    await service.setPdfJsHighlightSyncPending(highlight.id, false);
    expect((await service.listPdfJsHighlights(documentId))[0].syncPending).toBeFalse();

    await service.deletePdfJsHighlight(highlight.id);
    expect(await service.listPdfJsHighlights(documentId)).toEqual([]);
  });

  it('caches extracted text and offset-based highlights without modifying legacy annotations', async () => {
    const documentId = crypto.randomUUID();
    const extracted: ExtractedTextDocument = {
      documentId,
      extractedAt: new Date().toISOString(),
      pages: [{
        pageIndex: 0,
        text: 'A formatted paragraph.',
        blocks: [{
          id: '0-0',
          kind: 'paragraph',
          text: 'A formatted paragraph.',
          startOffset: 0,
          endOffset: 22,
          fontSizeRatio: 1,
          bold: false,
        }],
      }],
    };
    const highlight: TextHighlight = {
      id: crypto.randomUUID(),
      documentId,
      pageIndex: 0,
      startOffset: 2,
      endOffset: 11,
      quote: 'formatted',
      color: '#ffe05a',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncPending: true,
    };

    await service.saveExtractedText(extracted);
    await service.saveTextHighlight(highlight);

    expect(await service.getExtractedText(documentId)).toEqual(extracted);
    expect(await service.listTextHighlights(documentId)).toEqual([highlight]);
    expect(await service.getAnnotations(documentId)).toEqual([]);
  });
});
