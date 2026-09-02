# Gridsong

Gridsong is a classroom step sequencer for K–8 music lessons. Students make songs on a colour grid. They can save a link, export WAV or MIDI, or send a nickname-only song to the class gallery. No accounts, ads, or tracking.

Live: <https://gridsong.sociobot.in>

## What it includes

- Choose major, minor, pentatonic, or chromatic scales across one to four octaves.
- Make one to 64 bars at 50–200 BPM, one clear bar at a time.
- Choose four melody sounds, plus kick and clap.
- Your song saves on this device and in a copied song link.
- Export your song as a WAV or MIDI file.
- Teachers can share a class link that closes after 90 days.
- Use the grid by keyboard or on a phone. The composer works offline after its first visit.

## Try the sample safely

Open <https://gridsong.sociobot.in/?demo=1> or choose **Try it with sample data** on the first screen. The demo starts with a four-bar call-and-response. It keeps demo edits apart from your real song. The persistent **Demo — sample data, nothing is saved** banner offers **Reset demo** and **Start for real**. Start for real opens a fresh composer and never reads demo data.

## Classroom gallery, across devices

The teacher creates a board on the projector and copies its **student class pass**. The link works on any student device. Students can send songs with it, but cannot see the board. A student opens it, composes, enters a classroom nickname, and presses **Send to class gallery**. New songs appear on the open projector board.

The teacher key stays in the teacher’s browser. The gallery stores the nickname, song, submission time, and security data. Each board accepts 120 songs and closes after 90 days.

## Develop and deploy

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
