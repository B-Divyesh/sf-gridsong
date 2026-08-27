import './style.css';
import { noteName, Player, renderWav, songDuration } from './audio';
import { midiBlob } from './midi';
import { blankSong, entryFromTicket, entryTicket, galleryHash, galleryInviteFromHash, galleryPass, GALLERY_LIFETIME, melodicRows, resizeSong, sanitizeSong, songFromHash, songHash, STEPS_PER_BAR } from './state';
import type { Gallery, GalleryEntry, GalleryInvite, Song, VoiceName } from './types';

const SONG_KEY = 'gridsong.song.v1';
const GALLERY_PREFIX = 'gridsong.gallery.v2.';
const ACTIVE_GALLERY_KEY = 'gridsong.gallery.v2.active';
const player = new Player();
let song = loadInitialSong();
let currentBar = 0;
let selectedVoice: VoiceName = 'lantern';
let activeGallery: Gallery | null = null;
let classInvite: GalleryInvite | null = null;
let playStep = -1;

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <header class="site-header">
    <a class="brand" href="/" aria-label="Gridsong home">
      <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M7 8h26v24H7z"/><path d="M13 15h5v5h-5zm9 0h5v5h-5zm-9 9h5v5h-5z"/></svg>
      <span>Gridsong</span>
    </a>
    <nav aria-label="Primary">
      <a href="#composer">Make music</a>
      <button class="nav-button" id="open-gallery" type="button">Class gallery</button>
    </nav>
  </header>
  <main>
    <section class="intro" aria-labelledby="page-title">
      <div class="intro-copy">
        <p class="eyebrow">A little music stall for big ideas</p>
        <h1 id="page-title">Make a song.<br><em>Keep the song.</em></h1>
        <p>Tap in a tune, hear it right away, then save a link or take home a WAV or MIDI file. No account. No ads. No lost work.</p>
        <a class="button primary" href="#composer">Start composing <span aria-hidden="true">↓</span></a>
      </div>
      <figure class="hero-art">
        <img src="/assets/night-market-grid.webp" width="1200" height="800" alt="A handmade night-market music stall with a grid of glowing lantern notes" fetchpriority="high" decoding="async">
        <figcaption>Every light is a note. Your browser is the instrument.</figcaption>
      </figure>
    </section>

    <section class="composer" id="composer" aria-labelledby="composer-title">
      <div class="section-heading">
        <div><p class="eyebrow">Your composition</p><h2 id="composer-title">Light up the grid</h2></div>
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
        <div><p id="voice-heading" class="field-label">Paint melody with</p><p class="hint">Pick a sound, then light notes below.</p></div>
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
          <h3>Keep it</h3>
          <p>Save a link or a file. All exports happen right here.</p>
        </div>
        <div class="action-buttons">
          <button class="button primary" id="share" type="button">Copy song link</button>
          <button class="button secondary" id="export-wav" type="button">Export WAV</button>
          <button class="button secondary" id="export-midi" type="button">Export MIDI</button>
          <button class="button quiet" id="new-song" type="button">New song</button>
        </div>
      </div>
    </section>

    <section class="classroom" aria-labelledby="classroom-title">
      <div><p class="eyebrow">Made for the lesson loop</p><h2 id="classroom-title">From each desk to one projector</h2><p>Make a class board, then share its student class pass. Students open that pass on any device, make an addressed ticket, and send it back through your classroom channel. Paste tickets into the teacher board to play them.</p><button class="button primary" id="open-gallery-bottom" type="button">Open class gallery</button></div>
      <ol class="class-steps"><li><span>01</span><strong>Teacher shares a class pass</strong><small>It opens on every student device.</small></li><li><span>02</span><strong>Students make tickets</strong><small>Nickname and song only.</small></li><li><span>03</span><strong>Teacher collects</strong><small>Paste, play, and celebrate.</small></li></ol>
    </section>
  </main>

  <footer>
    <div><a class="brand footer-brand" href="/">Gridsong</a><p>Local-first classroom music. No accounts, ads, or tracking.</p></div>
    <nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></nav>
    <p class="credit">Original synths and generated illustration. Built by the Param Factory.</p>
  </footer>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <div class="offline-banner" id="offline-banner" role="status" hidden>You’re offline — composing, local saves, and exports still work.</div>

  <dialog id="gallery-dialog" aria-labelledby="gallery-title">
    <div class="dialog-header"><div><p class="eyebrow">Classroom loop</p><h2 id="gallery-title">Class gallery</h2></div><button class="icon-button" id="close-gallery" type="button" aria-label="Close gallery">×</button></div>
    <div id="gallery-start">
      <p>Create a board on the teacher device. You will get a shareable student class pass, not a browser-only room code.</p>
      <button class="button primary" id="create-gallery" type="button">Create class board</button>
      <p class="privacy-note">There is no shared server or live feed. The teacher board is saved in this browser for 90 days; student tickets are carried directly between devices.</p>
    </div>
    <div id="gallery-board" hidden>
      <div class="code-ticket"><span>Student class pass</span><strong id="gallery-pass-status">Ready to share</strong><button class="button quiet" id="copy-pass" type="button">Copy student pass</button></div>
      <p class="privacy-note">1. Share the pass with students. 2. They open it on their own device and send back a ticket. 3. Paste each ticket below. No submission is uploaded or automatically synced.</p>
      <details class="student-submit"><summary>Add this device’s song to the board</summary><label for="board-nickname">Nickname or label</label><div class="submit-row"><input id="board-nickname" maxlength="24" autocomplete="off"><button class="button primary" id="add-local" type="button">Add to board</button></div></details>
      <details class="teacher-collect" open><summary>Collect a student ticket</summary><label for="ticket-input">Paste a student’s GS2T ticket</label><textarea id="ticket-input" rows="3"></textarea><button class="button secondary" id="add-ticket" type="button">Add submission</button></details>
      <div class="gallery-list-heading"><h3>Submissions</h3><span id="submission-count">0 songs</span></div>
      <div id="gallery-list" class="gallery-list"></div>
    </div>
    <div id="gallery-student" hidden>
      <p class="student-pass-title"><strong>You opened a student class pass.</strong> Compose your song, add a classroom nickname, then copy the addressed ticket to your teacher.</p>
      <ol class="pass-steps"><li>This pass works across devices, but it does not show the teacher’s private board.</li><li>Copy your ticket and send it through your teacher’s approved classroom channel.</li><li>Your teacher pastes the ticket into their board to add it.</li></ol>
      <button class="button primary" id="student-compose" type="button">Start composing</button>
      <details class="student-submit" open><summary>Make my submission ticket</summary><label for="student-nickname">Student nickname</label><div class="submit-row"><input id="student-nickname" maxlength="24" autocomplete="off"><button class="button primary" id="copy-student-ticket" type="button">Copy my ticket</button></div><p class="hint">Your nickname and song travel in the ticket. Use an alias, not your full name.</p></details>
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
    return local ? sanitizeSong(JSON.parse(local)) : blankSong();
  } catch {
    return blankSong();
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
    get<HTMLElement>('save-state').innerHTML = `<span aria-hidden="true">●</span> ${message}`;
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
  if (!song.notes.length) { showToast('Light at least one note before playing.'); focusFirstNote(); return; }
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

function galleryStorageKey(id: string): string { return `${GALLERY_PREFIX}${id}`; }

function saveGallery(): void {
  if (!activeGallery) return;
  try {
    localStorage.setItem(galleryStorageKey(activeGallery.id), JSON.stringify(activeGallery));
    localStorage.setItem(ACTIVE_GALLERY_KEY, activeGallery.id);
  }
  catch { showToast('This gallery could not be saved. Copy song links before closing.'); }
}

function loadGallery(id: string): Gallery | null {
  try {
    const value = localStorage.getItem(galleryStorageKey(id));
    if (!value) return null;
    const gallery = JSON.parse(value) as Gallery;
    if (gallery.id !== id || !Array.isArray(gallery.entries) || typeof gallery.createdAt !== 'number') return null;
    if (Date.now() - gallery.createdAt > GALLERY_LIFETIME) {
      localStorage.removeItem(galleryStorageKey(id));
      if (localStorage.getItem(ACTIVE_GALLERY_KEY) === id) localStorage.removeItem(ACTIVE_GALLERY_KEY);
      return null;
    }
    return gallery;
  } catch { return null; }
}

function loadLastGallery(): Gallery | null {
  try {
    const id = localStorage.getItem(ACTIVE_GALLERY_KEY);
    return id ? loadGallery(id) : null;
  } catch { return null; }
}

function activateGalleryFromHash(): string | null {
  try {
    const invite = galleryInviteFromHash(location.hash);
    if (invite) {
      activeGallery = loadGallery(invite.galleryId);
      classInvite = activeGallery ? null : invite;
    } else {
      classInvite = null;
      activeGallery = loadLastGallery();
    }
    return null;
  } catch (error) {
    classInvite = null;
    activeGallery = loadLastGallery();
    return error instanceof Error ? error.message : 'That class pass could not be opened.';
  }
}

function openGallery(): void {
  if (!galleryDialog.open) galleryDialog.showModal();
  renderGallery();
}

[get('open-gallery'), get('open-gallery-bottom')].forEach(button => button.addEventListener('click', openGallery));
get<HTMLButtonElement>('close-gallery').addEventListener('click', () => galleryDialog.close());
galleryDialog.addEventListener('click', event => { if (event.target === galleryDialog) galleryDialog.close(); });
get<HTMLButtonElement>('student-compose').addEventListener('click', () => {
  galleryDialog.close();
  document.getElementById('composer')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  queueMicrotask(() => titleInput.focus());
});

get<HTMLButtonElement>('create-gallery').addEventListener('click', () => {
  activeGallery = { id: crypto.randomUUID(), createdAt: Date.now(), entries: [] };
  classInvite = null;
  saveGallery();
  renderGallery();
  showToast('Class board created. Copy the student class pass to invite students.');
});

get<HTMLButtonElement>('copy-pass').addEventListener('click', () => {
  if (!activeGallery) return;
  const pass = galleryPass(activeGallery.id, activeGallery.createdAt);
  const url = `${location.origin}${location.pathname}${galleryHash(pass)}`;
  void copyText(url, 'Student class pass copied. It opens on another device.');
});

function makeCurrentEntry(inputId: string): GalleryEntry | null {
  const nickname = get<HTMLInputElement>(inputId).value.trim();
  if (!nickname) { showToast('Add a nickname first.'); get<HTMLInputElement>(inputId).focus(); return null; }
  if (!song.notes.length) { showToast('Add at least one note before submitting.'); return null; }
  return { id: crypto.randomUUID(), nickname: nickname.slice(0, 24), createdAt: Date.now(), song: structuredClone(song) };
}

get<HTMLButtonElement>('add-local').addEventListener('click', () => {
  const entry = makeCurrentEntry('board-nickname');
  if (!entry || !activeGallery) return;
  activeGallery.entries.push(entry);
  saveGallery();
  renderGallery();
  showToast(`${entry.nickname}’s song added.`);
});

get<HTMLButtonElement>('copy-student-ticket').addEventListener('click', () => {
  const entry = makeCurrentEntry('student-nickname');
  if (!entry || !classInvite) return;
  void copyText(entryTicket(entry, classInvite.galleryId), 'Submission ticket copied. Send it to your teacher.');
});

get<HTMLButtonElement>('add-ticket').addEventListener('click', () => {
  if (!activeGallery) return;
  try {
    const ticket = entryFromTicket(get<HTMLTextAreaElement>('ticket-input').value);
    if (ticket.galleryId !== activeGallery.id) { showToast('That ticket belongs to a different class pass. Ask the student to reopen your pass.'); return; }
    if (activeGallery.entries.some(item => item.id === ticket.entry.id)) { showToast('That submission is already in this gallery.'); return; }
    activeGallery.entries.push(ticket.entry);
    get<HTMLTextAreaElement>('ticket-input').value = '';
    saveGallery();
    renderGallery();
    showToast(`${ticket.entry.nickname}’s ticket added.`);
  } catch (error) { showToast(error instanceof Error ? error.message : 'That ticket could not be read.'); }
});

function renderGallery(): void {
  const board = get<HTMLDivElement>('gallery-board');
  const student = get<HTMLDivElement>('gallery-student');
  get<HTMLDivElement>('gallery-start').hidden = Boolean(activeGallery || classInvite);
  board.hidden = !activeGallery;
  student.hidden = !classInvite || Boolean(activeGallery);
  if (!activeGallery) return;
  get<HTMLElement>('submission-count').textContent = `${activeGallery.entries.length} ${activeGallery.entries.length === 1 ? 'song' : 'songs'}`;
  const list = get<HTMLDivElement>('gallery-list');
  list.replaceChildren();
  if (!activeGallery.entries.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-gallery';
    empty.innerHTML = '<span aria-hidden="true">♫</span><strong>The stage is quiet</strong><p>Add this song or paste a student ticket above.</p>';
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
    remove.addEventListener('click', () => {
      if (!activeGallery || !confirm(`Remove ${entry.nickname}’s “${entry.song.title}” from this gallery?`)) return;
      activeGallery.entries = activeGallery.entries.filter(item => item.id !== entry.id); saveGallery(); renderGallery(); showToast('Submission removed.');
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
  if (galleryDialog.open) renderGallery();
  try {
    const linked = songFromHash(location.hash);
    if (linked) { stopPlayback(); song = linked; currentBar = 0; syncControls(); commit('Song opened from its link'); }
  } catch (error) { showToast(error instanceof Error ? error.message : 'This song link could not be opened.'); }
});

syncControls();
renderGrid();
saveLocal();
updateOnlineState();
const initialPassError = activateGalleryFromHash();
if (initialPassError) queueMicrotask(() => showToast(initialPassError));
if (classInvite) queueMicrotask(openGallery);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}
