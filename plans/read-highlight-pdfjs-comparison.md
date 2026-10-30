# Read & Highlight — Extracted-Text Reader

## Goal and clarified requirement

Keep the existing **Read & Highlight** page at `/read` with
`ngx-extended-pdf-viewer` unchanged. Add a second authenticated menu/page that
uses PDF.js only to extract a PDF's text, then presents that content as readable,
reflowable text. The new page is **not a PDF viewer**: it must not display PDF
page canvases, PDF page images, text overlays over PDF pages, or viewer controls.

- Existing experience: `/read` — PDF viewer.
- New experience: `/read-text` — formatted text reader.
- New menu label: **Read & Highlight (Text)**.
- Users select text in the reading view and can highlight it, add a note/comment,
  search the selection, or copy it.

Use `pdfjs-dist` as a PDF parser/text extractor, not as a view layer. “Formatted
text” means readable paragraphs and best-effort headings, not pixel-perfect
reproduction of the PDF layout.

## Existing application context

- Angular 22 standalone app; guarded routes are in `src/app/app.routes.ts` and
  workspace navigation in `src/app/app.component.ts`.
- The existing `/read` page uses `ngx-extended-pdf-viewer` and must continue to
  work unchanged.
- Local/cloud document identity, PDF upload/download, shared notes, Auth, and
  owner-scoped Firebase Storage/Firestore services already exist.
- `ReadingLibraryService` uses IndexedDB for local documents, PDF Blobs, notes,
  and existing ngx annotations.
- UI strings are maintained in English, German, and Hungarian.

## Extraction and formatting approach

Use direct `pdfjs-dist` `getDocument()`, `PDFPageProxy.getTextContent()`, and a
matching patched worker. The new page must not import any ngx viewer components
or services. Copy worker, CMaps, standard-font, and WASM assets to a distinct
`assets/pdfjs/` path as needed; lazy-load the route.

PDFs generally store positioned glyphs, not semantic paragraphs/headings or
reliable reading order. Convert text items (`str`, `hasEOL`, font, transform,
spacing) into app-owned extracted pages:

- respect PDF.js source item order and end-of-line hints;
- group nearby items into lines, then paragraphs using spacing heuristics;
- infer headings from strong font-size/style differences only;
- retain every extracted text item and a source PDF page index;
- when layout inference is uncertain, preserve source order instead of silently
  reordering or discarding text.

Treat columns, tables, headers/footers, hyphenation, and unusual encodings as
best-effort. Show a clear message when no text can be extracted. Scanned/image-
only PDFs need OCR, which is out of scope for this release.

## Text model, highlights, and notes

Cache extracted text locally in IndexedDB. Do not upload extracted text to
Firestore; for a cloud PDF on another device, download the original from Firebase
Storage, extract there, and cache locally.

```ts
interface ExtractedTextBlock {
  id: string;
  kind: 'paragraph' | 'heading';
  text: string;
  startOffset: number;
  endOffset: number;
  fontSizeRatio: number;
  bold: boolean;
}

interface ExtractedTextPage {
  pageIndex: number;
  text: string; // blocks joined with stable explicit separators
  blocks: ExtractedTextBlock[];
}

interface TextHighlight {
  id: string;
  documentId: string;
  pageIndex: number;
  startOffset: number;
  endOffset: number;
  quote: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}
```

Render the extracted blocks as selectable DOM text. Each rendered segment exposes
its canonical page-text offset. Convert a browser `Range` selection to page-local
start/end offsets; persist offsets and quote, never viewport pixels or PDF
coordinates. Split formatted text blocks at search/highlight boundaries when
rendering so highlights survive font-size and width changes.

Share document metadata/files and notes with `/read`. Keep legacy ngx
`annotations` and geometry-based `pdfjsHighlights` untouched; store new offset-
based highlights separately in IndexedDB and in the owner-scoped Firestore
`textHighlights` subcollection. Notes may include optional offsets/highlight IDs,
but remain readable in both pages.

## User experience

- Add a separate **Read & Highlight (Text)** nav entry and lazy, guarded
  `/read-text` route; preserve `/read` and its label.
- Both pages can switch to the other reader with a `documentId` route query
  parameter, opening the same local/cloud source without duplicating the PDF.
- Reuse the existing document picker/list, local-only or explicit cloud-upload
  choice, progress, delete behavior, and notes.
- Display extracted content in a comfortable reading column with paragraph
  spacing, best-effort headings, page/source cues, and text-size controls.
- Navigate through extracted source pages/sections. Search all extracted text
  and navigate to each matching offset/page.
- Selecting text opens an accessible action menu: **Highlight**, **Add note**,
  **Add comment**, **Search selection**, and **Copy**.
- Notes/comments preserve the selected quote and source page, can be edited or
  deleted, and navigate to their source. Highlights can be removed.
- Render the active extracted page/section rather than one enormous DOM for a
  long document. No PDF page canvas or PDF viewer toolbar is present on this
  page.

## Persistence and security

- Upgrade IndexedDB safely, preserving documents, original PDF Blobs, shared
  notes, and existing ngx annotations. Add `extractedText` and `textHighlights`
  stores; keep the previous `pdfjsHighlights` store for compatibility.
- Cache extracted text locally only. Re-extract from the original PDF on another
  device; do not store extracted text or PDF bytes in Firestore.
- Local-only highlights stay in IndexedDB. Cloud text highlights sync to
  `users/{uid}/readingDocuments/{docId}/textHighlights/{highlightId}`. Preserve
  local pending changes and retry sync instead of silently discarding them.
- Extend Firestore rules only for owner access to the new `textHighlights`
  child collection. Keep PDF uploads in Firebase Storage with existing owner
  rules and the 50 MB limit.
- Do not log extracted content or note bodies. Keep PDF.js scripting disabled
  where supported; pin a security-patched `pdfjs-dist` version and matching
  worker.

## Implementation phases

### 1. Extraction spike

- Confirm the worker and extraction assets work with Angular 22 in dev and
  production builds.
- Inspect normal, multi-column, rotated, ligature-heavy, and scanned samples.
- Verify paragraph grouping is conservative and Range selections map accurately
  back to canonical text offsets.

### 2. Parallel page and shared document flow

- Add `/read-text` and its separate nav entry; keep `/read` unchanged.
- Add bidirectional links passing `documentId` to open the same source.
- Reuse local/cloud document storage and notes; add IndexedDB v3 stores/migration
  tests for extracted text and text-offset highlights.

### 3. Extraction, reading, and search

- Implement a `PdfTextExtractionService` using PDF.js `getTextContent()` with
  extraction progress and conservative text-to-block formatting.
- Cache extracted pages locally and display them as reflowable selectable text.
- Add page/section navigation, search, result navigation, text sizing, empty-text
  and loading/error states. Keep the rendered DOM bounded for long documents.

### 4. Selection actions and persistence

- Add selection-to-offset mapping and the action menu.
- Persist and render text-offset highlights; share notes/comments with the
  existing reader.
- Add owner-scoped cloud highlight sync and retry behavior without changing
  existing ngx annotation data.

### 5. QA and rollout

- Test the same local and cloud documents in both pages and confirm notes/files
  are shared while highlight formats remain isolated.
- Test extraction/cache, headings/paragraphs, search, cross-block selections,
  highlight restore, note navigation, IndexedDB migration, reloads, cloud errors,
  keyboard/accessibility, mobile, and EN/DE/HU.
- Test updated Firestore rules in an emulator/project before deployment.

## Acceptance criteria

1. `/read` remains the existing PDF viewer. `/read-text` is a separate menu/page
   that displays extracted text only; it has no PDF canvas/page viewer.
2. Either page opens the same stored PDF without another upload. Cloud upload
   stays explicit; local-only documents remain local.
3. `/read-text` displays selectable reflowed text with page/source cues and
   best-effort paragraphs/headings. Image-only PDFs show an unsupported/no-text
   message rather than a blank page.
4. Search finds extracted text and navigates to matching pages/offsets.
5. Selecting text supports highlight, note, comment, search selection, and copy.
   Highlights persist by page-local offsets through reload and reflow.
6. Notes are shared between readers. Text highlights do not modify ngx
   annotation records.
7. Extracted text is cached locally and can be regenerated from cloud PDFs on
   another device; neither extracted text nor PDF bytes go into Firestore.
8. IndexedDB migration preserves existing documents, Blobs, notes, and ngx
   annotations; owner-only Firestore rules cover text highlights.

## Estimate and limitations

- Local-first MVP: roughly **3–5 working days** for extraction, reflowed reading,
  search, selection/highlighting, and notes.
- Polished cloud-enabled release with migration, sync retry, accessibility,
  large-document behavior, and multilingual QA: roughly **5–8 working days total**.
- PDF extraction is not semantic parsing; complex tables/columns may need
  cleanup. OCR and faithful original layout reconstruction are separate work.
- Cloud PDFs still use the existing whole-Blob download path and the 50 MB limit
  until range/streaming is designed.
