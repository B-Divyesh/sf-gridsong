# Gridsong polish round 2 handoff

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
- Live `/opt/fleet/lib/verify-url.sh`: HTTP 200 with title, language, h1, main, image alternatives, labelled buttons, and no console errors.
- Live Lighthouse mobile: performance 100, accessibility 100, best practices 100, SEO 100; LCP 1.4 s, CLS 0, TBT 30 ms.
- Production JS, CSS, and service-worker SHA-256 hashes match the local `dist/` files exactly.

## Evidence and operation

- Finding map: `.factory/polish-2.md`
- Copy audit: `.factory/copy-audit.md`
- Demo contract: `.factory/demo.md`
- Local evidence: `.factory/evidence/polish-2/local/`
- Live evidence: `.factory/evidence/polish-2/live/`
- Production: <https://gridsong.sociobot.in>
- Install: `npm ci && npm --prefix api ci`
- Test: `npm test && npm run test:api && npm run test:e2e`
- Build: `npm run build`
- Deploy: `npx swa deploy production --env production`

## Deployment

Deployed the `dist/` app and `api/` Function to the configured production app `sf-gridsong` in resource group `sociobot`. The Azure CLI reported <https://calm-grass-0df97b00f.7.azurestaticapps.net>; the product domain serves the same artifact at <https://gridsong.sociobot.in>.

## Known gaps

None in product scope.
