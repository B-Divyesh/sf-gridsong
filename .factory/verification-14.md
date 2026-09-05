# Independent verification 14 — PASS

**Work order:** `gridsong-verify-14`

**Candidate implementation:** `7ff9d614bfbcbe8d74bb1fd0e2f76682569a3c03`

**Documentation revision:** `ef0415e0ff24fc17f96fbf488fd95ec223c3f18b`

**Live URL:** <https://gridsong.sociobot.in>
**Verified:** 2026-09-05

## Verdict

**PASS.** There are **zero findings** at every severity and **zero untested claims**. The deployed product matches implementation `7ff9d61`; `ef0415e` is documentation/evidence only.

## First screen and demo

Fresh 1440×900 desktop and 390×844 phone contexts both said, before scrolling:

- Job: **“Make and play songs on a classroom grid.”**
- Audience: **K–8 music teachers and students.**
- First action: **“Try it with sample data”**, which opens a four-bar private demo.

The action bottom was 791 px on desktop and 641 px on phone, within each viewport. Neither had page-level horizontal overflow or console/page errors.

One click opened `/demo#composer` with **Morning call and response**, 12 active notes (48 stored note entries), 256 controls, and persistent **“Demo — sample data, nothing is saved”**. Reset restored the seed. A real song created in the same fresh context stayed unchanged through demo entry, editing, reset, and Start for real. Start for real removed both demo storage keys. The demo made no gallery API request.

## Claims gate

A fresh clone at `ef0415e`, after `npm ci`, ran every `.factory/claims.json` command separately and exactly as declared. **26/26 passed.** Expected desktop/mobile project skips did not leave a claim untested: each command ran and passed its applicable project.

| Claim ID | Result | Claim ID | Result |
| --- | --- | --- | --- |
| demo-sandbox | PASS | local-save | PASS |
| browser-exports | PASS | complete-song-links | PASS |
| offline-reload | PASS | privacy-local-demo | PASS |
| privacy-technical-footprint | PASS | no-account-backup | PASS |
| classroom-sequencer | PASS | composer-settings | PASS |
| instrument-choices | PASS | keyboard-grid | PASS |
| audio-user-gesture | PASS | developer-runtime | PASS |
| gallery-direct-submit | PASS | student-pass-submit-only | PASS |
| teacher-key-browser | PASS | gallery-submission-data | PASS |
| gallery-record-schema | PASS | gallery-retention | PASS |
| gallery-expiry-cleanup | PASS | teacher-removes-submissions | PASS |
| gallery-capacity | PASS | mobile-390 | PASS |
| unknown-route-recovery | PASS | documentation-claims-inventory | PASS |

The claims cover isolated demo/local save, WAV/MIDI, complete links, offline edit/save/export, privacy/no-cookie checks, keyboard, documented settings limits, gesture-gated audio, gallery capabilities/schema/retention/delete/capacity, mobile geometry, 404 recovery, and documentation coverage.

## Quality and live checks

| Check | Result |
| --- | --- |
| Clean `npm ci` | PASS; 0 audit vulnerabilities |
| `npm test` | PASS; 16/16 |
| `npm run test:api` | PASS; 14/14 |
| `npm run build` | PASS; TypeScript check and `dist/index.html` |
| `npm run test:e2e` | PASS; 55 passed, 17 intentional live/project skips |
| Live Playwright suite | PASS; 12 passed, 2 intentional project skips |
| `npm run test:live` | PASS; malformed request, teacher create → student submit → teacher read/delete, and three capacity trials |
| Fleet URL verifier | PASS; 200, title/lang/one h1/main/alt/labels, no console errors |
| Axe WCAG 2 A/AA and 2.1 AA | PASS; zero violations across app/demo/legal/404 coverage |
| Live mobile Lighthouse | PASS; 100/100/100/100; FCP 0.9 s, LCP 1.4 s, TBT 0 ms, CLS 0 |

Live gallery checks rejected malformed input with 400. Three fresh capacity trials stored exactly 120 submissions and refused the next; cleanup completed. Teacher and student used separate browser contexts; a student capability cannot read the teacher board.

The live demo passed keyboard, visible focus, reduced-motion, service-worker offline reload, offline persistence, WAV/MIDI export, and same-origin-only requests. Privacy checks found no cookies, third-party fonts/scripts, ads, or tracking. The live document sends same-origin CSP, `nosniff`, strict-origin referrer policy, and disabled camera/microphone/geolocation permissions.

`/`, `/demo`, `/privacy/`, and `/terms/` returned 200 with distinct titles. Unknown URLs returned the designed `Page not found` page with HTTP 404 and a working recovery link. Primary/footer navigation, skip links, route focus, and route announcement passed.

## Deployment parity and history

Fresh `dist/` matched production byte-for-byte for the shell, route entry, legal CSS, service worker, manifest, Privacy, Terms, 404, and hashed bundles. Stable resources use `max-age=0, must-revalidate`; content-hashed JS/CSS are immutable; `sw.js` is `no-cache`.

All historical findings were inspected and remain fixed:

| Earlier finding group | Disposition and current proof |
| --- | --- |
| Verification 1–4: missing/non-working cross-device gallery; malformed link | Fixed: live create → submit → projector read → teacher delete passes; invalid recovery passes. |
| Verification 5: capacity race; forwarded identity | Fixed: three live 120-song trials enforce the limit; API regression covers forwarding. |
| Verification 6: no claims/demo/first screen; no Retry-After | Fixed: 26 declared claims, isolated one-click demo, plain first screen, retry-capacity coverage. |
| Verification 7: missing 404 | Fixed: accessible designed HTTP 404 recovers to composer. |
| Verification 9: unlisted claims | Fixed: documentation-inventory claim passes and all marked product copy maps to a tagged test. |
| Verification 11: clean-install API claims; small demo controls | Fixed: clean API claims pass; audited actions/links meet touch targets. |
| Review F-1-1…F-1-6 | Fixed: real route has no demo banner; plain README; claim coverage; shared route skeleton. |
| Review F-2-1…F-2-6 | Fixed: bounded wording; route focus/announcement; one class-pass term; verb actions; task/plain privacy language. |
| Review F-3-1…F-3-3 | Fixed: both demo exits clear keys; offline claim is tested; gallery disclosure names stored fields. |
| Verification 13 F-13-1 | Fixed: live phone notes are 44×44 px with 8 px horizontal/vertical gaps; audited links are at least 44 px. |
| Verification 13 F-13-2 | Fixed: stable unversioned assets revalidate; only hashed bundles are immutable. |
| Verification 13 F-13-3 | Fixed: plain manifest description starts with “Make” and contains no “local-first”. |

## Evidence

- Clean clone: `/tmp/gridsong-verify14-eBNyLO`
- Fresh screenshots: `/tmp/gridsong-verify14-phone-home.png`, `/tmp/gridsong-verify14-phone-demo.png`, and desktop equivalents
- URL verifier: `/tmp/gridsong-verify14-url-dEzCRe/`
- Lighthouse JSON: `/tmp/gridsong-verify14-lighthouse.json`

## Known gaps

None.
