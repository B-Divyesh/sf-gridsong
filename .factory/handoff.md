# Gridsong independent verification 9 — FAIL

**Candidate:** `58aacde1a3898347173be720aa22d9d8e7f119d8`
**Live URL:** <https://gridsong.sociobot.in>
**Decision:** **FAIL**

The candidate is functional and its deployed static assets exactly match the candidate build, but it cannot be released under the factory contract. README and legal pages make visitor-facing claims that are absent from `.factory/claims.json` and therefore lack required observable tagged tests. This is a P1 release blocker.

See `.factory/verification-9.md` for the exact unsupported assertions, complete claim-by-claim results, live/API evidence, accessibility/privacy/header/caching checks, and remediation. All existing declared claim tests passed; the defect is that the inventory is incomplete.

## How verified

```sh
npm ci
npm --prefix api ci
npm test
npm run test:api
npm run test:e2e
npm run build
npm run test:live
GRIDSONG_LIVE_URL=https://gridsong.sociobot.in npx playwright test tests/live.spec.ts
```

The build produces `dist/`; JS is 12.84 KB gzip and CSS is 4.81 KB gzip. Mobile Lighthouse scored 96 performance, 100 accessibility, 100 best practices, and 100 SEO.

## Required next step

Add a `.factory/claims.json` entry and exact tagged test for every retained README/privacy/terms claim called out in `verification-9.md`, or remove/qualify each claim. Re-run every listed claims command and a fresh independent verification.

---

# Previous builder handoff (superseded by verification 9)

## Done

Resolved every finding in `.factory/review-1.md`: the real composer no longer displays demo-only controls, both sample URLs stay isolated, README copy is plain, the gallery data claim has an exact request-body test, the untestable provenance footer line is gone, and Privacy, Terms, and 404 use the shared accessible route skeleton.

The night-market neon notation identity, static Vite artifact, local song storage, offline shell, WAV/MIDI exports, and class gallery flow are preserved.

## Verify locally

```sh
npm ci
npm --prefix api ci
npm test
npm run test:api
npm run build
npm run test:e2e
```

Every command in `.factory/claims.json` must also pass from a clean checkout. The production artifact is `dist/`, with `dist/index.html` at its root.

## Evidence

- Unit: 12 passed.
- API: 11 passed.
- Browser: 30 passed across desktop and 390px mobile; 10 live-only checks skipped locally by design.
- Build budget: JS 37.86 KB raw / 12.84 KB gzip; CSS 17.64 KB raw / 4.81 KB gzip; hero 81.17 KB.
- Local verifier: HTTP 200, one title/lang/main/h1, all images labelled, no console errors.
- Playwright Axe: zero WCAG A/AA violations on app, demo, legal, and 404 routes.
- Lighthouse desktop: performance 94, accessibility 100, best practices 100, SEO 100; LCP 1.5 s, CLS 0, TBT 60 ms.
- Screenshots and machine reports: `.factory/evidence/polish-1/local/`.
- Finding-by-finding map: `.factory/polish-1.md`.
- Clean clone at repair commit `942db624a4368309e29c80851d688ab27cfb2367`: every exact command in `.factory/claims.json` passed.

## Deployment and live verification

- Pushed repair commit `942db624a4368309e29c80851d688ab27cfb2367` to `origin/main`.
- Deployed `dist/` and `api/` to production app `sf-gridsong` in resource group `sociobot` with `swa deploy production --env production`.
- Azure deployment URL: <https://calm-grass-0df97b00f.7.azurestaticapps.net>.
- Product URL: <https://gridsong.sociobot.in>.
- Live verifier: HTTP 200, correct title/lang/main/image labels, and no console errors; evidence is under `.factory/evidence/polish-1/live/`.
- Live Playwright: 8 passed across desktop and 390px mobile, covering every polish finding, Axe, privacy requests, keyboard use, reduced motion, offline reload, 404, and a real gallery submission.
- Live API: malformed-request smoke, create → submit → read → delete, and three atomic 120-song capacity trials passed.
- Cold checks confirmed the real route hides demo controls, `/?demo=1` shows isolated sample data, legal routes focus their main content, and unknown routes return the designed HTTP 404.

## Known gaps

None in the repaired scope. The product intentionally has no AI feature; composition, export, offline use, and classroom collection are the useful core job.
