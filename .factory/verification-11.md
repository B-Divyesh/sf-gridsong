# Independent verification 11 — FAIL

**Work order:** `gridsong-verify-11`  
**Candidate commit:** `5c91bec2b022378cf54eaed546ea19f36e91b163`  
**Live URL:** <https://gridsong.sociobot.in>  
**Verified:** 2026-09-02

## Release decision

**FAIL.** The deployed front end is an exact build match for the candidate and
the core classroom composer/gallery flow works, but this candidate does not
meet the required clean-checkout claims gate and misses the mandatory 44 px
touch-target baseline.

## Mandatory claims and cold read

`.factory/claims.json` is present with 26 declared tests. From a clean root
dependency install (`npm ci`), I ran every command in that file individually,
exactly as declared. **22 passed; four failed**, so the claims gate is failed:

| Failing claim command | Observed failure |
| --- | --- |
| `student-pass-submit-only` | `Cannot find module '@azure/functions'` |
| `gallery-record-schema` | `Cannot find module '@azure/functions'` |
| `gallery-expiry-cleanup` | `Cannot find module '@azure/functions'` |
| `gallery-capacity` | `Cannot find module '@azure/functions'` |

All four failures come from the documented root install leaving the separate
`api/` package uninstalled. After explicitly running `npm --prefix api ci`,
the complete API suite passed (14/14), confirming this is a clean-install/
test-entry defect rather than a demonstrated gallery behavior failure. It is
nevertheless release-blocking: a declared claim command fails from the clean
checkout under the repository's root installation instruction.

The cold live first screen passes the plain-words/demo check. It says
**“Make and play songs on a classroom grid,”** names **“K–8 music teachers and
students,”** and exposes **“Try it with sample data”** with the result
**“Opens a four-bar rhythm in a private demo.”** `/demo#composer` opens in one
click with the persistent “Demo — sample data, nothing is saved” banner,
Reset demo, and Start for real controls.

## Quality evidence

| Check | Result |
| --- | --- |
| `npm ci` | PASS; root dependencies installed cleanly, 0 vulnerabilities reported |
| 26 individual `.factory/claims.json` commands after root install | **FAIL: 22 passed, 4 failed** as listed above |
| `npm --prefix api ci && npm run test:api` | PASS; 14/14 tests |
| `npm test` | PASS; 15/15 tests |
| `npm run build` | PASS; TypeScript check and `dist/` output |
| `npm run test:e2e` | PASS; 48 passed, 12 deployment-only skipped (1.9 min) |
| `npm run test:live` | PASS; malformed API request, gallery flow, and 3 capacity trials |
| Live request/console inspection | PASS; same-origin assets only; no page or console errors |

There is no separate lint script; `npm run build` includes the available
TypeScript check. Production output is 38.62 KB JavaScript (12.91 KB gzip),
17.81 KB CSS (4.85 KB gzip), and an 81.17 KB hero WebP, below the static
product budgets.

## Independent product checks

- Demo keyboard use works: focusing a grid cell and pressing Space changes
  `aria-pressed` to `true`. Invalid empty MIDI export gives the useful recovery
  message “Add a note before exporting MIDI.”
- Axe WCAG A/AA scans of live `/demo#composer` at 1440 px and 390 px found zero
  serious or critical violations. Keyboard Tab gives the skip link and demo
  controls a visible 3 px focus outline. Reduced-motion context has no active
  animations and reduces note transitions to `0.00001s`.
- PWA check passed: the live worker was active and controlling the page; after
  first load, offline reload of `/demo` returned 200 and the demo/h1 remained
  usable without errors.
- Live routes `/`, `/demo`, `/privacy/`, and `/terms/` returned 200; an unknown
  path returned the designed 404. HTML has 30-second revalidation, hashed JS
  is one-year immutable, and `sw.js` is `no-cache`.
- Cold live request log contained only Gridsong HTML, JS, CSS, route script,
  and image requests. No cookies, analytics, third-party origins, console, or
  page errors were observed. Responses include HSTS, `nosniff`, strict-origin
  referrer policy, restrictive permissions policy, and same-origin CSP with
  header-delivered `frame-ancestors 'none'`.
- Candidate/deployment parity passed: SHA-256 values for `index.html`, hashed
  JS/CSS, and `sw.js` were identical locally and live.
- Live gallery check passed: create → submit → teacher read → delete worked.
  Three concurrent trials accepted/persisted 120 submissions and refused the
  extra one. A fresh sequential check observed **120 accepted**, then **429
  with `Retry-After: 60`**, with all 120 verifier submissions deleted.

## Defects

### High — declared API claim tests fail after the repository's clean root install

The root `npm ci` does not install `api/node_modules`, but four claim commands
invoke `npm run test:api` and immediately fail resolving `@azure/functions`.
The README root install instruction is likewise only `npm install`. Add a
root workspace/pretest install that includes `api`, or explicitly make the
canonical clean-install command install both packages before any declared claim
command. Re-run all 26 commands from a clean checkout.

### Medium — demo-banner actions are below the 44 px mobile touch-target minimum

At 390×844, the visible **Reset demo** and **Start for real** controls measure
171×32 px (desktop: 112×32 and 121×32). These are frequent, interactive
controls and miss the product/accessibility contract's 44 px minimum. Increase
their hit area to at least 44 px in both layouts and retest keyboard/focus.

