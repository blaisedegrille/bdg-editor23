import type { EditorAnnotation } from 'ngx-extended-pdf-viewer';

export type ReadingStorageMode = 'local' | 'cloud';

export interface ReadingDocument {
  id: string;
  ownerId: string;
  name: string;
  mimeType: 'application/pdf';
  sizeBytes: number;
  storageMode: ReadingStorageMode;
  storagePath?: string;
  addedAt: string;
  lastOpenedAt: string;
  pageCount?: number;
}

export interface ReadingNote {
  id: string;
  documentId: string;
  pageIndex: number;
  quote: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  syncPending?: boolean;
}

export interface StoredAnnotations {
  documentId: string;
  annotations: EditorAnnotation[];
  updatedAt: string;
  syncPending: boolean;
}

export interface TextSelectionRect {
  pageIndex: number;
  pageHeight: number;
  left: number;
  bottom: number;
  right: number;
  top: number;
}

export interface SelectedPassage {
  quote: string;
  pageIndex: number;
  rects: TextSelectionRect[];
  menuX: number;
  menuY: number;
}
