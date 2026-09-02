import './style.css';
import { noteName, Player, renderWav, songDuration } from './audio';
import { DEMO_GALLERY_KEY, DEMO_SONG_KEY, isDemoLocation, REAL_GALLERY_KEY, REAL_SONG_KEY, sampleSong } from './demo';
import { createGallery, fetchGallery, GalleryApiError, removeGalleryEntry, submitToGallery, type TeacherGallery } from './gallery-api';
import { midiBlob } from './midi';
import { blankSong, galleryHash, galleryInviteFromHash, galleryPass, melodicRows, resizeSong, sanitizeSong, songFromHash, songHash, STEPS_PER_BAR } from './state';
import type { GalleryEntry, GalleryInvite, Song, VoiceName } from './types';

const isDemo = isDemoLocation(location.pathname, location.search);
const SONG_KEY = isDemo ? DEMO_SONG_KEY : REAL_SONG_KEY;
const ACTIVE_GALLERY_KEY = isDemo ? DEMO_GALLERY_KEY : REAL_GALLERY_KEY;
const player = new Player();

function discardDemoData(): void {
  try {
    localStorage.removeItem(DEMO_SONG_KEY);
    localStorage.removeItem(DEMO_GALLERY_KEY);
  } catch {
    // A blocked local-storage area must not prevent a visitor leaving the demo.
  }
}

// Reaching the real composer is an explicit boundary: it must never retain or
// revive the isolated sample, even if someone leaves with an address-bar URL.
if (!isDemo) discardDemoData();

let song = loadInitialSong();
let currentBar = 0;
let selectedVoice: VoiceName = 'lantern';
let activeGallery: TeacherGallery | null = null;
let classInvite: GalleryInvite | null = null;
let playStep = -1;
let galleryPoller = 0;

if (isDemo) {
  document.title = 'Demo — Gridsong';
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', 'https://gridsong.sociobot.in/demo');
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute('content', 'Demo — Gridsong');
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute('content', 'https://gridsong.sociobot.in/demo');
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.setAttribute('content', 'Demo — Gridsong');
  document.body.classList.add('demo-mode');
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <header class="site-header">
    <a class="brand" href="/" aria-label="Gridsong home">
      <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M7 8h26v24H7z"/><path d="M13 15h5v5h-5zm9 0h5v5h-5zm-9 9h5v5h-5z"/></svg>
      <span>Gridsong</span>
    </a>
    <nav aria-label="Primary">
      <a href="/demo#composer">Try sample</a>
      <a href="/#composer">Make music</a>
      <a href="/#class-gallery" id="open-gallery">Open class gallery</a>
      <a href="/privacy/">Privacy</a>
    </nav>
  </header>
  <div class="sr-only" id="route-status" role="status" aria-live="polite" aria-atomic="true"></div>
  <div class="demo-banner" id="demo-banner" role="status" aria-live="polite" hidden>
    <span><strong>Demo</strong> — sample data, nothing is saved</span>
    <span class="demo-actions"><button class="text-button" id="reset-demo" type="button">Reset demo</button><button class="text-button" id="start-real" type="button">Start for real</button></span>
  </div>
  <main id="main" tabindex="-1">
    <section class="intro" aria-labelledby="page-title">
      <div class="intro-copy">
        <p class="eyebrow">Classroom step sequencer</p>
        <h1 id="page-title" tabindex="-1">Make and play songs on a classroom grid</h1>
        <p>For K–8 music teachers and students who want to compose, save, share, and hear their songs.</p>
        <div class="intro-actions"><a class="button primary" href="/demo#composer">Try it with sample data</a><span>Opens a four-bar rhythm in a private demo.</span></div>
        <ul class="plain-facts"><li>Saves songs on this device</li><li>Exports WAV or MIDI</li><li>No account, ads, or tracking</li></ul>
      </div>
      <figure class="hero-art">
        <img src="/assets/night-market-grid.webp" width="1200" height="800" alt="A handmade night-market music stall with a grid of glowing lantern notes" fetchpriority="high" decoding="async">
        <figcaption>Tap a tile to add a note to your song.</figcaption>
      </figure>
    </section>

    <section class="composer" id="composer" aria-labelledby="composer-title">
      <div class="section-heading">
        <div><p class="eyebrow">Your composition</p><h2 id="composer-title">Compose your song on the grid</h2></div>
        <div class="save-state" id="save-state" role="status" aria-live="polite"><span aria-hidden="true">●</span> Saved on this device</div>
      </div>

      <div class="song-title-wrap">
        <label for="song-title">Song title</label>
        <input id="song-title" maxlength="60" autocomplete="off">
      </div>

      <div class="control-rack" aria-label="Song settings">
        <label>Scale<select id="scale"><option value="major">Major</option><option value="minor">Minor</option><option value="pentatonic">Pentatonic</option><option value="chromatic">Chromatic</option></select></label>
        <label>Bars<select id="bars"><option>1</option><option>2</option><option>4</option><option>8</option><option>16</option><option>32</option><option>64</option></select></label>
        <label>Octaves<select id="octaves"><option>1</option><option>2</option><option>3</option><option>4</option></select></label>
        <label class="tempo-label">Tempo <output id="tempo-output" for="tempo">112 BPM</output><input id="tempo" type="range" min="50" max="200" step="1"></label>
      </div>

      <div class="transport" aria-label="Playback controls">
        <button class="button primary" id="play" type="button"><span class="play-icon" aria-hidden="true">▶</span><span>Play song</span></button>
        <button class="button secondary" id="stop" type="button" disabled><span aria-hidden="true">■</span><span>Stop</span></button>
        <p id="duration">4 bars · 8 seconds</p>
      </div>

      <div class="voice-picker" role="group" aria-labelledby="voice-heading">
        <div><p id="voice-heading" class="field-label">Choose a melody sound</p><p class="hint">Choose a sound, then turn on notes below.</p></div>
        <div class="voice-buttons">
          <button type="button" class="voice active" data-voice="lantern" aria-pressed="true"><span class="swatch v-lantern"></span>Lantern</button>
          <button type="button" class="voice" data-voice="reed" aria-pressed="false"><span class="swatch v-reed"></span>Reed</button>
          <button type="button" class="voice" data-voice="bell" aria-pressed="false"><span class="swatch v-bell"></span>Bell</button>
          <button type="button" class="voice" data-voice="pluck" aria-pressed="false"><span class="swatch v-pluck"></span>Pluck</button>
        </div>
      </div>

      <div class="bar-nav">
        <button class="icon-button" id="previous-bar" type="button" aria-label="Previous bar">←</button>
        <strong id="bar-label">Bar 1 of 4</strong>
        <button class="icon-button" id="next-bar" type="button" aria-label="Next bar">→</button>
      </div>
      <div class="grid-help" id="grid-help">Tip: use arrow keys to move. Press Space to switch a note on or off.</div>
      <div class="grid-scroll" tabindex="-1">
        <div class="pitch-labels" id="pitch-labels" aria-hidden="true"></div>
        <div class="note-grid" id="note-grid" role="group" aria-label="Note grid" aria-describedby="grid-help"></div>
      </div>

      <div class="action-strip">
        <div>
          <h3>Save or export your song</h3>
          <p>Save a link or a file. All exports happen right here.</p>
        </div>
        <div class="action-buttons">
          <button class="button primary" id="share" type="button">Copy song link</button>
          <button class="button secondary" id="export-wav" type="button">Export WAV</button>
          <button class="button secondary" id="export-midi" type="button">Export MIDI</button>
          <button class="button quiet" id="new-song" type="button">Start new song</button>
        </div>
      </div>
    </section>

    <section class="classroom" id="class-gallery" aria-labelledby="classroom-title">
      <div><p class="eyebrow">Class gallery</p><h2 id="classroom-title">Collect songs for the class</h2><p>Make a class board and share its student class pass. Students send a classroom nickname and song straight to the projector. No accounts or email addresses.</p><button class="button primary" id="open-gallery-bottom" type="button">Open class gallery</button></div>
      <ol class="class-steps"><li><span>01</span><strong>Teacher shares a student class pass</strong><small>Students can open it on another device.</small></li><li><span>02</span><strong>Students submit a song</strong><small>Only the student class pass, nickname, and song are sent.</small></li><li><span>03</span><strong>Projector collects songs</strong><small>Play submitted songs for the class.</small></li></ol>
    </section>
  </main>

  <footer>
    <div><a class="brand footer-brand" href="/">Gridsong</a><p>Songs stay on this device until you share them. No accounts, ads, or tracking.</p></div>
    <nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></nav>
    <p class="credit">Built by the Param Factory · Gridsong v1.0.0</p>
  </footer>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <div class="offline-banner" id="offline-banner" role="status" data-claim="offline-reload" hidden>You’re offline — composing, local saves, and exports still work.</div>

  <dialog id="gallery-dialog" aria-labelledby="gallery-title">
    <div class="dialog-header"><div><p class="eyebrow">Class gallery setup</p><h2 id="gallery-title">Class gallery</h2></div><button class="icon-button" id="close-gallery" type="button" aria-label="Close gallery">×</button></div>
    <div id="gallery-start">
      <p>Create a 90-day board on the teacher device. You will get a student class pass. New submissions appear here automatically.</p>
      <button class="button primary" id="create-gallery" type="button">Create class board</button>
      <p class="privacy-note" data-claim="gallery-record-schema">The gallery keeps each nickname, song, submission time, expiry, and protected key checks. Boards close after 90 days.</p>
      <p class="privacy-note">There are no accounts, email addresses, or student gallery browsing.</p>
    </div>
    <div id="gallery-demo" hidden>
      <p><strong>This sample stays on this device.</strong> Start for real to create a class board and invite students.</p>
      <button class="button primary" id="start-real-gallery" type="button">Start for real</button>
    </div>
    <div id="gallery-board" hidden>
      <div class="code-ticket"><span>Student class pass</span><strong id="gallery-pass-status">Ready to share</strong><button class="button quiet" id="copy-pass" type="button">Copy student class pass</button></div>
      <p class="privacy-note">Share the student class pass. Students open it, choose a nickname, and submit their song directly to this board. New songs check in automatically while this window is open.</p>
      <details class="student-submit"><summary>Add this device’s song to the board</summary><label for="board-nickname">Nickname or label</label><div class="submit-row"><input id="board-nickname" maxlength="24" autocomplete="off"><button class="button primary" id="add-local" type="button">Add to board</button></div></details>
      <div class="gallery-list-heading"><h3>Submissions</h3><span id="submission-count">0 songs</span></div>
      <div id="gallery-list" class="gallery-list"></div>
    </div>
    <div id="gallery-student" hidden>
      <p class="student-pass-title"><strong>You opened a student class pass.</strong> Compose your song, add a classroom nickname, and send it to your teacher’s projector.</p>
      <ol class="pass-steps"><li>This pass can send a song from another device. It does not show the teacher’s private board.</li><li>Use a classroom alias, not your full name.</li><li>Submit once you have at least one note. Your teacher will see it on the board.</li></ol>
      <button class="button primary" id="student-compose" type="button">Start composing</button>
      <details class="student-submit" open><summary>Send my song</summary><label for="student-nickname">Student nickname</label><div class="submit-row"><input id="student-nickname" maxlength="24" autocomplete="off"><button class="button primary" id="submit-student-song" type="button">Send to class gallery</button></div><p class="hint">Your nickname and song are kept for 90 days. Use an alias, not your full name.</p></details>
    </div>
  </dialog>
`;

function loadInitialSong(): Song {
  try {
    const linked = songFromHash(location.hash);
    if (linked) return linked;
  } catch (error) {
    queueMicrotask(() => showToast(error instanceof Error ? `${error.message} Starting a fresh song.` : 'Could not open that song.'));
  }
  try {
    const local = localStorage.getItem(SONG_KEY);
    return local ? sanitizeSong(JSON.parse(local)) : isDemo ? sampleSong() : blankSong();
  } catch {
    return isDemo ? sampleSong() : blankSong();
  }
}

function get<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

const titleInput = get<HTMLInputElement>('song-title');
const scaleInput = get<HTMLSelectElement>('scale');
const barsInput = get<HTMLSelectElement>('bars');
const octavesInput = get<HTMLSelectElement>('octaves');
const tempoInput = get<HTMLInputElement>('tempo');
const grid = get<HTMLDivElement>('note-grid');
const galleryDialog = get<HTMLDialogElement>('gallery-dialog');

function syncControls(): void {
  titleInput.value = song.title;
  scaleInput.value = song.scale;
  barsInput.value = String(song.bars);
  octavesInput.value = String(song.octaves);
  tempoInput.value = String(song.tempo);
  get<HTMLOutputElement>('tempo-output').value = `${song.tempo} BPM`;
  get<HTMLElement>('duration').textContent = `${song.bars} ${song.bars === 1 ? 'bar' : 'bars'} · ${formatDuration(songDuration(song))}`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min ${Math.round(seconds % 60)} sec`;
}

function saveLocal(message = 'Saved on this device'): void {
  try {
    localStorage.setItem(SONG_KEY, JSON.stringify(song));
    const label = isDemo && message === 'Saved on this device' ? 'Saved in this demo' : message;
    get<HTMLElement>('save-state').innerHTML = `<span aria-hidden="true">●</span> ${label}`;
  } catch {
    get<HTMLElement>('save-state').textContent = 'Local save is unavailable — copy a link instead';
  }
}

function commit(message?: string): void {
  saveLocal(message);
  renderGrid();
}

function rowVoice(row: number): Song['notes'][number]['voice'] {
  const melodyCount = melodicRows(song);
  if (row === melodyCount) return 'kick';
  if (row === melodyCount + 1) return 'clap';
  return selectedVoice;
}

function renderGrid(): void {
  currentBar = Math.min(currentBar, song.bars - 1);
  const melodyCount = melodicRows(song);
  const rowCount = melodyCount + 2;
  const start = currentBar * STEPS_PER_BAR;
  const notes = new Map(song.notes.filter(note => note.step >= start && note.step < start + STEPS_PER_BAR).map(note => [`${note.row}:${note.step}`, note]));
  const labels = get<HTMLDivElement>('pitch-labels');
  labels.replaceChildren();
  grid.replaceChildren();
  grid.style.setProperty('--rows', String(rowCount));
  for (let row = 0; row < rowCount; row++) {
    const label = document.createElement('span');
    label.textContent = noteName(song, row);
    labels.append(label);
    for (let column = 0; column < STEPS_PER_BAR; column++) {
      const step = start + column;
      const note = notes.get(`${row}:${step}`);
      const button = document.createElement('button');
      const name = noteName(song, row);
      button.type = 'button';
      button.className = `note-cell${note ? ` active v-${note.voice}` : ''}${playStep === step ? ' playing' : ''}${column % 4 === 0 ? ' beat' : ''}`;
      button.dataset.row = String(row);
      button.dataset.step = String(step);
      button.setAttribute('aria-pressed', String(Boolean(note)));
      button.setAttribute('aria-label', `${name}, beat ${Math.floor(column / 4) + 1} and step ${column % 4 + 1}${note ? `, on with ${note.voice}` : ', off'}`);
      button.innerHTML = '<span aria-hidden="true"></span>';
      grid.append(button);
    }
  }
  get<HTMLElement>('bar-label').textContent = `Bar ${currentBar + 1} of ${song.bars}`;
  get<HTMLButtonElement>('previous-bar').disabled = currentBar === 0;
  get<HTMLButtonElement>('next-bar').disabled = currentBar === song.bars - 1;
}

function toggleNote(row: number, step: number): void {
  const index = song.notes.findIndex(note => note.row === row && note.step === step);
  if (index >= 0) song.notes.splice(index, 1);
  else song.notes.push({ row, step, voice: rowVoice(row) });
  commit();
}

grid.addEventListener('click', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('.note-cell');
  if (!button) return;
  toggleNote(Number(button.dataset.row), Number(button.dataset.step));
  grid.querySelector<HTMLButtonElement>(`[data-row="${button.dataset.row}"][data-step="${button.dataset.step}"]`)?.focus();
});

grid.addEventListener('keydown', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('.note-cell');
  if (!button || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const row = Number(button.dataset.row);
  const step = Number(button.dataset.step);
  const nextRow = event.key === 'ArrowUp' ? row - 1 : event.key === 'ArrowDown' ? row + 1 : row;
  const nextStep = event.key === 'Home' ? currentBar * 16 : event.key === 'End' ? currentBar * 16 + 15 : event.key === 'ArrowLeft' ? step - 1 : event.key === 'ArrowRight' ? step + 1 : step;
  grid.querySelector<HTMLButtonElement>(`[data-row="${nextRow}"][data-step="${nextStep}"]`)?.focus();
});

document.querySelectorAll<HTMLButtonElement>('[data-voice]').forEach(button => button.addEventListener('click', () => {
  selectedVoice = button.dataset.voice as VoiceName;
  document.querySelectorAll<HTMLButtonElement>('[data-voice]').forEach(item => {
    const selected = item === button;
    item.classList.toggle('active', selected);
    item.setAttribute('aria-pressed', String(selected));
  });
  showToast(`${button.textContent?.trim()} sound selected`);
}));

titleInput.addEventListener('input', () => { song.title = titleInput.value.slice(0, 60); saveLocal(); });
tempoInput.addEventListener('input', () => {
  song.tempo = Number(tempoInput.value);
  get<HTMLOutputElement>('tempo-output').value = `${song.tempo} BPM`;
  get<HTMLElement>('duration').textContent = `${song.bars} ${song.bars === 1 ? 'bar' : 'bars'} · ${formatDuration(songDuration(song))}`;
  saveLocal();
});

[scaleInput, barsInput, octavesInput].forEach(input => input.addEventListener('change', () => {
  const oldCount = song.notes.length;
  song = resizeSong(song, Number(barsInput.value), Number(octavesInput.value), scaleInput.value as Song['scale']);
  currentBar = Math.min(currentBar, song.bars - 1);
  syncControls();
  commit();
  const removed = oldCount - song.notes.length;
  if (removed > 0) showToast(`${removed} ${removed === 1 ? 'note was' : 'notes were'} outside the new grid and removed.`);
}));

get<HTMLButtonElement>('previous-bar').addEventListener('click', () => { currentBar--; renderGrid(); focusFirstNote(); });
get<HTMLButtonElement>('next-bar').addEventListener('click', () => { currentBar++; renderGrid(); focusFirstNote(); });

function focusFirstNote(): void {
  requestAnimationFrame(() => grid.querySelector<HTMLButtonElement>('.note-cell')?.focus());
}

get<HTMLButtonElement>('play').addEventListener('click', async () => {
  if (!song.notes.length) { showToast('Turn on at least one note before playing.'); focusFirstNote(); return; }
  try {
    await player.start(song, step => {
      playStep = step;
      const playingBar = Math.floor(step / STEPS_PER_BAR);
      if (playingBar !== currentBar) currentBar = playingBar;
      renderGrid();
    }, currentBar * STEPS_PER_BAR);
    get<HTMLButtonElement>('play').disabled = true;
    get<HTMLButtonElement>('stop').disabled = false;
    showToast('Playing. Audio is made in your browser.');
  } catch {
    showToast('Audio could not start. Tap Play again or check the device volume.');
  }
});

get<HTMLButtonElement>('stop').addEventListener('click', stopPlayback);

function stopPlayback(): void {
  player.stop();
  playStep = -1;
  get<HTMLButtonElement>('play').disabled = false;
  get<HTMLButtonElement>('stop').disabled = true;
  renderGrid();
}

get<HTMLButtonElement>('share').addEventListener('click', async () => {
  const hash = songHash(song, location.hash);
  const url = `${location.origin}${location.pathname}${hash}`;
  history.replaceState(null, '', hash);
  await copyText(url, 'Song link copied. It contains the whole song.');
  saveLocal('Saved here and in the copied link');
});

get<HTMLButtonElement>('export-midi').addEventListener('click', () => {
  if (!song.notes.length) { showToast('Add a note before exporting MIDI.'); return; }
  download(midiBlob(song), `${safeName(song.title)}.mid`);
  showToast('MIDI exported.');
});

get<HTMLButtonElement>('export-wav').addEventListener('click', async () => {
  if (!song.notes.length) { showToast('Add a note before exporting WAV.'); return; }
  const button = get<HTMLButtonElement>('export-wav');
  button.disabled = true;
  button.textContent = 'Rendering WAV…';
  try {
    download(await renderWav(song), `${safeName(song.title)}.wav`);
    showToast('WAV exported.');
  } catch {
    showToast('WAV export ran out of memory. Try fewer bars, or export MIDI.');
  } finally {
    button.disabled = false;
    button.textContent = 'Export WAV';
  }
});

get<HTMLButtonElement>('new-song').addEventListener('click', () => {
  if (song.notes.length && !confirm(`Start a new song? “${song.title}” is saved on this device, but unsaved link changes will be left behind.`)) return;
  stopPlayback();
  song = blankSong();
  currentBar = 0;
  const params = new URLSearchParams(location.hash.replace(/^#/, ''));
  params.delete('song');
  history.replaceState(null, '', `${location.pathname}${params.size ? `#${params.toString()}` : ''}`);
  syncControls();
  commit('New song saved on this device');
  titleInput.focus();
});

function startForReal(): void {
  discardDemoData();
  location.assign('/');
}

function resetDemo(): void {
  if (!isDemo) return;
  stopPlayback();
  discardDemoData();
  song = sampleSong();
  currentBar = 0;
  history.replaceState(null, '', `${location.pathname}${location.search}`);
  syncControls();
  commit('Demo sample reset');
  showToast('Demo sample reset. Nothing was saved to your real songs.');
  focusFirstNote();
}

function safeName(value: string): string {
  return value.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'gridsong';
}

function download(blob: Blob, filename: string): void {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

let toastTimer = 0;
function showToast(message: string): void {
  const toast = get<HTMLDivElement>('toast');
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 4200);
}

async function copyText(value: string, success: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    showToast(success);
  } catch {
    prompt('Copy this text:', value);
    showToast('Copy the text from the box.');
  }
}

function saveTeacherAccess(gallery: TeacherGallery): void {
  try {
    localStorage.setItem(ACTIVE_GALLERY_KEY, JSON.stringify({ id: gallery.id, teacherKey: gallery.teacherKey, studentKey: gallery.studentKey }));
  } catch { showToast('Keep this tab open: browser storage is unavailable for the teacher key.'); }
}

function loadTeacherAccess(): Pick<TeacherGallery, 'id' | 'teacherKey' | 'studentKey'> | null {
  try {
    const value = JSON.parse(localStorage.getItem(ACTIVE_GALLERY_KEY) ?? '') as Partial<TeacherGallery>;
    return typeof value.id === 'string' && typeof value.teacherKey === 'string' && typeof value.studentKey === 'string' ? value as Pick<TeacherGallery, 'id' | 'teacherKey' | 'studentKey'> : null;
  } catch { return null; }
}

async function restoreTeacherGallery(): Promise<void> {
  const access = loadTeacherAccess();
  if (!access) return;
  try {
    const gallery = await fetchGallery(access.id, access.teacherKey);
    activeGallery = { ...gallery, ...access };
  } catch (error) {
    if (error instanceof GalleryApiError && error.status === 410) localStorage.removeItem(ACTIVE_GALLERY_KEY);
  }
}

function activateGalleryFromHash(): string | null {
  if (isDemo) return null;
  try {
    const invite = galleryInviteFromHash(location.hash);
    classInvite = invite;
    if (invite) activeGallery = null;
    return null;
  } catch (error) { return error instanceof Error ? error.message : 'That student class pass could not be opened.'; }
}

async function refreshGallery(silent = false): Promise<void> {
  if (!activeGallery) return;
  try {
    const gallery = await fetchGallery(activeGallery.id, activeGallery.teacherKey);
    activeGallery = { ...gallery, teacherKey: activeGallery.teacherKey, studentKey: activeGallery.studentKey };
    renderGallery();
  } catch (error) {
    if (!silent || (error instanceof GalleryApiError && error.status === 410)) showToast(error instanceof Error ? error.message : 'The gallery could not refresh.');
    if (error instanceof GalleryApiError && error.status === 410) { activeGallery = null; localStorage.removeItem(ACTIVE_GALLERY_KEY); renderGallery(); }
  }
}

async function openGallery(): Promise<void> {
  if (!galleryDialog.open) galleryDialog.showModal();
  if (isDemo) { renderGallery(); return; }
  if (!classInvite && !activeGallery) await restoreTeacherGallery();
  renderGallery();
  if (activeGallery && !galleryPoller) galleryPoller = window.setInterval(() => void refreshGallery(true), 5000);
}

get<HTMLAnchorElement>('open-gallery').addEventListener('click', event => {
  event.preventDefault();
  if (!isDemo && !classInvite && !location.hash.startsWith('#song=') && location.hash !== '#class-gallery') {
    history.pushState(null, '', '/#class-gallery');
  }
  void openGallery();
});
get<HTMLButtonElement>('open-gallery-bottom').addEventListener('click', () => {
  if (!isDemo && !classInvite && !location.hash.startsWith('#song=') && location.hash !== '#class-gallery') {
    history.pushState(null, '', '/#class-gallery');
  }
  void openGallery();
});
function closeGallery(): void {
  galleryDialog.close();
  if (location.hash === '#class-gallery') history.replaceState(null, '', '/');
  if (galleryPoller) { clearInterval(galleryPoller); galleryPoller = 0; }
}
get<HTMLButtonElement>('close-gallery').addEventListener('click', closeGallery);
galleryDialog.addEventListener('click', event => { if (event.target === galleryDialog) closeGallery(); });
galleryDialog.addEventListener('close', () => { if (galleryPoller) { clearInterval(galleryPoller); galleryPoller = 0; } });
get<HTMLButtonElement>('student-compose').addEventListener('click', () => {
  galleryDialog.close();
  document.getElementById('composer')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  queueMicrotask(() => titleInput.focus());
});

get<HTMLButtonElement>('create-gallery').addEventListener('click', async () => {
  const button = get<HTMLButtonElement>('create-gallery');
  button.disabled = true;
  button.textContent = 'Creating board…';
  try {
    activeGallery = await createGallery();
    classInvite = null;
    saveTeacherAccess(activeGallery);
    renderGallery();
    if (!galleryPoller) galleryPoller = window.setInterval(() => void refreshGallery(true), 5000);
    showToast('Class board created. Copy the student class pass to invite students.');
  } catch (error) { showToast(error instanceof Error ? error.message : 'The class board could not be created.'); }
  finally { button.disabled = false; button.textContent = 'Create class board'; }
});

get<HTMLButtonElement>('copy-pass').addEventListener('click', () => {
  if (!activeGallery) return;
  const pass = galleryPass(activeGallery.id, activeGallery.studentKey, activeGallery.expiresAt);
  const url = `${location.origin}${location.pathname}${galleryHash(pass)}`;
  void copyText(url, 'Student class pass copied. It opens on another device.');
});

function makeCurrentEntry(inputId: string): GalleryEntry | null {
  const nickname = get<HTMLInputElement>(inputId).value.trim();
  if (!nickname) { showToast('Add a nickname first.'); get<HTMLInputElement>(inputId).focus(); return null; }
  if (!song.notes.length) { showToast('Add at least one note before submitting.'); return null; }
  return { id: crypto.randomUUID(), nickname: nickname.slice(0, 24), createdAt: Date.now(), song: structuredClone(song) };
}

get<HTMLButtonElement>('add-local').addEventListener('click', async () => {
  const entry = makeCurrentEntry('board-nickname');
  if (!entry || !activeGallery) return;
  try {
    await submitToGallery({ galleryId: activeGallery.id, submitKey: activeGallery.studentKey }, entry.nickname, entry.song);
    await refreshGallery(true);
    showToast(`${entry.nickname}’s song added.`);
  } catch (error) { showToast(error instanceof Error ? error.message : 'The song could not be added.'); }
});

get<HTMLButtonElement>('submit-student-song').addEventListener('click', async () => {
  const entry = makeCurrentEntry('student-nickname');
  if (!entry || !classInvite) return;
  const button = get<HTMLButtonElement>('submit-student-song');
  button.disabled = true;
  button.textContent = 'Sending…';
  try {
    await submitToGallery(classInvite, entry.nickname, entry.song);
    showToast('Song sent to the class gallery. Your teacher can play it now.');
  } catch (error) { showToast(error instanceof Error ? error.message : 'The song could not be sent.'); }
  finally { button.disabled = false; button.textContent = 'Send to class gallery'; }
});

function renderGallery(): void {
  const board = get<HTMLDivElement>('gallery-board');
  const student = get<HTMLDivElement>('gallery-student');
  const demo = get<HTMLDivElement>('gallery-demo');
  demo.hidden = !isDemo;
  get<HTMLDivElement>('gallery-start').hidden = isDemo || Boolean(activeGallery || classInvite);
  if (isDemo) { board.hidden = true; student.hidden = true; return; }
  board.hidden = !activeGallery;
  student.hidden = !classInvite || Boolean(activeGallery);
  if (!activeGallery) return;
  get<HTMLElement>('submission-count').textContent = `${activeGallery.entries.length} ${activeGallery.entries.length === 1 ? 'song' : 'songs'}`;
  const list = get<HTMLDivElement>('gallery-list');
  list.replaceChildren();
  if (!activeGallery.entries.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-gallery';
    empty.innerHTML = '<span aria-hidden="true">♫</span><strong>No songs submitted yet</strong><p>Share the student class pass, then new songs will appear here.</p>';
    list.append(empty);
    return;
  }
  activeGallery.entries.forEach((entry, index) => {
    const article = document.createElement('article');
    const copy = document.createElement('div');
    const number = document.createElement('span');
    const heading = document.createElement('h4');
    const meta = document.createElement('p');
    const actions = document.createElement('div');
    const load = document.createElement('button');
    const remove = document.createElement('button');
    number.className = 'entry-number'; number.textContent = String(index + 1).padStart(2, '0');
    heading.textContent = entry.song.title;
    meta.textContent = `by ${entry.nickname} · ${entry.song.bars} bars · ${entry.song.tempo} BPM`;
    copy.append(number, heading, meta);
    load.className = 'button secondary'; load.type = 'button'; load.textContent = 'Load & play';
    load.addEventListener('click', () => {
      stopPlayback(); song = structuredClone(entry.song); currentBar = 0; syncControls(); commit(`Loaded ${entry.nickname}’s song`); galleryDialog.close();
      document.getElementById('composer')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      void get<HTMLButtonElement>('play').click();
    });
    remove.className = 'button quiet danger'; remove.type = 'button'; remove.textContent = 'Remove';
    remove.addEventListener('click', async () => {
      if (!activeGallery || !confirm(`Remove ${entry.nickname}’s “${entry.song.title}” from this gallery?`)) return;
      try { await removeGalleryEntry(activeGallery.id, entry.id, activeGallery.teacherKey); await refreshGallery(true); showToast('Submission removed.'); }
      catch (error) { showToast(error instanceof Error ? error.message : 'The submission could not be removed.'); }
    });
    actions.append(load, remove);
    article.append(copy, actions);
    list.append(article);
  });
}

function updateOnlineState(): void {
  get<HTMLElement>('offline-banner').hidden = navigator.onLine;
}
window.addEventListener('online', () => { updateOnlineState(); showToast('Back online.'); });
window.addEventListener('offline', updateOnlineState);
window.addEventListener('hashchange', () => {
  const passError = activateGalleryFromHash();
  if (passError) showToast(passError);
  if (galleryDialog.open) void openGallery();
  try {
    const linked = songFromHash(location.hash);
    if (linked) { stopPlayback(); song = linked; currentBar = 0; syncControls(); commit('Song opened from its link'); }
  } catch (error) { showToast(error instanceof Error ? error.message : 'This song link could not be opened.'); }
  if (location.hash === '#class-gallery') void openGallery();
});

syncControls();
renderGrid();
saveLocal();
updateOnlineState();
get<HTMLElement>('demo-banner').hidden = !isDemo;
get<HTMLButtonElement>('reset-demo').addEventListener('click', resetDemo);
get<HTMLButtonElement>('start-real').addEventListener('click', startForReal);
get<HTMLButtonElement>('start-real-gallery').addEventListener('click', startForReal);
const initialPassError = activateGalleryFromHash();
if (initialPassError) queueMicrotask(() => showToast(initialPassError));
if (classInvite) queueMicrotask(() => void openGallery());
if (location.hash === '#class-gallery') queueMicrotask(() => void openGallery());

// The composer is rendered by this module after the browser has resolved an
// incoming #composer anchor. Re-apply that anchor for the sample action so its
// first post-click screen is the working, seeded sequencer rather than the
// landing copy above it.
if (isDemo && location.hash === '#composer') {
  requestAnimationFrame(() => {
    document.getElementById('composer')?.scrollIntoView({ block: 'start' });
    window.scrollBy({ top: -100, behavior: 'auto' });
  });
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').then(registration => {
    const tellAboutUpdate = () => showToast('A Gridsong update is ready. Refresh between songs to use it.');
    if (registration.waiting) tellAboutUpdate();
    registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', () => {
      if (registration.installing?.state === 'installed' && navigator.serviceWorker.controller) tellAboutUpdate();
    }));
  }).catch(() => undefined));
}
