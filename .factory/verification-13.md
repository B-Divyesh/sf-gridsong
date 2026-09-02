# Independent verification 13 — FAIL

**Work order:** `gridsong-verify-13`

**Candidate commit:** `56f2390809d880f71a4306eed173d1f6b28b02bd`

**Live URL:** <https://gridsong.sociobot.in>
**Verified:** 2026-09-02

## Release decision

**FAIL.** The deployed product matches the candidate and completes the researched classroom composition, save/share, export, offline, and teacher-gallery jobs. All 26 declared claim commands pass. The candidate is still release-blocked because the primary note grid and several navigation links do not meet the supplied 44×44 px touch-target baseline. A separate caching defect gives unversioned resources a one-year immutable lifetime.

## Mandatory first-read and claims gate

A cold 390×844 visit answers all three first-screen questions in plain words:

- What it does: **“Make and play songs on a classroom grid.”**
- Who it is for: **“For K–8 music teachers and students…”**
- What to do first: **“Try it with sample data,”** followed by **“Opens a four-bar rhythm in a private demo.”**

The sample action ends at 629 px in the 844 px viewport. One click opens `/demo#composer` with the four-bar “Morning call and response” song and the persistent Demo, Reset demo, and Start for real controls. This gate passes.

`.factory/claims.json` exists with 26 claims. From the initially clean candidate checkout, after `npm ci`, I ran every listed `test` command separately and exactly as declared. **All 26 passed.** The gate covers demo isolation, local save/reload, valid WAV/MIDI files, complete song links, offline compose/save/export, same-origin privacy, settings boundaries, all six sounds, keyboard editing, audio gesture gating, gallery capability separation and schema, 90-day retention/cleanup, teacher removal, 120-song capacity, 390 px layout, 404 recovery, and documentation inventory.

## Quality-gate results

| Check | Result |
| --- | --- |
| Candidate identity | PASS; clean starting tree at `56f2390809d880f71a4306eed173d1f6b28b02bd` |
| `npm ci` | PASS; 0 audit vulnerabilities |
| 26 individual claim commands | PASS; 26/26 |
| `npm test` | PASS; 16/16 |
| `npm run test:api` | PASS; 14/14 |
| `npm run build` | PASS; strict TypeScript check and `dist/` output |
| `npm run test:e2e` | PASS; 50 executed, 12 live-only/project skips |
| Live Playwright suite | PASS; 10/10 across desktop and 390 px |
| `npm run test:live` | PASS; malformed request, create/submit/read/delete, three capacity trials |
| Fleet `verify-url.sh` | PASS; HTTP 200, title/lang/h1/main/alt/buttons, no console errors |
| Live mobile Lighthouse | PASS; Performance 97, Accessibility 100, Best Practices 100, SEO 100 |
| Axe WCAG A/AA/2.1 AA | PASS; zero violations on live product/demo/legal/404 routes |
| Touch-target baseline | **FAIL; see F-13-1** |

There is no lint script. The available type check runs inside `npm run build`. Node was `v22.23.2`; npm was `10.9.8`.

## Independent product evidence

- The shipped demo loaded 48 notes across four bars. Play advanced the visible playhead and Stop ended playback.
- MIDI downloaded as a 429-byte file beginning `MThd`. WAV downloaded as a 1,716,552-byte `RIFF/WAVE` file. A 64-bar, four-octave, 50 BPM boundary song also exported a valid 54,278,324-byte WAV in 908 ms without a browser error.
- A copied demo link restored title, scale, four bars, two octaves, 104 BPM, and note state in a new page.
- The live boundary controls reached chromatic, 64 bars, four octaves, 200 BPM and 50 BPM. The maximum one-bar view rendered 800 labelled note controls without page-level horizontal overflow.
- Invalid song data, an invalid student class pass, a blank nickname, and a song with no notes all produced specific recovery messages. The blank nickname moved focus to its input.
- A real teacher/student flow passed in separate browser contexts: create board, copy student class pass, compose, submit “QA Blue Fox,” poll on the projector, and remove the entry.
- A separate single-client API run accepted and persisted exactly 120 submissions. Submission 121 returned `429`, `Retry-After: 60`, and the full-board explanation. Invalid payload returned 400; a student key could not read the board. Verifier-created submissions were deleted.

## Accessibility, privacy, PWA, and performance

- Keyboard checks pass for skip-link navigation, Space note toggling, ArrowRight grid movement, Enter activation, and native dialog focus/return. Focus uses a visible 3 px mango outline. The dialog initially focuses Close and returns focus to its opener.
- Reduced motion changes note transitions to `0.00001s` and removes transforms. A 640 CSS px / 2× device-scale check had no page or dialog overflow.
- Cold and demo request logs used only `https://gridsong.sociobot.in`. No `Set-Cookie`, browser cookies, trackers, third-party fonts, or third-party scripts were observed. Opening the demo gallery made no API request.
- API responses use `Cache-Control: no-store`. Page responses include HSTS, `nosniff`, strict-origin referrer policy, restrictive permissions policy, and a same-origin CSP with header-delivered `frame-ancestors 'none'`.
- The service worker was activated and controlling `/demo`; `registration.update()` left one active worker with no waiting worker and only `gridsong-shell-v7`. Offline reload restored the demo, banner, and 256-cell grid; the dedicated claim test additionally proved offline edit/save/WAV/MIDI.
- Production output is 38.82 KB JavaScript (13.00 KB gzip), 17.88 KB CSS (4.85 KB gzip), no web fonts, and an 81.17 KB WebP hero. Mobile Lighthouse measured FCP 0.9 s, LCP 1.5 s, TBT 210 ms, CLS 0, and Speed Index 0.9 s.

## Deployment parity

Local `dist/` and live responses matched byte-for-byte for `index.html`, `assets/index-CdZ0YS_Y.js`, `assets/index-CINgIdLK.css`, `route-entry.js`, `sw.js`, `privacy/index.html`, `terms/index.html`, and `404.html`. The live JS/CSS names equal the current production build. Live API validation messages, capability separation, 90-day behavior, create/submit/read/delete flow, atomic 120-entry bound, and `Retry-After: 60` also match candidate behavior.

## Defects by severity

### High — F-13-1: primary mobile note controls miss the mandatory touch-target size and spacing

At 390×844, every note button measures **40×44 px** and the grid has only **4 px** row/column gaps. The default two-octave grid exposes 256 affected controls; the supported four-octave view exposes 800. This is the product’s primary interaction for children on phones, not a secondary compact control. It violates both supplied requirements: targets at least 44×44 px and adjacent targets at least 8 px. It also contradicts `.factory/design.md`, which says those exact minima apply and that the phone grid will not shrink below a usable target.

The source sets `repeat(16, minmax(40px, 1fr))` and `gap: 4px` at `src/style.css:117`, with `.note-cell { min-width: 40px; min-height: 44px; }` at line 118. Increase both dimensions to at least 44 px, use at least 8 px separation, retain the intentional horizontal scroller, and add a 390 px bounding-box regression.

The same audit found smaller secondary targets: the header wordmark is 138.1×36 px; the app footer links are 20–24.8 px high; and the legal-page `sociobot.in` link is 92.5×20 px. Expand their clickable areas to 44×44 px without changing their visible type.

### Medium — F-13-2: one-year immutable caching is applied to unversioned resources

The deployed `/route-entry.js`, `/legal.css`, `/assets/night-market-grid.webp`, and `/assets/gridsong-social.jpg` all return `Cache-Control: public, max-age=31536000, immutable`, although their filenames do not change with content. `public/staticwebapp.config.json:14-17` applies immutable caching to every asset plus every root JS/CSS file. A returning browser may keep obsolete route behavior, legal styling, or artwork for a year after a deployment, and a new service-worker cache can ingest the stale HTTP-cache response. Keep immutable caching for Vite’s hashed JS/CSS only; fingerprint these stable resources or make them revalidate. (`/sw.js` correctly returns `no-cache`.)

### Low — F-13-3: the install description uses banned, ambiguous product jargon

`public/manifest.webmanifest:4` says **“A local-first classroom step sequencer.”** “Local-first” is explicitly banned by the supplied plain-words contract and is ambiguous for a product whose optional class gallery sends data to the server. Replace it with concrete installed-app copy and include that surface in the copy audit.

## Evidence

Fresh screenshots, fleet URL output, Lighthouse JSON, and concise manual/API results are under `.factory/evidence/verification-13/`.
