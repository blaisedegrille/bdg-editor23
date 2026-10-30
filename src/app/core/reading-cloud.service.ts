import { Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  deleteObject,
  getBytes,
  getStorage,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import type { EditorAnnotation } from 'ngx-extended-pdf-viewer';

import {
  PdfJsHighlight,
  ReadingDocument,
  ReadingNote,
  TextHighlight,
} from '../models/reading-document';
import { firebaseApp, db } from './firebase';

const MAX_PDF_BYTES = 50 * 1024 * 1024;
const storage = getStorage(firebaseApp);

@Injectable({ providedIn: 'root' })
export class ReadingCloudService {
  async listDocuments(ownerId: string): Promise<ReadingDocument[]> {
    const snapshot = await getDocs(
      collection(db, 'users', ownerId, 'readingDocuments'),
    );
    return snapshot.docs.map((entry) => ({
      ...(entry.data() as Omit<ReadingDocument, 'id'>),
      id: entry.id,
      ownerId,
      storageMode: 'cloud',
    }));
  }

  async uploadDocument(
    ownerId: string,
    id: string,
    file: File,
    onProgress: (percent: number) => void,
  ): Promise<ReadingDocument> {
    const storagePath = `users/${ownerId}/reading/${id}.pdf`;
    const task = uploadBytesResumable(ref(storage, storagePath), file, {
      contentType: 'application/pdf',
      customMetadata: { ownerId, documentId: id },
    });

    await new Promise<void>((resolve, reject) => {
      task.on(
        'state_changed',
        (snapshot) => {
          const percent = snapshot.totalBytes
            ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            : 0;
          onProgress(percent);
        },
        reject,
        resolve,
      );
    });

    const now = new Date().toISOString();
    const document: ReadingDocument = {
      id,
      ownerId,
      name: file.name,
      mimeType: 'application/pdf',
      sizeBytes: file.size,
      storageMode: 'cloud',
      storagePath,
      addedAt: now,
      lastOpenedAt: now,
    };

    try {
      await setDoc(doc(db, 'users', ownerId, 'readingDocuments', id), {
        name: document.name,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        storagePath,
        addedAt: now,
        lastOpenedAt: now,
      });
    } catch (error) {
      await deleteObject(ref(storage, storagePath)).catch(() => undefined);
      throw error;
    }
    return document;
  }

  async downloadDocument(document: ReadingDocument): Promise<Blob> {
    if (!document.storagePath) {
      throw new Error('Cloud document is missing its storage path.');
    }
    const bytes = await getBytes(ref(storage, document.storagePath), MAX_PDF_BYTES);
    return new Blob([bytes], { type: 'application/pdf' });
  }

  async updateLastOpened(document: ReadingDocument): Promise<void> {
    const { ownerId, id } = document;
    await setDoc(
      doc(db, 'users', ownerId, 'readingDocuments', id),
      { lastOpenedAt: new Date().toISOString() },
      { merge: true },
    );
  }

  async loadAnnotations(
    ownerId: string,
    documentId: string,
  ): Promise<EditorAnnotation[]> {
    const snapshot = await getDocs(
      collection(db, 'users', ownerId, 'readingDocuments', documentId, 'annotations'),
    );
    return snapshot.docs.map((entry) => entry.data() as EditorAnnotation);
  }

  async saveAnnotations(
    ownerId: string,
    documentId: string,
    annotations: EditorAnnotation[],
  ): Promise<void> {
    const annotationCollection = collection(
      db,
      'users',
      ownerId,
      'readingDocuments',
      documentId,
      'annotations',
    );
    const current = await getDocs(annotationCollection);
    const next = new Map(
      annotations.map((annotation) => [annotation.customId!, annotation]),
    );
    const changes: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
    for (const entry of current.docs) {
      if (!next.has(entry.id)) {
        changes.push((batch) => batch.delete(entry.ref));
      }
    }
    for (const [id, annotation] of next) {
      if (id) {
        const serializable = JSON.parse(JSON.stringify(annotation)) as EditorAnnotation;
        changes.push((batch) => batch.set(doc(annotationCollection, id), serializable));
      }
    }
    for (let offset = 0; offset < changes.length; offset += 400) {
      const batch = writeBatch(db);
      for (const change of changes.slice(offset, offset + 400)) change(batch);
      await batch.commit();
    }
  }

  async loadNotes(ownerId: string, documentId: string): Promise<ReadingNote[]> {
    const snapshot = await getDocs(
      collection(db, 'users', ownerId, 'readingDocuments', documentId, 'notes'),
    );
    return snapshot.docs.map((entry) => entry.data() as ReadingNote);
  }

  async saveNote(ownerId: string, note: ReadingNote): Promise<void> {
    const payload = { ...note };
    delete payload.syncPending;
    await setDoc(
      doc(db, 'users', ownerId, 'readingDocuments', note.documentId, 'notes', note.id),
      payload,
    );
  }

  async deleteNote(ownerId: string, documentId: string, noteId: string): Promise<void> {
    await deleteDoc(
      doc(db, 'users', ownerId, 'readingDocuments', documentId, 'notes', noteId),
    );
  }

  async loadPdfJsHighlights(
    ownerId: string,
    documentId: string,
  ): Promise<PdfJsHighlight[]> {
    const snapshot = await getDocs(
      collection(
        db,
        'users',
        ownerId,
        'readingDocuments',
        documentId,
        'pdfjsHighlights',
      ),
    );
    return snapshot.docs.map((entry) => entry.data() as PdfJsHighlight);
  }

  async savePdfJsHighlight(
    ownerId: string,
    highlight: PdfJsHighlight,
  ): Promise<void> {
    const payload = { ...highlight };
    delete payload.syncPending;
    await setDoc(
      doc(
        db,
        'users',
        ownerId,
        'readingDocuments',
        highlight.documentId,
        'pdfjsHighlights',
        highlight.id,
      ),
      payload,
    );
  }

  async deletePdfJsHighlight(
    ownerId: string,
    documentId: string,
    highlightId: string,
  ): Promise<void> {
    await deleteDoc(
      doc(
        db,
        'users',
        ownerId,
        'readingDocuments',
        documentId,
        'pdfjsHighlights',
        highlightId,
      ),
    );
  }

  async loadTextHighlights(
    ownerId: string,
    documentId: string,
  ): Promise<TextHighlight[]> {
    const snapshot = await getDocs(
      collection(db, 'users', ownerId, 'readingDocuments', documentId, 'textHighlights'),
    );
    return snapshot.docs.map((entry) => entry.data() as TextHighlight);
  }

  async saveTextHighlight(ownerId: string, highlight: TextHighlight): Promise<void> {
    const payload = { ...highlight };
    delete payload.syncPending;
    await setDoc(
      doc(
        db,
        'users',
        ownerId,
        'readingDocuments',
        highlight.documentId,
        'textHighlights',
        highlight.id,
      ),
      payload,
    );
  }

  async deleteTextHighlight(
    ownerId: string,
    documentId: string,
    highlightId: string,
  ): Promise<void> {
    await deleteDoc(
      doc(db, 'users', ownerId, 'readingDocuments', documentId, 'textHighlights', highlightId),
    );
  }

  async deleteDocument(document: ReadingDocument): Promise<void> {
    const { ownerId, id, storagePath } = document;
    if (storagePath) {
      await deleteObject(ref(storage, storagePath));
    }
    for (const subcollection of ['annotations', 'notes', 'pdfjsHighlights', 'textHighlights']) {
      const records = await getDocs(
        collection(db, 'users', ownerId, 'readingDocuments', id, subcollection),
      );
      for (let offset = 0; offset < records.docs.length; offset += 400) {
        const batch = writeBatch(db);
        for (const entry of records.docs.slice(offset, offset + 400)) {
          batch.delete(entry.ref);
        }
        await batch.commit();
      }
    }
    await deleteDoc(doc(db, 'users', ownerId, 'readingDocuments', id));
  }

  async documentExists(ownerId: string, documentId: string): Promise<boolean> {
    const snapshot = await getDoc(
      doc(db, 'users', ownerId, 'readingDocuments', documentId),
    );
    return snapshot.exists();
  }
}
