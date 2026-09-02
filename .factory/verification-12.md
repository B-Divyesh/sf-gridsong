# Independent verification 12 — PASS

**Work order:** `gridsong-verify-12`  
**Candidate commit:** `b05e18d0f710aea32b1079849218f2dc15659b0f`  
**Live URL:** <https://gridsong.sociobot.in>  
**Verified:** 2026-09-02

## Release decision

**PASS.** The candidate satisfies the researched classroom-sequencer contract and its deployed static app is byte-for-byte the production build from the tested commit. No release-blocking defects were found.

## Mandatory first-read and claim gate

Fresh cold browser read of `/`:

- It says what it does: **“Make and play songs on a classroom grid.”**
- It says who it is for: **“K–8 music teachers and students.”**
- It says what to do first: **“Try it with sample data”**, explained as **“Opens a four-bar rhythm in a private demo.”**

The action opens `/demo#composer` in one click with the four-bar “Morning call and response” composition and persistent **“Demo — sample data, nothing is saved”** banner, Reset demo, and Start for real. The first-screen plain-words and demo-sandbox requirements pass.

`.factory/claims.json` is present with 26 claims. After a clean root `npm ci`, I ran every declared command individually and exactly as written. **All 26 passed.** This includes browser exports, complete links, isolated demo storage, offline reload, privacy request/cookie checks, 1–64 bars / 1–4 octaves / 50–200 BPM boundaries, keyboard grid operation, direct two-device gallery submission, protected student capability, 90-day expiry, and 120-song capacity.

## Quality evidence

| Check | Result |
| --- | --- |
| Clean dependency install: `npm ci` | PASS; 0 audit vulnerabilities reported |
| All 26 individually declared claim commands | PASS |
| `npm test` | PASS; 16/16 |
| `npm run test:api` | PASS; 14/14 |
| `npm run test:e2e` | PASS; 50 passed, 12 deployed-only tests skipped locally |
| `npm run build` | PASS; TypeScript check and `dist/` output |
| `GRIDSONG_LIVE_URL=https://gridsong.sociobot.in npx playwright test tests/live.spec.ts --workers=1` | PASS; 10/10 across desktop and 390 px |
| `npm run test:live` | PASS; malformed request, gallery create/submit/read/delete, and three concurrent-capacity trials |
| `/opt/fleet/lib/verify-url.sh` against live URL | PASS; HTTP 200, title/lang/one h1/main/image alt/button labels, no console errors |
| Live mobile Lighthouse | PASS; Performance 92, Accessibility 100, Best Practices 100, SEO 100; LCP 1.6 s, CLS 0, TBT 340 ms |

There is no separate lint script. `npm run build` is the repository's available static type check and exact production build.

## Independent functional, privacy, and accessibility checks

- Exercised normal composition, note toggle/save/reload, WAV and MIDI download, copied song link restoration, class-board create → student submit on another browser context → projector read → teacher delete, and malformed API input recovery (400). The full board accepts **120** songs; submission **121** returned **429** with `Retry-After: 60`, then verifier-created submissions were deleted.
- Boundary and recovery coverage passed through the declared sandbox tests: all documented scale, bar, octave, and tempo extrema; keyboard Space/Arrow editing; empty MIDI recovery; expired boards; and unknown-route recovery.
- At both 1280×900 and 390×844, live `/demo` has no page-level horizontal overflow. Keyboard focus is visible (3 px outline), the skip link reaches `main`, and grid Space/Arrow operation works. A reduced-motion context reports instant note transitions. Axe WCAG A/AA/2.1 AA scans have zero violations at both sizes.
- The PWA service worker controls the live demo. After a first visit, offline reload remains usable in its own browser context; update coverage confirms no waiting worker. The browser has no console/page errors.
- Cold and demo request logs contain same-origin resources only. No cookies, third-party fonts/scripts, analytics, accounts, or external requests were observed. `/`, `/demo`, `/privacy/`, `/terms/` return 200 and the designed unknown route returns 404.
- Live headers include HSTS, `X-Content-Type-Options: nosniff`, strict-origin referrer policy, restrictive permissions policy, and a same-origin CSP with header-delivered `frame-ancestors 'none'`. HTML has 30-second revalidation; hashed JS/CSS/image assets are one-year immutable; `sw.js` is `no-cache`.

## Deployment and budget parity

SHA-256 parity passed between fresh local `dist/` and the product domain for `index.html`, `route-entry.js`, `sw.js`, `assets/index-CINgIdLK.css`, and `assets/index-BMyFkeLr.js`. The app therefore matches candidate `b05e18d0f710aea32b1079849218f2dc15659b0f` rather than an older deployment.

Production output is 38.62 KB JavaScript (12.91 KB gzip), 17.88 KB CSS (4.85 KB gzip), and an 81.17 KB WebP hero. These are within static-app budgets.

## Defects by severity

None found.

## Evidence

Machine-captured URL verification screenshots, response HTML, and Lighthouse JSON are in `.factory/evidence/verification-12/`.
