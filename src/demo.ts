import type { Song } from './types';

export const REAL_SONG_KEY = 'gridsong.song.v1';
export const DEMO_SONG_KEY = 'demo:gridsong.song.v1';
export const REAL_GALLERY_KEY = 'gridsong.gallery.v3.active';
export const DEMO_GALLERY_KEY = 'demo:gridsong.gallery.v3.active';

export function isDemoLocation(pathname: string, search: string): boolean {
  return pathname === '/demo' || new URLSearchParams(search).get('demo') === '1';
}

/** A short, playable call-and-response rather than an empty grid. */
export function sampleSong(): Song {
  return {
    v: 1,
    title: 'Morning call and response',
    tempo: 104,
    bars: 4,
    octaves: 2,
    scale: 'major',
    notes: [
      { row: 9, step: 0, voice: 'lantern' }, { row: 7, step: 2, voice: 'lantern' }, { row: 5, step: 4, voice: 'bell' }, { row: 7, step: 6, voice: 'lantern' },
      { row: 9, step: 8, voice: 'lantern' }, { row: 7, step: 10, voice: 'reed' }, { row: 5, step: 12, voice: 'bell' }, { row: 4, step: 14, voice: 'pluck' },
      { row: 7, step: 16, voice: 'lantern' }, { row: 5, step: 18, voice: 'bell' }, { row: 4, step: 20, voice: 'pluck' }, { row: 5, step: 22, voice: 'bell' },
      { row: 9, step: 24, voice: 'lantern' }, { row: 7, step: 26, voice: 'reed' }, { row: 5, step: 28, voice: 'bell' }, { row: 9, step: 30, voice: 'lantern' },
      { row: 9, step: 32, voice: 'lantern' }, { row: 7, step: 34, voice: 'reed' }, { row: 5, step: 36, voice: 'bell' }, { row: 7, step: 38, voice: 'lantern' },
      { row: 9, step: 40, voice: 'lantern' }, { row: 7, step: 42, voice: 'reed' }, { row: 5, step: 44, voice: 'bell' }, { row: 4, step: 46, voice: 'pluck' },
      { row: 7, step: 48, voice: 'lantern' }, { row: 5, step: 50, voice: 'bell' }, { row: 4, step: 52, voice: 'pluck' }, { row: 5, step: 54, voice: 'bell' },
      { row: 9, step: 56, voice: 'lantern' }, { row: 7, step: 58, voice: 'reed' }, { row: 5, step: 60, voice: 'bell' }, { row: 9, step: 62, voice: 'lantern' },
      { row: 14, step: 0, voice: 'kick' }, { row: 15, step: 4, voice: 'clap' }, { row: 14, step: 8, voice: 'kick' }, { row: 15, step: 12, voice: 'clap' },
      { row: 14, step: 16, voice: 'kick' }, { row: 15, step: 20, voice: 'clap' }, { row: 14, step: 24, voice: 'kick' }, { row: 15, step: 28, voice: 'clap' },
      { row: 14, step: 32, voice: 'kick' }, { row: 15, step: 36, voice: 'clap' }, { row: 14, step: 40, voice: 'kick' }, { row: 15, step: 44, voice: 'clap' },
      { row: 14, step: 48, voice: 'kick' }, { row: 15, step: 52, voice: 'clap' }, { row: 14, step: 56, voice: 'kick' }, { row: 15, step: 60, voice: 'clap' }
    ]
  };
}
