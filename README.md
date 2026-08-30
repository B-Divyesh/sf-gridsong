# Gridsong

Gridsong is a local-first classroom step sequencer for K–8 music lessons. Students compose on a simple colour grid, save the complete song in a link, export WAV or MIDI, and submit a nickname-only song directly to a teacher’s class gallery. No accounts, ads, or tracking.

Live: <https://gridsong.sociobot.in>

## What it includes

- Major, minor, pentatonic, and chromatic scales across 1–4 octaves
- 1–64 bars at 50–200 BPM, shown one accessible bar at a time
- Four original Web Audio synth patches plus synthesized kick and clap
- Local autosave and compact, lossless URL song state (including the full 64-bar, four-octave grid)
- Client-side WAV and standard MIDI export
- 90-day server-backed teacher boards, portable submit-only student class passes, and projector polling
- Keyboard editing, a 390px phone layout, reduced-motion behavior, and offline shell caching

## Try the sample safely

Open <https://gridsong.sociobot.in/demo> or choose **Try it with sample data** on the first screen. The demo starts with a four-bar call-and-response. It stores its edits only under the `demo:gridsong.*` browser-storage namespace. The persistent **Demo — sample data, nothing is saved** banner offers **Reset demo** and **Start for real**. Start for real opens a fresh composer and never reads demo storage.

## Classroom gallery, across devices

The teacher creates a board on the projector/device and copies its **student class pass**. The pass is a self-contained URL that works on any student device. It carries an unguessable, submit-only capability: it cannot read the board. A student opens it, composes, enters a short classroom nickname, and presses **Send to class gallery**. The projector checks for new submissions every five seconds while the board is open; no teacher ticket-pasting step is involved.

The teacher key is a separate unguessable capability held only in the teacher browser’s local storage. The gallery service stores only nickname, compact song data, timestamps, and hashed capabilities. It enforces small requests, nickname/song validation, a storage-enforced 120-song gallery limit, and 90-day expiration. The API rejects expired boards immediately and removes expired records in bounded batches whenever a teacher creates a new board.

## Develop

Requires Node.js 22+.

```sh
npm install
npm run dev
```

Vite prints a local URL. Audio starts only after a user presses Play, as required by iPad and other mobile browsers.

## Test and build

```sh
npm test          # unit tests
npm run test:api  # API validation + deployment-contract tests
npm run test:e2e  # Chromium desktop + 390px mobile, including axe
npm run build     # reproducible production output in dist/
npm run preview   # serve dist locally
npm run test:live # live Function smoke + gallery flow + atomic 120-song capacity
```

Claim coverage is declared in `.factory/claims.json`. Each command in that file runs a tagged observable regression. The demo/browser claims use `/demo` from a fresh browser context.

The deployment artifact is `dist/`, with `dist/index.html` at its root. `swa-cli.config.json` is the production deployment contract: it deploys `dist/` and the `api/` HTTP Function together to the Standard `sf-gridsong` Static Web App. Provision the `gridsonggalleries` Azure Table first, then set `GALLERY_STORAGE_CONNECTION` to an HTTPS-only table-scoped SAS connection string with read/add/update/delete access for that table. No value is committed in this repository. After a deployment, run `node scripts/live-api-smoke.mjs` to make sure the live Function, rather than the static fallback, answers `/api/galleries`. `public/staticwebapp.config.json` contains Azure Static Web Apps routes, headers, cache policy, and the Node API runtime.

## Privacy and data

The current song and teacher access key use browser local storage. Demo songs use a separate `demo:gridsong.*` namespace. A class pass carries only an opaque board reference, a submit-only capability, and expiry; song links contain a composition. The gallery service receives only the nickname and composition necessary for the classroom activity. Boards close at 90 days; expired records are removed in bounded cleanup during later board creation. Students should use classroom aliases rather than full names. See [/privacy](https://gridsong.sociobot.in/privacy/) and [/terms](https://gridsong.sociobot.in/terms/).

## Design and provenance

The product brief is in `.factory/brief.json`; the night-market visual system and generated-art prompt/provenance are in `.factory/design.md` and `assets/src/`.

## License

MIT. See `LICENSE`.
