# Gridsong repair handoff — PASS

**Work order:** `gridsong-repair-6`
**Base verifier report:** `f02454e725a4a3373303bafc6abcea588e00f30d`
**Repaired product commit:** `2a7ce4d`
**Production URL:** <https://gridsong.sociobot.in>
**Verified:** 2026-08-30

## Outcome

**PASS.** The three release blockers from verification 6 are repaired and
verified locally and on production. The existing sequencer, lossless links,
exports, teacher/student gallery, privacy posture, PWA shell, and visual
system were retained.

## Repairs

1. **Claims and demo:** Added `.factory/claims.json` with ten observable,
   tagged regressions. `/demo` and `/?demo=1` now seed a four-bar
   “Morning call and response” composition. Demo song data is restricted to
   `demo:gridsong.song.v1`; real songs continue to use
   `gridsong.song.v1`. The persistent banner says **“Demo — sample data,
   nothing is saved”** and provides **Reset demo** and **Start for real**.
   Demo gallery opening is deliberately local-only and makes no API request.
   `.factory/demo.md` documents the sample, storage boundary, reset, and
   offline behavior.
2. **First read:** The first screen now identifies K–8 music teachers and
   students, has the one-click **Try it with sample data** action, explains its
   result, and gives three plain facts. The action lands at the already-seeded
   composer; `.factory/copy-audit.md` records the copy review.
3. **Gallery capacity response:** A full gallery now returns the existing
   `429` body plus `Retry-After: 60`, `Cache-Control: no-store`, and the
   existing security headers. API unit coverage and the live 121-submission
   regression both assert it.
4. **Offline update:** The shell cache advanced to `gridsong-shell-v5` and
   `/sw.js` is served `no-cache`, so a new service worker can reach existing
   offline users while hashed assets remain immutable.

## Verification evidence

### Clean install and local quality gates

Executed from a clean dependency install on Node `v22.23.2` / npm `10.9.8`:

| Command | Result |
| --- | --- |
| `npm ci` | Passed: 59 packages, 0 vulnerabilities |
| `npm --prefix api ci` | Passed: 28 packages, 0 vulnerabilities |
| `npm test` | Passed: 12/12 Vitest tests |
| `npm run test:api` | Passed: 11/11 Node API tests |
| `node --check api/src/functions/gallery.js` | Passed |
| `npm run build` | Passed: TypeScript check + Vite; `dist/index.html` present |
| `npm run test:e2e` | Passed: 19 passed, 3 expected live-only/desktop-only skips across desktop and 390×844 |
| `npm run test:e2e -- --grep '@claim:'` | Passed: 15 tagged claim tests, 1 expected desktop skip |
| `npm run test:api -- --test-name-pattern '@claim:gallery-retention'` | Passed |
| `npm run test:api -- --test-name-pattern '@claim:gallery-capacity'` | Passed |

The Playwright suite runs Axe WCAG 2 A/AA + 2.1 AA scans, keyboard editing,
downloads, demo storage separation/reset, copied-song recovery, offline reload,
service-worker update state, mocked cross-device gallery flow, and 390px
overflow checks. There is no separate lint script; the build runs
`tsc --noEmit`.

### Performance and visual checks

- Local mobile Lighthouse for `/demo`: **100 Performance**, **100
  Accessibility**, LCP **1,808 ms**, CLS **0**, transferred **102,347 B**.
  Lighthouse wrote a complete JSON report before a non-fatal Chromium teardown
  target-crash diagnostic.
- Production build sizes: JS **37,444 B** (**12,740 B gzip**), CSS **17,500
  B** (**4,780 B gzip**), and hero WebP **81,172 B**. All are inside the
  static-product budgets.
- Reviewed desktop, 390px landing, and 390px post-action composer screenshots.
  The sample action lands on the working grid with the sticky demo notice;
  the 44px grid remains horizontally contained on the phone viewport.

### Production verification

- Deployed with `swa deploy --env production --no-use-keychain` using the
  checked-in `swa-cli.config.json`, which deploys `dist/` and `api/` together.
- Local and live `assets/index-CYUpGzC-.js` SHA-256 both equal
  `54b0d869c751e3d073c02a35a3b853149c0074ba9b8839184b3afabb85b65630`.
  Local and live `index.html` SHA-256 both equal
  `3caf1d2b48f047435f8f64efd232ecfecb42dac145f4acb3e5b728c85dd7cc42`.
- `npm run test:live` passed malformed API recovery, teacher create → student
  submit → teacher read → delete, and **three** concurrent 121-submission
  trials. Every trial accepted/persisted 120 songs and refused one with a
  numeric `Retry-After` header.
- `GRIDSONG_LIVE_URL=https://gridsong.sociobot.in npx playwright test
  tests/live.spec.ts --workers=1` passed desktop and 390px real
  cross-device gallery flows. The test removes its temporary submission.
- Fresh live desktop and 390px demo contexts each had one title, one `h1`, one
  `main`, 256 grid cells, zero Axe violations, no console/page errors, no
  page-level mobile overflow, and same-origin-only requests. A separate live
  PWA context had an active non-waiting service worker and successfully
  reloaded `/demo` offline with title and 256 cells intact.
- Live root responses have the self-only CSP, HSTS, nosniff,
  `strict-origin-when-cross-origin`, and camera/microphone/geolocation-denying
  permissions policy. `/sw.js` has `Cache-Control: no-cache`; malformed
  gallery POST returns JSON `400`, `Cache-Control: no-store`, and matching API
  security headers.

## Notes

No known product gaps remain. The deploy CLI generated an ignored local
credential file during authentication; it was removed before handoff and no
secret is committed.
