import { describe, expect, it } from 'vitest';
import { blankSong, decode, encode, galleryHash, galleryInviteFromHash, galleryPass, gridCapacity, noteMidi, resizeSong, sanitizeSong, songFromHash, songHash } from './state';

describe('song state', () => {
  it('round-trips unicode state through a URL hash', () => {
    const song = { ...blankSong(), title: 'Maya’s tune 🎵', notes: [{ step: 3, row: 2, voice: 'bell' as const }] };
    expect(songFromHash(songHash(song))).toEqual(song);
  });

  it('does not preserve an in-page composer anchor in a copied song link', () => {
    expect(songHash(blankSong(), '#composer')).toMatch(/^#song=GS2S\./);
  });

  it('clamps untrusted values and rejects invalid versions', () => {
    expect(sanitizeSong({ ...blankSong(), tempo: 900 }).tempo).toBe(200);
    expect(() => sanitizeSong({ v: 99 })).toThrow(/unsupported/);
  });

  it('removes notes outside resized bounds', () => {
    const song = { ...blankSong(), bars: 4, notes: [{ step: 60, row: 0, voice: 'pluck' as const }] };
    expect(resizeSong(song, 1, 1, 'major').notes).toHaveLength(0);
  });

  it('maps higher visual rows to higher pitch', () => {
    const song = blankSong();
    expect(noteMidi(song, 0)).toBeGreaterThan(noteMidi(song, 1));
  });

  it('opens the same class pass from a self-contained URL hash', () => {
    const galleryId = '12345678-1234-4234-9234-123456789abc';
    const submitKey = 'abcdeFGHIJ0123456789_-abcdeFGHIJ0123456789';
    const pass = galleryPass(galleryId, submitKey, Date.now() + 60_000);
    expect(galleryInviteFromHash(galleryHash(pass))).toMatchObject({ galleryId, submitKey });
  });

  it('gives a child-friendly recovery message for malformed legacy links', () => {
    expect(() => songFromHash('#song=not-valid-base64')).toThrow(/got tangled/i);
  });

  it('round-trips every valid note in the 64-bar four-octave grid', () => {
    const song = { ...blankSong(), bars: 64, octaves: 4, scale: 'chromatic' as const, notes: [] as ReturnType<typeof blankSong>['notes'] };
    for (let row = 0; row < 50; row++) {
      for (let step = 0; step < 1024; step++) song.notes.push({ row, step, voice: row === 48 ? 'kick' : row === 49 ? 'clap' : 'lantern' });
    }
    expect(song.notes).toHaveLength(gridCapacity(song));
    const hash = songHash(song);
    expect(hash.length).toBeLessThan(30_000);
    expect(songFromHash(hash)).toEqual(song);
  });

  it('round-trips generic encoded values', () => {
    expect(decode(encode({ hello: 'world' }))).toEqual({ hello: 'world' });
  });
});
