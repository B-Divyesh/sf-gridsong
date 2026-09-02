# Gridsong

Gridsong is a classroom step sequencer for K–8 music lessons. Students make songs by turning notes on and off in a colour grid. <!-- claim:classroom-sequencer -->

Students can save a song link, export WAV or MIDI, or send a nickname-only song to a class gallery. <!-- claim:complete-song-links --> <!-- claim:browser-exports --> <!-- claim:gallery-direct-submit -->

No account, ads, or tracking are required to compose in the demo. <!-- claim:privacy-local-demo -->

Live: <https://gridsong.sociobot.in>

## What it includes

- Choose major, minor, pentatonic, or chromatic scales across one to four octaves, in one to 64 bars at 50–200 BPM. <!-- claim:composer-settings -->
- Choose Lantern, Reed, Bell, or Pluck for melody, plus kick and clap. <!-- claim:instrument-choices -->
- Your song saves on this device and in a copied song link. <!-- claim:local-save --> <!-- claim:complete-song-links -->
- Export your song as a WAV or MIDI file. <!-- claim:browser-exports -->
- Teachers can share a student class pass that submits to a board for 90 days. <!-- claim:student-pass-submit-only --> <!-- claim:gallery-retention -->
- Use the grid by keyboard or on a phone. The composer works offline after its first visit. <!-- claim:keyboard-grid --> <!-- claim:mobile-390 --> <!-- claim:offline-reload -->

## Try the sample safely

Open <https://gridsong.sociobot.in/demo#composer> or choose **Try it with sample data** on the first screen. The demo starts with a four-bar call-and-response and keeps demo edits apart from your real song. <!-- claim:demo-sandbox -->

The persistent **Demo — sample data, nothing is saved** banner offers **Reset demo** and **Start for real**. Start for real opens a fresh composer without reading demo storage. <!-- claim:demo-sandbox -->

## Classroom gallery, across devices

The teacher creates a board on the projector and copies its **student class pass**. Students can use the pass on another device to send a nickname and song, but cannot read the teacher’s board. <!-- claim:student-pass-submit-only -->

New songs appear on the open projector board. <!-- claim:gallery-direct-submit -->

The teacher access key is stored in the teacher’s browser. It is not included in the student class pass. <!-- claim:teacher-key-browser -->

The gallery stores a nickname, composition, submission time, expiry, and hashed access keys. It does not store raw access keys. <!-- claim:gallery-record-schema -->

Each board accepts 120 songs and closes after 90 days. <!-- claim:gallery-capacity --> <!-- claim:gallery-retention -->

## Develop and deploy

Requires Node.js 22+. <!-- claim:developer-runtime -->

```sh
npm install
npm run dev
```

Audio starts only after a user presses **Play**. <!-- claim:audio-user-gesture -->

## Test and build

```sh
npm test          # unit tests
npm run test:api  # API validation + deployment-contract tests
npm run test:e2e  # Chromium desktop + 390px mobile, including axe
npm run build     # reproducible production output in dist/
npm run preview   # serve dist locally
npm run test:live # live Function smoke + gallery flow + atomic 120-song capacity
```

Claim coverage is declared in `.factory/claims.json`. Every marked product claim in this README and the legal pages has a matching tagged regression. <!-- claim:documentation-claims-inventory -->

Deploy `dist/` and the `api/` HTTP Function with `swa-cli.config.json`. Before production deployment, set `GALLERY_STORAGE_CONNECTION` for the provisioned `gridsonggalleries` table. Do not commit that value.

## Privacy and data

The current song and teacher access key use browser local storage. Demo songs use a separate `demo:gridsong.*` namespace. <!-- claim:local-save --> <!-- claim:teacher-key-browser --> <!-- claim:demo-sandbox -->

A class pass carries an opaque board reference, a submit-only capability, and an expiry. A song link carries the composition. <!-- claim:student-pass-submit-only --> <!-- claim:complete-song-links -->

The gallery service receives only the nickname, composition, and submit capability needed for the classroom activity. <!-- claim:gallery-submission-data -->

Boards close after 90 days. Expired records are rejected and removed in bounded cleanup during later board creation. <!-- claim:gallery-retention --> <!-- claim:gallery-expiry-cleanup -->

Gridsong has no account-based backup. Keep work by copying a song link or exporting WAV/MIDI. <!-- claim:no-account-backup --> <!-- claim:complete-song-links --> <!-- claim:browser-exports -->

See [/privacy](https://gridsong.sociobot.in/privacy/) and [/terms](https://gridsong.sociobot.in/terms/).

## License

MIT. See `LICENSE`.
