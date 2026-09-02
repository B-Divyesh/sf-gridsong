# Polish round 1 — cumulative finding map

Reviewed and repaired against `.factory/review-1.md` at commit `f34cdcafd58239bee07d969a2de314b14c4cf0ed`. No earlier review or polish report exists in this repository.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Demo banner CSS now renders only when `hidden` is absent. The real route has no rendered demo wording or controls; `/demo` and `/?demo=1` retain isolated sample storage, reset, and start-for-real controls. | `puts the teacher audience and sample action on the cold first screen`; `@claim:demo-sandbox`; `.factory/evidence/polish-1/local/screenshot-mobile.png`; `.factory/evidence/polish-1/local/demo-mobile.png`; live URL check to be recorded after deployment. |
| F-1-2 | Split the README opening into short sentences; the longest is 18 words. | `.factory/copy-audit.md`; README source review. |
| F-1-3 | Replaced implementation jargon in the reader-facing feature list with teacher outcomes. Kept technical material under **Develop and deploy**. | `.factory/copy-audit.md`; README source review. |
| F-1-4 | Added `gallery-submission-data` to `.factory/claims.json`. Its browser test intercepts a real client submission and requires exactly `submitKey`, `nickname`, and `song`. | `npm run test:e2e -- --grep @claim:gallery-submission-data`; full browser suite. |
| F-1-5 | Removed the untestable “Original synths and generated illustration” footer claim. The footer now contains attribution and build version only. | `puts the teacher audience and sample action on the cold first screen`; `.factory/evidence/polish-1/local/screenshot-mobile.png`. |
| F-1-6 | Privacy and Terms now share the product header navigation, visible skip link, focusable main target, legal links, Param Factory attribution, and version footer. The 404 uses the same header navigation. | `legal routes use the shared navigation and move skip-link focus to main`; Axe checks; `.factory/evidence/polish-1/local/privacy-desktop.png`; live URL check to be recorded after deployment. |

## Local quality evidence

- `npm test`: 12 passed.
- `npm run test:api`: 11 passed.
- `npm run test:e2e`: 30 passed across desktop and 390px mobile; 8 live-only checks skipped as designed.
- `npm run build`: passed; 37.86 KB JS (12.84 KB gzip), 17.64 KB CSS (4.81 KB gzip), 81.17 KB hero image.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4174 .factory/evidence/polish-1/local`: HTTP 200, title/lang/main/alt checks passed, no console errors.
- Playwright Axe integration: zero WCAG A/AA violations on app, demo, legal, and 404 routes.
- Lighthouse desktop: performance 94, accessibility 100, best practices 100, SEO 100; LCP 1.5 s, CLS 0, TBT 60 ms.

## Screenshot evidence

- `.factory/evidence/polish-1/local/screenshot-mobile.png` — real route at 390px, no demo banner.
- `.factory/evidence/polish-1/local/demo-mobile.png` — isolated `/?demo=1` route at 390px with banner.
- `.factory/evidence/polish-1/local/privacy-desktop.png` — repaired legal-route skeleton.
