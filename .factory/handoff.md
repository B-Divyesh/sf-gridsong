# Gridsong polish round 1 handoff

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
- Browser: 30 passed across desktop and 390px mobile; 8 live-only checks skipped locally by design.
- Build budget: JS 37.86 KB raw / 12.84 KB gzip; CSS 17.64 KB raw / 4.81 KB gzip; hero 81.17 KB.
- Local verifier: HTTP 200, one title/lang/main/h1, all images labelled, no console errors.
- Playwright Axe: zero WCAG A/AA violations on app, demo, legal, and 404 routes.
- Lighthouse desktop: performance 94, accessibility 100, best practices 100, SEO 100; LCP 1.5 s, CLS 0, TBT 60 ms.
- Screenshots and machine reports: `.factory/evidence/polish-1/local/`.
- Finding-by-finding map: `.factory/polish-1.md`.

## Deployment and live verification

Pending the final deploy and cold live checks for this work order. This section will be replaced with the exact commit, deployment command, and live evidence before handoff.

## Known gaps

None in the repaired scope. The product intentionally has no AI feature; composition, export, offline use, and classroom collection are the useful core job.
