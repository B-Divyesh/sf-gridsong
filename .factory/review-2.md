# Adversarial first-read review 2 — FAIL

**Reviewed:** 2026-09-02  
**Live URL:** <https://gridsong.sociobot.in>  
**Reviewed commit:** `047f912a5e5a533b10c061fe35c6829d77080e9e`  
**Method:** fresh Chromium contexts at 390×844 mobile emulation and 1440×900 desktop, live request/storage inspection, source review, link crawl, prior-finding audit, and all declared claim commands from a detached clean worktree.

## Cold first screen

Before scrolling, I could answer all three required questions at both viewports:

- **What it does:** makes and plays songs on a classroom note grid.
- **For whom:** K–8 music teachers and students.
- **What to click first:** **Try it with sample data**; the adjacent text says it opens a four-bar private demo.

The exact supporting copy was “For K–8 music teachers and students who need a simple way to compose, save, share, and hear songs.” The sample action appeared at 503 px on the 390×844 viewport and at 687 px on desktop. Neither viewport had page-level horizontal overflow. The real route’s demo banner had `hidden=true`, `display:none`, and a zero-sized box.

## Findings

### F-1-6 — BLOCKING — The promised shared route header is still inconsistent

**Earlier finding reopened:** review 1 required Privacy and Terms to “reuse the product header with a skip link and the same compact navigation.” Polish 1 marked that fixed and also said the 404 used the same navigation.

**Exact live/code evidence:** the app header contains **Try sample**, **Make music**, **Class gallery**, and **Privacy** (`src/main.ts:36-40`). Privacy, Terms, and 404 contain only **Try sample**, **Make music**, and **Privacy** (`public/privacy/index.html:28`, `public/terms/index.html:28`, `public/404.html:31`). Their wordmarks also omit the app header’s grid mark.

**Why this fails:** the legal and recovery routes have a recognisable header, but it is not the same product navigation that polish 1 claimed to ship. The earlier finding is half-fixed and therefore returns as blocking under this review’s history rule.

**Concrete fix:** make one shared header contract for all routes. Include the same wordmark treatment and the same destinations. On static routes, make **Class gallery** a link such as `/#class-gallery` or another real URL that opens the gallery. Add a contract test that compares the accessible names and destinations of every header item on `/`, `/demo`, `/privacy/`, `/terms/`, and the rendered 404.

### F-2-1 — BLOCKING — “Every student device” is an unbounded, untested compatibility claim

**Exact quote/location:** landing class-gallery step: “It opens on every student device.”

**Why this fails:** `.factory/claims.json` proves that a pass works in another Chromium context and at desktop/390 px. It does not and cannot establish compatibility with every student device or browser. The listed `student-pass-submit-only` claim is narrower: “works on another device.” A teacher could rely on the absolute wording before a class.

**Concrete rewrite:** “Students can open it on another device.” Keep the existing cross-context claim test, or add an explicit supported-browser matrix before making a broader claim.

### F-2-2 — Minor — Route changes do not move focus to the new page heading or announce it

**Exact location:** navigation from `/` to `/demo#composer` and `/privacy/`, then browser Back.

**Evidence:** after each live navigation, `document.activeElement` was `BODY` at both viewports. Every route h1 lacks `tabindex`, Privacy/Terms have no live region, and there is no route-focus handler. Back returned to `/`, but focus remained on `BODY`.

**Why this fails:** a keyboard or screen-reader user is not placed at, or explicitly notified of, the new route’s heading. This misses the route-focus requirement even though deep links and Back otherwise work.

**Concrete fix:** on route entry, focus the h1 with `tabindex="-1"` and announce its text through a polite live region. Preserve the skip-link behavior. Add a browser test for forward and back navigation on both viewport projects.

### F-2-3 — Minor — One classroom invitation has three names

**Exact quotes/locations:** landing paragraph says “student link”; the numbered step says “class link”; the gallery and README say “student class link” and “student class pass.” `.factory/copy-audit.md` says the one product term is “student class pass.”

**Why this fails:** a teacher cannot be sure whether link and pass are the same item. It also contradicts the repository’s own terminology table.

**Concrete rewrite:** use **student class pass** everywhere. For example: “Make a class board, share its student class pass, and let students send a nickname and song to the projector.” Change the step to “Teacher shares a student class pass” and the dialog to “You will get a student class pass.”

### F-2-4 — Minor — Two buttons do not name their result with a verb

**Exact labels/locations:** **Class gallery** in the app header and **New song** in the export action strip.

**Why this fails:** both are `<button>` elements that perform actions, but their noun-only labels do not say what clicking does. The same gallery action is correctly labelled **Open class gallery** lower on the page.

**Concrete rewrite:** use **Open class gallery** and **Start new song**. Keep sound-choice buttons such as **Lantern** as selection names because their pressed state and group label explain the operation.

### F-2-5 — Minor — Metaphor and slogan copy replaces useful instructions

**Exact quotes/locations:** **“Classroom loop”**, **“Paint melody with”**, “Pick a sound, then light notes below,” “Play and celebrate together,” “Local-first classroom music,” and the real-song default title “My night-market song.”

**Why this fails:** “paint,” “light,” “celebrate,” “local-first,” and the night-market lore make a child or teacher translate the interface instead of describing the control, next result, or storage behavior.

**Concrete rewrites:** **“Class gallery setup”**; **“Choose a melody sound”**; “Choose a sound, then turn on notes below”; “Play submitted songs for the class”; “Songs stay on this device until you share them”; and “My classroom song.”

### F-2-6 — Minor — Reader-facing README privacy copy uses implementation jargon

**Exact quotes/locations:** “hashed access keys,” “opaque board reference,” “submit-only capability,” and “bounded cleanup” in the classroom and Privacy sections.

**Why this fails:** these sections explain the product’s privacy behavior to teachers, but the terms require security or infrastructure knowledge. The technical deployment section is appropriately technical; these user-facing paragraphs are not.

**Concrete rewrite:** “The gallery stores the nickname, song, submission time, and expiry. It stores protected checks instead of usable class or teacher keys.” “A class pass contains a board ID, a key that can only send songs, and an expiry.” “Expired records are deleted in small batches when a new board is created.”

## Copy audit

Counts treat hyphenated and en-dash terms as one word. Headings, labels, and buttons are audited after the sentence tables. No sentence exceeds the 22-word hard cap and no banned marketing adjective appears.

### Landing and composer

| Words | Sentence |
| ---: | --- |
| 18 | For K–8 music teachers and students who need a simple way to compose, save, share, and hear songs. |
| 8 | Opens a four-bar rhythm in a private demo. |
| 5 | Saves songs on this device. |
| 4 | Exports WAV or MIDI. |
| 5 | No account, ads, or tracking. |
| 10 | Tap a tile to add a note to your song. |
| 7 | Pick a sound, then light notes below. |
| 6 | Tip: use arrow keys to move. |
| 9 | Press Space to switch a note on or off. |
| 6 | Save a link or a file. |
| 5 | All exports happen right here. |
| 20 | Make a class board, share its student link, and let students send a nickname and song straight to the projector. |
| 5 | No accounts or email addresses. |
| 6 | It opens on every student device. |
| 7 | Only the nickname and song are sent. |
| 4 | Play and celebrate together. |
| 3 | Local-first classroom music. |
| 5 | No accounts, ads, or tracking. |

### Landing gallery states

| Words | Sentence |
| ---: | --- |
| 8 | Create a 90-day board on the teacher device. |
| 12 | You will get a shareable student class link; submissions arrive here automatically. |
| 11 | The gallery keeps only nickname and song data for 90 days. |
| 10 | There are no accounts, email addresses, or student gallery browsing. |
| 6 | This sample stays on this device. |
| 11 | Start for real to create a class board and invite students. |
| 3 | Share the pass. |
| 14 | Students open it, choose a nickname, and submit their song directly to this board. |
| 10 | New songs check in automatically while this window is open. |
| 10 | Share the student pass, then new songs will appear here. |
| 6 | You opened a student class pass. |
| 14 | Compose your song, add a classroom nickname, and send it to your teacher’s projector. |
| 14 | This pass works across devices, but it does not show the teacher’s private board. |
| 8 | Use a classroom alias, not your full name. |
| 8 | Submit once you have at least one note. |
| 8 | Your teacher will see it on the board. |
| 9 | Your nickname and song are kept for 90 days. |
| 7 | Use an alias, not your full name. |

### README

| Words | Sentence |
| ---: | --- |
| 10 | Gridsong is a classroom step sequencer for K–8 music lessons. |
| 13 | Students make songs by turning notes on and off in a colour grid. |
| 19 | Students can save a song link, export WAV or MIDI, or send a nickname-only song to a class gallery. |
| 12 | No account, ads, or tracking are required to compose in the demo. |
| 20 | Choose major, minor, pentatonic, or chromatic scales across one to four octaves, in one to 64 bars at 50–200 BPM. |
| 12 | Choose Lantern, Reed, Bell, or Pluck for melody, plus kick and clap. |
| 12 | Your song saves on this device and in a copied song link. |
| 9 | Export your song as a WAV or MIDI file. |
| 15 | Teachers can share a student class pass that submits to a board for 90 days. |
| 9 | Use the grid by keyboard or on a phone. |
| 8 | The composer works offline after its first visit. |
| 13 | Open `https://gridsong.sociobot.in/demo#composer` or choose **Try it with sample data** on the first screen. |
| 16 | The demo starts with a four-bar call-and-response and keeps demo edits apart from your real song. |
| 17 | The persistent **Demo — sample data, nothing is saved** banner offers **Reset demo** and **Start for real**. |
| 11 | Start for real opens a fresh composer without reading demo storage. |
| 14 | The teacher creates a board on the projector and copies its **student class pass**. |
| 20 | Students can use the pass on another device to send a nickname and song, but cannot read the teacher’s board. |
| 8 | New songs appear on the open projector board. |
| 10 | The teacher access key is stored in the teacher’s browser. |
| 9 | It is not included in the student class pass. |
| 13 | The gallery stores a nickname, composition, submission time, expiry, and hashed access keys. |
| 7 | It does not store raw access keys. |
| 10 | Each board accepts 120 songs and closes after 90 days. |
| 3 | Requires Node.js 22+. |
| 8 | Audio starts only after a user presses **Play**. |
| 6 | Claim coverage is declared in `.factory/claims.json`. |
| 16 | Every marked product claim in this README and the legal pages has a matching tagged regression. |
| 9 | Deploy `dist/` and the `api/` HTTP Function with `swa-cli.config.json`. |
| 10 | Before production deployment, set `GALLERY_STORAGE_CONNECTION` for the provisioned `gridsonggalleries` table. |
| 5 | Do not commit that value. |
| 11 | The current song and teacher access key use browser local storage. |
| 7 | Demo songs use a separate `demo:gridsong.*` namespace. |
| 14 | A class pass carries an opaque board reference, a submit-only capability, and an expiry. |
| 6 | A song link carries the composition. |
| 16 | The gallery service receives only the nickname, composition, and submit capability needed for the classroom activity. |
| 5 | Boards close after 90 days. |
| 13 | Expired records are rejected and removed in bounded cleanup during later board creation. |
| 5 | Gridsong has no account-based backup. |
| 10 | Keep work by copying a song link or exporting WAV/MIDI. |
| 4 | See `/privacy` and `/terms`. |
| 1 | MIT. |
| 2 | See `LICENSE`. |

### Copy flags and terminology

- Over 22 words: none.
- Banned marketing words: none.
- All headings name their section except the decorative **Classroom loop** eyebrow; replace it with **Class gallery setup** or remove it.
- Metaphor/slogan flags are listed in F-2-5.
- Non-result button labels are listed in F-2-4.
- Jargon flags are listed in F-2-6. Technical names in **Develop and deploy** and **Test and build** are appropriate for those contributor sections.
- Terminology conflict is listed in F-2-3. The intended terms remain **song**, **class gallery**, **class board**, **student class pass**, **classroom nickname**, and **demo**.

## Demo and sandbox verification

- The first click opened `/demo#composer`; after scroll settling, the composer began 24 px below the viewport top at both sizes.
- The first mobile demo screen showed the persistent banner, “Morning call and response,” four bars, two octaves, 104 BPM, and playback controls. The sample contains 48 notes across four bars; the visible first bar has 12 active cells.
- Editing changed only `demo:gridsong.song.v1`. A pre-existing `gridsong.song.v1` value remained byte-for-byte unchanged.
- **Reset demo** restored the title and all 48 sample notes. **Start for real** returned to `/`, hid the banner, and restored the pre-existing real song.
- The live cold and demo request logs contained only `https://gridsong.sociobot.in` requests. The clean claim test also found no cookies, third-party resources, or account fields.
- Opening the gallery in demo mode made no gallery API request and explained that the sample stays on the device.

The demo itself passes. No demo finding is raised.

## Claims verification

Every command in `.factory/claims.json` was run separately from detached clean worktree `/tmp/gridsong-review2-clean` at the reviewed commit after `npm ci` and `npm --prefix api ci`.

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

The unsupported absolute compatibility copy is F-2-1. No other unlisted claim-like sentence was found on the live landing page or README.

## Earlier-finding verification

| Earlier id | Status | Live and code evidence |
| --- | --- | --- |
| F-1-1 | Fixed | `/` renders no demo banner; `.demo-banner[hidden] { display: none; }`; `/demo` remains visibly isolated and Reset works. |
| F-1-2 | Fixed | README opening is split into 10-, 13-, and 19-word sentences. |
| F-1-3 | Fixed | Reader-facing feature bullets use teacher outcomes; deployment terms are under developer sections. New remaining jargon is separately identified in F-2-6. |
| F-1-4 | Fixed | `gallery-submission-data` exists and its test passed, asserting exactly `nickname`, `song`, and `submitKey`. |
| F-1-5 | Fixed | “Original synths and generated illustration” is absent live and in source. |
| F-1-6 | **Reopened — BLOCKING** | Legal/404 routes gained skip links and footer structure, but their primary header still omits the app’s **Class gallery** destination and grid-mark treatment. |

## Structure, links, and accessibility

- `/`, `/demo`, `/privacy/`, `/terms/`, and the 404 have route-appropriate titles, one h1, `lang="en"`, one main landmark, descriptions, canonicals, OG/Twitter metadata, favicon, Apple icon, header, and footer.
- `/no-such-page` returned HTTP 404 with the designed Gridsong recovery page. `/404.html` returned 200 as the source document.
- Every rendered link across those routes was crawled. Product URLs returned 200, the deliberate unknown URL returned 404, and `https://sociobot.in/` returned 200.
- Deep links to `/demo#composer` and `/#composer` open the intended composer state; browser Back restores `/`. Route focus remains defective as F-2-2.
- Live Playwright Axe checks reported zero WCAG A/AA/2.1 AA violations. Reduced-motion and keyboard-grid checks passed. `/opt/fleet/lib/verify-url.sh` reported title, language, one h1, main, alt text, labelled buttons, and no console errors.
- The night-market neon grid, irregular painted-sign geometry, generated lantern illustration, and note-tile palette are distinct from a generic SaaS template and match `.factory/design.md`.
- The live JS, CSS, and service worker SHA-256 hashes matched the clean production build. JavaScript is 37.86 KB raw / 12.84 KB gzip; CSS is 17.64 KB raw / 4.81 KB gzip.

## Other quality gates

- `npm test`: PASS, 13 tests.
- `npm run test:api`: PASS, 14 tests.
- `npm run test:e2e`: PASS, 42 tests; 10 live-only checks intentionally skipped.
- `GRIDSONG_LIVE_URL=https://gridsong.sociobot.in npx playwright test tests/live.spec.ts`: PASS, 8 tests.
- `npm run build`: PASS; `dist/` produced.

## Missed leverage

No additional AI feature is justified. The brief asks for composition, saving/sharing, WAV/MIDI export, and classroom collection; all are present. The complete-song link already serves as import, and the class gallery supplies the implied cross-device collection flow. Adding model-generated music would create cost, privacy, and classroom-control concerns without repairing a missing core job.

## What would make this perfect

Make the route headers genuinely identical, narrow the unsupported “every student device” statement, focus and announce route headings, choose one name for the student class pass, replace the two noun-only action labels, and remove the remaining metaphor/jargon copy. Then rerun all 26 claim commands and the live 390 px/desktop audit. Until every item above is resolved, the required zero-finding threshold is not met.
