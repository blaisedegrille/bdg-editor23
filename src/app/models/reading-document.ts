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
  kind?: 'note' | 'comment';
  highlightId?: string;
  startOffset?: number;
  endOffset?: number;
}

export interface StoredAnnotations {
  documentId: string;
  annotations: EditorAnnotation[];
  updatedAt: string;
  syncPending: boolean;
}

export interface PdfJsHighlightRect {
  /** Normalized horizontal offset in the unrotated PDF page, from 0 to 1. */
  x: number;
  /** Normalized vertical offset from the top of the unrotated PDF page, 0 to 1. */
  y: number;
  width: number;
  height: number;
}

export interface PdfJsHighlight {
  id: string;
  documentId: string;
  pageIndex: number;
  quote: string;
  rects: PdfJsHighlightRect[];
  color: string;
  createdAt: string;
  updatedAt: string;
  syncPending?: boolean;
}

export interface TextHighlight {
  id: string;
  documentId: string;
  pageIndex: number;
  startOffset: number;
  endOffset: number;
  quote: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  syncPending?: boolean;
}

export interface ExtractedTextBlock {
  id: string;
  kind: 'paragraph' | 'heading';
  text: string;
  startOffset: number;
  endOffset: number;
  fontSizeRatio: number;
  bold: boolean;
}

export interface ExtractedTextPage {
  pageIndex: number;
  text: string;
  blocks: ExtractedTextBlock[];
}

export interface ExtractedTextDocument {
  documentId: string;
  extractedAt: string;
  pages: ExtractedTextPage[];
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
