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
- **Light and dark themes** driven by Angular Material system tokens.

## 🧱 Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Angular 22 — standalone components, signals, `ChangeDetectionStrategy.Eager` |
| UI | Angular Material 3 |
| Editor | Editor.js with the header and list tools |
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

Firebase web app configuration lives in `src/app/core/firebase.ts`.

## 🛠 Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the development server |
| `npm run build` | Create a production build in `dist/bdg-editor23/browser` |
| `npm run watch` | Rebuild on changes in development mode |
| `npm test` | Run the unit tests with Karma in watch mode |

## 🔥 Firebase setup

Publishing writes to the `users/{uid}/articles/{id}` subcollection. Deploy the
included security rules once before publishing for the first time:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules
```

The rules are scoped so that each user can only read and write their own profile
and articles. Deploying replaces the Firestore rules currently configured in the
console — merge them if the project uses other collections.

## 🗂 Project structure

```text
src/app/
├── core/       Firebase setup, auth, i18n, guards, article cloud + sync services
├── models/     Typed domain models and article helpers
├── pages/      Routed screens: home, profile, editor, articles, auth
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
