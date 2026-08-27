import { describe, expect, it } from 'vitest';
import { blankSong } from './state';
import { midiBytes } from './midi';

describe('MIDI export', () => {
  it('creates a standard MIDI file with a track', () => {
    const bytes = midiBytes({ ...blankSong(), notes: [{ step: 0, row: 0, voice: 'lantern' }] });
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe('MThd');
    expect(new TextDecoder().decode(bytes.slice(14, 18))).toBe('MTrk');
    expect(bytes.length).toBeGreaterThan(40);
  });
});
