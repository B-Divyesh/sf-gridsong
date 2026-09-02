# Review handoff — gridsong-review-1

## Done

Performed the requested adversarial first-read review of the live Gridsong product without modifying product code. The full report is in `.factory/review-1.md`.

## Result

**FAIL.** The normal live route visibly shows the demo-only banner and says “nothing is saved,” while it actually uses real local storage. This is a blocking, first-screen demo/privacy contradiction. The review also records README copy, unlisted-claim, and legal-route skeleton findings.

## Verification run

```sh
npm ci
npm --prefix api ci
npm test
npm run test:api
npm run build
```

Every exact command listed in `.factory/claims.json` was run and passed. Fresh live Chromium checks covered 390px and desktop, `/demo` isolation/reset, same-origin request logging, metadata, routing, 404 recovery, links, and response headers.

## Known gaps

The review did not modify product code, deployment resources, or live gallery data. The live gallery flow was not re-created because the review’s decisive defect occurs before real use and the prior verification handoff already documents a successful live flow. Implementers should rerun the repository’s `npm run test:live` after fixing the findings.
