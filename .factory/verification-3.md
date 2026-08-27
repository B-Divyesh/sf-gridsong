# Independent verification 3 — FAIL

**Work order:** `gridsong-verify-3`
**Verified:** 2026-08-27
**Candidate commit:** `9d4e8d490df7b4c2cc19450884357441bd279bf6`
**Live URL:** <https://gridsong.sociobot.in>

## Verdict

**FAIL.** The published static files are an exact production build of the
candidate, but the candidate's required same-origin gallery service is not
deployed. A fresh request to `POST /api/galleries` received **HTTP 405** with
`Allow: GET, HEAD, OPTIONS`; it did not reach the Azure Function in `api/`.
Consequently a teacher cannot create a class board on the live product, and a
student cannot submit a song or have it collect on the projector. This is the
distinguishing classroom loop in the researched brief and is therefore a
release-blocking deployment failure, not an optional operational concern.

## Defects

### High — live gallery API is absent, so direct cross-device gallery submission is unusable

**Expected:** A teacher creates a 90-day board, shares its submit-only pass,
and a separate student browser submits a nickname-only composition that
appears on the projector without manual ticket transfer.

**Actual:** `curl -X POST -H 'content-type: application/json' --data '{}'
https://gridsong.sociobot.in/api/galleries` returned `405` and an empty body
on 2026-08-27. In new desktop and 390px mobile browser contexts, pressing
**Class gallery** → **Create class board** produced “The class gallery could
not finish that. Please try again.” and Chromium logged the associated 405.
There is no board/pass to use for a separate-device submission, polling,
deletion, expiry, persistence, or concurrency test.

**Impact:** The smallest useful product is not available end to end. The live
README and privacy page promise a server-backed, 90-day gallery that the
deployed site cannot provide, so those statements are currently inaccurate in
production.

**Required remediation:** Deploy `api/` with Azure Static Web Apps **Standard**
as the API location and configure a working least-privilege
`GALLERY_STORAGE_CONNECTION` (or managed `AzureWebJobsStorage`) for the
`gridsonggalleries` table. Then independently verify create, direct submit in
separate browser contexts, teacher-only read/delete, 90-day rejection and
deletion, API response security/cache policy, request limits, and concurrent
submission behavior on the deployed origin.

### Low — one clean mobile Lighthouse run misses the stated LCP target

The mobile Lighthouse performance run scored 95 with CLS 0 and 100,883 B
transferred, but reported **LCP 2,665 ms**, above the factory performance
target of <2,500 ms. This is not the release-blocking issue, and lab numbers
can vary, but it does not meet the written target in this run.

## Test environment and quality gates

The checkout began clean at exactly the supplied commit. Environment: Node
`v22.23.2`, npm `10.9.8`, Playwright Chromium 151.

| Command | Result |
| --- | --- |
| `npm ci` | Passed; 58 packages installed; 0 vulnerabilities reported |
| `npm --prefix api ci` | Passed; 28 packages installed; 0 vulnerabilities reported |
| `npm test` | Passed: 9/9 Vitest tests |
| `node --check api/src/functions/gallery.js` | Passed |
| `npm --prefix api test --if-present` | No API test script exists |
| `npm run build` | Passed: `tsc --noEmit && vite build`; produced `dist/` |
| `npx playwright install chromium` | Passed |
| `npm run test:e2e` | Passed: 13 passed, 1 correctly skipped desktop-only mobile-frame check |

There is no lint script in `package.json`; TypeScript checking is included in
the production build. The browser suite's gallery scenario is useful client
coverage but routes `/api/**` to an in-memory mock, so it cannot establish
that the real Function/storage deployment exists. The real endpoint check
above disproves that it does.

The built initial application JavaScript is 33,830 B (11,890 B gzip), CSS is
16,313 B (4,540 B gzip), and the WebP hero is 81,172 B: all below the 200 KB
JS, 50 KB CSS, and 300 KB image budgets. Lighthouse mobile: Performance 95,
LCP 2,665 ms, CLS 0, total blocking time 24 ms, and total transferred bytes
100,883.

## Product exercise from fresh browser contexts

- On the live exact static build, the composer loaded with 256 note cells;
  empty Play gave “Light at least one note before playing,” and empty MIDI
  export gave “Add a note before exporting MIDI.” After adding a note, MIDI
  downloaded as `my-night-market-song.mid` and browser-rendered WAV as
  `my-night-market-song.wav` with the “WAV exported.” confirmation.
- Boundary settings of chromatic scale, 64 bars, four octaves, and 50 BPM
  rendered 800 cells for the visible bar, showed `Bar 1 of 64`, and stated
  `64 bars · 5 min 7 sec`. The local unit suite also passed its full
  51,200-cell maximum-grid compact URL round trip.
- All four melodic voice controls work and use pressed state; the UI also
  exposes synthesized kick and clap grid rows. Keyboard editing passed in the
  browser suite: Space toggles a cell and ArrowRight moves focus. Live desktop
  and mobile checks found the focus target with a visible `3px` mango outline.
- The invalid URL `#song=not-valid-base64` remained usable and showed the
  plain-language recovery message, “That song link got tangled. You can start
  a fresh song or ask for a new link.”
- The PWA shell registered and controlled the page; `registration.update()`
  left an active non-waiting worker, and a fresh offline reload still had the
  page title and 256 cells.

## Accessibility, privacy, requests, and response policy

- Fresh desktop and 390×844 mobile Axe scans with WCAG 2 A/AA and 2.1 AA tags
  had **zero violations** (therefore zero serious/critical findings). Both
  had one `h1`, one `main`, correct title, 256 cells, and no page-level mobile
  overflow. Normal loading produced no console or page errors.
- Reduced-motion emulation computed a note tile transition duration of
  `0.00001s` and `transform: none`.
- Captured normal-load browser requests went only to
  `https://gridsong.sociobot.in`; source/output review found no analytics,
  third-party fonts/scripts, cookies, microphone request, or sample-pack
  assets. The gallery attempt is the exception: it makes the necessary
  same-origin API request, which fails with the 405 above.
- Root responses provide HSTS, a self-only CSP including `connect-src 'self'`,
  `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, and a
  camera/microphone/geolocation-denying Permissions-Policy. The root uses
  `public, must-revalidate, max-age=30`; hashed JS/CSS and the hero use
  `public, max-age=31536000, immutable`.

## Deployment parity

The deployed static release exactly matches the candidate's `dist/` for all
checked public artifacts, including the root, JS, CSS, hero, service worker,
manifest, privacy page, and terms page. For example:

| Artifact | SHA-256 (local and live) |
| --- | --- |
| `index.html` | `6c1187911088fe6b491b58293280b69fb8b1bb7d6944716802544b9a8d50a745` |
| `assets/index-DgXnf7cQ.js` | `19f081841e4ebead89e5ff27cfe6ddb13512c1e6532d5a48250aebbd01c7ef85` |
| `assets/index-BZ7KWNCN.css` | `158656bc3e1ae3b9bba44d83bd4cd1d8e8d697b050186778c4494a7dc63168f0` |
| `sw.js` | `0fe252b3b3e71a7c33f8b5d030167eca3ede56d3b57821328368d7b1ae4f4a82` |

That static parity makes the failure unambiguous: the candidate introduces a
required backend in `api/`, but the deployed origin is serving only the static
portion of that candidate.
