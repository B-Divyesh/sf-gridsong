# Gridsong repair handoff

Work order: `gridsong-repair-1`
Completed: 2026-08-27
Artifact: static Vite + TypeScript app; deploy `dist/`

## Repaired blockers

- Replaced the browser-local six-character gallery lookup with a truthful static cross-device handoff. A teacher board creates a portable **student class pass** URL (`GSP1`); a student can open it in a fresh browser/device, compose, and make an addressed `GS2T` ticket. The teacher pastes that ticket into the local projector board. The UI, README, privacy notice, and terms explain that this is a deliberate handoff, not a live shared remote gallery.
- The pass contains an opaque board reference and expiry only. A ticket contains that destination reference, the student’s voluntary classroom nickname, and the song. Neither is sent to a Gridsong API, and there is no server-side gallery persistence, account, analytics, or COPPA-sensitive collection.
- Replaced JSON song hashes with a compact 3-bit-per-grid-cell `GS2S` format. It losslessly carries every note in the documented maximum 64-bar, four-octave chromatic grid (50 × 1,024 = 51,200 notes) in a URL hash under 30 KB. Import never slices notes: it rejects structurally impossible/ambiguous data with a clear message. Existing JSON song links remain readable.
- Kept local autosave, MIDI export, browser WAV export, song URLs, 90-day local teacher-board policy, offline shell behavior, keyboard navigation, and mobile grid scrolling intact. The service worker now discovers and precaches Vite’s hashed app JS/CSS on install (`gridsong-shell-v3`).

## How to run and verify

```sh
npm ci
npm test
npm run test:e2e
npm run build
npm run preview
```

`npm run build` produces `dist/index.html` for deployment.

Local verification completed on 2026-08-27:

- `npm test`: **9/9** passed, including the full 51,200-note compact URL round trip and portable class-pass/ticket parsing.
- `npm run test:e2e`: **13 passed, 1 intentionally skipped** across Chromium desktop and 390×844 mobile. This includes axe WCAG A/AA scanning, no-console-error load, local restore, keyboard/MIDI/WAV, an independent teacher/student browser-context class-pass → ticket → teacher-import flow, cached offline reload, and mobile overflow.
- `npm run build`: passed TypeScript and Vite. Initial JS is 32.15 KB (11.35 KB gzip); CSS is 16.31 KB (4.54 KB gzip), both within the static-app budget.
- Browser checks above provide the required axe and offline coverage. The app remains self-contained with no runtime outbound requests or third-party assets.
- A production `vite preview` live check returned HTTP 200 for `/`, `/privacy/`, and `/terms/`; the hashed JS was served with immutable cache headers.

## Known boundaries

- The class pass is an explicit, asynchronous device-to-device handoff. It is not a live room and student tickets do not appear on the projector until the teacher receives and pastes them. This is intentional for a static, no-server, privacy-first product.
- Teacher boards are stored in that teacher browser for up to 90 days. Clearing browser storage, private-browsing limits, or device loss can remove them; song links, MIDI, and WAV remain the backup/export paths.
- A dense 64-bar WAV can use substantial memory on low-end devices. The UI reports render failure and MIDI remains available.

## Suggested next steps

- Test the pass/ticket handoff with a classroom’s approved transfer channel and physical iPad accessibility tools.
- If an approved first-party, privacy-reviewed service is introduced, add opt-in remote live gallery sync while retaining the current local pass/ticket mode.
