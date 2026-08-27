# Gridsong repair handoff

Work order: `gridsong-repair-2`
Completed: 2026-08-27

## What changed

- Replaced the manual `GS2T` copy/paste workaround with a same-origin class-gallery API. A teacher creates a board, shares a submit-only class pass, and students send a nickname plus compact song directly to that board. The projector polls while its gallery is open.
- Added the smallest Standard Azure Static Web Apps backend in `api/`: Azure Functions plus one Azure Table. The service stores only nickname, compact song, timestamps, and hashed teacher/student capabilities. It has 32-byte unguessable capabilities, strict compact-song and nickname validation, 36 KB request / 30 KB song bounds, short-lived request throttling, a 120-submission cap, teacher-only read/delete, immediate 90-day expiry rejection, and a daily expiry deletion sweep.
- Teacher capability remains only in that teacher browser’s local storage; the URL class pass contains only the submit capability and cannot read gallery entries.
- Replaced parser-derived malformed legacy song-link feedback with: “That song link got tangled. You can start a fresh song or ask for a new link.”
- Preserved browser-local composition, MIDI/WAV export, keyboard sequencing, and offline shell behavior. The service worker now explicitly never caches `/api/` data and announces a waiting app update.
- Updated README, privacy, and terms for the direct 90-day service. Added native 192/512 PWA icons rendered from the hand-authored SVG and versioned the manifest start URL/cache.

## Run and verify

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm --prefix api ci
node --check api/src/functions/gallery.js
```

Verified in this checkout:

- `npm test`: 9 passing.
- `npm run build`: passing; initial JavaScript is 33.83 KB (11.89 KB gzip) and CSS is 16.31 KB (4.54 KB gzip), inside budget.
- Playwright’s direct two-browser submission → projector collection → expiry-recovery test passes on desktop and mobile (2/2). The offline reload/mobile-frame slice passes (3/3 plus one intentional desktop skip); axe, MIDI, WAV, and keyboard slices also passed in the same checkout. `npm run test:e2e` is the single full-suite CI command.
- API dependencies install without vulnerabilities and `node --check` passes.

## Deployment

Deploy `dist/` and `api/` as an Azure Static Web Apps **Standard** app. Configure the Function setting `GALLERY_STORAGE_CONNECTION` with a least-privilege Azure Storage connection for the `gridsonggalleries` table; `AzureWebJobsStorage` is used as a managed fallback. Do not put this value in source control. The existing self-only CSP permits the same-origin `/api` calls.

## Known operational note

This disposable repair environment has no Azure subscription or SWA secret, so it cannot create the storage account or confirm the live Function setting. The code is committed for the factory deployment path; the deployment owner must supply the one storage setting above. No user identity, account, analytics, or third-party service is introduced.
