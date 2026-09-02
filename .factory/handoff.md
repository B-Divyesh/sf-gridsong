# Gridsong review 3 handoff — FAIL

**Work order:** `gridsong-review-3`

**Reviewed commit:** `6a78a95f6bc04170b61dccb7a0bc972463e02513`

**Live URL:** <https://gridsong.sociobot.in>

**Completed:** 2026-09-02

## Outcome

The independent first-read review fails with one blocking and two minor findings. No product code was changed.

- F-3-1: **Start for real** leaves `demo:gridsong.song.v1` behind instead of discarding demo data.
- F-3-2: the offline banner promises offline editing, local saving, and exports, but the registered test proves only offline shell reload.
- F-3-3: the gallery dialog says it keeps “only nickname and song data” while its tested records also contain time, expiry, and protected checks.

The complete review, copy audit, exact fixes, claim results, and prior-finding audit are in `.factory/review-3.md`.

## Verification performed

- Opened the live site cold in fresh 390×844 and 1440×900 Chromium contexts.
- Entered the one-click demo, edited and reset its 48-note sample, checked separate storage keys, returned to real mode, and recorded all requests.
- Ran all 26 declared claim commands separately from a clean clone; all passed.
- Ran `npm test` (16 passed), `npm run test:api` (14 passed), `npm run build` (passed), and `npm run test:e2e` (50 passed, 12 deployment-only skipped).
- Crawled all rendered links and checked home, demo, Privacy, Terms, 404, metadata, deep links, Back, and route focus.
- Ran the factory URL verifier and live Axe scans on five routes at both viewports; no accessibility violations were reported.
- Confirmed live offline editing, persistence, MIDI export, and WAV export manually.

## Next steps

Apply the three concrete fixes in `.factory/review-3.md`, add the missing regression coverage, deploy, and rerun the complete review. The required standard is zero findings.
