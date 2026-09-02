# Gridsong independent verification 13 handoff — FAIL

**Candidate:** `56f2390809d880f71a4306eed173d1f6b28b02bd`

**Live URL:** <https://gridsong.sociobot.in>
**Date:** 2026-09-02

## Decision

**FAIL.** All 26 declared claim commands pass, the end-to-end product works, and the live front end is a byte-for-byte match for this candidate. Release is blocked by the primary mobile grid’s 40×44 px note controls and 4 px gaps, below the required 44×44 px targets and 8 px spacing. Secondary wordmark/footer links also miss 44 px.

## Verification completed

- Clean `npm ci`: pass, 0 vulnerabilities.
- Every `.factory/claims.json` command, run separately: 26/26 pass.
- `npm test`: 16/16 pass.
- `npm run test:api`: 14/14 pass.
- `npm run build`: pass; strict TypeScript plus `dist/`.
- `npm run test:e2e`: 50 passed, 12 live-only/project skips.
- Live Playwright desktop/390 px suite: 10/10 pass.
- `npm run test:live`: pass, including three concurrent 120-song capacity trials.
- Independent single-client capacity run: 120 accepted and persisted; request 121 returned 429 with `Retry-After: 60`; test submissions were deleted.
- Fleet URL check: pass. Live Lighthouse: 97 performance / 100 accessibility / 100 best practices / 100 SEO; LCP 1.5 s, CLS 0.
- Live request and response audit: same-origin only, no cookies, no console/page errors, expected security headers, API `no-store`.
- PWA: active worker, clean update check, offline reload and offline edit/export pass.
- Local/live parity: exact for main HTML, hashed JS/CSS, route script, service worker, legal pages, and 404.

## Defects

1. **High / release-blocking:** `src/style.css:117-118` renders the primary note tiles at 40×44 px with 4 px gaps on a 390 px phone. The supplied accessibility/design contract requires at least 44×44 px targets and 8 px separation. The header brand and several footer/legal links are also under 44 px.
2. **Medium:** `public/staticwebapp.config.json:14-17` gives unversioned route, legal-style, and image files one-year immutable caching. Fingerprint them or make them revalidate.
3. **Low:** `public/manifest.webmanifest:4` uses the banned and ambiguous phrase “local-first.”

Full evidence and exact remediation are in `.factory/verification-13.md`; machine artifacts are in `.factory/evidence/verification-13/`.

## Re-run

```sh
npm ci
npm test
npm run test:api
npm run build
npm run test:e2e
GRIDSONG_LIVE_URL=https://gridsong.sociobot.in npx playwright test tests/live.spec.ts --workers=1
npm run test:live
mkdir -p .factory/evidence/verification-13/verify-url
/opt/fleet/lib/verify-url.sh https://gridsong.sociobot.in .factory/evidence/verification-13/verify-url
```
