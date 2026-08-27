import { describe, expect, it } from 'vitest';
import { blankSong, decode, encode, entryFromTicket, entryTicket, noteMidi, resizeSong, sanitizeSong, songFromHash, songHash } from './state';

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

  it('round-trips gallery tickets', () => {
    const entry = { id: 'one', nickname: 'Rae', createdAt: 1, song: blankSong() };
    expect(entryFromTicket(entryTicket(entry))).toEqual(entry);
  });

  it('round-trips generic encoded values', () => {
    expect(decode(encode({ hello: 'world' }))).toEqual({ hello: 'world' });
  });
});
