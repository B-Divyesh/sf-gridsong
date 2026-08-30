import { describe, expect, it } from 'vitest';
import { isDemoLocation, sampleSong } from './demo';

describe('demo sandbox', () => {
  it('recognizes both supported demo URLs', () => {
    expect(isDemoLocation('/demo', '')).toBe(true);
    expect(isDemoLocation('/', '?demo=1')).toBe(true);
    expect(isDemoLocation('/', '')).toBe(false);
  });

  it('ships a playable four-bar sample rather than an empty grid', () => {
    const sample = sampleSong();
    expect(sample.bars).toBe(4);
    expect(sample.notes.length).toBeGreaterThan(32);
    expect(sample.notes.some(note => note.voice === 'kick')).toBe(true);
    expect(sample.notes.some(note => note.voice === 'clap')).toBe(true);
  });
});
