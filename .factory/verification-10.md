# Independent verification 10 — PASS

**Work order:** `gridsong-verify-10`
**Candidate commit:** `6b270943fc26d9fc0e312da6ec8d6c1047a0896a`
**Live URL:** <https://gridsong.sociobot.in>
**Verified:** 2026-09-02

## Release decision

**PASS.** The deployed product matches the candidate and satisfies the researched classroom-composition job end to end: a teacher can make a board, a separate student browser can submit a nickname-only song, and the teacher board receives and can remove it. The sequencer saves locally, creates complete links, exports WAV/MIDI, works offline after caching, and has a genuine isolated sample demo.

No release-blocking defects were found.

## Mandatory claims and cold read

`.factory/claims.json` is present and declares 26 observable checks. From a clean dependency install, I executed every declared command individually. All passed:

`demo-sandbox`, `local-save`, `browser-exports`, `complete-song-links`, `offline-reload`, `privacy-local-demo`, `privacy-technical-footprint`, `no-account-backup`, `classroom-sequencer`, `composer-settings`, `instrument-choices`, `keyboard-grid`, `audio-user-gesture`, `developer-runtime`, `gallery-direct-submit`, `student-pass-submit-only`, `teacher-key-browser`, `gallery-submission-data`, `gallery-record-schema`, `gallery-retention`, `gallery-expiry-cleanup`, `teacher-removes-submissions`, `gallery-capacity`, `mobile-390`, `unknown-route-recovery`, and `documentation-claims-inventory`.

Cold live first read at 390×844 passed. The first screen says **“Make classroom songs together,”** names **“K–8 music teachers and students,”** and offers **“Try it with sample data”** with the result **“Opens a four-bar rhythm in a private demo.”** It has no horizontal overflow. The action opens `/demo#composer`, which shows the persistent **“Demo — sample data, nothing is saved”** banner and isolates the sample storage.

## Quality evidence

| Check | Result |
| --- | --- |
| `npm ci` and `npm --prefix api ci` | PASS; clean installs, 0 vulnerabilities reported |
| `npm test` | PASS; 13 tests |
| `npm run test:api` | PASS; 14 tests |
| `npm run build` | PASS; TypeScript check and production `dist/` |
| `npm run test:e2e` | PASS; 52 desktop/390px browser tests, no failed tests |
| `GRIDSONG_LIVE_URL=https://gridsong.sociobot.in npx playwright test tests/live.spec.ts` | PASS; 8 live desktop/390px tests |
| `npm run test:live` | PASS; live Function smoke, gallery flow, and 3 atomic capacity trials |
| `/opt/fleet/lib/verify-url.sh https://gridsong.sociobot.in` | PASS; 200, title/lang/one h1/main/alt checks, no console errors |

There is no lint script/configuration; `npm run build` includes the available TypeScript type check.

The built application is 37.86 KB JavaScript (12.84 KB gzip) and 17.64 KB CSS (4.81 KB gzip), below the static-product budgets. The self-hosted hero image is 81.17 KB.

## Product and recovery checks

- Demo keyboard use passed: Space changes a note and ArrowRight moves grid focus. Reduced-motion live coverage found no note transition movement.
- On live `/demo`, chromatic scale, four octaves, 64 bars, and 200 BPM rendered the documented 800-cell one-bar grid. Both exports downloaded successfully as `morning-call-and-response.mid` and `.wav`.
- A malformed `#song=not-valid-base64` link showed “That song link got tangled…” and recovered to a usable fresh 256-cell song.
- Live two-browser teacher → student submission → projector receipt → teacher removal passed.
- API malformed input returned 400 and `Cache-Control: no-store`. The documented board allowance is **120 songs**: each of three live trials persisted 120 concurrent submissions and refused the additional submission with **429** and numeric **`Retry-After: 60`**.

## Privacy, accessibility, deployment, and caching

- A fresh live cold/demo request log contained only `https://gridsong.sociobot.in` HTML, JS, CSS, and image requests; no third-party requests, cookies, analytics, or console/page errors appeared.
- Playwright Axe WCAG 2 A/AA and 2.1 A/AA scans passed with zero violations on the live demo and 404 at desktop and 390px. Keyboard skip links move focus to `main`; grid controls are keyboard-operable; mobile has no page-level overflow.
- The service-worker test confirmed an active, non-waiting worker after reload and a usable offline `/demo` reload with 256 grid cells.
- `/`, `/demo`, `/privacy/`, and `/terms/` return 200; an unknown route returns the designed 404. Responses provide HSTS, `nosniff`, strict-origin referrer policy, restrictive permissions policy, and same-origin CSP with response-header `frame-ancestors 'none'`. HTML caches for 30 seconds, `sw.js` is `no-cache`, and hashed JS is immutable for one year.
- Production parity is exact: local candidate `dist/index.html`, `index-kPtHWFEG.js`, `index-D8D1KR1h.css`, and `sw.js` SHA-256 values equal their live responses. `origin/main` also resolves to the tested candidate commit.

## Defects

None found during this verification.
