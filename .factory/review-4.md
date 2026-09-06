# Review 4 — make, save, export, and collect classroom songs

**Verdict: PASS.** There are **zero findings** at every severity and **zero untested public claims**.

**Reviewed:** 6 September 2026
**Live URL:** <https://gridsong.sociobot.in>
**Implementation candidate:** `7ff9d614bfbcbe8d74bb1fd0e2f76682569a3c03` (`fix: meet touch and cache contracts`)
**Documentation revision:** `a491baa1342478d33d438f0c34dedb3d58cf3c99` (`docs: record verification 14 pass`)

No product code was changed for this review.

## First screen and sample

Fresh, independent Chromium contexts at 1440×900 and 390×844 showed the required information before scrolling:

- **Job:** “Make and play songs on a classroom grid.”
- **Audience:** K–8 music teachers and students.
- **First action:** “Try it with sample data,” followed by “Opens a four-bar rhythm in a private demo.”

Both viewports had no page-level horizontal overflow or console/page errors. The normal route had no rendered demo banner. One click opened the populated “Morning call and response” sample and the persistent **Demo — sample data, nothing is saved** banner. On each viewport, editing one visible note changed the current-bar count from 12 to 13; **Reset demo** restored 12. A real local song was unchanged throughout. **Start for real** returned to `/`, removed both demo keys, and left the real song intact.

The sample and its first action are therefore real, isolated, and recoverable rather than a landing-page demonstration.

## Declared claims

A detached clean clone at documentation revision `a491baa` was installed with `npm ci`. Every one of the 26 exact commands in `.factory/claims.json` completed with exit status 0.

| Claims proved | Result |
| --- | --- |
| demo sandbox; local save; WAV/MIDI export; complete song links; offline reload | pass |
| no-account demo; technical privacy footprint; no account backup | pass |
| note grid; settings boundaries; six sounds; keyboard grid; user-gesture audio | pass |
| Node 22/dist deployment contract | pass |
| direct gallery submit; student-only pass; teacher-key storage; submission body | pass |
| gallery record schema; 90-day retention; expiry cleanup; teacher removal; 120-song capacity | pass |
| 390px layout; unknown-route recovery; documentation claims inventory | pass |

The documentation inventory test passed and the review also checked the landing, composer, gallery states, footer, README, Privacy, and Terms copy against the manifest. Claim-like copy is covered by the corresponding listed observable test; no unlisted, false, incomplete, or untested public claim remains.

## Local quality gates

From that clean clone:

- `npm test`: 16 passed.
- `npm run test:api`: 14 passed after its documented clean API dependency install.
- `npm run build`: passed; `dist/index.html` was produced.
- `npm run test:e2e`: 55 passed, with 17 intentional live-only/project skips.
- The built payload is 38.82 KB JavaScript (13.00 KB gzip) and 18.02 KB CSS (4.88 KB gzip), below the static-product budgets.

## Live application and recovery paths

`GRIDSONG_LIVE_URL=https://gridsong.sociobot.in npx playwright test tests/live.spec.ts --workers=1` passed 12 deployed checks with 2 intentional project skips. `npm run test:live` passed the malformed-request health check, teacher create → separate-device student submit → teacher read → teacher delete, and three capacity trials. Every capacity trial persisted exactly 120 songs and refused the additional valid submission; the implementation returns the documented retryable 429 behavior.

An independent live invalid-link check showed the plain recovery message “That song link got tangled… Starting a fresh song.” and left a usable 256-cell composer. A live 390px boundary check accepted chromatic scale, four octaves, 64 bars, and 200 BPM, showed 800 cells and “Bar 1 of 64,” and still had no page-level overflow.

The fresh production build matched the live `index.html`, 404, hashed JS/CSS, route and legal scripts/styles, service worker, manifest, hero/social assets, and both legal pages byte-for-byte. This confirms the reviewed live runtime is the `7ff9d61` implementation, not merely the later report revision.

## Accessibility, privacy, routing, and performance

- `/opt/fleet/lib/verify-url.sh` passed for the live root: HTTP 200, title, `lang=en`, one h1, main landmark, no missing image alternatives or unlabeled buttons, and no console errors.
- Axe WCAG 2 A/AA and 2.1 AA scans reported zero violations for `/`, `/demo#composer`, `/privacy/`, `/terms/`, and a fresh unknown URL. The unknown URL returned deliberate HTTP 404, title “Page not found — Gridsong,” a styled recovery link, and no overflow.
- Keyboard, focus, reduced-motion, offline reload/edit/save/export, 44px mobile note controls, and route focus announcements passed the full browser and deployed suites. Legal routes retain the shared skip link, header, footer, titles, and landmarks.
- Fresh request checks stayed same-origin. The delivered app set no cookies and loaded no third-party font or script. Live headers include self-only CSP with response-header `frame-ancestors 'none'`, HSTS, nosniff, strict-origin referrer policy, and camera/microphone/geolocation denial.
- Fresh mobile Lighthouse on `/demo`: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.5 s, TBT 30 ms, CLS 0.

## Earlier findings

All prior review and verification findings, including the earlier minor findings, are closed and directly covered:

| Earlier area | Current disposition |
| --- | --- |
| Normal-route demo banner, demo exit/reset isolation, first-screen plain wording | fixed; fresh desktop/phone storage and visibility checks passed |
| README/plain-language, terminology, unbounded device wording, provenance copy | fixed; copy audit has no sentence over 22 words, banned wording, or reader-facing security jargon |
| Missing/unlisted claims and incomplete legal privacy wording | fixed; 26-entry inventory and documentation-contract regression passed |
| Shared headers/footers, skip links, route focus/announcement, metadata, designed 404 | fixed; deployed route and Axe checks passed |
| Gallery production availability, teacher/student capabilities, protected storage, expiry/cleanup, concurrent 120-song limit | fixed; API, two-browser, and live capacity/flow checks passed |
| Offline promise, invalid-link recovery, settings/export/audio behavior | fixed; dedicated browser, unit, and live checks passed |
| Mobile touch targets, stable-resource caching, installed-app wording | fixed; deployed geometry/cache/manifest checks passed |

## Evidence

Machine-readable result: `/work/.evidence/qa-result.json`. Supporting screenshots, URL-verifier output, live artifact parity copies, and Lighthouse report are under `/work/.evidence/review-4/`.
