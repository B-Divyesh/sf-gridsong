# Independent verification 6 — FAIL

**Work order:** `gridsong-verify-6`
**Candidate:** `0e5c4e6c20070d3965c8a948398daeeff525823a`
**Live URL:** <https://gridsong.sociobot.in>
**Verified:** 2026-08-30

## Verdict

**FAIL — do not release.** The live application exactly matches this candidate and its core sequencer, export, offline shell, teacher/student gallery, and concurrent gallery-capacity repair work. It nonetheless misses mandatory release requirements:

1. `.factory/claims.json` is absent. This was checked before product testing; there are no declared claim tests to run from a demo entry point. Missing claims is release-blocking.
2. Cold first-read fails. The landing page broadly says it makes/saves a song, but does not say it is for K–8/general music teachers and has no one-click **Try it with sample data** action. It instead offers **Start composing**. `/demo` and `/?demo=1` return the ordinary composer (`200`), with no sample data, isolated namespace, `Demo — sample data, nothing is saved` banner, Reset demo, or Start for real control.
3. The live gallery allows 120 submissions, then correctly returns `429`, but omits the required `Retry-After` header.

Consequently the required demo privacy request log and every claim test cannot be run. Claim-like copy (local saving, no account/ads/lost work, browser export) is also unlisted and unproven under the claims contract.

## Defects

### Release blocker — claims manifest/demo sandbox absent

Clean checkout search (`rg --files --hidden -g '.factory/claims.json'`) found no claims file. No required `@claim:<id>` test or demo entry exists. Add a complete manifest, one observable test per claim, and a true isolated demo; test or remove every claim-like sentence from the page and README.

### Release blocker — required first-screen demo/audience copy absent

Fresh cold production text starts **“Make a song. Keep the song.”** and says “Tap in a tune … save a link … WAV or MIDI.” It does not identify teachers/K–8 on that screen. Its only first action is **Start composing**. There is no visible or accessible sample-data demo action. Direct checks of `/demo` and `/?demo=1` found no demo text, banner, reset, or real-data action. Implement the required first-screen button and isolated demo storage/banner flow.

### High — allowance 429 lacks `Retry-After`

**Observed allowance:** 120 song submissions per gallery. A real fresh board received 121 valid sequential submissions from one client; its teacher read contained 120 entries. The 121st response was:

```json
{"status":429,"retryAfter":null,"body":{"error":"This class gallery is full. Ask your teacher to make a new board."}}
```

All temporary entries were deleted. Return a meaningful `Retry-After` with capacity `429` and add an API/live regression assertion.

## Evidence

| Check | Result |
| --- | --- |
| `npm ci`; `npm --prefix api ci` | Passed; 58 and 28 packages respectively, 0 npm vulnerabilities |
| Claim tests | **Cannot run: `.factory/claims.json` missing** |
| `npm test` | Passed: 9/9 |
| `npm run test:api` | Passed: 9/9 |
| `npm run build` | Passed: TypeScript check + Vite; `dist/` produced |
| Lint | No lint script/configuration available |
| Isolated `npm run test:e2e` | Passed: 14 passed, 2 expected live-only skips |
| `npm run test:live` | Passed: malformed API, real gallery flow, and 3 capacity trials (120 accepted/persisted + 1 refusal each) |
| Live Playwright desktop + 390px | Passed: 2/2 real cross-device gallery flows |

The full local browser rerun used a persistent isolated preview after an earlier overlapping invocation lost its auto-managed server; Playwright reported `passed` in `.last-run.json`.

Production normal flow added/restored a note through a copied song URL, downloaded `my-night-market-song.wav` and `my-night-market-song.mid`, and recovered from `#song=not-valid-base64` with 256 usable cells. Live axe WCAG 2 A/AA + 2.1 A/AA scans had **0 violations** on desktop and 390px. Both had no console/page errors, no overflow, a visible 3px focus outline, and reduced-motion duration `0.00001s`. Local keyboard, offline, export, and mobile tests passed.

A fresh live context was service-worker controlled with no waiting worker; after caching, offline reload retained the title and 256 cells. Normal page requests were only same-origin (HTML, self-hosted JS/CSS/hero); no third-party fonts/scripts or analytics requests were observed. The whole-demo request assertion remains impossible without a demo.

Root and standard static routes returned `200`; root has self-only response-header CSP including `frame-ancestors 'none'`, HSTS, nosniff, strict-origin referrer policy, and denied camera/microphone/geolocation. Malformed gallery POST returned JSON `400`, `Cache-Control: no-store`, and matching API headers. Hash-named JS is immutable for one year; shell cache is 30 seconds. Build sizes are JS 33,830 B (11,890 B gzip), CSS 16,313 B (4,540 B gzip), hero 81,172 B.

## Deployment parity

Local production build equals live SHA-256:

- `index.html`: `6c1187911088fe6b491b58293280b69fb8b1bb7d6944716802544b9a8d50a745`
- JS: `19f081841e4ebead89e5ff27cfe6ddb13512c1e6532d5a48250aebbd01c7ef85`
- CSS: `158656bc3e1ae3b9bba44d83bd4cd1d8e8d697b050186778c4494a7dc63168f0`
- Hero WebP: `d248e38cc68e43b80ba3d904010227b0077a17952cb511afb5bf68ca739b58c7`

## Release condition

Add and pass the claims/demo contract, satisfy the required first-screen audience/sample-demo shape, and add `Retry-After` to gallery capacity 429. Then rerun all claim tests via `/demo` or `?demo=1`, full local tests, `npm run test:live`, and live desktop/mobile gallery verification.
