# Gridsong polish round 3 handoff

**Runtime repair commit:** `692cb842c5cdd28001eb970c250facc092bc2793`

**Live URL:** <https://gridsong.sociobot.in>

**Deployment:** Azure Static Web Apps production configuration `sf-gridsong` in `sociobot`, via `swa deploy --config-name production --env production`.

## Delivered

- Demo exit now clears both isolated `demo:` storage keys from either **Start for real** control, while preserving real songs.
- The offline promise is listed, marked, and proven for compose, local persistence through reload, MIDI, and WAV without a network.
- The class-gallery dialog now accurately names every stored field and links its rendered disclosure to the schema claim.
- Retained all prior first-screen, demo, copy, routing, legal-page, focus, 404, mobile, privacy, gallery, export, and accessibility repairs.
- Updated the verb-first catalog description, copy audit, demo documentation, claims manifest, local/live screenshots, Lighthouse reports, and cumulative finding map in `.factory/polish-3.md`.

## Verify

```sh
npm ci
npm test
npm run test:api
npm run build
npm run test:e2e
```

Run every exact command in `.factory/claims.json` individually for claim verification. Live verification is:

```sh
GRIDSONG_LIVE_URL=https://gridsong.sociobot.in npx playwright test tests/live.spec.ts --workers=1
npm run test:live
/opt/fleet/lib/verify-url.sh https://gridsong.sociobot.in .factory/evidence/polish-3/live
```

## Evidence

- Clean clone `/tmp/gridsong-polish-3-clean-8RRZF0` at the runtime repair commit: all 26 declared claim commands passed individually; `npm test` passed 16, `npm run test:api` passed 14, and build produced `dist/index.html`.
- Local browser suite: 62 passed across desktop and 390px; Playwright Axe found zero violations on product, demo, legal, and 404 routes.
- Live browser suite: 10 passed across desktop and 390px, including both demo exits, offline edit/save/WAV/MIDI, route focus, gallery disclosure, 404, and real teacher/student submission.
- `npm run test:live` passed live API smoke, complete gallery flow, and three 120-song atomic-capacity trials.
- Local Lighthouse: 99 performance / 100 accessibility / 100 best practices / 100 SEO. Live Lighthouse: 100 / 100 / 100 / 100. Full reports and screenshots are in `.factory/evidence/polish-3/`.

## Known gaps

None.
