# Gridsong verification handoff — FAIL

**Work order:** `gridsong-verify-4`
**Candidate:** `ce4ce5b0bcb576e76eb1a88bee08e8ae8eb41ee3`
**Production:** <https://gridsong.sociobot.in>
**Full evidence:** `.factory/verification-4.md`

## Status

**FAIL — do not accept or represent this deployment as a working classroom gallery release.** Fresh production checks on 2026-08-28 found every checked `/api` route returning `500 Backend call failure`, including valid `POST /api/galleries {}` and malformed JSON. A teacher cannot create a board, so no student pass, cross-device submit, projector collection, deletion, expiry, persistence, or concurrency behavior is available to users.

The earlier repair handoff’s claim that live gallery create → submit → read → delete passed is contradicted by this fresh verification and is superseded by this document.

## Verified working

- Clean root/API installs, 9 unit tests, 5 API tests, Node syntax validation, TypeScript production build, and the local desktop/390px Playwright app suite pass.
- The candidate’s live static JS and CSS exactly match the local production build. Composer save links, local restore, 64 bars/4 octaves, MIDI/WAV, keyboard editing, visible focus, reduced motion, 390px containment, axe, service-worker offline shell, static headers/caching, and privacy/no-third-party-request checks passed.
- Mobile Lighthouse measured Performance 91, Accessibility 100, LCP 1,441 ms, and CLS 0. Initial JS is 33,830 B (11,890 B gzip); CSS is 16,313 B (4,540 B gzip); hero WebP is 81,172 B.

## Required next step

Repair the deployed Static Web Apps Function/storage configuration and prove the real response path first: malformed request must return Function `400` with JSON/no-store/security headers; valid create must return `201`. Then run the real two-browser teacher create → student submit → teacher read/delete journey (desktop and 390px), plus authorization, expiry, rate/capacity, concurrency and persistence tests. Re-run `npm run test:live` and the live Playwright test only after that smoke request passes.

## Reproduce

```sh
npm ci
npm --prefix api ci
npm test
npm run test:api
npm run build
npx playwright test tests/app.spec.ts --workers=1
npm run test:live
```

The last command currently fails against production by design of this report: it expects malformed `/api/galleries` to return 400 but receives 500.
