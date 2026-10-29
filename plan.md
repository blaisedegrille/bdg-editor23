# Read and Highlight — Feature Plan

## Goal

Add a signed-in **Read & Highlight** area where a user can open a long document,
read it comfortably, search within it, select text, and act on that selection:

- highlight the selected passage;
- save the passage to notes;
- search for the selected passage in the document;
- optionally copy the passage.

PDF is the first-class format for the MVP. The design should allow other text
formats to be added later without rebuilding the annotation and notes model.

## Current app context

- Angular 22 standalone application with guarded routes in `src/app/app.routes.ts`.
- Workspace navigation lives in `src/app/app.component.ts` and
  `src/app/app.component.html`.
- UI strings are maintained in English, German, and Hungarian dictionaries.
- User-owned data follows a local-first pattern; article data currently uses
  `localStorage`, while cloud services use Firestore.
- PDFs and potentially very large documents should **not** be stored in
  `localStorage` or as Firestore document fields.

## SDK / implementation recommendation

Start with a short integration spike for **`ngx-extended-pdf-viewer`**, which
wraps Mozilla's PDF.js and supplies an Angular viewer UI. Its current project
documentation describes Angular 19–22 support and built-in PDF text selection,
search, highlighting/annotation editing, and annotation APIs. This is a better
starting point than implementing PDF page rendering, text layers, search, and
annotation geometry from scratch.

The lower-level option is **`pdfjs-dist`**, Mozilla PDF.js's JavaScript PDF
engine with TypeScript declarations. It can parse/render PDF pages and expose
selectable text layers, but it is not a ready-made Angular reading experience:
the application would need to build most of the viewer UI, search interaction,
selection actions, highlight persistence, and page virtualization itself.

Use the wrapper only after a small compatibility spike confirms that the
Angular 22 app can:

1. render a local PDF with selectable text;
2. search and navigate to matches;
3. create, export, and restore a highlight;
4. expose the selected snippet and page to the app's custom action menu;
5. render a long PDF without loading every page's DOM at once.

Pin a compatible version and check its bundle size, worker/assets setup, license,
and browser-test compatibility. If the wrapper cannot provide stable APIs for
selection actions or annotation restore, use it for rendering/search and add a
small app-owned selection/annotation layer. Prefer raw `pdfjs-dist` only if the
spike finds the wrapper too restrictive.

## MVP assumptions / scope

- Users can import a PDF in either **local-only** mode or choose to **upload it
  to their account**. Local-only is the privacy-preserving option; cloud upload
  must be an explicit user action, never an automatic upload.
- Store local-only PDF files as `Blob`s in **IndexedDB**, not in `localStorage`
  or Firestore. This allows reopening a large file after a refresh without
  uploading it. Show storage/quota errors clearly and let the user remove it.
- For cloud documents, store the PDF binary in **Firebase Storage**, with
  per-user metadata, highlights, and notes in **Firestore**. Firestore is for
  metadata/annotations, not PDF bytes. Enforce per-user access in both Firestore
  and Storage rules, and handle upload progress, failure, deletion, and limits.
- Store local document metadata/annotations in IndexedDB. Cloud documents may
  also be cached in IndexedDB for reading/offline work; define an explicit sync
  status and conflict policy rather than silently treating local and cloud
  documents as the same storage mode.
- MVP supports text-based/digital PDFs. Scanned/image-only PDFs need OCR and are
  out of scope until separately prioritized.
- No sharing in the MVP. Clearly identify local-only versus cloud-backed
  documents. Explain that local-only documents and annotations are
  browser/device-specific, while cloud-backed documents are tied to the signed-in
  account and available on other devices.
- Reading/search/highlight/notes must work on long documents without rendering
  every page simultaneously; virtualize or incrementally render pages.

## User experience

### Read page and document flow

- Add an authenticated `/read` page and a **Read & Highlight** workspace-nav
  entry, translated in EN/DE/HU.
- The page starts with an accessible PDF picker/drop area and a recent-documents
  list. After choosing a PDF, let the user open it locally or explicitly upload
  it to their account. Validate PDF type/size, provide read/upload progress, and
  report corrupt, password-protected, unsupported, network, and storage-quota
  errors.
- Opening a document shows its name, reading area, page navigation/progress,
  search control, and access to saved notes/highlights.
- Provide a clear way to return to the document list and remove a local document
  and its local annotations. For cloud documents, confirm deletion and remove
  the Storage object plus its Firestore metadata/annotations.

### Search and selection actions

- Search text across the whole PDF; show match count and next/previous controls,
  and navigate to the page/match when selected.
- Selecting text opens a compact, keyboard-accessible action menu near the
  selection, with **Highlight**, **Save to notes**, **Search selection**, and
  **Copy** actions.
- Preserve ordinary browser/viewer text selection. Dismiss the menu on Escape,
  outside click, or selection collapse; do not obscure the selected passage.
- Highlight selected text, allow changing its color and removing it, and restore
  highlights when the document is reopened.
- Saving a note retains the selected quote and page, with an optional user note.
  Show saved notes in a side panel/list and allow opening the source page.
- Search selection fills the document search and moves to the relevant match.

### Accessibility and responsive behavior

- Support keyboard navigation and visible focus for upload, page controls,
  search, selection actions, notes, and dialogs.
- Give controls accessible names; announce loading/search result changes with
  suitable live regions; maintain adequate contrast in highlight colors.
- Test desktop and mobile layouts, including touch selection and a menu that
  does not rely solely on hover.

## Data model proposal

Keep the original PDF as a Blob in IndexedDB. Use stable document IDs and
versioned records so storage can evolve:

```ts
interface ReadingDocument {
  id: string;
  name: string;
  mimeType: 'application/pdf';
  sizeBytes: number;
  storageMode: 'local' | 'cloud';
  // IndexedDB key for local/cached Blob; Firebase Storage path for cloud files.
  storageKey?: string;
  addedAt: string;
  lastOpenedAt: string;
  pageCount?: number;
}

interface ReadingHighlight {
  id: string;
  documentId: string;
  pageIndex: number;
  quote: string;
  color: string;
  // Viewer/PDF page-space annotation payload, or normalized page rectangles.
  geometry: unknown;
  createdAt: string;
}

interface ReadingNote {
  id: string;
  documentId: string;
  pageIndex: number;
  quote: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}
```

Finalize `geometry` after the viewer spike. Prefer the viewer's supported
annotation export/restore format. If an app-owned overlay is necessary, persist
PDF-page-relative rectangles (not viewport pixel positions) plus the quote and
nearby context, so highlights survive zoom and window resizing. Do not rely on
DOM character offsets alone; PDF text-layer markup can change between renders.

Use IndexedDB object stores for local document metadata, PDF Blobs, cached cloud
files, highlights, and notes. Cloud metadata/annotations also sync to Firestore;
PDF Blobs upload/download through Firebase Storage. Add schema/version migration
handling and per-document cleanup. Do not persist a transient `Selection` or
DOM `Range` object.

## Implementation phases

### Phase 0 — Viewer and API spike

- Install/test `ngx-extended-pdf-viewer` in a disposable branch or isolated
  prototype; confirm Angular 22 compatibility and required worker/assets config.
- Test text selection, multi-line selection, built-in find, highlight creation,
  annotation serialization/restore, event hooks for selected text/page, and
  long-document rendering.
- Decide whether the viewer's annotation model is sufficient for persistent
  highlights and whether the app can anchor notes to it.
- Record package version, licensing, bundle impact, and the chosen public APIs.

### Phase 1 — Route, shell, and document persistence

- Add standalone Read & Highlight page and `/read` (and, if useful,
  `/read/:documentId`) guarded routes.
- Add the translated navigation entry and all EN/DE/HU labels.
- Implement PDF validation, an IndexedDB service for local files, and a
  repository boundary for local/cloud document sources.
- Add explicit cloud upload and progress states using Firebase Storage, plus
  Firestore metadata/annotation persistence and owner-only security rules.
- Build recent-document, loading, empty, error, sync-status, and delete states.

### Phase 2 — Reader and search

- Integrate the selected PDF viewer with selectable text, page navigation, and
  document-wide search.
- Keep page rendering incremental/virtualized for long documents.
- Test progress, zoom, scrolling, errors, and responsive layout.

### Phase 3 — Selection actions, highlights, and notes

- Add the selection action menu and wire Highlight, Save to notes, Search
  selection, and Copy.
- Persist and restore highlights/notes by document and page; sync records for
  cloud-backed documents and retain local-only records in IndexedDB.
- Implement note listing, editing/deletion, source navigation, and cleanup when
  a document is removed.

### Phase 4 — Quality, security, and sync

- Add unit tests for storage and annotation mapping, and component tests for
  route states, search, menu actions, and errors.
- Add manual/automated checks for large PDFs, selection across lines, reload
  persistence, zoom/resize, keyboard use, mobile, and EN/DE/HU layouts.
- Verify local-only PDFs never leave the browser; cloud upload is explicit. Do
  not log document text or notes, and explain the storage mode to the user.
- Test Firebase Storage/Firestore security rules to verify users can only access
  their own uploaded PDFs and annotations. Never place PDF bytes in Firestore.

## Acceptance criteria

- A signed-in user can open `/read`, import a valid text-based PDF, choose
  local-only or explicit cloud upload, and reopen it after refreshing the app.
- Local-only documents never upload to Firebase. Cloud-backed documents are
  available to the same signed-in user on another device with their highlights
  and notes.
- Long PDFs can be read and searched without rendering all pages at once or
  freezing the UI.
- Search navigates through document matches and reports when no results exist.
- Selecting a passage exposes the requested actions; highlights and notes are
  tied to the correct document/page and persist across reloads.
- Highlights remain positioned correctly after zoom, resizing, and reopening.
- Users can open a note's source location, edit/delete notes, and delete a
  document with its local data or cloud object and metadata.
- Local-only PDFs are never uploaded. Cloud upload is explicit, access is
  owner-restricted, and network/storage failures are communicated without
  silently losing a PDF, highlight, or note.
- Tests cover storage, reader states, search/action behavior, and annotation
  restore; the feature passes keyboard/accessibility and mobile checks.

## Decisions to confirm before implementation

1. The plan defaults to choosing local-only or cloud upload for each imported
   PDF. Would you also like a settings default for future imports?
2. Should the MVP support PDFs only, or also plain text/Markdown files?
3. Are scanned PDFs that require OCR needed now, or can they be deferred?
4. Is `ngx-extended-pdf-viewer` acceptable if the spike validates its Angular 22
   fit, or do you prefer the lower-level PDF.js integration and custom UI?

## References

- Mozilla PDF.js: https://mozilla.github.io/pdf.js/
- Angular PDF.js viewer candidate: https://github.com/stephanrauh/ngx-extended-pdf-viewer
- Current app routes: `src/app/app.routes.ts`
- Current app navigation: `src/app/app.component.ts`
- Current local-first storage pattern: `src/app/service/article.service.ts`
- Current translations: `src/app/core/i18n/translations/{en,de,hu}.ts`
