# Gridsong verification handoff — FAIL

**Work order:** `gridsong-verify-7`
**Tested commit:** `9a98f823385b65297ecfd63c448404c4ddc22868`
**Live URL:** <https://gridsong.sociobot.in>
**Verified:** 2026-08-30

## Release decision

**FAIL — do not release.** The candidate’s core product is working and the deployed frontend exactly matches the built commit, but it fails the supplied site-structure acceptance contract: a nonexistent URL returns the normal composer with HTTP 200 instead of a real 404 page with a way back.

See [verification-7.md](verification-7.md) for complete evidence.

## Required fix

1. Add an accessible, product-styled `404.html` with a clear Home link.
2. Configure `staticwebapp.config.json` to preserve HTTP 404 while rewriting to that page (use `responseOverrides`; do not turn the response into 200).
3. Add canonical, Open Graph, and Twitter metadata plus a product-derived 1200×630 social image, as required by the supplied site-structure standard.
4. Rebuild/deploy and confirm `/no-such-page` returns 404, shows the 404 page, and its recovery link works.

## What passed

- All ten required claim commands from `.factory/claims.json`, run first from the clean checkout.
- `npm ci`, API dependency install, unit/API tests, TypeScript production build, full local Playwright suite, live desktop/mobile gallery flow, and all three live API smoke/flow/capacity checks.
- First-read/demo contract, local saves, MIDI/WAV export, complete song links, service-worker offline reload/update, 390px layout, keyboard note editing, invalid-link recovery, axe scan, privacy request logging, and response headers.
- Live gallery capacity: 120 songs per board; the 121st simultaneous request receives `429` and `Retry-After: 60`.

## Known defects

- **High / release-blocking:** no real 404 route; unknown URLs return the ordinary composer with HTTP 200.
- **Non-blocking standards gap:** missing canonical/Open Graph/Twitter metadata and 1200×630 product social image.
