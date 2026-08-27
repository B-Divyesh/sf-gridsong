# Gridsong repair handoff

**Work order:** `gridsong-repair-3`
**Base verifier report:** `.factory/verification-3.md` at `7a836e626cefb9b31b3c070779a7bd8606fabe6c`
**Production:** <https://gridsong.sociobot.in>

## Released repair

- Fixed the release blocker: production now deploys the Azure Static Web Apps Function API alongside `dist/`. `swa-cli.config.json` pins the `sf-gridsong` Standard app, `dist`, `api`, and Node 22 runtime; its contract is covered by API tests.
- Provisioned Azure Table `gridsonggalleries` and configured the production Function with a table-scoped, HTTPS-only read/add/update/delete SAS. No secret is in the repository.
- Removed the unsupported timer trigger: managed Static Web Apps Functions permit HTTP triggers only. Expired boards remain immediately inaccessible at 90 days and are physically removed in bounded batches when a teacher creates a board. README and privacy notice now state this accurately.
- Repaired real Azure Table cleanup filtering (`Edm.Int64` milliseconds require `L`) and Function-v4 route extraction (`request.params`, not `context.bindingData`). These were both found and reproduced during the post-deploy live flow.
- Added direct live regression coverage for the original 405: malformed gallery requests must reach the Function and return 400/no-store/security headers. The live flow additionally covers create → student submit → teacher read → delete. A Playwright live journey exercises the same flow from distinct teacher/student browser contexts at desktop and 390px mobile.
- Function responses now include `nosniff`, referrer, permissions, JSON content-type, and `no-store` headers; static headers, CSP, offline shell, exports, keyboard sequencing, and existing behavior remain unchanged.

## Verify

```sh
npm ci
npm --prefix api ci
npm test
npm run test:api
node --check api/src/functions/gallery.js
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:live
GRIDSONG_LIVE_URL=https://gridsong.sociobot.in npx playwright test tests/live.spec.ts
```

Verified in this repair checkout:

- Clean installs: root 58 packages / API 28 packages, both with 0 vulnerabilities.
- Unit tests: 9/9. API tests: 5/5, including deployment contract, HTTP-only trigger constraint, Azure `Int64` expiry query, and capability payload validation.
- Production build passes: initial JS 33.83 kB (11.89 kB gzip), CSS 16.31 kB (4.54 kB gzip).
- Local Playwright desktop + 390px suite passed (13 passed; 3 intentional opt-in/device skips), covering axe WCAG 2 A/AA and 2.1 AA, keyboard grid edit/MIDI, WAV, mocked two-device gallery client behavior, mobile width, and offline shell reload. The explicit production browser gallery suite passed 2/2 (desktop and 390px mobile).
- `npm run test:live` passed against production: malformed `/api/galleries` → 400; real create → submit → teacher read → delete passed. The live API has `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and camera/microphone/geolocation-denying `Permissions-Policy`.
- Live root response has self-only CSP, HSTS, no-referrer leakage policy, cache policy, and no analytics/CDN font/script matches in source. Lighthouse mobile run: Performance 100, Accessibility 100, LCP 1,820 ms, CLS 0 (JSON was produced before Lighthouse's non-fatal final BFCache tab-crash diagnostic).

## Deployment

The repaired build and API were deployed to production with:

```sh
swa deploy production --env production --no-use-keychain
```

using the checked-in `swa-cli.config.json` and the factory-managed deployment credential. The Static Web App environment reports `Ready`.

## Known gap

Azure Static Web Apps managed Functions do not run timer triggers. Expired galleries are rejected exactly at 90 days; physical deletion is opportunistic, batched during subsequent board creation rather than a wall-clock daily job. This is the closest deployable privacy-preserving behavior within the required static/SWA artifact class and is disclosed in the product copy.
