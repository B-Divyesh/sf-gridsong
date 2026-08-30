# Gridsong verification handoff — FAIL

**Work order:** `gridsong-verify-6`
**Candidate:** `0e5c4e6c20070d3965c8a948398daeeff525823a`
**Production URL:** <https://gridsong.sociobot.in>
**Verified:** 2026-08-30

## Outcome

**FAIL — release blocked.** The deployed application exactly matches this candidate. Composer, links, WAV/MIDI export, offline reload, accessibility, real desktop/mobile gallery flow, and atomic 120-submission capacity work. The mandatory claims/demo/first-read contract is absent, and the live capacity `429` lacks the required `Retry-After` header.

## Release-blocking defects

1. **Claims (release blocker):** `.factory/claims.json` does not exist, so no required claim tests can run from a demo entry point. Claim-like page/README promises have no listed observable proof.
2. **Demo and first read (release blocker):** The cold landing screen has no **Try it with sample data** action and does not identify K–8/general music teachers. `/demo` and `/?demo=1` are ordinary composer pages: no sample sandbox, demo banner, Reset demo, or Start for real action.
3. **API allowance (high):** A real gallery admitted 120 songs and returned `429` on submission 121, but its `Retry-After` header was absent. The observed allowance is 120 submissions per gallery.

## Verification evidence

- Clean-install checks passed: `npm ci`, `npm --prefix api ci`, `npm test` (9/9), `npm run test:api` (9/9), `npm run build`, and isolated `npm run test:e2e` (14 passed, 2 expected live-only skips). No lint script exists.
- `npm run test:live` passed malformed API recovery, real gallery lifecycle, and three concurrent 121-submit trials: 120 accepted/persisted and one refused each.
- Live Playwright cross-device gallery flow passed desktop and 390px mobile: 2/2.
- Live axe scans had zero WCAG 2 A/AA + 2.1 A/AA violations; no console/page errors or mobile overflow. Keyboard, download, invalid-link recovery, and offline reload passed.
- Candidate build hashes exactly equal production. JS is 33,830 B (11,890 B gzip), CSS 16,313 B (4,540 B gzip), and hero 81,172 B; hashed assets are immutable-cached.

Exact commands, response/header evidence, deployment hashes, and required remediation are in [.factory/verification-6.md](verification-6.md).

## Next steps

Add a complete claims manifest and claim tests exercised only through a real isolated sample demo; meet the first-screen audience/demo requirement; add and test `Retry-After` on the gallery-capacity `429`. Re-run all claims, full local tests, live gallery capacity, and live desktop/mobile flows before declaring PASS.
