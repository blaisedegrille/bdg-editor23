import { Injectable } from '@angular/core';
import { DBSchema, openDB } from 'idb';
import type { EditorAnnotation } from 'ngx-extended-pdf-viewer';

import {
  ExtractedTextDocument,
  PdfJsHighlight,
  ReadingDocument,
  ReadingNote,
  StoredAnnotations,
  TextHighlight,
} from '../models/reading-document';

const DATABASE_NAME = 'bdg-editor23-reading.v1';
const DATABASE_VERSION = 3;

interface StoredPdf {
  id: string;
  file: Blob;
}

interface ReadingDatabase extends DBSchema {
  documents: {
    key: string;
    value: ReadingDocument;
    indexes: { 'by-owner': string };
  };
  files: { key: string; value: StoredPdf };
  annotations: { key: string; value: StoredAnnotations };
  notes: {
    key: string;
    value: ReadingNote;
    indexes: { 'by-document': string };
  };
  pdfjsHighlights: {
    key: string;
    value: PdfJsHighlight;
    indexes: { 'by-document': string };
  };
  extractedText: { key: string; value: ExtractedTextDocument };
  textHighlights: {
    key: string;
    value: TextHighlight;
    indexes: { 'by-document': string };
  };
}

@Injectable({ providedIn: 'root' })
export class ReadingLibraryService {
  private readonly database = openDB<ReadingDatabase>(
    DATABASE_NAME,
    DATABASE_VERSION,
    {
      upgrade(database) {
        if (!database.objectStoreNames.contains('documents')) {
          const documents = database.createObjectStore('documents', {
            keyPath: 'id',
          });
          documents.createIndex('by-owner', 'ownerId');
        }
        if (!database.objectStoreNames.contains('files')) {
          database.createObjectStore('files', { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains('annotations')) {
          database.createObjectStore('annotations', { keyPath: 'documentId' });
        }
        if (!database.objectStoreNames.contains('notes')) {
          const notes = database.createObjectStore('notes', { keyPath: 'id' });
          notes.createIndex('by-document', 'documentId');
        }
        if (!database.objectStoreNames.contains('pdfjsHighlights')) {
          const highlights = database.createObjectStore('pdfjsHighlights', {
            keyPath: 'id',
          });
          highlights.createIndex('by-document', 'documentId');
        }
        if (!database.objectStoreNames.contains('extractedText')) {
          database.createObjectStore('extractedText', { keyPath: 'documentId' });
        }
        if (!database.objectStoreNames.contains('textHighlights')) {
          const highlights = database.createObjectStore('textHighlights', {
            keyPath: 'id',
          });
          highlights.createIndex('by-document', 'documentId');
        }
      },
    },
  );

  async listDocuments(ownerId: string): Promise<ReadingDocument[]> {
    const database = await this.database;
    const documents = await database.getAllFromIndex(
      'documents',
      'by-owner',
      ownerId,
    );
    return documents.sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt));
  }

  async getDocument(id: string): Promise<ReadingDocument | undefined> {
    return (await this.database).get('documents', id);
  }

  async saveDocument(document: ReadingDocument, file?: Blob): Promise<void> {
    const database = await this.database;
    const transaction = database.transaction(['documents', 'files'], 'readwrite');
    await transaction.objectStore('documents').put(document);
    if (file) {
      await transaction.objectStore('files').put({ id: document.id, file });
    }
    await transaction.done;
  }

  async getFile(id: string): Promise<Blob | undefined> {
    return (await this.database).get('files', id).then((stored) => stored?.file);
  }

  async saveAnnotations(
    documentId: string,
    annotations: EditorAnnotation[],
    syncPending = false,
  ): Promise<void> {
    await (await this.database).put('annotations', {
      documentId,
      annotations,
      updatedAt: new Date().toISOString(),
      syncPending,
    });
  }

  async getAnnotations(documentId: string): Promise<EditorAnnotation[]> {
    return (await this.getStoredAnnotations(documentId))?.annotations ?? [];
  }

  async getStoredAnnotations(
    documentId: string,
  ): Promise<StoredAnnotations | undefined> {
    return (await this.database).get('annotations', documentId);
  }

  async setAnnotationsSyncPending(
    documentId: string,
    syncPending: boolean,
  ): Promise<void> {
    const stored = await this.getStoredAnnotations(documentId);
    if (stored) {
      await (await this.database).put('annotations', {
        ...stored,
        syncPending,
      });
    }
  }

  async listNotes(documentId: string): Promise<ReadingNote[]> {
    const database = await this.database;
    const notes = await database.getAllFromIndex('notes', 'by-document', documentId);
    return notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async saveNote(note: ReadingNote): Promise<void> {
    await (await this.database).put('notes', note);
  }

  async deleteNote(id: string): Promise<void> {
    await (await this.database).delete('notes', id);
  }

  async listPdfJsHighlights(documentId: string): Promise<PdfJsHighlight[]> {
    const database = await this.database;
    return database.getAllFromIndex('pdfjsHighlights', 'by-document', documentId);
  }

  async savePdfJsHighlight(highlight: PdfJsHighlight): Promise<void> {
    await (await this.database).put('pdfjsHighlights', highlight);
  }

  async deletePdfJsHighlight(id: string): Promise<void> {
    await (await this.database).delete('pdfjsHighlights', id);
  }

  async setPdfJsHighlightSyncPending(
    id: string,
    syncPending: boolean,
  ): Promise<void> {
    const database = await this.database;
    const highlight = await database.get('pdfjsHighlights', id);
    if (highlight) {
      await database.put('pdfjsHighlights', { ...highlight, syncPending });
    }
  }

  async getExtractedText(documentId: string): Promise<ExtractedTextDocument | undefined> {
    return (await this.database).get('extractedText', documentId);
  }

  async saveExtractedText(content: ExtractedTextDocument): Promise<void> {
    await (await this.database).put('extractedText', content);
  }

  async listTextHighlights(documentId: string): Promise<TextHighlight[]> {
    const database = await this.database;
    return database.getAllFromIndex('textHighlights', 'by-document', documentId);
  }

  async saveTextHighlight(highlight: TextHighlight): Promise<void> {
    await (await this.database).put('textHighlights', highlight);
  }

  async deleteTextHighlight(id: string): Promise<void> {
    await (await this.database).delete('textHighlights', id);
  }

  async deleteDocument(id: string): Promise<void> {
    const database = await this.database;
    const transaction = database.transaction(
      [
        'documents',
        'files',
        'annotations',
        'notes',
        'pdfjsHighlights',
        'extractedText',
        'textHighlights',
      ],
      'readwrite',
    );
    await transaction.objectStore('documents').delete(id);
    await transaction.objectStore('files').delete(id);
    await transaction.objectStore('annotations').delete(id);
    const noteStore = transaction.objectStore('notes');
    const noteIds = await noteStore.index('by-document').getAllKeys(id);
    await Promise.all(noteIds.map((noteId) => noteStore.delete(noteId)));
    const highlights = transaction.objectStore('pdfjsHighlights');
    const highlightIds = await highlights.index('by-document').getAllKeys(id);
    await Promise.all(highlightIds.map((highlightId) => highlights.delete(highlightId)));
    await transaction.objectStore('extractedText').delete(id);
    const textHighlights = transaction.objectStore('textHighlights');
    const textHighlightIds = await textHighlights.index('by-document').getAllKeys(id);
    await Promise.all(textHighlightIds.map((highlightId) => textHighlights.delete(highlightId)));
    await transaction.done;
  }
}
