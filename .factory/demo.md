# Gridsong demo sandbox

## Entry point

Open `/?demo=1` or `/demo`. The landing action points to `/demo#composer` so
the four-bar sample opens directly at the working grid.

## Shipped sample

`src/demo.ts` contains “Morning call and response”: four bars at 104 BPM with
32 melodic notes, 8 kick hits, and 8 clap hits. It is a short classroom
call-and-response that is ready to play, edit, copy, or export.

## Isolation and reset

Normal songs use `gridsong.song.v1`; demo songs use
`demo:gridsong.song.v1`. The normal teacher key and the demo placeholder use
the equivalent separate namespaces. Demo mode neither reads nor writes a real
song key, and its gallery dialog never makes an API request. The persistent
banner exposes **Reset demo**, which restores the shipped sample, and **Start
for real**, which opens `/` without importing demo data.

## Offline

The service worker caches the shell and sample code after the first visit. The
`@claim:offline-reload` browser test uses its own context, takes it offline,
and reloads `/demo`.
