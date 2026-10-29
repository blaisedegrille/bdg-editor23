import { Injectable } from '@angular/core';
import { DBSchema, openDB } from 'idb';
import type { EditorAnnotation } from 'ngx-extended-pdf-viewer';

import { ReadingDocument, ReadingNote, StoredAnnotations } from '../models/reading-document';

const DATABASE_NAME = 'bdg-editor23-reading.v1';
const DATABASE_VERSION = 1;

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
}

@Injectable({ providedIn: 'root' })
export class ReadingLibraryService {
  private readonly database = openDB<ReadingDatabase>(
    DATABASE_NAME,
    DATABASE_VERSION,
    {
      upgrade(database) {
        const documents = database.createObjectStore('documents', {
          keyPath: 'id',
        });
        documents.createIndex('by-owner', 'ownerId');
        database.createObjectStore('files', { keyPath: 'id' });
        database.createObjectStore('annotations', { keyPath: 'documentId' });
        const notes = database.createObjectStore('notes', { keyPath: 'id' });
        notes.createIndex('by-document', 'documentId');
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

  async deleteDocument(id: string): Promise<void> {
    const database = await this.database;
    const transaction = database.transaction(
      ['documents', 'files', 'annotations', 'notes'],
      'readwrite',
    );
    await transaction.objectStore('documents').delete(id);
    await transaction.objectStore('files').delete(id);
    await transaction.objectStore('annotations').delete(id);
    const noteStore = transaction.objectStore('notes');
    const noteIds = await noteStore.index('by-document').getAllKeys(id);
    await Promise.all(noteIds.map((noteId) => noteStore.delete(noteId)));
    await transaction.done;
  }
}
