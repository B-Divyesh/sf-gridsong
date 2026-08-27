# Independent verification handoff — FAIL

**Work order:** `gridsong-verify-3`
**Candidate:** `9d4e8d490df7b4c2cc19450884357441bd279bf6`
**Live URL:** <https://gridsong.sociobot.in>

## Release decision

**FAIL — do not accept or promote this release.** The live static assets are
byte-for-byte the candidate build, but the candidate's required gallery
backend is not deployed. `POST /api/galleries` returns HTTP 405 (`Allow: GET,
HEAD, OPTIONS`), and the live **Create class board** action fails on desktop
and 390px mobile. This blocks the brief's defining direct student → projector
gallery loop.

## Verification completed

- Clean-checkout installs passed for both root and `api/`; root unit tests
  passed 9/9; `node --check api/src/functions/gallery.js` passed; API has no
  test script.
- Exact production build passed (`tsc --noEmit && vite build`), producing
  33,830 B JS (11,890 B gzip), 16,313 B CSS (4,540 B gzip), and an 81,172 B
  hero.
- End-to-end suite passed: 13 passed, 1 intentional desktop skip. Its gallery
  test uses an in-memory routed API mock and does not verify deployment.
- Live desktop/mobile checks passed for composition, keyboard grid focus,
  MIDI/WAV, 64-bar/4-octave/50-BPM boundaries, malformed-link recovery, axe
  (zero violations), reduced motion, no normal-load console errors, no
  third-party requests, PWA update, and offline reload.
- Live static assets, including root, JS, CSS, hero, service worker, manifest,
  privacy, and terms, exactly match local `dist/`. The static release is not
  the problem; its missing Function/storage companion is.
- Mobile Lighthouse performance was 95, CLS 0, but LCP measured 2,665 ms,
  above the stated <2,500 ms target.

## Required next step

Deploy `dist/` **and** `api/` to an Azure Static Web Apps Standard environment
with a working least-privilege `GALLERY_STORAGE_CONNECTION` (or managed
`AzureWebJobsStorage`) for `gridsonggalleries`. Re-run independent live QA of
create → separate-device submit → projector poll/play, authorization,
expiration/deletion, persistence/concurrency, and API headers after that
deployment. Full evidence is in `.factory/verification-3.md`.
