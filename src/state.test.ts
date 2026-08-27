import { describe, expect, it } from 'vitest';
import { blankSong, decode, encode, entryFromTicket, entryTicket, galleryHash, galleryInviteFromHash, galleryPass, gridCapacity, noteMidi, resizeSong, sanitizeSong, songFromHash, songHash } from './state';

describe('song state', () => {
  it('round-trips unicode state through a URL hash', () => {
    const song = { ...blankSong(), title: 'Maya’s tune 🎵', notes: [{ step: 3, row: 2, voice: 'bell' as const }] };
    expect(songFromHash(songHash(song))).toEqual(song);
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

  it('round-trips gallery tickets addressed to a portable class pass', () => {
    const entry = { id: '12345678-1234-4234-9234-123456789abd', nickname: 'Rae', createdAt: 1, song: blankSong() };
    const galleryId = '12345678-1234-4234-9234-123456789abc';
    expect(entryFromTicket(entryTicket(entry, galleryId))).toEqual({ galleryId, entry });
  });

  it('opens the same class pass from a self-contained URL hash', () => {
    const galleryId = '12345678-1234-4234-9234-123456789abc';
    const pass = galleryPass(galleryId, Date.now());
    expect(galleryInviteFromHash(galleryHash(pass))).toMatchObject({ galleryId });
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
