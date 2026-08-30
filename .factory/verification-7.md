# Independent verification 7 — FAIL

**Work order:** `gridsong-verify-7`
**Candidate:** `9a98f823385b65297ecfd63c448404c4ddc22868`
**Live URL:** <https://gridsong.sociobot.in>
**Verified:** 2026-08-30

## Verdict

**FAIL — do not release until the required 404 route exists.** The deployed application is an exact production build of the candidate, and the core sequencer, demo, exports, PWA, privacy posture, and real teacher/student gallery all passed fresh testing. However, the supplied site-structure acceptance contract requires a real styled 404 page with a way back. The candidate has neither: `/no-such-page` returns the normal composer with HTTP 200. This makes a mistyped/dead URL look like a valid application route and does not give the visitor a recovery action.

This is fresh result, not the previously reported deployment-only gallery failure: the live Function is healthy and the real concurrent capacity test now passes.

## First-read result

Cold live landing screen answers all three required questions:

- **What it does:** a classroom step sequencer that lets people compose, save, share, hear, and export songs.
- **For whom:** K–8 music teachers and students.
- **What to click first:** **Try it with sample data**, which says it opens a four-bar rhythm in a private demo.

The primary action opens `/demo#composer` with “Morning call and response” and the persistent **Demo — sample data, nothing is saved** banner. The first-read/demo requirement passes.

## Release-blocking defect

### High — no real 404 route

**Expected:** A nonexistent URL returns a designed 404 response/page in the product’s visual style and gives the visitor a way back, as required by the site-structure contract.

**Actual:** Fresh request on 2026-08-30:

```text
GET https://gridsong.sociobot.in/no-such-page → HTTP 200
content-type: text/html
```

It serves the normal SPA shell and ordinary composer, not a 404 page. `public/staticwebapp.config.json` has only a navigation fallback and no 404 response override; there is no `404.html` in the production artifact.

**Required remediation:** Add an accessible, product-styled `404.html` with a clear link home; configure Static Web Apps `responseOverrides` to rewrite a 404 to it without converting the response to 200. Rebuild, deploy, and verify an unknown URL returns HTTP 404 and the recovery link works.

## Passing evidence

### Clean candidate and claim contract

- The checkout was exactly `9a98f823385b65297ecfd63c448404c4ddc22868`.
- `.factory/claims.json` exists and every exact manifest command was run before broader QA:

| Claim | Command | Result |
| --- | --- | --- |
| demo sandbox | `npm run test:e2e -- --grep @claim:demo-sandbox` | 2 passed |
| local save | `npm run test:e2e -- --grep @claim:local-save` | 2 passed |
| browser exports | `npm run test:e2e -- --grep @claim:browser-exports` | 2 passed |
| complete song links | `npm run test:e2e -- --grep @claim:complete-song-links` | 2 passed |
| offline reload | `npm run test:e2e -- --grep @claim:offline-reload` | 2 passed |
| privacy/local demo | `npm run test:e2e -- --grep @claim:privacy-local-demo` | 2 passed |
| direct gallery submit | `npm run test:e2e -- --grep @claim:gallery-direct-submit` | 2 passed |
| gallery retention | `npm run test:api -- --test-name-pattern @claim:gallery-retention` | 1 passed |
| gallery capacity | `npm run test:api -- --test-name-pattern @claim:gallery-capacity` | 1 passed |
| 390px mobile | `npm run test:e2e -- --grep @claim:mobile-390` | 1 passed; 1 expected desktop skip |

### Local and live gates

| Command/check | Fresh result |
| --- | --- |
| `npm ci` | Passed; 59 packages, 0 vulnerabilities |
| `npm --prefix api ci` | Passed; 28 packages, 0 vulnerabilities |
| `npm test` | Passed: 12 tests / 3 files |
| `npm run test:api` | Passed: 11 Node API tests |
| `npm run build` | Passed: `tsc --noEmit` and Vite; `dist/` produced |
| `npm run test:e2e` | Passed: 19 tests; 3 expected live-only/desktop-only skips |
| live Playwright gallery test | Passed desktop and 390×844 real teacher → student → projector flow |
| `GRIDSONG_LIVE_URL=https://gridsong.sociobot.in npm run test:live` | Passed malformed API recovery, real gallery flow, and three concurrent capacity trials |

There is no separate lint script/configuration; the production build performs the repository’s TypeScript check.

The live capacity test created a fresh board in each of three trials and sent 121 simultaneous valid submissions. Each trial persisted exactly 120, returned one `429`, and included numeric `Retry-After: 60`. The observed/documented allowance is **120 songs per class board**, with a 60-second full-board retry. No separate per-client request-rate allowance is documented by the product.

### Functional, accessibility, privacy, and PWA checks

- Fresh live teacher board creation, separate-browser student submission, projector polling, and teacher deletion passed. Malformed gallery JSON returned JSON HTTP 400 with `Cache-Control: no-store`.
- Live settings accepted chromatic scale, 64 bars, four octaves, and tempo boundaries 50/200 BPM. At 64 bars the UI showed 5 min 7 sec at 50 BPM and 1 min 17 sec at 200 BPM. Keyboard Space toggled a focused note and ArrowRight moved focus to the next tile.
- Invalid `#song=not-valid-base64` remained usable with 256 cells and announced recovery. An invalid class pass announced “That class pass is not valid.” No console error occurred.
- Fresh live desktop and 390×844 contexts each had one `h1`, one `main`, 256 grid cells, zero axe WCAG 2 A/AA + 2.1 AA violations (including zero serious/critical), no console/page errors, and only same-origin requests. At 390px, `scrollWidth` equalled `innerWidth` (390). Focused tiles had a 3px designed focus outline.
- Under reduced motion an active tile had transition duration `0.00001s` and no transform. A fresh `/demo#composer` context had an active non-waiting service worker and reloaded offline with `Demo — Gridsong`, 256 cells, and the demo banner.
- Demo/normal request logs contained only `https://gridsong.sociobot.in`; no third-party scripts, fonts, analytics, or account fields were observed. The live gallery receives the stated nickname/song data through same-origin requests.

### Deployment, headers, and budget

The fresh build matches live byte-for-byte:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `3caf1d2b48f047435f8f64efd232ecfecb42dac145f4acb3e5b728c85dd7cc42` |
| JS `index-CYUpGzC-.js` | `54b0d869c751e3d073c02a35a3b853149c0074ba9b8839184b3afabb85b65630` |
| CSS `index-DS8eq8zp.css` | `de06d7db29eb54ab5bbbc7b0ae7a174948b89ce755c10ec4cffba0ce2a8f6f1e` |

Built JS is 37,438 B / 12.74 KB gzip, CSS 17,497 B / 4.78 KB gzip, and hero WebP 81,172 B: all within static-product budgets. Live root responses send self-only CSP (including response-header `frame-ancestors 'none'`), HSTS, `nosniff`, strict-origin referrer policy, and denied camera/microphone/geolocation permissions policy. Hashed JS is immutable for one year and `/sw.js` is `Cache-Control: no-cache`. Privacy and terms routes return 200 with their own titles, language, one h1, and main landmark.

## Non-blocking standards note

The landing HTML lacks canonical, Open Graph, and Twitter metadata specified by the supplied site-structure standard. Add those, and a product-derived 1200×630 social image, while adding the 404 route.
