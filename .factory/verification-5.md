# Independent verification 5 — FAIL

**Work order:** `gridsong-verify-5`
**Verified:** 2026-08-28
**Candidate commit:** `e5a845d2421e6a3240d0e5e47fd116b68ccacf4b`
**Production URL:** <https://gridsong.sociobot.in>

## Verdict

**FAIL.** The candidate builds, the deployed frontend matches it byte-for-byte, and the previously broken production gallery Function is now healthy. The core teacher/student flow works on desktop and 390px mobile. However, the live gallery breaks its documented and implemented **120-song maximum** under concurrent submission: a fresh board accepted **121 simultaneous valid submissions** (`121 × HTTP 201`) and its teacher read returned **121 persisted entries**. The test then deleted all 121 temporary entries successfully.

The researched brief and README promise a bounded, 120-song classroom gallery. This is a real production race, not a mocked test or a prior-deployment result. It defeats the persistence/abuse boundary and is release-blocking until capacity is reserved atomically.

## Defects

### High — gallery capacity is not atomic; the live 120-song limit can be exceeded

**Expected:** A gallery holds at most 120 submissions; the 121st request is rejected (documented implementation response: `429`, “This class gallery is full”). This must remain true when students submit at once.

**Actual production reproduction:**

1. `POST https://gridsong.sociobot.in/api/galleries` created a fresh board.
2. Sent 121 concurrent, structurally valid compact-song submissions to that one board (each used the returned submit capability and a short `Q0`–`Q120` alias).
3. Result: `{"201":121}`; authenticated `GET /api/galleries/{id}` returned `entries.length === 121`.
4. Deleted every temporary entry with the teacher capability: 121 deletes returned `200`.

The handler lists entries, checks `count >= 120`, and later creates the entity as separate operations. Concurrent handlers can all observe fewer than 120 entries before any create commits. The test also demonstrated that the in-process request limiter can be bypassed by providing distinct `X-Forwarded-For` values: the handler trusts the first header value supplied by the caller.

**Impact:** A busy class or deliberate caller can exceed the advertised board limit, defeating the bounded-storage/abuse guarantee and potentially growing a gallery without limit during a burst.

**Required remediation:** Use a same-partition, ETag/transactionally updated capacity reservation (or another storage-side atomic admission mechanism) before creating the submission. Do not derive an abuse key from a caller-controlled `X-Forwarded-For` value; use a trusted platform-provided client identity or make the limit storage-enforced. Add a deployment-level concurrent 121-submit regression test that asserts exactly 120 accepted/persisted and cleans up its test board.

### Medium — request-rate limit accepts caller-controlled forwarded identities

**Expected:** The 20-per-minute submission guard should not be controllable by an untrusted requester.

**Actual:** The production run above supplied distinct `X-Forwarded-For` values and all 121 submissions reached `201`. Source uses `request.headers.get('x-forwarded-for')?.split(',')[0]` directly, so a caller-provided first address controls the bucket.

**Impact:** The short-lived abuse guard does not provide its claimed rate boundary and makes the high-severity capacity race easy to trigger.

## Fresh quality-gate evidence

The repository started clean at the candidate SHA on Node `v22.23.2` / npm `10.9.8`. Playwright Chromium matching the installed `@playwright/test` version was installed before browser checks.

| Check | Result |
| --- | --- |
| `npm ci` | Passed; 58 packages, 0 vulnerabilities reported |
| `npm --prefix api ci` | Passed; 28 packages, 0 vulnerabilities reported |
| `npm test` | Passed: 9/9 Vitest tests |
| `npm run test:api` | Passed: 6/6 Node API validation/deployment-contract tests |
| Available type/lint check | No lint script/configuration exists; `npm run build` runs `tsc --noEmit` |
| `npm run build` | Passed; produced `dist/` |
| Full local Playwright suite | Passed: 14 passed, 2 intentional skips (the live-only test without its URL) |
| `npm run test:live` | Passed: live malformed-request smoke plus create → submit → read → delete |
| Live Playwright gallery flow | Passed in desktop and 390×844 mobile: 2/2 |

The initial overlapping Playwright invocation caused a local preview-server connection refusal; it was discarded. A subsequent isolated preview run completed with `test-results/.last-run.json` status `passed`.

## Product exercise

- Local production-build browser suite passed keyboard grid editing (Space and arrows), local restoration, MIDI and browser-rendered WAV downloads, mocked cross-device gallery UI, service-worker offline reload, and desktop/mobile axe checks.
- On the live candidate, chromatic scale + **64 bars** + **4 octaves** + **200 BPM** plus an active note copied to a song URL and restored in a fresh page. The restored view had 800 visible cells and retained every selected control and note.
- Invalid live `#song=not-valid-base64` announced: “That song link got tangled… Starting a fresh song.” and stayed usable.
- Live normal load made requests only to `https://gridsong.sociobot.in`; the desktop browser recorded no console or page errors.
- The live gallery malformed JSON recovery was correct: `POST /api/galleries` body `{` returned `400`, JSON `{ "error": "Please send the song again." }`, and a retryable UI/API path. Valid real cross-device board creation, student submission, projector visibility, teacher read, and delete passed.

## Accessibility, responsive, PWA, privacy, and response policies

- Fresh live 390px reduced-motion axe scan for WCAG 2 A/AA and 2.1 A/AA: **0 violations**, hence **0 serious/critical** findings.
- At 390px, `body.scrollWidth === innerWidth === 390`. Focus on a note was visibly `3px solid rgb(255, 200, 87)`; reduced motion computed a `0.00001s` note transition. The full suite covers keyboard-only editing and the 390px layout.
- Live document has `lang`, title, one `h1`, `main`, labelled controls, status announcements, skip/focus styling, meaningful hero alt text, and legal pages. Visual review found the stated night-market system intact and legible at both viewport sizes.
- PWA: live shell became service-worker controlled; offline reload is covered by the passing browser suite. A fresh re-registration test seeded `gridsong-shell-old-qa`, then found only `gridsong-shell-v4` after activation, confirming old-cache cleanup/update behavior. `/api/` is explicitly network-only in the worker.
- No third-party scripts, fonts, analytics, or network origins were observed. The product uses browser local storage/URL composition state; gallery traffic is same-origin. Privacy and terms pages are present. The gallery limit defect above is the exception to the claimed storage boundary.
- Root, hashed JS/CSS, and API malformed-input responses had HSTS, `nosniff`, strict-origin referrer policy, denied camera/microphone/geolocation permissions, and the documented self-only CSP. API errors were JSON and `Cache-Control: no-store`; hashed assets were `public, max-age=31536000, immutable`.

## Deployment identity and budgets

The exact production artifact is deployed from the candidate:

| File | SHA-256 (local build = live) |
| --- | --- |
| `index.html` | `6c1187911088fe6b491b58293280b69fb8b1bb7d6944716802544b9a8d50a745` |
| `assets/index-DgXnf7cQ.js` | `19f081841e4ebead89e5ff27cfe6ddb13512c1e6532d5a48250aebbd01c7ef85` |
| `assets/index-BZ7KWNCN.css` | `158656bc3e1ae3b9bba44d83bd4cd1d8e8d697b050186778c4494a7dc63168f0` |
| `assets/night-market-grid.webp` | `d248e38cc68e43b80ba3d904010227b0077a17952cb511afb5bf68ca739b58c7` |

Build budgets pass: JS 33,830 B (11,890 B gzip), CSS 16,313 B (4,540 B gzip), and hero WebP 81,172 B. Fresh mobile simulated Lighthouse: Performance **100**, Accessibility **100**, LCP **1,604 ms**, CLS **0**, transfer **100,823 B**.

## Release condition

Do not mark this candidate PASS or deploy a follow-up solely on the earlier Function repair. Fix the atomic capacity and forwarded-header trust defects, deploy, then rerun the live concurrent capacity regression plus the standard `npm run test:live` and live desktop/mobile flow.
