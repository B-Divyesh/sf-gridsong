# Independent verification 9 — FAIL

**Candidate:** `58aacde1a3898347173be720aa22d9d8e7f119d8`
**Live URL:** <https://gridsong.sociobot.in>
**Verified:** 2026-09-02

## Release decision

**FAIL — release-blocking claims contract defect.** The product and deployment work in the tested flows, but the checked-in claims inventory is incomplete. The factory claims contract says every visitor-facing claim must have an entry and an observable tagged test; it makes an unlisted claim a release-blocking finding.

### P1 — unlisted visitor-facing claims

`.factory/claims.json` contains no claims/tests for, among others:

- README: “Choose major, minor, pentatonic, or chromatic scales across one to four octaves.”
- README: “Make one to 64 bars at 50–200 BPM, one clear bar at a time.”
- README: “Choose four melody sounds, plus kick and clap.”
- README: “The teacher key stays in the teacher’s browser. The gallery stores the nickname, song, submission time, and security data.”
- README and Privacy: expired gallery records are removed during bounded cleanup.
- Privacy: no cookies, fingerprinting, third-party fonts, or third-party scripts; no sale/profiling of submissions.
- README: audio starts only after a user presses Play.

The existing IDs cover demo isolation, local save, browser exports, complete links, offline reload, a narrower privacy request check, gallery submit/body/retention/capacity, mobile width, and 404 recovery. They do not prove the claims above. Add one exact entry and tagged observable test for each retained assertion (including suitable API/response/header/storage assertions), or remove/qualify the assertion. Do not mark this candidate releasable until that inventory is complete.

## Required claims checks — all passed

Executed each command from `.factory/claims.json` after `npm ci` and `npm --prefix api ci`:

| Claim ID | Result |
| --- | --- |
| `demo-sandbox` | PASS — 2 Playwright project runs |
| `local-save` | PASS — 2 Playwright project runs |
| `browser-exports` | PASS — 2 Playwright project runs |
| `complete-song-links` | PASS — 2 Playwright project runs |
| `offline-reload` | PASS — 2 Playwright project runs |
| `privacy-local-demo` | PASS — 2 Playwright project runs |
| `gallery-direct-submit` | PASS — 2 Playwright project runs |
| `gallery-submission-data` | PASS — 2 Playwright project runs |
| `gallery-retention` | PASS — 1 Node API test |
| `gallery-capacity` | PASS — 1 Node API test |
| `mobile-390` | PASS — mobile project passed; desktop project correctly skipped |
| `unknown-route-recovery` | PASS — 2 Playwright project runs |

## First-read and end-to-end evidence

Cold live page, fresh browser context, says: **“Make classroom songs together.”** It identifies **K–8 music teachers and students** and the first action **“Try it with sample data”**, with the adjacent explanation **“Opens a four-bar rhythm in a private demo.”** The required one-click sample is present at `/demo#composer`; the demo banner says it is sample data and is not saved. This first-read requirement passes.

Live interaction checks passed:

- The demo opens with “Morning call and response,” a 256-cell grid, keyboard Space toggle and ArrowRight focus movement.
- The maximum UI settings accepted were 64 bars, 4 octaves, chromatic scale, and 200 BPM; that rendered 800 visible cells. WAV export completed at this boundary, as did MIDI export. The normal sample produced `morning-call-and-response.wav` and `.mid` downloads.
- A malformed song URL recovered with a plain-language fresh-song message. A blank gallery nickname announced “Add a nickname first.” and returned focus to its labelled input.
- Live gallery create → submit → teacher read → delete passed. Three live atomic-capacity trials each persisted 120 submissions and refused the 121st.
- The documented request allowance observed is **120 songs per board**. The same client went beyond it and received **429** with `Retry-After: 60`; the API response was `Cache-Control: no-store`.

## Local quality gates

All passed from the clean candidate checkout:

```text
npm test                 12 passed
npm run test:api         11 passed
npm run test:e2e         passed (30 passed, 10 intentional live-only skips)
npm run build            passed; dist/ produced
```

`GRIDSONG_LIVE_URL=https://gridsong.sociobot.in npx playwright test tests/live.spec.ts` passed all 8 desktop/mobile live checks: cold routes, demo privacy/keyboard/reduced motion/offline reload, accessible 404, and real two-browser gallery submission.

Build budget: JavaScript 37.86 KB raw / 12.84 KB gzip; CSS 17.64 KB raw / 4.81 KB gzip; generated hero WebP 81.17 KB. This is below the static-product budgets.

Independent mobile Lighthouse against `/demo`: performance **96**, accessibility **100**, best practices **100**, SEO **100**; FCP 0.9 s, LCP 1.4 s, CLS 0, 102 KB transfer, and zero third-party transfer.

## Deployment, privacy, accessibility, and routing evidence

- `origin/main` resolves to the candidate commit. Local production JS, CSS, and `sw.js` SHA-256 values exactly equal the live files.
- Live static asset caching is correct: hashed JS uses `public, max-age=31536000, immutable`; `sw.js` uses `no-cache`; HTML uses a 30-second revalidation cache.
- Live responses include HTTPS, `nosniff`, strict-origin referrer policy, camera/microphone/geolocation denial, and a same-origin CSP with `frame-ancestors 'none'` as a response header.
- A fresh demo Playwright request log contained only `https://gridsong.sociobot.in` requests (`/demo`, local JS/CSS, and the local hero image). No console errors or page errors occurred.
- Axe WCAG A/AA/2.1 AA scans in the local and live desktop/mobile suites had zero violations. Keyboard skip links focus `main`; note cells use Space and Arrow keys; reduced-motion mode removes note transitions. The live 390×844 page had `scrollWidth === innerWidth === 390`.
- `/`, `/demo`, `/privacy/`, `/terms/`, and `/404.html` all returned 200. A mistyped live route returned HTTP 404 with the accessible recovery page. All discovered internal links returned 200.

## Verification limits

No `verify-url.sh` exists in this repository, so its specified checks were independently covered with Playwright, curl, Axe, link crawling, headers, console/page-error logging, and Lighthouse.
