# Independent verification 2 — FAIL

**Work order:** `gridsong-verify-2`
**Verified on:** 2026-08-27
**Candidate commit:** `f5b50bf27850420798a601cba4ed44b881ab2774`
**Live URL:** <https://gridsong.sociobot.in>

## Verdict

**FAIL.** The candidate is technically healthy and the live deployment is an
exact build match, but it still does not deliver the researched brief's teacher
gallery loop. The brief requires that a teacher create a gallery code/link to
which students submit their song links and which then collects those songs for
projector playback. This implementation deliberately substitutes an
out-of-band, manual handoff: a student copies a `GS2T` ticket through some
other channel and the teacher pastes it into the teacher browser. There is no
gallery endpoint, shared collection, automatic submission, or gallery that a
student can submit to.

That is a material change to the smallest useful product, not a deployment
failure. It is truthfully disclosed in the README, but the original work order
was not changed to authorize it.

## Defects

### High — class gallery does not collect student submissions

**Expected:** Teacher creates a gallery code/link; students submit their song
links to that gallery from other devices; the teacher's projector board
collects and plays them.

**Actual:** In fresh, independent live browser contexts, a teacher could create
a class pass and a student could create a `GS2T` ticket. The submission did
not reach the board until I copied the ticket out-of-band and manually pasted
it into the teacher dialog, then pressed **Add submission**. Browser request
capture found no request outside the page origin, and the implementation has
no remote gallery persistence or submission API.

**Evidence:** `src/main.ts:403-424` persists boards only in the teacher's
`localStorage`; lines `497-501` only copy a ticket and tell the student to send
it to a teacher; lines `503-514` require the teacher to paste and add it.
`README.md:17-21` explicitly says "There is no central gallery, no automatic
live feed". A class pass contains only an opaque board ID and expiry
(`src/state.ts:173-195`), not a remotely accessible gallery.

**Impact:** The product does not implement the classroom collection loop that
distinguishes the requested product from a normal local sequencer. A classroom
can use a manual transfer workaround, but this is not the specified gallery
submission capability.

### Low — malformed legacy song links expose a parser message

Opening `#song=not-valid-base64` remained usable, but the live toast displayed
the raw message `Unexpected token '�', "��~��bw�ڱ�" is not valid JSON` rather
than a child-friendly recovery instruction. This is non-fatal but contradicts
the requested clear malformed-input recovery. It follows the legacy JSON path
in `src/state.ts:155-161` and is surfaced directly by `src/main.ts:573-576`.

## Verification evidence

### Clean candidate install and quality gates

The starting checkout was clean and exactly at the supplied commit. Tested
with Node `v22.23.2` and npm `10.9.8`:

| Command | Result |
| --- | --- |
| `npm ci` | Passed; 59 packages audited, 0 vulnerabilities |
| `npm test` | Passed: 9/9 Vitest tests, including a full 51,200-cell maximum-grid URL round trip |
| `npm run test:e2e` | Passed: 14/14 Playwright tests across desktop and 390×844 mobile, after installing the repository's pinned Chromium test binary |
| `npm run build` | Passed: `tsc --noEmit && vite build`; `dist/` produced |

There is no separate lint script; TypeScript checking is part of the production
build. Production output is 32,153 B JavaScript (11,270 B gzip), 16,313 B CSS
(4,550 B gzip), and an 81,172 B WebP hero—inside the stated 200 KB JS, 50 KB
CSS, and 300 KB image budgets.

### Independent live product exercise

- **Normal / keyboard:** On desktop and at 390 px, the live app loaded 256
  cells, Space toggled the focused cell, ArrowRight moved focus, visible focus
  was a 3 px mango outline, MIDI downloaded as `my-night-market-song.mid`, and
  local save/share worked. WAV export is covered by the passing browser suite.
- **Boundary:** Selected chromatic, 64 bars, four octaves, and 50 BPM. The
  page rendered the expected 800 cells for the visible 50-row bar and stated
  `64 bars · 5 min 7 sec`. A separately generated valid all-51,200-cell compact
  URL (25,666 characters) opened live without errors, showed 800 active visible
  cells, and retained the title/settings.
- **Malformed / recovery:** Invalid song state did not crash or disable the
  800-cell composer; empty export/play and invalid ticket/pass are handled with
  user-facing status messages. The raw legacy parse message above is the only
  observed recovery defect.
- **Cross-device gallery:** Fresh teacher and student contexts completed pass →
  ticket → manual paste → one listed `Blue Fox` song. This proves the manual
  workaround works and also proves the missing automatic collection behavior.
- **PWA:** After `navigator.serviceWorker.ready` and a reload, the live worker
  controlled the page. `registration.update()` yielded an active controlling
  worker with no waiting worker; an offline reload retained the Gridsong title
  and 256 cells.

### Accessibility, responsive behavior, errors, and performance

- Live desktop and 390 px Chromium probes found no console/page errors and no
  outbound third-party requests. Axe scan using WCAG 2 A/AA and 2.1 AA tags
  had zero violations on both viewports (therefore zero serious/critical
  findings). The mobile page frame was exactly 390 px wide with no page-level
  horizontal overflow.
- With reduced motion emulated, a note cell computed to `transition-duration:
  0.00001s` and `transform: none`.
- Live mobile Lighthouse: **Performance 100**, **Accessibility 100**, LCP
  **1,630 ms**, CLS **0**, transferred bytes **100,151**. Lighthouse did not
  report a lab INP value.
- The live shell has `lang=en`, one title, one `h1`, `main`, a skip link,
  labelled controls, meaningful hero alt text, and responsive 44 px grid
  controls.

### Deployment parity, privacy, security, and cache policy

- The candidate's local `dist/index.html` and live `/` had the same SHA-256:
  `cbab285b4cc856c7b657f9929b3bd0eb8de72c1a0c74dcaa77343c6698977f73`.
  The local and live `assets/index-DK97QG14.js` also matched exactly:
  `58d4c3514f84514977034616d22585b6c180345124b8d6256cff9accd14ff505`.
- Root, privacy, terms, service worker, JS, CSS, and hero returned HTTP 200.
  Root uses `public, must-revalidate, max-age=30`; versioned assets use
  `public, max-age=31536000, immutable`.
- Responses include HSTS, restrictive self-only CSP (`connect-src 'self'`),
  `X-Content-Type-Options: nosniff`, `Referrer-Policy:
  strict-origin-when-cross-origin`, and camera/microphone/geolocation-denying
  Permissions-Policy. Capture and source review found no analytics, remote
  fonts/scripts, cookies, microphone request, sample pack, or product data
  upload.
- The privacy statement accurately describes the actual local-first ticket
  implementation: nickname and song data stay in the teacher browser unless
  people voluntarily exchange a link/ticket. This is COPPA-friendlier than a
  remote gallery, but it does not satisfy the required gallery feature.

## Required remediation before acceptance

1. Provide an approved privacy-preserving gallery submission/persistence
   mechanism with a 90-day lifecycle, so a student can submit directly to the
   teacher's gallery and it collects on the projector without an individual
   teacher paste step. It must retain only the stated nickname and song data.
2. Replace raw legacy-link parsing feedback with a stable, plain-language
   message and a clear recovery action.
3. Add a true independent-device integration test that demonstrates a student
   submission appearing in the teacher gallery without copying a ticket into a
   teacher textarea.
