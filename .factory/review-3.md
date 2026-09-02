# Adversarial first-read review 3 — FAIL

**Reviewed:** 2026-09-02

**Live URL:** <https://gridsong.sociobot.in>

**Reviewed commit:** `6a78a95f6bc04170b61dccb7a0bc972463e02513`

**Method:** fresh Chromium contexts at 390×844 and 1440×900, live request and storage inspection, source review, link crawl, prior-finding audit, and every declared claim command from a clean clone.

## Verdict

**FAIL.** One blocking and two minor findings remain. All 26 listed claim commands pass, but the required zero-finding and no-untested-claim threshold is not met.

## Cold first screen

Before scrolling, I could answer all three questions at both viewports:

- **What it does:** makes and plays songs on a classroom note grid.
- **For whom:** K–8 music teachers and students.
- **What to click first:** **Try it with sample data**; the adjacent copy says it opens a four-bar private demo.

The exact headline is **“Make and play songs on a classroom grid.”** The supporting sentence is **“For K–8 music teachers and students who want to compose, save, share, and hear their songs.”** The primary action and its result are visible without scrolling: its lower edge is 629 px on the 390×844 viewport and 792 px on the 1440×900 viewport. The three facts also fit both first screens. Neither page has horizontal overflow.

## Findings

### F-3-1 — BLOCKING — Leaving the demo does not discard demo data

**Exact location and quote:** `/demo#composer` shows **“Demo — sample data, nothing is saved”** and a **Start for real** action. In `src/main.ts:393-396`, `startForReal()` only runs `location.assign('/')`; its comment says demo storage is “deliberately left” behind.

**Observed evidence:** I created a real song, entered the demo, edited the sample, reset it, and chose **Start for real**. The real `gridsong.song.v1` value remained byte-for-byte unchanged, but `demo:gridsong.song.v1` still existed after returning to `/`. The existing `@claim:demo-sandbox` test stops without activating **Start for real**, so it does not catch this lifecycle failure.

**Why this fails:** The sandbox is isolated from real data, but it is not discarded when the visitor leaves. A later demo visit can restore data that the banner says is not saved. This violates the required demo exit behavior and weakens the privacy promise at the demo’s main exit.

**Concrete fix:** Remove `DEMO_SONG_KEY` and `DEMO_GALLERY_KEY` before navigating from both **Start for real** controls. Extend `@claim:demo-sandbox` to edit the demo, activate **Start for real**, assert both `demo:` keys are absent, and assert a pre-existing real song is unchanged.

### F-3-2 — Minor — The offline banner makes a stronger claim than the inventory tests

**Exact location and quote:** `src/main.ts:135`, shown whenever the browser goes offline: **“You’re offline — composing, local saves, and exports still work.”**

**Why this fails:** `.factory/claims.json` lists **“Works offline after the first visit”** only for the README. Its test confirms an offline reload and the presence of 256 grid cells, but does not edit, reload the edit, or download WAV and MIDI while offline. My live manual check confirmed those actions currently work, but there is no registered regression for the stronger visitor-facing sentence.

**Concrete fix:** Expand `offline-reload` to name the banner location and the edit/save/WAV/MIDI outcomes. Extend its dedicated offline-context test to toggle a note, verify the demo storage change survives reload, and assert both downloads complete. Alternatively narrow the banner to the shell behavior the current test proves.

### F-3-3 — Minor — The gallery’s privacy summary omits data it stores

**Exact location and quote:** class-gallery creation dialog, `src/main.ts:142`: **“The gallery keeps only nickname and song data for 90 days.”**

**Why this fails:** The passing `@claim:gallery-record-schema` test proves that gallery and submission records also store creation/submission time, expiry, and protected key hashes. The Privacy page and README disclose these fields, but the decision-point dialog uses the absolute word “only” and omits them.

**Concrete rewrite:** “The gallery keeps each nickname, song, submission time, and protected key checks. Boards close after 90 days.” Add the dialog to the `gallery-record-schema` claim’s `where` field and mark the rendered copy with that claim ID.

## Copy audit

Counts treat hyphenated and en-dash terms as one word. Tables include the landing, composer, gallery states, and README prose. Headings and controls are audited separately.

### Landing and composer

| Words | Sentence | Flag |
| ---: | --- | --- |
| 16 | For K–8 music teachers and students who want to compose, save, share, and hear their songs. | — |
| 8 | Opens a four-bar rhythm in a private demo. | — |
| 5 | Saves songs on this device. | — |
| 4 | Exports WAV or MIDI. | — |
| 5 | No account, ads, or tracking. | — |
| 10 | Tap a tile to add a note to your song. | — |
| 8 | Choose a sound, then turn on notes below. | — |
| 6 | Tip: use arrow keys to move. | — |
| 9 | Press Space to switch a note on or off. | — |
| 6 | Save a link or a file. | — |
| 5 | All exports happen right here. | — |
| 10 | Make a class board and share its student class pass. | — |
| 11 | Students send a classroom nickname and song straight to the projector. | — |
| 5 | No accounts or email addresses. | — |
| 7 | Students can open it on another device. | — |
| 10 | Only the student class pass, nickname, and song are sent. | — |
| 6 | Play submitted songs for the class. | — |
| 9 | Songs stay on this device until you share them. | — |
| 5 | No accounts, ads, or tracking. | — |
| 9 | You’re offline — composing, local saves, and exports still work. | F-3-2 |

### Class-gallery states

| Words | Sentence | Flag |
| ---: | --- | --- |
| 8 | Create a 90-day board on the teacher device. | — |
| 7 | You will get a student class pass. | — |
| 5 | New submissions appear here automatically. | — |
| 11 | The gallery keeps only nickname and song data for 90 days. | F-3-3 |
| 10 | There are no accounts, email addresses, or student gallery browsing. | — |
| 6 | This sample stays on this device. | — |
| 11 | Start for real to create a class board and invite students. | — |
| 5 | Share the student class pass. | — |
| 14 | Students open it, choose a nickname, and submit their song directly to this board. | — |
| 10 | New songs check in automatically while this window is open. | — |
| 11 | Share the student class pass, then new songs will appear here. | — |
| 6 | You opened a student class pass. | — |
| 14 | Compose your song, add a classroom nickname, and send it to your teacher’s projector. | — |
| 9 | This pass can send a song from another device. | — |
| 8 | It does not show the teacher’s private board. | — |
| 8 | Use a classroom alias, not your full name. | — |
| 8 | Submit once you have at least one note. | — |
| 8 | Your teacher will see it on the board. | — |
| 9 | Your nickname and song are kept for 90 days. | — |
| 7 | Use an alias, not your full name. | — |

### README

| Words | Sentence | Flag |
| ---: | --- | --- |
| 10 | Gridsong is a classroom step sequencer for K–8 music lessons. | — |
| 13 | Students make songs by turning notes on and off in a colour grid. | — |
| 21 | Students can save a song link, export WAV or MIDI, or send a classroom nickname and song to a class gallery. | — |
| 12 | No account, ads, or tracking are required to compose in the demo. | — |
| 20 | Choose major, minor, pentatonic, or chromatic scales across one to four octaves, in one to 64 bars at 50–200 BPM. | — |
| 12 | Choose Lantern, Reed, Bell, or Pluck for melody, plus kick and clap. | — |
| 12 | Your song saves on this device and in a copied song link. | — |
| 9 | Export your song as a WAV or MIDI file. | — |
| 15 | Teachers can share a student class pass that submits to a board for 90 days. | — |
| 9 | Use the grid by keyboard or on a phone. | — |
| 8 | The composer works offline after its first visit. | — |
| 13 | Open the demo URL or choose Try it with sample data on the first screen. | — |
| 16 | The demo starts with a four-bar call-and-response and keeps demo edits apart from your real song. | — |
| 17 | The persistent Demo — sample data, nothing is saved banner offers Reset demo and Start for real. | — |
| 11 | Start for real opens a fresh composer without reading demo storage. | — |
| 14 | The teacher creates a board on the projector and copies its student class pass. | — |
| 10 | Students can use the student class pass on another device. | — |
| 12 | It sends a nickname and song but cannot read the teacher’s board. | — |
| 8 | New songs appear on the open projector board. | — |
| 10 | The teacher access key is stored in the teacher’s browser. | — |
| 9 | It is not included in the student class pass. | — |
| 10 | The gallery stores the nickname, song, submission time, and expiry. | — |
| 11 | It stores protected checks instead of usable class or teacher keys. | — |
| 10 | Each board accepts 120 songs and closes after 90 days. | — |
| 3 | Requires Node.js 22+. | — |
| 8 | Audio starts only after a user presses Play. | — |
| 6 | Claim coverage is declared in `.factory/claims.json`. | — |
| 16 | Every marked product claim in this README and the legal pages has a matching tagged regression. | — |
| 9 | Deploy `dist/` and the `api/` HTTP Function with `swa-cli.config.json`. | — |
| 10 | Before production deployment, set `GALLERY_STORAGE_CONNECTION` for the provisioned `gridsonggalleries` table. | — |
| 5 | Do not commit that value. | — |
| 11 | The current song and teacher access key use browser local storage. | — |
| 7 | Demo songs use a separate `demo:gridsong.*` namespace. | — |
| 18 | A student class pass contains a board ID, a key that can only send songs, and an expiry. | — |
| 6 | A song link contains the song. | — |
| 17 | The gallery service receives only the student class pass, nickname, and song needed for the classroom activity. | — |
| 5 | Boards close after 90 days. | — |
| 18 | Expired records are rejected and deleted in small batches when a new board is created. | — |
| 5 | Gridsong has no account-based backup. | — |
| 10 | Keep work by copying a song link or exporting WAV/MIDI. | — |
| 4 | See Privacy and Terms. | — |
| 1 | MIT. | — |
| 2 | See `LICENSE`. | — |

No sentence exceeds 22 words. No banned marketing adjective appears. The product terms are consistent: **song**, **class gallery**, **class board**, **student class pass**, **classroom nickname**, and **demo**. Developer terms such as Node.js, HTTP Function, and environment-variable names are confined to the development sections.

The headings name their sections. The action labels name results: **Try it with sample data**, **Play song**, **Copy song link**, **Export WAV**, **Export MIDI**, **Start new song**, **Open class gallery**, **Create class board**, **Copy student class pass**, **Add to board**, **Start composing**, **Send to class gallery**, **Load & play**, **Remove**, **Reset demo**, and **Start for real**. Lantern, Reed, Bell, and Pluck are labelled choices in a pressed-state group rather than standalone commands. No additional button-copy finding is raised.

## Demo and sandbox

- One click from the landing action opens `/demo#composer`.
- The first post-click screen shows the named sample **Morning call and response**, four bars, two octaves, 104 BPM, duration, sound choices, and **Play song**. Desktop also shows the active grid; mobile shows the seeded settings and Play control before the grid begins below the fold. This is enough to identify a working, populated composition rather than an empty setup screen.
- The sample contains 48 stored notes; the visible first bar contains 12 active cells.
- The persistent demo banner and both 44 px controls are visible.
- Editing changes `demo:gridsong.song.v1` only. **Reset demo** restores the title and all 48 notes. A pre-existing `gridsong.song.v1` value remains unchanged.
- Opening the gallery in demo mode makes no `/api/` request and explains that the sample stays on the device.
- All observed live demo requests were same-origin. The fresh browser had no cookies, third-party fonts, scripts, or trackers.
- The exit cleanup failure is F-3-1.

## Claims verification

I cloned the reviewed commit without local files, ran `npm ci`, and then ran every `test` command in `.factory/claims.json` separately and exactly as written.

| Claim id | Result |
| --- | --- |
| `demo-sandbox` | PASS |
| `local-save` | PASS |
| `browser-exports` | PASS |
| `complete-song-links` | PASS |
| `offline-reload` | PASS |
| `privacy-local-demo` | PASS |
| `privacy-technical-footprint` | PASS |
| `no-account-backup` | PASS |
| `classroom-sequencer` | PASS |
| `composer-settings` | PASS |
| `instrument-choices` | PASS |
| `keyboard-grid` | PASS |
| `audio-user-gesture` | PASS |
| `developer-runtime` | PASS |
| `gallery-direct-submit` | PASS |
| `student-pass-submit-only` | PASS |
| `teacher-key-browser` | PASS |
| `gallery-submission-data` | PASS |
| `gallery-record-schema` | PASS |
| `gallery-retention` | PASS |
| `gallery-expiry-cleanup` | PASS |
| `teacher-removes-submissions` | PASS |
| `gallery-capacity` | PASS |
| `mobile-390` | PASS |
| `unknown-route-recovery` | PASS |
| `documentation-claims-inventory` | PASS |

The commands pass, but F-3-2 is still an unlisted stronger claim and F-3-1 exposes an omitted exit assertion. F-3-3 is a narrower live copy problem than the registered storage-schema claim.

## Earlier-finding verification

Every earlier review, polish report, and the current handoff was read. Each earlier finding was checked on the live site and in current source.

| Earlier id | Status | Current evidence |
| --- | --- | --- |
| F-1-1 | Fixed | `/` renders the demo banner with `display:none` and a zero-sized box; `/demo` renders it and uses the `demo:` song key. |
| F-1-2 | Fixed | README opening sentences are 10, 13, 21, and 12 words. |
| F-1-3 | Fixed | Reader-facing feature bullets use classroom outcomes; deployment jargon is confined to developer sections. |
| F-1-4 | Fixed | `gallery-submission-data` exists and its exact-body test passed. |
| F-1-5 | Fixed | “Original synths and generated illustration” is absent from live copy and product source. |
| F-1-6 | Fixed | App, demo, Privacy, Terms, and 404 use the same grid-mark wordmark and four header destinations. |
| F-2-1 | Fixed | “Every student device” is absent; copy says “another device,” and the two-context submission test passed. |
| F-2-2 | Fixed | Forward navigation and browser Back focus the route h1 and update the polite route announcement live. |
| F-2-3 | Fixed | Visitor-facing copy consistently uses **student class pass**. |
| F-2-4 | Fixed | The actions are **Open class gallery** and **Start new song**. |
| F-2-5 | Fixed | The cited metaphor and slogan copy is absent; headings and instructions name tasks. |
| F-2-6 | Fixed | Reader-facing storage copy uses board ID, send-only key wording, protected checks, and small batches. F-3-3 is a separate omission in the gallery dialog. |

No earlier ID is reopened.

## Structure, routes, links, accessibility, and visual identity

- `/`, `/demo`, `/privacy/`, and `/terms/` return 200. A mistyped route returns the designed Gridsong 404 and provides **Return to the composer**.
- Every route has a route-appropriate title, one h1, `lang="en"`, one main landmark, meta description, canonical, OG/Twitter metadata, SVG favicon, 180×180 Apple icon, skip link, shared header, and shared footer.
- The social image is a real 1200×630 product image. `robots.txt` and `sitemap.xml` return 200 and list the public routes.
- All rendered internal links and the external Param Factory link were crawled. They returned 200, apart from the intentionally tested unknown route’s 404.
- `/demo#composer`, `/#composer`, and `/#class-gallery` deep links reach the intended state. Forward navigation and Back restore focus to the destination h1 and announce it.
- Live Axe scans at 390×844 and 1440×900 found zero WCAG A/AA/2.1 AA violations on home, demo, Privacy, Terms, and 404. The factory URL verifier found one h1, one main, valid image alternatives, labelled buttons, and no console errors on the home route.
- The production build emits 38.62 KB JavaScript raw / 12.84 KB gzip and 17.88 KB CSS raw / 4.87 KB gzip. `dist/` is present.
- The night-market palette, hand-painted-sign typography, lantern-note tiles, striped generated art, and mango playhead form a product-specific identity. It is not a generic SaaS template.

## Quality gates

- `npm test`: PASS — 16 tests.
- `npm run test:api`: PASS — 14 tests.
- `npm run build`: PASS — `dist/` produced.
- `npm run test:e2e`: PASS — 50 tests; 12 deployment-only cases skipped as designed.
- All 26 claim commands: PASS individually from the clean clone.
- Live request audit: same-origin only, no page or console errors on home/demo, and no API request in demo gallery mode.
- Manual live offline check: editing, local save, MIDI download, and WAV download all worked after an offline reload. F-3-2 remains because that full behavior is not in the claims inventory or regression.

## Missed leverage

No additional AI feature is justified. The brief’s expected high-value loop—compose, save/share, export WAV/MIDI, and collect songs across devices—is present. A complete song link already provides import/share behavior, and the class gallery supplies the expected classroom sync. Model-generated music would add cost and privacy complexity without filling a missing job.

## What would make this perfect

Discard demo namespace data when **Start for real** is used and test that exit. Register and test the full offline banner promise. Replace the gallery dialog’s incomplete “only” sentence with the actual stored fields and connect it to the schema claim. After those three changes, rerun all claim commands and repeat the cold 390 px and desktop review.
