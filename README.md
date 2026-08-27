# Gridsong

Gridsong is a local-first classroom step sequencer for K–8 music lessons. Students compose on a simple colour grid, save the complete song in a lossless link, export WAV or MIDI, and hand a nickname-only submission ticket to a teacher’s class gallery. No accounts, ads, samples, microphone, or tracking.

Live: <https://gridsong.sociobot.in>

## What it includes

- Major, minor, pentatonic, and chromatic scales across 1–4 octaves
- 1–64 bars at 50–200 BPM, shown one accessible bar at a time
- Four original Web Audio synth patches plus synthesized kick and clap
- Local autosave and compact, lossless URL song state (including the full 64-bar, four-octave grid)
- Client-side WAV and standard MIDI export
- 90-day local teacher boards, portable student class passes, and addressed `GS2T` submission tickets
- Keyboard editing, a 390px phone layout, reduced-motion behavior, and offline shell caching

## Classroom handoff, across devices

The gallery is intentionally serverless and makes its limitation visible. A teacher creates a board on the projector/device and copies its **student class pass**. The pass is a self-contained URL that works on any student device; it does not depend on the teacher browser’s local storage. A student opens it, composes, and copies a `GS2T` ticket addressed to that exact board. They send the ticket through the teacher’s approved classroom channel, and the teacher pastes it into the board.

There is no central gallery, no automatic live feed, and no browser-only six-character room code. The teacher board remains on the teacher device, so a ticket must be deliberately handed back before it appears on the projector. This keeps the app static-host friendly and keeps nickname/song data out of server-side persistence.

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

The deployment artifact is `dist/`, with `dist/index.html` at its root. `public/staticwebapp.config.json` contains Azure Static Web Apps routes, headers, and cache policy.

## Privacy and data

The current song and teacher boards use browser local storage. A class pass carries only an opaque board reference and expiry; song links contain a composition; a `GS2T` ticket contains its destination board reference, nickname, and composition. These values are carried directly between people/devices, not sent to Gridsong. Students should use classroom aliases rather than full names. See [/privacy](https://gridsong.sociobot.in/privacy/) and [/terms](https://gridsong.sociobot.in/terms/).

## Design and provenance

The product brief is in `.factory/brief.json`; the night-market visual system and generated-art prompt/provenance are in `.factory/design.md` and `assets/src/`.

## License

MIT. See `LICENSE`.
