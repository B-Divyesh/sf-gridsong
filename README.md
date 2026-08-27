# Gridsong

Gridsong is a local-first classroom step sequencer for K–8 music lessons. Students compose on a simple colour grid, save the complete song in a link, export WAV or MIDI, and hand a nickname-only submission ticket to a teacher’s class gallery. No accounts, ads, samples, microphone, or tracking.

Live: <https://gridsong.sociobot.in>

## What it includes

- Major, minor, pentatonic, and chromatic scales across 1–4 octaves
- 1–64 bars at 50–200 BPM, shown one accessible bar at a time
- Four original Web Audio synth patches plus synthesized kick and clap
- Local autosave and portable URL song state
- Client-side WAV and standard MIDI export
- 90-day local teacher galleries and cross-device `GS1` submission tickets
- Keyboard editing, a 390px phone layout, reduced-motion behavior, and offline shell caching

The gallery is intentionally serverless. A gallery board lives on the teacher’s browser; students transfer songs with a ticket. That keeps names and song data out of a central database while still supporting the classroom collection loop.

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

The current song and class galleries use browser local storage. Song links and submission tickets contain the composition data they represent; recipients can open that data. Students should use classroom aliases rather than full names. See [/privacy](https://gridsong.sociobot.in/privacy/) and [/terms](https://gridsong.sociobot.in/terms/).

## Design and provenance

The product brief is in `.factory/brief.json`; the night-market visual system and generated-art prompt/provenance are in `.factory/design.md` and `assets/src/`.

## License

MIT. See `LICENSE`.
