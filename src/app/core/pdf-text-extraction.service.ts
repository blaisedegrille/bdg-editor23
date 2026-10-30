import { Injectable } from '@angular/core';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import type { PDFPageProxy } from 'pdfjs-dist';

import {
  ExtractedTextBlock,
  ExtractedTextDocument,
  ExtractedTextPage,
} from '../models/reading-document';

interface PdfTextLine {
  y: number;
  fontSize: number;
  bold: boolean;
  text: string;
  lastRight: number;
}

interface TextBlockDraft {
  lines: PdfTextLine[];
  fontSize: number;
  bold: boolean;
}

export type PdfTextContent = Awaited<ReturnType<PDFPageProxy['getTextContent']>>;

const ASSET_ROOT = 'assets/pdfjs/';

/** Extracts positioned PDF text and converts it to best-effort reader blocks. */
@Injectable({ providedIn: 'root' })
export class PdfTextExtractionService {
  async extract(
    file: Blob,
    documentId: string,
    onProgress: (percent: number) => void,
  ): Promise<ExtractedTextDocument> {
    const asset = (path: string) => new URL(`${ASSET_ROOT}${path}`, document.baseURI).href;
    GlobalWorkerOptions.workerSrc = asset('pdf.worker.min.mjs');
    const loadingTask = getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      cMapUrl: asset('cmaps/'),
      cMapPacked: true,
      standardFontDataUrl: asset('standard_fonts/'),
      wasmUrl: asset('wasm/'),
      enableXfa: false,
    });

    try {
      const pdf = await loadingTask.promise;
      const pages: ExtractedTextPage[] = [];
      for (let pageIndex = 0; pageIndex < pdf.numPages; pageIndex++) {
        const page = await pdf.getPage(pageIndex + 1);
        pages.push(this.convertPage(pageIndex, await page.getTextContent()));
        onProgress(Math.round(((pageIndex + 1) / pdf.numPages) * 100));
      }
      return { documentId, extractedAt: new Date().toISOString(), pages };
    } finally {
      await loadingTask.destroy();
    }
  }

  convertPage(
    pageIndex: number,
    content: PdfTextContent,
  ): ExtractedTextPage {
    const lines: PdfTextLine[] = [];
    let line: PdfTextLine | null = null;
    let previousHadEol = false;

    for (const item of content.items) {
      if (!('str' in item) || !item.str) continue;
      const x = item.transform[4];
      const y = item.transform[5];
      const fontSize = Math.max(1, Math.abs(item.transform[3]) || item.height || 12);
      const bold = /bold|black|heavy|demi/i.test(item.fontName ?? '');
      const sameLine = line !== null
        && !previousHadEol
        && Math.abs(line.y - y) <= Math.max(2, fontSize * 0.35);

      if (!sameLine) {
        if (line?.text.trim()) lines.push(line);
        line = { y, fontSize, bold, text: '', lastRight: x };
      }

      const gap = line!.text ? x - line!.lastRight : 0;
      const separator = line!.text && gap > fontSize * 0.18 ? ' ' : '';
      line!.text += `${separator}${item.str}`;
      line!.fontSize = Math.max(line!.fontSize, fontSize);
      line!.bold ||= bold;
      line!.lastRight = x + item.width;
      previousHadEol = Boolean(item.hasEOL);
      if (item.hasEOL && line!.text.trim()) {
        lines.push(line!);
        line = null;
        previousHadEol = true;
      }
    }
    if (line?.text.trim()) lines.push(line);
    if (!lines.length) return { pageIndex, text: '', blocks: [] };

    const sizes = lines.map((item) => item.fontSize).sort((a, b) => a - b);
    const bodySize = sizes[Math.floor(sizes.length / 2)] || 12;
    const drafts: TextBlockDraft[] = [];
    let current: TextBlockDraft | null = null;
    let previous: PdfTextLine | null = null;

    const finish = (): void => {
      if (current?.lines.length) drafts.push(current);
      current = null;
    };

    for (const textLine of lines) {
      const text = textLine.text.trim();
      if (!text) continue;
      const heading = textLine.fontSize >= bodySize * 1.2 && text.length < 140;
      const gap = previous ? Math.abs(previous.y - textLine.y) : 0;
      if (current && (gap > Math.max(bodySize * 1.65, 10) || heading)) finish();
      current ??= { lines: [], fontSize: 0, bold: false };
      current.lines.push(textLine);
      current.fontSize = Math.max(current.fontSize, textLine.fontSize);
      current.bold ||= textLine.bold;
      previous = textLine;
    }
    finish();

    let offset = 0;
    const blocks: ExtractedTextBlock[] = drafts.map((draft, index) => {
      const text = draft.lines.map((item) => item.text.trim()).join(' ');
      const startOffset = offset;
      const endOffset = startOffset + text.length;
      offset = endOffset + (index < drafts.length - 1 ? 2 : 0);
      return {
        id: `${pageIndex}-${index}`,
        kind: draft.fontSize >= bodySize * 1.2 && text.length < 140
          ? 'heading'
          : 'paragraph',
        text,
        startOffset,
        endOffset,
        fontSizeRatio: Math.max(0.9, Math.min(1.7, draft.fontSize / bodySize)),
        bold: draft.bold,
      };
    });

    return {
      pageIndex,
      text: blocks.map((block) => block.text).join('\n\n'),
      blocks,
    };
  }
}
