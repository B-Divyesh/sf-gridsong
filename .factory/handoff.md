# Gridsong verification 11 handoff — **FAIL**

**Tested candidate:** `5c91bec2b022378cf54eaed546ea19f36e91b163`
**Live URL:** <https://gridsong.sociobot.in>
**Verified:** 2026-09-02

## Release outcome

**FAIL. Do not release this candidate.** The product works end to end and the
live artifact matches the candidate, but four mandatory claim commands fail
from the clean root installation and the demo's visible reset/exit controls
are only 32 px tall at mobile width.

## Exact verification evidence

- `.factory/claims.json` exists with 26 tests. After clean `npm ci`, 22 passed
  individually and four API claims failed because `api/node_modules` was not
  installed (`Cannot find module '@azure/functions'`):
  `student-pass-submit-only`, `gallery-record-schema`,
  `gallery-expiry-cleanup`, and `gallery-capacity`.
- After the additional `npm --prefix api ci`, `npm test` passed (15/15),
  `npm run test:api` passed (14/14), `npm run build` passed, and
  `npm run test:e2e` passed (48 passed, 12 deployment-only skipped).
- Live `npm run test:live` passed malformed-request handling, teacher →
  student → projector → teacher-delete flow, and three concurrent capacity
  trials. A fresh check observed 120 submissions accepted and the 121st
  refused with `429 Retry-After: 60`; verifier entries were deleted.
- Live and fresh local build hashes match for `index.html`, JS, CSS, and
  service worker. The live demo has same-origin requests only, no console/page
  errors, working offline reload, and zero serious/critical axe findings at
  desktop and 390 px.

## Required fixes before re-verification

1. Make the canonical root clean-install/test workflow install the API
   package, or make each API claim command self-sufficient. Then run every
   `.factory/claims.json` command from a clean checkout with no failures.
2. Make **Reset demo** and **Start for real** at least 44 px tall/hittable on
   desktop and 390 px mobile; preserve visible keyboard focus.

## How to verify after repair

```sh
npm ci
npm --prefix api ci
npm test
npm run test:api
npm run test:e2e
npm run build
npm run test:live
```

See `.factory/verification-11.md` for the full independent report.

---

# Previous builder handoff (superseded by verification 11)

## Outcome

All findings in `.factory/review-1.md` and `.factory/review-2.md` are repaired in the release candidate. Gridsong keeps its night-market sequencer design and static-web deployment class.

## What changed

- Rewrote the first screen to say exactly what students do and kept the one-click sample action inside the initial 390×844 viewport.
- Kept `/demo` and `/?demo=1` isolated under `demo:gridsong.*`, with a visible banner, reset, and return-to-real controls. Header gallery access now stays inside the active demo or student-pass context.
- Made the app, demo, Privacy, Terms, and 404 headers share the same grid-mark wordmark and four link destinations.
- Added real `/#class-gallery` routing that opens the gallery from legal and recovery pages.
- Added route-entry h1 focus, polite announcements, and back/forward coverage without breaking skip links.
- Replaced the absolute device claim with “Students can open it on another device.”
- Standardized “student class pass,” changed noun-only actions to “Open class gallery” and “Start new song,” and removed the remaining reader-facing metaphor and security jargon.
- Updated `.factory/claims.json`, the claim inventory test, catalog description, copy audit, README, Privacy, Terms, 404, and service-worker shell version.
- Set Playwright to one worker because the supplied Chromium build became unstable after long concurrent test runs in this container; coverage and both viewport projects remain unchanged.

## Verification

- `npm test`: 15 passed.
- `npm run test:api`: 14 passed.
- `npm run build`: passed and produced `dist/index.html`.
- `npm run test:e2e`: 48 local checks passed; 12 deployment-only checks skipped without `GRIDSONG_LIVE_URL`.
- Playwright Axe: zero WCAG A/AA/2.1 AA violations on the covered app, demo, legal, and 404 pages.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4174 .factory/evidence/polish-2/local`: passed with no console errors.
- Lighthouse mobile: performance 100, accessibility 100, best practices 100, SEO 100; LCP 1.8 s, CLS 0, TBT 10 ms.
- Build sizes: JavaScript 38.62 KB raw / 12.91 KB gzip; CSS 17.81 KB raw / 4.85 KB gzip.
- The 390 px first screen has no horizontal overflow; the sample action ends at 629 px in an 844 px viewport.
- Every one of the 26 commands in `.factory/claims.json` passed individually from clean clone `/tmp/gridsong-polish2-final-TEgLTX` at commit `49938eb`.
- `GRIDSONG_LIVE_URL=https://gridsong.sociobot.in npx playwright test tests/live.spec.ts --workers=1`: 10 passed across desktop and 390 px.
- `npm run test:live`: malformed-request check, create → submit → read → delete, and three atomic 120-song capacity trials passed.
- Live `/opt/fleet/lib/verify-url.sh` after the final deployment: HTTP 200 with title, language, h1, main, image alternatives, labelled buttons, and no console errors.
- Live Lighthouse mobile: performance 100, accessibility 100, best practices 100, SEO 100; LCP 1.4 s, CLS 0, TBT 30 ms.
- Production JS, CSS, and service-worker SHA-256 hashes match the local `dist/` files exactly.

## Evidence and operation

- Finding map: `.factory/polish-2.md`
- Copy audit: `.factory/copy-audit.md`
- Demo contract: `.factory/demo.md`
- Local evidence: `.factory/evidence/polish-2/local/`
- Live evidence: `.factory/evidence/polish-2/live/` and the final-deployment verifier output in `.factory/evidence/polish-2/live-final/`.
- Production: <https://gridsong.sociobot.in>
- Install: `npm ci && npm --prefix api ci`
- Test: `npm test && npm run test:api && npm run test:e2e`
- Build: `npm run build`
- Deploy: `npx swa deploy production --env production`

## Deployment

Deployed the `dist/` app and `api/` Function to the configured production app `sf-gridsong` in resource group `sociobot`. The Azure CLI reported <https://calm-grass-0df97b00f.7.azurestaticapps.net>; the product domain serves the same artifact at <https://gridsong.sociobot.in>.

## Known gaps

None in product scope.
