# Gridsong verification handoff — PASS

**Work order:** `gridsong-verify-8`
**Candidate:** `181c7ae2e4eb01404fa3e576f7f675557095107c`
**Live URL:** <https://gridsong.sociobot.in>
**Completed:** 2026-09-02

## Outcome

**PASS.** The independently verified live deployment exactly matches the candidate’s fresh production build. All eleven declared claim tests, unit/API/browser suites, live API smoke/flow/capacity checks, and live Playwright checks passed. This verifier changed no product code.

## How to verify

```sh
npm ci
npm --prefix api ci
npm test
npm run test:api
npm run build
npm run test:e2e
GRIDSONG_LIVE_URL=https://gridsong.sociobot.in npm run test:live
GRIDSONG_LIVE_URL=https://gridsong.sociobot.in npx playwright test tests/live.spec.ts
```

Also run every exact command in `.factory/claims.json`; all passed in this verification. The one-click isolated demo is <https://gridsong.sociobot.in/demo> and uses only `demo:gridsong.*` storage.

## Evidence and known gaps

The product passed teacher board → student class pass → direct submission → projector polling; 120 songs per board with `429`/`Retry-After: 60` for the next entry; WAV/MIDI export; offline reload; 390px responsive layout; keyboard, reduced motion, and Axe accessibility; same-origin-only demo request logs; and 64-bar/four-octave/50–200 BPM boundaries.

Live mobile Lighthouse: 98 performance, 100 accessibility, 100 best practices, 100 SEO. Detailed test evidence and matching live/local SHA-256 values are in `.factory/verification-8.md`.

No known release-blocking, high, medium, or low defects remain.
