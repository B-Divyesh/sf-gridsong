# Independent verification 8 — PASS

**Work order:** `gridsong-verify-8`
**Candidate:** `181c7ae2e4eb01404fa3e576f7f675557095107c`
**Live URL:** <https://gridsong.sociobot.in>
**Verified:** 2026-09-02

## Verdict

**PASS — release candidate accepted.** Clean local and independent production verification passed. The deployed HTML, 404, JS, CSS, and social image match the fresh production build byte-for-byte. No release-blocking defects were found.

## First-read and demo

A cold live visit plainly says **Make classroom songs together**, names **K–8 music teachers and students**, and presents **Try it with sample data** with the explanation “Opens a four-bar rhythm in a private demo.” The page also states saves-on-device, WAV/MIDI export, and no account/ads/tracking. The action opens `/demo#composer` with “Morning call and response” plus the persistent **Demo — sample data, nothing is saved** banner, Reset demo, and Start for real. This passes the required first-read and one-click isolated-demo check.

## Required claim commands

`.factory/claims.json` exists. Every exact manifest command passed from the clean checkout.

| Claim | Exact command | Result |
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
| 390px mobile | `npm run test:e2e -- --grep @claim:mobile-390` | 1 passed, 1 expected desktop skip |
| unknown-route recovery | `npm run test:e2e -- --grep @claim:unknown-route-recovery` | 2 passed |

## Local and live results

| Check | Result |
| --- | --- |
| `npm ci` | passed; 59 packages, 0 vulnerabilities |
| `npm --prefix api ci` | passed; 28 packages, 0 vulnerabilities |
| `npm test` | passed: 12 tests / 3 files |
| `npm run test:api` | passed: 11 Node API tests |
| `npm run build` | passed; TypeScript check and `dist/` output |
| `npm run test:e2e` | passed: Playwright last-run status `passed` |
| `GRIDSONG_LIVE_URL=https://gridsong.sociobot.in npm run test:live` | passed: malformed API recovery, real gallery flow, three capacity trials |
| `GRIDSONG_LIVE_URL=https://gridsong.sociobot.in npx playwright test tests/live.spec.ts` | passed: 6/6, desktop and 390px |

The fresh live teacher-board → student class-pass → nickname/song direct-submit → projector-poll → teacher-delete flow passed in separate browser contexts. Three capacity trials each submitted 121 concurrent valid entries from one client process: exactly **120** persisted and one received `429` with numeric **`Retry-After: 60`**. This is the documented/observed 120-song board allowance.

Chromatic scale, 64 bars, four octaves, and 50/200 BPM all worked live. The chromatic four-octave bar rendered 800 cells with no 390px page overflow; 64 bars lasted 5 min 7 sec at 50 BPM and 1 min 17 sec at 200 BPM. An invalid song hash announced recovery and left the composer usable with no console/page error.

## Accessibility, privacy, PWA, and headers

- Live Axe scans (WCAG 2 A/AA and 2.1 AA) reported **zero violations**, including zero serious/critical, for demo at desktop/390px and the 404 page.
- Space toggled a focused grid note and ArrowRight moved focus. The live note focus outline is a designed 3px solid `rgb(255, 200, 87)`. Reduced motion set active-cell transition duration to at most `0.00001s` with no transform.
- Fresh Playwright request logs during root/demo composition and gallery opening used only `https://gridsong.sociobot.in`; no third-party scripts/fonts, ads, analytics, account/password/email fields, console errors, or page errors were observed.
- After the first visit, the active service worker reloaded `/demo` offline with title `Demo — Gridsong`, 256 cells, and the demo banner.
- `/no-such-page` returns HTTP 404 with an accessible styled recovery page. Root, demo, privacy, terms, and all discovered links return 200. Privacy/terms have route titles, h1, and main landmarks.
- HTML sends self-only CSP with response-header `frame-ancestors 'none'`, HSTS, nosniff, strict-origin referrer policy, and denied camera/microphone/geolocation. Hashed assets cache immutable for one year; `/sw.js` is `Cache-Control: no-cache`.

## Performance and deployment identity

Build output is within budget: JS 37,850 B / 12.84 KB gzip; CSS 17,497 B / 4.78 KB gzip; loaded hero WebP 81,172 B. Live mobile Lighthouse `/demo`: **98 Performance, 100 Accessibility, 100 Best Practices, 100 SEO**; FCP 1.1 s, LCP 1.5 s, CLS 0, TBT 160 ms. Chromium logged a tab-crash warning only after Lighthouse wrote the complete report.

| Artifact | SHA-256 (local equals live) |
| --- | --- |
| `index.html` | `01c98ac623663b2ea6658c3fe38f6ae41f1ac1bc1cdc93fcb0b4bf0201aad95b` |
| `404.html` | `cb8637b52c2d5b2625e4b47955d5e8a594c226a58ff23d74b800552822d80038` |
| `assets/index-B0Kk9d4q.js` | `b578f59de2cac6baefba239e520ad6105111688eb910a49533252d75c153620f` |
| `assets/index-DS8eq8zp.css` | `de06d7db29eb54ab5bbbc7b0ae7a174948b89ce755c10ec4cffba0ce2a8f6f1e` |
| `assets/gridsong-social.jpg` | `4017d4c17c85adfd410f408e9b470b7e63cc64e727a4a0070ceb770f1a19b3de` |

## Defects by severity

None: no open release-blocking, high, medium, or low defects.
