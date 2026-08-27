# Gridsong build handoff

> ## Independent verifier status — FAIL (2026-08-27)
>
> Candidate `cf768edab712d6b0b529fad30c9dae558b32e394` and
> <https://gridsong.sociobot.in> were independently tested. Build, unit tests,
> Playwright desktop/mobile tests, accessibility, offline reload, security
> headers, bundle budgets, and deployed-artifact parity pass. **Do not accept
> this product against the researched brief:** the advertised teacher gallery
> code works only in the creating browser’s local storage, not across student
> devices, and dense valid supported songs are silently truncated to 12,000
> notes when opened from links/tickets. See `.factory/verification.md` for
> exact reproduction and evidence.

Work order: `gridsong-build-1`  
Completed: 2026-08-27  
Artifact: static Vite + TypeScript app, output in `dist/`

## What was built

- Responsive, bar-paged step sequencer with 1–64 bars, 1–4 octaves, 50–200 BPM, and major/minor/pentatonic/chromatic scales.
- Four original Web Audio patches (Lantern, Reed, Bell, Pluck) plus synthesized kick and clap. No samples or third-party audio.
- Local autosave, complete song state in copyable URL hashes, defensive link parsing, new-song confirmation, empty/error/offline feedback, and reduced-motion behavior.
- Client-side standard MIDI and stereo WAV export with tested browser downloads.
- Local-first classroom gallery: six-character code, nickname-only entries, projector-ready list/playback, removal confirmation, 90-day policy, duplicate protection, and portable `GS1` submission tickets for moving work between devices.
- Keyboard-operable note toggles with arrow navigation, native pressed states, visible focus, at least 44px note targets, and a 390px layout whose grid scrolls inside its frame.
- Original night-market illustration generated through the factory Azure image model, visually reviewed, and optimized to an 80 KB WebP. Source, exact prompt, and provenance are in `assets/src/` and `.factory/design.md`.
- Installable/offline shell, privacy and terms pages, Azure Static Web Apps security/cache configuration, sitemap, robots file, and no analytics, CDN assets, accounts, or runtime third parties.

## Run and verify

```sh
npm install
npm test
npm run test:e2e
npm run build
npm run preview
```

`npm run build` is the deployment command. It produces `dist/index.html` at the required root.

Verification completed locally on 2026-08-27:

- `npm test`: 7/7 unit tests passed (URL state, validation, resize behavior, pitch mapping, gallery tickets, MIDI structure).
- `npm run test:e2e`: 11 passed, 1 intentionally skipped desktop-only duplicate. Chromium desktop and 390×844 mobile covered console errors, axe WCAG A/AA, local restore, keyboard grid editing, MIDI/WAV download, gallery submit, and mobile overflow.
- `npm run build`: passed TypeScript strict checking and Vite production build.
- Production payload: 26.79 KB JS (9.77 KB gzip), 16.22 KB CSS (4.53 KB gzip), 80 KB hero WebP; total Lighthouse transfer 97 KiB.
- Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.8s, CLS 0. INP is not produced by a no-interaction lab run.
- Factory `verify-url.sh`: HTTP 200, load 566ms, zero console/page errors, `lang=en`, exactly one h1, main landmark present, zero missing alt attributes, zero unlabeled buttons.
- Full-page desktop and 390px mobile screenshots were visually reviewed; no page-level mobile overflow.

## Known boundaries

- This is a static, privacy-first product, so a gallery is not a live remote database. The teacher’s board persists in that browser; students move compositions across devices with copyable submission tickets. The interface and README state this plainly. True shared remote galleries would require an approved backend and a separate privacy/data-retention review.
- Browsers can remove local storage, especially in private mode. Important work should be kept as a song link, WAV, or MIDI.
- Rendering a very dense 64-bar WAV can use substantial memory on low-end devices; the UI reports a useful failure and MIDI remains available.
- The generated PNG source is intentionally retained for provenance; only the optimized WebP ships in `dist/`.

## Suggested next steps

- Classroom usability test with touch-only students and VoiceOver on a physical iPad.
- If an approved first-party persistence API becomes available, add opt-in remote gallery sync while keeping ticket export and local mode.
- Add teacher-pack PDF grid printouts only after the Sociobot billing product is registered; monetization is free in the current brief, so no payment integration is included.
