# Adversarial first-read review 1 — FAIL

**Reviewed:** 2026-09-02  
**Live URL:** <https://gridsong.sociobot.in>  
**Method:** fresh Chromium contexts at 390×844 and 1440×900, source review, clean dependency install, and the declared local claim commands.

## Cold first screen

Before scrolling, I can answer the three required questions from the headline and supporting copy:

- **What it does:** a classroom step sequencer for making songs on a note grid.
- **Who it is for:** K–8 music teachers and students.
- **First action:** choose **Try it with sample data**; it says it opens a four-bar private demo.

This is true at both viewports. The primary action is visible on the 390px first screen (top 585px) and the page has no horizontal overflow. However, the normal route also visibly presents a contradictory demo banner; that failure is F-1-1.

## Findings

### F-1-1 — BLOCKING — Normal use is visibly labelled as a demo that “nothing is saved”

**Location / exact quote:** Fresh visits to `https://gridsong.sociobot.in/` at both viewports visibly show **“Demo — sample data, nothing is saved”**, with **“Reset demo”** and **“Start for real”**. The same route says **“Saved on this device”** and writes `gridsong.song.v1`.

**Evidence:** In a fresh 390px context, the normal route had `#demo-banner.hidden === true` but computed `display: flex` and an 81.8px visible box. `src/main.ts:631` correctly sets `hidden = !isDemo`; `src/style.css:43` then overrides the browser hidden style with `.demo-banner { display: flex; }`. The normal route also creates the real local-storage song key at startup (`src/main.ts:629`). **Reset demo** is a no-op outside demo mode (`src/main.ts:398`). The actual `/demo` flow is isolated and resets correctly, so the defect is specifically the presentation and false promise on the real route.

**Why this fails a first visit:** A child or teacher is told they are editing sample data that will not save, while the app is actually creating and saving a real song. The offered reset control does not do what its visible label says. This breaks the privacy/demo contract at the first decision point.

**Concrete fix:** Ensure `[hidden]` wins, for example add `[hidden] { display: none !important; }` or make the visible rule `.demo-banner:not([hidden]) { display: flex; }`. Add an end-to-end normal-route regression that asserts the banner and its controls have no rendered box, and that `/` never exposes demo-only language. Retain the existing `/demo` test that proves the rendered banner and isolated namespace.

### F-1-2 — Minor — README opening sentence exceeds the plain-language limit

**Location / exact quote:** `README.md:3`: “Students compose on a simple colour grid, save the complete song in a link, export WAV or MIDI, and submit a nickname-only song directly to a teacher’s class gallery.” (29 words).

**Why this fails copy review:** It joins four separate outcomes into one sentence and exceeds the 22-word hard cap. It is difficult to scan on a phone.

**Concrete rewrite:** “Students make songs on a colour grid. They can save a link, export WAV or MIDI, or send a nickname-only song to the class gallery.”

### F-1-3 — Minor — README feature list uses unexplained developer jargon

**Location / exact quotes:**

- `README.md:11`: “Four original Web Audio synth patches plus synthesized kick and clap.”
- `README.md:12`: “Local autosave and compact, lossless URL song state (including the full 64-bar, four-octave grid).”
- `README.md:14`: “90-day server-backed teacher boards, portable submit-only student class passes, and projector polling.”
- `README.md:15`: “Keyboard editing, a 390px phone layout, reduced-motion behavior, and offline shell caching.”

**Why this fails copy review:** “Web Audio,” “lossless URL song state,” “server-backed,” “submit-only,” “projector polling,” and “offline shell caching” describe implementation rather than a teacher’s result. The list changes terms from the landing page and does not tell a first-time teacher what to do.

**Concrete rewrite:** Replace the four bullets with: “Choose four melody sounds, plus kick and clap.” “Your song saves on this device and in a copied song link.” “Teachers can share a class link that closes after 90 days.” “Use the grid by keyboard or on a phone. The composer works offline after its first visit.” Keep developer deployment detail in a clearly labelled developer section below the user-facing description.

### F-1-4 — Minor — The landing’s “nickname and song only” privacy claim has no matching observable claim test

**Location / exact quote:** Landing class-gallery step: “Nickname and song only.”

**Why this fails claims review:** No `.factory/claims.json` entry names this claim. `privacy-local-demo` only records requests while the demo dialog is open; demo deliberately never calls the gallery API. `gallery-direct-submit` uses an in-memory route fixture and reads values, but does not assert that the request contains only the permitted submission fields. A teacher may rely on this statement when deciding whether students can use the service.

**Concrete fix:** Add a `gallery-submission-data` claim and an observable test that intercepts a real client submission and asserts the JSON body has exactly `submitKey`, `nickname`, and `song`, with no account or email field. Alternatively remove “only” from the landing page until that test exists.

### F-1-5 — Minor — The footer makes an unlisted provenance claim

**Location / exact quote:** Landing footer: “Original synths and generated illustration.”

**Why this fails claims review:** It is a factual visitor-facing claim with no matching entry in `.factory/claims.json`. The page has provenance notes in `.factory/design.md`, but no sandbox test can prove originality or generation.

**Concrete fix:** Remove the sentence from the user-facing footer, or change it to a non-claim link such as “Artwork and sound credits” that leads to a provenance page. Do not retain an untestable promise as a footer slogan.

### F-1-6 — Minor — Privacy and Terms do not use the required consistent route skeleton

**Location:** `public/privacy/index.html:25-42` and `public/terms/index.html:25-42`.

**Evidence:** Both routes have only a wordmark and “Back to composer” in the header, no skip link, and a text-only footer. They omit the consistent header navigation, Privacy/Terms footer links, Param Factory attribution, and build/version identifier used by the landing and 404 page.

**Why this matters:** A visitor who follows Privacy or Terms has no consistent route-level navigation or accessibility skip target. This makes legal pages feel detached from the product and fails the stated site skeleton.

**Concrete fix:** Reuse the product header with a skip link and the same compact navigation on both legal pages. Reuse the 404 footer structure, including Privacy, Terms, “Built by Param Factory,” and version/build text. Verify Tab reaches the skip link and it moves focus to `main` on each legal route.

## Copy audit

The following is the complete audit of prose sentences on the landing page and README. Labels, headings, button names, shell commands, URLs by themselves, and code identifiers are not sentences. Counts treat a URL or code token as one word. `†` marks a finding above; `J` marks jargon reviewed in F-1-3.

### Landing page

| Words | Sentence |
| ---: | --- |
| 18 | For K–8 music teachers and students who need a simple way to compose, save, share, and hear songs. |
| 8 | Opens a four-bar rhythm in a private demo. |
| 5 | Saves songs on this device. |
| 4 | Exports WAV or MIDI. |
| 5 | No account, ads, or tracking. |
| 10 | Tap a tile to add a note to your song. |
| 6 | Save a link or a file. |
| 5 | All exports happen right here. |
| 20 | Make a class board, share its student link, and let students send a nickname and song straight to the projector. |
| 5 | No accounts or email addresses. |
| 6 | It opens on every student device. |
| 4 | Nickname and song only. † |
| 4 | Play and celebrate together. |
| 3 | Local-first classroom music. |
| 5 | Original synths and generated illustration. † |
| 5 | Built by the Param Factory. |

The landing has result-naming verbs for its meaningful actions (Try it with sample data, Copy song link, Export WAV, Export MIDI, Open class gallery). Its headings name sections and are understandable out of context. The product-specific night-market visual system is distinct; it does not read as a generic SaaS card layout.

### README

| Words | Sentence or feature line |
| ---: | --- |
| 11 | Gridsong is a local-first classroom step sequencer for K–8 music lessons. J |
| 29 | Students compose on a simple colour grid, save the complete song in a link, export WAV or MIDI, and submit a nickname-only song directly to a teacher’s class gallery. † |
| 5 | No accounts, ads, or tracking. |
| 9 | Major, minor, pentatonic, and chromatic scales across 1–4 octaves. |
| 12 | 1–64 bars at 50–200 BPM, shown one accessible bar at a time. |
| 11 | Four original Web Audio synth patches plus synthesized kick and clap. J |
| 14 | Local autosave and compact, lossless URL song state (including the full 64-bar, four-octave grid). J |
| 6 | Client-side WAV and standard MIDI export. J |
| 12 | 90-day server-backed teacher boards, portable submit-only student class passes, and projector polling. J |
| 12 | Keyboard editing, a 390px phone layout, reduced-motion behavior, and offline shell caching. J |
| 13 | Open the demo URL or choose Try it with sample data on the first screen. |
| 7 | The demo starts with a four-bar call-and-response. |
| 10 | It stores its edits only under the `demo:gridsong.*` browser-storage namespace. J |
| 17 | The persistent Demo — sample data, nothing is saved banner offers Reset demo and Start for real. |
| 12 | Start for real opens a fresh composer and never reads demo storage. |
| 14 | The teacher creates a board on the projector/device and copies its student class pass. |
| 12 | The pass is a self-contained URL that works on any student device. |
| 11 | It carries an unguessable, submit-only capability: it cannot read the board. J |
| 16 | A student opens it, composes, enters a short classroom nickname, and presses Send to class gallery. |
| 20 | The projector checks for new submissions every five seconds while the board is open; no teacher ticket-pasting step is involved. |
| 16 | The teacher key is a separate unguessable capability held only in the teacher browser’s local storage. J |
| 13 | The gallery service stores only nickname, compact song data, timestamps, and hashed capabilities. J |
| 14 | It enforces small requests, nickname/song validation, a storage-enforced 120-song gallery limit, and 90-day expiration. J |
| 20 | The API rejects expired boards immediately and removes expired records in bounded batches whenever a teacher creates a new board. J |
| 3 | Requires Node.js 22+. |
| 5 | Vite prints a local URL. |
| 16 | Audio starts only after a user presses Play, as required by iPad and other mobile browsers. |
| 6 | Claim coverage is declared in `.factory/claims.json`. J |
| 10 | Each command in that file runs a tagged observable regression. J |
| 10 | The demo/browser claims use `/demo` from a fresh browser context. J |
| 10 | The deployment artifact is `dist/`, with `dist/index.html` at its root. J |
| 22 | `swa-cli.config.json` is the production deployment contract: it deploys `dist/` and the `api/` HTTP Function together to the Standard `sf-gridsong` Static Web App. J |
| 22 | Provision the `gridsonggalleries` Azure Table first, then set `GALLERY_STORAGE_CONNECTION` to an HTTPS-only table-scoped SAS connection string with read/add/update/delete access for that table. J |
| 7 | No value is committed in this repository. |
| 19 | After a deployment, run `node scripts/live-api-smoke.mjs` to make sure the live Function, rather than the static fallback, answers `/api/galleries`. J |
| 15 | `public/staticwebapp.config.json` contains Azure Static Web Apps routes, headers, cache policy, and the Node API runtime. J |
| 11 | The current song and teacher access key use browser local storage. |
| 7 | Demo songs use a separate `demo:gridsong.*` namespace. J |
| 19 | A class pass carries only an opaque board reference, a submit-only capability, and expiry; song links contain a composition. J |
| 14 | The gallery service receives only the nickname and composition necessary for the classroom activity. |
| 16 | Boards close at 90 days; expired records are removed in bounded cleanup during later board creation. J |
| 9 | Students should use classroom aliases rather than full names. |
| 4 | See Privacy and Terms. |
| 18 | The product brief is in `.factory/brief.json`; the night-market visual system and generated-art prompt/provenance are in `.factory/design.md` and `assets/src/`. J |
| 1 | MIT. |
| 2 | See `LICENSE`. |

There are no other sentences over 22 words. The J-marked developer deployment material is appropriate only if moved under a clearly separated contributor/deployment section; it is not reader-first product copy.

## Demo and privacy verification

- `/demo` immediately opens the seeded four-bar “Morning call and response” composition. The current bar has 12 active cells; the stored demo song has 48 notes across four bars.
- Editing `/demo` changed only `demo:gridsong.song.v1`. Reset restored the sample and left `gridsong.song.v1` absent. The request log contained only `https://gridsong.sociobot.in`.
- `/` uses `gridsong.song.v1`, not the demo key. Its demo banner defect is F-1-1.
- The demo gallery says “This sample stays on this device” and makes no API request. This is the correct sandbox behavior.

## Claims and quality gates

All listed claim commands passed from the clean checkout after `npm ci` and `npm --prefix api ci`:

| Claim | Result |
| --- | --- |
| `demo-sandbox` | pass — desktop and mobile |
| `local-save` | pass — desktop and mobile |
| `browser-exports` | pass — desktop and mobile |
| `complete-song-links` | pass — desktop and mobile |
| `offline-reload` | pass — desktop and mobile |
| `privacy-local-demo` | pass — desktop and mobile |
| `gallery-direct-submit` | pass — desktop and mobile fixture flow |
| `gallery-retention` | pass |
| `gallery-capacity` | pass |
| `mobile-390` | pass on mobile; expected desktop project skip |
| `unknown-route-recovery` | pass — desktop and mobile |

`npm test` passed (12 tests), `npm run test:api` passed (11 tests), and `npm run build` passed and produced `dist/`. The browser suite’s Axe checks passed. The normal-route banner error is not covered because the existing tests only assert the demo banner is visible on `/demo`; add the regression described in F-1-1.

## Structure and routing checks

- `/`, `/demo`, `/privacy/`, `/terms/`, `/no-such-page`, `robots.txt`, `sitemap.xml`, the favicon, and the social image returned successful expected responses (404 for the unknown route). The external Param Factory link returned 200.
- The landing and demo have a title, one `h1`, description, canonical, OG/Twitter metadata, favicon, skip link, responsive layout, and no console errors in fresh desktop/mobile contexts. `/demo` changes its title to `Demo — Gridsong`.
- The designed 404 returned HTTP 404, had a recovery link, metadata, a skip link, and no mobile overflow. Its recovery test passed.
- CSP and response headers are present; the live fresh demo request log had only same-origin requests. There is no third-party font/script request.
- Legal-route skeleton inconsistency is F-1-6. No earlier `.factory/review-*.md` or `.factory/polish-*.md` exists. The prior handoff reports no defects; F-1-1 is nevertheless confirmed in both live CSS and source and must not be treated as fixed.

## Missed leverage

No additional AI feature is expected for this job. A classroom sequencer benefits more from immediate composition, export, sharing, and the existing gallery loop than from a decorative AI feature. WAV/MIDI export and direct gallery submission are present, so no missed-leverage finding is raised.

## What would make this perfect

Render demo controls only in demo mode, add a normal-route visual/storage regression, register or remove every visitor-facing privacy/provenance assertion, simplify the README’s teacher-facing copy, and make the legal routes use the same accessible header/footer skeleton. After those changes, rerun every declared claim command and repeat the fresh live 390px and desktop review.
