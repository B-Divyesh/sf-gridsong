# Gridsong verification 12 handoff — PASS

**Latest independent verification:** candidate `b05e18d0f710aea32b1079849218f2dc15659b0f` at <https://gridsong.sociobot.in> — **PASS** (2026-09-02).

- Fresh `npm ci`, all 26 individually declared claim tests, unit tests (16/16), API tests (14/14), full local browser suite (50 passed; 12 live-only skipped), exact production build, and live browser suite (10/10) passed.
- The live deployment is byte-for-byte identical to the candidate's built HTML, service worker, CSS, and JavaScript. Live privacy, offline, keyboard, reduced-motion, 390 px mobile, headers, cache policy, and axe checks passed.
- A gallery accepts 120 songs. The 121st response was `429` with `Retry-After: 60`; verifier-created data was removed.
- No defects or known gaps were found. Full evidence: `.factory/verification-12.md` and `.factory/evidence/verification-12/`.

## Prior repair handoff

**Work order:** `gridsong-repair-9`

**Repaired report:** `93ae51262208c0a366a021b390f68b059199bf8b`

**Failed candidate:** `5c91bec2b022378cf54eaed546ea19f36e91b163`

**Live URL:** <https://gridsong.sociobot.in>

**Completed:** 2026-09-02

## Outcome

Both release-blocking findings in verification 11 are fixed. Gridsong remains a Vite + TypeScript static web app with its managed Azure Function API and existing night-market visual system.

## Repairs

- Reproduced the controller failure from a fresh checkout after root `npm ci`: `npm run test:api -- --test-name-pattern=@claim:student-pass-submit-only` failed with `Cannot find module '@azure/functions'`.
- Added the root `pretest:api` lifecycle command. Every API claim now runs `npm --prefix api ci --ignore-scripts` before invoking the API suite, so each declared command is self-contained after root `npm ci`.
- Added a unit contract that locks the self-installing API command in place.
- Increased **Reset demo** and **Start for real** from 32 px to 44 px minimum height, with roomier padding at desktop and 390 px.
- Added a specific 3 px ink focus ring on the mint demo banner. The ring has strong contrast and remains visible for keyboard users.
- Added a two-viewport browser regression that measures both actions and inspects their rendered focus styles.
- Updated the README to use the reproducible root `npm ci` workflow and to document that `test:api` installs its own locked dependencies.

## Verification evidence

- Fresh-clone claim gate after only root `npm ci`: all 26 `.factory/claims.json` commands passed independently; 0 failed.
- `npm test`: 16/16 passed.
- `npm run test:api`: 14/14 passed after its own clean API dependency install.
- `npm run build`: TypeScript passed and Vite produced `dist/`.
- `npm run test:e2e`: 50 passed across desktop and 390 px; 12 deployment-only cases skipped locally.
- Focused control regression: 2/2 viewport projects passed. Live measurements are exactly 44 px high for both controls at 1280 px and 390 px. Both render a 3 px `#090d22` focus outline.
- Playwright Axe scans in the full and live suites found no WCAG A/AA/2.1 AA violations. Keyboard grid, skip link, dialog, reduced-motion, and mobile overflow checks passed.
- A 200% root-text-size probe kept both `/` and `/demo#composer` readable with no page-level horizontal overflow at a 1280 px viewport.
- Offline/update coverage passed in an isolated browser context: the worker controls `/demo`, offline reload remains usable, and no waiting worker remains after update.
- Privacy coverage passed: the cold/demo flow uses same-origin resources only, sets no cookies, and emits no console or page errors.
- `/opt/fleet/lib/verify-url.sh` passed locally and live: HTTP 200, correct title/language, one h1, main landmark, image alternatives, labelled buttons, and no console errors.
- Local mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.8 s, CLS 0, TBT 60 ms.
- Live mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.4 s, CLS 0, TBT 20 ms.
- Production output: JavaScript 38.62 KB raw / 12.91 KB gzip; CSS 17.88 KB raw / 4.85 KB gzip; hero WebP 81.17 KB.

## Live and response-policy checks

- `GRIDSONG_LIVE_URL=https://gridsong.sociobot.in npx playwright test tests/live.spec.ts --workers=1`: 10/10 passed across desktop and 390 px.
- `npm run test:live`: malformed request returned 400; create → submit → teacher read → delete passed; three atomic capacity trials each persisted 120 songs and refused the extra submission.
- `/`, `/demo`, `/privacy/`, and `/terms/` return 200. An unknown route returns the designed 404.
- Live headers include HSTS, `nosniff`, strict-origin referrer policy, restrictive permissions policy, and same-origin CSP with header-delivered `frame-ancestors 'none'`.
- SHA-256 parity passed for `index.html`, `sw.js`, and the hashed JavaScript and CSS between local `dist/` and the live origin.

## Deployment

Built `dist/` and deployed it with `api/` using `npx swa deploy production --env production`. The checked-in deployment configuration selected only `sf-gridsong` in resource group `sociobot`. The Azure deployment URL is <https://calm-grass-0df97b00f.7.azurestaticapps.net>; the product domain serves the same artifact.

Evidence is in `.factory/evidence/repair-9/`.

## Run locally

```sh
npm ci
npm test
npm run test:api
npm run build
npm run test:e2e
```

There is no separate lint configuration; `npm run build` performs the TypeScript check. Package/consumer testing does not apply to this static application.

## Known gaps

None in product scope.
