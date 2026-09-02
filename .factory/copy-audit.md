# Copy audit — polish round 3

Reviewed 2 September 2026. The first screen names the job, K–8 audience, sample action, next result, and three concrete facts. Counts treat hyphenated terms as one word.

## Landing and composer

| Words | Sentence |
| ---: | --- |
| 16 | For K–8 music teachers and students who want to compose, save, share, and hear their songs. |
| 8 | Opens a four-bar rhythm in a private demo. |
| 5 | Saves songs on this device. |
| 4 | Exports WAV or MIDI. |
| 5 | No account, ads, or tracking. |
| 10 | Tap a tile to add a note to your song. |
| 8 | Choose a sound, then turn on notes below. |
| 6 | Tip: use arrow keys to move. |
| 9 | Press Space to switch a note on or off. |
| 6 | Save a link or a file. |
| 5 | All exports happen right here. |
| 10 | Make a class board and share its student class pass. |
| 11 | Students send a classroom nickname and song straight to the projector. |
| 5 | No accounts or email addresses. |
| 7 | Students can open it on another device. |
| 10 | Only the student class pass, nickname, and song are sent. |
| 6 | Play submitted songs for the class. |
| 9 | Songs stay on this device until you share them. |
| 5 | No accounts, ads, or tracking. |
| 9 | You’re offline — composing, local saves, and exports still work. |

## Class gallery states

| Words | Sentence |
| ---: | --- |
| 8 | Create a 90-day board on the teacher device. |
| 7 | You will get a student class pass. |
| 5 | New submissions appear here automatically. |
| 13 | The gallery keeps each nickname, song, submission time, expiry, and protected key checks. |
| 5 | Boards close after 90 days. |
| 10 | There are no accounts, email addresses, or student gallery browsing. |
| 6 | This sample stays on this device. |
| 11 | Start for real to create a class board and invite students. |
| 5 | Share the student class pass. |
| 14 | Students open it, choose a nickname, and submit their song directly to this board. |
| 10 | New songs check in automatically while this window is open. |
| 11 | Share the student class pass, then new songs will appear here. |
| 6 | You opened a student class pass. |
| 14 | Compose your song, add a classroom nickname, and send it to your teacher’s projector. |
| 9 | This pass can send a song from another device. |
| 8 | It does not show the teacher’s private board. |
| 8 | Use a classroom alias, not your full name. |
| 8 | Submit once you have at least one note. |
| 8 | Your teacher will see it on the board. |
| 9 | Your nickname and song are kept for 90 days. |
| 7 | Use an alias, not your full name. |

## README

| Words | Sentence |
| ---: | --- |
| 10 | Gridsong is a classroom step sequencer for K–8 music lessons. |
| 13 | Students make songs by turning notes on and off in a colour grid. |
| 21 | Students can save a song link, export WAV or MIDI, or send a classroom nickname and song to a class gallery. |
| 12 | No account, ads, or tracking are required to compose in the demo. |
| 20 | Choose major, minor, pentatonic, or chromatic scales across one to four octaves, in one to 64 bars at 50–200 BPM. |
| 12 | Choose Lantern, Reed, Bell, or Pluck for melody, plus kick and clap. |
| 12 | Your song saves on this device and in a copied song link. |
| 9 | Export your song as a WAV or MIDI file. |
| 15 | Teachers can share a student class pass that submits to a board for 90 days. |
| 9 | Use the grid by keyboard or on a phone. |
| 14 | After the first visit, compose, save locally, and export WAV or MIDI while offline. |
| 13 | Open the demo URL or choose Try it with sample data on the first screen. |
| 16 | The demo starts with a four-bar call-and-response and keeps demo edits apart from your real song. |
| 17 | The persistent Demo — sample data, nothing is saved banner offers Reset demo and Start for real. |
| 11 | Start for real discards demo data and opens a fresh composer. |
| 14 | The teacher creates a board on the projector and copies its student class pass. |
| 10 | Students can use the student class pass on another device. |
| 12 | It sends a nickname and song but cannot read the teacher’s board. |
| 8 | New songs appear on the open projector board. |
| 10 | The teacher access key is stored in the teacher’s browser. |
| 9 | It is not included in the student class pass. |
| 10 | The gallery stores the nickname, song, submission time, and expiry. |
| 11 | It stores protected checks instead of usable class or teacher keys. |
| 10 | Each board accepts 120 songs and closes after 90 days. |
| 3 | Requires Node.js 22+. |
| 8 | Audio starts only after a user presses Play. |
| 6 | Claim coverage is declared in `.factory/claims.json`. |
| 16 | Every marked product claim in this README and the legal pages has a matching tagged regression. |
| 9 | Deploy `dist/` and the API with `swa-cli.config.json`. |
| 10 | Before production deployment, set `GALLERY_STORAGE_CONNECTION` for the provisioned `gridsonggalleries` table. |
| 5 | Do not commit that value. |
| 11 | The current song and teacher access key use browser local storage. |
| 7 | Demo songs use a separate `demo:gridsong.*` namespace. |
| 18 | A student class pass contains a board ID, a key that can only send songs, and an expiry. |
| 6 | A song link contains the song. |
| 17 | The gallery service receives only the student class pass, nickname, and song needed for the classroom activity. |
| 5 | Boards close after 90 days. |
| 18 | Expired records are rejected and deleted in small batches when a new board is created. |
| 5 | Gridsong has no account-based backup. |
| 10 | Keep work by copying a song link or exporting WAV/MIDI. |

## Terminology

| Concept | One product term |
| --- | --- |
| Classroom collection | class gallery |
| Teacher-created collection | class board |
| Student invitation | student class pass |
| Student identity | classroom nickname |
| Saved composition | song |
| Isolated sample mode | demo |

## Checks

- Sentences over 22 words: none.
- Banned marketing words: none.
- Reader-facing security jargon: none.
- First-screen read-aloud: the job, audience, first action, and result fit in one breath.
