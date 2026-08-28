# Gridsong repair handoff — PASS

**Work order:** `gridsong-repair-4`
**Function repair:** `ec746ae` (`fix: make managed gallery function boot reliably`)
**Final deployed main:** `25771a5` (preserves the repaired gallery route precedence)
**Production:** <https://gridsong.sociobot.in>

## Outcome

The release-blocking gallery outage documented in `verification-4.md` is repaired and deployed. The managed Azure Static Web Apps Function now starts through an explicit CommonJS Node v4 bootstrap (`api/src/index.js`) instead of relying on a direct ESM function entry. The prior deployment reached the backend but failed before any handler could run, producing headerless `500 Backend call failure` responses. The configured, table-scoped storage SAS was independently probed and is valid; the repaired Function now reaches the handler and storage normally.

The API package has a regression test that verifies the production manifest points at the CommonJS bootstrap and that Node can execute that exact entry. This protects the failure boundary that the earlier validation tests did not exercise.

## Production evidence

Deployed with the checked-in Azure Static Web Apps production configuration:

```sh
SWA_CLI_DEPLOYMENT_TOKEN="$(az staticwebapp secrets list --name sf-gridsong --resource-group sociobot --query properties.apiKey -o tsv)" \
  swa deploy production --env production --no-use-keychain
```

Immediately after deployment, production `POST /api/galleries` with malformed JSON returned:

- `400` with `{"error":"Please send the song again."}`
- `Content-Type: application/json; charset=utf-8`
- `Cache-Control: no-store`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

`npm run test:live` passed against the custom domain: it checks malformed-input handling and the real create → student submit → teacher read → delete flow. `GRIDSONG_LIVE_URL=https://gridsong.sociobot.in npx playwright test tests/live.spec.ts --workers=1` also passed in both desktop and 390px mobile projects (2/2), using independent teacher and student browser contexts.

## Verification performed

Fresh installs and production build:

```sh
npm ci                                  # 58 packages, 0 vulnerabilities
npm --prefix api ci                     # 28 packages, 0 vulnerabilities
npm test                                # 9/9 passed
npm run test:api                        # 6/6 passed
npm run build                           # tsc --noEmit + Vite, passed
```

Browser and accessibility coverage:

```sh
npx playwright test tests/app.spec.ts --workers=1
# 13 passed, 1 expected desktop-only mobile-frame skip
```

That suite covers desktop and 390px mobile, keyboard grid editing, visible focus, Axe WCAG 2 A/AA + 2.1 AA scans, MIDI/WAV, mocked gallery UI behavior, responsive containment, service-worker offline reload, and update-safe shell behavior. No lint script exists; TypeScript checking is part of `npm run build`.

Live mobile Lighthouse (simulated throttling) measured Performance **100**, Accessibility **100**, LCP **1,555 ms**, CLS **0**, and total transfer **100,877 B**. Production assets remain within budget: JavaScript 33,830 B, CSS 16,313 B, and hero WebP 81,172 B.

Privacy and response-policy checks remain clean: the app ships no third-party fonts/scripts or analytics, uses only same-origin API calls, and the static and repaired API responses carry the configured restrictive security policies. The gallery remains local-first except for the stated nickname and compact song data stored in its 90-day server-backed board.

## Files changed

- `api/src/index.js` — explicit managed-Functions bootstrap.
- `api/src/functions/gallery.js`, `api/src/validation.js` — CommonJS-compatible Node v4 entry path.
- `api/package.json` — points `main` at the bootstrap.
- `api/test/validation.test.js` — regression coverage for the deployable entry.

## Known gaps / next step

No known release-blocking gaps remain. The gallery storage remains intentionally scoped to the `gridsonggalleries` table and board data expires after 90 days; continue the existing live smoke flow after future Function/runtime upgrades.
