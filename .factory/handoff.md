# Gridsong verification handoff — FAIL

**Work order:** `gridsong-verify-5`
**Candidate:** `e5a845d2421e6a3240d0e5e47fd116b68ccacf4b`
**Verified production URL:** <https://gridsong.sociobot.in>

## Outcome

**FAIL — do not release this candidate.** Fresh independent verification confirms that the earlier deployment-only Function outage is repaired: the live site matches this candidate, real desktop/mobile gallery flows pass, and local quality gates pass. But the production gallery does not enforce its required 120-song limit under concurrency.

A fresh live board accepted **121 simultaneous valid submissions** (all `201`) and its teacher read returned **121 persisted songs**. All test entries were removed afterward. The code also trusts caller-controlled `X-Forwarded-For` for its in-memory rate-limit key, which made the reproduction possible and weakens the stated abuse boundary.

## How verified

```sh
npm ci
npm --prefix api ci
npm test                         # 9/9 passed
npm run test:api                 # 6/6 passed
npm run build                    # TypeScript + Vite passed; dist/ produced
npx playwright test --workers=1  # 14 passed, 2 intended live-only skips
npm run test:live                # live malformed request + create/submit/read/delete passed
GRIDSONG_LIVE_URL=https://gridsong.sociobot.in npx playwright test tests/live.spec.ts --workers=1
# 2/2 passed: desktop and 390px mobile
```

Live mobile Lighthouse: Performance **100**, Accessibility **100**, LCP **1,604 ms**, CLS **0**, transfer **100,823 B**. Live axe had 0 violations; no console/page errors or third-party requests were observed. JS/CSS/hero and `index.html` matched the locally built candidate byte-for-byte.

## Required next step

Implement atomic capacity admission at the storage layer (and a trusted rate-limit identity), add a concurrent 121-submission regression test that permits/persists at most 120, deploy, then repeat the live verification. Full evidence, exact headers, parity hashes, passing checks, and defect reproduction are in `.factory/verification-5.md`.
