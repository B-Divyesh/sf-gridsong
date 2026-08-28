# Independent verification 4 — FAIL

**Work order:** `gridsong-verify-4`
**Verified:** 2026-08-28
**Candidate commit:** `ce4ce5b0bcb576e76eb1a88bee08e8ae8eb41ee3`
**Live URL:** <https://gridsong.sociobot.in>

## Verdict

**FAIL.** The deployed static frontend is an exact build of the candidate and the local composer quality gates pass. However, the production same-origin gallery backend is non-functional: valid board creation, malformed input, gallery reads, and an unknown `/api` route all return `Backend call failure` with **HTTP 500**. The required teacher board → student submit → projector collection workflow cannot start in production.

This is fresh evidence, not a carry-over from verification 3. It improves on the earlier 405 only in that a backend is now reached; there is still no usable Function/storage service. The cross-device gallery is core to the researched brief's smallest useful product, so this is release-blocking.

## Defect: High — production gallery API is unavailable

**Expected:** `POST /api/galleries` accepts `{}` and returns `201` with teacher and submit-only student capabilities. Malformed JSON should return Function `400` with JSON, `Cache-Control: no-store`, and the documented security headers. A real board must then support separate-device submission, teacher read/delete, expiry, and polling.

**Actual, fresh production evidence:**

```text
POST /api/galleries  body: {       → 500  Backend call failure
POST /api/galleries  body: {}      → 500  Backend call failure
GET  /api/galleries/not-a-uuid     → 500  Backend call failure
GET  /api/nope                     → 500  Backend call failure
```

The response contains only `date`: no JSON content type, `no-store`, `nosniff`, referrer policy, or permissions policy. In a fresh desktop browser, **Class gallery** → **Create class board** showed “The class gallery could not finish that. Please try again.”, re-enabled the button, and logged the 500. No student pass exists, so live submit/read/delete, expiry, capacity, concurrency, and persistence cannot be exercised.

**Impact:** Teachers cannot make galleries and students cannot submit. The production README/privacy promises about a server-backed 90-day gallery are not currently deliverable.

**Required remediation:** Diagnose the deployed Azure Static Web Apps Function startup/backend binding and storage configuration; deploy a working API; then verify real create → separate-browser submit → teacher read/delete, malformed and unauthorized requests, 90-day expiry, limits, persistence, and concurrent submissions. Verify every Function error has JSON/no-store/security headers.

## Local quality gates

The checkout began clean at exactly the candidate SHA (Node `v22.23.2`, npm `10.9.8`, Chromium 151).

| Command/check | Result |
| --- | --- |
| `npm ci` | Passed; 58 packages, 0 vulnerabilities reported |
| `npm --prefix api ci` | Passed; 28 packages, 0 vulnerabilities reported |
| `npm test` | Passed: 9/9 Vitest tests |
| `npm run test:api` | Passed: 5/5 API validation/deployment-contract tests |
| `node --check api/src/functions/gallery.js` | Passed |
| `npm run build` | Passed: `tsc --noEmit && vite build`; generated `dist/` |
| `npx playwright test tests/app.spec.ts --workers=1` | Passed: 13 passed, 1 intentional desktop-only skip |
| `npm run test:live` | **Failed from the live defect**: expected malformed-request 400, received 500 |

There is no lint script; the production build includes the available TypeScript checking. The app browser suite covers desktop and 390×844 mobile, keyboard, downloads, an in-memory gallery mock, axe, and offline reload. That mock tests client behavior only and cannot establish live Function/storage health.

Build budgets pass: JS 33,830 B (11,890 B gzip), CSS 16,313 B (4,540 B gzip), and hero WebP 81,172 B. No third-party fonts are shipped.

## Independent product exercise

- Live MIDI (`my-night-market-song.mid`) and browser-rendered WAV (`my-night-market-song.wav`) downloads succeeded after a note was added. Empty MIDI export said “Add a note before exporting MIDI.”
- A fresh context selected chromatic, 64 bars, four octaves and 200 BPM, added a note, copied the song link, and opened it in a second page. It restored all values and the active note. The visible bar had 800 cells and showed `64 bars · 1 min 17 sec`. Unit tests cover the full valid maximum-grid compact URL round trip.
- Invalid `#song=not-valid-base64` stayed usable and announced plain-language recovery (“That song link got tangled… Starting a fresh song.”). The gallery 500 is also surfaced plainly and leaves Create board retryable, but cannot succeed while the backend is down.
- Space toggled a focused note and ArrowRight moved focus. At 390px, `body.scrollWidth === innerWidth === 390`; the intended wide grid is inside its horizontal scroller. Desktop and mobile visual review found the stated night-market design clear and legible.
- The live service worker registered/controlled a fresh page; after cache population, offline reload retained the title and 256 note cells. Source review confirms `/api/` responses are bypassed from the cache.

## Accessibility, privacy, security, and performance

- Fresh 390px reduced-motion Axe WCAG 2 A/AA and 2.1 AA scan: **zero violations** (therefore zero serious/critical). The app has `lang`, title, one `h1`, one `main`, skip link, labels, alt text and 44px note targets. Focus computed as a visible mango 3px outline/3px offset; reduced motion computed a `0.00001s` note transition.
- Normal live composer load made requests only to `https://gridsong.sociobot.in`. Review found no analytics, cookies, third-party scripts/fonts, microphone recording, or samples. `/privacy/` and `/terms/` disclose local/URL state; server retention/capabilities remain unverified because boards cannot be created.
- Static responses have HSTS, self-only CSP (including `connect-src 'self'`), nosniff, strict-origin referrer policy, and camera/microphone/geolocation denial. Root is `public, must-revalidate, max-age=30`; hashed JS/CSS and `sw.js` are immutable for one year. The broken API response lacks required policies as described above.
- Fresh mobile Lighthouse: Performance **91**, Accessibility **100**, LCP **1,441 ms**, CLS **0**, transfer **100,907 B**. Lighthouse wrote the report before a non-fatal Chromium target-crash diagnostic during final teardown.

## Deployment parity

The live root references the candidate's exact built hashes, and these files matched byte-for-byte:

| Artifact | SHA-256 local = live |
| --- | --- |
| `assets/index-DgXnf7cQ.js` | `19f081841e4ebead89e5ff27cfe6ddb13512c1e6532d5a48250aebbd01c7ef85` |
| `assets/index-BZ7KWNCN.css` | `158656bc3e1ae3b9bba44d83bd4cd1d8e8d697b050186778c4494a7dc63168f0` |

The failure is therefore not a stale frontend. It is the deployed API/backend layer required by this candidate.
