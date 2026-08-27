import type { GalleryInvite, Song, SongNote } from './types';

export const STEPS_PER_BAR = 16;
export const GALLERY_LIFETIME = 90 * 24 * 60 * 60 * 1000;
export const SCALE_INTERVALS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
} as const;

const SCALE_NAMES = Object.keys(SCALE_INTERVALS) as Song['scale'][];
const VOICES: Array<SongNote['voice']> = ['lantern', 'reed', 'bell', 'pluck', 'kick', 'clap'];
const SONG_PREFIX = 'GS2S.';
const INVITE_PREFIX = 'GSP1.';

export function blankSong(): Song {
  return { v: 1, title: 'My night-market song', tempo: 112, bars: 4, octaves: 2, scale: 'major', notes: [] };
}

export function melodicRows(song: Song): number {
  return SCALE_INTERVALS[song.scale].length * song.octaves;
}

export function gridCapacity(song: Pick<Song, 'bars' | 'octaves' | 'scale'>): number {
  return (SCALE_INTERVALS[song.scale].length * song.octaves + 2) * song.bars * STEPS_PER_BAR;
}

export function noteMidi(song: Song, row: number): number {
  const scale = SCALE_INTERVALS[song.scale];
  const fromBottom = melodicRows(song) - 1 - row;
  return 48 + Math.floor(fromBottom / scale.length) * 12 + scale[fromBottom % scale.length];
}

/**
 * Accept exactly the documented grid, including its 51,200-cell maximum.
 * We reject impossible/ambiguous input rather than trimming it on import.
 */
export function sanitizeSong(value: unknown): Song {
  if (!value || typeof value !== 'object') throw new Error('This song link is not valid.');
  const raw = value as Partial<Song>;
  const song = blankSong();
  if (raw.v !== 1) throw new Error('This song was made with an unsupported version.');
  if (typeof raw.title === 'string') song.title = raw.title.slice(0, 60) || song.title;
  if (typeof raw.tempo === 'number') song.tempo = Math.max(50, Math.min(200, Math.round(raw.tempo)));
  if (typeof raw.bars === 'number' && [1, 2, 4, 8, 16, 32, 64].includes(raw.bars)) song.bars = raw.bars;
  if (typeof raw.octaves === 'number') song.octaves = Math.max(1, Math.min(4, Math.round(raw.octaves)));
  if (typeof raw.scale === 'string' && raw.scale in SCALE_INTERVALS) song.scale = raw.scale as Song['scale'];

  const rowLimit = melodicRows(song) + 2;
  const capacity = gridCapacity(song);
  if (Array.isArray(raw.notes)) {
    if (raw.notes.length > capacity) throw new Error('This song has more notes than its supported grid can hold.');
    const occupied = new Set<string>();
    song.notes = [];
    for (const item of raw.notes) {
      if (!item || typeof item !== 'object') continue;
      const note = item as SongNote;
      const isValid = Number.isInteger(note.step) && note.step >= 0 && note.step < song.bars * STEPS_PER_BAR &&
        Number.isInteger(note.row) && note.row >= 0 && note.row < rowLimit && VOICES.includes(note.voice);
      if (!isValid) continue;
      const location = `${note.row}:${note.step}`;
      if (occupied.has(location)) throw new Error('This song has two sounds in one grid square and cannot be opened safely.');
      occupied.add(location);
      song.notes.push({ row: note.row, step: note.step, voice: note.voice });
    }
  }
  return song;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): Uint8Array {
  const padded = encoded.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - encoded.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

export function encode(value: unknown): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

export function decode<T>(encoded: string): T {
  return JSON.parse(new TextDecoder().decode(fromBase64Url(encoded))) as T;
}

function voiceCode(voice: SongNote['voice']): number { return VOICES.indexOf(voice) + 1; }

function packedSong(song: Song): Uint8Array {
  const safe = sanitizeSong(song);
  const title = new TextEncoder().encode(safe.title);
  if (title.length > 0xffff) throw new Error('This song title is too long to share.');
  const cells = gridCapacity(safe);
  const packedCells = new Uint8Array(Math.ceil(cells * 3 / 8));
  for (const note of safe.notes) {
    const cell = note.row * safe.bars * STEPS_PER_BAR + note.step;
    const bit = cell * 3;
    const byte = Math.floor(bit / 8);
    const offset = bit % 8;
    const code = voiceCode(note.voice);
    packedCells[byte] |= code << offset;
    if (offset > 5) packedCells[byte + 1] |= code >> (8 - offset);
  }
  const output = new Uint8Array(7 + title.length + packedCells.length);
  output.set([1, safe.bars, safe.octaves, SCALE_NAMES.indexOf(safe.scale), safe.tempo - 50, title.length >> 8, title.length & 0xff]);
  output.set(title, 7);
  output.set(packedCells, 7 + title.length);
  return output;
}

function unpackSong(payload: Uint8Array): Song {
  if (payload.length < 7 || payload[0] !== 1) throw new Error('This compact song has an unsupported version.');
  const bars = payload[1];
  const octaves = payload[2];
  const scale = SCALE_NAMES[payload[3]];
  const tempo = payload[4] + 50;
  const titleLength = payload[5] * 256 + payload[6];
  if (![1, 2, 4, 8, 16, 32, 64].includes(bars) || octaves < 1 || octaves > 4 || !scale || tempo < 50 || tempo > 200) {
    throw new Error('This compact song has invalid settings.');
  }
  const draft = { v: 1 as const, title: '', tempo, bars, octaves, scale, notes: [] as SongNote[] };
  const expected = 7 + titleLength + Math.ceil(gridCapacity(draft) * 3 / 8);
  if (payload.length !== expected) throw new Error('This compact song is incomplete or has extra data.');
  draft.title = new TextDecoder().decode(payload.slice(7, 7 + titleLength)) || blankSong().title;
  const cellBytes = payload.slice(7 + titleLength);
  const steps = bars * STEPS_PER_BAR;
  for (let cell = 0; cell < gridCapacity(draft); cell++) {
    const bit = cell * 3;
    const byte = Math.floor(bit / 8);
    const offset = bit % 8;
    let code = (cellBytes[byte] >> offset) & 0b111;
    if (offset > 5) code |= (cellBytes[byte + 1] << (8 - offset)) & 0b111;
    if (code === 0) continue;
    const voice = VOICES[code - 1];
    if (!voice) throw new Error('This compact song has an unknown sound.');
    draft.notes.push({ row: Math.floor(cell / steps), step: cell % steps, voice });
  }
  return sanitizeSong(draft);
}

export function encodeSong(song: Song): string {
  return `${SONG_PREFIX}${toBase64Url(packedSong(song))}`;
}

export function decodeSong(value: string): Song {
  if (!value.startsWith(SONG_PREFIX)) throw new Error('This song link uses an unknown compact format.');
  return unpackSong(fromBase64Url(value.slice(SONG_PREFIX.length)));
}

export function songFromHash(hash: string): Song | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const encoded = params.get('song');
  if (!encoded) return null;
  try {
    // Read existing JSON links too; new links are compact GS2S payloads.
    return encoded.startsWith(SONG_PREFIX) ? decodeSong(encoded) : sanitizeSong(decode(encoded));
  } catch {
    throw new Error('That song link got tangled. You can start a fresh song or ask for a new link.');
  }
}

export function songHash(song: Song, existingHash = ''): string {
  const params = new URLSearchParams(existingHash.replace(/^#/, ''));
  params.set('song', encodeSong(song));
  return `#${params.toString()}`;
}

function isGalleryId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9-]{16,80}$/i.test(value);
}

export function galleryPass(galleryId: string, submitKey: string, expiresAt: number): string {
  if (!isGalleryId(galleryId)) throw new Error('This gallery identifier is not valid.');
  if (typeof submitKey !== 'string' || !/^[a-z0-9_-]{32,128}$/i.test(submitKey) || !Number.isFinite(expiresAt)) throw new Error('This class pass is not valid.');
  return `${INVITE_PREFIX}${encode({ v: 1, galleryId, submitKey, expiresAt } satisfies GalleryInvite)}`;
}

export function galleryInviteFromPass(value: string): GalleryInvite {
  if (!value.startsWith(INVITE_PREFIX)) throw new Error('That class pass is not valid.');
  const invite = decode<Partial<GalleryInvite>>(value.slice(INVITE_PREFIX.length));
  if (invite.v !== 1 || !isGalleryId(invite.galleryId) || typeof invite.submitKey !== 'string' || !/^[a-z0-9_-]{32,128}$/i.test(invite.submitKey) || typeof invite.expiresAt !== 'number') throw new Error('That class pass is not valid.');
  if (Date.now() > invite.expiresAt) throw new Error('That class pass has expired. Ask the teacher for a new one.');
  return { v: 1, galleryId: invite.galleryId, submitKey: invite.submitKey, expiresAt: invite.expiresAt };
}

export function galleryInviteFromHash(hash: string): GalleryInvite | null {
  const pass = new URLSearchParams(hash.replace(/^#/, '')).get('gallery');
  return pass ? galleryInviteFromPass(pass) : null;
}

export function galleryHash(pass: string, existingHash = ''): string {
  const params = new URLSearchParams(existingHash.replace(/^#/, ''));
  params.set('gallery', pass);
  return `#${params.toString()}`;
}

export function resizeSong(song: Song, bars: number, octaves: number, scale: Song['scale']): Song {
  const next = { ...song, bars, octaves, scale };
  const rows = melodicRows(next);
  return { ...next, notes: song.notes.filter(note => note.step < bars * STEPS_PER_BAR && (note.voice === 'kick' || note.voice === 'clap' || note.row < rows)) };
}
