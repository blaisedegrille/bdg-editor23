import { TestBed } from '@angular/core/testing';
import { EditorAnnotation } from 'ngx-extended-pdf-viewer';

import { ReadingDocument, ReadingNote } from '../models/reading-document';
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
});
