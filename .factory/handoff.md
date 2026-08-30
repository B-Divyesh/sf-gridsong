# Gridsong repair handoff — PASS

**Work order:** `gridsong-repair-7`

**Verifier report:** `40a5d93ec165c0a15c5bf685152ebe195648f7f8`

**Candidate repaired:** `9a98f823385b65297ecfd63c448404c4ddc22868`

**Deployed product commit:** `7e71771`

**Production URL:** <https://gridsong.sociobot.in>

**Completed:** 2026-08-30

## Outcome

**PASS.** The verifier’s release-blocking 404 defect and required metadata gap are repaired, covered by exact regressions, deployed, and verified on production. The existing sequencer, isolated demo, local saves, lossless song links, browser exports, PWA behavior, and real teacher/student gallery remain intact.

## Repairs

1. **Real 404 response:** Removed the catch-all `navigationFallback` that turned every unknown address into the composer with HTTP 200. Static Web Apps now rewrites only `/demo` to the app shell and uses `responseOverrides.404.rewrite` to render `404.html` while retaining status 404.
2. **Accessible recovery page:** Added a responsive, product-styled page with `lang`, title, skip link, one `h1`, one `main`, visible focus, a 48px recovery action, legal links, and the existing night-market note-grid language. The page has zero axe WCAG 2 A/AA and 2.1 AA violations at desktop and 390px.
3. **Offline/update behavior:** Advanced the service-worker cache to `gridsong-shell-v6`, precached the 404 and new metadata assets, and returns the cached 404 for an unknown offline navigation rather than the composer.
4. **Discovery metadata:** Added canonical, Open Graph, Twitter card, favicon, and 180×180 Apple touch metadata. `/demo` updates its canonical URL and social title at runtime. Privacy and terms have route-specific titles, descriptions, canonical URLs, and social metadata.
5. **Original social asset:** Added `public/assets/gridsong-social.jpg`, a 1200×630 centre crop of the existing original generated night-market illustration. It is 140,036 bytes, uses no new third-party material, and its provenance is recorded in `.factory/design.md`.
6. **Exact regression coverage:** Added `@claim:unknown-route-recovery` to `.factory/claims.json`. `tests/site-contract.spec.ts` asserts 404 status, recovery navigation, one `h1`/`main`, axe, 390px fit, canonical/social metadata, exact asset dimensions, and the no-fallback Static Web Apps contract. The API deployment-contract test independently asserts the 404 rewrite and recovery page. `tests/live.spec.ts` repeats 404, accessibility, privacy, keyboard, reduced-motion, offline, mobile, and gallery checks against production.

## Local verification

Dependencies were installed from lockfiles with Node `v22.23.2` and npm `10.9.8`.

| Command/check | Result |
| --- | --- |
| `npm ci` | Passed: 59 packages, 0 vulnerabilities |
| `npm --prefix api ci` | Passed: 28 packages, 0 vulnerabilities |
| `npm test` | Passed: 12/12 Vitest tests |
| `npm run test:api` | Passed: 11/11 Node API tests, including the deployment contract |
| `npm run build` | Passed: TypeScript check and Vite production build; `dist/index.html` and `dist/404.html` present |
| `npm run test:e2e` | Passed: 24 browser tests; 8 expected live-only/project-only skips |
| Every command in `.factory/claims.json` | Passed, including the new 404 recovery claim |
| Static Web Apps emulator | `/`, `/demo`, `/demo/`, `/privacy/`, `/terms/` → 200; `/no-such-page` → 404 with the styled page |
| Visual review | New 404 reviewed at 1280×900 and 390×844; no clipping or page-level horizontal overflow |

The browser suite covers keyboard Space/Arrow navigation, WAV/MIDI downloads, demo storage isolation/reset, complete copied song state, a two-context gallery flow, invalid state recovery, same-origin-only request logging, service-worker activation/offline reload, reduced motion, and axe. There is no separate lint script; `npm run build` runs the repository’s TypeScript check.

All eleven exact claim commands declared in `.factory/claims.json` passed. The browser claims ran in both configured projects except the intentionally mobile-only assertion; both API claim filters passed.

## Performance and accessibility

Local mobile Lighthouse on `/demo` produced a complete report with **99 Performance**, **100 Accessibility**, **100 Best Practices**, and **100 SEO**. LCP was **1.6 s**, CLS **0**, and total blocking time **130 ms**. Lighthouse emitted its known non-fatal Chromium teardown crash message after writing the report.

Production output remains inside the static-product budgets:

- JS: 37,850 bytes / 12,779 bytes gzip
- CSS: 17,497 bytes / 4,790 bytes gzip
- loaded hero WebP: 81,172 bytes
- social JPEG: 140,036 bytes and not requested by the browser during normal page load

## Deployment and live verification

The production build was deployed with `swa deploy production --env production --no-use-keychain` using the checked-in `swa-cli.config.json`. Azure accepted the routing configuration and published the app and Function API together.

- `GET /no-such-page?repair=7e71771` returns **HTTP 404**, `text/html`, and the “Page not found” recovery page. Its Home action opens the working composer.
- `/`, `/demo`, the social image, privacy, and terms return **HTTP 200**.
- Root and 404 responses include HSTS, `nosniff`, strict-origin referrer policy, denied camera/microphone/geolocation permissions, and the self-only CSP with response-header `frame-ancestors 'none'`.
- The social image is served as `image/jpeg` with immutable one-year caching. `/sw.js` retains `Cache-Control: no-cache`.
- `npm run test:live` passed malformed-JSON recovery, teacher create → student submit → teacher read → delete, and three concurrent 121-submission capacity trials. Every capacity trial persisted 120 entries and rejected one with `429` and numeric `Retry-After`.
- Live Playwright passed 6/6 tests: 404 recovery, the real cross-device gallery flow, and demo checks on desktop and 390×844. The live demo passed axe, keyboard, reduced-motion, same-origin-only requests, no console/page errors, service-worker activation, and offline reload in both viewports.
- A missing API gallery still returns its JSON `404` body with `Cache-Control: no-store`; the site-level 404 override does not replace Function error responses.

The deployed artifact matches the local production build byte-for-byte:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `01c98ac623663b2ea6658c3fe38f6ae41f1ac1bc1cdc93fcb0b4bf0201aad95b` |
| `404.html` | `cb8637b52c2d5b2625e4b47955d5e8a594c226a58ff23d74b800552822d80038` |
| `assets/index-B0Kk9d4q.js` | `b578f59de2cac6baefba239e520ad6105111688eb910a49533252d75c153620f` |
| `assets/index-DS8eq8zp.css` | `de06d7db29eb54ab5bbbc7b0ae7a174948b89ce755c10ec4cffba0ce2a8f6f1e` |
| `assets/gridsong-social.jpg` | `4017d4c17c85adfd410f408e9b470b7e63cc64e727a4a0070ceb770f1a19b3de` |

## Known gaps and next steps

No known release-blocking or product gaps remain. The initial deploy attempt caught a duplicate `/demo/` rule before publication; the redundant rule was removed, the package was rebuilt and retested, and only the validated configuration was deployed.
