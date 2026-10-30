# 📚 BDG Editor 23

> A modern writing workspace built with Angular 22 — draft with Editor.js, keep
> everything saved locally, and publish to Firebase when you are ready.

![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black)
![Tests](https://img.shields.io/badge/tests-Karma%20%2F%20Jasmine-C2185B)

BDG Editor 23 is a single-page application for writing and managing articles. It
combines Firebase Authentication, a local-first article store and a block-based
Editor.js canvas, wrapped in an Angular Material 3 interface that follows your
light or dark theme.

## ✨ Features

- **Email and password authentication** powered by Firebase Auth, including
  email verification and password reset.
- **Personal profile** with account details, verification status and writing
  statistics.
- **Three interface languages** — English, German and Hungarian — switchable
  from the profile. The choice applies to the whole app instantly, is cached on
  the device and is synced to `users/{uid}.language` in Firestore.
- **Inline password change** in the profile’s Security card, with current-password
  reauthentication and client-side validation.
- **Collapsible navigation** that closes the menu automatically after a section
  is selected.
- **Home workspace** that greets you, surfaces quick actions and lists every
  draft and published article.
- **Editor.js canvas** with paragraph, heading and ordered/unordered list
  blocks. Create a new article or revisit an existing one at `/editor/:id`.
- **Local-first drafts** stored per user in `localStorage`, so saving works
  offline and nothing is lost if Firebase is unreachable.
- **Publishing to Firestore** under `users/{uid}/articles/{id}`, with a graceful
  fallback that keeps the local draft when a publish fails.
- **Article reader** at `/articles/:id` with a custom block renderer.
- **Two PDF reading experiences**: `/read` displays the original PDF with
  `ngx-extended-pdf-viewer`; **Read & Highlight (Text)** at `/read-text` extracts
  PDF text with PDF.js and presents reflowable, selectable text. Both share
  documents and notes; their highlight data stays separate. Extracted text is
  cached locally, not uploaded to Firebase. PDF layout reconstruction is best
  effort; scanned/image-only PDFs need OCR and are not supported yet.
- **Light and dark themes** driven by Angular Material system tokens.

## 🧱 Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Angular 22 — standalone components, signals, `ChangeDetectionStrategy.Eager` |
| UI | Angular Material 3 |
| Editor | Editor.js with the header and list tools |
| PDF text extraction | Mozilla PDF.js (`pdfjs-dist`) |
| Backend | Firebase Auth + Cloud Firestore |
| Async | RxJS |
| Tests | Karma + Jasmine |

## 🚀 Quick start

The project targets Node.js 24 (see `.nvmrc`).

```bash
nvm use
npm ci
npm start
```

Open [http://localhost:4200](http://localhost:4200). The app starts at the home
workspace once you are signed in, and redirects guests to the sign-in page.

### Firebase web config

The Firebase web app configuration is **not committed**. It is written to the
gitignored `src/environments/environment.ts` by `npm run config:firebase`, which
runs automatically before `start`, `build`, `watch` and `test`.

For local development, save the JSON shown in the Firebase console under
*Project settings → Your apps → SDK setup and configuration* as
`firebase.web-config.local.json` in the repository root (also gitignored):

```json
{
  "apiKey": "…",
  "authDomain": "bdg-editor.firebaseapp.com",
  "projectId": "bdg-editor",
  "storageBucket": "bdg-editor.appspot.com",
  "messagingSenderId": "…",
  "appId": "…",
  "measurementId": "…"
}
```

Alternatively export the same JSON as `FIREBASE_WEB_CONFIG`; the environment
variable takes precedence over the local file. Without either one the generator
falls back to `src/environments/environment.example.ts`, so the project still
compiles and the unit tests run, but sign-in and cloud publishing are disabled
until real values are supplied. `ng serve`/`ng build`/`ng test` invoked directly
require the generated file, so run `npm run config:firebase` once after cloning.

## 🛠 Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the development server |
| `npm run build` | Create a production build in `dist/bdg-editor23/browser` |
| `npm run watch` | Rebuild on changes in development mode |
| `npm test` | Run the unit tests with Karma in watch mode |
| `npm run config:firebase` | Generate the gitignored Firebase environment file |
| `npm run test:config` | Unit-test the config generator with Node's test runner |

## 🔥 Firebase setup

Publishing writes to the `users/{uid}/articles/{id}` subcollection. Read &
Highlight stores local-only PDFs in browser IndexedDB. If you want to upload PDFs
to your account, first create/enable a Firebase Storage bucket in the Firebase
console. Cloud PDFs are stored in Storage; per-user metadata, highlights, and
notes live in Firestore. Each selected file is limited to 50 MB, and cloud
upload is an explicit choice.

Deploy the included Firestore and Storage security rules before using cloud
publishing or PDF uploads:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules,storage
```

The rules only allow each signed-in user to access their own profile, articles,
reading metadata, notes, annotations, and PDFs. Deploying replaces the rules
currently configured in the console — merge them if the project uses other
collections. Local-only PDFs never leave the browser; cloud documents are
available to the same account on other devices.

## 🗂 Project structure

```text
src/app/
├── core/       Firebase setup, auth, i18n, guards, article + reading services
├── models/     Typed domain models and article/reading helpers
├── pages/      Routed screens: home, profile, editor, reader, articles, auth
├── service/    Local-first article store
├── shared/     Reusable UI such as the article renderer and auth card
└── testing/    Spec stubs and fixtures
```

## 🧪 Testing and building

Run the full suite once in a headless browser:

```bash
CHROME_BIN=/usr/bin/google-chrome npx ng test --watch=false --browsers=ChromeHeadless
```

Build for production:

```bash
npx ng build --configuration production
```

The build output is written to `dist/bdg-editor23/browser`.

## 🚢 Deployment and CI

Hosting is configured in `firebase.json` and deployed by two GitHub Actions
workflows:

- **Merge to `main`** → `firebase-hosting-merge.yml` deploys the live channel.
- **Pull request** → `firebase-hosting-pull-request.yml` deploys a preview
  channel and comments the preview URL on the PR.

Both workflows authenticate with the `FIREBASE_SERVICE_ACCOUNT_BDG_EDITOR`
repository secret. The preview workflow requests `checks: write`,
`contents: read` and `pull-requests: write` so the action can create the
**Deploy Preview** check and post its comment.

Deploys also need a second repository secret, `FIREBASE_WEB_CONFIG`, containing
the same web app JSON described above. Both workflows run
`npm run config:firebase -- --strict` before building, so a missing secret or
placeholder values fail the job instead of deploying an app that cannot sign in.
Rotate it in *Settings → Secrets and variables → Actions*.

> Firebase **web** config is public client configuration: it is compiled into the
> shipped JavaScript and visible to every browser. Keeping it out of the
> repository is hygiene, not secrecy. Protect the project with restrictive
> Firestore rules and by restricting the API key to the app's domains and the
> APIs it uses in Google Cloud Console.

## 📝 Notes

The project was originally scaffolded with Angular CLI 16.2.6 and has since been
upgraded to Angular 22. Local drafts are stored under
`bdg-editor23.articles.v1.<uid>`; published copies live in Firestore at
`users/<uid>/articles/<id>`. The language preference is cached in
`localStorage` under `bdg-editor23.language.v1` and mirrored to the user’s
Firestore document; the account value wins when it can be loaded.

The language layer is a small runtime dictionary in
`src/app/core/i18n/`. Add a key to `translations/en.ts` first, then translate it
in `de.ts` and `hu.ts` — both files are typed against the English keys, so the
build fails until every language is complete.
