# Gridsong

Gridsong is a local-first classroom step sequencer for K–8 music lessons. Students compose on a simple colour grid, save the complete song in a lossless link, export WAV or MIDI, and submit a nickname-only song directly to a teacher’s class gallery. No accounts, ads, samples, microphone, or tracking.

Live: <https://gridsong.sociobot.in>

## What it includes

- Major, minor, pentatonic, and chromatic scales across 1–4 octaves
- 1–64 bars at 50–200 BPM, shown one accessible bar at a time
- Four original Web Audio synth patches plus synthesized kick and clap
- Local autosave and compact, lossless URL song state (including the full 64-bar, four-octave grid)
- Client-side WAV and standard MIDI export
- 90-day server-backed teacher boards, portable submit-only student class passes, and projector polling
- Keyboard editing, a 390px phone layout, reduced-motion behavior, and offline shell caching

## Classroom gallery, across devices

The teacher creates a board on the projector/device and copies its **student class pass**. The pass is a self-contained URL that works on any student device. It carries an unguessable, submit-only capability: it cannot read the board. A student opens it, composes, enters a short classroom nickname, and presses **Send to class gallery**. The projector checks for new submissions every five seconds while the board is open; no teacher ticket-pasting step is involved.

The teacher key is a separate unguessable capability held only in the teacher browser’s local storage. The gallery service stores only nickname, compact song data, timestamps, and hashed capabilities. It enforces small requests, nickname/song validation, request limits, a 120-song gallery limit, and 90-day expiration. The API rejects expired boards immediately and runs a daily deletion sweep.

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
npm run test:e2e  # Chromium desktop + 390px mobile, including axe
npm run build     # reproducible production output in dist/
npm run preview   # serve dist locally
```

The deployment artifact is `dist/`, with `dist/index.html` at its root. `api/` is an Azure Static Web Apps Standard Function API. In the SWA environment set `GALLERY_STORAGE_CONNECTION` to an Azure Storage connection string with access only to the `gridsonggalleries` table (or use the managed `AzureWebJobsStorage` setting). No value is committed in this repository. `public/staticwebapp.config.json` contains Azure Static Web Apps routes, headers, and cache policy.

## Privacy and data

The current song and teacher access key use browser local storage. A class pass carries only an opaque board reference, a submit-only capability, and expiry; song links contain a composition. The gallery service receives only the nickname and composition necessary for the classroom activity and deletes it after 90 days. Students should use classroom aliases rather than full names. See [/privacy](https://gridsong.sociobot.in/privacy/) and [/terms](https://gridsong.sociobot.in/terms/).

## Design and provenance

The product brief is in `.factory/brief.json`; the night-market visual system and generated-art prompt/provenance are in `.factory/design.md` and `assets/src/`.

## License

MIT. See `LICENSE`.
