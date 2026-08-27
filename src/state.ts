import type { GalleryEntry, Song, SongNote } from './types';

export const STEPS_PER_BAR = 16;
export const SCALE_INTERVALS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
} as const;

export function blankSong(): Song {
  return { v: 1, title: 'My night-market song', tempo: 112, bars: 4, octaves: 2, scale: 'major', notes: [] };
}

export function melodicRows(song: Song): number {
  return SCALE_INTERVALS[song.scale].length * song.octaves;
}

export function noteMidi(song: Song, row: number): number {
  const scale = SCALE_INTERVALS[song.scale];
  const fromBottom = melodicRows(song) - 1 - row;
  return 48 + Math.floor(fromBottom / scale.length) * 12 + scale[fromBottom % scale.length];
}

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
  if (Array.isArray(raw.notes)) {
    song.notes = raw.notes.filter((item): item is SongNote => {
      if (!item || typeof item !== 'object') return false;
      const note = item as SongNote;
      return Number.isInteger(note.step) && note.step >= 0 && note.step < song.bars * STEPS_PER_BAR &&
        Number.isInteger(note.row) && note.row >= 0 && note.row < rowLimit &&
        ['lantern', 'reed', 'bell', 'pluck', 'kick', 'clap'].includes(note.voice);
    }).slice(0, 12000);
  }
  return song;
}

export function encode(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  bytes.forEach(byte => binary += String.fromCharCode(byte));
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export function decode<T>(encoded: string): T {
  const padded = encoded.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - encoded.length % 4) % 4);
  const binary = atob(padded);
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0)))) as T;
}

export function songFromHash(hash: string): Song | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const encoded = params.get('song');
  return encoded ? sanitizeSong(decode(encoded)) : null;
}

export function songHash(song: Song): string {
  return `#song=${encode(song)}`;
}

export function entryTicket(entry: GalleryEntry): string {
  return `GS1.${encode(entry)}`;
}

export function entryFromTicket(ticket: string): GalleryEntry {
  if (!ticket.trim().startsWith('GS1.')) throw new Error('That ticket does not begin with GS1.');
  const raw = decode<Partial<GalleryEntry>>(ticket.trim().slice(4));
  if (!raw || typeof raw.nickname !== 'string' || !raw.nickname.trim()) throw new Error('That ticket is missing a nickname.');
  return {
    id: typeof raw.id === 'string' ? raw.id : crypto.randomUUID(),
    nickname: raw.nickname.trim().slice(0, 24),
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
    song: sanitizeSong(raw.song)
  };
}

export function resizeSong(song: Song, bars: number, octaves: number, scale: Song['scale']): Song {
  const next = { ...song, bars, octaves, scale };
  const rows = melodicRows(next);
  return { ...next, notes: song.notes.filter(note => note.step < bars * STEPS_PER_BAR && (note.voice === 'kick' || note.voice === 'clap' || note.row < rows)) };
}
