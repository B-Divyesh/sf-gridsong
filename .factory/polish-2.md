# Polish round 2 — cumulative finding map

Repaired from candidate `047f912a5e5a533b10c061fe35c6829d77080e9e` against `.factory/review-2.md`, `.factory/review-1.md`, and `.factory/polish-1.md`.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Kept the demo banner governed by `.demo-banner[hidden]`, retained separate `demo:gridsong.*` storage, and made the header gallery action stay inside demo mode. | `@claim:demo-sandbox`; cold normal-route assertion in `puts the teacher audience and sample action on the cold first screen`; `.factory/evidence/polish-2/local/home-mobile.png`; `.factory/evidence/polish-2/local/demo-mobile.png`; <https://gridsong.sociobot.in/>; <https://gridsong.sociobot.in/?demo=1#composer>. |
| F-1-2 | Kept the README introduction split into three short sentences; the longest is 21 words. | `polish round 2 copy contract`; `.factory/copy-audit.md`; `README.md`. |
| F-1-3 | Kept reader-facing features in classroom language and restricted deployment terms to contributor sections. | `polish round 2 copy contract`; `.factory/copy-audit.md`. |
| F-1-4 | Kept `gallery-submission-data` in the claims manifest and its client interception test for the exact submission fields. | `npm run test:e2e -- --grep @claim:gallery-submission-data`; `.factory/claims.json`. |
| F-1-5 | Kept the untestable originality sentence out of the rendered footer. | `polish round 2 copy contract`; cold route screenshots; <https://gridsong.sociobot.in/>. |
| F-1-6 | Replaced the partial legal/404 header with the same grid-mark wordmark and four destinations used by the app and demo. | `every route uses the same complete product header`; `legal routes retain skip-link behavior and the complete footer`; `.factory/evidence/polish-2/local/privacy-desktop.png`; live `/privacy/`, `/terms/`, and `/no-such-page` checks. |
| F-2-1 | Replaced “every student device” with the bounded “Students can open it on another device.” | `@claim:student-pass-submit-only`; `@claim:gallery-direct-submit`; `polish round 2 copy contract`; live `/` copy check. |
| F-2-2 | Added a shared route-entry handler that focuses each destination h1 without scrolling and announces it in a polite live region. It also handles browser back/forward while retaining skip-link behavior. | `forward and back route changes focus and announce the page heading` on desktop and 390 px; `legal routes retain skip-link behavior and the complete footer`; live route-focus checks. |
| F-2-3 | Standardized all visitor-facing invitation wording on “student class pass,” including headings, actions, errors, legal copy, and README text. | `polish round 2 copy contract`; `.factory/copy-audit.md`; local and live source scans. |
| F-2-4 | Renamed the header action to “Open class gallery” and the reset action to “Start new song.” | `polish round 2 copy contract`; `the shared class-gallery destination opens the real gallery`; local screenshots. |
| F-2-5 | Replaced the remaining metaphor and slogan copy with task language, including the sound prompt, gallery instructions, footer, and default song title. | `polish round 2 copy contract`; `.factory/copy-audit.md`; `.factory/evidence/polish-2/local/home-mobile.png`. |
| F-2-6 | Rewrote reader-facing security and retention copy using “board ID,” “key that can only send songs,” “protected checks,” and “small batches.” | `polish round 2 copy contract`; `@claim:gallery-record-schema`; `@claim:gallery-expiry-cleanup`; `.factory/evidence/polish-2/local/privacy-desktop.png`. |

## Local acceptance evidence

- `npm test`: 15 passed.
- `npm run test:api`: 14 passed.
- `npm run test:e2e`: 48 passed across desktop and 390 px; 10 deployment-only checks skipped without `GRIDSONG_LIVE_URL`.
- `npm run build`: passed; `dist/` contains 38.62 KB JavaScript (12.91 KB gzip) and 17.81 KB CSS (4.85 KB gzip).
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4174 .factory/evidence/polish-2/local`: HTTP 200; title, language, h1, main, image alternative, labelled buttons, and console checks passed.
- Lighthouse mobile: performance 100, accessibility 100, best practices 100, SEO 100; LCP 1.8 s, CLS 0, TBT 10 ms.
- Playwright Axe scans cover app, demo, legal, and 404 routes at desktop and 390 px with zero serious or critical findings.
- The first sample action ends at 629 px on the 390×844 first screen and 791 px on the 1440×900 first screen. Both fit without scrolling or horizontal overflow.

## Screenshot evidence

- `.factory/evidence/polish-2/local/home-mobile.png`
- `.factory/evidence/polish-2/local/home-desktop.png`
- `.factory/evidence/polish-2/local/demo-mobile.png`
- `.factory/evidence/polish-2/local/demo-desktop.png`
- `.factory/evidence/polish-2/local/privacy-desktop.png`

Production evidence is recorded in `.factory/handoff.md` after deployment.
