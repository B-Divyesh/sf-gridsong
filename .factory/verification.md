# Independent verification — FAIL

**Work order:** `gridsong-verify-1`  
**Verified on:** 2026-08-27  
**Candidate commit:** `cf768edab712d6b0b529fad30c9dae558b32e394`  
**Deployed URL:** <https://gridsong.sociobot.in>

## Verdict

**FAIL.** The technical build and deployed artifact are healthy, but the required
cross-device teacher gallery workflow is not present. A gallery code only names
an item in the teacher browser's `localStorage`; it is not a gallery link/code
to which students can submit. This is a material miss against the researched
brief's smallest useful product: “Teacher creates a gallery code; students
submit their link to it and the class can play them back on the projector.”

The README accurately describes the implemented ticket workaround, but an
intentional scope reduction is still a failure of the supplied work order.

## Defects

### High — gallery codes do not work across devices

**Expected:** A teacher can create a gallery code/link and a student on another
browser/device can submit a song to that gallery; the teacher sees it on the
projector board.

**Actual:** In independent fresh browser contexts, I created a teacher gallery
with code `R3WDSD`, entered that exact code in the second context, and received:
`That gallery is not on this device, or it has expired. Ask the teacher for a
ticket workflow.` There is no network/API request to persist or submit a
gallery. The product instead requires a student to copy a `GS1` ticket and a
teacher to paste it manually.

**Evidence:** `src/main.ts:397-415` reads/writes only `localStorage`; lines
`434-441` reject any code not present in that browser; the README expressly
documents this serverless limitation at lines `14-17`.

**Impact:** The classroom collection loop in the brief cannot be performed by
sharing the advertised gallery code. This is not merely an offline fallback:
the gallery’s identifier is unusable by students, so the specified “submit to
it” workflow is absent.

### High — a valid maximum-grid song is not reliably round-trippable as a song link

**Expected:** The promised 64-bar, four-octave grid can be saved/shared without
silent note loss, or the product must communicate/enforce a smaller limit before
composition/export.

**Actual:** A 64-bar chromatic four-octave grid has 50 rows (48 melodic + 2
percussion) × 1,024 steps = 51,200 possible notes. `sanitizeSong` silently
keeps only the first 12,000 valid notes when opening a link/ticket. The editor
does not impose that limit, and URL encoding is uncompressed JSON, so dense
songs also create impractically large URLs.

**Evidence:** `src/state.ts:32-43` accepts the 64-bar/4-octave values then
applies `.slice(0, 12000)`; `src/state.ts:48-58` encodes JSON directly in the
hash. The app markets a “complete song” URL in `README.md:3`.

**Impact:** A student can create a valid grid composition locally that loses
notes when a recipient opens its shared link or submission ticket—the exact
lost-work failure the product is intended to solve.

## Verification evidence

### Clean install, tests, and build

Performed from the clean candidate checkout with Node `v22.23.2` and npm
`10.9.8`:

| Command | Result |
| --- | --- |
| `npm ci` | Passed; 59 packages audited, 0 vulnerabilities |
| `npm test` | Passed: 7/7 Vitest tests |
| `npm run test:e2e` | Passed: 11 Playwright tests on desktop and 390×844 mobile; 1 intentional desktop-only skip |
| `npm run build` | Passed (`tsc --noEmit && vite build`); emitted `dist/` |

Production output is small: JS 26,793 bytes / 9,730 gzip bytes and CSS 16,223
bytes / 4,537 gzip bytes. Both are within the stated static-web budgets; the
hero WebP is 81,172 bytes.

### Product exercise

- **Normal:** created/toggled notes; local restoration after reload; arrow-key
  navigation and Space toggling; MIDI and WAV download; local gallery create,
  nickname submission, gallery playback path. These are additionally covered
  by the passing browser suite.
- **Boundary:** selected 64 bars, four octaves, chromatic scale, and 50 BPM.
  The app rendered 800 cells for the shown bar and displayed `64 bars · 5 min
  7 sec`; 390px page width remained 390px with the intentionally scrollable
  grid contained within its frame.
- **Malformed/recovery:** an invalid `#song=not-valid-base64` hash did not
  crash and left the 256-cell composer usable; empty export, empty playback,
  malformed gallery code, and malformed ticket each produced a user-facing
  recovery message. (The malformed hash message exposes a raw JSON parse
  string on hash changes, but it is non-fatal.)
- **PWA/offline:** the deployed service worker became controller after a normal
  reload; an offline reload then succeeded with the expected title and 256
  cells. An explicit `registration.update()` completed with an active,
  controlling registration and no waiting worker. Cache lifecycle is
  source-reviewed at `public/sw.js:1-15`.

### Accessibility, responsiveness, and performance

- Desktop and 390px live Chromium checks: no page errors or console errors;
  no axe WCAG 2 A/AA/2.1 AA violations; keyboard ArrowRight moved focus to the
  next grid note; CSS provides a 3px `:focus-visible` mango outline; reduced
  motion removes animation/transform transitions.
- Live Lighthouse mobile run: Performance **97**, Accessibility **100**, LCP
  **1,430 ms**, CLS **0**. No lab INP was produced.
- The app has `lang=en`, a title, one `h1`, `main`, alt text for the meaningful
  illustration, a skip link, and no desktop/mobile page-level horizontal
  overflow. The note controls are 44px high.

### Deployment parity, privacy, and security

- The live `/` response body SHA-256 exactly equals the local `dist/index.html`:
  `33d40a41fad3d44c1b6c3190ae6c781d937dbbffdf67e356760cd3b8efa293fc`.
  The live hashed JavaScript exactly equals the candidate build:
  `d427381d3c0354d7f945e459c1cef492c1f9ed790c8c1b4c3b31401146f07868`.
- Live root, JS, privacy, and service-worker responses were HTTP 200. The root
  is short-cacheable (`max-age=30`); hashed assets are
  `public, max-age=31536000, immutable`.
- Live headers include HSTS, CSP (`default-src 'self'` and restrictive
  `connect-src 'self'`), `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, and a restrictive
  `Permissions-Policy`. The configured policies are in
  `public/staticwebapp.config.json:3-13`.
- Browser request capture found no third-party/outbound requests. Source review
  found no analytics, cookies, remote fonts/scripts, microphone use, or sample
  assets. The privacy/terms pages are present and accurately disclose local
  storage plus link/ticket data. The gallery privacy claim is technically
  consistent with the implemented local-only behavior.

## Required remediation before acceptance

1. Implement an approved privacy-preserving, 90-day remote gallery submission
   service (or revise the original work order only with explicit authorization),
   so a student can actually submit to a teacher’s gallery code/link from a
   separate browser/device.
2. Make URL/ticket state lossless for every supported composition, preferably
   with a compact encoding and an explicit tested maximum well below practical
   browser URL limits; otherwise constrain the editor before notes are lost.
3. Add integration tests proving cross-device gallery submission and maximum
   supported song link/ticket round trips.
