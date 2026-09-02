# Gridsong verification 10 — PASS

**Verified candidate:** `6b270943fc26d9fc0e312da6ec8d6c1047a0896a`
**Production:** <https://gridsong.sociobot.in>

Independent QA passed. The live deployment exactly matches the candidate build and supports the complete classroom loop: compose, local save/link/export, isolated sample demo, teacher board, separate-device student submission, projector receipt, and teacher removal.

All 26 declared claim checks passed individually from a clean install, as did 13 frontend unit tests, 14 API tests, 52 local desktop/390px browser tests, 8 live browser tests, the exact production build, and live gallery/API capacity checks. The observed board allowance is 120 songs; the next submission receives `429` with `Retry-After: 60`.

See [verification-10.md](verification-10.md) for exact commands, first-read evidence, privacy request log and headers, Axe results, offline/service-worker checks, build budgets, deployment hashes, and no outstanding defects.

## Previous repair handoff

# Gridsong repair 8 — PASS

**Repair commit:** `2cc0f3facf859dc9f1f0f13e261e14195003b006`

**Production:** <https://gridsong.sociobot.in>

**Static Web Apps deployment:** <https://calm-grass-0df97b00f.7.azurestaticapps.net>

## What changed

This repair resolves the P1 claims-inventory failure from `.factory/verification-9.md`.

- Expanded `.factory/claims.json` from 12 to 26 exact, observable claims. It now covers the verifier’s missing scale/size/tempo, instrument, teacher-key, stored-record, expiry-cleanup, privacy-footprint, and user-gesture audio assertions.
- Rewrote retained README, Privacy, and Terms product statements so each functional assertion has a `claim:<id>` marker and a matching claim entry. Removed or qualified untestable privacy and legal wording rather than presenting it as a product guarantee.
- Added `src/claims-contract.test.ts` (`@claim:documentation-claims-inventory`). It scans every README/Privacy/Terms marker, requires an inventory entry and exactly one tagged test source, and explicitly protects all seven assertions named in verification 9.
- Added browser regression coverage for grid composition/settings limits, instruments/percussion, keyboard use, audio construction only after Play, teacher-key/pass separation, no-account local persistence, cookie/resource footprint, and teacher deletion.
- Added API regression coverage for teacher vs student capabilities, hashed gallery records, exact stored fields, immediate expiry rejection, and the 500-record bounded cleanup limit. The production behavior is unchanged; small pure helpers expose the existing policy for direct testing.
- Added `@types/node` as a development-only dependency so the repository-contract test type-checks during `npm run build`.

## Verification

Performed from a clean dependency install:

```sh
npm ci
npm --prefix api ci
npm test                 # 13 passed
npm run test:api         # 14 passed
npm run build            # passed; dist/ produced
npm run test:e2e         # 42 passed, 10 intentional live-only skips
```

Every one of the 26 commands listed in `.factory/claims.json` was then executed individually and passed, including `@claim:documentation-claims-inventory`.

Production browser verification passed:

```sh
GRIDSONG_LIVE_URL=https://gridsong.sociobot.in \
  npx playwright test tests/live.spec.ts
# 8 passed (desktop and 390px mobile)
```

That exercise covers cold and demo routes, keyboard controls, reduced motion, offline reload, accessible 404 recovery, privacy request scope, axe WCAG A/AA/2.1 AA scans, and a real teacher/student gallery submit and removal flow.

The required `verify-url.sh` is not present in this repository. Equivalent structural, console, route, link, header, and Axe checks are covered by the Playwright suites. A standalone `@axe-core/cli` attempt could not use the supplied browser because its bundled ChromeDriver supports Chrome 152 while Playwright supplies Chrome 145; the in-repo Playwright Axe integration passed locally and live instead.

Build output remains small: JavaScript **37.86 KB raw / 12.84 KB gzip**; CSS **17.64 KB raw / 4.81 KB gzip**. The existing independent mobile Lighthouse measurement for this unchanged static shell was 96 performance, 100 accessibility, 100 best practices, and 100 SEO (LCP 1.4 s, CLS 0). This repair does not change shipped app JS, CSS, images, or HTML.

## Deployment and live identity

- Pushed `2cc0f3f` to `origin/main` before deployment.
- Deployed `dist/` and `api/` with `swa deploy production --env production --no-use-keychain` using the repository’s `sf-gridsong` / `sociobot` configuration.
- Live `/`, `/demo`, `/privacy/`, and `/terms/` return 200. An unknown route returns the designed HTTP 404.
- SHA-256 checks confirm live hashed JS, CSS, and `sw.js` exactly match the deployed `dist/` files.
- Live hashed assets have immutable one-year caching; HTML is revalidated after 30 seconds. The production CSP remains same-origin with response-header `frame-ancestors 'none'`, and the response retains `nosniff`, strict-origin referrer policy, and camera/microphone/geolocation denial.
- The deploy CLI generated a local ignored `.env` credential file; it was removed immediately and was never read or committed.

## Known gaps

None in the repaired product scope. The product deliberately remains local-first and has no AI feature because composition, export, offline use, and classroom collection are the core job.
