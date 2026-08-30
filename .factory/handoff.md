# Gridsong repair handoff — PASS

**Work order:** `gridsong-repair-5`
**Base verifier candidate:** `e5a845d2421e6a3240d0e5e47fd116b68ccacf4b`
**Repair commit:** `1648a8f fix: enforce gallery capacity atomically`
**Production URL:** <https://gridsong.sociobot.in>

## Outcome

The release-blocking gallery race and its related forwarded-header issue are repaired and deployed. A gallery now has 120 storage-backed submission slots. Azure Table atomically creates one slot row per submission, so simultaneous requests cannot occupy the same slot or exceed the gallery bound. Existing UUID-format submissions count toward the same bound during the format transition.

The handler no longer derives an in-process request limit from caller-supplied forwarding headers. The documented gallery bound is now the storage-enforced 120-song capacity, rather than an identity-based request-limit claim.

## Reproduction and regression coverage

Before the repair, a live fresh board received 121 concurrent valid submissions with distinct caller forwarding values. All 121 returned `201`, 121 appeared in the teacher view, and all were removed afterward. The new deployed-origin regression also detected the old candidate with `{"201":121}`.

- `api/test/validation.test.js` now exercises 121 simultaneous reservations against a collision-aware Table-client model and asserts exactly 120 admitted/persisted slots plus one refusal. It also checks that 119 legacy UUID submissions leave exactly one slot.
- `scripts/live-gallery-capacity.mjs` creates a fresh board, submits 121 songs concurrently, requires exactly `120 × 201` and `1 × 429`, reads exactly 120 entries, and removes every test submission. It runs three trials by default and is part of `npm run test:live`.
- API source regression coverage rejects reintroducing a dependency on `X-Forwarded-For` for gallery admission.

## Verification

Fresh installs used Node `v22.23.2` / npm `10.9.8`:

```sh
npm ci                                      # 58 packages, 0 vulnerabilities
npm --prefix api ci                         # 28 packages, 0 vulnerabilities
npm test                                    # 9/9 Vitest tests passed
npm run test:api                            # 9/9 API tests passed
npm run build                               # TypeScript + Vite passed; dist/ produced
npx playwright install chromium             # matching Chromium 151 installed
npm run test:e2e                            # 13 passed; 3 intentional skips
npm run test:live                           # API smoke, full gallery flow, 3 capacity trials passed
GRIDSONG_LIVE_URL=https://gridsong.sociobot.in \
  npx playwright test tests/live.spec.ts --workers=1  # desktop + 390px: 2/2 passed
```

The local browser suite exercises keyboard note editing, MIDI/WAV downloads, separate-context gallery UI, 390px layout, axe, and an offline service-worker reload. Live desktop and 390px checks found zero axe violations, zero console/page errors, no normal-load request origin other than `https://gridsong.sociobot.in`, and no mobile page overflow. A live service-worker update check found an active controller with no waiting worker; an offline reload retained the title and 256 note cells.

Live response checks confirmed root `200`, self-only CSP including `frame-ancestors 'none'`, HSTS, `nosniff`, strict-origin referrer policy, denied camera/microphone/geolocation permissions, short shell caching, and immutable hashed assets. Malformed gallery JSON returns `400` JSON with `Cache-Control: no-store` and the required Function security headers. Local and live `index.html` have the identical SHA-256 `6c1187911088fe6b491b58293280b69fb8b1bb7d6944716802544b9a8d50a745`.

Mobile Lighthouse against production: **Performance 100**, **Accessibility 100**, LCP **1,486 ms**, CLS **0**, transfer **100,850 B**. Build assets: JS 33,830 B (11,802 B gzip), CSS 16,313 B (4,550 B gzip), hero image 81,172 B.

## Deployment

Deployed with the repository production configuration:

```sh
swa deploy production --env production --no-use-keychain
```

Azure Static Web Apps reported successful production deployment to the configured `sf-gridsong` Standard app.

## Known gaps

None for this repair. The product remains a static Vite application with the same Azure Static Web Apps HTTP Function gallery deployment class.
