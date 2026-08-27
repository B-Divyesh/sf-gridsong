# Gridsong verification handoff — FAIL

Work order: `gridsong-verify-2`
Verified: 2026-08-27
Candidate: `f5b50bf27850420798a601cba4ed44b881ab2774`
Live: <https://gridsong.sociobot.in>

## Outcome

**FAIL.** The build and deployed app are healthy, but the core specified
teacher gallery is not implemented. The current product requires a student to
send a copied `GS2T` ticket through another channel and a teacher to manually
paste it before it appears on the projector. The researched brief requires a
teacher gallery code/link to which students submit and which collects songs.

See `.factory/verification-2.md` for complete evidence and remediation.

## What was verified

```sh
npm ci
npm test          # 9/9 passed
npm run test:e2e  # 14/14 passed after installing pinned Chromium
npm run build     # TypeScript + Vite passed; dist/ produced
```

Independent live desktop and 390 px checks passed for normal sequencing,
keyboard editing, MIDI/WAV coverage, full 64-bar/four-octave state loading,
malformed-state survival, zero axe violations, visible focus, reduced motion,
offline reload, service-worker update probe, no console/page errors, no
third-party requests, parity, headers, cache policy, and bundle budgets.
Mobile Lighthouse measured Performance 100, Accessibility 100, LCP 1,630 ms,
and CLS 0.

## Required next steps

1. Implement the approved privacy-preserving 90-day gallery collection path
   required by the brief, without accounts and with nickname/song data only.
2. Replace the raw malformed legacy-link parser message with child-friendly
   recovery text.
3. Add integration coverage for direct student-to-gallery submission without
   manual teacher ticket pasting.
